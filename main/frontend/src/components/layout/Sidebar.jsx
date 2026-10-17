import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  History,
  BarChart3,
  Bell,
  Settings as SettingsIcon,
  Gauge,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/live", label: "Live Monitoring", icon: Activity },
  { to: "/history", label: "Historical Data", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({ open }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-60 shrink-0 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-700 dark:bg-surface-panelDark md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5 dark:border-slate-700">
        <Gauge className="text-sky-500" size={24} />
        <div>
          <p className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">MFD System</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Predictive Maintenance</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/40"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
