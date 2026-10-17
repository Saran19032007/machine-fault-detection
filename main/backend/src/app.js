const express = require("express");
const cors = require("cors");
const env = require("./config/env");

const sensorRoutes = require("./routes/sensorRoutes");
const alertRoutes = require("./routes/alertRoutes");
const healthRoutes = require("./routes/healthRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.json({ service: "MFD Backend API", status: "running" });
  });

  app.use("/api/sensor-data", sensorRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/device-status", deviceRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
