const mongoose = require("mongoose");

const HumiditySchema = new mongoose.Schema(
  {
    robot_id: String,
    humidity: Number,
    unit: { type: String, default: "%" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Humidity", HumiditySchema);
