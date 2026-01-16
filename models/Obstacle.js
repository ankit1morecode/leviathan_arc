const mongoose = require("mongoose");

const ObstacleSchema = new mongoose.Schema(
  {
    robot_id: String,
    distance: Number,   // meters
    angle: Number,      // degrees
    type: String        // ultrasonic / lidar / ir
  },
  { timestamps: true }
);

module.exports = mongoose.model("Obstacle", ObstacleSchema);
