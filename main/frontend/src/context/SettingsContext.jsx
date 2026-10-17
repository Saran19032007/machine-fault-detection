import { createContext, useContext, useState, useCallback } from "react";
import { getSettings, saveSettings, resetSettings } from "../services/settingsStore";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(getSettings());

  const updateSettings = useCallback((partial) => {
    const next = saveSettings(partial);
    setSettings(next);
  }, []);

  const resetAll = useCallback(() => {
    const next = resetSettings();
    setSettings(next);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings: resetAll }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
