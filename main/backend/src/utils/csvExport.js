const { Parser } = require("json2csv");

const FIELDS = [
  { label: "Timestamp", value: (row) => new Date(row.timestamp).toISOString() },
  { label: "Machine ID", value: "machineId" },
  { label: "Voltage (V)", value: "voltage" },
  { label: "Current (A)", value: "current" },
  { label: "Temperature (°C)", value: "temperature" },
  { label: "Vibration (mm/s)", value: "vibration" },
  { label: "Prediction", value: "prediction" },
  { label: "Confidence", value: (row) => (row.confidence != null ? `${(row.confidence * 100).toFixed(2)}%` : "") },
];

function readingsToCSV(readings) {
  const parser = new Parser({ fields: FIELDS });
  return parser.parse(readings.map((r) => (r.toObject ? r.toObject() : r)));
}

module.exports = { readingsToCSV };
