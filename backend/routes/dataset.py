from flask import Blueprint, request, jsonify
import pandas as pd
import io
from routes.auth import token_required
from models.prediction_model import save_dataset, get_user_datasets
from ml.preprocess import validate_columns, normalize_columns, preprocess_dataframe, dataframe_to_records

dataset_bp = Blueprint("dataset", __name__)


@dataset_bp.route("/upload", methods=["POST"])
@token_required
def upload_dataset():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files are accepted"}), 400

    try:
        content = file.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(content))
    except Exception as e:
        return jsonify({"error": f"Could not parse CSV: {str(e)}"}), 400

    try:
        df = normalize_columns(df)
        validate_columns(df)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    try:
        df_clean = preprocess_dataframe(df.copy())
        records = dataframe_to_records(df_clean)
    except Exception as e:
        return jsonify({"error": f"Preprocessing failed: {str(e)}"}), 500

    dataset_id = save_dataset(request.user_id, file.filename, records)

    preview = records[:5]
    return jsonify({
        "message": "Dataset uploaded and preprocessed successfully",
        "dataset_id": dataset_id,
        "filename": file.filename,
        "row_count": len(records),
        "preview": preview,
        "columns": list(df.columns),
    }), 201


@dataset_bp.route("/list", methods=["GET"])
@token_required
def list_datasets():
    datasets = get_user_datasets(request.user_id)
    return jsonify({"datasets": datasets}), 200