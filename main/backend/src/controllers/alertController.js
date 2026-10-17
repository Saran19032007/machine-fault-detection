const AlertHistory = require("../models/AlertHistory");

// GET /api/alerts
async function listAlerts(req, res, next) {
  try {
    const filter = {};
    if (req.query.machineId) filter.machineId = req.query.machineId;
    if (req.query.severity) filter.severity = req.query.severity;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      AlertHistory.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AlertHistory.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAlerts };
