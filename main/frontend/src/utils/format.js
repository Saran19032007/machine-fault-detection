export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toFixed(decimals);
}

export function formatPercent(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${(Number(value) * 100).toFixed(decimals)}%`;
}

export function formatTimeAgo(dateInput) {
  if (!dateInput) return "never";
  const date = new Date(dateInput);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 0) return "just now";
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatClockTime(dateInput) {
  if (!dateInput) return "--";
  return new Date(dateInput).toLocaleTimeString();
}

export function formatDateTime(dateInput) {
  if (!dateInput) return "--";
  return new Date(dateInput).toLocaleString();
}
