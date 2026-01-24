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

  return { sendCmd };
};
