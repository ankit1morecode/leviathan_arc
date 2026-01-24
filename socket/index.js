const { Server } = require("socket.io");
const Telemetry = require("../models/Telemetry");

const createMQTTClient = require("../config/mqtt");
const mqttHandler = require("../services/mqttHandler");

const Humidity = require("../models/Humidity");
const Obstacle = require("../models/Obstacle");
const ThermalHuman = require("../models/ThermalHuman");
const Gas = require("../models/Gas");
const cmdPublisher = require("../services/cmdPublisher");

module.exports = function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  const mqttClient = createMQTTClient();
  const state = mqttHandler(mqttClient, io);
  io.cmd = cmdPublisher(mqttClient);
  
  io.mqttClient = mqttClient;
  io.state = state;

  io.on("connection", async (socket) => {
    console.log("Dashboard connected ✅");

    try {
      const latestTemp = await Telemetry.findOne().sort({ createdAt: -1 });

      if(latestTemp){
        socket.emit("temp_update", {
          robot_id: latestTemp.robot_id,
          temperature: latestTemp.temperature,
          unit: latestTemp.unit,
          createdAt: latestTemp.createdAt,
        });
      }

      const last20 = await Telemetry.find().sort({ createdAt: -1 }).limit(20);

      const latestHumidity = await Humidity.findOne().sort({ createdAt: -1 });
      if (latestHumidity) socket.emit("humidity_update", latestHumidity);

      const humidityLogs = await Humidity.find().sort({ createdAt: -1 }).limit(20);
      socket.emit("humidity_logs", humidityLogs);

      const latestObs = await Obstacle.findOne().sort({ createdAt: -1 });
      if (latestObs) socket.emit("obstacle_update", latestObs);

      const obstacleLogs = await Obstacle.find().sort({ createdAt: -1 }).limit(20);
      socket.emit("obstacle_logs", obstacleLogs);

      const latestHum = await ThermalHuman.findOne().sort({ createdAt: -1 });
      if (latestHum) socket.emit("human_update", latestHum);

      const humanLogs = await ThermalHuman.find().sort({ createdAt: -1 }).limit(20);
      socket.emit("human_logs", humanLogs);

      const latestGas = await Gas.findOne().sort({ createdAt: -1 });
      if (latestGas) socket.emit("gas_update", latestGas);

      const gasLogs = await Gas.find().sort({ createdAt: -1 }).limit(20);
      socket.emit("gas_logs", gasLogs);

      socket.emit(
        "temp_logs",
        last20.map((t) => ({
          robot_id: t.robot_id,
          temperature: t.temperature,
          unit: t.unit,
          createdAt: t.createdAt,
        }))
      );
    } catch (err) {
      console.error("Socket init error:", err.message);
    }

    socket.on("disconnect", () => {
      console.log("Dashboard disconnected !");
    });
  });
  return io;
};