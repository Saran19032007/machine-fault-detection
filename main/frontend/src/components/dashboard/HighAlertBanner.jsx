import { AlertOctagon, X } from "lucide-react";
import { useLiveData } from "../../context/LiveDataContext";
import { useSettings } from "../../context/SettingsContext";
import { formatDateTime, formatPercent } from "../../utils/format";

export default function HighAlertBanner() {
  const { activeHighAlert, dismissHighAlert, latestReading } = useLiveData();
  const { settings } = useSettings();

  if (!activeHighAlert) return null;

  const reading = latestReading || activeHighAlert;

  return (
    <div className="mx-4 mt-4 rounded-xl border-2 border-status-high bg-red-50 p-4 shadow-md dark:bg-red-950/40 md:mx-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <AlertOctagon className="mt-0.5 shrink-0 text-status-high" size={28} />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-status-high">
              Machine Condition Alert
            </h2>
            <p className="text-xs text-red-700 dark:text-red-300">
              Machine: <strong>{settings.machineId}</strong> — Current Condition:{" "}
              <strong>HIGH</strong>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-red-800 dark:text-red-200 sm:grid-cols-4">
              <span>Temperature: <strong>{reading.temperature?.toFixed(1)} °C</strong></span>
              <span>Vibration: <strong>{reading.vibration?.toFixed(1)} mm/s</strong></span>
              <span>Current: <strong>{reading.current?.toFixed(1)} A</strong></span>
              <span>Voltage: <strong>{reading.voltage?.toFixed(1)} V</strong></span>
            </div>
            <p className="mt-2 text-[11px] text-red-500">
              Prediction Confidence: {formatPercent(activeHighAlert.confidence)} · Last Updated:{" "}
              {formatDateTime(activeHighAlert.timestamp)}
            </p>
          </div>
        </div>
        <button
          onClick={dismissHighAlert}
          className="rounded-md p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
          aria-label="Dismiss alert"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
