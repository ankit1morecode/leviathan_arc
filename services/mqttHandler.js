const Telemetry = require("../models/Telemetry");
const Humidity = require("../models/Humidity");
const Obstacle = require("../models/Obstacle");
const ThermalHuman = require("../models/ThermalHuman");
const Gas = require("../models/Gas");

function safeJSONParse(buffer) {
  try {
    return JSON.parse(buffer.toString());
  } catch {
    return null;
  }
}

module.exports = function mqttHandler(mqttClient, io) {
  // ✅ Throttle DB writes so MongoDB doesn't overload
  const throttle = {
    temp: 0,
    humidity: 0,
    obstacle: 0,
    humans: 0,
    gas: 0,
  };

  const shouldSave = (key, ms) => {
    const now = Date.now();
    if (now - throttle[key] > ms) {
      throttle[key] = now;
      return true;
    }
    return false;
  };

  mqttClient.on("message", async (topic, message) => {
    try {
      const data = safeJSONParse(message);

      if (!data) {
        console.log("⚠️ Invalid JSON received:", message.toString());
        return;
      }

      // ✅ POSE (only realtime emit, NO DB saving now)
      if (topic === "leviathan/arc01/pose") {
        io.emit("pose_update", data);
        return;
      }

      // ✅ HUMIDITY (save throttled: 1.5 sec)
      if (topic === "leviathan/arc01/humidity") {
        io.emit("humidity_update", data);

        if (!shouldSave("humidity", 1500)) return;

        const saved = await Humidity.create({
          robot_id: data.robot_id || "ARC01",
          humidity: Number(data.humidity),
          unit: data.unit || "%",
        });

        // send saved version (with createdAt) to keep dashboard consistent
        io.emit("humidity_update", saved);
        return;
      }

      // ✅ OBSTACLE (save throttled: 1 sec)
      if (topic === "leviathan/arc01/obstacle") {
        io.emit("obstacle_update", data);

        if (!shouldSave("obstacle", 1000)) return;

        const saved = await Obstacle.create({
          robot_id: data.robot_id || "ARC01",
          distance: Number(data.distance),
          angle: Number(data.angle),
          type: data.type || "sensor",
        });

        io.emit("obstacle_update", saved);
        return;
      }

      // ✅ THERMAL HUMANS (save throttled: 2 sec)
      if (topic === "leviathan/arc01/thermal/humans") {
        io.emit("human_update", data);

        if (!shouldSave("humans", 2000)) return;

        const saved = await ThermalHuman.create({
          robot_id: data.robot_id || "ARC01",
          count: Number(data.count || 0),
          humans: data.humans || [],
          frame: Number(data.frame || Date.now()),
        });

        io.emit("human_update", saved);
        return;
      }

      // ✅ GPS (only realtime emit, NO DB saving here)
      if (topic === "leviathan/arc01/gps") {
        io.emit("gps_update", data);
        return;
      }

      if (topic === "leviathan/arc01/temp") {

        const temperature = Number(data.temperature ?? data.temp);

        if (Number.isNaN(temperature)) {
          console.log("⚠️ Invalid temperature received:", data);
          return;
        }

        const liveData = {
          robot_id: data.robot_id || "ARC01",
          temperature,
          unit: data.unit || "C",
          createdAt: new Date(),
        };

        io.emit("temp_update", liveData);

        if (!shouldSave("temp", 1000)) return;

        const saved = await Telemetry.create({
          robot_id: liveData.robot_id,
          temperature: liveData.temperature,
          unit: liveData.unit,
        });
        console.log("🔥 TEMP MQTT RECEIVED:", data);
        io.emit("temp_update", saved);
        return;
      }

      if (topic === "leviathan/arc01/gas") {
        io.emit("gas_update", data);

        if (!shouldSave("gas", 1000)) return;

        const saved = await Gas.create({
          robot_id: data.robot_id || "ARC01",
          gas_raw: Number(data.gas_raw),
          gas_voltage: Number(data.gas_voltage || 0),
          gas_status: data.gas_status || "NO_DATA",
        });

        io.emit("gas_update", saved);
        return;
      }
    } catch (err) {
      console.error("❌ MQTT message error:", err.message);
    }
  });
};
