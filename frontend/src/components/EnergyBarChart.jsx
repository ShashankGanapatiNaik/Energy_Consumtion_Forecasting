import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-display mb-1">{label}</p>
      <p className="text-accent font-semibold">{payload[0]?.value?.toFixed(1)} kWh</p>
    </div>
  );
};

export default function EnergyBarChart({ data, dataKey = "energy_kwh", xKey = "date", title = "Energy Usage", color = "#00e5a0" }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">No data available</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d[dataKey] || 0));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 font-display">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10, fill: "#64748b", fontFamily: "DM Mono" }}
            tickFormatter={(v) => String(v).slice(-5)}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748b", fontFamily: "DM Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey={dataKey} radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry[dataKey] === maxVal ? "#00e5a0" : `${color}60`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
