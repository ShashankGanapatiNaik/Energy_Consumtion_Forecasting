import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-display mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-slate-100 font-medium">{typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value} kWh</span>
        </div>
      ))}
    </div>
  );
};

export default function ForecastChart({ data, title = "Energy Forecast", showConfidence = true }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">No forecast data available</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    "Forecast": d.predicted_kwh,
    "Actual": d.actual ?? undefined,
    "Upper": d.confidence?.upper,
    "Lower": d.confidence?.lower,
  }));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 font-display">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="confGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00e5a0" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#64748b", fontFamily: "DM Mono" }}
            tickFormatter={(v) => v?.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748b", fontFamily: "DM Mono" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          {showConfidence && (
            <>
              <Area dataKey="Upper" stroke="none" fill="url(#confGradient)" dot={false} legendType="none" />
              <Area dataKey="Lower" stroke="none" fill="#0f172a" dot={false} legendType="none" />
            </>
          )}
          <Line dataKey="Forecast" stroke="#00e5a0" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line dataKey="Actual" stroke="#38bdf8" strokeWidth={2} dot={false} strokeDasharray="4 2" activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent inline-block" /> Forecast</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-info inline-block border-dashed" /> Actual</span>
        {showConfidence && <span className="flex items-center gap-1"><span className="w-3 h-2 bg-accent/20 inline-block rounded-sm" /> Confidence Band</span>}
      </div>
    </div>
  );
}
