import { socket } from "./socket.js";

function addHumidityLog(log) {
  const logsEl = document.getElementById("logs");
  if (!logsEl) return;

  const now = log.createdAt ? new Date(log.createdAt) : new Date();
  const div = document.createElement("div");
  div.className = "log-item";
  div.innerText = `[${now.toLocaleTimeString()}] HUMIDITY ${log.robot_id} → ${log.humidity}${log.unit}`;
  logsEl.prepend(div);
}

socket.on("humidity_update", (data) => {
  const humEl = document.getElementById("humidity");
  if (humEl) humEl.innerText = `${data.humidity}${data.unit}`;
  addHumidityLog(data);
});

socket.on("humidity_logs", (logs) => {
  console.log("💧 humidity logs:", logs);
});
