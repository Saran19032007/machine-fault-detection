import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SettingsProvider } from "./SettingsContext";
import { LiveDataProvider, useLiveData } from "./LiveDataContext";

const listeners = {};
const mockSocket = {
  on: (event, cb) => {
    listeners[event] = cb;
  },
  off: () => {},
  connected: true,
};

vi.mock("../services/socket", () => ({
  getSocket: () => mockSocket,
}));

vi.mock("../services/api", () => ({
  sensorApi: {
    getLatest: () => Promise.resolve({ data: { data: null, device: null } }),
    getHistory: () => Promise.resolve({ data: { data: [] } }),
  },
  healthApi: {
    getHealth: () => Promise.resolve({ data: { backend: "connected", database: "connected", mlService: "connected" } }),
  },
  deviceApi: {
    getStatus: () => Promise.resolve({ data: { data: {} } }),
  },
}));

function Probe() {
  const { latestReading } = useLiveData();
  return <div data-testid="prediction">{latestReading?.prediction || "none"}</div>;
}

describe("LiveDataContext", () => {
  beforeEach(() => {
    Object.keys(listeners).forEach((k) => delete listeners[k]);
  });

  it("updates latestReading when a sensor:update socket event arrives", async () => {
    render(
      <SettingsProvider>
        <LiveDataProvider>
          <Probe />
        </LiveDataProvider>
      </SettingsProvider>
    );

    expect(screen.getByTestId("prediction").textContent).toBe("none");

    await act(async () => {
      listeners["sensor:update"]({
        machineId: "MOTOR-01",
        voltage: 420.5,
        current: 15.2,
        temperature: 54.3,
        vibration: 4.8,
        prediction: "moderate",
        confidence: 0.87,
      });
    });

    expect(screen.getByTestId("prediction").textContent).toBe("moderate");
  });
});
