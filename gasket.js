/**
 * Created by Wesley on 24/10/2015.
 */

var canvas;
var gl;

var edgesPointsArray;
var trianglesPointsArray;

var numTimesToSubdivide;

var fillMidTriangles;
//var generatedColors;

window.onload = function init()
{
    updateTextFieldValue();
    render();
};

function updateTextFieldValue()
{
    document.getElementById("subDivisionsValue").value = document.getElementById("subDivisionsRange").value;
}


function render()
{
    numTimesToSubdivide = Number(document.getElementById("subDivisionsRange").value)
    edgesPointsArray = [];
    //generatedColors = [];
    trianglesPointsArray = [];
    fillMidTriangles = document.getElementById("fillMidTriangles").checked;
    var twistAngle = radians(Number(document.getElementById("rotationAngle").value)); twistTriangles
    var twist = 0;
    if(document.getElementById("twistTriangles").checked) twist = 1;


    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

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
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var uniformVertexColorLocation  = gl.getUniformLocation(program, "uniformVertexColor");

    var uniformProjectionMatrixLocation = gl.getUniformLocation(program,"projection");
    var projectionMatrix = ortho(-2,2,-2,2,-1,1);
    gl.uniformMatrix4fv( uniformProjectionMatrixLocation, false, flatten(projectionMatrix));

    var uniformTwistAngleLocation = gl.getUniformLocation(program,"twistAngle");
    gl.uniform1f( uniformTwistAngleLocation, twistAngle);

    var twistLocation = gl.getUniformLocation(program,"twist");
    gl.uniform1i( twistLocation, twist);

    gl.clear( gl.COLOR_BUFFER_BIT );
    /******** Triangulos preenchidos ******/
    // Load the data into the GPU
    var trianglePointsBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, trianglePointsBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(trianglesPointsArray), gl.STATIC_DRAW );
    gl.uniform4fv(uniformVertexColorLocation, flatten([0.0,0.0,1.0,1.0]));


    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    /*var verticesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation( program, "attributeVertexColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );*/

    renderTriangle();
    /********************************************/

    /******** Linhas ******/
    // Load the data into the GPU

    var linesPointsBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, linesPointsBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(edgesPointsArray), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    gl.uniform4fv(uniformVertexColorLocation, flatten([1.0,1.0,1.0,1.0]));

    renderLines();
    /********************************************/
};

function triangleEdges( a, b, c )
{
    edgesPointsArray.push( a, b, b, c, a, c);
}

function triangle( a, b, c )
{
    trianglesPointsArray.push( a, b, c);
    /*generatedColors.push(1.0,  0.0,  0.0,  1.0);
    generatedColors.push(0.0,  1.0,  0.0,  1.0);
    generatedColors.push(0.0,  0.0,  1.0,  1.0);*/
}

function divideTriangle( a, b, c, count )
{
console.log(count);
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

function renderLines()
{
    gl.drawArrays( gl.LINES, 0, edgesPointsArray.length );
}

function renderTriangle()
{
    gl.drawArrays( gl.TRIANGLES, 0, trianglesPointsArray.length);
}

