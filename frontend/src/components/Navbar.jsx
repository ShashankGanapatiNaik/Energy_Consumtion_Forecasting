import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/upload": "Upload Dataset",
  "/predictions": "Predictions",
  "/analytics": "Analytics",
  "/alerts": "Alerts & Suggestions",
  "/admin": "Admin Panel",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const title = PAGE_TITLES[location.pathname] || "EnergyIQ";
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <header className="h-16 bg-surface-2 border-b border-slate-700/50 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        <p className="text-xs text-slate-400 font-display">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-slate-200">{user?.name}</span>
          <span className="text-xs text-slate-400">{user?.email}</span>
        </div>
        <div className="relative group">
          <button className="w-9 h-9 rounded-full bg-accent text-slate-900 font-bold text-sm flex items-center justify-center hover:bg-accent-dim transition-colors">
            {initials}
          </button>
          <div className="absolute right-0 top-11 w-40 bg-surface-2 border border-slate-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
            <div className="p-3 border-b border-slate-700">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm text-slate-200 font-medium truncate">{user?.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${user?.role === "admin" ? "bg-warn/20 text-warn" : "bg-accent/20 text-accent"}`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors rounded-b-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
