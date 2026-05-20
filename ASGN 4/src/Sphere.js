class Sphere {
  constructor() {
    this.type = "sphere";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.normalMatrix = new Matrix4();
    this.textureNum = -2;
    
  }

  render() {
  var rgba = this.color;

  gl.uniform1i(u_whichTexture, this.textureNum);
  gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

  gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

  this.normalMatrix.setInverseOf(this.matrix);
  this.normalMatrix.transpose();

  gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

  let d = Math.PI / 10;
  let dd = Math.PI / 10;

  for (let t = 0; t < Math.PI; t += d) {
    for (let r = 0; r < 2 * Math.PI; r += d) {
      let p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
      let p2 = [Math.sin(t + dd) * Math.cos(r), Math.sin(t + dd) * Math.sin(r), Math.cos(t + dd)];
      let p3 = [Math.sin(t) * Math.cos(r + dd), Math.sin(t) * Math.sin(r + dd), Math.cos(t)];
      let p4 = [Math.sin(t + dd) * Math.cos(r + dd), Math.sin(t + dd) * Math.sin(r + dd), Math.cos(t + dd)];

      let v1 = [].concat(p1, p2, p4);
      let uv1 = [0,0, 0,0, 0,0];

      drawTriangles3DUVNormal(
        new Float32Array(v1),
        new Float32Array(uv1),
        new Float32Array(v1)
      );

      let v2 = [].concat(p1, p4, p3);
      let uv2 = [0,0, 0,0, 0,0];

      drawTriangles3DUVNormal(
        new Float32Array(v2),
        new Float32Array(uv2),
        new Float32Array(v2)
      );
    }
  }
}
}