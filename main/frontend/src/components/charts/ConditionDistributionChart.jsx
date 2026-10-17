import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { getStatusMeta } from "../../utils/statusMeta";

const ORDER = ["normal", "low", "moderate", "high"];

export default function ConditionDistributionChart({ counts }) {
  const data = ORDER.map((key) => ({
    name: getStatusMeta(key).label,
    value: counts?.[key] || 0,
    key,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-700" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={getStatusMeta(entry.key).color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
