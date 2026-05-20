 // Vertex Shader
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;

  void main() {
    v_VertPos = u_ModelMatrix * a_Position;

    gl_Position = u_ProjectionMatrix *
                  u_ViewMatrix *
                  u_GlobalRotateMatrix *
                  u_ModelMatrix *
                  a_Position;

    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;

  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;

  uniform vec3 u_lightPos;
  uniform vec3 u_lightColor;
  uniform vec3 u_cameraPos;

  uniform bool u_lightOn;
  uniform bool u_normalOn;

  uniform bool u_spotlightOn;
  uniform vec3 u_spotlightPos;
  uniform vec3 u_spotlightDir;

  void main() {
    vec4 baseColor;

    if (u_normalOn) {
      gl_FragColor = vec4((normalize(v_Normal) + 1.0) / 2.0, 1.0);
      return;
    }

    if (u_whichTexture == -3) {
      baseColor = vec4(v_Normal, 1.0);
    } else if (u_whichTexture == -2) {
      baseColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      baseColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      baseColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      baseColor = texture2D(u_Sampler1, v_UV);
    } else {
      baseColor = vec4(1.0, 0.2, 0.2, 1.0);
    }

    vec3 N = normalize(v_Normal);
    vec3 L = normalize(u_lightPos - vec3(v_VertPos));

    float nDotL = max(dot(N, L), 0.0);

    vec3 ambient = vec3(baseColor) * 0.5;
    vec3 diffuse = vec3(baseColor) * u_lightColor * nDotL;

    vec3 R = reflect(-L, N);
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
    float specular = 0.4 * pow(max(dot(E, R), 0.0), 20.0);

    vec3 finalColor = vec3(baseColor);

    if (u_lightOn) {
      finalColor = ambient + diffuse + vec3(specular);
    }

    if (u_spotlightOn) {
      vec3 spotVector = normalize(vec3(v_VertPos) - u_spotlightPos);
      vec3 spotDir = normalize(u_spotlightDir);
      float spotDot = dot(spotVector, spotDir);

      float spotEffect = smoothstep(0.82, 0.95, spotDot);

      finalColor = ambient + (diffuse + vec3(specular)) * spotEffect;
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`; 

let canvas;
let gl;

let a_Position;
let a_UV;
let a_Normal;
let u_Sampler0;
let u_Sampler1;
let u_FragColor;
let u_whichTexture;

let u_ModelMatrix;
let u_NormalMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_lightPos;
let u_lightOn;
let u_lightColor;
let u_cameraPos;
let u_spotlightOn;
let u_spotlightPos;
let u_spotlightDir;

let g_camera;
let g_floor = null;
let g_sky = null;
// horse location in world
let g_horseX = 0;
let g_horseY = -0.45;
let g_horseZ = 0;

let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;
let g_lightPos = [0, 1, -2];
let g_lightAnimation = true;
let g_lightOn = true;
let g_normalOn = false;
let u_normalOn;
let g_lightColor = [1.0, 1.0, 1.0];

let g_spotlightOn = true;
let g_spotlightPos = [-1.2, 1.8, 0];
let g_spotlightDir = [0.6, -0.4, -1];

let g_vaseObj = null;
let g_vaseDrawingInfo = null;
let g_objDoc = null;

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

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');

  if (!u_lightPos) {
    console.log('Failed to get u_lightPos');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');

  if (!u_cameraPos) {
    console.log('Failed to get u_cameraPos');
    return;
  }


  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

  if (a_Normal < 0) {
    console.log('Failed to get a_Normal');
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');

  if (!u_lightOn) {
    console.log('Failed to get u_lightOn');
    return;
  }

  u_normalOn = gl.getUniformLocation(gl.program, 'u_normalOn');

  if (!u_normalOn) {
    console.log('Failed to get u_normalOn');
    return;
  }

  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  if (!u_NormalMatrix) {
    console.log('Failed to get u_NormalMatrix');
    return;
  }

  u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');

  if (!u_lightColor) {
    console.log('Failed to get u_lightColor');
    return;
  }

  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
  if (!u_spotlightOn) {
    console.log('Failed to get u_spotlightOn');
    return;
  }

  u_spotlightPos = gl.getUniformLocation(gl.program, 'u_spotlightPos');
  if (!u_spotlightPos) {
    console.log('Failed to get u_spotlightPos');
    return;
  }

  u_spotlightDir = gl.getUniformLocation(gl.program, 'u_spotlightDir');
  if (!u_spotlightDir) {
    console.log('Failed to get u_spotlightDir');
    return;
  }

 }


function drawTriangles3DUVNormal(vertices, uv, normals) {
  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  let uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  let normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

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

  
// animate light
if (g_lightAnimation) {
  g_lightPos[0] = 2 * Math.cos(now / 1000);
}

  renderAllShapes();

  document.getElementById("fps").innerHTML =
    "FPS: " + fps.toFixed(1);

  requestAnimationFrame(tick);
}

function addActionsForHtmlUI() {
  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) {
      g_lightPos[0] = this.value / 100;
      renderAllShapes();
    }
  });

  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) {
      g_lightPos[1] = this.value / 100;
      renderAllShapes();
    }
  });

  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) {
      g_lightPos[2] = this.value / 100;
      renderAllShapes();
    }
  });
  document.getElementById('lightOn').onclick = function() {
    g_lightOn = true;
    renderAllShapes();
  };

  document.getElementById('lightOff').onclick = function() {
    g_lightOn = false;
    renderAllShapes();
  };

  document.getElementById('normalOn').onclick = function() {
    g_normalOn = true;
    renderAllShapes();
  };

  document.getElementById('normalOff').onclick = function() {
    g_normalOn = false;
    renderAllShapes();
  };


  document.getElementById('lightRed').addEventListener('mousemove', function(ev) {
  if (ev.buttons == 1) {
    g_lightColor[0] = this.value / 100;
    renderAllShapes();
  }
});

  document.getElementById('lightGreen').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) {
      g_lightColor[1] = this.value / 100;
      renderAllShapes();
    }
  });

  document.getElementById('lightBlue').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) {
      g_lightColor[2] = this.value / 100;
      renderAllShapes();
    }
  });

  document.getElementById('spotlightOn').onclick = function() {
    g_spotlightOn = true;
    renderAllShapes();
  };

  document.getElementById('spotlightOff').onclick = function() {
    g_spotlightOn = false;
    renderAllShapes();
  }; 
}
// setup game
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  g_camera = new Camera();
  addActionsForHtmlUI();
  readOBJFile('vase.obj', gl, 1.0, true);
  gl.clearColor(0.4, 0.6, 0.9, 1.0);

  g_floor = new Cube();
  g_floor.textureNum = 0;
  g_floor.matrix.translate(-6, -1, -6);
  g_floor.matrix.scale(12, 0.05, 12);

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
  } else if (ev.keyCode == 69) { // E
    g_camera.panRight();   
  }                              

  renderAllShapes();
}


// draw all world walls
function drawSimpleRoom() {
  let back = new Cube();
  back.textureNum = 1;
  back.matrix.translate(-4, -1, -5);
  back.matrix.scale(8, 4, 0.2);
  back.render();

  let left = new Cube();
  left.textureNum = 1;
  left.matrix.translate(-4, -1, -5);
  left.matrix.scale(0.2, 4, 8);
  left.render();

  let right = new Cube();
  right.textureNum = 1;
  right.matrix.translate(4, -1, -5);
  right.matrix.scale(0.2, 4, 8);
  right.render();
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
  body.normalMatrix.setInverseOf(body.matrix).transpose();
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

function drawSnowman() {
  // bottom sphere
  let snowBottom = new Sphere();
  snowBottom.color = [1, 1, 1, 1];
  snowBottom.textureNum = -2;
  snowBottom.matrix.translate(1.5, -0.75, -2.5);
  snowBottom.matrix.scale(0.7, 0.7, 0.7);
  snowBottom.render();

  // middle sphere
  let snowMiddle = new Sphere();
  snowMiddle.color = [1, 1, 1, 1];
  snowMiddle.textureNum = -2;
  snowMiddle.matrix.translate(1.62, 0.05, -2.38);
  snowMiddle.matrix.scale(0.5, 0.5, 0.5);
  snowMiddle.render();

  // head sphere
  let snowHead = new Sphere();
  snowHead.color = [1, 1, 1, 1];
  snowHead.textureNum = -2;
  snowHead.matrix.translate(1.72, 0.62, -2.28);
  snowHead.matrix.scale(0.35, 0.35, 0.35);
  snowHead.render();

 
  // eyes
  let eye1 = new Cube();
  eye1.color = [0, 0, 0, 1];
  eye1.textureNum = -2;
  eye1.matrix.translate(1.58, 0.72, -1.94);
  eye1.matrix.scale(0.045, 0.045, 0.045);
  eye1.render();

  let eye2 = new Cube();
  eye2.color = [0, 0, 0, 1];
  eye2.textureNum = -2;
  eye2.matrix.translate(1.75, 0.72, -1.94);
  eye2.matrix.scale(0.045, 0.045, 0.045);
  eye2.render();

  // smile
  let smile1 = new Cube();
  smile1.color = [0, 0, 0, 1];
  smile1.textureNum = -2;
  smile1.matrix.translate(1.57, 0.59, -1.93);
  smile1.matrix.rotate(-20, 0, 0, 1);
  smile1.matrix.scale(0.075, 0.028, 0.028);
  smile1.render();

  let smile2 = new Cube();
  smile2.color = [0, 0, 0, 1];
  smile2.textureNum = -2;
  smile2.matrix.translate(1.67, 0.565, -1.93);
  smile2.matrix.scale(0.085, 0.028, 0.028);
  smile2.render();

  let smile3 = new Cube();
  smile3.color = [0, 0, 0, 1];
  smile3.textureNum = -2;
  smile3.matrix.translate(1.77, 0.59, -1.93)
  smile3.matrix.rotate(20, 0, 0, 1);
  smile3.matrix.scale(0.075, 0.028, 0.028);
  smile3.render();

  let leftArm = new Cube();
  leftArm.color = [0.25, 0.12, 0.03, 1];
  leftArm.textureNum = -2;
  leftArm.matrix.translate(1.18, 0.03, -2.03);
  leftArm.matrix.rotate(150, 0, 0, 1);
  leftArm.matrix.scale(0.62, 0.055, 0.055);
  leftArm.render();


  let rightArm = new Cube();
  rightArm.color = [0.25, 0.12, 0.03, 1];
  rightArm.textureNum = -2;
  rightArm.matrix.translate(1.98, 0.03, -2.03);
  rightArm.matrix.rotate(30, 0, 0, 1);
  rightArm.matrix.scale(0.62, 0.055, 0.055);
  rightArm.render();
  }


function renderAllShapes() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  g_camera.updateProjectionMatrix();

  let globalRotMat = new Matrix4();

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.uniform3f(
    u_lightPos,
    g_lightPos[0],
    g_lightPos[1],
    g_lightPos[2]
  );

  gl.uniform3f(
    u_cameraPos,
    g_camera.eye.elements[0],
    g_camera.eye.elements[1],
    g_camera.eye.elements[2]
  );

  gl.uniform3f(
    u_lightColor,
    g_lightColor[0],
    g_lightColor[1],
    g_lightColor[2]
  );

gl.uniform1i(u_spotlightOn, g_spotlightOn);

gl.uniform3f(
  u_spotlightPos,
  g_spotlightPos[0],
  g_spotlightPos[1],
  g_spotlightPos[2]
);

gl.uniform3f(
  u_spotlightDir,
  g_spotlightDir[0],
  g_spotlightDir[1],
  g_spotlightDir[2]
);

  gl.uniform1i(u_lightOn, g_lightOn);
  gl.uniform1i(u_normalOn, g_normalOn);
  gl.clearColor(0.4, 0.6, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



  let light = new Cube();
  light.color = [2, 2, 0, 1];
  light.textureNum = -2;

  light.matrix.translate(
    g_lightPos[0],
    g_lightPos[1],
    g_lightPos[2]
  );

  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);

  light.render();


  g_floor.render();
  drawSimpleRoom();
  drawSnowman();
  drawHorse();
  if (g_objDoc != null && g_objDoc.isMTLComplete()) {

  if (!g_vaseDrawingInfo) {
    g_vaseDrawingInfo = g_objDoc.getDrawingInfo();
  }

  let vaseMatrix = new Matrix4();
  vaseMatrix.translate(-2.2, -0.9, -2.8);
  vaseMatrix.scale(0.35, 0.35, 0.35);
  drawOBJ(g_vaseDrawingInfo, vaseMatrix);
  
}
}

  function readOBJFile(fileName, gl, scale, reverse) {
  let request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
    }
  };

  request.open('GET', fileName, true);
  request.send();
}

function onReadOBJFile(fileString, fileName, gl, scale, reverse) {
  let objDoc = new OBJDoc(fileName);

  let result = objDoc.parse(fileString, scale, reverse);

  if (!result) {
    g_objDoc = null;
    console.log("OBJ parse error");
    return;
  }

  g_objDoc = objDoc;
}
function drawOBJ(drawingInfo, modelMatrix) {
  if (!drawingInfo) {
    return;
  }

  let normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix).transpose();

  gl.uniform1i(u_whichTexture, -2);
  gl.uniform4f(u_FragColor, 0.6, 0.45, 0.25, 1.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  let vertices = drawingInfo.vertices;
  let normals = drawingInfo.normals;
  let indices = drawingInfo.indices;

  let uv = new Float32Array((vertices.length / 3) * 2);

  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  let uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  let normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  let indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}