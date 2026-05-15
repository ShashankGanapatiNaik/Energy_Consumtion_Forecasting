import React, { useEffect, useState } from "react";
import api from "../api/axios";
import AlertCard from "../components/AlertCard";
import SuggestionCard from "../components/SuggestionCard";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/api/analytics/alerts")
      .then((res) => {
        setAlerts(res.data.alerts || []);
        setSuggestions(res.data.suggestions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredAlerts = filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  const counts = alerts.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Alerts & Suggestions</h2>
        <p className="text-slate-400 text-sm mt-1">
          Automated alerts for high energy usage and AI-powered saving recommendations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { type: "warning", label: "Warnings", icon: "⚠️", color: "text-warn" },
          { type: "danger", label: "Critical", icon: "🚨", color: "text-danger" },
          { type: "info", label: "Info", icon: "ℹ️", color: "text-info" },
        ].map((s) => (
          <div key={s.type} className="card p-4 text-center">
            <span className="text-2xl">{s.icon}</span>
            <p className={`text-2xl font-bold font-display mt-1 ${s.color}`}>{counts[s.type] || 0}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 font-display flex items-center gap-2">
            <span>💡</span> AI-Powered Suggestions
          </h3>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} {...s} />
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div>
        <div className="flex gap-2 mb-4">
          {["all", "warning", "danger", "info"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-accent text-slate-900"
                  : "bg-surface-3 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && counts[f] ? ` (${counts[f]})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="card p-10 text-center border border-dashed border-slate-700">
            <span className="text-4xl block mb-3">✅</span>
            <p className="text-slate-400 text-sm">
              {alerts.length === 0
                ? "No alerts yet. Alerts are generated when predictions exceed usage thresholds."
                : `No ${filter} alerts.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <AlertCard key={alert._id} {...alert} />
            ))}
          </div>
        )}
      </div>

      {/* Default suggestions when no data */}
      {suggestions.length === 0 && !loading && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 font-display">General Energy Saving Tips</h3>
          <div className="space-y-3">
            <SuggestionCard
              type="info"
              title="Optimize AC Settings"
              message="Set your air conditioner to 24–26°C instead of 18–20°C. Each degree lower increases consumption by approximately 8%."
              saving_estimate="~15% reduction"
            />
            <SuggestionCard
              type="warning"
              title="Shift Peak Load Hours"
              message="Run heavy appliances like dishwashers and washing machines during off-peak hours (10 PM – 6 AM) to reduce grid stress and save on time-of-use tariffs."
              saving_estimate="~10–20% reduction"
            />
            <SuggestionCard
              type="success"
              title="LED & Smart Lighting"
              message="Replace incandescent bulbs with LED alternatives and install occupancy sensors. Lighting typically accounts for 15–20% of residential energy bills."
              saving_estimate="~15% reduction"
            />
          </div>
        </div>
      )}
    </div>
  );
}
