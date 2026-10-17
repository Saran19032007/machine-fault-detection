import { useEffect, useState } from "react";
import { sensorApi } from "../services/api";
import { useSettings } from "../context/SettingsContext";
import Card from "../components/common/Card";
import ConditionDistributionChart from "../components/charts/ConditionDistributionChart";
import { getStatusMeta } from "../utils/statusMeta";

export default function Analytics() {
  const { settings } = useSettings();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await sensorApi.getStats({ machineId: settings.machineId });
        if (!cancelled) setStats(res.data.data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load statistics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [settings.machineId]);

  if (loading && !stats) {
    return <p className="text-sm text-slate-400">Loading analytics...</p>;
  }
  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  const agg = stats?.aggregates || {};
  const counts = stats?.conditionCounts || {};

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Analytics & Statistics</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total Readings" value={stats?.totalReadings ?? 0} />
        {["normal", "low", "moderate", "high"].map((key) => (
          <StatTile
            key={key}
            label={`${getStatusMeta(key).label} Readings`}
            value={counts[key] ?? 0}
            color={getStatusMeta(key).color}
          />
        ))}
      </div>

      <Card title="Machine Condition Distribution" subtitle="Calculated from stored sensor readings">
        <ConditionDistributionChart counts={counts} />
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Temperature (°C)" avg={agg.avgTemperature} max={agg.maxTemperature} min={agg.minTemperature} />
        <MetricCard title="Current (A)" avg={agg.avgCurrent} max={agg.maxCurrent} />
        <MetricCard title="Voltage (V)" avg={agg.avgVoltage} max={agg.maxVoltage} />
        <MetricCard title="Vibration (mm/s)" avg={agg.avgVibration} max={agg.maxVibration} />
      </div>
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-surface-panelDark">
      <p className="text-2xl font-bold" style={color ? { color } : undefined}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function MetricCard({ title, avg, max, min }) {
  return (
    <Card title={title}>
      <dl className="space-y-2 text-sm">
        <Row label="Average" value={avg} />
        <Row label="Maximum" value={max} />
        {min !== undefined && <Row label="Minimum" value={min} />}
      </dl>
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-700 dark:text-slate-200">
        {value !== undefined && value !== null ? Number(value).toFixed(2) : "--"}
      </dd>
    </div>
  );
}
