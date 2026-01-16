const mongoose = require("mongoose");

const gasSchema = new mongoose.Schema(
  {
    robot_id: { type: String, required: true },
    gas_raw: { type: Number, required: true },
    gas_voltage: { type: Number, default: 0 },
    gas_status: {
      type: String,
      enum: ["SAFE", "WARNING", "DANGER", "NO_DATA"],
      default: "NO_DATA",
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Gas", gasSchema);