// ColoredPoints.js

// Vertex shader program
var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform float u_Size;
void main() {
  gl_Position = a_Position;
  gl_PointSize = u_Size;
}
`;

// Fragment shader program
var FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main() {
  gl_FragColor = u_FragColor;
}
`;
//constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;


// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;
const eagleTriangles = [
  // center body
  [-1,3, 0,1, 1,3],
  [-2,0, 0,1, 2,0],
  [-2,0, 0,-3, 0,1],
  [2,0, 0,-3, 0,1],

  // upper body fill
  [-1,3, -2,2, 0,1],
  [1,3, 2,2, 0,1],
  [-2,2, -2,0, 0,1],
  [2,2, 2,0, 0,1],
  [-2,1, -1,0, 0,1],
  [2,1, 1,0, 0,1],

  // middle body fill
  [-2,0, -1,-1, 0,0],
  [2,0, 1,-1, 0,0],
  [-2,0, 0,0, 0,1],
  [2,0, 0,0, 0,1],
  [-1,0, 0,-1, 0,1],
  [1,0, 0,-1, 0,1],

  // lower body fill
  [-1,-1, 0,-3, 0,-1],
  [1,-1, 0,-3, 0,-1],
  [-2,-1, -1,-2, 0,-1],
  [2,-1, 1,-2, 0,-1],
  [-1,-2, 0,-3, 0,-1],
  [1,-2, 0,-3, 0,-1],

  // tail
  [-1,-3, 0,-7, 1,-3],
  [-2,-5, 0,-3, -1,-3],
  [2,-5, 0,-3, 1,-3],

  // left neck + head
  [-1,3, -3,5, -2,2],
  [-3,5, -5,6, -4,4],
  [-5,6, -6,5, -4,5],

  // right neck + head
  [1,3, 3,5, 2,2],
  [3,5, 5,6, 4,4],
  [5,6, 6,5, 4,5],

  // left wing main
  [-2,2, -5,3, -4,1],
  [-4,1, -7,2, -6,0],
  [-4,1, -7,-1, -5,-1],
  [-3,0, -6,-3, -4,-2],
  [-2,-1, -5,-5, -3,-4],

  // right wing main
  [2,2, 5,3, 4,1],
  [4,1, 7,2, 6,0],
  [4,1, 7,-1, 5,-1],
  [3,0, 6,-3, 4,-2],
  [2,-1, 5,-5, 3,-4],

  // inner wing connectors
  [-2,2, -3,1, -2,0],
  [2,2, 3,1, 2,0],
  [-2,1, -3,0, -2,-1],
  [2,1, 3,0, 2,-1],
  [-1,1, -2,0, 0,0],
  [1,1, 2,0, 0,0],
  [-2,0, -3,-1, -2,-1],
  [2,0, 3,-1, 2,-1],

  // extra upper feathers
  [-4,2, -6,3, -5,1],
  [4,2, 6,3, 5,1],

  // extra middle feathers
  [-4,0, -6,1, -5,-1],
  [4,0, 6,1, 5,-1],

  // lower inner feathers
  [-3,-1, -4,-2, -2,-2],
  [3,-1, 4,-2, 2,-2],
  [-3,-2, -5,-3, -4,-1],
  [3,-2, 5,-3, 4,-1],

  // claws / lower side
  [-3,-4, -5,-6, -4,-4],
  [3,-4, 5,-6, 4,-4]

// LEFT side (your blue area)
  [-2,2, -3,1, -1,1],
  [-1,1, -3,0, -2,0],

// RIGHT side (mirror)
  [2,2, 3,1, 1,1],
  [1,1, 3,0, 2,0],
];



// Set up canvas and gl 
function setupWebGL() {
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

// Set up GLSL shader
function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUI() {

  // Button Events
  document.getElementById('green').onclick = function() {
    g_selectedColor = [0.0, 1.0, 0.0, 1.0];
  };

  document.getElementById('red').onclick = function() {
    g_selectedColor = [1.0, 0.0, 0.0, 1.0];
  };
  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    renderAllShapes();

  document.getElementById('eagleImage').style.display = "none";
  };

  document.getElementById('pointButton').onclick = function() {
    g_selectedType = POINT;
  };

  document.getElementById('triButton').onclick = function() {
    g_selectedType = TRIANGLE;
  };
  document.getElementById('circleButton').onclick = function() {
    g_selectedType = CIRCLE;

  };
  
  document.getElementById('drawEagleButton').onclick = function() {
  drawEagle();

  document.getElementById('eagleImage').style.display = "block";
  };
};

  // Slider Events
  document.getElementById('redSlide').addEventListener('mouseup', function() {
    g_selectedColor[0] = this.value / 100;
  });

  document.getElementById('greenSlide').addEventListener('mouseup', function() {
    g_selectedColor[1] = this.value / 100;
  });

  document.getElementById('blueSlide').addEventListener('mouseup', function() {
    g_selectedColor[2] = this.value / 100;
  });
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {
  g_selectedSize = this.value;
  });
  document.getElementById('segmentSlide').addEventListener('mouseup', function() {
  g_selectedSegments = this.value;
});



function main() {
  // Set up canvas and gl 
  setupWebGL();

  // Set up GLSL shader programs and connect variables
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  // Register function, called when clicked
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
  if (ev.buttons == 1) {
    click(ev);
  }
};

  //  the color for  <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}




var g_shapesList = [];

function click(ev) {
  // Extract the event click and return it in WebGL coordinates
  let [x, y] = convertCoordinatesEventToGL(ev);

  // Create and store the new point
  let point;

  if (g_selectedType == POINT) {
    point = new Point();
  } else if  (g_selectedType == TRIANGLE)  {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_selectedSegments;
  }


  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // Draw every shape 
  renderAllShapes();

}

// use click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a click
  var y = ev.clientY; // y coordinate of a click
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

// Draw every shape 
function renderAllShapes() {
  var startTime = performance.now();
    // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");

}
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}