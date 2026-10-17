import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "../services/socket";
import { sensorApi, healthApi, deviceApi } from "../services/api";
import { useSettings } from "./SettingsContext";

const LiveDataContext = createContext(null);

const MAX_ALERTS = 50;
const HEALTH_POLL_MS = 10000;

export function LiveDataProvider({ children }) {
  const { settings } = useSettings();
  const { backendUrl, machineId, maxChartPoints } = settings;

  const [latestReading, setLatestReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({ connected: false, lastSeen: null });
  const [socketConnected, setSocketConnected] = useState(false);
  const [health, setHealth] = useState({ backend: "unknown", database: "unknown", mlService: "unknown" });
  const [alerts, setAlerts] = useState([]);
  const [activeHighAlert, setActiveHighAlert] = useState(null);

  const maxPointsRef = useRef(maxChartPoints);
  maxPointsRef.current = maxChartPoints;

  const pushReading = useCallback((reading) => {
    setLatestReading(reading);
    setHistory((prev) => {
      const next = [...prev, reading];
      const cap = maxPointsRef.current || 300;
      return next.length > cap ? next.slice(next.length - cap) : next;
    });
  }, []);

  // Socket connection lifecycle.
  useEffect(() => {
    if (!backendUrl) return undefined;
    const socket = getSocket(backendUrl);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onSensorUpdate = (payload) => {
      if (!machineId || payload.machineId === machineId) {
        pushReading(payload);
      }
    };
    const onDeviceStatus = (statusMap) => {
      if (statusMap && statusMap[machineId]) {
        setDeviceStatus(statusMap[machineId]);
      }
    };
    const onAlert = (alert) => {
      if (machineId && alert.machineId !== machineId) return;
      setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("sensor:update", onSensorUpdate);
    socket.on("device:status", onDeviceStatus);
    socket.on("alert:new", onAlert);
    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("sensor:update", onSensorUpdate);
      socket.off("device:status", onDeviceStatus);
      socket.off("alert:new", onAlert);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl, machineId, pushReading]);

  // Initial hydration from REST so the dashboard isn't empty before the first socket event.
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const res = await sensorApi.getLatest(machineId);
        if (!cancelled && res.data?.data) {
          setLatestReading(res.data.data);
          if (res.data.device) setDeviceStatus(res.data.device);
        }
      } catch {
        // backend unreachable at load time — health polling below will surface this
      }
      try {
        const histRes = await sensorApi.getHistory({ machineId, limit: maxPointsRef.current || 300 });
        if (!cancelled && histRes.data?.data) {
          setHistory([...histRes.data.data].reverse());
        }
      } catch {
        // ignore
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl, machineId]);

  // Poll backend/db/ML health independently of the socket.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await healthApi.getHealth();
        if (!cancelled) setHealth(res.data);
      } catch {
        if (!cancelled) setHealth({ backend: "disconnected", database: "unknown", mlService: "unknown" });
      }
    }
    poll();
    const id = setInterval(poll, HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [backendUrl]);

  // Device status fallback poll (in case socket missed an update).
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await deviceApi.getStatus(machineId);
        if (!cancelled && res.data?.data?.[machineId]) {
          setDeviceStatus(res.data.data[machineId]);
        }
      } catch {
        // ignore, socket-driven updates are primary
      }
    }
    const id = setInterval(poll, HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [machineId]);

  // Keep the banner in sync with the machine's current condition — not just
  // socket-pushed transition events — so a HIGH status is visible even right
  // after a page reload (hydrated via REST) rather than only on the next change.
  useEffect(() => {
    if (!latestReading) return;
    if (latestReading.prediction === "high") {
      setActiveHighAlert((prev) =>
        prev && prev.timestamp === latestReading.timestamp
          ? prev
          : { ...latestReading, toStatus: "high" }
      );
    } else {
      setActiveHighAlert(null);
    }
  }, [latestReading]);

  const dismissHighAlert = useCallback(() => setActiveHighAlert(null), []);

  return (
    <LiveDataContext.Provider
      value={{
        latestReading,
        history,
        deviceStatus,
        socketConnected,
        health,
        alerts,
        activeHighAlert,
        dismissHighAlert,
      }}
    >
      {children}
    </LiveDataContext.Provider>
  );
}

export function useLiveData() {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error("useLiveData must be used within LiveDataProvider");
  return ctx;
}
