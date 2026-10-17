const mongoose = require("mongoose");

const alertHistorySchema = new mongoose.Schema(
  {
    machineId: { type: String, required: true, default: "MOTOR-01", index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    fromStatus: { type: String, enum: ["normal", "low", "moderate", "high", null], default: null },
    toStatus: {
      type: String,
      required: true,
      enum: ["normal", "low", "moderate", "high"],
    },
    confidence: { type: Number, required: true },
    voltage: Number,
    current: Number,
    temperature: Number,
    vibration: Number,
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      required: true,
    },
  },
  { timestamps: false, versionKey: false }
);

module.exports = mongoose.model("AlertHistory", alertHistorySchema);
