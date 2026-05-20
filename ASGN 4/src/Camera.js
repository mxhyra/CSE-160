class Camera {
  constructor() {
    this.fov = 60;

    this.eye = new Vector3([0, 0, 3]);
    this.at = new Vector3([0, 0, -1]);
    this.up = new Vector3([0, 1, 0]);

    this.speed = 0.3;
    this.alpha = 5;

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  updateProjectionMatrix() {
    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      100
    );
  }

  moveForward() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(this.speed);

    this.eye.add(f);
    this.at.add(f);

    this.updateViewMatrix();
  }

  moveBackwards() {
    let b = new Vector3();
    b.set(this.eye);
    b.sub(this.at);
    b.normalize();
    b.mul(this.speed);

    this.eye.add(b);
    this.at.add(b);

    this.updateViewMatrix();
  }

  moveLeft() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(this.speed);

    this.eye.add(s);
    this.at.add(s);

    this.updateViewMatrix();
  }

  moveRight() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.speed);

    this.eye.add(s);
    this.at.add(s);

    this.updateViewMatrix();
  }

  panLeft() {
    this.pan(this.alpha);
  }

  panRight() {
    this.pan(-this.alpha);
  }


  panMouse(deltaX) {
    let angle = -deltaX * 0.2;
    this.pan(angle);
  }


  pan(angle) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      angle,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );

    let fPrime = rotationMatrix.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(fPrime);

    this.updateViewMatrix();
  }
}