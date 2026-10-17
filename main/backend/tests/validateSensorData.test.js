const validateSensorData = require("../src/middleware/validateSensorData");

function mockReqRes(body) {
  const req = { body };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return { req, res };
}

describe("validateSensorData middleware", () => {
  it("calls next() and attaches normalized sensorData for a valid payload", () => {
    const { req, res } = mockReqRes({ voltage: 420.5, current: 15.2, temperature: 54.3, vibration: 4.8 });
    const next = jest.fn();

    validateSensorData(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.sensorData).toEqual({
      voltage: 420.5,
      current: 15.2,
      temperature: 54.3,
      vibration: 4.8,
      machineId: undefined,
    });
  });

  it("rejects a payload missing required fields with 400", () => {
    const { req, res } = mockReqRes({ voltage: 420.5, current: 15.2 });
    const next = jest.fn();

    validateSensorData(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.stringContaining("temperature"), expect.stringContaining("vibration")])
    );
  });

  it("rejects non-finite / NaN values", () => {
    const { req, res } = mockReqRes({ voltage: "not-a-number", current: 15.2, temperature: 54.3, vibration: 4.8 });
    const next = jest.fn();

    validateSensorData(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it("rejects out-of-range values", () => {
    const { req, res } = mockReqRes({ voltage: -10, current: 15.2, temperature: 54.3, vibration: 4.8 });
    const next = jest.fn();

    validateSensorData(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body.details[0]).toMatch(/voltage/);
  });

  it("passes through a valid machineId", () => {
    const { req, res } = mockReqRes({ voltage: 1, current: 1, temperature: 1, vibration: 1, machineId: "MOTOR-02" });
    const next = jest.fn();

    validateSensorData(req, res, next);

    expect(req.sensorData.machineId).toBe("MOTOR-02");
  });
});
