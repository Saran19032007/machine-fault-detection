const deviceStatusService = require("../services/deviceStatusService");

// GET /api/device-status
function getDeviceStatus(req, res) {
  const machineId = req.query.machineId;
  if (machineId) {
    return res.json({ success: true, data: { [machineId]: deviceStatusService.getStatus(machineId) } });
  }
  res.json({ success: true, data: deviceStatusService.getAllStatuses() });
}

module.exports = { getDeviceStatus };
