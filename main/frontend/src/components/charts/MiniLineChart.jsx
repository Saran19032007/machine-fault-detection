import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatClockTime } from "../../utils/format";

export default function MiniLineChart({ data, dataKey, label, unit, color = "#0ea5e9" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-surface-panelDark">
      <div className="mb-2 flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</h4>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-700" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatClockTime}
            tick={{ fontSize: 10 }}
            minTickGap={30}
          />
          <YAxis tick={{ fontSize: 10 }} width={40} domain={["auto", "auto"]} />
          <Tooltip
            labelFormatter={(v) => formatClockTime(v)}
            formatter={(value) => [`${Number(value).toFixed(2)} ${unit}`, label]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
