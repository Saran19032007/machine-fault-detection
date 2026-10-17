const express = require("express");
const router = express.Router();

const validateSensorData = require("../middleware/validateSensorData");
const {
  ingestSensorData,
  listReadings,
  getLatest,
  exportCSV,
  getStats,
} = require("../controllers/sensorController");

// Order matters: specific routes before the generic "/" list route.
router.post("/", validateSensorData, ingestSensorData);
router.get("/latest", getLatest);
router.get("/history", listReadings);
router.get("/export", exportCSV);
router.get("/stats", getStats);
router.get("/", listReadings);

module.exports = router;
