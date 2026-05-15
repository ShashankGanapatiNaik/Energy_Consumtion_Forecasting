import React, { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import ForecastChart from "../components/ForecastChart";
import MetricsCard from "../components/MetricsCard";

const MODELS = [
  { id: "linear_regression", label: "Linear Regression", icon: "📈", desc: "Fast, interpretable baseline" },
  { id: "random_forest", label: "Random Forest", icon: "🌲", desc: "Robust ensemble method" },
  { id: "lstm", label: "LSTM Neural Net", icon: "🧠", desc: "Deep learning time series" },
];

export default function Predictions() {
  const [selectedModel, setSelectedModel] = useState("random_forest");
  const [horizon, setHorizon] = useState(7);
  const [running, setRunning] = useState(false);
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api.get("/api/predict/history")
      .then((res) => setHistory(res.data.predictions || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await api.post("/api/predict/train", { model: selectedModel });
      toast.success(`${selectedModel.replace(/_/g, " ")} trained! MAE: ${res.data.metrics?.mae?.toFixed(2)}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Training failed");
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await api.post("/api/predict/run", { model: selectedModel, horizon });
      setResult(res.data);
      toast.success(`Forecast generated for ${horizon} days`);
      // Refresh history
      const histRes = await api.get("/api/predict/history");
      setHistory(histRes.data.predictions || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Prediction failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Energy Predictions</h2>
        <p className="text-slate-400 text-sm mt-1">Select a model, set the forecast horizon, and run a prediction.</p>
      </div>

      {/* Config panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model selection */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 font-display">Select Model</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedModel === m.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-slate-700 bg-surface-3/30 text-slate-400 hover:border-slate-500"
                }`}
              >
                <span className="text-2xl block mb-2">{m.icon}</span>
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Horizon + actions */}
        <div className="card p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 font-display">Forecast Horizon</h3>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="range"
                min={1}
                max={90}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="flex-1 accent-[#00e5a0]"
              />
              <span className="text-accent font-bold font-display w-12 text-right">{horizon}d</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-display">
              <span>1 day</span>
              <span>90 days</span>
            </div>
          </div>
          <div className="space-y-2 mt-auto">
            <button
              onClick={handleTrain}
              disabled={training || running}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              {training ? (
                <><span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />Training...</>
              ) : "🏋️ Train Model"}
            </button>
            <button
              onClick={handlePredict}
              disabled={running || training}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {running ? (
                <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />Forecasting...</>
              ) : "🔮 Run Forecast"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricsCard title="MAE" value={result.metrics?.mae?.toFixed(3)} unit="kWh" icon="📏" color="info" subtitle="Mean Absolute Error" />
            <MetricsCard title="RMSE" value={result.metrics?.rmse?.toFixed(3)} unit="kWh" icon="📐" color="warn" subtitle="Root Mean Sq Error" />
            <MetricsCard title="MAPE" value={result.metrics?.mape?.toFixed(2)} unit="%" icon="🎯" color="accent" subtitle="Mean Abs % Error" />
          </div>

          {/* Chart */}
          <ForecastChart
            data={result.results}
            title={`${selectedModel.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} — ${horizon}-Day Forecast`}
            showConfidence
          />

          {/* Table */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 font-display">Forecast Data Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="pb-3 pr-6 text-xs text-slate-400 font-display uppercase">Date</th>
                    <th className="pb-3 pr-6 text-xs text-slate-400 font-display uppercase">Predicted kWh</th>
                    <th className="pb-3 pr-6 text-xs text-slate-400 font-display uppercase">Lower Bound</th>
                    <th className="pb-3 text-xs text-slate-400 font-display uppercase">Upper Bound</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-surface-3/30 transition-colors">
                      <td className="py-2.5 pr-6 text-slate-300 font-display text-xs">{row.date}</td>
                      <td className="py-2.5 pr-6 text-accent font-semibold font-display">{row.predicted_kwh.toFixed(2)}</td>
                      <td className="py-2.5 pr-6 text-slate-500 font-display text-xs">{row.confidence?.lower?.toFixed(2)}</td>
                      <td className="py-2.5 text-slate-500 font-display text-xs">{row.confidence?.upper?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 font-display">Prediction History</h3>
        {loadingHistory ? (
          <div className="card p-6 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="card p-6 text-center text-slate-500 text-sm border border-dashed border-slate-700">
            No predictions yet. Run your first forecast above.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((p) => (
              <div key={p._id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {p.model === "lstm" ? "🧠" : p.model === "random_forest" ? "🌲" : "📈"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {p.model?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      <span className="text-slate-500 ml-2 font-normal">· {p.horizon} days</span>
                    </p>
                    <p className="text-xs text-slate-500 font-display">
                      {new Date(p.created_at).toLocaleString()} · {p.result_count} data points
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-display">
                  {p.metrics?.mae && <span className="text-slate-400">MAE: <span className="text-accent">{Number(p.metrics.mae).toFixed(2)}</span></span>}
                  {p.metrics?.mape && <span className="text-slate-400">MAPE: <span className="text-accent">{Number(p.metrics.mape).toFixed(2)}%</span></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
