class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.normalMatrix = new Matrix4();
    this.textureNum = -2;
  }

  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);

    gl.uniform4f(
      u_FragColor,
      rgba[0],
      rgba[1],
      rgba[2],
      rgba[3]
    );

    gl.uniformMatrix4fv(
      u_ModelMatrix,
      false,
      this.matrix.elements
    );

    this.normalMatrix.setInverseOf(this.matrix);
    this.normalMatrix.transpose();

    gl.uniformMatrix4fv(
      u_NormalMatrix,
      false,
      this.normalMatrix.elements
    );

    drawTriangles3DUVNormal(
      Cube.vertices32,
      Cube.uv32,
      Cube.normals32
    );
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

Cube.normals32 = new Float32Array([
  // Front face z = 0
  0,0,-1,  0,0,-1,  0,0,-1,
  0,0,-1,  0,0,-1,  0,0,-1,

  // Back face z = 1
  0,0,1,  0,0,1,  0,0,1,
  0,0,1,  0,0,1,  0,0,1,

  // Top
  0,1,0,  0,1,0,  0,1,0,
  0,1,0,  0,1,0,  0,1,0,

  // Bottom
  0,-1,0,  0,-1,0,  0,-1,0,
  0,-1,0,  0,-1,0,  0,-1,0,

  // Left
  -1,0,0,  -1,0,0,  -1,0,0,
  -1,0,0,  -1,0,0,  -1,0,0,

  // Right
  1,0,0,  1,0,0,  1,0,0,
  1,0,0,  1,0,0,  1,0,0
]);