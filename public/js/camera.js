const socket = io();

const camUrlEl = document.getElementById("camUrl");
const camStreamEl = document.getElementById("camStream");
const camStatusEl = document.getElementById("camStatus");
const btnLoad = document.getElementById("btnLoad");

const humCountEl = document.getElementById("humCount");
const obsDistEl = document.getElementById("obsDist");

const DEFAULT_URL = process.env.ESP_IP;
camUrlEl.value = localStorage.getItem("esp32cam_url") || DEFAULT_URL;

function setStatus(text) {
  camStatusEl.innerText = text;
}

function loadStream(url) {
  localStorage.setItem("esp32cam_url", url);

  camStreamEl.src = "";
  setStatus("LOADING...");

  camStreamEl.src = `${url}?_=${Date.now()}`;
}

btnLoad.onclick = () => {
  const url = (camUrlEl.value || "").trim();
  if (!url) return alert("Enter ESP32 stream URL");
  loadStream(url);
};

camStreamEl.onload = () => setStatus("ON ✅");
camStreamEl.onerror = () => setStatus("ERROR ❌");

loadStream(camUrlEl.value);

socket.on("human_update", (data) => {
  if (!data) return;
  const count = data.count ?? (data.humans ? data.humans.length : 0);
  humCountEl.innerText = String(count);
});

socket.on("obstacle_update", (data) => {
  if (!data) return;
  obsDistEl.innerText = String(data.distance ?? "--");
});
