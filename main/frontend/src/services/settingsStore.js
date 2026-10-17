const STORAGE_KEY = "mfd_settings_v1";

const DEFAULTS = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
  machineId: import.meta.env.VITE_DEFAULT_MACHINE_ID || "MOTOR-01",
  liveUpdateIntervalMs: 2000,
  chartWindowMinutes: 5,
  maxChartPoints: 300,
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(partial) {
  const current = getSettings();
  const next = { ...current, ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — settings won't persist.
  }
  return next;
}

export function resetSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return { ...DEFAULTS };
}

export const SETTINGS_DEFAULTS = DEFAULTS;
