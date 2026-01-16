const Path = require("../models/Path");
const Telemetry = require("../models/Telemetry");
const Humidity = require("../models/Humidity");
const Obstacle = require("../models/Obstacle");
const ThermalHuman = require("../models/ThermalHuman");
const Gas = require("../models/Gas");

const state = {
  isRecording: false,
  currentPathName: "route1",
  currentRobotId: "ARC01",
};

module.exports = function mqttHandler(mqttClient, io) {
  mqttClient.on("message", async (topic, message) => {
    try {
      let data;
      try {
        data = JSON.parse(message.toString());
      } catch {
        console.log("Invalid JSON received:", message.toString());
        return;
      }

      if (topic === "leviathan/arc01/pose") {
        io.emit("pose_update", data);

        if (state.isRecording) {
          await Path.updateOne(
            {
              robot_id: state.currentRobotId,
              name: state.currentPathName,
            },
            {
              $push: {
                points: {
                  x: Number(data.x),
                  y: Number(data.y),
                },
              },
            },
            { upsert: true }
          );
        }
        return;
      }

      if (topic === "leviathan/arc01/humidity") {
        const saved = await Humidity.create({
          robot_id: data.robot_id || state.currentRobotId,
          humidity: Number(data.humidity),
          unit: data.unit || "%",
        });

        io.emit("humidity_update", {
          robot_id: saved.robot_id,
          humidity: saved.humidity,
          unit: saved.unit,
          createdAt: saved.createdAt,
        });

        return;
      }

      if (topic === "leviathan/arc01/obstacle") {
        const saved = await Obstacle.create({
          robot_id: data.robot_id || state.currentRobotId,
          distance: Number(data.distance),
          angle: Number(data.angle),
          type: data.type || "sensor",
        });

        io.emit("obstacle_update", {
          robot_id: saved.robot_id,
          distance: saved.distance,
          angle: saved.angle,
          type: saved.type,
          createdAt: saved.createdAt,
        });

        return;
      }

      if (topic === "leviathan/arc01/thermal/humans"){
        const saved = await ThermalHuman.create({
          robot_id: data.robot_id || state.currentRobotId,
          count: Number(data.count || 0),
          humans: data.humans || [],
          frame: Number(data.frame || 0),
        });

        io.emit("human_update", {
          robot_id: saved.robot_id,
          count: saved.count,
          humans: saved.humans,
          frame: saved.frame,
          createdAt: saved.createdAt,
        });

        return;
      }

      if (topic === "leviathan/arc01/gps") {
        io.emit("gps_update", data);
        return;
      }

      if (topic === "leviathan/arc01/temp") {
        const saved = await Telemetry.create({
          robot_id: data.robot_id || state.currentRobotId,
          temperature: Number(data.temp),
          unit: data.unit || "C",
        });

        io.emit("temp_update", {
          robot_id: saved.robot_id,
          temperature: saved.temperature,
          unit: saved.unit,
          createdAt: saved.createdAt,
        });

        return;
      }

      // ✅ GAS SENSOR
      if (topic === "leviathan/arc01/gas"){
        const saved = await Gas.create({
          robot_id: data.robot_id || state.currentRobotId,
          gas_raw: Number(data.gas_raw),
          gas_voltage: Number(data.gas_voltage || 0),
          gas_status: data.gas_status || "NO_DATA",
        });

        io.emit("gas_update", {
          robot_id: saved.robot_id,
          gas_raw: saved.gas_raw,
          gas_voltage: saved.gas_voltage,
          gas_status: saved.gas_status,
          createdAt: saved.createdAt,
        });

        return;
      }
    } catch (err) {
      console.error("Message error:", err.message);
    }
  });

  return state;
};
