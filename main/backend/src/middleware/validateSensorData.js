const REQUIRED_FIELDS = ["voltage", "current", "temperature", "vibration"];

// Wide sanity bounds — real-world rejection happens in the ML service too,
// this just guards against malformed/garbage payloads before they're stored.
const RANGES = {
  voltage: [0, 1000],
  current: [0, 200],
  temperature: [-40, 300],
  vibration: [0, 200],
};

function validateSensorData(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object") {
    return res.status(400).json({ success: false, error: "Request body must be a JSON object" });
  }

  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }
    const value = Number(body[field]);
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      errors.push(`${field} must be a finite number`);
      continue;
    }
    const [min, max] = RANGES[field];
    if (value < min || value > max) {
      errors.push(`${field} out of valid range [${min}, ${max}]`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: "Invalid sensor data", details: errors });
  }

  req.sensorData = {
    voltage: Number(body.voltage),
    current: Number(body.current),
    temperature: Number(body.temperature),
    vibration: Number(body.vibration),
    machineId: typeof body.machineId === "string" && body.machineId.trim() ? body.machineId.trim() : undefined,
  };

  next();
}

module.exports = validateSensorData;
