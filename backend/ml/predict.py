import numpy as np
import pickle
import base64
from datetime import timedelta
from ml.preprocess import (
    preprocess_dataframe, get_features_and_target, records_to_dataframe
)


def decode_model(model_b64):
    model_bytes = base64.b64decode(model_b64)
    return pickle.loads(model_bytes)


def predict_future(model_b64, records, horizon, model_type="linear_regression"):
    df = records_to_dataframe(records)
    df = preprocess_dataframe(df)
    X, y, feature_cols = get_features_and_target(df)

    model_data = decode_model(model_b64)

    if model_type == "lstm":
        return _predict_lstm(model_data, df, horizon)
    else:
        return _predict_sklearn(model_data, df, horizon, model_type)


def _predict_sklearn(model_data, df, horizon, model_type):
    model = model_data["model"]
    scaler_X = model_data["scaler_X"]
    scaler_y = model_data["scaler_y"]

    results = []
    last_date = df["Date"].max()
    last_energy = df["Energy_Used"].values[-1]
    last_7 = df["Energy_Used"].values[-7:] if len(df) >= 7 else df["Energy_Used"].values
    rolling_mean = float(np.mean(last_7))

    for i in range(1, horizon + 1):
        forecast_date = last_date + timedelta(days=i)
        temp_mean = float(df["Temperature"].mean())
        hum_mean = float(df["Humidity"].mean())

        # Simulate seasonal temperature variation
        month = forecast_date.month
        temp_adj = temp_mean + 3 * np.sin(2 * np.pi * month / 12)

        features = np.array([[
            temp_adj,
            hum_mean,
            forecast_date.dayofweek,
            forecast_date.month,
            forecast_date.dayofyear,
            int(forecast_date.dayofweek >= 5),
            last_energy,
            float(df["Energy_Used"].values[-7]) if len(df) >= 7 else last_energy,
            rolling_mean
        ]])

        features_scaled = scaler_X.transform(features)
        pred_scaled = model.predict(features_scaled)
        pred = float(scaler_y.inverse_transform(pred_scaled.reshape(-1, 1))[0][0])
        pred = max(0, pred)

        # Confidence interval: ±8% for RF, ±15% for LR
        conf_pct = 0.08 if "forest" in model_type else 0.15
        confidence = {
            "lower": round(pred * (1 - conf_pct), 2),
            "upper": round(pred * (1 + conf_pct), 2)
        }

        results.append({
            "date": forecast_date.strftime("%Y-%m-%d"),
            "predicted_kwh": round(pred, 2),
            "confidence": confidence
        })

        last_energy = pred
        rolling_mean = float(np.mean([rolling_mean] * 6 + [pred]))

    return results


def _predict_lstm(model_data, df, horizon):
    try:
        import numpy as np
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout

        scaler_X = model_data["scaler_X"]
        scaler_y = model_data["scaler_y"]
        seq_len = model_data["seq_len"]
        config = model_data["config"]
        weights = [np.array(w) for w in model_data["weights"]]

        # Rebuild model
        model = Sequential.from_config(config)
        model.set_weights(weights)

        X, y, _ = get_features_and_target(df)
        X_scaled = scaler_X.transform(X)

        # Use last seq_len rows as seed
        seed = X_scaled[-seq_len:]
        results = []
        last_date = df["Date"].max()
        last_energy = df["Energy_Used"].values[-1]

        for i in range(1, horizon + 1):
            forecast_date = last_date + timedelta(days=i)
            seq_input = seed.reshape(1, seq_len, X.shape[1])
            pred_scaled = model.predict(seq_input, verbose=0)[0][0]
            pred = float(scaler_y.inverse_transform([[pred_scaled]])[0][0])
            pred = max(0, pred)

            confidence = {
                "lower": round(pred * 0.92, 2),
                "upper": round(pred * 1.08, 2)
            }
            results.append({
                "date": forecast_date.strftime("%Y-%m-%d"),
                "predicted_kwh": round(pred, 2),
                "confidence": confidence
            })

            # Slide window: create new feature row for next step
            new_row = seed[-1].copy()
            new_row_unscaled = scaler_X.inverse_transform([new_row])[0]
            new_row_unscaled[6] = pred  # lag1
            new_row_scaled = scaler_X.transform([new_row_unscaled])[0]
            seed = np.vstack([seed[1:], new_row_scaled])

        return results

    except Exception:
        # Fallback to sklearn-style if LSTM fails
        return _predict_sklearn(model_data, df, horizon, "random_forest")
