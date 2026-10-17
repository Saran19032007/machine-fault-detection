const SensorReading = require("../models/SensorReading");
const AlertHistory = require("../models/AlertHistory");
const mlService = require("../services/mlService");
const socketService = require("../services/socketService");
const deviceStatusService = require("../services/deviceStatusService");
const { readingsToCSV } = require("../utils/csvExport");
const env = require("../config/env");

const SEVERITY_BY_STATUS = {
  normal: "info",
  low: "warning",
  moderate: "warning",
  high: "critical",
};

// POST /api/sensor-data
async function ingestSensorData(req, res, next) {
  try {
    const { voltage, current, temperature, vibration } = req.sensorData;
    const machineId = req.sensorData.machineId || env.DEFAULT_MACHINE_ID;

    deviceStatusService.markSeen(machineId);

    const mlResult = await mlService.getPrediction({ voltage, current, temperature, vibration });

    const timestamp = new Date();

    const reading = await SensorReading.create({
      machineId,
      timestamp,
      voltage,
      current,
      temperature,
      vibration,
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      probabilities: mlResult.probabilities,
    });

    const payload = {
      _id: reading._id,
      machineId,
      timestamp: reading.timestamp,
      voltage,
      current,
      temperature,
      vibration,
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      probabilities: mlResult.probabilities,
    };

    socketService.emitSensorUpdate(payload);

    // Detect status transitions for alert history.
    const previous = await SensorReading.findOne({ machineId, _id: { $ne: reading._id } })
      .sort({ timestamp: -1 })
      .lean();

    const previousStatus = previous ? previous.prediction : null;
    if (previousStatus !== mlResult.prediction) {
      const alert = await AlertHistory.create({
        machineId,
        timestamp,
        fromStatus: previousStatus,
        toStatus: mlResult.prediction,
        confidence: mlResult.confidence,
        voltage,
        current,
        temperature,
        vibration,
        severity: SEVERITY_BY_STATUS[mlResult.prediction],
      });
      socketService.emitAlert(alert.toObject());
    }

    res.status(201).json({
      success: true,
      data: {
        voltage,
        current,
        temperature,
        vibration,
        prediction: mlResult.prediction,
        confidence: mlResult.confidence,
        probabilities: mlResult.probabilities,
      },
    });
  } catch (err) {
    next(err);
  }
}

function buildQuery(query) {
  const filter = {};
  if (query.machineId) filter.machineId = query.machineId;
  if (query.prediction) filter.prediction = query.prediction;
  if (query.startDate || query.endDate) {
    filter.timestamp = {};
    if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
    if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
  }
  return filter;
}

// GET /api/sensor-data  and  GET /api/sensor-data/history (paginated)
async function listReadings(req, res, next) {
  try {
    const filter = buildQuery(req.query);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
    const skip = (page - 1) * limit;

    const [readings, total] = await Promise.all([
      SensorReading.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      SensorReading.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: readings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/sensor-data/latest
async function getLatest(req, res, next) {
  try {
    const machineId = req.query.machineId || env.DEFAULT_MACHINE_ID;
    const reading = await SensorReading.findOne({ machineId }).sort({ timestamp: -1 }).lean();
    const deviceStatus = deviceStatusService.getStatus(machineId);

    res.json({
      success: true,
      data: reading || null,
      device: deviceStatus,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/sensor-data/export
async function exportCSV(req, res, next) {
  try {
    const filter = buildQuery(req.query);
    const readings = await SensorReading.find(filter).sort({ timestamp: -1 }).limit(50000).lean();

    if (readings.length === 0) {
      return res.status(404).json({ success: false, error: "No data found for the given filters" });
    }

    const csv = readingsToCSV(readings);
    const filename = `sensor_data_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

// GET /api/sensor-data/stats
async function getStats(req, res, next) {
  try {
    const filter = buildQuery(req.query);

    const [countsByLabel, aggregates, total] = await Promise.all([
      SensorReading.aggregate([
        { $match: filter },
        { $group: { _id: "$prediction", count: { $sum: 1 } } },
      ]),
      SensorReading.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            avgTemperature: { $avg: "$temperature" },
            maxTemperature: { $max: "$temperature" },
            minTemperature: { $min: "$temperature" },
            avgCurrent: { $avg: "$current" },
            maxCurrent: { $max: "$current" },
            avgVoltage: { $avg: "$voltage" },
            maxVoltage: { $max: "$voltage" },
            avgVibration: { $avg: "$vibration" },
            maxVibration: { $max: "$vibration" },
          },
        },
      ]),
      SensorReading.countDocuments(filter),
    ]);

    const conditionCounts = { normal: 0, low: 0, moderate: 0, high: 0 };
    countsByLabel.forEach((c) => {
      if (conditionCounts[c._id] !== undefined) conditionCounts[c._id] = c.count;
    });

    res.json({
      success: true,
      data: {
        totalReadings: total,
        conditionCounts,
        aggregates: aggregates[0] || {},
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { ingestSensorData, listReadings, getLatest, exportCSV, getStats };
