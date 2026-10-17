import { Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { LiveDataProvider } from "./context/LiveDataContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import LiveMonitoring from "./pages/LiveMonitoring";
import HistoricalData from "./pages/HistoricalData";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <SettingsProvider>
      <LiveDataProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveMonitoring />} />
            <Route path="/history" element={<HistoricalData />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </LiveDataProvider>
    </SettingsProvider>
  );
}
