from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models.prediction_model import get_user_alerts, save_alert
from pymongo import MongoClient
from config import MONGO_URI
from collections import defaultdict
import numpy as np

analytics_bp = Blueprint("analytics", __name__)
client = MongoClient(MONGO_URI)
db = client.energy_forecasting


def _get_user_data(user_id):
    datasets = list(db.datasets.find({"user_id": user_id}).sort("uploaded_at", -1).limit(1))
    if not datasets:
        return []
    return datasets[0].get("data", [])


@analytics_bp.route("/daily", methods=["GET"])
@token_required
def daily():
    records = _get_user_data(request.user_id)
    if not records:
        return jsonify({"error": "No data found. Please upload a dataset."}), 404

    daily_data = []
    for r in records[-30:]:  # Last 30 days
        daily_data.append({
            "date": r["Date"][:10],
            "energy_kwh": round(r["Energy_Used"], 2),
            "temperature": round(r["Temperature"], 1),
            "humidity": round(r["Humidity"], 1),
        })

    return jsonify({"daily": daily_data}), 200


@analytics_bp.route("/monthly", methods=["GET"])
@token_required
def monthly():
    records = _get_user_data(request.user_id)
    if not records:
        return jsonify({"error": "No data found. Please upload a dataset."}), 404

    monthly = defaultdict(list)
    for r in records:
        month_key = r["Date"][:7]  # YYYY-MM
        monthly[month_key].append(r["Energy_Used"])

    monthly_data = []
    for month, values in sorted(monthly.items()):
        monthly_data.append({
            "month": month,
            "total_kwh": round(sum(values), 2),
            "avg_kwh": round(np.mean(values), 2),
            "max_kwh": round(max(values), 2),
            "min_kwh": round(min(values), 2),
            "days": len(values),
        })

    return jsonify({"monthly": monthly_data}), 200


@analytics_bp.route("/peak", methods=["GET"])
@token_required
def peak():
    records = _get_user_data(request.user_id)
    if not records:
        return jsonify({"error": "No data found. Please upload a dataset."}), 404

    # Group by day-of-week to find peak patterns
    dow_usage = defaultdict(list)
    dow_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for r in records:
        from dateutil import parser
        dt = parser.parse(r["Date"])
        dow_usage[dt.weekday()].append(r["Energy_Used"])

    peak_data = []
    for dow in range(7):
        values = dow_usage.get(dow, [0])
        peak_data.append({
            "day": dow_names[dow],
            "avg_kwh": round(np.mean(values), 2),
            "max_kwh": round(max(values), 2),
            "count": len(values),
        })

    # Find overall peak day
    peak_record = max(records, key=lambda x: x["Energy_Used"])
    from dateutil import parser as dp
    peak_date = dp.parse(peak_record["Date"])

    return jsonify({
        "by_day_of_week": peak_data,
        "peak_record": {
            "date": peak_record["Date"][:10],
            "day": dow_names[peak_date.weekday()],
            "energy_kwh": round(peak_record["Energy_Used"], 2),
            "temperature": round(peak_record["Temperature"], 1),
        }
    }), 200


@analytics_bp.route("/compare", methods=["GET"])
@token_required
def compare():
    records = _get_user_data(request.user_id)
    if not records:
        return jsonify({"error": "No data found. Please upload a dataset."}), 404

    # Get latest prediction
    latest_pred = db.predictions.find_one(
        {"user_id": request.user_id},
        sort=[("created_at", -1)]
    )

    actual_map = {r["Date"][:10]: r["Energy_Used"] for r in records}
    comparison = []

    if latest_pred:
        for pred_result in latest_pred.get("results", []):
            date_str = pred_result["date"]
            comparison.append({
                "date": date_str,
                "actual": actual_map.get(date_str),
                "predicted": pred_result["predicted_kwh"],
                "confidence_lower": pred_result["confidence"]["lower"],
                "confidence_upper": pred_result["confidence"]["upper"],
            })
    else:
        # Show actual data as baseline comparison
        for r in records[-14:]:
            date_str = r["Date"][:10]
            comparison.append({
                "date": date_str,
                "actual": round(r["Energy_Used"], 2),
                "predicted": None,
                "confidence_lower": None,
                "confidence_upper": None,
            })

    return jsonify({"comparison": comparison}), 200


@analytics_bp.route("/alerts", methods=["GET"])
@token_required
def get_alerts():
    alerts = get_user_alerts(request.user_id)

    # Generate smart suggestions based on data
    records = _get_user_data(request.user_id)
    suggestions = []

    if records:
        avg_energy = np.mean([r["Energy_Used"] for r in records])
        avg_temp = np.mean([r["Temperature"] for r in records])

        if avg_temp > 28:
            suggestions.append({
                "type": "info",
                "title": "High Temperature Pattern",
                "message": "Your area experiences high temperatures. Consider setting AC to 24°C instead of 20°C to save ~15% energy.",
                "saving_estimate": "~15% reduction"
            })
        if avg_energy > 400:
            suggestions.append({
                "type": "warning",
                "title": "Above Average Consumption",
                "message": "Your energy usage is above average. Consider shifting heavy loads (washing, cooking) to off-peak evening hours.",
                "saving_estimate": "~10-20% reduction"
            })

        # Weekend vs weekday
        from dateutil import parser
        weekday_usage = [r["Energy_Used"] for r in records
                         if parser.parse(r["Date"]).weekday() < 5]
        weekend_usage = [r["Energy_Used"] for r in records
                         if parser.parse(r["Date"]).weekday() >= 5]

        if weekday_usage and weekend_usage:
            if np.mean(weekend_usage) > np.mean(weekday_usage) * 1.2:
                suggestions.append({
                    "type": "info",
                    "title": "Weekend Peak Usage",
                    "message": "Weekend usage is significantly higher. Consider staggering appliance use throughout the day on weekends.",
                    "saving_estimate": "~8% reduction"
                })

    return jsonify({
        "alerts": alerts,
        "suggestions": suggestions
    }), 200


@analytics_bp.route("/summary", methods=["GET"])
@token_required
def summary():
    records = _get_user_data(request.user_id)
    if not records:
        return jsonify({
            "today_kwh": 0, "month_kwh": 0, "peak_day": "N/A",
            "next_day_forecast": 0, "total_records": 0
        }), 200

    today_kwh = round(records[-1]["Energy_Used"], 2) if records else 0
    from dateutil import parser
    last_record_date = parser.parse(records[-1]["Date"])
    month_records = [
        r for r in records
        if parser.parse(r["Date"]).month == last_record_date.month
        and parser.parse(r["Date"]).year == last_record_date.year
    ]
    month_kwh = round(sum(r["Energy_Used"] for r in month_records), 2)

    # Peak day
    peak = max(records, key=lambda x: x["Energy_Used"])
    peak_date = parser.parse(peak["Date"])
    dow_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    peak_day = f"{dow_names[peak_date.weekday()]} ({peak['Date'][:10]})"

    # Next day forecast from latest prediction
    next_day_forecast = 0
    latest_pred = db.predictions.find_one(
        {"user_id": request.user_id},
        sort=[("created_at", -1)]
    )
    if latest_pred and latest_pred.get("results"):
        next_day_forecast = latest_pred["results"][0].get("predicted_kwh", 0)

    return jsonify({
        "today_kwh": today_kwh,
        "month_kwh": month_kwh,
        "peak_day": peak_day,
        "next_day_forecast": next_day_forecast,
        "total_records": len(records),
    }), 200
