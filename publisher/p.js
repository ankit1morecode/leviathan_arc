const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://192.168.137.39:1883");

let t = 0;
let lat = 28.6139;
let lng = 77.2090;

client.on("connect", () => {
  console.log("✅ Test publisher connected");

  setInterval(() => {
    lat += 0.0001 * Math.cos(t);
    lng += 0.0001 * Math.sin(t);

    client.publish("leviathan/arc01/gps", JSON.stringify({
      robot_id: "ARC01",
      lat,
      lng,
      ts: Date.now()
    }));

    t += 0.2;
  }, 1000);

  setInterval(() => {
    client.publish("leviathan/arc01/obstacle", JSON.stringify({
      robot_id: "ARC01",
      distance: (Math.random() * 3).toFixed(2),
      angle: Math.floor(Math.random() * 180),
      type: "ultrasonic",
      ts: Date.now()
    }));
  }, 2000);

  setInterval(() => {
    const count = Math.floor(Math.random() * 4);
    const humans = Array.from({ length: count }, () => ({
      x: Math.floor(Math.random() * 320),
      y: Math.floor(Math.random() * 240),
      temp: (32 + Math.random() * 6).toFixed(1),
    }));

    client.publish("leviathan/arc01/thermal/humans", JSON.stringify({
      robot_id: "ARC01",
      count,
      humans,
      frame: Date.now()
    }));
  }, 3000);
});
