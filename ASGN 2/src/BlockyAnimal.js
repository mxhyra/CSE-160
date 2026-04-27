// BlockyAnimal.js

// Vertex shader program
var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;

void main() {
  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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

// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_globalAngle = 0;
let g_legAngle = 0;
let g_kneeAngle = 0;
let g_tailAngle = 0;
let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;
let g_animation = false;
let g_mouseXAngle = 0;
let g_mouseYAngle = 0;
let g_lastX = 0;
let g_lastY = 0;
let g_dragging = false;
let g_pokeAnimation = false;
let g_pokeStartTime = 0;

// setup canvas 

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}

function setupWebGL() {
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // needed for 3D
  gl.enable(gl.DEPTH_TEST);
}

// connect GLSL var
function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  if (a_Position < 0) {
    console.log('Failed to get a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

  if (!u_FragColor) {
    console.log('Failed to get u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get u_ModelMatrix');
    return;
  }
}

// main function
function main() {
  setupWebGL();

  connectVariablesToGLSL();

  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  document.getElementById('angleSlide').addEventListener('input', function() {
    g_globalAngle = Number(this.value);
    renderScene();
  });

  document.getElementById('legSlide').addEventListener('input', function() {
    g_legAngle = Number(this.value);
    renderScene();
  });

  document.getElementById('kneeSlide').addEventListener('input', function() {
    g_kneeAngle = Number(this.value);
    renderScene();
  });

  document.getElementById('tailSlide').addEventListener('input', function() {
    g_tailAngle = Number(this.value);
    renderScene();
  });

  document.getElementById('animationOnButton').onclick = function() {
    g_animation = true;
  };

  document.getElementById('animationOffButton').onclick = function() {
    g_animation = false;
  };

  canvas.onmousedown = function(ev) {
    g_dragging = true;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
  };

  canvas.onmouseup = function() {
    g_dragging = false;
  };

  canvas.onmouseleave = function() {
    g_dragging = false;
  };

  canvas.onmousemove = function(ev) {
    if (g_dragging) {
      let dx = ev.clientX - g_lastX;
      let dy = ev.clientY - g_lastY;

      g_mouseYAngle += dx * 0.3;
      g_mouseXAngle += dy * 0.3;

      g_lastX = ev.clientX;
      g_lastY = ev.clientY;

      renderScene();
    }
  };

  canvas.onclick = function(ev) {
    if (ev.shiftKey) {
      g_pokeAnimation = true;
      g_pokeStartTime = g_seconds;
    }
  };

  requestAnimationFrame(tick);
}
function tick() {
  var startTime = performance.now();

  g_seconds = performance.now() / 1000.0 - g_startTime;

  updateAnimationAngles();
  renderScene();

  var duration = performance.now() - startTime;
  if (Math.floor(g_seconds * 2) % 2 == 0) {
    sendTextToHTML("ms: " + duration.toFixed(2), "performance");
  }
  
  
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_animation) {
    g_legAngle = 15* Math.sin(g_seconds);
    g_kneeAngle = -15 * Math.abs(g_seconds);
  }
  if (g_pokeAnimation) {
    let pokeTime = g_seconds - g_pokeStartTime;

    g_legAngle = -45 * Math.sin(pokeTime * 6);
    g_kneeAngle = -25 * Math.abs(Math.sin(pokeTime * 6));

    if (pokeTime > 1.0) {
      g_pokeAnimation = false;
    }
  }
}
function drawHorseLeg(x, y, z, legAngle, kneeAngle) {
  // thigh
  var thigh = new Cube();
  thigh.color = [0.3, 0.15, 0.05, 1.0];
  thigh.matrix.translate(x, y, z);
  thigh.matrix.rotate(legAngle, 0, 0, 1);

  var thighCoordinatesMat = new Matrix4(thigh.matrix);

  thigh.matrix.scale(0.13, -0.23, 0.13);
  thigh.render();

  // lower leg part
  var lowerLeg = new Cube();
  lowerLeg.color = [0.25, 0.12, 0.04, 1.0];
  lowerLeg.matrix = new Matrix4(thighCoordinatesMat);
  lowerLeg.matrix.translate(0.0, -0.23, 0.0);
  lowerLeg.matrix.rotate(kneeAngle, 0, 0, 1);

  var lowerLegCoordinatesMat = new Matrix4(lowerLeg.matrix);

  lowerLeg.matrix.scale(0.11, -0.18, 0.11);
  lowerLeg.render();

  // the hoof
  var hoof = new Cube();
  hoof.color = [0.1, 0.05, 0.02, 1.0];
  hoof.matrix = new Matrix4(lowerLegCoordinatesMat);
  hoof.matrix.translate(0.0, -0.18, 0.0);
  hoof.matrix.rotate(-kneeAngle * 0.10, 0, 0, 1);
  hoof.matrix.scale(0.16, -0.05, 0.12);
  hoof.render();
} 

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

 var globalRotMat = new Matrix4();

  // slider rotation 
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);

  // mouse rotation 
  globalRotMat.rotate(g_mouseYAngle * 0.3, 0, 1, 0);
  globalRotMat.rotate(g_mouseXAngle * 0.3, 1, 0, 0);

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  // the body 
  var body = new Cube();
  body.color = [0.6, 0.3, 0.1, 1.0];
  body.matrix.translate(-0.6, -0.3, 0.0);
  body.matrix.scale(1.2, 0.5, 0.4);
  body.render();

  // the neck
  var neck = new Cube();
  neck.color = [0.6, 0.3, 0.1, 1.0];
  neck.matrix.translate(0.3, 0.0, 0.0);
  neck.matrix.rotate(-30, 0, 0, 1);
  neck.matrix.scale(0.3, 0.6, 0.3);
  neck.render();

  // head
  var head = new Cube();
  head.color = [0.6, 0.3, 0.1, 1.0];
  head.matrix.translate(0.5, 0.4, 0.0);
  head.matrix.scale(0.4, 0.3, 0.3);
  head.render();

  // walking phases
  var phaseA = Math.sin(g_seconds);
  var phaseB = Math.sin(g_seconds + Math.PI);

  // diagonal pattern
  var legA = g_animation ? 15 * phaseA : g_legAngle;
  var legB = g_animation ? 15 * phaseB : -g_legAngle;

  var kneeA = g_animation ? -15 * Math.abs(phaseA) : g_kneeAngle;
  var kneeB = g_animation ? -15 * Math.abs(phaseB) : g_kneeAngle;

  // front L
  drawHorseLeg(0.35, -0.30, 0.05, legA, kneeA);

  // back R
  drawHorseLeg(-0.45, -0.30, 0.27, legA, kneeA);

  // front R
  drawHorseLeg(0.35, -0.30, 0.27, legB, kneeB);

  // back L
  drawHorseLeg(-0.45, -0.30, 0.05, legB, kneeB);

  // tail fisrt part
  var tail1 = new Cube();
  tail1.color = [0.25, 0.12, 0.04, 1.0];
  tail1.matrix.translate(-0.58, -0.08, 0.12);
  
  if (g_animation) {
    tail1.matrix.rotate(160 + 10 * Math.sin(g_seconds * 0.5), 0, 0, 1);
  } else {
    tail1.matrix.rotate(160 + g_tailAngle, 0, 0, 1);
  }

  var tailJointMat = new Matrix4(tail1.matrix);

  tail1.matrix.scale(0.28, 0.07, 0.07);
  tail1.render();

  // tail second part
  var tail2 = new Cube();
  tail2.color = [0.2, 0.1, 0.03, 1.0];
  tail2.matrix = new Matrix4(tailJointMat);
  tail2.matrix.translate(0.28, 0, 0);
  if (g_animation) {
    tail2.matrix.rotate(100 + 15 * Math.sin(g_seconds * 1), 0, 0, 1);
  } else {
    tail2.matrix.rotate(100, 0, 0, 1);
 }
  tail2.matrix.scale(0.55, 0.06, 0.06);
  tail2.render();

  // left ear 

  var ear1 = new Cone();
  ear1.color = [0.45, 0.22, 0.08, 1.0];
  ear1.matrix.translate(0.62, 0.68, 0.08);
  ear1.matrix.rotate(-8, 0, 0, 1);
  ear1.matrix.scale(0.055, 0.30, 0.055);
  ear1.render();

  // right ear
  var ear2 = new Cone();
  ear2.color = [0.45, 0.22, 0.08, 1.0];
  ear2.matrix.translate(0.62, 0.68, 0.24);
  ear2.matrix.rotate(8, 0, 0, 1);
  ear2.matrix.scale(0.055, 0.30, 0.055);
  ear2.render();

  // left eye
  var eye1 = new Cube();
  eye1.color = [0.0, 0.0, 0.0, 1.0];
  eye1.matrix.translate(0.58, 0.55, -0.02);
  eye1.matrix.scale(0.04, 0.04, 0.04);
  eye1.render();

  // right eye
  var eye2 = new Cube();
  eye2.color = [0.0, 0.0, 0.0, 1.0];
  eye2.matrix.translate(0.72, 0.55, -0.02);
  eye2.matrix.scale(0.04, 0.04, 0.04);
  eye2.render();

  // mouth
  var nose = new Cube();
  nose.color = [0.05, 0.02, 0.01, 1.0];
  nose.matrix.translate(0.62, 0.43, -0.025);
  nose.matrix.scale(0.10, 0.035, 0.035);
  nose.render();
}