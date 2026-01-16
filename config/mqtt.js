const mqtt = require("mqtt");

module.exports = function createMQTTClient() {
  const mqttClient = mqtt.connect(process.env.MQTT_BROKER);

  mqttClient.on("connect", () => {
    console.log("Connected to MQTT broker ✅");

    const topics = [
      "leviathan/arc01/temp",
      "leviathan/arc01/pose",
      "leviathan/arc01/gps",
      "leviathan/arc01/humidity",
      "leviathan/arc01/obstacle",
      "leviathan/arc01/thermalhumans",
      "leviathan/arc01/gas",
    ];

    topics.forEach((t) => {
      mqttClient.subscribe(t, (err) => {
        if (err) console.error(`MQTT subscribe error (${t}):`, err.message);
        else console.log(`📡 Subscribed to ${t}`);
      });
    });
  });

  mqttClient.on("error", (err) => {
    console.error("MQTT connection error:", err.message);
  });

  return mqttClient;
};
