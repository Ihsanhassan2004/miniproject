import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.utils.csv_manager import init_db
from backend.utils.seed_data import seed_all_data
from backend.routes.auth_routes import auth_bp
from backend.routes.trip_routes import trip_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.chatbot_routes import chatbot_bp

import math
from flask.json.provider import DefaultJSONProvider

class CustomJSONProvider(DefaultJSONProvider):
    def dumps(self, obj, **kwargs):
        def clean_nan(o):
            if isinstance(o, float) and math.isnan(o):
                return None
            elif isinstance(o, dict):
                return {k: clean_nan(v) for k, v in o.items()}
            elif isinstance(o, list):
                return [clean_nan(x) for x in o]
            return o
        return super().dumps(clean_nan(obj), **kwargs)

app = Flask(__name__)
app.json = CustomJSONProvider(app)
app.config.from_object(Config)

# Enable CORS for the frontend origin
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize CSV tables and seed mock data
init_db()
seed_all_data()

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(trip_bp, url_prefix="/api")
app.register_blueprint(chatbot_bp, url_prefix="/api")
app.register_blueprint(admin_bp, url_prefix="/api/admin")

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "AI Travel Planner API"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
