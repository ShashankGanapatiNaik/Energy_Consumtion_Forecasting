import React, { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card border border-slate-600 p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-base font-semibold text-slate-100 mb-2">Confirm Action</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-danger text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, datasetsRes, modelsRes, statsRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/datasets"),
        api.get("/api/admin/models"),
        api.get("/api/admin/stats"),
      ]);
      setUsers(usersRes.data.users || []);
      setDatasets(datasetsRes.data.datasets || []);
      setModels(modelsRes.data.models || []);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteUser = (userId, name) => {
    setConfirm({
      message: `Delete user "${name}" and all their data? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/api/admin/user/${userId}`);
          toast.success("User deleted");
          fetchAll();
        } catch (err) {
          toast.error(err.response?.data?.error || "Delete failed");
        }
      },
      onCancel: () => setConfirm(null),
    });
  };

  const TABS = [
    { id: "users", label: "Users", icon: "👥", count: stats?.total_users },
    { id: "datasets", label: "Datasets", icon: "📂", count: stats?.total_datasets },
    { id: "models", label: "ML Models", icon: "🧠", count: stats?.trained_models },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {confirm && <ConfirmModal {...confirm} />}

      <div>
        <h2 className="text-xl font-bold text-slate-100">Admin Panel</h2>
        <p className="text-slate-400 text-sm mt-1">Manage users, datasets, and trained models across the platform.</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Users", value: stats.total_users, color: "text-accent" },
            { label: "Datasets", value: stats.total_datasets, color: "text-info" },
            { label: "Predictions", value: stats.total_predictions, color: "text-warn" },
            { label: "Alerts", value: stats.total_alerts, color: "text-danger" },
            { label: "Models", value: stats.trained_models, color: "text-primary-400" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.count != null && (
              <span className="bg-surface-3 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Users Table */}
          {tab === "users" && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-3/50">
                  <tr className="border-b border-slate-700">
                    {["Name", "Email", "Role", "Created", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-display uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-slate-800 hover:bg-surface-3/30 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-slate-400 font-display text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={u.role === "admin" ? "badge-warning" : "badge-info"}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-display text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="text-xs text-danger hover:text-red-400 transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Datasets Table */}
          {tab === "datasets" && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-3/50">
                  <tr className="border-b border-slate-700">
                    {["Filename", "User", "Email", "Rows", "Uploaded"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-display uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((d) => (
                    <tr key={d._id} className="border-b border-slate-800 hover:bg-surface-3/30 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">📄 {d.filename}</td>
                      <td className="px-4 py-3 text-slate-300">{d.user_name}</td>
                      <td className="px-4 py-3 text-slate-400 font-display text-xs">{d.user_email}</td>
                      <td className="px-4 py-3 text-accent font-display">{d.row_count}</td>
                      <td className="px-4 py-3 text-slate-500 font-display text-xs">
                        {new Date(d.uploaded_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {datasets.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No datasets found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Models Table */}
          {tab === "models" && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-3/50">
                  <tr className="border-b border-slate-700">
                    {["Model Type", "User", "MAE", "RMSE", "MAPE"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-display uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m._id} className="border-b border-slate-800 hover:bg-surface-3/30 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {m.model_type === "lstm" ? "🧠" : m.model_type === "random_forest" ? "🌲" : "📈"}{" "}
                        {m.model_type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{m.user_name}</td>
                      <td className="px-4 py-3 text-accent font-display text-xs">
                        {m.metrics?.mae?.toFixed(3) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-warn font-display text-xs">
                        {m.metrics?.rmse?.toFixed(3) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-info font-display text-xs">
                        {m.metrics?.mape?.toFixed(2) ?? "—"}%
                      </td>
                    </tr>
                  ))}
                  {models.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No trained models found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
