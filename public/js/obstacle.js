import { socket } from "./socket.js";

function addObstacleLog(log) {
  const logsEl = document.getElementById("logs");
  if (!logsEl) return;

  const now = log.createdAt ? new Date(log.createdAt) : new Date();
  const div = document.createElement("div");
  div.className = "log-item";
  div.innerText = `[${now.toLocaleTimeString()}] OBSTACLE ${log.robot_id} → ${log.distance.toFixed(2)}m (${log.angle}°)`;
  logsEl.prepend(div);
}

socket.on("obstacle_update", (data) => {
  const obsEl = document.getElementById("obstacleDist");
  if (obsEl) obsEl.innerText = `${data.distance.toFixed(2)} m (${data.angle}°)`;
  addObstacleLog(data);
});

socket.on("obstacle_logs", (logs) => {
  console.log("🚧 obstacle logs:", logs);
});
