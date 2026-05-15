import React from "react";

export default function SuggestionCard({ title, message, saving_estimate, type = "info" }) {
  const colors = {
    info: "border-info/25 bg-info/5 text-info",
    warning: "border-warn/25 bg-warn/5 text-warn",
    success: "border-primary-500/25 bg-primary-500/5 text-primary-400",
  };
  const icons = { info: "💡", warning: "⚡", success: "🌱" };

  return (
    <div className={`card border ${colors[type]} p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icons[type] || "💡"}</span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-200 mb-1">{title}</h4>
          <p className="text-sm text-slate-400">{message}</p>
          {saving_estimate && (
            <div className="mt-2 inline-flex items-center gap-1 bg-primary-500/15 border border-primary-500/25 rounded-full px-2.5 py-0.5">
              <span className="text-xs text-primary-400 font-medium">{saving_estimate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
