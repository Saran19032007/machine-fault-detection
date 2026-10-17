import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ArrowRight } from "lucide-react";
import { alertApi } from "../services/api";
import { useSettings } from "../context/SettingsContext";
import StatusBadge from "../components/common/StatusBadge";
import { formatDateTime, formatPercent } from "../utils/format";

const SEVERITY_STYLES = {
  info: "border-l-4 border-sky-400",
  warning: "border-l-4 border-amber-400",
  critical: "border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30",
};

export default function Alerts() {
  const { settings } = useSettings();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await alertApi.getAlerts({ machineId: settings.machineId, limit: 100 });
      setAlerts(res.data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load alert history");
    } finally {
      setLoading(false);
    }
  }, [settings.machineId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Alert History</h2>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/40"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading alerts...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && alerts.length === 0 && (
        <p className="text-sm text-slate-400">No condition changes recorded yet.</p>
      )}

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert._id}
            className={`flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-surface-panelDark ${SEVERITY_STYLES[alert.severity] || ""}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{formatDateTime(alert.timestamp)}</span>
              {alert.fromStatus ? <StatusBadge status={alert.fromStatus} /> : <span className="text-xs text-slate-400">(initial)</span>}
              <ArrowRight size={14} className="text-slate-300" />
              <StatusBadge status={alert.toStatus} />
            </div>
            <span className="text-xs text-slate-400">Confidence: {formatPercent(alert.confidence)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
