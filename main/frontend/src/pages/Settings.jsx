import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import Card from "../components/common/Card";

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = (key, value) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      ...form,
      liveUpdateIntervalMs: Number(form.liveUpdateIntervalMs),
      chartWindowMinutes: Number(form.chartWindowMinutes),
      maxChartPoints: Number(form.maxChartPoints),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const next = resetSettings();
    setForm(next);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Settings</h2>

      <Card title="Connection" subtitle="Where the dashboard fetches data from">
        <form onSubmit={handleSave} className="space-y-4">
          <Field
            label="Backend URL"
            value={form.backendUrl}
            onChange={(v) => handleChange("backendUrl", v)}
            placeholder="http://localhost:5000"
          />
          <Field
            label="Machine ID"
            value={form.machineId}
            onChange={(v) => handleChange("machineId", v)}
            placeholder="MOTOR-01"
          />
          <Field
            label="Live Update Interval (ms)"
            type="number"
            value={form.liveUpdateIntervalMs}
            onChange={(v) => handleChange("liveUpdateIntervalMs", v)}
          />
          <Field
            label="Default Chart Time Window (minutes)"
            type="number"
            value={form.chartWindowMinutes}
            onChange={(v) => handleChange("chartWindowMinutes", v)}
          />
          <Field
            label="Max Points Kept In Memory"
            type="number"
            value={form.maxChartPoints}
            onChange={(v) => handleChange("maxChartPoints", v)}
          />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              <Save size={16} /> Save Settings
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/40"
            >
              <RotateCcw size={16} /> Reset Defaults
            </button>
            {saved && <span className="text-sm text-emerald-500">Saved. Reloading live connection...</span>}
          </div>
        </form>
      </Card>

      <Card title="ML Service" subtitle="Configured server-side, not exposed to the browser">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The ML prediction service URL and all secrets (MongoDB credentials, API keys) are configured
          via environment variables on the backend (<code className="rounded bg-slate-100 px-1 dark:bg-slate-700">backend/.env</code>)
          and ML service (<code className="rounded bg-slate-100 px-1 dark:bg-slate-700">ml-service/.env</code>).
          They are never exposed to this dashboard.
        </p>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-surface-dark dark:text-slate-200"
      />
    </label>
  );
}
