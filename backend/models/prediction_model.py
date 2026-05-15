from pymongo import MongoClient
from config import MONGO_URI
from datetime import datetime, timezone
from bson import ObjectId

client = MongoClient(MONGO_URI)
db = client.energy_forecasting
predictions_collection = db.predictions
datasets_collection = db.datasets
alerts_collection = db.alerts


def save_dataset(user_id, filename, data):
    doc = {
        "user_id": user_id,
        "filename": filename,
        "data": data,
        "uploaded_at": datetime.now(timezone.utc),
    }
    result = datasets_collection.insert_one(doc)
    return str(result.inserted_id)


def get_user_datasets(user_id):
    datasets = list(datasets_collection.find({"user_id": user_id}))
    for d in datasets:
        d["_id"] = str(d["_id"])
        d["uploaded_at"] = d["uploaded_at"].isoformat()
        d["row_count"] = len(d.get("data", []))
        d.pop("data", None)
    return datasets


def get_dataset_by_id(dataset_id):
    return datasets_collection.find_one({"_id": ObjectId(dataset_id)})


def get_all_datasets():
    datasets = list(datasets_collection.find({}))
    for d in datasets:
        d["_id"] = str(d["_id"])
        d["uploaded_at"] = d["uploaded_at"].isoformat()
        d["row_count"] = len(d.get("data", []))
        d.pop("data", None)
    return datasets


def save_prediction(user_id, model_name, horizon, results, metrics, dataset_id=None):
    doc = {
        "user_id": user_id,
        "model": model_name,
        "horizon": horizon,
        "dataset_id": dataset_id,
        "results": results,
        "metrics": metrics,
        "created_at": datetime.now(timezone.utc),
    }
    result = predictions_collection.insert_one(doc)
    return str(result.inserted_id)


def get_user_predictions(user_id):
    preds = list(predictions_collection.find({"user_id": user_id}))
    for p in preds:
        p["_id"] = str(p["_id"])
        p["created_at"] = p["created_at"].isoformat()
    return preds


def save_alert(user_id, alert_type, message):
    doc = {
        "user_id": user_id,
        "type": alert_type,
        "message": message,
        "timestamp": datetime.now(timezone.utc),
    }
    alerts_collection.insert_one(doc)


def get_user_alerts(user_id):
    alerts = list(alerts_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(50))
    for a in alerts:
        a["_id"] = str(a["_id"])
        a["timestamp"] = a["timestamp"].isoformat()
    return alerts


def get_all_predictions():
    preds = list(predictions_collection.find({}))
    for p in preds:
        p["_id"] = str(p["_id"])
        p["created_at"] = p["created_at"].isoformat()
    return preds
