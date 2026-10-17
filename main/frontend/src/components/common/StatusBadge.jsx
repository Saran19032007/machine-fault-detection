import { CheckCircle2, Info, AlertTriangle, AlertOctagon, HelpCircle } from "lucide-react";
import { getStatusMeta } from "../../utils/statusMeta";

const ICONS = {
  "check-circle": CheckCircle2,
  info: Info,
  "alert-triangle": AlertTriangle,
  "alert-octagon": AlertOctagon,
  "help-circle": HelpCircle,
};

export default function StatusBadge({ status, size = "md" }) {
  const meta = getStatusMeta(status);
  const Icon = ICONS[meta.icon] || HelpCircle;
  const sizeClasses = size === "lg" ? "text-sm px-3 py-1.5 gap-2" : "text-xs px-2 py-1 gap-1";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${meta.bg} ${meta.border} ${meta.text} ${sizeClasses}`}
    >
      <Icon size={size === "lg" ? 16 : 14} />
      {meta.label}
    </span>
  );
}
