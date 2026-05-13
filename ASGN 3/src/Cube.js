class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;
  }

  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    drawTriangles3DUV(Cube.vertices32, Cube.uv32);
  }
}

Cube.vertices32 = new Float32Array([
  // Front
  0,0,0,  1,0,0,  1,1,0,
  0,0,0,  1,1,0,  0,1,0,

  // Back
  0,0,1,  1,0,1,  1,1,1,
  0,0,1,  1,1,1,  0,1,1,

  // Top
  0,1,0,  1,1,0,  1,1,1,
  0,1,0,  1,1,1,  0,1,1,

  // Bottom
  0,0,0,  1,0,0,  1,0,1,
  0,0,0,  1,0,1,  0,0,1,

  // Left
  0,0,0,  0,1,0,  0,1,1,
  0,0,0,  0,1,1,  0,0,1,

  // Right
  1,0,0,  1,1,0,  1,1,1,
  1,0,0,  1,1,1,  1,0,1
]);

Cube.uv32 = new Float32Array([
  // Front
  0,0,  1,0,  1,1,
  0,0,  1,1,  0,1,

  // Back
  0,0,  1,0,  1,1,
  0,0,  1,1,  0,1,

  // Top
  0,0,  1,0,  1,1,
  0,0,  1,1,  0,1,

  // Bottom
  0,0,  1,0,  1,1,
  0,0,  1,1,  0,1,

  // Left
  0,0,  1,0,  1,1,
  0,0,  1,1,  0,1,

  // Right
  0,0,  1,0,  1,1,
  0,0,  1,1,  0,1
]);