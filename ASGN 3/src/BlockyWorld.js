// Vertex Shader
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;

  varying vec2 v_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

// Fragment Shader
var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;

  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;

  void main() {

    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;

    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);

    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);

    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);

    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }
`;

let canvas;
let gl;

let a_Position;
let a_UV;
let u_Sampler0;
let u_Sampler1;
let u_FragColor;
let u_whichTexture;

let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;

let g_camera;
let g_floor = null;
let g_sky = null;
// horse location in world
let g_horseX = -14;
let g_horseY = -0.45;
let g_horseZ = -14;
// checks if player found horse
let g_foundHorse = false;
// animation timer
let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;

// setup webgl 
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  
  gl.enable(gl.DEPTH_TEST);
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
}
// connect js variables to shaders
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

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get a_UV');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get u_Sampler0');
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');

  if (!u_Sampler1) {
    console.log('Failed to get u_Sampler1');
    return;
}

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get u_FragColor');
    return;
}

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get u_whichTexture');
    return;
}
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get u_ModelMatrix');
    return;
}

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get u_GlobalRotateMatrix');
    return;
}

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get u_ViewMatrix');
    return;
}

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get u_ProjectionMatrix');
    return;
}
}

// draws all cube triangles together for better performance
function drawTriangles3DUV(vertices, uv) {
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create vertex buffer");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  let uvBuffer = gl.createBuffer();
  if (!uvBuffer) {
    console.log("Failed to create uv buffer");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
}
// load textures
function initTextures() {
  let image0 = new Image();
  image0.onload = function() {
    sendImageToTEXTURE0(image0);
  };
  image0.src = 'sky.jpg';

  let image1 = new Image();
  image1.onload = function() {
    sendImageToTEXTURE1(image1);
  };
  image1.src = 'wall.jpg';

  return true;
}

// sends grass texture to gpu
function sendImageToTEXTURE0(image) {
  let texture = gl.createTexture();

  if (!texture) {
    console.log('Failed to create texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.uniform1i(u_Sampler0, 0);
  renderAllShapes();
  
}


// sends wall texture to gpu
function sendImageToTEXTURE1(image) {

  let texture = gl.createTexture();

  if (!texture) {
    console.log('Failed to create texture1 object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE1);

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.uniform1i(u_Sampler1, 1);
  renderAllShapes();
}

let g_lastFrameTime = performance.now();


// animation loop
function tick() {
  let now = performance.now();

  let delta = now - g_lastFrameTime;
  g_lastFrameTime = now;

  let fps = 1000 / delta;

  renderAllShapes();

  document.getElementById("fps").innerHTML =
    "FPS: " + fps.toFixed(1);

  requestAnimationFrame(tick);
}
// setup game
function main() {
  setupWebGL();
  connectVariablesToGLSL();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  g_camera = new Camera();
  g_floor = new Cube();
  g_floor.textureNum = 0;
  g_floor.matrix.translate(-16, -1, -16);
  g_floor.matrix.scale(32, 0.05, 32);

  g_sky = new Cube();
  g_sky.color = [0.4, 0.6, 0.9, 1.0];
  g_sky.textureNum = -2;
  g_sky.matrix.translate(-50, -50, -50);
  g_sky.matrix.scale(100, 100, 100);

  document.onkeydown = keydown;

  canvas.onmousedown = function(ev) {
    g_isDragging = true;
    g_lastMouseX = ev.clientX;
  };

  canvas.onmouseup = function(ev) {
    g_isDragging = false;
  };

  canvas.onmouseleave = function(ev) {
    g_isDragging = false;
  };

  canvas.onmousemove = function(ev) {
    if (g_isDragging) {

      let deltaX = ev.clientX - g_lastMouseX;

      g_camera.panMouse(deltaX);

      g_lastMouseX = ev.clientX;

      renderAllShapes();
    }
  };

  initTextures();
  requestAnimationFrame(tick);
}

let g_isDragging = false;
let g_lastMouseX = 0;


// gets map block in front of player
function getBlockInFront() {
  let forward = new Vector3();
  forward.set(g_camera.at);
  forward.sub(g_camera.eye);
  forward.normalize();

  let targetX = g_camera.eye.elements[0] + forward.elements[0] * 2;
  let targetZ = g_camera.eye.elements[2] + forward.elements[2] * 2;

  let mapX = Math.floor(targetX + 16);
  let mapZ = Math.floor(targetZ + 16);

  if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) {
    return null;
  }

  return [mapX, mapZ];
}

function addBlock() {
  let block = getBlockInFront();

  if (block == null) {
    return;
  }

  let x = block[0];
  let z = block[1];

  if (g_map[x][z] < 4) {
    g_map[x][z]++;
  }
}

function deleteBlock() {
  let block = getBlockInFront();

  if (block == null) {
    return;
  }

  let x = block[0];
  let z = block[1];

  if (g_map[x][z] > 0) {
    g_map[x][z]--;
  }
}

// keyboard movement controls
function keydown(ev) {
  if (ev.keyCode == 87) {
    g_camera.moveForward();      // W
  } else if (ev.keyCode == 83) {
    g_camera.moveBackwards();    // S
  } else if (ev.keyCode == 65) {
    g_camera.moveLeft();         // A
  } else if (ev.keyCode == 68) {
    g_camera.moveRight();        // D
  } else if (ev.keyCode == 81) {
    g_camera.panLeft();          // Q
  } else if (ev.keyCode == 69) {
    g_camera.panRight();         // E
  }else if (ev.keyCode == 70) {
    addBlock();                  // F
  } else if (ev.keyCode == 71) {
    deleteBlock();               // G
  }

  renderAllShapes();
}

let g_map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,2,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,0,0,0,1],
  [1,0,2,0,2,0,0,0,3,0,0,0,1,1,1,0,0,0,2,2,2,0,0,0,0,4,0,4,0,0,0,1],
  [1,0,2,0,2,0,0,0,3,0,0,0,1,0,1,0,0,0,2,0,2,0,0,0,0,4,0,4,0,0,0,1],
  [1,0,2,2,2,0,0,0,3,3,3,0,1,0,1,0,0,0,2,0,2,0,0,0,0,4,4,4,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,3,0,1,0,1,0,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,1,1,0,0,0,3,0,1,1,1,0,0,0,2,2,2,0,0,1,1,1,1,0,0,0,0,1],
  [1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1],
  [1,0,0,1,0,0,1,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1],
  [1,0,0,1,1,1,1,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,2,2,2,2,0,0,4,4,4,4,0,0,2,2,2,2,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,2,0,0,2,0,0,0,0,0,0,0,0,2,0,0,2,0,0,3,3,0,0,0,0,1],
  [1,0,0,0,3,0,0,2,2,2,2,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,3,0,0,0,0,1],
  [1,0,0,0,3,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,3,0,0,0,0,1],
  [1,0,0,0,3,3,3,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,3,3,3,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,4,4,4,0,0,1,0,1,0,0,4,4,4,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,4,0,4,0,0,1,1,1,0,0,4,0,4,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,2,2,0,0,0,4,0,4,0,0,0,0,0,0,0,4,0,4,0,0,0,2,2,2,0,0,0,1],
  [1,0,0,2,0,2,0,0,0,4,4,4,0,0,0,0,0,0,0,4,4,4,0,0,0,2,0,2,0,0,0,1],
  [1,0,0,2,0,2,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,2,0,2,0,0,0,1],
  [1,0,0,2,2,2,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,0,2,2,2,0,0,0,1],
  [1,0,0,0,0,0,0,1,1,1,0,0,0,0,3,0,3,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,1,0,0,0,0,3,3,3,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1],
  [1,0,4,4,4,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,4,4,4,0,0,1],
  [1,0,4,0,4,0,0,1,1,1,0,0,0,2,2,2,2,0,0,0,0,1,1,1,0,0,4,0,4,0,0,1],
  [1,0,4,0,4,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,4,0,4,0,0,1],
  [1,0,4,4,4,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,4,4,4,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];


// draw all world walls
function drawMap() {
  let wall = new Cube();
  wall.color = [1.0, 1.0, 1.0, 1.0];
  wall.textureNum = 1;

  for (let x = 0; x < g_map.length; x++) {
    for (let z = 0; z < g_map[x].length; z++) {
      let height = g_map[x][z];

      for (let y = 0; y < height; y++) {
        wall.matrix = new Matrix4();
        wall.matrix.translate(x - 16, y - 0.95, z - 16);
        wall.render();
      }
    }
  }
}

function drawHorseLeg(x, y, z, legAngle, kneeAngle, baseMatrix) {
  var thigh = new Cube();
  thigh.color = [0.3, 0.15, 0.05, 1.0];
  thigh.textureNum = -2;
  thigh.matrix = new Matrix4(baseMatrix);
  thigh.matrix.translate(x, y, z);
  thigh.matrix.rotate(legAngle, 0, 0, 1);

  var thighCoordinatesMat = new Matrix4(thigh.matrix);

  thigh.matrix.scale(0.13, -0.23, 0.13);
  thigh.render();

  var lowerLeg = new Cube();
  lowerLeg.color = [0.25, 0.12, 0.04, 1.0];
  lowerLeg.textureNum = -2;
  lowerLeg.matrix = new Matrix4(thighCoordinatesMat);
  lowerLeg.matrix.translate(0.0, -0.23, 0.0);
  lowerLeg.matrix.rotate(kneeAngle, 0, 0, 1);

  var lowerLegCoordinatesMat = new Matrix4(lowerLeg.matrix);

  lowerLeg.matrix.scale(0.11, -0.18, 0.11);
  lowerLeg.render();

  var hoof = new Cube();
  hoof.color = [0.1, 0.05, 0.02, 1.0];
  hoof.textureNum = -2;
  hoof.matrix = new Matrix4(lowerLegCoordinatesMat);
  hoof.matrix.translate(0.0, -0.18, 0.0);
  hoof.matrix.scale(0.16, -0.05, 0.12);
  hoof.render();
}

function drawHorse() {
  let base = new Matrix4();
  base.translate(g_horseX, g_horseY, g_horseZ);
  base.rotate(180, 0, 1, 0);
  base.scale(0.7, 0.7, 0.7);

  let legAngle = 10 * Math.sin(g_seconds * 2);
  let kneeAngle = -5 * Math.abs(Math.sin(g_seconds * 2));

  var body = new Cube();
  body.color = [0.6, 0.3, 0.1, 1.0];
  body.textureNum = -2;
  body.matrix = new Matrix4(base);
  body.matrix.translate(-0.6, -0.3, 0.0);
  body.matrix.scale(1.2, 0.5, 0.4);
  body.render();

  var neck = new Cube();
  neck.color = [0.6, 0.3, 0.1, 1.0];
  neck.textureNum = -2;
  neck.matrix = new Matrix4(base);
  neck.matrix.translate(0.3, 0.0, 0.0);
  neck.matrix.rotate(-30, 0, 0, 1);
  neck.matrix.scale(0.3, 0.6, 0.3);
  neck.render();

  var head = new Cube();
  head.color = [0.6, 0.3, 0.1, 1.0];
  head.textureNum = -2;
  head.matrix = new Matrix4(base);
  head.matrix.translate(0.5, 0.4, 0.0);
  head.matrix.scale(0.4, 0.3, 0.3);
  head.render();

  drawHorseLeg(0.35, -0.30, 0.05, legAngle, kneeAngle, base);
  drawHorseLeg(-0.45, -0.30, 0.27, legAngle, kneeAngle, base);
  drawHorseLeg(0.35, -0.30, 0.27, -legAngle, kneeAngle, base);
  drawHorseLeg(-0.45, -0.30, 0.05, -legAngle, kneeAngle, base);

  var tail1 = new Cube();
  tail1.color = [0.25, 0.12, 0.04, 1.0];
  tail1.textureNum = -2;
  tail1.matrix = new Matrix4(base);
  tail1.matrix.translate(-0.58, -0.08, 0.12);
  tail1.matrix.rotate(
  160 + 15 * Math.sin(g_seconds * 4),
  0,
  0,
  1
);

  var tailJointMat = new Matrix4(tail1.matrix);

  tail1.matrix.scale(0.28, 0.07, 0.07);
  tail1.render();

  var tail2 = new Cube();
  tail2.color = [0.2, 0.1, 0.03, 1.0];
  tail2.textureNum = -2;
  tail2.matrix = new Matrix4(tailJointMat);
  tail2.matrix.translate(0.28, 0, 0);
  tail2.matrix.rotate(100, 0, 0, 1);
  tail2.matrix.scale(0.55, 0.06, 0.06);
  tail2.render();

  
  var ear1 = new Cube();
  ear1.color = [0.45, 0.22, 0.08, 1.0];
  ear1.textureNum = -2;
  ear1.matrix = new Matrix4(base);
  ear1.matrix.translate(0.58, 0.65, 0.08);
  ear1.matrix.scale(0.06, 0.25, 0.06);
  ear1.render();

  var ear2 = new Cube();
  ear2.color = [0.45, 0.22, 0.08, 1.0];
  ear2.textureNum = -2;
  ear2.matrix = new Matrix4(base);
  ear2.matrix.translate(0.58, 0.65, 0.24);
  ear2.matrix.scale(0.06, 0.25, 0.06);
  ear2.render();

  var eye1 = new Cube();
  eye1.color = [0.0, 0.0, 0.0, 1.0];
  eye1.textureNum = -2;
  eye1.matrix = new Matrix4(base);
  eye1.matrix.translate(0.58, 0.55, -0.02);
  eye1.matrix.scale(0.04, 0.04, 0.04);
  eye1.render();

  var eye2 = new Cube();
  eye2.color = [0.0, 0.0, 0.0, 1.0];
  eye2.textureNum = -2;
  eye2.matrix = new Matrix4(base);
  eye2.matrix.translate(0.72, 0.55, -0.02);
  eye2.matrix.scale(0.04, 0.04, 0.04);
  eye2.render();

  var nose = new Cube();
  nose.color = [0.05, 0.02, 0.01, 1.0];
  nose.textureNum = -2;
  nose.matrix = new Matrix4(base);
  nose.matrix.translate(0.62, 0.43, -0.025);
  nose.matrix.scale(0.10, 0.035, 0.035);
  nose.render();
}

// checks if player found horse
function checkHorseGame() {
  let dx = g_camera.eye.elements[0] - g_horseX;
  let dz = g_camera.eye.elements[2] - g_horseZ;
  let distance = Math.sqrt(dx * dx + dz * dz);

  let storyBox = document.getElementById("story");

 if (distance < 1.0 && !g_foundHorse) {
    g_foundHorse = true;

    if (storyBox) {
      storyBox.innerHTML =
        "<b>You found the lost horse!</b><br>" +
        "Now use F to add blocks and build a safe stable around it.<br>" +
        "Use G if you place a block wrong.";
    }
  }
}

// draw magic hat reward
function drawMagicHat() {
  let base = new Matrix4();

  base.translate(g_horseX, g_horseY, g_horseZ);
  base.rotate(180, 0, 1, 0);
  base.scale(0.7, 0.7, 0.7);

  // Hat brim
  let brim = new Cube();
  brim.color = [0.02, 0.02, 0.02, 1.0];
  brim.textureNum = -2;
  brim.matrix = new Matrix4(base);
  brim.matrix.translate(0.45, 0.72, -0.05);
  brim.matrix.scale(0.55, 0.06, 0.45);
  brim.render();

  //  hat body
  let top = new Cube();
  top.color = [0.02, 0.02, 0.02, 1.0];
  top.textureNum = -2;
  top.matrix = new Matrix4(base);
  top.matrix.translate(0.55, 0.77, 0.03);
  top.matrix.scale(0.35, 0.45, 0.28);
  top.render();

  // red band
  let band = new Cube();
  band.color = [0.7, 0.0, 0.0, 1.0];
  band.textureNum = -2;
  band.matrix = new Matrix4(base);
  band.matrix.translate(0.54, 0.84, 0.015);
  band.matrix.scale(0.37, 0.08, 0.30);
  band.render();
}



function renderAllShapes() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  g_camera.updateProjectionMatrix();

  let globalRotMat = new Matrix4();

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  g_floor.render();
  g_sky.render();

  drawHorse();
  drawMap();
  checkHorseGame();
  if (g_foundHorse) {
    drawMagicHat();
  }

  checkHorseGame();
}