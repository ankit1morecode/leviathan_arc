import { socket } from "./socket.js";

const canvas = document.getElementById("map");
const ctx = canvas ? canvas.getContext("2d") : null;

let path = [];

function drawMap() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (path.length > 1) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);

    for (let p of path) ctx.lineTo(p.x, p.y);

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (path.length > 0) {
    const last = path[path.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  }
}

socket.on("pose_update", (data) => {
  console.log("📍 Pose:", data);

  if (!canvas) return;

  const scale = 10;
  const x = Number(data.x) * scale;
  const y = canvas.height - (Number(data.y) * scale);

  if (Number.isNaN(x) || Number.isNaN(y)) return;

  path.push({ x, y });

  if (path.length > 500) path.shift();

  drawMap();
});
