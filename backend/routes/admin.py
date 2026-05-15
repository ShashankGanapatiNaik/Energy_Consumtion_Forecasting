from flask import Blueprint, request, jsonify
from routes.auth import admin_required
from models.user_model import get_all_users, delete_user
from models.prediction_model import get_all_datasets, get_all_predictions
from pymongo import MongoClient
from config import MONGO_URI

admin_bp = Blueprint("admin", __name__)
client = MongoClient(MONGO_URI)
db = client.energy_forecasting


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users = get_all_users()
    for u in users:
        u["_id"] = str(u["_id"])
        if "created_at" in u:
            u["created_at"] = u["created_at"].isoformat()
    return jsonify({"users": users, "total": len(users)}), 200


@admin_bp.route("/user/<user_id>", methods=["DELETE"])
@admin_required
def remove_user(user_id):
    if user_id == request.user_id:
        return jsonify({"error": "Cannot delete your own account"}), 400

    success = delete_user(user_id)
    if not success:
        return jsonify({"error": "User not found"}), 404

    # Also clean up user's data
    db.datasets.delete_many({"user_id": user_id})
    db.predictions.delete_many({"user_id": user_id})
    db.alerts.delete_many({"user_id": user_id})
    db.trained_models.delete_many({"user_id": user_id})

    return jsonify({"message": "User and all associated data deleted"}), 200


@admin_bp.route("/datasets", methods=["GET"])
@admin_required
def list_datasets():
    datasets = get_all_datasets()

    # Enrich with user info
    from models.user_model import find_user_by_id
    for d in datasets:
        try:
            user = find_user_by_id(d["user_id"])
            d["user_name"] = user["name"] if user else "Unknown"
            d["user_email"] = user["email"] if user else "Unknown"
        except Exception:
            d["user_name"] = "Unknown"
            d["user_email"] = "Unknown"

    return jsonify({"datasets": datasets, "total": len(datasets)}), 200


@admin_bp.route("/models", methods=["GET"])
@admin_required
def list_models():
    models = list(db.trained_models.find({}, {"model_b64": 0}))
    for m in models:
        m["_id"] = str(m["_id"])

    # Enrich with user info
    from models.user_model import find_user_by_id
    for m in models:
        try:
            user = find_user_by_id(m["user_id"])
            m["user_name"] = user["name"] if user else "Unknown"
            m["user_email"] = user["email"] if user else "Unknown"
        except Exception:
            m["user_name"] = "Unknown"
            m["user_email"] = "Unknown"

    return jsonify({"models": models, "total": len(models)}), 200


@admin_bp.route("/stats", methods=["GET"])
@admin_required
def stats():
    total_users = db.users.count_documents({})
    total_datasets = db.datasets.count_documents({})
    total_predictions = db.predictions.count_documents({})
    total_alerts = db.alerts.count_documents({})
    total_models = db.trained_models.count_documents({})

    return jsonify({
        "total_users": total_users,
        "total_datasets": total_datasets,
        "total_predictions": total_predictions,
        "total_alerts": total_alerts,
        "trained_models": total_models,
    }), 200
