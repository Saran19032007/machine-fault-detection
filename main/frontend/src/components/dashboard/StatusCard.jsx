import { CheckCircle2, Info, AlertTriangle, AlertOctagon, HelpCircle } from "lucide-react";
import { getStatusMeta } from "../../utils/statusMeta";
import { formatPercent } from "../../utils/format";

const ICONS = {
  "check-circle": CheckCircle2,
  info: Info,
  "alert-triangle": AlertTriangle,
  "alert-octagon": AlertOctagon,
  "help-circle": HelpCircle,
};

export default function StatusCard({ prediction, confidence }) {
  const meta = getStatusMeta(prediction);
  const Icon = ICONS[meta.icon] || HelpCircle;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-8 text-center shadow-sm ${meta.bg} ${meta.border}`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        Current Machine Condition
      </p>
      <Icon size={56} className={`my-3 ${meta.text}`} />
      <h2 className={`text-4xl font-black tracking-tight ${meta.text}`}>{meta.label}</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">{meta.description}</p>
      <div className="mt-4 flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
        Confidence: {formatPercent(confidence)}
      </div>
    </div>
  );
}
