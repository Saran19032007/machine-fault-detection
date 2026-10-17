import { useEffect, useState, useCallback } from "react";
import { Download, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { sensorApi } from "../services/api";
import { useSettings } from "../context/SettingsContext";
import StatusBadge from "../components/common/StatusBadge";
import { formatDateTime, formatPercent } from "../utils/format";

const PAGE_SIZE = 25;

export default function HistoricalData() {
  const { settings } = useSettings();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    prediction: "",
    machineId: settings.machineId,
  });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, page, limit: PAGE_SIZE };
      Object.keys(params).forEach((k) => params[k] === "" && delete params[k]);
      const res = await sensorApi.getHistory(params);
      setRows(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load historical data");
      setRows([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const exportParams = { ...filters };
  Object.keys(exportParams).forEach((k) => exportParams[k] === "" && delete exportParams[k]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Historical Data</h2>
        <a
          href={sensorApi.exportCsvUrl(exportParams)}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600"
        >
          <Download size={16} />
          Download CSV
        </a>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-surface-panelDark sm:grid-cols-2 lg:grid-cols-5">
        <FilterInput label="Start Date" type="datetime-local" value={filters.startDate} onChange={(v) => handleFilterChange("startDate", v)} />
        <FilterInput label="End Date" type="datetime-local" value={filters.endDate} onChange={(v) => handleFilterChange("endDate", v)} />
        <FilterSelect
          label="Condition"
          value={filters.prediction}
          onChange={(v) => handleFilterChange("prediction", v)}
          options={[
            { value: "", label: "All" },
            { value: "normal", label: "Normal" },
            { value: "low", label: "Low" },
            { value: "moderate", label: "Moderate" },
            { value: "high", label: "High" },
          ]}
        />
        <FilterInput label="Machine ID" value={filters.machineId} onChange={(v) => handleFilterChange("machineId", v)} />
        <div className="flex items-end">
          <button
            onClick={fetchData}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/40"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-surface-panelDark">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Voltage (V)</th>
              <th className="px-4 py-3">Current (A)</th>
              <th className="px-4 py-3">Temperature (°C)</th>
              <th className="px-4 py-3">Vibration (mm/s)</th>
              <th className="px-4 py-3">Prediction</th>
              <th className="px-4 py-3">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-red-500">{error}</td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No readings found for the selected filters.</td></tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row._id} className="border-b border-slate-50 last:border-0 dark:border-slate-700/50">
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{formatDateTime(row.timestamp)}</td>
                <td className="px-4 py-2.5">{row.voltage?.toFixed(2)}</td>
                <td className="px-4 py-2.5">{row.current?.toFixed(2)}</td>
                <td className="px-4 py-2.5">{row.temperature?.toFixed(2)}</td>
                <td className="px-4 py-2.5">{row.vibration?.toFixed(2)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={row.prediction} /></td>
                <td className="px-4 py-2.5">{formatPercent(row.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Page {page} of {pagination.totalPages} · {pagination.total} total readings
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-surface-dark dark:text-slate-200"
      />
    </label>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-surface-dark dark:text-slate-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}
