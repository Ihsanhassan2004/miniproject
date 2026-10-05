import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
# Load .env from backend directory or project root
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key-ai-travel-planner")
    BASE_DIR = str(BASE_DIR)
    CSV_DATA_DIR = os.path.join(BASE_DIR, "csv_data")
    
    # OpenRouteService API Key (server-side only)
    ORS_API_KEY = os.environ.get("ORS_API_KEY", "")
    ORS_BASE_URL = "https://api.openrouteservice.org"
    
    # Google Gemini API Key (server-side only)
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    
    # Ensure the CSV directory exists
    os.makedirs(CSV_DATA_DIR, exist_ok=True)

