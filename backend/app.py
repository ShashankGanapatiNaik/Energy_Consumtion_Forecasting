from flask import Flask
from flask_cors import CORS
from config import FLASK_PORT
from routes.auth import auth_bp
from routes.dataset import dataset_bp
from routes.prediction import prediction_bp
from routes.analytics import analytics_bp
from routes.admin import admin_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(dataset_bp, url_prefix="/api/dataset")
app.register_blueprint(prediction_bp, url_prefix="/api/predict")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
app.register_blueprint(admin_bp, url_prefix="/api/admin")

@app.route("/api/health")
def health():
    return {"status": "ok", "message": "Energy Forecasting API is running"}, 200

if __name__ == "__main__":
    app.run(debug=True, port=FLASK_PORT)
