const mongoose = require("mongoose");

const gpsPointSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    ts: Number,
  },
  { _id: false }
);

const gpsPathSchema = new mongoose.Schema(
  {
    robot_id: { type: String, required: true },
    name: { type: String, required: true },
    points: [gpsPointSchema],
  },
  { timestamps: true }
);

gpsPathSchema.index({ robot_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("GpsPath", gpsPathSchema);