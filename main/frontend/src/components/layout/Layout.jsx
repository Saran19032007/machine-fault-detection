import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import HighAlertBanner from "../dashboard/HighAlertBanner";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-panel dark:bg-surface-dark md:flex">
      <Sidebar open={menuOpen} />
      {menuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="min-w-0 flex-1">
        <TopBar onMenuClick={() => setMenuOpen((o) => !o)} />
        <HighAlertBanner />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
