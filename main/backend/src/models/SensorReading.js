const mongoose = require("mongoose");

const sensorReadingSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      default: "MOTOR-01",
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    voltage: { type: Number, required: true },
    current: { type: Number, required: true },
    temperature: { type: Number, required: true },
    vibration: { type: Number, required: true },
    prediction: {
      type: String,
      required: true,
      enum: ["normal", "low", "moderate", "high"],
      index: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    probabilities: {
      normal: Number,
      low: Number,
      moderate: Number,
      high: Number,
    },
  },
  { timestamps: false, versionKey: false }
);

sensorReadingSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model("SensorReading", sensorReadingSchema);
