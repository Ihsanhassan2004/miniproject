import datetime
import json
from flask import Blueprint, request, jsonify
from backend.utils.csv_manager import load_csv, insert_row, filter_rows, find_by_id, update_row, delete_row
from backend.utils.auth import token_required, get_optional_user
from backend.services.recommender import recommend_destinations, recommend_destinations_based_on_past_trips, get_user_completed_trips
from backend.services.itinerary_generator import generate_itinerary
from backend.services.cost_estimator import estimate_trip_cost
from backend.services.multi_destination_service import (
    get_nearby_destinations,
    suggest_multi_destination_splits,
    generate_detailed_personalized_itinerary,
    estimate_multi_destination_cost
)
from backend.services.weather_service import get_weather_for_destination
from backend.services.transport_service import get_transport_recommendations
from backend.services.hotel_service import get_available_hotels, book_hotel_room
from backend.services.geocoding_service import search_geocode, reverse_geocode
from backend.services.routing_service import calculate_route
from backend.services.transport_cost_service import calculate_transport_options, get_active_rates, format_duration
from backend.services.recommendation_service import score_transport_options
from backend.services.ai_service import personalize_transport_recommendations, check_origin_transit_feasibility

trip_bp = Blueprint("trip", __name__)

# ----------------- LOCATION SEARCH & GEOCODING -----------------
@trip_bp.route("/geocode", methods=["GET"])
def api_geocode():
    """
    Search and autocompletes places/cities, returning coordinates and labels.
    Never exposes secret ORS API keys to the browser.
    """
    q = request.args.get("q", "").strip()
    limit = int(request.args.get("limit", 6))
    if not q or len(q) < 2:
        return jsonify({"results": []}), 200

    results = search_geocode(q, limit=limit)
    return jsonify({"results": results}), 200

@trip_bp.route("/reverse-geocode", methods=["GET"])
def api_reverse_geocode():
    """
    Reverse geocodes [lat, lon] coordinates to place name and address.
    Used when user clicks on the map or drags the origin/destination pins.
    """
    lat = request.args.get("lat") or request.args.get("latitude")
    lon = request.args.get("lon") or request.args.get("lng") or request.args.get("longitude")
    if not lat or not lon:
        return jsonify({"error": "Latitude and longitude required"}), 400

    result = reverse_geocode(lat, lon)
    return jsonify({"result": result}), 200

# ----------------- REAL ROUTE CALCULATION -----------------
@trip_bp.route("/route", methods=["POST"])
def api_calculate_route():
    """
    Calculates real road distance, duration, and geometry polyline between origin and destination.
    Uses OpenRouteService Directions API with server-side caching and fallback road curvature modeling.
    """
    data = request.get_json() or {}
    
    # Extract origin
    origin_data = data.get("origin") or {}
    dest_data = data.get("destination") or {}
    profile = data.get("profile", "driving-car")

    # Support object {latitude, longitude} or string
    lat1 = None
    lon1 = None
    origin_name = "Origin"
    if isinstance(origin_data, dict):
        lat1 = origin_data.get("latitude") or origin_data.get("lat")
        lon1 = origin_data.get("longitude") or origin_data.get("lon") or origin_data.get("lng")
        origin_name = origin_data.get("name") or origin_data.get("label", "Origin")
    elif isinstance(origin_data, str) and origin_data.strip():
        origin_name = origin_data.strip()
        geo = search_geocode(origin_name, limit=1)
        if geo:
            lat1 = geo[0]["latitude"]
            lon1 = geo[0]["longitude"]

    lat2 = None
    lon2 = None
    dest_name = "Destination"
    if isinstance(dest_data, dict):
        lat2 = dest_data.get("latitude") or dest_data.get("lat")
        lon2 = dest_data.get("longitude") or dest_data.get("lon") or dest_data.get("lng")
        dest_name = dest_data.get("name") or dest_data.get("label", "Destination")
    elif isinstance(dest_data, str) and dest_data.strip():
        dest_name = dest_data.strip()
        geo = search_geocode(dest_name, limit=1)
        if geo:
            lat2 = geo[0]["latitude"]
            lon2 = geo[0]["longitude"]

    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return jsonify({
            "message": "Valid latitude and longitude are required for both origin and destination.",
            "distance_km": 0,
            "duration_minutes": 0,
            "geometry": []
        }), 400

    route_res = calculate_route(lat1, lon1, lat2, lon2, profile=profile)
    
    # Enrich with human-friendly metadata
    dur_mins = route_res.get("duration_minutes", 0)
    dur_formatted = format_duration(dur_mins)

    return jsonify({
        "distance_km": route_res.get("distance_km", 0.0),
        "duration_minutes": dur_mins,
        "duration_formatted": dur_formatted,
        "geometry": route_res.get("geometry", []),
        "origin": {
            "name": origin_name,
            "latitude": float(lat1),
            "longitude": float(lon1)
        },
        "destination": {
            "name": dest_name,
            "latitude": float(lat2),
            "longitude": float(lon2)
        },
        "profile": profile,
        "data_source": route_res.get("data_source", "OpenRouteService Directions API"),
        "is_real_api": route_res.get("is_real_api", False)
    }), 200

# ----------------- DYNAMIC TRANSPORT OPTIONS & COST ENGINE -----------------
@trip_bp.route("/transport-options", methods=["POST"])
def api_get_transport_options():
    """
    Computes all transportation modes, distances, travel times, and itemized cost breakdowns.
    """
    data = request.get_json() or {}
    travelers = int(data.get("travelers", 1))
    budget = float(data.get("budget", 15000.0))
    preferences = data.get("preferences", {})

    origin_raw = data.get("origin") or {}
    dest_raw = data.get("destination") or {}

    origin_name = "Origin"
    dest_name = "Destination"
    lat1, lon1, lat2, lon2 = None, None, None, None

    if isinstance(origin_raw, dict):
        origin_name = origin_raw.get("name") or origin_raw.get("label", "Origin")
        lat1 = origin_raw.get("latitude") or origin_raw.get("lat")
        lon1 = origin_raw.get("longitude") or origin_raw.get("lon") or origin_raw.get("lng")
    else:
        origin_name = str(origin_raw).strip() or "Origin"

    if isinstance(dest_raw, dict):
        dest_name = dest_raw.get("name") or dest_raw.get("label", "Destination")
        lat2 = dest_raw.get("latitude") or dest_raw.get("lat")
        lon2 = dest_raw.get("longitude") or dest_raw.get("lon") or dest_raw.get("lng")
    else:
        dest_name = str(dest_raw).strip() or "Destination"

    # Geocode if coordinates are missing
    if lat1 is None or lon1 is None:
        g1 = search_geocode(origin_name, limit=1)
        if g1:
            lat1, lon1 = g1[0]["latitude"], g1[0]["longitude"]
        else:
            lat1, lon1 = 9.9312, 76.2673

    if lat2 is None or lon2 is None:
        g2 = search_geocode(dest_name, limit=1)
        if g2:
            lat2, lon2 = g2[0]["latitude"], g2[0]["longitude"]
        else:
            lat2, lon2 = 10.0889, 77.0595

    # Compute actual road route
    route_data = calculate_route(lat1, lon1, lat2, lon2)
    dist_km = route_data.get("distance_km", 20.0)
    dur_mins = route_data.get("duration_minutes", 60)

    origin_obj = origin_raw if isinstance(origin_raw, dict) else (g1[0] if g1 else None)
    dest_obj = dest_raw if isinstance(dest_raw, dict) else (g2[0] if g2 else None)

    # Feasibility evaluation
    feasibility = check_origin_transit_feasibility(origin_name, dest_name, dist_km, origin_obj=origin_obj, dest_obj=dest_obj)

    # Calculate options via Transport Cost Engine
    options = calculate_transport_options(
        origin_name=origin_name,
        dest_name=dest_name,
        distance_km=dist_km,
        duration_minutes=dur_mins,
        travelers=travelers,
        preferences=preferences,
        origin_obj=origin_obj,
        dest_obj=dest_obj
    )

    # Run multi-criteria scoring
    scored_options = score_transport_options(
        options=options,
        budget=budget,
        travelers=travelers,
        preferences=preferences
    )

    return jsonify({
        "origin": {"name": origin_name, "latitude": lat1, "longitude": lon1, "country": origin_obj.get("country", "") if origin_obj else ""},
        "destination": {"name": dest_name, "latitude": lat2, "longitude": lon2, "country": dest_obj.get("country", "") if dest_obj else ""},
        "distance_km": dist_km,
        "duration_minutes": dur_mins,
        "duration_formatted": format_duration(dur_mins),
        "geometry": route_data.get("geometry", []),
        "travelers": travelers,
        "budget": budget,
        "options": scored_options,
        "excluded_modes": feasibility.get("excluded_modes", []),
        "ai_feasibility": feasibility,
        "data_source": route_data.get("data_source", "OpenRouteService Directions API")
    }), 200

# ----------------- AI-PERSONALIZED RECOMMENDATION ENDPOINT -----------------
@trip_bp.route("/recommendations", methods=["POST"])
def api_get_recommendations():
    """
    Combines real route calculations, cost engine models, MCDA scoring,
    and Gemini AI personalized explanation.
    """
    data = request.get_json() or {}
    travelers = int(data.get("travelers", 1))
    budget = float(data.get("budget", 15000.0))
    interests = data.get("interests", [])
    comfort = data.get("comfort", "Comfortable")
    style = data.get("style", "balanced")
    
    preferences = {
        "interests": interests,
        "comfort": comfort,
        "style": style
    }

    origin_raw = data.get("origin") or "Kochi"
    dest_raw = data.get("destination") or "Varkala"

    origin_name = "Origin"
    dest_name = "Destination"
    lat1, lon1, lat2, lon2 = None, None, None, None

    if isinstance(origin_raw, dict):
        origin_name = origin_raw.get("name") or origin_raw.get("label", "Origin")
        lat1 = origin_raw.get("latitude") or origin_raw.get("lat")
        lon1 = origin_raw.get("longitude") or origin_raw.get("lon") or origin_raw.get("lng")
    else:
        origin_name = str(origin_raw).strip() or "Kochi"

    if isinstance(dest_raw, dict):
        dest_name = dest_raw.get("name") or dest_raw.get("label", "Destination")
        lat2 = dest_raw.get("latitude") or dest_raw.get("lat")
        lon2 = dest_raw.get("longitude") or dest_raw.get("lon") or dest_raw.get("lng")
    else:
        dest_name = str(dest_raw).strip() or "Varkala"

    # Geocode coordinates if missing
    g1 = None
    g2 = None
    if lat1 is None or lon1 is None:
        g1 = search_geocode(origin_name, limit=1)
        if g1:
            lat1, lon1 = g1[0]["latitude"], g1[0]["longitude"]
        else:
            lat1, lon1 = 9.9312, 76.2673

    if lat2 is None or lon2 is None:
        g2 = search_geocode(dest_name, limit=1)
        if g2:
            lat2, lon2 = g2[0]["latitude"], g2[0]["longitude"]
        else:
            lat2, lon2 = 8.7379, 76.7163

    # Route calculation
    route_data = calculate_route(lat1, lon1, lat2, lon2)
    dist_km = route_data.get("distance_km", 191.1)
    dur_mins = route_data.get("duration_minutes", 240)

    origin_obj = origin_raw if isinstance(origin_raw, dict) else (g1[0] if g1 else None)
    dest_obj = dest_raw if isinstance(dest_raw, dict) else (g2[0] if g2 else None)

    # Feasibility evaluation
    feasibility = check_origin_transit_feasibility(origin_name, dest_name, dist_km, origin_obj=origin_obj, dest_obj=dest_obj)

    # Calculate options
    options = calculate_transport_options(
        origin_name=origin_name,
        dest_name=dest_name,
        distance_km=dist_km,
        duration_minutes=dur_mins,
        travelers=travelers,
        preferences=preferences,
        origin_obj=origin_obj,
        dest_obj=dest_obj
    )

    # Deterministic scoring
    scored_options = score_transport_options(
        options=options,
        budget=budget,
        travelers=travelers,
        preferences=preferences
    )

    # Gemini AI Personalization (with safe fallback & transit constraint awareness)
    ai_advice = personalize_transport_recommendations(
        origin=origin_name,
        destination=dest_name,
        distance_km=dist_km,
        duration_minutes=dur_mins,
        travelers=travelers,
        budget=budget,
        transport_options=scored_options,
        preferences=preferences,
        excluded_modes=feasibility.get("excluded_modes", [])
    )

    return jsonify({
        "origin": {"name": origin_name, "latitude": lat1, "longitude": lon1, "country": origin_obj.get("country", "") if origin_obj else ""},
        "destination": {"name": dest_name, "latitude": lat2, "longitude": lon2, "country": dest_obj.get("country", "") if dest_obj else ""},
        "distance_km": dist_km,
        "duration_minutes": dur_mins,
        "duration_formatted": format_duration(dur_mins),
        "geometry": route_data.get("geometry", []),
        "travelers": travelers,
        "budget": budget,
        "options": scored_options,
        "excluded_modes": feasibility.get("excluded_modes", []),
        "ai_feasibility": feasibility,
        "ai_advice": ai_advice,
        "data_source": route_data.get("data_source", "OpenRouteService Directions API")
    }), 200

# ----------------- AI TRAVEL ADVICE ENDPOINT -----------------
@trip_bp.route("/ai/travel-advice", methods=["POST"])
def api_get_ai_travel_advice():
    """
    Provides intelligent route insights and travel advice for chosen locations.
    """
    data = request.get_json() or {}
    origin = data.get("origin", "Kochi")
    destination = data.get("destination", "Varkala")
    travelers = int(data.get("travelers", 2))
    budget = float(data.get("budget", 15000.0))
    
    # Calculate route
    g1 = search_geocode(origin, limit=1)
    g2 = search_geocode(destination, limit=1)
    lat1, lon1 = (g1[0]["latitude"], g1[0]["longitude"]) if g1 else (9.9312, 76.2673)
    lat2, lon2 = (g2[0]["latitude"], g2[0]["longitude"]) if g2 else (8.7379, 76.7163)
    
    route_data = calculate_route(lat1, lon1, lat2, lon2)
    dist_km = route_data.get("distance_km", 191.1)
    dur_mins = route_data.get("duration_minutes", 240)
    
    origin_obj = g1[0] if g1 else None
    dest_obj = g2[0] if g2 else None

    feasibility = check_origin_transit_feasibility(origin, destination, dist_km, origin_obj=origin_obj, dest_obj=dest_obj)
    options = calculate_transport_options(origin, destination, dist_km, dur_mins, travelers=travelers, origin_obj=origin_obj, dest_obj=dest_obj)
    scored = score_transport_options(options, budget=budget, travelers=travelers)
    
    ai_advice = personalize_transport_recommendations(
        origin=origin,
        destination=destination,
        distance_km=dist_km,
        duration_minutes=dur_mins,
        travelers=travelers,
        budget=budget,
        transport_options=scored,
        excluded_modes=feasibility.get("excluded_modes", [])
    )
    
    return jsonify({
        "origin": origin,
        "destination": destination,
        "distance_km": dist_km,
        "duration_formatted": format_duration(dur_mins),
        "excluded_modes": feasibility.get("excluded_modes", []),
        "ai_feasibility": feasibility,
        "ai_advice": ai_advice
    }), 200

# ----------------- PUBLIC TRANSPORT RATES -----------------
@trip_bp.route("/transport-rates", methods=["GET"])
def api_get_transport_rates():
    """
    Returns public transport rate formulas and configured per-km tariffs for full transparency.
    """
    rates_df = load_csv("transport_rates")
    if rates_df.empty:
        active = get_active_rates()
        return jsonify({"rates": list(active.values())}), 200
        
    records = rates_df[rates_df["active"].astype(int) == 1].to_dict(orient="records")
    return jsonify({"rates": records}), 200


@trip_bp.route("/plan-trip", methods=["POST"])
def plan_trip():
    """
    Inputs travel preferences and returns top recommendations matching budget and style.
    """
    data = request.get_json() or {}
    source_location = data.get("source_location", "Kochi")
    
    # Support multiple preferred categories (destination_types or destination_type)
    raw_types = data.get("destination_types")
    if raw_types is None:
        raw_types = data.get("destination_type", ["hill station"])
        
    if isinstance(raw_types, str):
        if "," in raw_types:
            destination_types = [s.strip().lower() for s in raw_types.split(",") if s.strip()]
        elif raw_types.strip():
            destination_types = [raw_types.strip().lower()]
        else:
            destination_types = ["hill station"]
    elif isinstance(raw_types, (list, tuple)):
        destination_types = [str(s).strip().lower() for s in raw_types if str(s).strip()]
        if not destination_types:
            destination_types = ["hill station"]
    else:
        destination_types = ["hill station"]

    destination_type_str = ", ".join(destination_types)

    budget = float(data.get("budget", 15000.0))
    travelers = int(data.get("travelers", 2))
    duration_days = int(data.get("duration_days", 3))
    interests = data.get("interests", [])
    group_type = str(data.get("group_type", "family")).lower()
    state = data.get("state", "")
    travel_date = data.get("travel_date", "")

    # Enforce exactly 1 traveler for solo trip plans
    if group_type == "solo":
        travelers = 1

    # Date validation: travel_date cannot be in the past
    if travel_date and str(travel_date).strip():
        date_str = str(travel_date).strip()
        parsed_date = None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                parsed_date = datetime.datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                continue

        if not parsed_date:
            return jsonify({"message": "Invalid date format. Please enter a valid date (DD/MM/YYYY or YYYY-MM-DD)."}), 400

        today = datetime.date.today()
        if parsed_date < today:
            return jsonify({"message": "Please enter a correct date. Travel date cannot be in the past."}), 400

        # Standardize to ISO format YYYY-MM-DD
        travel_date = parsed_date.strftime("%Y-%m-%d")

    user = get_optional_user()
    user_id = user["id"] if user else data.get("user_id")

    preferences = {
        "source_location": source_location,
        "destination_type": destination_type_str,
        "destination_types": destination_types,
        "budget": budget,
        "travelers": travelers,
        "duration_days": duration_days,
        "interests": interests,
        "group_type": group_type,
        "state": state,
        "travel_date": travel_date,
        "user_id": user_id
    }
    
    recommendations = recommend_destinations(preferences, user_id=user_id)
    
    if len(recommendations) > 0:
        message = f"Found {len(recommendations)} destination(s) matching your preferences and budget."
    else:
        message = f"There is no destination found within your budget limit of ₹{int(budget):,}. Please try increasing your budget or adjusting the duration/travelers."

    return jsonify({
        "preferences": preferences,
        "recommendations": recommendations,
        "message": message
    }), 200

@trip_bp.route("/recommendations/past-trips", methods=["GET", "POST"])
def get_past_trip_recommendations():
    """
    Returns recommendations tailored to user's completed trips (e.g. Munnar -> Wayanad, Thekkady).
    The visited destination is not placed in first spot; similar fresh places are ranked first.
    """
    user = get_optional_user()
    req_data = (request.get_json(silent=True) or {}) if request.method == "POST" else {}
    user_id = user["id"] if user else (req_data.get("user_id") or request.args.get("user_id"))
    base_dest_id = req_data.get("base_dest_id") or request.args.get("base_dest_id")
    budget = float(req_data.get("budget") or request.args.get("budget") or 15000.0)
    travelers = int(req_data.get("travelers") or request.args.get("travelers") or 2)
    duration_days = int(req_data.get("duration_days") or request.args.get("duration_days") or 3)

    result = recommend_destinations_based_on_past_trips(
        user_id=user_id,
        base_dest_id=base_dest_id,
        budget=budget,
        duration_days=duration_days,
        travelers=travelers
    )
    return jsonify(result), 200

# ----------------- NEARBY DESTINATIONS FOR MULTI-STOP PLANNING -----------------
@trip_bp.route("/destinations/<int:dest_id>/nearby", methods=["GET"])
def api_get_nearby_destinations(dest_id):
    """
    Returns nearby complementary destinations with road distance, travel time, and pairing rationale.
    Ideal for multi-destination trips (e.g., 3 days in Munnar + 2 days in Vagamon).
    """
    limit = int(request.args.get("limit", 6))
    nearby = get_nearby_destinations(dest_id, limit=limit)
    return jsonify({"destination_id": dest_id, "nearby_destinations": nearby}), 200

# ----------------- MULTI-DESTINATION ITINERARY & COST ENGINE -----------------
@trip_bp.route("/multi-destination-itinerary", methods=["POST"])
def api_generate_multi_destination_itinerary():
    """
    Generates a personalized, time-slotted day-by-day itinerary spanning multiple destinations.
    Seamlessly incorporates transition transfers and user-selected attractions, hotels, and dining.
    """
    data = request.get_json() or {}
    source_location = data.get("source_location", "Kochi")
    segments = data.get("segments", [])
    travelers = int(data.get("travelers", 2))
    group_type = data.get("group_type", "family")
    pace = data.get("pace", "moderate")

    if not segments:
        return jsonify({"message": "At least one destination segment is required."}), 400

    itinerary = generate_detailed_personalized_itinerary(
        source_location=source_location,
        segments=segments,
        travelers=travelers,
        group_type=group_type,
        pace=pace
    )
    return jsonify({"itinerary": itinerary}), 200

@trip_bp.route("/multi-destination-cost", methods=["POST"])
def api_estimate_multi_destination_cost():
    """
    Estimates combined transparent costs for multi-destination trips.
    """
    data = request.get_json() or {}
    segments = data.get("segments", [])
    travelers = int(data.get("travelers", 2))
    user_budget = data.get("budget") or data.get("user_budget")

    if not segments:
        return jsonify({"message": "Segments are required for cost estimation."}), 400

    cost = estimate_multi_destination_cost(segments, travelers=travelers, user_budget=user_budget)
    return jsonify({"cost_estimation": cost}), 200

@trip_bp.route("/generate-itinerary", methods=["POST"])
def api_generate_itinerary():
    """
    Generates a personalized, time-slotted day-by-day itinerary with exact selected names.
    """
    data = request.get_json() or {}
    dest_id = data.get("destination_id")
    duration = int(data.get("duration_days", 3))
    interests = data.get("interests", [])
    hotel_id = data.get("hotel_id")
    restaurant_id = data.get("restaurant_id")
    group_type = data.get("group_type", "family")
    pace = data.get("pace", "moderate")
    selected_attractions = data.get("selected_attractions")
    selected_restaurants = data.get("selected_restaurants")
    selected_hotel_name = data.get("selected_hotel_name")
    selected_transport = data.get("selected_transport")
    source_location = data.get("source_location", "Kochi")
    custom_items = data.get("custom_items", [])
    
    if not dest_id:
        return jsonify({"message": "destination_id is required"}), 400
        
    itinerary = generate_itinerary(
        destination_id=dest_id,
        duration_days=duration,
        interests=interests,
        hotel_id=hotel_id,
        restaurant_id=restaurant_id,
        group_type=group_type,
        pace=pace,
        selected_attractions=selected_attractions,
        selected_restaurants=selected_restaurants,
        selected_hotel_name=selected_hotel_name,
        selected_transport=selected_transport,
        source_location=source_location,
        custom_items=custom_items
    )
    return jsonify({"itinerary": itinerary}), 200

@trip_bp.route("/estimate-cost", methods=["POST"])
def api_estimate_cost():
    """
    Estimates the transparent overall trip cost with itemized breakdown and budget comparison.
    """
    data = request.get_json() or {}
    dest_id = data.get("destination_id")
    travelers = int(data.get("travelers", 1))
    duration = int(data.get("duration_days", 3))
    hotel_id = data.get("hotel_id")
    transport_id = data.get("transport_id")
    restaurant_id = data.get("restaurant_id")
    user_budget = data.get("budget") or data.get("user_budget")
    
    if not dest_id:
        return jsonify({"message": "destination_id is required"}), 400
        
    cost = estimate_trip_cost(dest_id, travelers, duration, hotel_id, transport_id, restaurant_id, user_budget)
    return jsonify({"cost_estimation": cost}), 200

def check_trip_date_conflict(user_id, start_date_str, duration_days, exclude_trip_id=None):
    """
    Validates whether saving or scheduling a trip for `user_id` from `start_date_str`
    for `duration_days` conflicts/overlaps with any of their other saved trips.
    Returns: (has_conflict: bool, message: str, conflict_details: dict)
    """
    if not start_date_str:
        return False, "", None

    parsed_start = None
    date_str = str(start_date_str).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            parsed_start = datetime.datetime.strptime(date_str, fmt).date()
            break
        except ValueError:
            continue

    if not parsed_start:
        return False, "", None

    duration = max(1, int(duration_days or 1))
    parsed_end = parsed_start + datetime.timedelta(days=duration - 1)

    existing_trips = filter_rows("saved_trips", {"user_id": int(user_id)})
    for trip in existing_trips:
        t_id = int(trip.get("id", 0))
        if exclude_trip_id and t_id == int(exclude_trip_id):
            continue

        status = str(trip.get("status", "")).lower().strip()
        if status in ["cancelled", "canceled", "deleted"]:
            continue

        t_date_raw = str(trip.get("travel_date", "")).strip()
        if not t_date_raw:
            continue

        t_start = None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                t_start = datetime.datetime.strptime(t_date_raw, fmt).date()
                break
            except ValueError:
                continue

        if not t_start:
            continue

        t_duration = max(1, int(trip.get("duration_days") or 1))
        t_end = t_start + datetime.timedelta(days=t_duration - 1)

        # Check date overlap: parsed_start <= t_end and t_start <= parsed_end
        if parsed_start <= t_end and t_start <= parsed_end:
            trip_title = trip.get("trip_name") or f"Trip #{t_id}"
            exist_range_str = f"{t_start.strftime('%d-%m-%Y')} to {t_end.strftime('%d-%m-%Y')}"
            req_range_str = f"{parsed_start.strftime('%d-%m-%Y')} to {parsed_end.strftime('%d-%m-%Y')}"

            conflict_msg = (
                f"Date conflict: You already have a saved trip '{trip_title}' scheduled from "
                f"{exist_range_str} ({t_duration} days). "
                f"No other trip can be saved during this duration ({req_range_str}). "
                f"Please choose a different travel date or modify your existing trip."
            )
            conflict_data = {
                "conflicting_trip_id": t_id,
                "conflicting_trip_name": trip_title,
                "conflicting_start_date": t_start.strftime("%Y-%m-%d"),
                "conflicting_end_date": t_end.strftime("%Y-%m-%d"),
                "conflicting_range": exist_range_str,
                "requested_start_date": parsed_start.strftime("%Y-%m-%d"),
                "requested_end_date": parsed_end.strftime("%Y-%m-%d"),
                "requested_range": req_range_str
            }
            return True, conflict_msg, conflict_data

    return False, "", None

@trip_bp.route("/check-date-conflict", methods=["POST"])
@token_required
def api_check_date_conflict(current_user):
    """
    Checks if a prospective trip date range conflicts with existing saved trips for the user.
    """
    data = request.get_json() or {}
    travel_date = data.get("travel_date") or data.get("date")
    duration_days = data.get("duration_days") or data.get("duration", 1)
    exclude_trip_id = data.get("exclude_trip_id")

    if not travel_date:
        return jsonify({"has_conflict": False, "message": "No date provided"}), 200

    has_conflict, msg, details = check_trip_date_conflict(
        current_user["id"],
        travel_date,
        duration_days,
        exclude_trip_id=exclude_trip_id
    )

    return jsonify({
        "has_conflict": has_conflict,
        "message": msg,
        "conflict_trip": details
    }), 200

@trip_bp.route("/save-trip", methods=["POST"])
@token_required
def save_trip(current_user):
    data = request.get_json() or {}
    dest_id = data.get("destination_id")
    source_location = data.get("source_location", "")
    budget = data.get("budget", 0)
    travelers = data.get("travelers", 1)
    duration_days = data.get("duration_days", 3)
    interests = data.get("interests", [])
    itinerary = data.get("itinerary", "")
    estimated_cost = data.get("estimated_cost", 0)
    hotel_id = data.get("hotel_id")
    raw_travel_date = data.get("travel_date", "")
    
    # Multi-destination & Personalized Trip Metadata
    segments = data.get("segments") or []
    trip_name = data.get("trip_name") or ""
    travel_style = data.get("travel_style") or "balanced"
    pace = data.get("pace") or "moderate"
    route_data = data.get("route_data") or {}
    cost_breakdown = data.get("cost_breakdown") or {}
    
    if not dest_id and segments and len(segments) > 0:
        dest_id = segments[0].get("destination_id")
        
    if not dest_id:
        return jsonify({"message": "destination_id or destination segments are required"}), 400

    # Standardize trip start date
    travel_date = ""
    if raw_travel_date and str(raw_travel_date).strip():
        date_str = str(raw_travel_date).strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                parsed_d = datetime.datetime.strptime(date_str, fmt).date()
                travel_date = parsed_d.strftime("%Y-%m-%d")
                break
            except ValueError:
                continue
    if not travel_date:
        travel_date = datetime.date.today().strftime("%Y-%m-%d")

    # Strict Validation: Check for overlapping saved trips for this user
    has_conflict, conflict_msg, conflict_details = check_trip_date_conflict(
        current_user["id"],
        travel_date,
        duration_days
    )
    if has_conflict:
        return jsonify({
            "message": conflict_msg,
            "error": "DATE_CONFLICT",
            "conflict_trip": conflict_details
        }), 400

    if hotel_id:
        book_hotel_room(hotel_id, 1)

    # If multi-segment trip has multiple hotel bookings, book them
    if isinstance(segments, list):
        for seg in segments:
            h_id = seg.get("hotel_id")
            if h_id:
                try:
                    book_hotel_room(int(h_id), 1)
                except Exception:
                    pass

    trip_row = {
        "user_id": int(current_user["id"]),
        "destination_id": int(dest_id),
        "source_location": source_location,
        "budget": float(budget),
        "travelers": int(travelers),
        "duration_days": int(duration_days),
        "interests": json.dumps(interests) if isinstance(interests, list) else str(interests),
        "itinerary_text": json.dumps(itinerary) if not isinstance(itinerary, str) else itinerary,
        "estimated_cost": float(estimated_cost),
        "travel_date": travel_date,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "planned",
        "trip_name": trip_name,
        "travel_style": travel_style,
        "pace": pace,
        "segments_json": json.dumps(segments) if isinstance(segments, list) else str(segments),
        "route_json": json.dumps(route_data) if isinstance(route_data, dict) else str(route_data),
        "personalization_score": 95 if len(segments) > 1 else 90,
        "cost_breakdown_json": json.dumps(cost_breakdown) if isinstance(cost_breakdown, dict) else str(cost_breakdown)
    }
    
    saved = insert_row("saved_trips", trip_row)
    return jsonify({"message": "Trip planned and saved successfully!", "trip": saved}), 201

@trip_bp.route("/my-trips", methods=["GET"])
@token_required
def get_my_trips(current_user):
    trips = filter_rows("saved_trips", {"user_id": int(current_user["id"])})
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    hydrated_trips = []
    for trip in trips:
        dest = find_by_id("destinations", trip["destination_id"])
        trip["destination_name"] = dest["name"] if dest else "Unknown Destination"
        trip["destination_image"] = dest.get("image_url", "") if dest else ""
        
        # Ensure planned travel date (trip start date) is available
        t_date = str(trip.get("travel_date", "")).strip()
        if not t_date or t_date in ("nan", "None"):
            created_raw = str(trip.get("created_at", "")).split(" ")[0]
            trip["travel_date"] = created_raw if created_raw else today_str
        else:
            trip["travel_date"] = t_date

        # Completion Status: Strictly true when user marks it completed
        raw_status = str(trip.get("status", "")).strip().lower()
        is_completed = (raw_status == "completed")
        trip["status"] = "completed" if is_completed else "planned"
        trip["is_completed"] = bool(is_completed)
            
        try:
            trip["interests"] = json.loads(trip["interests"])
        except Exception:
            pass
        try:
            trip["itinerary_text"] = json.loads(trip["itinerary_text"])
        except Exception:
            pass
            
        # Parse multi-destination segments
        segments = []
        seg_str = str(trip.get("segments_json", "")).strip()
        if seg_str and seg_str not in ("nan", "None", "[]", ""):
            try:
                segments = json.loads(seg_str)
            except Exception:
                segments = []
        trip["segments"] = segments

        if len(segments) > 1:
            dest_names = [s.get("destination_name") for s in segments if s.get("destination_name")]
            if dest_names:
                trip["multi_destination_title"] = " & ".join(dest_names)
                trip["is_multi_destination"] = True
            else:
                trip["is_multi_destination"] = False
        else:
            trip["is_multi_destination"] = False

        try:
            trip["route_json"] = json.loads(trip["route_json"]) if trip.get("route_json") else {}
        except Exception:
            trip["route_json"] = {}

        try:
            trip["cost_breakdown_json"] = json.loads(trip["cost_breakdown_json"]) if trip.get("cost_breakdown_json") else {}
        except Exception:
            trip["cost_breakdown_json"] = {}
            
        hydrated_trips.append(trip)
        
    hydrated_trips = sorted(hydrated_trips, key=lambda x: str(x.get("created_at", "")), reverse=True)
    return jsonify({"trips": hydrated_trips}), 200

@trip_bp.route("/my-trips/<int:trip_id>", methods=["GET"])
@token_required
def get_single_saved_trip(current_user, trip_id):
    """
    Returns a single saved trip hydrated with all destination metadata, itinerary, and segments.
    """
    trip = find_by_id("saved_trips", trip_id)
    if not trip:
        return jsonify({"message": "Saved trip not found."}), 404

    if int(trip.get("user_id", -1)) != int(current_user["id"]) and not current_user.get("is_admin", False):
        return jsonify({"message": "You are not authorized to view this trip."}), 403

    dest = find_by_id("destinations", trip["destination_id"])
    trip["destination_name"] = dest["name"] if dest else "Unknown Destination"
    trip["destination_image"] = dest.get("image_url", "") if dest else ""

    today_str = datetime.date.today().strftime("%Y-%m-%d")
    t_date = str(trip.get("travel_date", "")).strip()
    if not t_date or t_date in ("nan", "None"):
        created_raw = str(trip.get("created_at", "")).split(" ")[0]
        trip["travel_date"] = created_raw if created_raw else today_str
    else:
        trip["travel_date"] = t_date

    raw_status = str(trip.get("status", "")).strip().lower()
    is_completed = (raw_status == "completed")
    trip["status"] = "completed" if is_completed else "planned"
    trip["is_completed"] = bool(is_completed)

    try:
        trip["interests"] = json.loads(trip["interests"])
    except Exception:
        pass
    try:
        trip["itinerary_text"] = json.loads(trip["itinerary_text"])
    except Exception:
        pass

    segments = []
    seg_str = str(trip.get("segments_json", "")).strip()
    if seg_str and seg_str not in ("nan", "None", "[]", ""):
        try:
            segments = json.loads(seg_str)
        except Exception:
            segments = []
    trip["segments"] = segments

    if len(segments) > 1:
        dest_names = [s.get("destination_name") for s in segments if s.get("destination_name")]
        if dest_names:
            trip["multi_destination_title"] = " & ".join(dest_names)
            trip["is_multi_destination"] = True
    else:
        trip["is_multi_destination"] = False

    return jsonify({"trip": trip}), 200

@trip_bp.route("/my-trips/<int:trip_id>/complete", methods=["PUT", "POST", "PATCH"])
@token_required
def complete_my_trip(current_user, trip_id):
    """
    Marks a saved trip as completed (or toggles between completed and planned).
    """
    trip = find_by_id("saved_trips", trip_id)
    if not trip:
        return jsonify({"message": "Saved trip not found."}), 404

    if int(trip.get("user_id", -1)) != int(current_user["id"]) and not current_user.get("is_admin", False):
        return jsonify({"message": "You are not authorized to modify this trip."}), 403

    data = request.get_json(silent=True) or {}
    target_status = data.get("status", "completed").strip().lower()
    if target_status not in ("completed", "planned"):
        target_status = "completed"

    today_str = datetime.date.today().strftime("%Y-%m-%d")
    updates = {"status": target_status}
    
    # When completing, ensure travel_date is at or before today so past trip queries find it immediately
    t_date = str(trip.get("travel_date", "")).strip()
    if target_status == "completed":
        if not t_date or t_date in ("nan", "None") or t_date > today_str:
            updates["travel_date"] = today_str

    success = update_row("saved_trips", trip_id, updates)
    if success:
        updated_trip = find_by_id("saved_trips", trip_id)
        dest = find_by_id("destinations", updated_trip["destination_id"]) if updated_trip else None
        dest_name = dest["name"] if dest else "Destination"
        is_now_completed = (target_status == "completed")
        return jsonify({
            "message": f"Trip to {dest_name} {'marked as completed! 🎉' if is_now_completed else 'set to planned.'}",
            "trip_id": trip_id,
            "status": target_status,
            "is_completed": is_now_completed,
            "travel_date": updated_trip.get("travel_date") if updated_trip else today_str
        }), 200
    else:
        return jsonify({"message": "Failed to update trip completion status."}), 500

@trip_bp.route("/my-trips/<int:trip_id>/date", methods=["PUT", "PATCH"])
@token_required
def update_my_trip_date(current_user, trip_id):
    """
    Updates the planned start date for an existing saved trip.
    """
    trip = find_by_id("saved_trips", trip_id)
    if not trip:
        return jsonify({"message": "Saved trip not found."}), 404

    if int(trip.get("user_id", -1)) != int(current_user["id"]) and not current_user.get("is_admin", False):
        return jsonify({"message": "You are not authorized to update this trip."}), 403

    data = request.get_json() or {}
    new_date = data.get("travel_date") or data.get("date")
    if not new_date:
        return jsonify({"message": "travel_date is required."}), 400

    date_str = str(new_date).strip()
    parsed_d = None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            parsed_d = datetime.datetime.strptime(date_str, fmt).date()
            break
        except ValueError:
            continue

    if not parsed_d:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY."}), 400

    formatted_date = parsed_d.strftime("%Y-%m-%d")
    trip_duration = int(trip.get("duration_days") or 1)

    # Check for date conflict with user's other saved trips
    has_conflict, conflict_msg, conflict_details = check_trip_date_conflict(
        current_user["id"],
        formatted_date,
        trip_duration,
        exclude_trip_id=trip_id
    )
    if has_conflict:
        return jsonify({
            "message": conflict_msg,
            "error": "DATE_CONFLICT",
            "conflict_trip": conflict_details
        }), 400

    success = update_row("saved_trips", trip_id, {"travel_date": formatted_date})
    if success:
        return jsonify({"message": "Trip start date updated successfully!", "travel_date": formatted_date}), 200
    else:
        return jsonify({"message": "Failed to update trip date."}), 500

@trip_bp.route("/my-trips/<int:trip_id>", methods=["DELETE"])
@token_required
def delete_my_trip(current_user, trip_id):
    """
    Deletes a saved trip belonging to the logged-in user (or admin).
    """
    trip = find_by_id("saved_trips", trip_id)
    if not trip:
        return jsonify({"message": "Saved trip not found."}), 404

    # Authorization check: user must own the trip or be an admin
    if int(trip.get("user_id", -1)) != int(current_user["id"]) and not current_user.get("is_admin", False):
        return jsonify({"message": "You are not authorized to delete this trip."}), 403

    success = delete_row("saved_trips", trip_id)
    if success:
        return jsonify({"message": "Saved trip deleted successfully.", "deleted_id": trip_id}), 200
    else:
        return jsonify({"message": "Failed to delete saved trip."}), 500

# ----------------- WEATHER FORECAST -----------------
@trip_bp.route("/weather/<int:destination_id>", methods=["GET"])
def api_get_weather(destination_id):
    """
    Returns current weather plus a 5-day daily forecast for a destination.
    """
    dest = find_by_id("destinations", destination_id)
    if not dest:
        return jsonify({"message": "Destination not found"}), 404
        
    weather_data = get_weather_for_destination(dest["id"], dest["name"], dest["category"])
    return jsonify({"weather": weather_data}), 200

# ----------------- TRANSPORTATION RECOMMENDATIONS -----------------
@trip_bp.route("/transportation/<int:destination_id>", methods=["GET"])
def api_get_transport(destination_id):
    """
    Returns recommended transportation options with categories, group fares, and badges.
    Supports user input source and destination for dynamic duration and cost calculation.
    """
    travelers = request.args.get("travelers", 1)
    sort_by = request.args.get("sort_by", "cheapest")
    source = request.args.get("source")
    destination_name = request.args.get("destination")
    
    options = get_transport_recommendations(
        destination_id, 
        travelers=travelers, 
        sort_by=sort_by,
        source=source,
        destination_name=destination_name
    )
    return jsonify({"transportation": options}), 200

@trip_bp.route("/hotels/<int:destination_id>", methods=["GET"])
def api_get_hotels(destination_id):
    hotels = get_available_hotels(destination_id)
    return jsonify({"hotels": hotels}), 200

# ----------------- COMPLAINTS MANAGEMENT -----------------
@trip_bp.route("/complaints", methods=["POST"])
@token_required
def submit_complaint(current_user):
    """
    Allows users to lodge complaints across various categories with priority levels
    and instant automated AI support suggestions.
    """
    data = request.get_json() or {}
    subject = data.get("subject")
    description = data.get("description")
    category = data.get("category", "General")
    priority = data.get("priority", "Medium")
    trip_id = data.get("trip_id")
    
    if not subject or not description:
        return jsonify({"message": "Subject and description are required!"}), 400
        
    desc_lower = description.lower()
    subj_lower = subject.lower()
    cat_lower = str(category).lower()
    
    admin_reply = "Thank you for reaching out. Your ticket has been logged with our 24/7 Traveler Care Team. Our system has automatically verified the ticket details."
    
    # 1. Hotel / Accommodation Full or Booking Issue
    is_hotel_full_complaint = (
        ("hotel" in desc_lower or "resort" in desc_lower or "accommodation" in desc_lower or "room" in desc_lower or "lodging" in desc_lower or "accommodation" in cat_lower) and
        ("full" in desc_lower or "no room" in desc_lower or "booked" in desc_lower or "capacity" in desc_lower or "no availability" in desc_lower or "occupied" in desc_lower)
    )
    
    # 2. Transit Delay or Transport Concern
    is_transit_complaint = (
        ("transport" in cat_lower or "cab" in desc_lower or "bus" in desc_lower or "train" in desc_lower or "flight" in desc_lower or "driver" in desc_lower) and
        ("delay" in desc_lower or "cancelled" in desc_lower or "late" in desc_lower or "missed" in desc_lower or "broken" in desc_lower or "breakdown" in desc_lower)
    )

    # 3. Billing or Refund Request
    is_billing_complaint = (
        "billing" in cat_lower or "refund" in desc_lower or "overcharge" in desc_lower or "payment" in desc_lower or "double charge" in desc_lower
    )

    if is_hotel_full_complaint:
        hotels_df = load_csv("hotels")
        found_hotel = None
        
        if not hotels_df.empty:
            for _, hotel in hotels_df.iterrows():
                h_name = str(hotel["name"]).lower()
                if h_name in desc_lower:
                    found_hotel = hotel
                    break
        
        if found_hotel is None and trip_id:
            trip_obj = find_by_id("saved_trips", int(trip_id))
            if trip_obj:
                dest_id = int(trip_obj["destination_id"])
                dest_hotels = hotels_df[hotels_df["destination_id"] == dest_id]
                if not dest_hotels.empty:
                    found_hotel = dest_hotels.iloc[0]
                    
        if found_hotel is not None:
            dest_id = int(found_hotel["destination_id"])
            h_id = int(found_hotel["id"])
            alt_hotels = hotels_df[
                (hotels_df["destination_id"] == dest_id) & 
                (hotels_df["id"].astype(int) != h_id) & 
                (hotels_df["total_rooms"].astype(int) > 0)
            ]
            
            if not alt_hotels.empty:
                alt_hotel = alt_hotels.iloc[0]
                admin_reply = (
                    f"Instant Support AI: We identified your room availability issue with '{found_hotel['name']}'. "
                    f"We have matched an immediate alternative stay in the vicinity: "
                    f"'{alt_hotel['name']}' ({alt_hotel['hotel_type']}) at '{alt_hotel['address']}' "
                    f"(Price: ₹{alt_hotel['price_per_night']}/night, Rating: ⭐{alt_hotel['rating']}). "
                    f"We recommend booking this verified alternative!"
                )
            else:
                admin_reply = (
                    f"Instant Support AI: We detected that '{found_hotel['name']}' is currently fully booked. "
                    f"Our traveler operations desk has been prioritized to reserve an external partner suite for your dates."
                )
        else:
            admin_reply = (
                "Instant Support AI: We noted your accommodation inquiry. "
                "Our team will suggest the nearest top-rated alternative hotel within 30 minutes."
            )
            
    elif is_transit_complaint:
        admin_reply = (
            "Instant Support AI: Transit delay detected. Our live traffic monitoring shows temporary congestion on the main arterial route. "
            "For urgent alternative cab transfers, please call our 24/7 Transit Helpline at 1800-425-4747 (Toll Free). "
            "Your trip milestone buffer has been automatically adjusted."
        )
    elif is_billing_complaint:
        admin_reply = (
            "Instant Support AI: Your billing inquiry has been queued for immediate accounting review. "
            "Any verified discrepancy will be refunded to your original payment method within 24-48 banking hours. Ticket Ref #TRV-"
            + str(datetime.datetime.now().strftime("%y%m%d%H%M"))
        )
    else:
        admin_reply = (
            f"Instant Support AI: Thank you for logging your concern ({category} - Priority {priority}). "
            "Our automated resolution system has registered your feedback and notified the on-duty destination supervisor."
        )
            
    complaint_row = {
        "user_id": int(current_user["id"]),
        "subject": subject,
        "description": description,
        "category": category,
        "priority": priority,
        "trip_id": int(trip_id) if trip_id else "",
        "status": "Pending",
        "admin_reply": admin_reply,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    saved = insert_row("complaints", complaint_row)
    return jsonify({"message": "Support ticket lodged successfully. Status: Pending Admin Review.", "complaint": saved}), 201

@trip_bp.route("/my-complaints", methods=["GET"])
@token_required
def get_my_complaints(current_user):
    complaints = filter_rows("complaints", {"user_id": int(current_user["id"])})
    complaints = sorted(complaints, key=lambda x: x["created_at"], reverse=True)
    return jsonify({"complaints": complaints}), 200

@trip_bp.route("/complaints/<int:complaint_id>", methods=["DELETE"])
@token_required
def delete_my_complaint(current_user, complaint_id):
    """
    Deletes a support ticket/complaint belonging to the logged-in user (or admin).
    """
    complaint = find_by_id("complaints", complaint_id)
    if not complaint:
        return jsonify({"message": "Support ticket not found."}), 404

    # Authorization check: user must own the complaint or be an admin
    if int(complaint.get("user_id", -1)) != int(current_user["id"]) and not current_user.get("is_admin", False):
        return jsonify({"message": "You are not authorized to delete this support ticket."}), 403

    success = delete_row("complaints", complaint_id)
    if success:
        return jsonify({"message": "Support ticket deleted successfully.", "deleted_id": complaint_id}), 200
    else:
        return jsonify({"message": "Failed to delete support ticket."}), 500

# ----------------- REVIEWS & FEEDBACK -----------------
@trip_bp.route("/reviews", methods=["POST"])
@token_required
def post_review(current_user):
    data = request.get_json() or {}
    dest_id = data.get("destination_id")
    rating = data.get("rating")
    review_text = data.get("review")
    
    if not dest_id or not rating or not review_text:
        return jsonify({"message": "Destination, rating (1-5), and review text are required!"}), 400
        
    review_row = {
        "user_id": int(current_user["id"]),
        "destination_id": int(dest_id),
        "rating": int(rating),
        "review": review_text,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    saved = insert_row("reviews", review_row)
    return jsonify({"message": "Review submitted successfully!", "review": saved}), 201

@trip_bp.route("/reviews/<int:destination_id>", methods=["GET"])
def get_reviews(destination_id):
    reviews = filter_rows("reviews", {"destination_id": int(destination_id)})
    for rev in reviews:
        user = find_by_id("users", rev["user_id"])
        rev["user_name"] = user["name"] if user else "Anonymous Traveler"
    return jsonify({"reviews": reviews}), 200

@trip_bp.route("/feedback", methods=["POST"])
@token_required
def post_feedback(current_user):
    data = request.get_json() or {}
    feedback_text = data.get("feedback")
    
    if not feedback_text:
        return jsonify({"message": "Feedback text is required!"}), 400
        
    feedback_row = {
        "user_id": int(current_user["id"]),
        "feedback": feedback_text,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    saved = insert_row("feedback", feedback_row)
    return jsonify({"message": "Feedback received. Thank you!", "feedback": saved}), 201

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

# ----------------- TRIP DIARY -----------------
@trip_bp.route("/trip-diary", methods=["POST"])
@token_required
def post_diary(current_user):
    data = request.get_json() or {}
    dest_id = data.get("destination_id")
    trip_id = data.get("trip_id")
    diary_text = data.get("diary")
    rating = data.get("rating", 5)
    
    photos_input = data.get("photos")
    photo_path_input = data.get("photo_path", "")
    if isinstance(photos_input, list) and len(photos_input) > 0:
        cleaned = [str(p) for p in photos_input if p and str(p).strip() not in ("nan", "None", "")]
        final_photo_str = json.dumps(cleaned) if len(cleaned) > 1 else (cleaned[0] if cleaned else "")
    elif isinstance(photo_path_input, list) and len(photo_path_input) > 0:
        cleaned = [str(p) for p in photo_path_input if p and str(p).strip() not in ("nan", "None", "")]
        final_photo_str = json.dumps(cleaned) if len(cleaned) > 1 else (cleaned[0] if cleaned else "")
    elif isinstance(photo_path_input, str):
        final_photo_str = photo_path_input.strip()
    else:
        final_photo_str = ""
    
    if not dest_id or not diary_text:
        return jsonify({"message": "Destination and diary content are required!"}), 400
        
    user_id = int(current_user["id"])
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    # Verify user's trip start date eligibility
    user_trips = filter_rows("saved_trips", {"user_id": user_id})
    
    if trip_id:
        target_trip = find_by_id("saved_trips", int(trip_id))
        if not target_trip or int(target_trip.get("user_id", -1)) != user_id:
            return jsonify({"message": "Selected trip not found or unauthorized."}), 403
            
        t_date = str(target_trip.get("travel_date", "")).strip()
        if not t_date or t_date in ("nan", "None"):
            t_date = str(target_trip.get("created_at", "")).split(" ")[0]
            
        if t_date and t_date > today_str:
            return jsonify({
                "message": f"You can only add diary entries once your trip starts on {t_date}."
            }), 400
    else:
        # Check if user has at least one started trip for this destination
        dest_trips = [t for t in user_trips if int(t.get("destination_id", 0)) == int(dest_id)]
        if not dest_trips:
            return jsonify({"message": "You must plan and save a trip for this destination first."}), 400
            
        started_trips = []
        earliest_future_date = None
        for t in dest_trips:
            t_date = str(t.get("travel_date", "")).strip()
            if not t_date or t_date in ("nan", "None"):
                t_date = str(t.get("created_at", "")).split(" ")[0]
            if t_date and t_date <= today_str:
                started_trips.append(t)
            elif t_date:
                if earliest_future_date is None or t_date < earliest_future_date:
                    earliest_future_date = t_date
                    
        if not started_trips:
            return jsonify({
                "message": f"You can only add diary entries once your trip starts on {earliest_future_date or 'the planned start date'}."
            }), 400

    diary_row = {
        "user_id": user_id,
        "destination_id": int(dest_id),
        "diary": diary_text,
        "photo_path": final_photo_str,
        "rating": int(rating),
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    saved = insert_row("trip_diary", diary_row)
    return jsonify({"message": "Memory added to your trip diary!", "diary": saved}), 201

@trip_bp.route("/my-trip-diary", methods=["GET"])
@token_required
def get_my_trip_diary(current_user):
    diaries = filter_rows("trip_diary", {"user_id": int(current_user["id"])})
    hydrated = []
    for d in diaries:
        dest = find_by_id("destinations", d["destination_id"])
        d["destination_name"] = dest["name"] if dest else "Unknown Destination"
        photos, primary = parse_photos(d.get("photo_path"))
        d["photos"] = photos
        d["photo_path"] = primary
        hydrated.append(d)
        
    hydrated = sorted(hydrated, key=lambda x: str(x.get("created_at", "")), reverse=True)
    return jsonify({"diaries": hydrated}), 200

@trip_bp.route("/trip-diary/<int:id_val>", methods=["PUT"])
@token_required
def edit_diary(current_user, id_val):
    diary_entry = find_by_id("trip_diary", id_val)
    if not diary_entry:
        return jsonify({"message": "Diary entry not found"}), 404
    if int(diary_entry["user_id"]) != int(current_user["id"]):
        return jsonify({"message": "Unauthorized to modify this diary entry"}), 403
        
    data = request.get_json() or {}
    update_data = {}
    if data.get("diary") is not None:
        update_data["diary"] = data["diary"]
    if "photos" in data:
        photos_input = data.get("photos")
        if isinstance(photos_input, list):
            cleaned = [str(p) for p in photos_input if p and str(p).strip() not in ("nan", "None", "")]
            update_data["photo_path"] = json.dumps(cleaned) if len(cleaned) > 1 else (cleaned[0] if cleaned else "")
        elif isinstance(photos_input, str):
            update_data["photo_path"] = photos_input.strip()
    elif "photo_path" in data:
        photo_path_input = data.get("photo_path")
        if isinstance(photo_path_input, list):
            cleaned = [str(p) for p in photo_path_input if p and str(p).strip() not in ("nan", "None", "")]
            update_data["photo_path"] = json.dumps(cleaned) if len(cleaned) > 1 else (cleaned[0] if cleaned else "")
        elif isinstance(photo_path_input, str):
            update_data["photo_path"] = photo_path_input.strip()
    if data.get("rating") is not None:
        update_data["rating"] = int(data["rating"])
        
    if not update_data:
        return jsonify({"message": "No fields to update"}), 400
        
    updated = update_row("trip_diary", id_val, update_data)
    if updated:
        return jsonify({"message": "Diary entry updated successfully!"}), 200
    return jsonify({"message": "Failed to update diary entry"}), 500

@trip_bp.route("/trip-diary/<int:id_val>", methods=["DELETE"])
@token_required
def remove_diary(current_user, id_val):
    diary_entry = find_by_id("trip_diary", id_val)
    if not diary_entry:
        return jsonify({"message": "Diary entry not found"}), 404
    if int(diary_entry["user_id"]) != int(current_user["id"]):
        return jsonify({"message": "Unauthorized to delete this diary entry"}), 403
        
    deleted = delete_row("trip_diary", id_val)
    if deleted:
        return jsonify({"message": "Diary entry deleted successfully!"}), 200
    return jsonify({"message": "Failed to delete diary entry"}), 500

@trip_bp.route("/my-feedback", methods=["GET"])
@token_required
def get_my_feedback(current_user):
    feedback_list = filter_rows("feedback", {"user_id": int(current_user["id"])})
    feedback_list = sorted(feedback_list, key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"feedback": feedback_list}), 200

# ----------------- PUBLIC DESTINATIONS -----------------
@trip_bp.route("/destinations", methods=["GET"])
def get_public_destinations():
    dest_df = load_csv("destinations")
    if dest_df.empty:
        return jsonify({"destinations": []}), 200
        
    category = request.args.get("category")
    search_q = request.args.get("search")
    
    if category and category.strip() != "":
        dest_df = dest_df[dest_df["category"].astype(str).str.lower() == category.lower().strip()]
        
    if search_q and search_q.strip() != "":
        search_q = search_q.strip().lower()
        dest_df = dest_df[
            dest_df["name"].astype(str).str.lower().str.contains(search_q) |
            dest_df["state"].astype(str).str.lower().str.contains(search_q) |
            dest_df["city"].astype(str).str.lower().str.contains(search_q) |
            dest_df["description"].astype(str).str.lower().str.contains(search_q)
        ]
        
    records = dest_df.to_dict(orient="records")
    return jsonify({"destinations": records}), 200

@trip_bp.route("/destinations/<int:id_val>", methods=["GET"])
def get_public_destination_detail(id_val):
    dest = find_by_id("destinations", id_val)
    if not dest:
        return jsonify({"message": "Destination not found"}), 404
        
    hotels_df = load_csv("hotels")
    rest_df = load_csv("restaurants")
    attract_df = load_csv("attractions")
    trans_df = load_csv("transportation")
    
    dest_id = int(dest["id"])
    dest["hotels"] = hotels_df[(hotels_df["destination_id"] == dest_id) & (hotels_df["total_rooms"].astype(int) > 0)].to_dict(orient="records")
    dest["restaurants"] = rest_df[rest_df["destination_id"] == dest_id].to_dict(orient="records")
    dest["attractions"] = attract_df[attract_df["destination_id"] == dest_id].to_dict(orient="records")
    dest["transportation"] = trans_df[trans_df["destination_id"] == dest_id].to_dict(orient="records")
    
    return jsonify({"destination": dest}), 200
