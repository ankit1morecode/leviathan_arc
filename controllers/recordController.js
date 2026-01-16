const Path = require("../models/Path");

exports.startRecord = async (req, res) => {
  const io = req.app.get("io");

  const { name } = req.params;

  io.state.currentPathName = name;
  io.state.isRecording = true;

  await Path.deleteOne({
    robot_id: io.state.currentRobotId,
    name: io.state.currentPathName,
  });

  res.send(`✅ Recording started: ${io.state.currentPathName}`);
};

exports.stopRecord = (req, res) => {
  const io = req.app.get("io");

  io.state.isRecording = false;
  res.send("⏹ Recording stopped");
};
