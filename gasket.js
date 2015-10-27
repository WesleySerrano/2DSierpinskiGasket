/**
 * Created by Wesley on 24/10/2015.
 */

var canvas;
var gl;

var edgesPointsArray;
var trianglesPointsArray;

var numTimesToSubdivide;

var fillMidTriangles;
var rotationAngle = 0.0;
var time = 0.0;

var shouldRotate;
var uniformTransformationMatrixLocation;
var uniformVertexColorLocation;
var uniformTimeLocation;
var program;

window.onload = function init()
{
    updateTextFieldsValues();
    render();
};

function updateTextFieldsValues()
{
    document.getElementById("subDivisionsValue").value = document.getElementById("subDivisionsRange").value;

    document.getElementById("triangleRValue").innerHTML = document.getElementById("triangleR").value;
    document.getElementById("triangleGValue").innerHTML = document.getElementById("triangleG").value;
    document.getElementById("triangleBValue").innerHTML = document.getElementById("triangleB").value;

    document.getElementById("lineRValue").innerHTML = document.getElementById("lineR").value;
    document.getElementById("lineGValue").innerHTML = document.getElementById("lineG").value;
    document.getElementById("lineBValue").innerHTML = document.getElementById("lineB").value;

    document.getElementById("bgRValue").innerHTML = document.getElementById("bgR").value;
    document.getElementById("bgGValue").innerHTML = document.getElementById("bgG").value;
    document.getElementById("bgBValue").innerHTML = document.getElementById("bgB").value;
}

function render()
{
    numTimesToSubdivide = Number(document.getElementById("subDivisionsRange").value);
    edgesPointsArray = [];
    //generatedColors = [];
    trianglesPointsArray = [];
    fillMidTriangles = document.getElementById("fillMidTriangles").checked;
    shouldRotate = document.getElementById("rotate").checked;
    var twist = 0;
    if(document.getElementById("twistTriangles").checked) twist = 1;

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    var vertices = [
        vec2( -1, -1 ),
        vec2(  0,  1 ),
        vec2(  1, -1 )
    ];

    divideTriangle( vertices[0], vertices[1], vertices[2],
        numTimesToSubdivide);

    //
    //  Configure WebGL
    //
    var bgR = document.getElementById("bgR").value/255.0;
    var bgG = document.getElementById("bgG").value/255.0;
    var bgB = document.getElementById("bgB").value/255.0;

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( bgR, bgG, bgB, 1.0 );

    //  Load shaders and initialize attribute buffers

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    uniformVertexColorLocation  = gl.getUniformLocation(program, "uniformVertexColor");
    uniformTimeLocation = gl.getUniformLocation(program, "time");
    var uniformProjectionMatrixLocation = gl.getUniformLocation(program,"projection");
    var uniformModelViewMatrixLocation = gl.getUniformLocation(program,"modelView");
    uniformTransformationMatrixLocation = gl.getUniformLocation(program,"transformation");

    var aspectRatio = canvas.width/canvas.height;
    var projectionMatrix = perspective(60.0,aspectRatio,1.0,100.0);
    gl.uniformMatrix4fv( uniformProjectionMatrixLocation, false, flatten(projectionMatrix));

    var eye = vec3(0.0,0.0,2.0);
    var at = vec3(0.0,0.0,-1.0);
    var up = vec3(0.0,1.0,0.0);

    var modelViewMatrix = lookAt(eye,at,up);
    gl.uniformMatrix4fv( uniformModelViewMatrixLocation, false, flatten(modelViewMatrix));

    var twistLocation = gl.getUniformLocation(program,"twist");
    gl.uniform1i( twistLocation, twist);

    draw();
}

function triangleEdges( a, b, c )
{
    edgesPointsArray.push( a, b, b, c, a, c);
}

function triangle( a, b, c )
{
    trianglesPointsArray.push( a, b, c);
}

function divideTriangle( a, b, c, count )
{
    // check for end of recursion

    if ( count === 0 )
    {
        triangleEdges( a, b, c );
        triangle( a, b, c );
    }
    else
    {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
        if(fillMidTriangles)divideTriangle( ab, ac, bc, count );
    }
}

function draw()
{
    var triangleR = Number(document.getElementById("triangleR").value)/255.0;
    var triangleG = Number(document.getElementById("triangleG").value)/255.0;
    var triangleB = Number(document.getElementById("triangleB").value)/255.0;

    var lineR = Number(document.getElementById("lineR").value)/255.0;
    var lineG = Number(document.getElementById("lineG").value)/255.0;
    var lineB = Number(document.getElementById("lineB").value)/255.0;

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var rotateX = rotate(-45,[1.0,0.0,0.0]);
    var rotateZ = rotate(rotationAngle,[0.0,0.0,1.0]);
    var rotationMatrix = mult(rotateX,rotateZ);
    gl.uniformMatrix4fv( uniformTransformationMatrixLocation, false, flatten(rotationMatrix));

    gl.uniform1f( uniformTimeLocation, time);
    time += 0.05;
    if(time >= 2*Math.PI) time = 0.0;
    if(shouldRotate) rotationAngle += 0.1;

    /******** Triangulos preenchidos ******/
    // Load the data into the GPU
    var trianglePointsBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, trianglePointsBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(trianglesPointsArray), gl.STATIC_DRAW );
    gl.uniform4fv(uniformVertexColorLocation, flatten([triangleR,triangleG,triangleB,1.0]));

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    renderTriangle();
    /********************************************/

    /******** Linhas ******/
    // Load the data into the GPU

    var linesPointsBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, linesPointsBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(edgesPointsArray), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    //vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    gl.uniform4fv(uniformVertexColorLocation, flatten([lineR,lineG,lineB,1.0]));

    renderLines();
    /********************************************/

    window.requestAnimationFrame(draw);
}

function renderLines()
{
    gl.drawArrays( gl.LINES, 0, edgesPointsArray.length );
}

function renderTriangle()
{
    gl.drawArrays( gl.TRIANGLES, 0, trianglesPointsArray.length);
}

