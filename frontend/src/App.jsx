import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Predictions from "./pages/Predictions";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import AdminPanel from "./pages/AdminPanel";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

function ProtectedLayout({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-display">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-surface bg-grid-pattern bg-grid">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
            success: { iconTheme: { primary: "#00e5a0", secondary: "#0f172a" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#0f172a" } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/upload" element={<ProtectedLayout><Upload /></ProtectedLayout>} />
          <Route path="/predictions" element={<ProtectedLayout><Predictions /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
          <Route path="/alerts" element={<ProtectedLayout><Alerts /></ProtectedLayout>} />
          <Route path="/admin" element={<ProtectedLayout adminOnly><AdminPanel /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
