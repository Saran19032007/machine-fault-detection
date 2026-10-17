const axios = require("axios");
const env = require("../config/env");

const client = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: env.ML_SERVICE_TIMEOUT_MS,
});

class MLServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "MLServiceError";
    this.status = status || 502;
  }
}

async function getPrediction({ voltage, current, temperature, vibration }) {
  try {
    const response = await client.post("/predict", {
      voltage,
      current,
      temperature,
      vibration,
    });
    return response.data; // { prediction, confidence, probabilities }
  } catch (err) {
    if (err.response) {
      const detail = err.response.data && err.response.data.detail;
      throw new MLServiceError(
        `ML service rejected input: ${JSON.stringify(detail || err.response.data)}`,
        err.response.status
      );
    }
    if (err.code === "ECONNABORTED") {
      throw new MLServiceError("ML service request timed out", 504);
    }
    throw new MLServiceError(`ML service unavailable: ${err.message}`, 503);
  }
}

async function checkHealth() {
  try {
    const response = await client.get("/health", { timeout: 3000 });
    return {
      status: response.data.status === "healthy" ? "connected" : "degraded",
      modelLoaded: !!response.data.modelLoaded,
    };
  } catch (err) {
    return { status: "disconnected", modelLoaded: false };
  }
}

module.exports = { getPrediction, checkHealth, MLServiceError };
