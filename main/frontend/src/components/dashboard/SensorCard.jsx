import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default function SensorCard({ label, value, unit, previousValue, icon: Icon, accent = "sky" }) {
  const hasPrev = previousValue !== undefined && previousValue !== null && value !== undefined;
  const diff = hasPrev ? value - previousValue : 0;
  const trend = !hasPrev || Math.abs(diff) < 0.01 ? "flat" : diff > 0 ? "up" : "down";

  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor =
    trend === "up" ? "text-red-500" : trend === "down" ? "text-emerald-500" : "text-slate-400";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-surface-panelDark">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {Icon && <Icon size={18} className={`text-${accent}-500`} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {value !== undefined && value !== null ? Number(value).toFixed(1) : "--"}
        </span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
      <div className={`mt-1 flex items-center gap-1 text-xs ${trendColor}`}>
        <TrendIcon size={12} />
        <span>
          {hasPrev ? `${diff > 0 ? "+" : ""}${diff.toFixed(2)} ${unit}` : "no previous reading"}
        </span>
      </div>
    </div>
  );
}
