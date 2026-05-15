import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function UploadPanel({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [datasetId, setDatasetId] = useState(null);
  const [training, setTraining] = useState(false);
  const [trainedModel, setTrainedModel] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Only CSV files are accepted");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/dataset/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(res.data);
      setDatasetId(res.data.dataset_id);
      toast.success(`Uploaded ${res.data.row_count} rows successfully`);
      if (onUploadSuccess) onUploadSuccess(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const handleTrain = async (modelType) => {
    setTraining(true);
    try {
      const res = await api.post("/api/predict/train", {
        model: modelType,
        dataset_id: datasetId,
      });
      setTrainedModel({ type: modelType, metrics: res.data.metrics });
      toast.success(`${modelType.replace("_", " ")} model trained!`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Training failed");
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-accent bg-accent/10"
            : "border-slate-600 hover:border-slate-500 hover:bg-surface-3/30"
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">{uploading ? "⏳" : isDragActive ? "📂" : "📤"}</div>
        <p className="text-slate-300 font-medium">
          {uploading ? "Uploading & preprocessing..." : isDragActive ? "Drop your CSV here" : "Drag & drop your CSV file"}
        </p>
        <p className="text-slate-500 text-sm mt-1">or click to browse</p>
        <p className="text-slate-600 text-xs mt-3 font-display">
          Required columns: Date, Temperature, Humidity, Energy_Used
        </p>
      </div>

      {/* Preview Table */}
      {preview && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-300">Preview — {preview.filename}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{preview.row_count} rows processed</p>
            </div>
            <span className="badge-success">Preprocessed ✓</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {["Date", "Temperature (°C)", "Humidity (%)", "Energy (kWh)"].map((col) => (
                    <th key={col} className="text-left py-2 pr-4 text-slate-400 font-display">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview?.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800 hover:bg-surface-3/30">
                    <td className="py-2 pr-4 text-slate-300 font-display">{String(row.Date).slice(0, 10)}</td>
                    <td className="py-2 pr-4 text-slate-300">{Number(row.Temperature).toFixed(1)}</td>
                    <td className="py-2 pr-4 text-slate-300">{Number(row.Humidity).toFixed(1)}</td>
                    <td className="py-2 pr-4 text-accent font-medium">{Number(row.Energy_Used).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-500 mt-2">Showing first 5 rows</p>
          </div>

          {/* Train buttons */}
          <div className="mt-5 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-3">Train a forecasting model on this dataset:</p>
            <div className="flex flex-wrap gap-3">
              {["linear_regression", "random_forest", "lstm"].map((m) => (
                <button
                  key={m}
                  onClick={() => handleTrain(m)}
                  disabled={training}
                  className="btn-primary text-sm"
                >
                  {training ? "Training..." : `Train ${m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Training Result */}
      {trainedModel && (
        <div className="card border border-accent/25 bg-accent/5 p-5">
          <h3 className="text-sm font-semibold text-accent mb-3">
            ✅ {trainedModel.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — Trained Successfully
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {["mae", "rmse", "mape"].map((metric) => (
              <div key={metric} className="text-center">
                <p className="text-xs text-slate-500 font-display uppercase">{metric}</p>
                <p className="text-lg font-bold text-accent font-display">
                  {trainedModel.metrics?.[metric]?.toFixed(2) ?? "—"}
                  {metric === "mape" && "%"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
