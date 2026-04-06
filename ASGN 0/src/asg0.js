function main() {
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);
}

function drawVector(ctx, v, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();

  var startX = 200;
  var startY = 200;

  var endX = startX + v.elements[0] * 20;
  var endY = startY - v.elements[1] * 20;

  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  var v1x = parseFloat(document.getElementById('v1x').value);
  var v1y = parseFloat(document.getElementById('v1y').value);
  var v2x = parseFloat(document.getElementById('v2x').value);
  var v2y = parseFloat(document.getElementById('v2y').value);

  var v1 = new Vector3([v1x, v1y, 0]);
  var v2 = new Vector3([v2x, v2y, 0]);

  drawVector(ctx, v1, "red");
  drawVector(ctx, v2, "blue");
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  var v1x = parseFloat(document.getElementById('v1x').value);
  var v1y = parseFloat(document.getElementById('v1y').value);
  var v2x = parseFloat(document.getElementById('v2x').value);
  var v2y = parseFloat(document.getElementById('v2y').value);

  var v1 = new Vector3([v1x, v1y, 0]);
  var v2 = new Vector3([v2x, v2y, 0]);

  drawVector(ctx, v1, "red");
  drawVector(ctx, v2, "blue");

  var operation = document.getElementById('operation').value;
  var scalar = parseFloat(document.getElementById('scalar').value);

  if (operation === "add") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(ctx, v3, "green");
  } else if (operation === "sub") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.sub(v2);
    drawVector(ctx, v3, "green");
  } else if (operation === "mul") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");
  } else if (operation === "div") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");
  } else if (operation === "magnitude") {
    console.log("Magnitude v1:", v1.magnitude());
    console.log("Magnitude v2:", v2.magnitude());
  } else if (operation === "normalize") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);

    v3.normalize();
    v4.normalize();

    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");

  } else if (operation === "angle") {
    let angle = angleBetween(v1, v2);
    console.log("Angle between v1 and v2:", angle);
  
  } else if (operation === "area") {
  let area = areaTriangle(v1, v2);
  console.log("Area of the triangle:", area);
  
  }
}

function angleBetween(v1, v2) {
  let dot = Vector3.dot(v1, v2);

  let mag1 = v1.magnitude();
  let mag2 = v2.magnitude();

  let cosAlpha = dot / (mag1 * mag2);

  let angle = Math.acos(cosAlpha);

  
  angle = angle * (180 / Math.PI);

  return angle;
}

function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);
  let areaParallelogram = cross.magnitude();
  let areaTriangle = areaParallelogram / 2;

  return areaTriangle;
}

main();