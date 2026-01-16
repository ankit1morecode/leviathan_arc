const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
  robot_id: {
    type: String,
    required: true
  },

  ts: {
    type: Date,
    default: Date.now
  },

  temperature: {
    type: Number,
    required: true
  },

  unit: {
    type: String,
    default: "C"
  }
},{
    timestamps: true
  }
);
telemetrySchema.index({ robot_id: 1, ts: -1 });
module.exports = mongoose.model("Telemetry", telemetrySchema);
