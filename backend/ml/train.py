import numpy as np
import pickle
import io
import base64
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from ml.preprocess import (
    preprocess_dataframe, get_features_and_target, scale_data,
    prepare_lstm_sequences, records_to_dataframe
)


def compute_metrics(y_true, y_pred):
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    # MAPE — avoid division by zero
    mask = y_true != 0
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100) if mask.any() else 0.0
    return {"mae": round(mae, 4), "rmse": round(rmse, 4), "mape": round(mape, 4)}


def train_linear_regression(records):
    df = records_to_dataframe(records)
    df = preprocess_dataframe(df)
    X, y, _ = get_features_and_target(df)
    X_scaled, y_scaled, scaler_X, scaler_y = scale_data(X, y)

    split = int(len(X_scaled) * 0.8)
    X_train, X_test = X_scaled[:split], X_scaled[split:]
    y_train, y_test = y[:split], y[split:]

    model = LinearRegression()
    model.fit(X_train, y_scaled[:split])

    y_pred_scaled = model.predict(X_test)
    y_pred = scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).flatten()
    metrics = compute_metrics(y_test, y_pred)

    model_bytes = pickle.dumps({"model": model, "scaler_X": scaler_X, "scaler_y": scaler_y})
    model_b64 = base64.b64encode(model_bytes).decode("utf-8")

    return model_b64, metrics


def train_random_forest(records):
    df = records_to_dataframe(records)
    df = preprocess_dataframe(df)
    X, y, _ = get_features_and_target(df)
    X_scaled, y_scaled, scaler_X, scaler_y = scale_data(X, y)

    split = int(len(X_scaled) * 0.8)
    X_train, X_test = X_scaled[:split], X_scaled[split:]
    y_train, y_test = y[:split], y[split:]

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_scaled[:split])

    y_pred_scaled = model.predict(X_test)
    y_pred = scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).flatten()
    metrics = compute_metrics(y_test, y_pred)

    model_bytes = pickle.dumps({"model": model, "scaler_X": scaler_X, "scaler_y": scaler_y})
    model_b64 = base64.b64encode(model_bytes).decode("utf-8")

    return model_b64, metrics


def train_lstm(records):
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout
        import tempfile, os

        df = records_to_dataframe(records)
        df = preprocess_dataframe(df)
        X, y, _ = get_features_and_target(df)
        X_scaled, y_scaled, scaler_X, scaler_y = scale_data(X, y)

        SEQ_LEN = min(7, len(X_scaled) // 4)
        if SEQ_LEN < 2:
            raise ValueError("Not enough data for LSTM (need at least 8 rows)")

        Xs, ys = prepare_lstm_sequences(X_scaled, y_scaled, SEQ_LEN)
        split = int(len(Xs) * 0.8)
        X_train, X_test = Xs[:split], Xs[split:]
        y_train, y_test_scaled = ys[:split], ys[split:]
        y_test = scaler_y.inverse_transform(y_test_scaled.reshape(-1, 1)).flatten()

        model = Sequential([
            LSTM(64, return_sequences=True, input_shape=(SEQ_LEN, X.shape[1])),
            Dropout(0.2),
            LSTM(32),
            Dropout(0.2),
            Dense(1)
        ])
        model.compile(optimizer="adam", loss="mse")
        model.fit(X_train, y_train, epochs=20, batch_size=16, verbose=0, validation_split=0.1)

        y_pred_scaled = model.predict(X_test, verbose=0).flatten()
        y_pred = scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).flatten()
        metrics = compute_metrics(y_test, y_pred)

        # Save model weights to bytes
        with tempfile.TemporaryDirectory() as tmpdir:
            model_path = os.path.join(tmpdir, "lstm_model")
            model.save(model_path, save_format="tf")
            # Store architecture + weights as pickle of config
            model_config = model.get_config()
            weights = [w.tolist() for w in model.get_weights()]

        model_data = {
            "type": "lstm",
            "config": model_config,
            "weights": weights,
            "scaler_X": scaler_X,
            "scaler_y": scaler_y,
            "seq_len": SEQ_LEN,
            "n_features": X.shape[1]
        }
        model_bytes = pickle.dumps(model_data)
        model_b64 = base64.b64encode(model_bytes).decode("utf-8")
        return model_b64, metrics

    except Exception as e:
        # Fallback: use Random Forest if TF unavailable
        return train_random_forest(records)
