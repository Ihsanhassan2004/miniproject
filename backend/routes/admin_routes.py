import datetime
import json
from flask import Blueprint, request, jsonify
from backend.utils.csv_manager import load_csv, insert_row, update_row, delete_row, find_by_id, filter_rows
from backend.utils.auth import admin_required

admin_bp = Blueprint("admin", __name__)

# Helper to cast types safely
def safe_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def safe_int(val, default=0):
    try:
        return int(val)
    except (ValueError, TypeError):
        return default

# ----------------- ANALYTICS -----------------
@admin_bp.route("/analytics", methods=["GET"])
@admin_required
def get_analytics(current_admin):
    """
    Returns high-level statistics for the admin dashboard.
    """
    users_df = load_csv("users")
    dest_df = load_csv("destinations")
    hotels_df = load_csv("hotels")
    trips_df = load_csv("saved_trips")
    complaints_df = load_csv("complaints")
    reviews_df = load_csv("reviews")
    
    total_users = len(users_df)
    total_destinations = len(dest_df)
    total_trips = len(trips_df)
    total_complaints = len(complaints_df)
    
    pending_complaints = len(complaints_df[complaints_df["status"].astype(str).str.lower() == "pending"]) if not complaints_df.empty else 0
    avg_rating = round(reviews_df["rating"].astype(float).mean(), 1) if not reviews_df.empty else 0.0
    
    # Destination share in planned trips
    dest_distribution = {}
    if not trips_df.empty and not dest_df.empty:
        counts = trips_df["destination_id"].value_counts().to_dict()
        for dest_id, count in counts.items():
            dest_name = dest_df[dest_df["id"] == int(dest_id)]
            name = dest_name.iloc[0]["name"] if not dest_name.empty else f"ID {dest_id}"
            dest_distribution[name] = int(count)

    return jsonify({
        "stats": {
            "users": total_users,
            "destinations": total_destinations,
            "trips_planned": total_trips,
            "total_complaints": total_complaints,
            "pending_complaints": pending_complaints,
            "average_rating": avg_rating
        },
        "dest_distribution": dest_distribution
    }), 200

# ----------------- VALIDATION HELPERS -----------------
VALID_CATEGORIES = {"hill station", "beach", "heritage", "adventure", "nature", "pilgrimage", "city tourism"}
VALID_AVAILABILITY = {"available", "fully booked"}

def validate_destination_payload(data, is_update=False):
    cleaned = {}
    if not is_update or "name" in data:
        name = str(data.get("name", "")).strip()
        if not name or len(name) < 2:
            return False, "Destination name is required (minimum 2 characters).", {}
        if len(name) > 120:
            return False, "Destination name cannot exceed 120 characters.", {}
        cleaned["name"] = name

    if not is_update or "category" in data:
        cat = str(data.get("category", "")).strip().lower()
        if cat not in VALID_CATEGORIES:
            return False, f"Invalid category. Allowed categories: {', '.join(sorted(VALID_CATEGORIES))}.", {}
        cleaned["category"] = cat

    if not is_update or "city" in data:
        city = str(data.get("city", "")).strip()
        if not city or len(city) < 2:
            return False, "City name is required (minimum 2 characters).", {}
        cleaned["city"] = city

    if not is_update or "state" in data:
        state = str(data.get("state", "")).strip()
        if not state or len(state) < 2:
            return False, "State/region is required (minimum 2 characters).", {}
        cleaned["state"] = state

    if not is_update or "budget_min" in data or "budget_max" in data:
        budget_min_raw = data.get("budget_min")
        budget_max_raw = data.get("budget_max")
        
        try:
            b_min = float(budget_min_raw if budget_min_raw is not None else 5000)
            b_max = float(budget_max_raw if budget_max_raw is not None else 15000)
        except (ValueError, TypeError):
            return False, "Budget values must be valid numbers.", {}

        if b_min < 0:
            return False, "Minimum budget must be a positive number (₹0 or greater).", {}
        if b_max < b_min:
            return False, "Maximum budget cannot be less than minimum budget.", {}
            
        if not is_update or "budget_min" in data:
            cleaned["budget_min"] = b_min
        if not is_update or "budget_max" in data:
            cleaned["budget_max"] = b_max

    if not is_update or "description" in data:
        desc = str(data.get("description", "")).strip()
        if not desc or len(desc) < 10:
            return False, "Description is required (minimum 10 characters).", {}
        cleaned["description"] = desc

    if not is_update or "best_time" in data:
        best_time = str(data.get("best_time", "")).strip()
        if not best_time or len(best_time) < 2:
            return False, "Best travel period is required (e.g. October to March).", {}
        cleaned["best_time"] = best_time

    if "local_cities" in data or not is_update:
        cleaned["local_cities"] = str(data.get("local_cities", "")).strip()

    if "image_url" in data or not is_update:
        img_url = str(data.get("image_url", "")).strip()
        if img_url and not (img_url.startswith("http://") or img_url.startswith("https://") or img_url.startswith("/")):
            return False, "Image URL must start with http://, https://, or /.", {}
        cleaned["image_url"] = img_url

    return True, "", cleaned


def validate_attraction_payload(data, is_update=False):
    cleaned = {}
    if not is_update or "destination_id" in data:
        dest_id = safe_int(data.get("destination_id"))
        if dest_id <= 0 or find_by_id("destinations", dest_id) is None:
            return False, "A valid destination must be selected.", {}
        cleaned["destination_id"] = dest_id

    if not is_update or "name" in data:
        name = str(data.get("name", "")).strip()
        if not name or len(name) < 2:
            return False, "Attraction name is required (minimum 2 characters).", {}
        cleaned["name"] = name

    if not is_update or "entry_fee" in data:
        try:
            entry_fee = float(data.get("entry_fee", 0.0))
        except (ValueError, TypeError):
            return False, "Entry fee must be a valid number.", {}
        if entry_fee < 0:
            return False, "Entry fee must be ₹0 or greater.", {}
        cleaned["entry_fee"] = entry_fee

    if not is_update or "visit_time" in data:
        visit_time = str(data.get("visit_time", "")).strip()
        if not visit_time:
            return False, "Visit duration is required (e.g. '2 Hours').", {}
        cleaned["visit_time"] = visit_time

    if not is_update or "description" in data:
        desc = str(data.get("description", "")).strip()
        if not desc or len(desc) < 5:
            return False, "Description is required (minimum 5 characters).", {}
        cleaned["description"] = desc

    if not is_update or "image_url" in data:
        cleaned["image_url"] = str(data.get("image_url", "")).strip()

    return True, "", cleaned


def validate_hotel_payload(data, is_update=False):
    cleaned = {}
    if not is_update or "destination_id" in data:
        dest_id = safe_int(data.get("destination_id"))
        if dest_id <= 0 or find_by_id("destinations", dest_id) is None:
            return False, "A valid destination must be selected.", {}
        cleaned["destination_id"] = dest_id

    if not is_update or "name" in data:
        name = str(data.get("name", "")).strip()
        if not name or len(name) < 2:
            return False, "Accommodation name is required (minimum 2 characters).", {}
        cleaned["name"] = name

    if not is_update or "hotel_type" in data:
        hotel_type = str(data.get("hotel_type", "")).strip()
        if not hotel_type or len(hotel_type) < 2:
            return False, "Hotel type is required (e.g. Hotel, Resort, Homestay).", {}
        cleaned["hotel_type"] = hotel_type

    if not is_update or "price_per_night" in data:
        try:
            price = float(data.get("price_per_night", 0))
        except (ValueError, TypeError):
            return False, "Price per night must be a valid number.", {}
        if price <= 0:
            return False, "Price per night must be greater than ₹0.", {}
        cleaned["price_per_night"] = price

    if not is_update or "rating" in data:
        try:
            rating = float(data.get("rating", 4.0))
        except (ValueError, TypeError):
            return False, "Rating must be a valid number between 1.0 and 5.0.", {}
        if rating < 1.0 or rating > 5.0:
            return False, "Rating must be between 1.0 and 5.0.", {}
        cleaned["rating"] = round(rating, 1)

    if not is_update or "total_rooms" in data:
        try:
            tot = int(data.get("total_rooms", 10))
        except (ValueError, TypeError):
            return False, "Total rooms must be a valid integer.", {}
        if tot < 1:
            return False, "Total rooms capacity must be at least 1.", {}
        cleaned["total_rooms"] = tot

    if not is_update or "website" in data:
        website = str(data.get("website", "")).strip()
        cleaned["website"] = website

    if not is_update or "address" in data:
        addr = str(data.get("address", "")).strip()
        if not addr or len(addr) < 5:
            return False, "Address location is required (minimum 5 characters).", {}
        cleaned["address"] = addr

    if "amenities" in data or not is_update:
        cleaned["amenities"] = str(data.get("amenities", "")).strip()

    return True, "", cleaned


def validate_restaurant_payload(data, is_update=False):
    cleaned = {}
    if not is_update or "destination_id" in data:
        dest_id = safe_int(data.get("destination_id"))
        if dest_id <= 0 or find_by_id("destinations", dest_id) is None:
            return False, "A valid destination must be selected.", {}
        cleaned["destination_id"] = dest_id

    if not is_update or "name" in data:
        name = str(data.get("name", "")).strip()
        if not name or len(name) < 2:
            return False, "Restaurant name is required (minimum 2 characters).", {}
        cleaned["name"] = name

    if not is_update or "cuisine" in data or "cuisines" in data:
        raw_cuisine = data.get("cuisine")
        raw_cuisines = data.get("cuisines")
        if isinstance(raw_cuisines, list):
            cuisine = ", ".join([str(c).strip() for c in raw_cuisines if str(c).strip()])
        elif isinstance(raw_cuisine, list):
            cuisine = ", ".join([str(c).strip() for c in raw_cuisine if str(c).strip()])
        else:
            cuisine = str(raw_cuisine or "").strip()
            
        if not cuisine or len(cuisine) < 2:
            return False, "Cuisine category is required (minimum 2 characters).", {}
        cleaned["cuisine"] = cuisine

    if not is_update or "avg_cost" in data:
        try:
            avg_cost = float(data.get("avg_cost", 0))
        except (ValueError, TypeError):
            return False, "Average cost must be a valid number.", {}
        if avg_cost <= 0:
            return False, "Average cost per person must be greater than ₹0.", {}
        cleaned["avg_cost"] = avg_cost

    if not is_update or "rating" in data:
        try:
            rating = float(data.get("rating", 4.0))
        except (ValueError, TypeError):
            return False, "Rating must be a valid number between 1.0 and 5.0.", {}
        if rating < 1.0 or rating > 5.0:
            return False, "Rating must be between 1.0 and 5.0.", {}
        cleaned["rating"] = round(rating, 1)

    if not is_update or "address" in data:
        addr = str(data.get("address", "")).strip()
        if not addr or len(addr) < 3:
            return False, "Address location is required (minimum 3 characters).", {}
        cleaned["address"] = addr

    return True, "", cleaned


def validate_transport_payload(data, is_update=False):
    cleaned = {}
    if not is_update or "destination_id" in data:
        dest_id = safe_int(data.get("destination_id"))
        if dest_id <= 0 or find_by_id("destinations", dest_id) is None:
            return False, "A valid destination must be selected.", {}
        cleaned["destination_id"] = dest_id

    if not is_update or "transport_type" in data:
        trans_type = str(data.get("transport_type", "")).strip()
        if not trans_type or len(trans_type) < 2:
            return False, "Transit provider / transport type is required (minimum 2 characters).", {}
        cleaned["transport_type"] = trans_type

    if not is_update or "source" in data or "destination" in data:
        source = str(data.get("source", "")).strip()
        dest = str(data.get("destination", "")).strip()
        if not source or len(source) < 2:
            return False, "Source starting city is required (minimum 2 characters).", {}
        if not dest or len(dest) < 2:
            return False, "Destination route stop is required (minimum 2 characters).", {}
        if source.lower() == dest.lower():
            return False, "Source and destination route stops cannot be identical.", {}
        if not is_update or "source" in data:
            cleaned["source"] = source
        if not is_update or "destination" in data:
            cleaned["destination"] = dest

    if not is_update or "travel_time" in data:
        travel_time = str(data.get("travel_time", "")).strip()
        if not travel_time or len(travel_time) < 2:
            return False, "Travel duration time is required (e.g. '2 Hours').", {}
        cleaned["travel_time"] = travel_time

    if not is_update or "fare" in data:
        try:
            fare = float(data.get("fare", 0))
        except (ValueError, TypeError):
            return False, "Fare cost must be a valid number.", {}
        if fare <= 0:
            return False, "Estimated fare cost must be greater than ₹0.", {}
        cleaned["fare"] = fare

    if "distance" in data:
        try:
            dist = float(data.get("distance", 0))
            cleaned["distance"] = max(0.0, dist)
        except (ValueError, TypeError):
            cleaned["distance"] = 0.0
    elif not is_update:
        cleaned["distance"] = 0.0

    if not is_update or "availability" in data:
        avail = str(data.get("availability", "available")).strip().lower()
        if avail not in VALID_AVAILABILITY:
            return False, "Availability must be either 'available' or 'fully booked'.", {}
        cleaned["availability"] = avail

    return True, "", cleaned

# ----------------- DESTINATIONS -----------------
@admin_bp.route("/destinations", methods=["POST"])
@admin_required
def create_destination(current_admin):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_destination_payload(data, is_update=False)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    new_dest = insert_row("destinations", cleaned_data)
    return jsonify({"message": "Destination created successfully!", "destination": new_dest}), 201

@admin_bp.route("/destinations/<int:id_val>", methods=["PUT"])
@admin_required
def edit_destination(current_admin, id_val):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_destination_payload(data, is_update=True)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    updated = update_row("destinations", id_val, cleaned_data)
    if updated:
        return jsonify({"message": "Destination updated successfully!"}), 200
    return jsonify({"message": "Destination not found"}), 404

@admin_bp.route("/destinations/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_destination(current_admin, id_val):
    deleted = delete_row("destinations", id_val)
    if deleted:
        return jsonify({"message": "Destination deleted successfully!"}), 200
    return jsonify({"message": "Destination not found"}), 404

# ----------------- HOTELS -----------------
@admin_bp.route("/hotels", methods=["POST"])
@admin_required
def create_hotel(current_admin):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_hotel_payload(data, is_update=False)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    new_hotel = insert_row("hotels", cleaned_data)
    return jsonify({"message": "Hotel created successfully!", "hotel": new_hotel}), 201

@admin_bp.route("/hotels/<int:id_val>", methods=["PUT"])
@admin_required
def edit_hotel(current_admin, id_val):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_hotel_payload(data, is_update=True)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    updated = update_row("hotels", id_val, cleaned_data)
    if updated:
        return jsonify({"message": "Hotel updated successfully!"}), 200
    return jsonify({"message": "Hotel not found"}), 404

@admin_bp.route("/hotels/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_hotel(current_admin, id_val):
    deleted = delete_row("hotels", id_val)
    if deleted:
        return jsonify({"message": "Hotel deleted successfully!"}), 200
    return jsonify({"message": "Hotel not found"}), 404

@admin_bp.route("/hotels/<int:destination_id>", methods=["GET"])
@admin_required
def get_all_hotels(current_admin, destination_id):
    hotels_df = load_csv("hotels")
    records = hotels_df[hotels_df["destination_id"] == int(destination_id)].to_dict(orient="records")
    return jsonify({"hotels": records}), 200

# ----------------- RESTAURANTS -----------------
@admin_bp.route("/restaurants", methods=["POST"])
@admin_required
def create_restaurant(current_admin):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_restaurant_payload(data, is_update=False)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    new_rest = insert_row("restaurants", cleaned_data)
    return jsonify({"message": "Restaurant created successfully!", "restaurant": new_rest}), 201

@admin_bp.route("/restaurants/<int:id_val>", methods=["PUT"])
@admin_required
def edit_restaurant(current_admin, id_val):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_restaurant_payload(data, is_update=True)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    updated = update_row("restaurants", id_val, cleaned_data)
    if updated:
        return jsonify({"message": "Restaurant updated successfully!"}), 200
    return jsonify({"message": "Restaurant not found"}), 404

@admin_bp.route("/restaurants/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_restaurant(current_admin, id_val):
    deleted = delete_row("restaurants", id_val)
    if deleted:
        return jsonify({"message": "Restaurant deleted successfully!"}), 200
    return jsonify({"message": "Restaurant not found"}), 404

@admin_bp.route("/restaurants/<int:destination_id>", methods=["GET"])
@admin_required
def get_all_restaurants(current_admin, destination_id):
    rest_df = load_csv("restaurants")
    records = rest_df[rest_df["destination_id"] == int(destination_id)].to_dict(orient="records")
    return jsonify({"restaurants": records}), 200

# ----------------- ATTRACTIONS -----------------
@admin_bp.route("/attractions", methods=["POST"])
@admin_required
def create_attraction(current_admin):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_attraction_payload(data, is_update=False)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    new_attr = insert_row("attractions", cleaned_data)
    return jsonify({"message": "Attraction created successfully!", "attraction": new_attr}), 201

@admin_bp.route("/attractions/<int:id_val>", methods=["PUT"])
@admin_required
def edit_attraction(current_admin, id_val):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_attraction_payload(data, is_update=True)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    updated = update_row("attractions", id_val, cleaned_data)
    if updated:
        return jsonify({"message": "Attraction updated successfully!"}), 200
    return jsonify({"message": "Attraction not found"}), 404

@admin_bp.route("/attractions/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_attraction(current_admin, id_val):
    deleted = delete_row("attractions", id_val)
    if deleted:
        return jsonify({"message": "Attraction deleted successfully!"}), 200
    return jsonify({"message": "Attraction not found"}), 404

# ----------------- TRANSPORTATION -----------------
@admin_bp.route("/transportation", methods=["POST"])
@admin_required
def create_transport(current_admin):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_transport_payload(data, is_update=False)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    new_trans = insert_row("transportation", cleaned_data)
    return jsonify({"message": "Transportation option added successfully!", "transportation": new_trans}), 201

@admin_bp.route("/transportation/<int:id_val>", methods=["PUT"])
@admin_required
def edit_transport(current_admin, id_val):
    data = request.get_json() or {}
    is_valid, err_msg, cleaned_data = validate_transport_payload(data, is_update=True)
    if not is_valid:
        return jsonify({"message": err_msg}), 400
        
    updated = update_row("transportation", id_val, cleaned_data)
    if updated:
        return jsonify({"message": "Transportation updated successfully!"}), 200
    return jsonify({"message": "Transportation not found"}), 404

@admin_bp.route("/transportation/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_transport(current_admin, id_val):
    deleted = delete_row("transportation", id_val)
    if deleted:
        return jsonify({"message": "Transportation deleted successfully!"}), 200
    return jsonify({"message": "Transportation not found"}), 404

@admin_bp.route("/transportation/<int:destination_id>", methods=["GET"])
@admin_required
def get_all_transportation(current_admin, destination_id):
    trans_df = load_csv("transportation")
    records = trans_df[trans_df["destination_id"] == int(destination_id)].to_dict(orient="records")
    return jsonify({"transportation": records}), 200

# ----------------- TRANSPORT RATES MANAGEMENT -----------------
@admin_bp.route("/transport-rates", methods=["GET"])
@admin_required
def get_admin_transport_rates(current_admin):
    """
    Returns all configurable transport rates for administrative tariff management.
    """
    rates_df = load_csv("transport_rates")
    records = rates_df.to_dict(orient="records") if not rates_df.empty else []
    return jsonify({"rates": records}), 200

@admin_bp.route("/transport-rates", methods=["POST"])
@admin_required
def create_admin_transport_rate(current_admin):
    """
    Creates a new transport rate configuration.
    """
    data = request.get_json() or {}
    t_type = str(data.get("transport_type", "")).strip()
    category = str(data.get("category", "")).strip()
    
    if not t_type or not category:
        return jsonify({"message": "Transport type and category are required."}), 400
        
    rate_row = {
        "transport_type": t_type,
        "category": category,
        "base_fare": safe_float(data.get("base_fare", 0.0)),
        "per_km_rate": safe_float(data.get("per_km_rate", 0.0)),
        "per_person_rate": safe_float(data.get("per_person_rate", 0.0)),
        "fuel_cost_per_km": safe_float(data.get("fuel_cost_per_km", 0.0)),
        "daily_rental": safe_float(data.get("daily_rental", 0.0)),
        "speed_kmh": safe_float(data.get("speed_kmh", 45.0)),
        "min_distance_km": safe_float(data.get("min_distance_km", 0.0)),
        "max_distance_km": safe_float(data.get("max_distance_km", 3000.0)),
        "active": safe_int(data.get("active", 1)),
        "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    saved = insert_row("transport_rates", rate_row)
    return jsonify({"message": "Transport rate configuration created successfully!", "rate": saved}), 201

@admin_bp.route("/transport-rates/<int:id_val>", methods=["PUT"])
@admin_required
def edit_admin_transport_rate(current_admin, id_val):
    """
    Updates an existing transport rate configuration.
    """
    data = request.get_json() or {}
    update_data = {}
    
    if "transport_type" in data:
        update_data["transport_type"] = str(data["transport_type"]).strip()
    if "category" in data:
        update_data["category"] = str(data["category"]).strip()
    if "base_fare" in data:
        update_data["base_fare"] = safe_float(data["base_fare"])
    if "per_km_rate" in data:
        update_data["per_km_rate"] = safe_float(data["per_km_rate"])
    if "per_person_rate" in data:
        update_data["per_person_rate"] = safe_float(data["per_person_rate"])
    if "fuel_cost_per_km" in data:
        update_data["fuel_cost_per_km"] = safe_float(data["fuel_cost_per_km"])
    if "daily_rental" in data:
        update_data["daily_rental"] = safe_float(data["daily_rental"])
    if "speed_kmh" in data:
        update_data["speed_kmh"] = safe_float(data["speed_kmh"])
    if "min_distance_km" in data:
        update_data["min_distance_km"] = safe_float(data["min_distance_km"])
    if "max_distance_km" in data:
        update_data["max_distance_km"] = safe_float(data["max_distance_km"])
    if "active" in data:
        update_data["active"] = safe_int(data["active"])
        
    update_data["updated_at"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    updated = update_row("transport_rates", id_val, update_data)
    if updated:
        return jsonify({"message": "Transport rate configuration updated successfully!"}), 200
    return jsonify({"message": "Transport rate not found."}), 404


# ----------------- USERS & TRIPS OVERVIEW -----------------
@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_users(current_admin):
    users_df = load_csv("users")
    trips_df = load_csv("saved_trips")
    reviews_df = load_csv("reviews")
    complaints_df = load_csv("complaints")
    
    users = users_df.to_dict(orient="records") if not users_df.empty else []
    # Strip passwords and compute stats
    for u in users:
        u.pop("password_hash", None)
        u_id = u.get("id")
        if u_id is not None:
            u["trips_count"] = int(len(trips_df[trips_df["user_id"] == u_id])) if not trips_df.empty else 0
            u["reviews_count"] = int(len(reviews_df[reviews_df["user_id"] == u_id])) if not reviews_df.empty else 0
            u["complaints_count"] = int(len(complaints_df[complaints_df["user_id"] == u_id])) if not complaints_df.empty else 0
        else:
            u["trips_count"] = 0
            u["reviews_count"] = 0
            u["complaints_count"] = 0
            
    return jsonify({"users": users}), 200

@admin_bp.route("/users", methods=["POST"])
@admin_required
def create_user(current_admin):
    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()
    phone = str(data.get("phone", "")).strip()

    if not name or len(name) < 2:
        return jsonify({"message": "User name is required (minimum 2 characters)."}), 400

    if not email or "@" not in email or "." not in email:
        return jsonify({"message": "Valid email address is required."}), 400

    if not password or len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long."}), 400

    users_df = load_csv("users")
    if not users_df.empty:
        existing = users_df[users_df["email"].astype(str).str.lower() == email]
        if not existing.empty:
            return jsonify({"message": "A user with this email address already exists."}), 400

    from werkzeug.security import generate_password_hash
    password_hash = generate_password_hash(password)
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_user = insert_row("users", {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "phone": phone,
        "created_at": created_at
    })
    
    if new_user and "password_hash" in new_user:
        new_user.pop("password_hash", None)

    return jsonify({"message": "User created successfully!", "user": new_user}), 201

@admin_bp.route("/users/<int:id_val>", methods=["PUT"])
@admin_required
def update_user(current_admin, id_val):
    user = find_by_id("users", id_val)
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json() or {}
    update_data = {}

    if "name" in data:
        name = str(data.get("name", "")).strip()
        if not name or len(name) < 2:
            return jsonify({"message": "User name must be at least 2 characters."}), 400
        update_data["name"] = name

    if "email" in data:
        email = str(data.get("email", "")).strip().lower()
        if not email or "@" not in email or "." not in email:
            return jsonify({"message": "Valid email address is required."}), 400

        users_df = load_csv("users")
        if not users_df.empty:
            existing = users_df[(users_df["email"].astype(str).str.lower() == email) & (users_df["id"] != id_val)]
            if not existing.empty:
                return jsonify({"message": "Another user already uses this email address."}), 400
        update_data["email"] = email

    if "phone" in data:
        update_data["phone"] = str(data.get("phone", "")).strip()

    if "password" in data and str(data.get("password", "")).strip():
        pwd = str(data.get("password", "")).strip()
        if len(pwd) < 6:
            return jsonify({"message": "New password must be at least 6 characters long."}), 400
        from werkzeug.security import generate_password_hash
        update_data["password_hash"] = generate_password_hash(pwd)

    if not update_data:
        return jsonify({"message": "No valid fields provided for update."}), 400

    updated = update_row("users", id_val, update_data)
    if updated:
        return jsonify({"message": "User details updated successfully!"}), 200
    return jsonify({"message": "Failed to update user."}), 500

@admin_bp.route("/trips", methods=["GET"])
@admin_required
def get_all_trips(current_admin):
    trips_df = load_csv("saved_trips")
    if trips_df.empty:
        return jsonify({"trips": []}), 200

    trips = trips_df.to_dict(orient="records")
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    # Hydrate user details, destination details, and parse json payloads
    for t in trips:
        user = find_by_id("users", t["user_id"])
        dest = find_by_id("destinations", t["destination_id"])
        
        t["user_name"] = user["name"] if user else f"User ID {t['user_id']}"
        t["user_email"] = user.get("email", "") if user else ""
        t["user_phone"] = user.get("phone", "") if user else ""

        t["destination_name"] = dest["name"] if dest else f"Dest ID {t['destination_id']}"
        t["destination_image"] = dest.get("image_url", "") if dest else ""
        t["destination_city"] = dest.get("city", "") if dest else ""
        t["destination_state"] = dest.get("state", "") if dest else ""
        t["destination_category"] = dest.get("category", "") if dest else ""

        # Dates & Completion Status
        t_date = str(t.get("travel_date", "")).strip()
        if not t_date or t_date in ("nan", "None"):
            created_raw = str(t.get("created_at", "")).split(" ")[0]
            t["travel_date"] = created_raw if created_raw else today_str
        else:
            t["travel_date"] = t_date

        raw_status = str(t.get("status", "")).strip().lower()
        is_completed = (raw_status == "completed")
        t["status"] = "completed" if is_completed else "planned"
        t["is_completed"] = bool(is_completed)

        # Parse JSON structures
        try:
            if isinstance(t.get("interests"), str):
                t["interests"] = json.loads(t["interests"])
        except Exception:
            pass

        try:
            if isinstance(t.get("itinerary_text"), str):
                t["itinerary_text"] = json.loads(t["itinerary_text"])
        except Exception:
            pass

        # Multi-destination segments
        segments = []
        seg_str = str(t.get("segments_json", "")).strip()
        if seg_str and seg_str not in ("nan", "None", "[]", ""):
            try:
                segments = json.loads(seg_str)
            except Exception:
                segments = []
        t["segments"] = segments

        if len(segments) > 1:
            dest_names = [s.get("destination_name") for s in segments if s.get("destination_name")]
            t["multi_destination_title"] = " & ".join(dest_names) if dest_names else t.get("trip_name")
            t["is_multi_destination"] = True
        else:
            t["is_multi_destination"] = bool(t.get("segments_json") and len(segments) > 1)

        try:
            if isinstance(t.get("route_json"), str) and t.get("route_json"):
                t["route_json"] = json.loads(t["route_json"])
            elif not isinstance(t.get("route_json"), dict):
                t["route_json"] = {}
        except Exception:
            t["route_json"] = {}

        try:
            if isinstance(t.get("cost_breakdown_json"), str) and t.get("cost_breakdown_json"):
                t["cost_breakdown_json"] = json.loads(t["cost_breakdown_json"])
            elif not isinstance(t.get("cost_breakdown_json"), dict):
                t["cost_breakdown_json"] = {}
        except Exception:
            t["cost_breakdown_json"] = {}

    # Sort newest first
    trips = sorted(trips, key=lambda x: str(x.get("created_at", "")), reverse=True)
    return jsonify({"trips": trips}), 200


@admin_bp.route("/trips/<int:id_val>", methods=["DELETE"])
@admin_required
def delete_trip_by_admin(current_admin, id_val):
    trip = find_by_id("saved_trips", id_val)
    if not trip:
        return jsonify({"message": "Trip not found."}), 404
        
    success = delete_row("saved_trips", id_val)
    if success:
        return jsonify({"message": "Trip record deleted successfully.", "deleted_id": id_val}), 200
    return jsonify({"message": "Failed to delete trip record."}), 500

# ----------------- COMPLAINTS -----------------
@admin_bp.route("/complaints", methods=["GET"])
@admin_required
def get_all_complaints(current_admin):
    complaints = load_csv("complaints").to_dict(orient="records")
    
    for c in complaints:
        user = find_by_id("users", c["user_id"])
        c["user_name"] = user["name"] if user else f"User ID {c['user_id']}"
        
    # Newest first
    complaints = sorted(complaints, key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"complaints": complaints}), 200

@admin_bp.route("/complaints/<int:id_val>", methods=["PUT"])
@admin_required
def reply_complaint(current_admin, id_val):
    data = request.get_json() or {}
    admin_reply = data.get("admin_reply")
    status = data.get("status")  # Pending, In Progress, Resolved
    priority = data.get("priority")  # Urgent, High, Medium, Low
    
    update_data = {}
    if admin_reply is not None:
        update_data["admin_reply"] = admin_reply
    if status:
        update_data["status"] = status
    if priority:
        update_data["priority"] = priority
        
    if not update_data:
        return jsonify({"message": "No reply content, status or priority provided"}), 400
        
    updated = update_row("complaints", id_val, update_data)
    if updated:
        return jsonify({"message": "Complaint updated successfully!"}), 200
    return jsonify({"message": "Complaint not found"}), 404

@admin_bp.route("/complaints/<int:id_val>", methods=["DELETE"])
@admin_required
def delete_complaint_admin(current_admin, id_val):
    complaint = find_by_id("complaints", id_val)
    if not complaint:
        return jsonify({"message": "Support ticket not found"}), 404
    success = delete_row("complaints", id_val)
    if success:
        return jsonify({"message": "Support ticket deleted successfully"}), 200
    return jsonify({"message": "Failed to delete support ticket"}), 500

# ----------------- REVIEWS -----------------
@admin_bp.route("/reviews", methods=["GET"])
@admin_required
def get_all_reviews(current_admin):
    reviews = load_csv("reviews").to_dict(orient="records")
    for r in reviews:
        user = find_by_id("users", r["user_id"])
        dest = find_by_id("destinations", r["destination_id"])
        r["user_name"] = user["name"] if user else f"User ID {r['user_id']}"
        r["destination_name"] = dest["name"] if dest else f"Dest ID {r['destination_id']}"
        
    reviews = sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"reviews": reviews}), 200

@admin_bp.route("/reviews/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_review(current_admin, id_val):
    deleted = delete_row("reviews", id_val)
    if deleted:
        return jsonify({"message": "Review deleted successfully!"}), 200
    return jsonify({"message": "Review not found"}), 404

# ----------------- FEEDBACK -----------------
@admin_bp.route("/feedback", methods=["GET"])
@admin_required
def get_all_feedback(current_admin):
    feedback = load_csv("feedback").to_dict(orient="records")
    for f in feedback:
        user = find_by_id("users", f["user_id"])
        f["user_name"] = user["name"] if user else f"User ID {f['user_id']}"
        
    feedback = sorted(feedback, key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"feedback": feedback}), 200

# ----------------- CHATBOT LOGS -----------------
@admin_bp.route("/chatbot-logs", methods=["GET"])
@admin_required
def get_chatbot_logs(current_admin):
    logs = load_csv("chatbot_logs").to_dict(orient="records")
    for l in logs:
        if l["user_id"] != 0:
            user = find_by_id("users", l["user_id"])
            l["user_name"] = user["name"] if user else f"User ID {l['user_id']}"
        else:
            l["user_name"] = "Anonymous Guest"
            
    logs = sorted(logs, key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"logs": logs}), 200

# ----------------- WEATHER CACHE MANAGEMENT -----------------
@admin_bp.route("/weather", methods=["GET"])
@admin_required
def get_weather_cache(current_admin):
    weather_data = load_csv("weather_cache").to_dict(orient="records")
    for w in weather_data:
        dest = find_by_id("destinations", w["destination_id"])
        w["destination_name"] = dest["name"] if dest else f"Destination ID {w['destination_id']}"
    return jsonify({"weather": weather_data}), 200

@admin_bp.route("/weather", methods=["POST"])
@admin_required
def create_weather_cache(current_admin):
    data = request.get_json() or {}
    dest_id = data.get("destination_id")
    if not dest_id:
        return jsonify({"message": "destination_id is required"}), 400
        
    weather_row = {
        "destination_id": safe_int(dest_id),
        "temperature": safe_float(data.get("temperature"), 25.0),
        "humidity": safe_float(data.get("humidity"), 60.0),
        "weather": data.get("weather", "Sunny"),
        "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    new_weather = insert_row("weather_cache", weather_row)
    return jsonify({"message": "Weather cache record created!", "weather": new_weather}), 201

@admin_bp.route("/weather/<int:id_val>", methods=["PUT"])
@admin_required
def edit_weather_cache(current_admin, id_val):
    data = request.get_json() or {}
    update_data = {}
    
    if "destination_id" in data:
        update_data["destination_id"] = safe_int(data["destination_id"])
    if "temperature" in data:
        update_data["temperature"] = safe_float(data["temperature"])
    if "humidity" in data:
        update_data["humidity"] = safe_float(data["humidity"])
    if "weather" in data:
        update_data["weather"] = data["weather"]
        
    update_data["updated_at"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    updated = update_row("weather_cache", id_val, update_data)
    if updated:
        return jsonify({"message": "Weather cache record updated successfully!"}), 200
    return jsonify({"message": "Weather cache record not found"}), 404

@admin_bp.route("/weather/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_weather_cache(current_admin, id_val):
    deleted = delete_row("weather_cache", id_val)
    if deleted:
        return jsonify({"message": "Weather cache record deleted successfully!"}), 200
    return jsonify({"message": "Weather cache record not found"}), 404

def parse_photos(photo_val):
    if not photo_val or str(photo_val).strip() in ("nan", "None", ""):
        return [], ""
    photo_str = str(photo_val).strip()
    if photo_str.startswith("[") and photo_str.endswith("]"):
        try:
            parsed = json.loads(photo_str)
            if isinstance(parsed, list):
                valid_photos = [str(p) for p in parsed if p and str(p).strip() not in ("nan", "None", "")]
                primary = valid_photos[0] if valid_photos else ""
                return valid_photos, primary
        except Exception:
            pass
    return [photo_str], photo_str

# ----------------- TRIP DIARY MANAGEMENT -----------------
@admin_bp.route("/diaries", methods=["GET"])
@admin_required
def get_all_diaries(current_admin):
    diaries = load_csv("trip_diary").to_dict(orient="records")
    for d in diaries:
        user = find_by_id("users", d["user_id"])
        dest = find_by_id("destinations", d["destination_id"])
        d["user_name"] = user["name"] if user else f"User ID {d['user_id']}"
        d["destination_name"] = dest["name"] if dest else f"Dest ID {d['destination_id']}"
        photos, primary = parse_photos(d.get("photo_path"))
        d["photos"] = photos
        d["photo_path"] = primary
        
    diaries = sorted(diaries, key=lambda x: str(x.get("created_at", "")), reverse=True)
    return jsonify({"diaries": diaries}), 200

@admin_bp.route("/diaries/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_diary(current_admin, id_val):
    deleted = delete_row("trip_diary", id_val)
    if deleted:
        return jsonify({"message": "Diary entry deleted successfully!"}), 200
    return jsonify({"message": "Diary entry not found"}), 404

# ----------------- DELETE USERS & FEEDBACK -----------------
@admin_bp.route("/users/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_user(current_admin, id_val):
    deleted = delete_row("users", id_val)
    if deleted:
        return jsonify({"message": "User deleted successfully!"}), 200
    return jsonify({"message": "User not found"}), 404

@admin_bp.route("/feedback/<int:id_val>", methods=["DELETE"])
@admin_required
def remove_feedback(current_admin, id_val):
    deleted = delete_row("feedback", id_val)
    if deleted:
        return jsonify({"message": "Feedback deleted successfully!"}), 200
    return jsonify({"message": "Feedback not found"}), 404

