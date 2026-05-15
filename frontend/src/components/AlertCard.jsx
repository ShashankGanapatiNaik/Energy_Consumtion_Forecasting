import React from "react";

const TYPE_CONFIG = {
  warning: { badge: "badge-warning", icon: "⚠️", border: "border-warn/25 bg-warn/5" },
  danger: { badge: "badge-danger", icon: "🚨", border: "border-danger/25 bg-danger/5" },
  info: { badge: "badge-info", icon: "ℹ️", border: "border-info/25 bg-info/5" },
  success: { badge: "badge-success", icon: "✅", border: "border-primary-500/25 bg-primary-500/5" },
};

export default function AlertCard({ type = "info", message, timestamp }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const date = timestamp ? new Date(timestamp).toLocaleString() : "";

  return (
    <div className={`card border ${cfg.border} p-4 flex gap-3 items-start`}>
      <span className="text-xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cfg.badge}>{type}</span>
          {date && <span className="text-xs text-slate-500 font-display">{date}</span>}
        </div>
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}
