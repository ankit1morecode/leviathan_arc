const socket = io();
const map = L.map("map").setView([28.6139, 77.2090], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const robotIcon = L.icon({
  iconUrl: "/img/robot.png",
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -18],
});

const humanIcon = L.icon({
  iconUrl: "/img/human.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

const obstacleIcon = L.icon({
  iconUrl: "/img/obstacle.png",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

const pathLayer = L.layerGroup().addTo(map);
const obstaclesLayer = L.layerGroup().addTo(map);
const humansLayer = L.layerGroup().addTo(map);

const gpsStatusEl = document.getElementById("gpsStatus");
const humanCountEl = document.getElementById("humanCount");

const btnFollow = document.getElementById("btnFollow");
const btnTogglePath = document.getElementById("btnTogglePath");
const btnToggleObstacles = document.getElementById("btnToggleObstacles");
const btnToggleHumans = document.getElementById("btnToggleHumans");
const btnReset = document.getElementById("btnReset");

/* ✅ NEW UI */
const btnStartRecord = document.getElementById("btnStartRecord");
const btnStopRecord = document.getElementById("btnStopRecord");
const btnReplayPath = document.getElementById("btnReplayPath");
const pathNameInput = document.getElementById("pathName");
const pathsListEl = document.getElementById("pathsList");

let follow = true;

let robotMarker = L.marker([28.6139, 77.2090], { icon: robotIcon })
  .addTo(map)
  .bindPopup("ARC01");

const trackPoints = [];
let trackPolyline = L.polyline(trackPoints, { weight: 4 }).addTo(pathLayer);

let replayPolyline = L.polyline([], { weight: 6, dashArray: "8 10" }).addTo(pathLayer);

const MAX_OBS_MARKERS = 25;
const MAX_HUMAN_MARKERS = 10;

const obstacleMarkers = [];
let humanMarkers = [];

let showPath = true;
let showObstacles = true;
let showHumans = true;

const ROBOT_ID = "ARC01";
let isRecording = false;
let currentPathName = "";
let selectedPathName = "";
let lastSaveAt = 0;
let replayTimer = null;

function updateRobot(lat, lng) {
  const pos = [lat, lng];
  robotMarker.setLatLng(pos);

  trackPoints.push(pos);
  trackPolyline.setLatLngs(trackPoints);

  gpsStatusEl.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  if (follow) map.panTo(pos);
}

function addObstacleNearRobot(distanceMeters, angleDeg) {
  const robotPos = robotMarker.getLatLng();
  const dist = Number(distanceMeters) || 0;
  const ang = (Number(angleDeg) || 0) * Math.PI / 180;

  const dx = dist * Math.cos(ang);
  const dy = dist * Math.sin(ang);

  const dLat = dy / 111111;
  const dLng = dx / (111111 * Math.cos(robotPos.lat * Math.PI / 180));

  const lat = robotPos.lat + dLat;
  const lng = robotPos.lng + dLng;

  const marker = L.marker([lat, lng], { icon: obstacleIcon }).addTo(obstaclesLayer);

  marker.bindPopup(
    `<b>Obstacle</b><br/>Distance: ${dist}m<br/>Angle: ${angleDeg}°`
  );

  obstacleMarkers.push(marker);

  while (obstacleMarkers.length > MAX_OBS_MARKERS) {
    const old = obstacleMarkers.shift();
    obstaclesLayer.removeLayer(old);
  }
}

function renderHumans(humans) {
  humanMarkers.forEach((m) => humansLayer.removeLayer(m));
  humanMarkers = [];

  if (!humans || humans.length === 0) {
    humanCountEl.textContent = "0";
    return;
  }

  humanCountEl.textContent = String(humans.length);

  const robotPos = robotMarker.getLatLng();

  humans.slice(0, MAX_HUMAN_MARKERS).forEach((h, idx) => {
    const x = Number(h.x || 0);
    const y = Number(h.y || 0);
    const temp = h.temp;

    const offsetX = ((x - 160) / 160) * 8;
    const offsetY = ((y - 120) / 120) * 8;

    const dLat = offsetY / 111111;
    const dLng = offsetX / (111111 * Math.cos(robotPos.lat * Math.PI / 180));

    const lat = robotPos.lat + dLat;
    const lng = robotPos.lng + dLng;

    const marker = L.marker([lat, lng], { icon: humanIcon }).addTo(humansLayer);

    marker.bindPopup(`<b>Human ${idx + 1}</b><br/>Temp: ${temp}°C`);
    humanMarkers.push(marker);
  });
}

function resetMap() {
  trackPoints.length = 0;
  trackPolyline.setLatLngs(trackPoints);

  replayPolyline.setLatLngs([]);
  selectedPathName = "";

  obstacleMarkers.forEach((m) => obstaclesLayer.removeLayer(m));
  obstacleMarkers.length = 0;

  humanMarkers.forEach((m) => humansLayer.removeLayer(m));
  humanMarkers.length = 0;

  humanCountEl.textContent = "0";
  gpsStatusEl.textContent = "Reset ✅";
}


async function apiStartRecord(name) {
  await fetch("/api/gpspath/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ robot_id: ROBOT_ID, name }),
  });
}

async function apiAddPoint(name, lat, lng) {
  await fetch("/api/gpspath/point", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ robot_id: ROBOT_ID, name, lat, lng }),
  });
}

async function apiListPaths() {
  const res = await fetch(`/api/gpspath/list/${ROBOT_ID}`);
  return await res.json();
}

async function apiGetPath(name) {
  const res = await fetch(`/api/gpspath/${ROBOT_ID}/${name}`);
  return await res.json();
}

async function apiDeletePath(name) {
  await fetch(`/api/gpspath/${ROBOT_ID}/${name}`, { method: "DELETE" });
}

function formatDate(d) {
  try { return new Date(d).toLocaleString(); }
  catch { return ""; }
}

async function refreshSidebar() {
  if (!pathsListEl) return;

  const list = await apiListPaths();
  pathsListEl.innerHTML = "";

  if (!list.length) {
    pathsListEl.innerHTML = `<div class="meta">No saved paths yet.</div>`;
    return;
  }

  list.forEach((p) => {
    const wrap = document.createElement("div");
    wrap.className = "pathItem";

    wrap.innerHTML = `
      <div class="pathRow">
        <div class="pathName">${p.name}</div>
        <div class="pathBtns">
          <button class="sb-btn sb-play">▶</button>
          <button class="sb-btn sb-del">🗑</button>
        </div>
      </div>
      <div class="meta">Updated: ${formatDate(p.updatedAt || p.createdAt)}</div>
    `;

    wrap.querySelector(".pathName").onclick = () => {
      selectedPathName = p.name;
      alert(`Selected: ${selectedPathName}`);
    };

    wrap.querySelector(".sb-play").onclick = async () => {
      selectedPathName = p.name;
      await replaySelectedPath();
    };

    wrap.querySelector(".sb-del").onclick = async () => {
      const ok = confirm(`Delete path "${p.name}" ?`);
      if (!ok) return;

      await apiDeletePath(p.name);

      if (selectedPathName === p.name) selectedPathName = "";
      await refreshSidebar();
    };

    pathsListEl.appendChild(wrap);
  });
}

async function replaySelectedPath() {
  const name = selectedPathName;
  if (!name) {
    alert("Select a path from sidebar first ✅");
    return;
  }

  const points = await apiGetPath(name);
  if (!points.length) {
    alert("No points found in this path!");
    return;
  }

  const latlngs = points.map((p) => [p.lat, p.lng]);
  replayPolyline.setLatLngs(latlngs);

  if (replayTimer) clearInterval(replayTimer);

  let i = 0;
  replayTimer = setInterval(() => {
    if (i >= latlngs.length) {
      clearInterval(replayTimer);
      replayTimer = null;
      return;
    }
    const pos = latlngs[i++];
    robotMarker.setLatLng(pos);
    map.panTo(pos);
  }, 300);
}

if (btnStartRecord) {
  btnStartRecord.onclick = async () => {
    const name = (pathNameInput?.value || "").trim() || "route1";
    currentPathName = name;
    selectedPathName = name;

    await apiStartRecord(name);

    isRecording = true;
    alert(`Recording started: ${name}`);
    await refreshSidebar();
  };
}

if (btnStopRecord) {
  btnStopRecord.onclick = async () => {
    isRecording = false;
    alert("Recording stopped ✅");
    await refreshSidebar();
  };
}

if (btnReplayPath) {
  btnReplayPath.onclick = async () => {
    await replaySelectedPath();
  };
}

btnFollow.onclick = () => {
  follow = !follow;
  btnFollow.textContent = follow ? "🎯 Follow: ON" : "🎯 Follow: OFF";
};

btnTogglePath.onclick = () => {
  showPath = !showPath;
  if (showPath) map.addLayer(pathLayer);
  else map.removeLayer(pathLayer);
  btnTogglePath.textContent = showPath ? "🧵 Path: ON" : "🧵 Path: OFF";
};

btnToggleObstacles.onclick = () => {
  showObstacles = !showObstacles;
  if (showObstacles) map.addLayer(obstaclesLayer);
  else map.removeLayer(obstaclesLayer);
  btnToggleObstacles.textContent = showObstacles ? "🚧 Obstacles: ON" : "🚧 Obstacles: OFF";
};

btnToggleHumans.onclick = () => {
  showHumans = !showHumans;
  if (showHumans) map.addLayer(humansLayer);
  else map.removeLayer(humansLayer);
  btnToggleHumans.textContent = showHumans ? "🧍 Humans: ON" : "🧍 Humans: OFF";
};

btnReset.onclick = () => resetMap();

socket.on("gps_update", async (data) => {
  const lat = data.lat || data.latitude;
  const lng = data.lng || data.longitude;

  if (lat && lng) {
    const LAT = Number(lat);
    const LNG = Number(lng);

    updateRobot(LAT, LNG);

    if (isRecording && currentPathName) {
      const now = Date.now();
      if (now - lastSaveAt > 700) {
        lastSaveAt = now;
        await apiAddPoint(currentPathName, LAT, LNG);
      }
    }
  }
});

socket.on("obstacle_update", (data) => {
  if (!data) return;
  addObstacleNearRobot(Number(data.distance), Number(data.angle));
});

socket.on("human_update", (data) => {
  if (!data) return;
  renderHumans(data.humans || []);
});

refreshSidebar();