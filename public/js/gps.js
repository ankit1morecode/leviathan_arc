import { socket } from "./socket.js";

let lastGPS = null;
let totalDistance = 0;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

socket.on("gps_update", (data) => {
  console.log("GPS:", data);

  // ✅ Accept multiple key names
  const lat = Number(data.lat ?? data.latitude ?? data.Lat);
  const lng = Number(
    data.lng ?? data.lon ?? data.long ?? data.longitude ?? data.Lng
  );

  let ts = data.timestamp ?? data.ts ?? Date.now();
  ts = Number(ts);

  if (ts < 10_000_000_000) ts *= 1000;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    console.warn("Invalid GPS data:", data);
    return;
  }

  let speedKmph = 0;

  if (lastGPS) {
    const d = haversine(lastGPS.lat, lastGPS.lng, lat, lng); // meters
    const dt = (ts - lastGPS.ts) / 1000;

    if (d > 1 && dt > 0) {
      totalDistance += d;

      const speedMps = d / dt;
      speedKmph = speedMps * 3.6;
    }
  }

  lastGPS = { lat, lng, ts };

  const distEl = document.getElementById("distance");
  if (distEl) {
    distEl.innerText =
      totalDistance < 1000
        ? totalDistance.toFixed(2) + " m"
        : (totalDistance / 1000).toFixed(3) + " km";
  }

  const speedEl = document.getElementById("speed");
  if (speedEl) {
    speedEl.innerText = speedKmph.toFixed(2) + " km/h";
  }
});
