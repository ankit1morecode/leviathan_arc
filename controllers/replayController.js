const Path = require("../models/Path");

exports.replay = async (req, res) => {
  const io = req.app.get("io");
  const mqttClient = io.mqttClient;

  const { name } = req.params;

  const savedPath = await Path.findOne({
    robot_id: io.state.currentRobotId,
    name,
  });

  if (!savedPath || savedPath.points.length === 0) {
    return res.status(404).send("❌ No saved path found");
  }

  let i = 0;

  const interval = setInterval(() => {
    if (i >= savedPath.points.length) {
      clearInterval(interval);
      console.log("Replay complete");
      return;
    }

    const p = savedPath.points[i];

    mqttClient.publish(
      "leviathan/arc01/pose",
      JSON.stringify({
        robot_id: io.state.currentRobotId,
        x: p.x,
        y: p.y,
      })
    );

    i++;
  }, 200);

  res.send(`▶ Replaying path: ${name}`);
};
