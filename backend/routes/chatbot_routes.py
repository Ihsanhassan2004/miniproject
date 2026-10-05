import datetime
import jwt
from flask import Blueprint, request, jsonify
from backend.utils.csv_manager import insert_row
from backend.utils.auth import Config
from backend.services.chatbot import respond_to_query

chatbot_bp = Blueprint("chatbot", __name__)

@chatbot_bp.route("/chatbot", methods=["POST"])
def chat():
    """
    Accepts a user question, runs it through the travel chatbot service,
    logs the interaction, and returns the response along with suggestions and actions.
    """
    data = request.get_json() or {}
    message = data.get("message", "")
    
    if not message:
        return jsonify({
            "response": "I didn't receive any message. How can I help you?",
            "suggestions": ["Suggest hill stations", "Places under ₹15,000", "Weather in Munnar"]
        }), 400
        
    # Attempt to resolve user_id if token is attached
    user_id = 0
    token = None
    if "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if token:
        try:
            decoded = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            user_id = int(decoded.get("user_id", 0))
        except Exception:
            pass
            
    # Get response
    raw_result = respond_to_query(message, user_id)
    
    if isinstance(raw_result, dict):
        response_text = raw_result.get("response", "")
        suggestions = raw_result.get("suggestions", [])
        action = raw_result.get("action", None)
    else:
        response_text = str(raw_result)
        suggestions = []
        action = None
    
    # Log the chat entry
    log_row = {
        "user_id": user_id,
        "message": message,
        "response": response_text[:500],
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    insert_row("chatbot_logs", log_row)
    
    return jsonify({
        "response": response_text,
        "suggestions": suggestions,
        "action": action
    }), 200
