import { Menu, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import StatusBadge from "../common/StatusBadge";
import ConnectionDot from "../common/ConnectionDot";
import { useLiveData } from "../../context/LiveDataContext";
import { useSettings } from "../../context/SettingsContext";

export default function TopBar({ onMenuClick }) {
  const { latestReading, socketConnected } = useLiveData();
  const { settings } = useSettings();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-700 dark:bg-surface-panelDark/80 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/40 md:hidden"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Machine Monitoring — {settings.machineId}
          </h1>
          <p className="text-xs text-slate-400">Real-time machine condition monitoring</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {latestReading?.prediction && <StatusBadge status={latestReading.prediction} />}
        <ConnectionDot connected={socketConnected} label="Live" />
        <button
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/40"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
