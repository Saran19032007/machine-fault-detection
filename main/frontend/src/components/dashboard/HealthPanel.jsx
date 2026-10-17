import ConnectionDot from "../common/ConnectionDot";
import StatusBadge from "../common/StatusBadge";
import { formatPercent, formatTimeAgo } from "../../utils/format";

export default function HealthPanel({ machineId, reading, deviceStatus, health }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <InfoBlock label="Machine">
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{machineId}</span>
      </InfoBlock>
      <InfoBlock label="Status">
        {reading?.prediction ? <StatusBadge status={reading.prediction} /> : <span className="text-slate-400">--</span>}
      </InfoBlock>
      <InfoBlock label="Confidence">
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {formatPercent(reading?.confidence)}
        </span>
      </InfoBlock>
      <InfoBlock label="Last Update">
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {reading?.timestamp ? formatTimeAgo(reading.timestamp) : "never"}
        </span>
      </InfoBlock>
      <InfoBlock label="ESP32">
        <ConnectionDot connected={!!deviceStatus?.connected} label="Device" />
      </InfoBlock>
      <InfoBlock label="Backend">
        <ConnectionDot connected={health?.backend === "connected"} label="API" />
      </InfoBlock>
      <InfoBlock label="Database">
        <ConnectionDot connected={health?.database === "connected"} label="MongoDB" />
      </InfoBlock>
      <InfoBlock label="ML Service">
        <ConnectionDot connected={health?.mlService === "connected"} label="ML" />
      </InfoBlock>
    </div>
  );
}

function InfoBlock({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-surface-panelDark">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
