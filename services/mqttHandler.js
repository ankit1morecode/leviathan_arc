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

  const topics = [
    "leviathan/arc01/temp",
    "leviathan/arc01/gps",
    "leviathan/arc01/humidity",
    "leviathan/arc01/obstacle",
    "leviathan/arc01/thermal/humans",
    "leviathan/arc01/gas",
    "leviathan/arc01/pose",
  ];

  mqttClient.on("connect", () => {
    mqttClient.subscribe(topics, (err) => {
      if (err) console.error("❌ MQTT subscribe failed:", err.message);
      else console.log("✅ MQTT subscribed to all topics");
    });
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      const data = safeJSONParse(message);

      if (!data || typeof data !== "object") {
        console.warn("⚠️ Invalid JSON received:", message.toString());
        return;
      }

      /* ---------------- POSE ---------------- */
      if (topic === "leviathan/arc01/pose") {
        io.emit("pose_update", data);
        return;
      }

      /* ---------------- GPS ---------------- */
      if (topic === "leviathan/arc01/gps") {
        io.emit("gps_update", data);
        return;
      }

      /* ---------------- TEMPERATURE ---------------- */
      if (topic === "leviathan/arc01/temp") {
        const temperature = Number(
          data.temperature ??
          data.temp ??
          data.ambient_c ??
          data.ambient
        );

        if (Number.isNaN(temperature)) {
          console.warn("⚠️ Invalid temperature received:", data);
          return;
        }

        const payload = {
          robot_id: data.robot_id || "ARC01",
          temperature,
          unit: data.unit || "C",
          createdAt: new Date(),
        };

        io.emit("temp_update", payload);

        if (!shouldSave("temp", 1000)) return;

        const saved = await Telemetry.create(payload);
        io.emit("temp_update", saved);
        return;
      }

      /* ---------------- HUMIDITY ---------------- */
      if (topic === "leviathan/arc01/humidity") {
        const humidity = Number(data.humidity);

        if (Number.isNaN(humidity)) {
          console.warn("⚠️ Invalid humidity received:", data);
          return;
        }

        const payload = {
          robot_id: data.robot_id || "ARC01",
          humidity,
          unit: data.unit || "%",
        };

        io.emit("humidity_update", payload);

        if (!shouldSave("humidity", 1500)) return;

        const saved = await Humidity.create(payload);
        io.emit("humidity_update", saved);
        return;
      }

      /* ---------------- OBSTACLE ---------------- */
      if (topic === "leviathan/arc01/obstacle") {

        // ESP may send distance_mm instead of distance (convert mm → m)
        const distance =
          Number(data.distance) ||
          (Number(data.distance_mm) / 1000);

        // ESP may not send angle → assume forward
        const angle =
          Number(data.angle) || 0;

        // If ESP says no obstacle, ignore
        if (data.obstacle_detected === false) {
          return;
        }

        if (Number.isNaN(distance)) {
          console.warn("⚠️ Invalid obstacle data:", data);
          return;
        }

        io.emit("obstacle_update", {
          robot_id: data.robot_id || "ARC01",
          distance,
          angle,
        });

        if (!shouldSave("obstacle", 1000)) return;

        const saved = await Obstacle.create({
          robot_id: data.robot_id || "ARC01",
          distance,
          angle,
          type: "ultrasonic",
        });

        io.emit("obstacle_update", saved);
        return;
      }

      /* ---------------- HUMANS ---------------- */
      if (topic === "leviathan/arc01/thermal/humans") {
        io.emit("human_update", data);

        if (!shouldSave("humans", 2000)) return;

        const saved = await ThermalHuman.create({
          robot_id: data.robot_id || "ARC01",
          count: Number(data.count || 0),
          humans: Array.isArray(data.humans) ? data.humans : [],
          frame: Number(data.frame || Date.now()),
        });

        io.emit("human_update", saved);
        return;
      }

      /* ---------------- GAS ---------------- */
      if (topic === "leviathan/arc01/gas") {

        // ESP may send gas_value instead of gas_raw
        const gasRaw =
          Number(data.gas_raw) ||
          Number(data.gas_value);

        if (Number.isNaN(gasRaw)) {
          console.warn("⚠️ Invalid gas data:", data);
          return;
        }

        const statusMap = {
          safe: "SAFE",
          warning: "WARNING",
          danger: "DANGER",
        };

        const gasStatus =
          statusMap[data.gas_status?.toLowerCase()] ||
          statusMap[data.status?.toLowerCase()] ||
          "NO_DATA";

        io.emit("gas_update", {
          robot_id: data.robot_id || "ARC01",
          gas_raw: gasRaw,
          gas_status: gasStatus,
        });

        if (!shouldSave("gas", 1000)) return;

        const saved = await Gas.create({
          robot_id: data.robot_id || "ARC01",
          gas_raw: gasRaw,
          gas_voltage: Number(data.gas_voltage) || 0,
          gas_status: gasStatus,
        });

        io.emit("gas_update", saved);
        return;
      }

    } catch (err) {
      console.error("❌ MQTT handler error:", err.message);
    }
  });
};
