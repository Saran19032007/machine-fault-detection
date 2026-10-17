const mongoose = require("mongoose");
const mlService = require("../services/mlService");
const { getDbStatus } = require("../config/db");

// GET /api/health
async function getHealth(req, res) {
  const dbStatus = getDbStatus();
  const ml = await mlService.checkHealth();

  const overall = dbStatus === "connected" && ml.status === "connected" ? 200 : 200;

  res.status(overall).json({
    backend: "connected",
    database: dbStatus,
    mlService: ml.status,
    mlModelLoaded: ml.modelLoaded,
    mongooseReadyState: mongoose.connection.readyState,
  });
}

module.exports = { getHealth };
