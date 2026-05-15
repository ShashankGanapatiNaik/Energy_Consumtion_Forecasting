# ⚡ EnergyIQ — Smart Energy Consumption Forecasting System

A full-stack machine learning application that forecasts energy consumption using React.js, Python Flask, MongoDB, and Scikit-learn / TensorFlow.

---

## 📁 Project Structure

```
energy-forecasting/
├── backend/                    # Flask API + ML engine
│   ├── app.py                  # Entry point
│   ├── config.py               # MongoDB + JWT config
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py             # JWT auth (register, login, me)
│   │   ├── dataset.py          # CSV upload & preprocessing
│   │   ├── prediction.py       # ML train & forecast endpoints
│   │   ├── analytics.py        # Dashboard stats & alerts
│   │   └── admin.py            # Admin-only management routes
│   ├── models/
│   │   ├── user_model.py       # MongoDB user schema
│   │   └── prediction_model.py # MongoDB prediction/dataset schema
│   └── ml/
│       ├── preprocess.py       # Feature engineering & cleaning
│       ├── train.py            # Train LR / RF / LSTM models
│       └── predict.py          # Multi-step forecasting
│
├── frontend/                   # React.js SPA
│   └── src/
│       ├── App.jsx             # Router & protected layout
│       ├── api/axios.js        # Axios with JWT interceptors
│       ├── context/AuthContext.jsx
│       ├── pages/              # Login, Register, Dashboard, Upload,
│       │                       # Predictions, Analytics, Alerts, AdminPanel
│       └── components/         # Navbar, Sidebar, Charts, Cards
│
└── sample_dataset.csv          # 50-row sample for testing
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB 6.0+ (local or Atlas)

---

### 1. Clone & Setup Backend

```bash
cd energy-forecasting/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

**.env** (backend):
```
MONGO_URI=mongodb://localhost:27017/energy_forecasting
JWT_SECRET=your_super_secret_key_here
FLASK_ENV=development
FLASK_PORT=5000
```

```bash
# Start the Flask server
python app.py
# → Running on http://localhost:5000
```

---

### 2. Setup Frontend

```bash
cd energy-forecasting/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit if your backend runs on a different port
```

**.env** (frontend):
```
REACT_APP_API_URL=http://localhost:5000
```

```bash
# Start the React dev server
npm start
# → Running on http://localhost:3000
```

---

## 🔑 First Run Walkthrough

1. **Register** — Go to `/register`, create an account (select Admin for full access)
2. **Upload Data** — Go to Upload page, drag & drop `sample_dataset.csv`
3. **Train a Model** — Click "Train Random Forest" (or Linear Regression / LSTM)
4. **Run Forecast** — Go to Predictions page, set horizon to 7 days, click "Run Forecast"
5. **View Analytics** — Navigate to Analytics to see daily/monthly breakdowns
6. **Check Alerts** — Automatic alerts appear when predicted usage > 500 kWh threshold

---

## 🗄️ MongoDB Collections

| Collection | Fields |
|---|---|
| `users` | `_id, name, email, password_hash, role, created_at` |
| `datasets` | `_id, user_id, filename, data[], uploaded_at` |
| `predictions` | `_id, user_id, model, horizon, results[], metrics{mae,rmse,mape}, created_at` |
| `alerts` | `_id, user_id, type, message, timestamp` |
| `trained_models` | `_id, user_id, model_type, model_b64, metrics, dataset_id` |

---

## 🤖 ML Models

| Model | Algorithm | Speed | Accuracy |
|---|---|---|---|
| Linear Regression | sklearn `LinearRegression` | Fast | Baseline |
| Random Forest | sklearn `RandomForestRegressor(n_estimators=100)` | Medium | Good |
| LSTM | Keras 2-layer LSTM (64→32 units) | Slow | Best |

**Features used:** Temperature, Humidity, Day of Week, Month, Day of Year, Is Weekend, Lag-1, Lag-7, Rolling Mean-7

**Metrics returned:** MAE (Mean Absolute Error), RMSE (Root Mean Squared Error), MAPE (Mean Absolute Percentage Error)

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user info |

### Dataset
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/dataset/upload` | JWT | Upload CSV file |
| GET | `/api/dataset/list` | JWT | List user's datasets |

### Prediction
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/predict/train` | JWT | Train ML model |
| POST | `/api/predict/run` | JWT | Run N-day forecast |
| GET | `/api/predict/history` | JWT | List past predictions |
| GET | `/api/predict/history/:id` | JWT | Prediction detail |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/summary` | JWT | Dashboard summary stats |
| GET | `/api/analytics/daily` | JWT | Daily energy totals |
| GET | `/api/analytics/monthly` | JWT | Monthly aggregation |
| GET | `/api/analytics/peak` | JWT | Peak hour/day detection |
| GET | `/api/analytics/compare` | JWT | Actual vs predicted |
| GET | `/api/analytics/alerts` | JWT | Alerts + AI suggestions |

### Admin (Admin role required)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List all users |
| DELETE | `/api/admin/user/:id` | Admin | Delete user + data |
| GET | `/api/admin/datasets` | Admin | All datasets |
| GET | `/api/admin/models` | Admin | All trained models |
| GET | `/api/admin/stats` | Admin | Platform statistics |

---

## 📊 Sample CSV Format

```csv
Date,Temperature,Humidity,Energy_Used
2026-01-01,30,60,450
2026-01-02,32,58,480
2026-01-03,28,65,420
```

A 50-row sample file is included at `sample_dataset.csv`.

---

## 🎨 Tech Stack

**Frontend:** React 18, React Router v6, Recharts, Tailwind CSS, Axios, react-hot-toast, react-dropzone

**Backend:** Python Flask, Flask-CORS, PyJWT, bcrypt, pandas, numpy, scikit-learn, TensorFlow/Keras

**Database:** MongoDB via pymongo

---

## ⚙️ Configuration

### Alert Threshold
Edit `backend/config.py`:
```python
ALERT_THRESHOLD_KWH = 500  # Alert when predicted > 500 kWh
```

### JWT Expiry
```python
JWT_EXPIRY_HOURS = 24  # Token valid for 24 hours
```

---

## 🐛 Troubleshooting

**CORS errors:** Ensure backend is running on port 5000 and `REACT_APP_API_URL` is set correctly.

**TensorFlow not available:** LSTM will automatically fall back to Random Forest. Install TF with:
```bash
pip install tensorflow==2.15.0
```

**MongoDB connection failed:** Ensure MongoDB is running:
```bash
mongod --dbpath /data/db
```

**"Dataset too small" error:** LSTM requires at least 10 rows; provide more data for best results.
