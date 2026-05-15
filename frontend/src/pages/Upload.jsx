import React, { useEffect, useState } from "react";
import UploadPanel from "../components/UploadPanel";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Upload() {
  const [datasets, setDatasets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchDatasets = async () => {
    try {
      const res = await api.get("/api/dataset/list");
      setDatasets(res.data.datasets || []);
    } catch {
      // silent
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchDatasets(); }, []);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Upload Dataset</h2>
        <p className="text-slate-400 text-sm mt-1">
          Upload a CSV file with columns: <span className="font-display text-accent">Date, Temperature, Humidity, Energy_Used</span>
        </p>
      </div>

      <UploadPanel onUploadSuccess={() => fetchDatasets()} />

      {/* Previous uploads */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 font-display">Your Uploaded Datasets</h3>
        {loadingList ? (
          <div className="card p-6 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : datasets.length === 0 ? (
          <div className="card p-6 text-center text-slate-500 text-sm border border-dashed border-slate-700">
            No datasets uploaded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {datasets.map((ds) => (
              <div key={ds._id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{ds.filename}</p>
                    <p className="text-xs text-slate-500 font-display">
                      {ds.row_count} rows · Uploaded {new Date(ds.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="badge-success">Ready</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Format guide */}
      <div className="card p-5 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">📋 CSV Format Guide</h3>
        <div className="bg-surface rounded-lg p-4 font-display text-xs text-slate-400 overflow-x-auto">
          <pre>{`Date,Temperature,Humidity,Energy_Used
2026-01-01,30,60,450
2026-01-02,32,58,480
2026-01-03,28,65,420`}</pre>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { col: "Date", desc: "YYYY-MM-DD format" },
            { col: "Temperature", desc: "Celsius, numeric" },
            { col: "Humidity", desc: "Percentage (0–100)" },
            { col: "Energy_Used", desc: "kWh, numeric" },
          ].map((f) => (
            <div key={f.col} className="flex gap-2">
              <span className="text-accent font-display text-xs">{f.col}</span>
              <span className="text-slate-500 text-xs">— {f.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
