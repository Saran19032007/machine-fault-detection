import { Zap, Activity, Thermometer, Waves } from "lucide-react";
import { useLiveData } from "../context/LiveDataContext";
import { useSettings } from "../context/SettingsContext";
import StatusCard from "../components/dashboard/StatusCard";
import SensorCard from "../components/dashboard/SensorCard";
import ProbabilityBars from "../components/dashboard/ProbabilityBars";
import HealthPanel from "../components/dashboard/HealthPanel";
import Card from "../components/common/Card";

export default function Dashboard() {
  const { latestReading, history, deviceStatus, health } = useLiveData();
  const { settings } = useSettings();

  const previous = history.length > 1 ? history[history.length - 2] : null;

  return (
    <div className="space-y-6">
      <HealthPanel
        machineId={settings.machineId}
        reading={latestReading}
        deviceStatus={deviceStatus}
        health={health}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatusCard prediction={latestReading?.prediction} confidence={latestReading?.confidence} />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          <SensorCard
            label="Voltage"
            value={latestReading?.voltage}
            previousValue={previous?.voltage}
            unit="V"
            icon={Zap}
            accent="emerald"
          />
          <SensorCard
            label="Current"
            value={latestReading?.current}
            previousValue={previous?.current}
            unit="A"
            icon={Activity}
            accent="sky"
          />
          <SensorCard
            label="Temperature"
            value={latestReading?.temperature}
            previousValue={previous?.temperature}
            unit="°C"
            icon={Thermometer}
            accent="orange"
          />
          <SensorCard
            label="Vibration"
            value={latestReading?.vibration}
            previousValue={previous?.vibration}
            unit="mm/s"
            icon={Waves}
            accent="red"
          />
        </div>

        <div className="lg:col-span-1">
          <Card title="Prediction Confidence" subtitle="Class probabilities from the ML model">
            <ProbabilityBars probabilities={latestReading?.probabilities} />
          </Card>
        </div>
      </div>

      {!latestReading && (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-slate-600">
          No sensor data received yet. Waiting for the ESP32 to send a reading to{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-700">
            POST {settings.backendUrl}/api/sensor-data
          </code>
        </div>
      )}
    </div>
  );
}
