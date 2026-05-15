from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models.prediction_model import (
    get_dataset_by_id, get_user_datasets, save_prediction,
    get_user_predictions, save_alert
)
from ml.train import train_linear_regression, train_random_forest, train_lstm
from ml.predict import predict_future
from config import ALERT_THRESHOLD_KWH
from pymongo import MongoClient
from config import MONGO_URI
from bson import ObjectId

prediction_bp = Blueprint("prediction", __name__)

client = MongoClient(MONGO_URI)
db = client.energy_forecasting
trained_models_collection = db.trained_models


def _get_latest_dataset(user_id):
    datasets = list(db.datasets.find({"user_id": user_id}).sort("uploaded_at", -1).limit(1))
    return datasets[0] if datasets else None


@prediction_bp.route("/train", methods=["POST"])
@token_required
def train():
    data = request.get_json() or {}
    model_type = data.get("model", "random_forest")
    dataset_id = data.get("dataset_id")

    if dataset_id:
        dataset = get_dataset_by_id(dataset_id)
        if not dataset or dataset.get("user_id") != request.user_id:
            return jsonify({"error": "Dataset not found"}), 404
    else:
        dataset = _get_latest_dataset(request.user_id)
        if not dataset:
            return jsonify({"error": "No dataset found. Please upload a dataset first."}), 404

    records = dataset.get("data", [])
    if len(records) < 10:
        return jsonify({"error": "Dataset too small. Need at least 10 rows."}), 422

    try:
        if model_type == "linear_regression":
            model_b64, metrics = train_linear_regression(records)
        elif model_type == "random_forest":
            model_b64, metrics = train_random_forest(records)
        elif model_type == "lstm":
            model_b64, metrics = train_lstm(records)
        else:
            return jsonify({"error": f"Unknown model type: {model_type}"}), 400
    except Exception as e:
        return jsonify({"error": f"Training failed: {str(e)}"}), 500

    # Store trained model
    trained_models_collection.update_one(
        {"user_id": request.user_id, "model_type": model_type},
        {"$set": {
            "user_id": request.user_id,
            "model_type": model_type,
            "model_b64": model_b64,
            "metrics": metrics,
            "dataset_id": str(dataset["_id"]),
        }},
        upsert=True
    )

    return jsonify({
        "message": f"{model_type} model trained successfully",
        "model": model_type,
        "metrics": metrics
    }), 200


@prediction_bp.route("/run", methods=["POST"])
@token_required
def run_prediction():
    data = request.get_json() or {}
    model_type = data.get("model", "random_forest")
    horizon = int(data.get("horizon", 7))

    if horizon < 1 or horizon > 90:
        return jsonify({"error": "Horizon must be between 1 and 90 days"}), 400

    # Get trained model
    trained = trained_models_collection.find_one(
        {"user_id": request.user_id, "model_type": model_type}
    )
    if not trained:
        return jsonify({"error": f"No trained {model_type} model found. Please train first."}), 404

    # Get dataset
    dataset_id = trained.get("dataset_id")
    if dataset_id:
        dataset = get_dataset_by_id(dataset_id)
    else:
        dataset = _get_latest_dataset(request.user_id)

    if not dataset:
        return jsonify({"error": "Dataset not found"}), 404

    records = dataset.get("data", [])

    try:
        results = predict_future(trained["model_b64"], records, horizon, model_type)
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    metrics = trained.get("metrics", {})

    # Save prediction
    pred_id = save_prediction(
        request.user_id, model_type, horizon, results, metrics, dataset_id
    )

    # Generate alerts for high predictions
    for r in results:
        if r["predicted_kwh"] > ALERT_THRESHOLD_KWH:
            save_alert(
                request.user_id,
                "warning",
                f"High energy usage predicted on {r['date']}: {r['predicted_kwh']} kWh (threshold: {ALERT_THRESHOLD_KWH} kWh)"
            )

    return jsonify({
        "prediction_id": pred_id,
        "model": model_type,
        "horizon": horizon,
        "results": results,
        "metrics": metrics
    }), 200


@prediction_bp.route("/history", methods=["GET"])
@token_required
def prediction_history():
    predictions = get_user_predictions(request.user_id)
    # Remove bulky results for list view
    for p in predictions:
        p["result_count"] = len(p.get("results", []))
        p.pop("results", None)
    return jsonify({"predictions": predictions}), 200


@prediction_bp.route("/history/<pred_id>", methods=["GET"])
@token_required
def get_prediction_detail(pred_id):
    from bson import ObjectId
    pred = db.predictions.find_one({"_id": ObjectId(pred_id), "user_id": request.user_id})
    if not pred:
        return jsonify({"error": "Prediction not found"}), 404
    pred["_id"] = str(pred["_id"])
    pred["created_at"] = pred["created_at"].isoformat()
    return jsonify(pred), 200
