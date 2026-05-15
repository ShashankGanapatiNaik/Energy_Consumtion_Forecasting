import React, { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import EnergyBarChart from "../components/EnergyBarChart";
import ForecastChart from "../components/ForecastChart";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";

function PeakHeatmap({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.avg_kwh));
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 font-display">Peak Usage by Day of Week</h3>
      <div className="space-y-2">
        {data.map((d) => {
          const pct = max ? (d.avg_kwh / max) * 100 : 0;
          const isMax = d.avg_kwh === max;
          return (
            <div key={d.day} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-display w-12 flex-shrink-0">{d.day.slice(0, 3)}</span>
              <div className="flex-1 bg-surface-3 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isMax ? "bg-accent" : "bg-accent/40"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-xs font-display w-16 text-right ${isMax ? "text-accent font-bold" : "text-slate-400"}`}>
                {d.avg_kwh.toFixed(1)} kWh
              </span>
              {isMax && <span className="badge-warning text-xs">PEAK</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareChart({ data }) {
  if (!data || data.length === 0) return null;
  const filtered = data.filter((d) => d.actual != null || d.predicted != null);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface-2 border border-slate-600 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-slate-300 font-display mb-1">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex gap-2 mb-0.5">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="text-slate-100">{p.value?.toFixed(1)} kWh</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 font-display">Actual vs Predicted Comparison</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={filtered} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b", fontFamily: "DM Mono" }} tickFormatter={(v) => v?.slice(5)} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#64748b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
          <Line type="monotone" dataKey="actual" stroke="#38bdf8" strokeWidth={2} dot={false} name="Actual" />
          <Line type="monotone" dataKey="predicted" stroke="#00e5a0" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Predicted" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Analytics() {
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [peak, setPeak] = useState(null);
  const [compare, setCompare] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dailyRes, monthlyRes, peakRes, compareRes] = await Promise.allSettled([
          api.get("/api/analytics/daily"),
          api.get("/api/analytics/monthly"),
          api.get("/api/analytics/peak"),
          api.get("/api/analytics/compare"),
        ]);
        if (dailyRes.status === "fulfilled") setDaily(dailyRes.value.data.daily || []);
        if (monthlyRes.status === "fulfilled") setMonthly(monthlyRes.value.data.monthly || []);
        if (peakRes.status === "fulfilled") setPeak(peakRes.value.data);
        if (compareRes.status === "fulfilled") setCompare(compareRes.value.data.comparison || []);
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (daily.length === 0) {
    return (
      <div className="max-w-4xl">
        <h2 className="text-xl font-bold text-slate-100 mb-4">Analytics</h2>
        <div className="card p-10 text-center border border-dashed border-slate-700">
          <span className="text-4xl block mb-3">📊</span>
          <p className="text-slate-400">No data available. Upload a dataset first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Analytics</h2>
        <p className="text-slate-400 text-sm mt-1">Deep insights into your energy consumption patterns.</p>
      </div>

      {/* Peak Record Banner */}
      {peak?.peak_record && (
        <div className="card border border-warn/25 bg-warn/5 p-4 flex items-center gap-4">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-semibold text-warn">All-Time Peak Consumption</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {peak.peak_record.date} ({peak.peak_record.day}) — {peak.peak_record.energy_kwh} kWh at {peak.peak_record.temperature}°C
            </p>
          </div>
        </div>
      )}

      {/* Daily + Monthly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnergyBarChart data={daily} dataKey="energy_kwh" xKey="date" title="Daily Usage — Last 30 Days" />
        <EnergyBarChart data={monthly} dataKey="total_kwh" xKey="month" title="Monthly Totals" color="#38bdf8" />
      </div>

      {/* Peak heatmap */}
      {peak?.by_day_of_week && <PeakHeatmap data={peak.by_day_of_week} />}

      {/* Actual vs Predicted */}
      <CompareChart data={compare} />

      {/* Stats summary */}
      {monthly.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 font-display">Monthly Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  {["Month", "Total kWh", "Avg/Day", "Peak Day", "Min Day", "Days"].map((h) => (
                    <th key={h} className="pb-3 pr-6 text-xs text-slate-400 font-display uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.month} className="border-b border-slate-800 hover:bg-surface-3/30 transition-colors">
                    <td className="py-2.5 pr-6 text-slate-300 font-display text-xs">{m.month}</td>
                    <td className="py-2.5 pr-6 text-accent font-semibold font-display">{m.total_kwh.toFixed(1)}</td>
                    <td className="py-2.5 pr-6 text-slate-400 font-display text-xs">{m.avg_kwh.toFixed(1)}</td>
                    <td className="py-2.5 pr-6 text-warn font-display text-xs">{m.max_kwh.toFixed(1)}</td>
                    <td className="py-2.5 pr-6 text-info font-display text-xs">{m.min_kwh.toFixed(1)}</td>
                    <td className="py-2.5 text-slate-500 font-display text-xs">{m.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
