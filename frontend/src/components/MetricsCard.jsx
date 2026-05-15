import React from "react";

export default function MetricsCard({ title, value, unit, subtitle, icon, trend, color = "accent" }) {
  const colorMap = {
    accent: "border-accent/25 bg-accent/5",
    warn: "border-warn/25 bg-warn/5",
    info: "border-info/25 bg-info/5",
    danger: "border-danger/25 bg-danger/5",
    primary: "border-primary-500/25 bg-primary-500/5",
  };
  const textMap = {
    accent: "text-accent",
    warn: "text-warn",
    info: "text-info",
    danger: "text-danger",
    primary: "text-primary-400",
  };

  return (
    <div className={`card p-5 border ${colorMap[color]} relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-display uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-display ${textMap[color]}`}>{value ?? "—"}</span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? "text-danger" : "text-primary-400"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        {icon && (
          <span className="text-2xl opacity-60 ml-2 flex-shrink-0">{icon}</span>
        )}
      </div>
    </div>
  );
}
