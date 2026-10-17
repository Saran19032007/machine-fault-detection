const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock("axios", () => ({
  create: jest.fn(() => ({ post: mockPost, get: mockGet })),
}));

const mlService = require("../src/services/mlService");

describe("mlService.getPrediction", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();
  });

  it("returns the prediction payload from the ML service", async () => {
    mockPost.mockResolvedValue({
      data: { prediction: "moderate", confidence: 0.87, probabilities: { normal: 0.03, low: 0.08, moderate: 0.87, high: 0.02 } },
    });

    const result = await mlService.getPrediction({ voltage: 420, current: 15, temperature: 54, vibration: 4.8 });

    expect(result.prediction).toBe("moderate");
    expect(result.confidence).toBe(0.87);
    expect(mockPost).toHaveBeenCalledWith("/predict", { voltage: 420, current: 15, temperature: 54, vibration: 4.8 });
  });

  it("throws MLServiceError when the ML service rejects the input (4xx)", async () => {
    mockPost.mockRejectedValue({ response: { status: 422, data: { detail: "voltage out of range" } } });

    await expect(
      mlService.getPrediction({ voltage: -1, current: 15, temperature: 54, vibration: 4.8 })
    ).rejects.toThrow(mlService.MLServiceError);
  });

  it("throws MLServiceError with 503 when the ML service is unreachable", async () => {
    mockPost.mockRejectedValue({ code: "ECONNREFUSED", message: "connect ECONNREFUSED" });

    await expect(
      mlService.getPrediction({ voltage: 420, current: 15, temperature: 54, vibration: 4.8 })
    ).rejects.toMatchObject({ status: 503 });
  });
});

describe("mlService.checkHealth", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("reports connected + modelLoaded when the ML service is healthy", async () => {
    mockGet.mockResolvedValue({ data: { status: "healthy", modelLoaded: true } });
    const health = await mlService.checkHealth();
    expect(health).toEqual({ status: "connected", modelLoaded: true });
  });

  it("reports disconnected when the ML service call fails", async () => {
    mockGet.mockRejectedValue(new Error("timeout"));
    const health = await mlService.checkHealth();
    expect(health).toEqual({ status: "disconnected", modelLoaded: false });
  });
});
