/**
 * Integration test for the full ESP32 -> Backend -> ML -> MongoDB flow.
 *
 * Requires a MongoDB instance reachable at TEST_MONGODB_URI (defaults to
 * mongodb://localhost:27017/mfd_system_test). The ML service call is mocked
 * so this test does not depend on the FastAPI service being up.
 */
const mongoose = require("mongoose");
const request = require("supertest");

jest.mock("../src/services/mlService", () => ({
  getPrediction: jest.fn(),
  checkHealth: jest.fn().mockResolvedValue({ status: "connected", modelLoaded: true }),
  MLServiceError: class MLServiceError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status || 502;
    }
  },
}));

const mlService = require("../src/services/mlService");
const createApp = require("../src/app");
const SensorReading = require("../src/models/SensorReading");
const AlertHistory = require("../src/models/AlertHistory");

const TEST_URI = process.env.TEST_MONGODB_URI || "mongodb://localhost:27017/mfd_system_test";

let app;

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
  app = createApp();
}, 20000);

afterEach(async () => {
  await SensorReading.deleteMany({});
  await AlertHistory.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("POST /api/sensor-data (full ingest flow)", () => {
  it("validates, predicts, stores and returns the reading", async () => {
    mlService.getPrediction.mockResolvedValue({
      prediction: "moderate",
      confidence: 0.87,
      probabilities: { normal: 0.03, low: 0.08, moderate: 0.87, high: 0.02 },
    });

    const res = await request(app)
      .post("/api/sensor-data")
      .send({ voltage: 420.5, current: 15.2, temperature: 54.3, vibration: 4.8 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.prediction).toBe("moderate");
    expect(res.body.data.confidence).toBe(0.87);

    const stored = await SensorReading.findOne({});
    expect(stored).not.toBeNull();
    expect(stored.voltage).toBe(420.5);
    expect(stored.prediction).toBe("moderate");
  });

  it("rejects invalid sensor data with 400 and does not call the ML service", async () => {
    const res = await request(app).post("/api/sensor-data").send({ voltage: 420.5, current: 15.2 });

    expect(res.status).toBe(400);
    expect(mlService.getPrediction).not.toHaveBeenCalled();

    const count = await SensorReading.countDocuments();
    expect(count).toBe(0);
  });

  it("returns 502/503 when the ML service is unavailable, and does not store a reading", async () => {
    const { MLServiceError } = require("../src/services/mlService");
    mlService.getPrediction.mockRejectedValue(new MLServiceError("ML service unavailable", 503));

    const res = await request(app)
      .post("/api/sensor-data")
      .send({ voltage: 420.5, current: 15.2, temperature: 54.3, vibration: 4.8 });

    expect(res.status).toBe(503);
    const count = await SensorReading.countDocuments();
    expect(count).toBe(0);
  });

  it("creates an AlertHistory entry when the machine condition transitions to high", async () => {
    mlService.getPrediction.mockResolvedValueOnce({
      prediction: "normal",
      confidence: 0.95,
      probabilities: { normal: 0.95, low: 0.03, moderate: 0.01, high: 0.01 },
    });
    await request(app)
      .post("/api/sensor-data")
      .send({ voltage: 400, current: 10, temperature: 40, vibration: 2 });

    mlService.getPrediction.mockResolvedValueOnce({
      prediction: "high",
      confidence: 0.94,
      probabilities: { normal: 0.01, low: 0.01, moderate: 0.04, high: 0.94 },
    });
    await request(app)
      .post("/api/sensor-data")
      .send({ voltage: 390, current: 24, temperature: 105, vibration: 20 });

    const alerts = await AlertHistory.find({}).sort({ timestamp: 1 });
    expect(alerts).toHaveLength(2);
    expect(alerts[0].toStatus).toBe("normal");
    expect(alerts[1]).toMatchObject({ fromStatus: "normal", toStatus: "high", severity: "critical" });
  });
});

describe("GET /api/sensor-data/latest", () => {
  it("returns the most recent reading for a machine", async () => {
    mlService.getPrediction.mockResolvedValue({
      prediction: "normal",
      confidence: 0.9,
      probabilities: { normal: 0.9, low: 0.05, moderate: 0.03, high: 0.02 },
    });

    await request(app).post("/api/sensor-data").send({ voltage: 400, current: 10, temperature: 40, vibration: 2 });

    const res = await request(app).get("/api/sensor-data/latest").query({ machineId: "MOTOR-01" });

    expect(res.status).toBe(200);
    expect(res.body.data.prediction).toBe("normal");
    expect(res.body.device.connected).toBe(true);
  });
});
