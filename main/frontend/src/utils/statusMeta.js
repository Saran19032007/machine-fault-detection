// Central mapping so every part of the UI describes machine condition the
// same way: label text + icon + color, never color alone (accessibility).
export const STATUS_META = {
  normal: {
    label: "NORMAL",
    description: "Machine operating within expected parameters",
    icon: "check-circle",
    color: "#16a34a",
    bg: "bg-status-normal/10",
    border: "border-status-normal",
    text: "text-status-normal",
    severity: 0,
  },
  low: {
    label: "LOW",
    description: "Minor deviation detected — monitor the trend",
    icon: "info",
    color: "#eab308",
    bg: "bg-status-low/10",
    border: "border-status-low",
    text: "text-status-low",
    severity: 1,
  },
  moderate: {
    label: "MODERATE",
    description: "Noticeable deviation — inspection recommended",
    icon: "alert-triangle",
    color: "#f97316",
    bg: "bg-status-moderate/10",
    border: "border-status-moderate",
    text: "text-status-moderate",
    severity: 2,
  },
  high: {
    label: "HIGH",
    description: "Significant deviation — immediate attention required",
    icon: "alert-octagon",
    color: "#dc2626",
    bg: "bg-status-high/10",
    border: "border-status-high",
    text: "text-status-high",
    severity: 3,
  },
};

export function getStatusMeta(status) {
  return STATUS_META[status] || {
    label: "UNKNOWN",
    description: "No prediction available yet",
    icon: "help-circle",
    color: "#94a3b8",
    bg: "bg-slate-400/10",
    border: "border-slate-400",
    text: "text-slate-400",
    severity: -1,
  };
}
