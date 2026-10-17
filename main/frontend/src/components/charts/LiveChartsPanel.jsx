import { useMemo, useState } from "react";
import MiniLineChart from "./MiniLineChart";

const WINDOW_OPTIONS = [
  { label: "1 min", minutes: 1 },
  { label: "5 min", minutes: 5 },
  { label: "15 min", minutes: 15 },
  { label: "1 hour", minutes: 60 },
];

export default function LiveChartsPanel({ history }) {
  const [windowMinutes, setWindowMinutes] = useState(5);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    return history
      .filter((r) => new Date(r.timestamp).getTime() >= cutoff)
      .map((r) => ({ ...r, timestamp: new Date(r.timestamp).getTime() }));
  }, [history, windowMinutes]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Live Sensor Charts</h3>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-surface-panelDark">
          {WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              onClick={() => setWindowMinutes(opt.minutes)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                windowMinutes === opt.minutes
                  ? "bg-sky-500 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-slate-600">
          Waiting for sensor data in the selected time window...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MiniLineChart data={filtered} dataKey="temperature" label="Temperature" unit="°C" color="#f97316" />
          <MiniLineChart data={filtered} dataKey="vibration" label="Vibration" unit="mm/s" color="#dc2626" />
          <MiniLineChart data={filtered} dataKey="current" label="Current" unit="A" color="#0ea5e9" />
          <MiniLineChart data={filtered} dataKey="voltage" label="Voltage" unit="V" color="#16a34a" />
        </div>
      )}
    </div>
  );
}
