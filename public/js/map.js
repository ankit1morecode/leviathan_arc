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

let follow = true;

let robotMarker = L.marker([28.6139, 77.2090], { icon: robotIcon })
  .addTo(map)
  .bindPopup("ARC01");

const trackPoints = [];
let trackPolyline = L.polyline(trackPoints, { weight: 4 }).addTo(pathLayer);

const MAX_OBS_MARKERS = 25;
const MAX_HUMAN_MARKERS = 10;

const obstacleMarkers = [];
let humanMarkers = [];

let showPath = true;
let showObstacles = true;
let showHumans = true;

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

  obstacleMarkers.forEach((m) => obstaclesLayer.removeLayer(m));
  obstacleMarkers.length = 0;

  humanMarkers.forEach((m) => humansLayer.removeLayer(m));
  humanMarkers.length = 0;

  humanCountEl.textContent = "0";
  gpsStatusEl.textContent = "Reset ✅";
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
socket.on("gps_update", (data) => {
  const lat = data.lat || data.latitude;
  const lng = data.lng || data.longitude;
  if (lat && lng) updateRobot(Number(lat), Number(lng));
});

socket.on("obstacle_update", (data) => {
  if (!data) return;
  addObstacleNearRobot(Number(data.distance), Number(data.angle));
});

socket.on("human_update", (data) => {
  if (!data) return;
  renderHumans(data.humans || []);
});