import { socket } from "./socket.js";
console.log("✅ temp.js loaded");


function addLogItem(log, mode = "prepend") {
  const logsEl = document.getElementById("logs");
  if (!logsEl) return;

  const now = log.createdAt ? new Date(log.createdAt) : new Date();

  const div = document.createElement("div");
  div.className = "log-item";
  div.innerText = `[${now.toLocaleTimeString()}] TEMP ${log.robot_id} → ${log.temperature} °${log.unit}`;

  if (mode === "append") logsEl.append(div);
  else logsEl.prepend(div);

  if (logsEl.children.length > 50) {
    logsEl.removeChild(logsEl.lastChild);
  }
}

socket.on("temp_logs", (logs) => {
  console.log("📜 Last 20 logs:", logs);

  const logsEl = document.getElementById("logs");
  if (!logsEl) return;

  logsEl.innerHTML = "";

  logs.reverse().forEach((log) => addLogItem(log, "append"));
});

socket.on("temp_update", (data) => {
  console.log("📡 Live temp_update:", data);

  const robotIdEl = document.getElementById("robotId");
  const tempEl = document.getElementById("temp");
  const unitEl = document.getElementById("unit");
  const timeEl = document.getElementById("time");

  if (robotIdEl) robotIdEl.innerText = data.robot_id;
  if (tempEl) tempEl.innerText = data.temperature;
  if (unitEl) unitEl.innerText = data.unit;

  const now = data.createdAt ? new Date(data.createdAt) : new Date();
  if (timeEl) timeEl.innerText = now.toLocaleTimeString();

  addLogItem(data);
});
