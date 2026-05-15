import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/energy_forecasting")
JWT_SECRET = os.getenv("JWT_SECRET", "change_this_secret_in_production")
JWT_EXPIRY_HOURS = 24
FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
ALERT_THRESHOLD_KWH = 500  # Alert if predicted usage exceeds this
