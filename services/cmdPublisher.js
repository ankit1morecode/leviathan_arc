module.exports = function cmdPublisher(mqttClient) {
  const TOPIC = "leviathan/arc01/cmd";

  function sendCmd(cmd) {
    const valid = ["START", "RTB", "STOP"];
    if (!valid.includes(cmd)) throw new Error("Invalid command");

    mqttClient.publish(TOPIC, cmd, { qos: 0 }, (err) => {
      if (err) console.log("❌ CMD publish failed:", err.message);
      else console.log("✅ CMD sent:", cmd);
    });
  }

  const mqtt = require("./mqttHandler");
const GpsPath = require("../models/GpsPath");

async function sendRTB() {
  // Get last recorded path
  const lastPath = await GpsPath.findOne()
    .sort({ createdAt: -1 })
    .lean();

  if (!lastPath || !lastPath.points.length) {
    throw new Error("No recorded path available for RTB");
  }

  // Reverse path for RTB
  const reversed = [...lastPath.points].reverse();

  // Send to ESP32
  mqtt.publish("leviathan/arc01/cmd/rtb", JSON.stringify({
    type: "RTB",
    path: reversed
  }));

  console.log("🏠 RTB command sent with", reversed.length, "waypoints");
}

module.exports = {
  sendRTB,
};
  return { sendCmd };
};