import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from dateutil import parser as date_parser


REQUIRED_COLUMNS = {"Date", "Temperature", "Humidity", "Energy_Used"}

# Column name aliases — maps alternative names → standard names
COLUMN_ALIASES = {
    "Timestamp": "Date",
    "timestamp": "Date",
    "date": "Date",
    "DATE": "Date",
    "temp": "Temperature",
    "temperature": "Temperature",
    "TEMPERATURE": "Temperature",
    "humidity": "Humidity",
    "HUMIDITY": "Humidity",
    "EnergyConsumption": "Energy_Used",
    "energy_consumption": "Energy_Used",
    "Energy_Consumption": "Energy_Used",
    "energy_used": "Energy_Used",
    "ENERGY_USED": "Energy_Used",
    "kwh": "Energy_Used",
    "kWh": "Energy_Used",
    "consumption": "Energy_Used",
    "PowerConsumption": "Energy_Used",
    "power_consumption": "Energy_Used",
}


def normalize_columns(df):
    """Rename aliased columns to standard names."""
    rename_map = {}
    for col in df.columns:
        if col in COLUMN_ALIASES:
            rename_map[col] = COLUMN_ALIASES[col]
    if rename_map:
        df = df.rename(columns=rename_map)
    return df


def validate_columns(df):
    df = normalize_columns(df)
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        # Give a helpful message showing both what's missing and what was found
        raise ValueError(
            f"Missing required columns: {missing}. "
            f"Found columns: {list(df.columns)}. "
            f"Required: Date (or Timestamp), Temperature, Humidity, Energy_Used (or EnergyConsumption)."
        )
    return df


def preprocess_dataframe(df):
    df = normalize_columns(df)
    validate_columns(df)

    # Parse dates
    df["Date"] = df["Date"].apply(lambda x: date_parser.parse(str(x)))
    df = df.sort_values("Date").reset_index(drop=True)

    # Handle nulls
    df["Temperature"] = pd.to_numeric(df["Temperature"], errors="coerce")
    df["Humidity"] = pd.to_numeric(df["Humidity"], errors="coerce")
    df["Energy_Used"] = pd.to_numeric(df["Energy_Used"], errors="coerce")

    df["Temperature"].fillna(df["Temperature"].median(), inplace=True)
    df["Humidity"].fillna(df["Humidity"].median(), inplace=True)
    df["Energy_Used"].fillna(df["Energy_Used"].median(), inplace=True)

    # Feature engineering
    df["DayOfWeek"] = df["Date"].dt.dayofweek
    df["Month"] = df["Date"].dt.month
    df["DayOfYear"] = df["Date"].dt.dayofyear
    df["IsWeekend"] = (df["DayOfWeek"] >= 5).astype(int)

    # Lag features
    df["Energy_Lag1"] = df["Energy_Used"].shift(1).fillna(df["Energy_Used"].mean())
    df["Energy_Lag7"] = df["Energy_Used"].shift(7).fillna(df["Energy_Used"].mean())
    df["Energy_RollingMean7"] = df["Energy_Used"].rolling(7, min_periods=1).mean()

    return df


def get_features_and_target(df):
    feature_cols = [
        "Temperature", "Humidity", "DayOfWeek", "Month",
        "DayOfYear", "IsWeekend", "Energy_Lag1", "Energy_Lag7", "Energy_RollingMean7"
    ]
    X = df[feature_cols].values
    y = df["Energy_Used"].values
    return X, y, feature_cols


def scale_data(X, y):
    scaler_X = MinMaxScaler()
    scaler_y = MinMaxScaler()
    X_scaled = scaler_X.fit_transform(X)
    y_scaled = scaler_y.fit_transform(y.reshape(-1, 1)).flatten()
    return X_scaled, y_scaled, scaler_X, scaler_y


def prepare_lstm_sequences(X_scaled, y_scaled, seq_len=7):
    Xs, ys = [], []
    for i in range(seq_len, len(X_scaled)):
        Xs.append(X_scaled[i - seq_len:i])
        ys.append(y_scaled[i])
    return np.array(Xs), np.array(ys)


def dataframe_to_records(df):
    records = []
    for _, row in df.iterrows():
        records.append({
            "Date": row["Date"].isoformat(),
            "Temperature": float(row["Temperature"]),
            "Humidity": float(row["Humidity"]),
            "Energy_Used": float(row["Energy_Used"]),
        })
    return records


def records_to_dataframe(records):
    df = pd.DataFrame(records)
    df["Date"] = pd.to_datetime(df["Date"])
    return df