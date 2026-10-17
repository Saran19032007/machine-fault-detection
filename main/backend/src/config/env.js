const dotenv = require("dotenv");

dotenv.config();

const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/mfd_system",
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://localhost:8000",
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
  DEFAULT_MACHINE_ID: process.env.DEFAULT_MACHINE_ID || "MOTOR-01",
  DEVICE_OFFLINE_THRESHOLD_SECONDS: parseInt(
    process.env.DEVICE_OFFLINE_THRESHOLD_SECONDS || "15",
    10
  ),
  ML_SERVICE_TIMEOUT_MS: parseInt(process.env.ML_SERVICE_TIMEOUT_MS || "5000", 10),
};

module.exports = env;
