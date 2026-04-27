class Cone {
  constructor() {
    this.type = 'cone';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  render() {
    var rgba = this.color;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    let n = 20;
    let angleStep = 360 / n;

    for (let i = 0; i < n; i++) {
      let angle = i * angleStep;
      let nextAngle = (i + 1) * angleStep;

      let x1 = Math.cos(angle * Math.PI / 180);
      let z1 = Math.sin(angle * Math.PI / 180);

      let x2 = Math.cos(nextAngle * Math.PI / 180);
      let z2 = Math.sin(nextAngle * Math.PI / 180);

      
      drawTriangle3D([
        0, 1, 0,
        x1, 0, z1,
        x2, 0, z2
      ]);
    }
  }
}