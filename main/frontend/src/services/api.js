import axios from "axios";
import { getSettings } from "./settingsStore";

const api = axios.create({ timeout: 10000 });

api.interceptors.request.use((config) => {
  config.baseURL = getSettings().backendUrl;
  return config;
});

export const sensorApi = {
  getLatest: (machineId) => api.get("/api/sensor-data/latest", { params: { machineId } }),
  getHistory: (params) => api.get("/api/sensor-data/history", { params }),
  getStats: (params) => api.get("/api/sensor-data/stats", { params }),
  exportCsvUrl: (params) => {
    const settings = getSettings();
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return `${settings.backendUrl}/api/sensor-data/export${query ? `?${query}` : ""}`;
  },
};

export const alertApi = {
  getAlerts: (params) => api.get("/api/alerts", { params }),
};

export const healthApi = {
  getHealth: () => api.get("/api/health"),
};

export const deviceApi = {
  getStatus: (machineId) => api.get("/api/device-status", { params: { machineId } }),
};

export default api;
