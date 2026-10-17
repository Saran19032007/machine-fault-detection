import { getStatusMeta, STATUS_META } from "../../utils/statusMeta";

const ORDER = ["normal", "low", "moderate", "high"];

export default function ProbabilityBars({ probabilities }) {
  if (!probabilities) {
    return <p className="text-sm text-slate-400">No probability data available yet.</p>;
  }

  return (
    <div className="space-y-2">
      {ORDER.map((key) => {
        const meta = getStatusMeta(key);
        const value = probabilities[key] ?? 0;
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs font-medium">
              <span className={meta.text}>{meta.label}</span>
              <span className="text-slate-400">{(value * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${value * 100}%`, backgroundColor: meta.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { STATUS_META };
