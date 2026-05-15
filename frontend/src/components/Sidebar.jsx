import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "⚡" },
  { path: "/upload", label: "Upload Data", icon: "📂" },
  { path: "/predictions", label: "Predictions", icon: "🔮" },
  { path: "/analytics", label: "Analytics", icon: "📊" },
  { path: "/alerts", label: "Alerts", icon: "🔔" },
];

const ADMIN_ITEMS = [
  { path: "/admin", label: "Admin Panel", icon: "🛡️" },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
      isActive
        ? "bg-accent/15 text-accent border border-accent/25"
        : "text-slate-400 hover:text-slate-200 hover:bg-surface-3"
    }`;

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-56"} flex-shrink-0 bg-surface-2 border-r border-slate-700/50 flex flex-col transition-all duration-200`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700/50 gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-slate-900 font-bold text-sm flex-shrink-0">
          ⚡
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-slate-100 font-display leading-none">EnergyIQ</p>
            <p className="text-xs text-slate-500">Forecasting System</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-500 hover:text-slate-300 text-xs transition-colors"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-xs text-slate-500 font-display px-3 py-1 mb-1">NAVIGATION</p>
        )}
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path} className={navClass} title={item.label}>
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {user?.role === "admin" && (
          <>
            {!collapsed && (
              <p className="text-xs text-slate-500 font-display px-3 py-1 mt-4 mb-1">ADMIN</p>
            )}
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={navClass} title={item.label}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User info at bottom */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-accent text-slate-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">{user?.name}</p>
              <p className={`text-xs ${user?.role === "admin" ? "text-warn" : "text-accent"}`}>{user?.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
