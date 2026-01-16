import { socket } from "./socket.js";

const canvas = document.getElementById("thermal");
const ctx = canvas ? canvas.getContext("2d") : null;

function drawHumans(humans = []) {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  humans.forEach((h) => {
    const x = Number(h.x);
    const y = Number(h.y);
    const temp = Number(h.temp);

    if (Number.isNaN(x) || Number.isNaN(y)) return;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillText(`${temp.toFixed(1)}°C`, x + 12, y);
  });
}

socket.on("human_update", (data) => {
  const humanEl = document.getElementById("humanCount");
  if (humanEl) humanEl.innerText = data.count;

  drawHumans(data.humans || []);
});

socket.on("human_logs", (logs) => {
  console.log("🔥 human logs:", logs);
});
