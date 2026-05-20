class OBJDoc {
  constructor(fileName) {
    this.fileName = fileName;
    this.vertices = [];
    this.normals = [];
    this.finalVertices = [];
    this.finalNormals = [];
    this.indices = [];
  }

  parse(fileString, scale, reverse) {
    let lines = fileString.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (line.length === 0 || line.startsWith('#')) continue;

      let parts = line.split(/\s+/);

      if (parts[0] === 'v') {
        this.vertices.push([
          parseFloat(parts[1]) * scale,
          parseFloat(parts[2]) * scale,
          parseFloat(parts[3]) * scale
        ]);
      }

      else if (parts[0] === 'vn') {
        this.normals.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ]);
      }

      else if (parts[0] === 'f') {
        let face = parts.slice(1);

        for (let i = 1; i < face.length - 1; i++) {
          let tri = reverse
            ? [face[0], face[i + 1], face[i]]
            : [face[0], face[i], face[i + 1]];

          for (let token of tri) {
            let vals = token.split('/');

            let vIndex = parseInt(vals[0]) - 1;
            let nIndex = vals.length >= 3 && vals[2] !== ''
              ? parseInt(vals[2]) - 1
              : vIndex;

            let v = this.vertices[vIndex];
            let n = this.normals[nIndex] || [0, 1, 0];

            this.finalVertices.push(v[0], v[1], v[2]);
            this.finalNormals.push(n[0], n[1], n[2]);
            this.indices.push(this.indices.length);
          }
        }
      }
    }

    return true;
  }

  isMTLComplete() {
    return true;
  }

  getDrawingInfo() {
    return {
      vertices: new Float32Array(this.finalVertices),
      normals: new Float32Array(this.finalNormals),
      indices: new Uint16Array(this.indices)
    };
  }
}