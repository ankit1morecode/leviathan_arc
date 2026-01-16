const mongoose = require("mongoose");

const ThermalHumanSchema = new mongoose.Schema(
  {
    robot_id: String,
    count: Number,
    humans: [
      {
        x: Number,
        y: Number,
        temp: Number
      }
    ],
    frame: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("ThermalHuman", ThermalHumanSchema);
