import datetime
from functools import wraps
import jwt
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from backend.config import Config
from backend.utils.csv_manager import find_by_id

def hash_password(password):
    """Hashes a password using Werkzeug's default pbkdf2:sha256 method."""
    return generate_password_hash(password)

def check_password(hashed_password, password):
    """Checks if a password matches its hashed form."""
    if not hashed_password or not password:
        return False
    return check_password_hash(hashed_password, password)

def generate_token(user_id, username, is_admin=False):
    """Generates a JWT token valid for 24 hours."""
    payload = {
        "user_id": int(user_id),
        "username": username,
        "is_admin": is_admin,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

def token_required(f):
    """Decorator to require JWT authentication for an endpoint."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
        
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            current_user = None
            if data.get("is_admin"):
                # Handle admin
                admin = find_by_id("admins", data["user_id"])
                if admin:
                    current_user = {
                        "id": admin["id"],
                        "username": admin["username"],
                        "is_admin": True
                    }
            else:
                # Handle standard user
                user = find_by_id("users", data["user_id"])
                if user:
                    current_user = {
                        "id": user["id"],
                        "name": user["name"],
                        "email": user["email"],
                        "phone": user.get("phone", ""),
                        "is_admin": False
                    }
            
            if not current_user:
                return jsonify({"message": "User not found!"}), 401
                
            return f(current_user, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token is invalid!"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def get_optional_user():
    """Extracts user from Authorization header if provided, otherwise returns None without throwing 401."""
    token = None
    if "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if not token:
        return None
    try:
        data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        if not data.get("is_admin"):
            user = find_by_id("users", data["user_id"])
            if user:
                return {
                    "id": int(user["id"]),
                    "name": user["name"],
                    "email": user["email"],
                    "is_admin": False
                }
    except Exception:
        pass
    return None

def admin_required(f):
    """Decorator to require Admin privileges for an endpoint."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
            
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            if not data.get("is_admin"):
                return jsonify({"message": "Admin privileges required!"}), 403
                
            admin = find_by_id("admins", data["user_id"])
            if not admin:
                return jsonify({"message": "Admin user not found!"}), 401
                
            current_admin = {
                "id": admin["id"],
                "username": admin["username"],
                "is_admin": True
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token is invalid!"}), 401
            
        return f(current_admin, *args, **kwargs)
    return decorated
