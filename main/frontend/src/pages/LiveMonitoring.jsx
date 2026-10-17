import { Zap, Activity, Thermometer, Waves } from "lucide-react";
import { useLiveData } from "../context/LiveDataContext";
import SensorCard from "../components/dashboard/SensorCard";
import LiveChartsPanel from "../components/charts/LiveChartsPanel";
import ConnectionDot from "../components/common/ConnectionDot";

export default function LiveMonitoring() {
  const { latestReading, history, socketConnected, deviceStatus } = useLiveData();
  const previous = history.length > 1 ? history[history.length - 2] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Live Monitoring</h2>
        <div className="flex gap-4">
          <ConnectionDot connected={socketConnected} label="Socket" />
          <ConnectionDot connected={!!deviceStatus?.connected} label="ESP32" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SensorCard label="Voltage" value={latestReading?.voltage} previousValue={previous?.voltage} unit="V" icon={Zap} accent="emerald" />
        <SensorCard label="Current" value={latestReading?.current} previousValue={previous?.current} unit="A" icon={Activity} accent="sky" />
        <SensorCard label="Temperature" value={latestReading?.temperature} previousValue={previous?.temperature} unit="°C" icon={Thermometer} accent="orange" />
        <SensorCard label="Vibration" value={latestReading?.vibration} previousValue={previous?.vibration} unit="mm/s" icon={Waves} accent="red" />
      </div>

      <LiveChartsPanel history={history} />
    </div>
  );
}
