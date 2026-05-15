import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import MetricsCard from "../components/MetricsCard";
import ForecastChart from "../components/ForecastChart";
import EnergyBarChart from "../components/EnergyBarChart";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, dailyRes, monthlyRes] = await Promise.all([
          api.get("/api/analytics/summary"),
          api.get("/api/analytics/daily"),
          api.get("/api/analytics/monthly"),
        ]);
        setSummary(summaryRes.data);
        setDaily(dailyRes.data.daily || []);
        setMonthly(monthlyRes.data.monthly || []);

        // Try to get latest forecast
        try {
          const predRes = await api.get("/api/predict/history");
          const preds = predRes.data.predictions || [];
          if (preds.length > 0) {
            const latest = preds[0];
            const detailRes = await api.get(`/api/predict/history/${latest._id}`);
            setForecast((detailRes.data.results || []).slice(0, 7));
          }
        } catch {
          // No predictions yet — that's okay
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-display">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const noData = !summary || summary.total_records === 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {noData
              ? "Upload a dataset to get started with energy forecasting."
              : `Monitoring ${summary?.total_records} data points across your energy history.`}
          </p>
        </div>
      </div>

      {noData && (
        <div className="card border border-accent/25 bg-accent/5 p-6 flex items-center gap-4">
          <span className="text-3xl">📂</span>
          <div>
            <h3 className="text-sm font-semibold text-accent">No Data Yet</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Go to <strong className="text-slate-300">Upload Data</strong> to upload your CSV and start forecasting energy usage.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Today's Usage"
          value={summary?.today_kwh ?? "—"}
          unit="kWh"
          icon="⚡"
          color="accent"
          subtitle="Latest recorded value"
        />
        <MetricsCard
          title="This Month"
          value={summary?.month_kwh ?? "—"}
          unit="kWh"
          icon="📅"
          color="info"
          subtitle="Total consumption"
        />
        <MetricsCard
          title="Peak Day"
          value={summary?.peak_day ?? "—"}
          icon="🔥"
          color="warn"
          subtitle="Highest consumption day"
        />
        <MetricsCard
          title="Next Day Forecast"
          value={summary?.next_day_forecast || "—"}
          unit={summary?.next_day_forecast ? "kWh" : ""}
          icon="🔮"
          color="primary"
          subtitle={summary?.next_day_forecast ? "ML prediction" : "Run a prediction first"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnergyBarChart
          data={daily}
          dataKey="energy_kwh"
          xKey="date"
          title="Daily Consumption — Last 30 Days"
        />
        <EnergyBarChart
          data={monthly}
          dataKey="total_kwh"
          xKey="month"
          title="Monthly Totals"
          color="#38bdf8"
        />
      </div>

      {/* Forecast chart */}
      {forecast.length > 0 ? (
        <ForecastChart
          data={forecast}
          title="7-Day Energy Forecast (Latest Prediction)"
          showConfidence
        />
      ) : (
        <div className="card p-6 border border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 h-48">
          <span className="text-3xl">🔮</span>
          <p className="text-slate-400 text-sm text-center">
            No forecast available yet. Upload data, train a model, and run a prediction.
          </p>
        </div>
      )}
    </div>
  );
}
