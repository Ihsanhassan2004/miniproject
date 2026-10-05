import datetime
import re
from flask import Blueprint, request, jsonify
from backend.utils.csv_manager import load_csv, insert_row, update_row, find_by_field, find_by_id
from backend.utils.auth import hash_password, check_password, generate_token, token_required

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
NAME_REGEX = re.compile(r"^[a-zA-Z\s.'-]+$")

def validate_user_data(name=None, email=None, phone=None, password=None, is_registration=False):
    """
    Validates user credentials and profile fields with descriptive error messages.
    """
    errors = []
    
    # 1. Name Validation
    if name is not None or is_registration:
        clean_name = str(name or "").strip()
        if not clean_name:
            errors.append("Full traveler name is required.")
        elif len(clean_name) < 2 or len(clean_name) > 50:
            errors.append("Full name must be between 2 and 50 characters.")
        elif not NAME_REGEX.match(clean_name):
            errors.append("Full name must contain only letters, spaces, hyphens, and apostrophes.")
            
    # 2. Email Validation
    if email is not None or is_registration:
        clean_email = str(email or "").strip().lower()
        if not clean_email:
            errors.append("Email address is required.")
        elif not EMAIL_REGEX.match(clean_email):
            errors.append("Please enter a valid email address (e.g., traveler@example.com).")
        else:
            domain_part = clean_email.split("@")[-1]
            if "." not in domain_part or len(domain_part.split(".")[-1]) < 2:
                errors.append("Email domain is invalid. Please include a valid extension (e.g., .com, .in).")
                
    # 3. Phone Number Validation (Optional, but if given, must be valid 10 digits)
    if phone is not None:
        clean_phone = str(phone or "").strip()
        if clean_phone:
            digits = re.sub(r"\D", "", clean_phone)
            if clean_phone.startswith("+91") and len(digits) == 12:
                digits = digits[2:]
            elif len(digits) == 11 and digits.startswith("0"):
                digits = digits[1:]
                
            if len(digits) != 10 or digits[0] not in "6789":
                errors.append("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.")
                
    # 4. Password Validation
    if password is not None or is_registration:
        clean_pass = str(password or "")
        if is_registration and not clean_pass:
            errors.append("Password is required.")
        elif clean_pass:
            if len(clean_pass) < 6:
                errors.append("Password must be at least 6 characters long.")
            elif len(clean_pass) > 100:
                errors.append("Password must not exceed 100 characters.")
                
    return errors

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone", "")
    
    errors = validate_user_data(name=name, email=email, phone=phone, password=password, is_registration=True)
    if errors:
        return jsonify({"message": errors[0], "errors": errors}), 400
        
    clean_email = str(email).strip().lower()
    clean_name = str(name).strip()
    clean_phone = str(phone or "").strip()
    
    # Check if user already exists
    existing_user = find_by_field("users", "email", clean_email)
    if existing_user:
        return jsonify({"message": "User with this email already exists!"}), 400
        
    user_row = {
        "name": clean_name,
        "email": clean_email,
        "password_hash": hash_password(password),
        "phone": clean_phone,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    new_user = insert_row("users", user_row)
    
    # Generate token automatically after registration
    token = generate_token(new_user["id"], new_user["name"], is_admin=False)
    
    return jsonify({
        "message": "User registered successfully!",
        "token": token,
        "user": {
            "id": new_user["id"],
            "name": new_user["name"],
            "email": new_user["email"],
            "phone": new_user["phone"],
            "is_admin": False
        }
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"message": "Email and password are required!"}), 400
        
    clean_email = str(email).strip().lower()
    user = find_by_field("users", "email", clean_email)
    if not user or not check_password(user["password_hash"], password):
        return jsonify({"message": "Invalid email or password!"}), 401
        
    token = generate_token(user["id"], user["name"], is_admin=False)
    
    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone", ""),
            "is_admin": False
        }
    }), 200

@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"message": "Username and password are required!"}), 400
        
    admin = find_by_field("admins", "username", username)
    if not admin or not check_password(admin["password_hash"], password):
        return jsonify({"message": "Invalid admin username or password!"}), 401
        
    token = generate_token(admin["id"], admin["username"], is_admin=True)
    
    return jsonify({
        "message": "Admin login successful!",
        "token": token,
        "user": {
            "id": admin["id"],
            "username": admin["username"],
            "is_admin": True
        }
    }), 200

@auth_bp.route("/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    # Admins don't have separate profile tables beyond admins.csv
    if current_user.get("is_admin"):
        return jsonify({"user": current_user}), 200
        
    # Re-fetch from DB to get fresh data
    user = find_by_id("users", current_user["id"])
    if not user:
        return jsonify({"message": "User not found!"}), 404
        
    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone", ""),
            "created_at": user["created_at"],
            "is_admin": False
        }
    }), 200

@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    if current_user.get("is_admin"):
        return jsonify({"message": "Admins cannot modify profile via this endpoint"}), 400
        
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    
    # Run validation
    errors = validate_user_data(
        name=name, 
        email=email, 
        phone=phone if phone is not None else None, 
        password=password if password else None, 
        is_registration=False
    )
    if errors:
        return jsonify({"message": errors[0], "errors": errors}), 400
        
    update_data = {}
    if name is not None:
        update_data["name"] = str(name).strip()
        
    if email is not None:
        clean_email = str(email).strip().lower()
        # Check if email is already in use by someone else
        existing = find_by_field("users", "email", clean_email)
        if existing and int(existing["id"]) != int(current_user["id"]):
            return jsonify({"message": "Email is already taken by another account!"}), 400
        update_data["email"] = clean_email
        
    if phone is not None:
        update_data["phone"] = str(phone).strip()
        
    if password:
        update_data["password_hash"] = hash_password(password)
        
    if not update_data:
        return jsonify({"message": "No fields to update!"}), 400
        
    updated = update_row("users", current_user["id"], update_data)
    if not updated:
        return jsonify({"message": "Failed to update profile!"}), 500
        
    # Get updated user profile
    user = find_by_id("users", current_user["id"])
    
    return jsonify({
        "message": "Profile updated successfully!",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone", ""),
            "is_admin": False
        }
    }), 200
