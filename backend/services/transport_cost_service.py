import math
from datetime import datetime
from backend.utils.csv_manager import load_csv, find_by_id, update_row, insert_row
from backend.services.ai_service import check_origin_transit_feasibility, is_international_trip, generate_ai_flight_options

# Fallback default transport rate definitions in case CSV is uninitialized
DEFAULT_RATES = {
    "cab": {"name": "Private AC Cab", "category": "Private Cab", "base": 300.0, "per_km": 18.0, "speed": 48.0, "min_dist": 5.0, "max_dist": 1500.0},
    "taxi": {"name": "Prepaid Taxi", "category": "Taxi", "base": 200.0, "per_km": 15.0, "speed": 45.0, "min_dist": 2.0, "max_dist": 400.0},
    "bus": {"name": "State AC Volvo Intercity Bus", "category": "Bus", "base": 0.0, "per_km": 3.5, "speed": 38.0, "min_dist": 15.0, "max_dist": 1500.0},
    "train": {"name": "Express Intercity Train", "category": "Train", "base": 0.0, "per_km": 2.2, "speed": 60.0, "min_dist": 20.0, "max_dist": 3500.0},
    "self_drive": {"name": "Self-Drive SUV Rental", "category": "Self Drive", "daily_rental": 1800.0, "fuel_per_km": 7.5, "speed": 52.0, "min_dist": 10.0, "max_dist": 2500.0},
    "bike": {"name": "Rental Scooter / Bike", "category": "Bike/Scooter", "daily_rental": 500.0, "fuel_per_km": 2.5, "speed": 38.0, "min_dist": 1.0, "max_dist": 180.0},
    "cycling": {"name": "Eco Cycling / Rental Cycle", "category": "Cycling", "daily_rental": 200.0, "per_km": 0.0, "speed": 15.0, "min_dist": 0.5, "max_dist": 35.0},
    "walking": {"name": "Scenic Walking / Hiking", "category": "Walking", "base": 0.0, "per_km": 0.0, "speed": 4.5, "min_dist": 0.0, "max_dist": 8.0},
    "flight": {"name": "Connecting / Direct Flight", "category": "Flight", "base": 2500.0, "per_km": 4.5, "speed": 550.0, "min_dist": 280.0, "max_dist": 5000.0}
}

def get_active_rates():
    """
    Loads active transport rates from the transport_rates CSV database.
    Returns a dictionary of rate configurations keyed by normalized category name.
    """
    try:
        rates_df = load_csv("transport_rates")
        if not rates_df.empty:
            active_rows = rates_df[rates_df["active"].astype(int) == 1]
            if not active_rows.empty:
                rates = {}
                for _, r in active_rows.iterrows():
                    cat_key = str(r["category"]).lower().replace("/", "_").replace(" ", "_")
                    rates[cat_key] = {
                        "id": int(r["id"]),
                        "transport_type": str(r["transport_type"]),
                        "category": str(r["category"]),
                        "base_fare": float(r.get("base_fare", 0.0)),
                        "per_km_rate": float(r.get("per_km_rate", 0.0)),
                        "per_person_rate": float(r.get("per_person_rate", 0.0)),
                        "fuel_cost_per_km": float(r.get("fuel_cost_per_km", 0.0)),
                        "daily_rental": float(r.get("daily_rental", 0.0)),
                        "speed_kmh": float(r.get("speed_kmh", 45.0)),
                        "min_distance_km": float(r.get("min_distance_km", 0.0)),
                        "max_distance_km": float(r.get("max_distance_km", 3000.0))
                    }
                return rates
    except Exception as e:
        print(f"[TransportCostService] Error reading transport_rates CSV: {e}")
    
    # Fallback to defaults
    return DEFAULT_RATES

def format_duration(minutes: int) -> str:
    """Formats minutes into human-readable duration string (e.g., '4h 00m' or '45 mins')."""
    if minutes < 60:
        return f"{max(5, int(minutes))} mins"
    hours = int(minutes // 60)
    rem_mins = int(minutes % 60)
    if rem_mins == 0:
        return f"{hours}h 00m"
    return f"{hours}h {rem_mins:02d}m"

def get_transport_feasibility(origin_name: str, dest_name: str, distance_km: float = 0.0, origin_obj: dict = None, dest_obj: dict = None):
    """
    Returns AI-evaluated feasibility and excluded modes for an origin and destination pair.
    """
    return check_origin_transit_feasibility(origin_name, dest_name, distance_km, origin_obj=origin_obj, dest_obj=dest_obj)

def calculate_transport_options(origin_name: str, dest_name: str, distance_km: float, duration_minutes: int, travelers: int = 1, preferences: dict = None, origin_obj: dict = None, dest_obj: dict = None):
    """
    Calculates detailed transportation options with transparent mathematical cost breakdowns.
    Uses AI feasibility analysis to exclude transit modes (such as Train) when the origin (or destination)
    lacks that vehicle / infrastructure (e.g., Wayanad has no railway tracks/station).
    For international / overseas journeys (e.g. Al Ahsa / Dubai <-> Vagamon / Munnar),
    exclusively returns AI-powered exact commercial flight options, completely omitting road cabs & buses.
    """
    travelers = max(1, int(travelers or 1))
    dist = max(0.5, float(distance_km or 20.0))
    preferences = preferences or {}
    
    # ── INTERNATIONAL & OVERSEAS ROUTES (EXCLUSIVELY COMMERCIAL FLIGHTS) ──
    if is_international_trip(origin_name, dest_name, dist, origin_obj=origin_obj, dest_obj=dest_obj):
        return generate_ai_flight_options(
            origin_name=origin_name,
            dest_name=dest_name,
            distance_km=dist,
            travelers=travelers,
            preferences=preferences,
            origin_obj=origin_obj,
            dest_obj=dest_obj
        )
    
    # Run AI-powered transit feasibility evaluation for domestic trips
    feasibility = check_origin_transit_feasibility(origin_name, dest_name, dist, origin_obj=origin_obj, dest_obj=dest_obj)
    has_railway = feasibility.get("has_railway", True)
    has_airport = feasibility.get("has_airport", False)
    
    rates = get_active_rates()
    options = []
    
    # Helper to resolve rate configuration
    def get_rate(cat_key, default_fallback):
        return rates.get(cat_key, default_fallback)


    # -------------------------------------------------------------
    # 1. PRIVATE CAB (Door-to-Door Sedan / SUV)
    # -------------------------------------------------------------
    cab_cfg = get_rate("private_cab", DEFAULT_RATES["cab"])
    cab_base = cab_cfg.get("base_fare", cab_cfg.get("base", 300.0))
    cab_per_km = cab_cfg.get("per_km_rate", cab_cfg.get("per_km", 18.0))
    
    # Vehicle capacity rule: 4 passengers per standard sedan
    vehicles_needed = max(1, math.ceil(travelers / 4.0))
    single_cab_fare = max(600.0, cab_base + (dist * cab_per_km))
    total_cab_fare = round(single_cab_fare * vehicles_needed)
    cab_per_person = round(total_cab_fare / travelers, 2)
    cab_cost_per_km = round(total_cab_fare / dist, 2)
    cab_duration_mins = max(15, duration_minutes) if duration_minutes > 0 else int(round((dist / cab_cfg.get("speed_kmh", 48.0)) * 60))
    
    options.append({
        "id": 101,
        "transport_type": "Private AC Cab",
        "category": "Private Cab",
        "mode": "cab",
        "icon": "Car",
        "source": origin_name or "Origin Location",
        "destination": dest_name or "Destination",
        "distance_km": dist,
        "duration_minutes": cab_duration_mins,
        "duration_formatted": format_duration(cab_duration_mins),
        "total_fare": total_cab_fare,
        "fare_per_person": cab_per_person,
        "cost_per_km": cab_cost_per_km,
        "travelers": travelers,
        "is_flat_vehicle_rate": True,
        "vehicles_count": vehicles_needed,
        "price_label": "Estimated fare",
        "badge": "Best for Comfort" if travelers <= 4 else "Best for Groups",
        "amenities": ["Door-to-door pickup", "AC Sedan / SUV", "Luggage assistance", "Flexible stops en route"],
        "cost_breakdown": {
            "title": "Private Cab Cost Calculation",
            "distance_km": dist,
            "base_fare": cab_base,
            "per_km_rate": cab_per_km,
            "distance_fare": round(dist * cab_per_km, 2),
            "single_vehicle_fare": round(single_cab_fare, 2),
            "vehicles_needed": vehicles_needed,
            "travelers": travelers,
            "formula": f"Base Fare (₹{int(cab_base)}) + ({dist} km × ₹{cab_per_km}/km) = ₹{int(single_cab_fare):,} per cab × {vehicles_needed} vehicle(s)",
            "data_source": "Estimated via Configurable Taxi Tariff Engine",
            "transit_disclaimer": "Fares are calculated based on standard regional taxi tariffs (₹18/km). Tolls, parking, and peak charges may vary."
        }
    })

    # -------------------------------------------------------------
    # 2. PREPAID / LOCAL TAXI (Standard Hatchback)
    # -------------------------------------------------------------
    if dist <= 400.0:
        taxi_cfg = get_rate("taxi", DEFAULT_RATES["taxi"])
        taxi_base = taxi_cfg.get("base_fare", taxi_cfg.get("base", 200.0))
        taxi_per_km = taxi_cfg.get("per_km_rate", taxi_cfg.get("per_km", 15.0))
        taxi_vehicles = max(1, math.ceil(travelers / 4.0))
        single_taxi_fare = max(400.0, taxi_base + (dist * taxi_per_km))
        total_taxi_fare = round(single_taxi_fare * taxi_vehicles)
        taxi_duration_mins = int(round(cab_duration_mins * 1.05))
        
        options.append({
            "id": 102,
            "transport_type": "Prepaid Taxi",
            "category": "Taxi",
            "mode": "taxi",
            "icon": "CarFront",
            "source": f"{origin_name} Stand",
            "destination": f"{dest_name} City Center",
            "distance_km": dist,
            "duration_minutes": taxi_duration_mins,
            "duration_formatted": format_duration(taxi_duration_mins),
            "total_fare": total_taxi_fare,
            "fare_per_person": round(total_taxi_fare / travelers, 2),
            "cost_per_km": round(total_taxi_fare / dist, 2),
            "travelers": travelers,
            "is_flat_vehicle_rate": True,
            "vehicles_count": taxi_vehicles,
            "price_label": "Estimated fare",
            "badge": "Convenient Transfer",
            "amenities": ["Direct point-to-point", "Standard Hatchback/Sedan", "Prepaid meter rates"],
            "cost_breakdown": {
                "title": "Prepaid Taxi Cost Calculation",
                "distance_km": dist,
                "base_fare": taxi_base,
                "per_km_rate": taxi_per_km,
                "distance_fare": round(dist * taxi_per_km, 2),
                "vehicles_needed": taxi_vehicles,
                "travelers": travelers,
                "formula": f"Base Fare (₹{int(taxi_base)}) + ({dist} km × ₹{taxi_per_km}/km) = ₹{int(single_taxi_fare):,} × {taxi_vehicles} taxi(s)",
                "data_source": "Estimated via Municipal Taxi Meter Engine",
                "transit_disclaimer": "Based on standard non-AC/AC municipal prepaid taxi rates (₹15/km)."
            }
        })

    # -------------------------------------------------------------
    # 3. STATE AC VOLVO INTERCITY BUS
    # -------------------------------------------------------------
    bus_cfg = get_rate("bus", DEFAULT_RATES["bus"])
    bus_per_km = bus_cfg.get("per_km_rate", bus_cfg.get("per_km", 3.5))
    bus_fare_pax = max(80.0, round(dist * bus_per_km, -1) if round(dist * bus_per_km, -1) > 0 else round(dist * bus_per_km))
    total_bus_fare = round(bus_fare_pax * travelers)
    bus_speed = bus_cfg.get("speed_kmh", 38.0)
    bus_duration_mins = max(30, int(round(((dist / bus_speed) + 0.35) * 60)))
    
    options.append({
        "id": 103,
        "transport_type": "State AC Volvo Intercity Bus",
        "category": "Bus",
        "mode": "bus",
        "icon": "Bus",
        "source": f"{origin_name} Bus Terminal",
        "destination": f"{dest_name} Transit Stand",
        "distance_km": dist,
        "duration_minutes": bus_duration_mins,
        "duration_formatted": format_duration(bus_duration_mins),
        "total_fare": total_bus_fare,
        "fare_per_person": round(bus_fare_pax, 2),
        "cost_per_km": round(total_bus_fare / dist, 2),
        "travelers": travelers,
        "is_flat_vehicle_rate": False,
        "price_label": "Estimated bus fare",
        "badge": "Best Budget",
        "amenities": ["AC Semi-Sleeper", "Reserved Seat", "Frequent Departures", "Luggage Storage"],
        "cost_breakdown": {
            "title": "Intercity Bus Fare Calculation",
            "distance_km": dist,
            "base_fare": 0.0,
            "per_km_rate": bus_per_km,
            "fare_per_person": bus_fare_pax,
            "travelers": travelers,
            "formula": f"{dist} km × ₹{bus_per_km}/km = ₹{int(bus_fare_pax):,} per person × {travelers} traveler(s)",
            "data_source": "Estimated Regional Transit Rate Engine",
            "transit_disclaimer": "Fares and travel duration are estimates based on average KSRTC / Volvo AC bus tariffs (₹3.5/km). Actual schedules and live seat availability require booking on state transport portals."
        }
    })

    # -------------------------------------------------------------
    # 4. EXPRESS INTERCITY TRAIN (Excluded if Origin or Destination has no Railway Station)
    # -------------------------------------------------------------
    if has_railway:
        train_cfg = get_rate("train", DEFAULT_RATES["train"])
        train_per_km = train_cfg.get("per_km_rate", train_cfg.get("per_km", 2.2))
        train_fare_pax = max(60.0, round(dist * train_per_km, -1) if round(dist * train_per_km, -1) > 0 else round(dist * train_per_km))
        total_train_fare = round(train_fare_pax * travelers)
        train_speed = train_cfg.get("speed_kmh", 60.0)
        train_duration_mins = max(25, int(round(((dist / train_speed) + 0.2) * 60)))
        
        options.append({
            "id": 104,
            "transport_type": "Express Intercity Train",
            "category": "Train",
            "mode": "train",
            "icon": "Train",
            "source": f"{origin_name} Rail Junction",
            "destination": f"{dest_name} Nearest Rail Station",
            "distance_km": dist,
            "duration_minutes": train_duration_mins,
            "duration_formatted": format_duration(train_duration_mins),
            "total_fare": total_train_fare,
            "fare_per_person": round(train_fare_pax, 2),
            "cost_per_km": round(total_train_fare / dist, 2),
            "travelers": travelers,
            "is_flat_vehicle_rate": False,
            "price_label": "Estimated train fare",
            "badge": "Eco & Reliable",
            "amenities": ["Reserved Seating (AC Chair / 3AC)", "Spacious Legroom", "Scenic Countryside Views", "Punctual Route"],
            "cost_breakdown": {
                "title": "Intercity Train Fare Calculation",
                "distance_km": dist,
                "base_fare": 0.0,
                "per_km_rate": train_per_km,
                "fare_per_person": train_fare_pax,
                "travelers": travelers,
                "formula": f"{dist} km × ₹{train_per_km}/km = ₹{int(train_fare_pax):,} per person × {travelers} traveler(s)",
                "data_source": "Estimated Indian Railways Tariff Matrix",
                "transit_disclaimer": "Train fares are calculated using typical Indian Railways 3AC/AC Chair Car rates (₹2.2/km). Live PNR schedules and seat quota availability require IRCTC portal integration."
            }
        })


    # -------------------------------------------------------------
    # 5. SELF-DRIVE SUV / SEDAN RENTAL
    # -------------------------------------------------------------
    self_cfg = get_rate("self_drive", DEFAULT_RATES["self_drive"])
    daily_rental = self_cfg.get("daily_rental", 1800.0)
    fuel_per_km = self_cfg.get("fuel_cost_per_km", 7.5)
    est_toll = 150.0 if dist > 60 else 0.0
    est_fuel_cost = round(dist * fuel_per_km)
    self_drive_vehicles = max(1, math.ceil(travelers / 5.0))
    total_self_drive_cost = round((daily_rental + est_fuel_cost + est_toll) * self_drive_vehicles)
    self_duration_mins = max(20, int(round((dist / self_cfg.get("speed_kmh", 52.0)) * 60)))
    
    options.append({
        "id": 105,
        "transport_type": "Self-Drive SUV Rental",
        "category": "Self Drive",
        "mode": "self_drive",
        "icon": "KeyRound",
        "source": f"{origin_name} City Hub",
        "destination": f"{dest_name} Self-Route",
        "distance_km": dist,
        "duration_minutes": self_duration_mins,
        "duration_formatted": format_duration(self_duration_mins),
        "total_fare": total_self_drive_cost,
        "fare_per_person": round(total_self_drive_cost / travelers, 2),
        "cost_per_km": round(total_self_drive_cost / dist, 2),
        "travelers": travelers,
        "is_flat_vehicle_rate": True,
        "vehicles_count": self_drive_vehicles,
        "price_label": "Estimated rental + fuel",
        "badge": "Maximum Freedom",
        "amenities": ["Complete Privacy", "Flexible Sightseeing Schedule", "GPS Navigation", "Unlimited Kilometers Package"],
        "cost_breakdown": {
            "title": "Self-Drive Vehicle Calculation",
            "distance_km": dist,
            "daily_rental": daily_rental,
            "fuel_rate_per_km": fuel_per_km,
            "estimated_fuel_cost": est_fuel_cost,
            "estimated_toll": est_toll,
            "vehicles_needed": self_drive_vehicles,
            "travelers": travelers,
            "formula": f"Daily Rental (₹{int(daily_rental)}) + Fuel ({dist} km × ₹{fuel_per_km}/km = ₹{est_fuel_cost:,}) + Toll (₹{int(est_toll)}) = ₹{total_self_drive_cost:,}",
            "data_source": "Estimated Self-Drive Rental Model",
            "transit_disclaimer": "Includes estimated 24-hr self-drive rental + estimated petrol/diesel consumption. Security deposit and insurance payable directly to vendor."
        }
    })

    # -------------------------------------------------------------
    # 6. RENTAL SCOOTER / BIKE (Distance <= 180km)
    # -------------------------------------------------------------
    if dist <= 180.0:
        bike_cfg = get_rate("bike", DEFAULT_RATES["bike"])
        bike_rental = bike_cfg.get("daily_rental", 500.0)
        bike_fuel_rate = bike_cfg.get("fuel_cost_per_km", 2.5)
        bike_fuel_cost = round(dist * bike_fuel_rate)
        bikes_needed = max(1, math.ceil(travelers / 2.0))
        single_bike_cost = bike_rental + bike_fuel_cost
        total_bike_cost = round(single_bike_cost * bikes_needed)
        bike_duration_mins = max(15, int(round((dist / bike_cfg.get("speed_kmh", 38.0)) * 60)))
        
        options.append({
            "id": 106,
            "transport_type": "Rental Scooter / Royal Enfield",
            "category": "Bike/Scooter",
            "mode": "bike",
            "icon": "Bike",
            "source": f"{origin_name} Rental Hub",
            "destination": f"{dest_name} Scenic Route",
            "distance_km": dist,
            "duration_minutes": bike_duration_mins,
            "duration_formatted": format_duration(bike_duration_mins),
            "total_fare": total_bike_cost,
            "fare_per_person": round(total_bike_cost / travelers, 2),
            "cost_per_km": round(total_bike_cost / dist, 2),
            "travelers": travelers,
            "is_flat_vehicle_rate": True,
            "vehicles_count": bikes_needed,
            "price_label": "Estimated rental + fuel",
            "badge": "Adventure & Sightseeing",
            "amenities": ["Helmets Provided", "Scenic Hill Highway Ride", "Easy Parking", "Zero Commute Delay"],
            "cost_breakdown": {
                "title": "Bike Rental Cost Calculation",
                "distance_km": dist,
                "daily_rental": bike_rental,
                "fuel_rate_per_km": bike_fuel_rate,
                "estimated_fuel_cost": bike_fuel_cost,
                "bikes_needed": bikes_needed,
                "travelers": travelers,
                "formula": f"Daily Rental (₹{int(bike_rental)}) + Fuel ({dist} km × ₹{bike_fuel_rate}/km = ₹{bike_fuel_cost:,}) = ₹{int(single_bike_cost):,} × {bikes_needed} bike(s)",
                "data_source": "Estimated Two-Wheeler Rental Index",
                "transit_disclaimer": "Rental costs calculated for standard 110cc scooter / 350cc motorcycle including helmet and fuel allowance."
            }
        })

    # -------------------------------------------------------------
    # 7. CYCLING / BICYCLE (Distance <= 35km)
    # -------------------------------------------------------------
    if dist <= 35.0:
        cycle_cfg = get_rate("cycling", DEFAULT_RATES["cycling"])
        cycle_daily = cycle_cfg.get("daily_rental", 200.0)
        total_cycle_fare = round(cycle_daily * travelers)
        cycle_duration_mins = max(10, int(round((dist / cycle_cfg.get("speed_kmh", 15.0)) * 60)))
        
        options.append({
            "id": 107,
            "transport_type": "Eco Cycling / Rental Cycle",
            "category": "Cycling",
            "mode": "cycling",
            "icon": "Bike",
            "source": f"{origin_name} Cycle Hub",
            "destination": f"{dest_name} Trail",
            "distance_km": dist,
            "duration_minutes": cycle_duration_mins,
            "duration_formatted": format_duration(cycle_duration_mins),
            "total_fare": total_cycle_fare,
            "fare_per_person": round(cycle_daily, 2),
            "cost_per_km": round(total_cycle_fare / dist, 2),
            "travelers": travelers,
            "is_flat_vehicle_rate": False,
            "price_label": "Estimated rental",
            "badge": "Zero Carbon & Fitness",
            "amenities": ["Geared Hybrid Cycle", "Safety Helmet", "Eco-friendly Sightseeing"],
            "cost_breakdown": {
                "title": "Eco Cycling Rental Calculation",
                "distance_km": dist,
                "daily_rental": cycle_daily,
                "travelers": travelers,
                "formula": f"Cycle Day Rental (₹{int(cycle_daily)}) × {travelers} traveler(s) = ₹{total_cycle_fare:,}",
                "data_source": "Eco Tourism Tariff Index",
                "transit_disclaimer": "Ideal for local city, tea garden, or beach trail explorations under 35 km."
            }
        })

    # -------------------------------------------------------------
    # 8. SCENIC WALKING / HIKING (Distance <= 8km)
    # -------------------------------------------------------------
    if dist <= 8.0:
        walk_speed = 4.5
        walk_duration_mins = max(5, int(round((dist / walk_speed) * 60)))
        options.append({
            "id": 108,
            "transport_type": "Scenic Walking / Promenade Stroll",
            "category": "Walking",
            "mode": "walking",
            "icon": "Footprints",
            "source": origin_name,
            "destination": dest_name,
            "distance_km": dist,
            "duration_minutes": walk_duration_mins,
            "duration_formatted": format_duration(walk_duration_mins),
            "total_fare": 0.0,
            "fare_per_person": 0.0,
            "cost_per_km": 0.0,
            "travelers": travelers,
            "is_flat_vehicle_rate": False,
            "price_label": "Free / Scenic",
            "badge": "Health & Heritage",
            "amenities": ["Heritage Architecture Walking", "Zero Cost", "Scenic Photo Opportunities"],
            "cost_breakdown": {
                "title": "Walking Tour Breakdown",
                "distance_km": dist,
                "base_fare": 0.0,
                "travelers": travelers,
                "formula": "Self-guided pedestrian trail (₹0 fare)",
                "data_source": "Pedestrian Path Network",
                "transit_disclaimer": "Best for historic streets, beachfront promenades, and cliff trails."
            }
        })

    # -------------------------------------------------------------
    # 9. FLIGHT (Distance >= 280km and origin/destination have commercial airport)
    # -------------------------------------------------------------
    if dist >= 280.0 and has_airport:
        flight_cfg = get_rate("flight", DEFAULT_RATES["flight"])
        f_base = flight_cfg.get("base_fare", 2500.0)
        f_per_km = flight_cfg.get("per_km_rate", 4.5)
        flight_fare_pax = max(2800.0, round(f_base + (dist * f_per_km), -2))
        total_flight_fare = round(flight_fare_pax * travelers)
        
        options.append({
            "id": 109,
            "transport_type": "Connecting / Direct Flight",
            "category": "Flight",
            "mode": "flight",
            "icon": "Plane",
            "source": f"{origin_name} Airport",
            "destination": f"{dest_name} Nearest Airport",
            "distance_km": dist,
            "duration_minutes": 120,
            "duration_formatted": "1h 30m - 2h 30m",
            "total_fare": total_flight_fare,
            "fare_per_person": round(flight_fare_pax, 2),
            "cost_per_km": round(total_flight_fare / dist, 2),
            "travelers": travelers,
            "is_flat_vehicle_rate": False,
            "price_label": "Estimated airline fare",
            "badge": "Fastest Route",
            "amenities": ["Rapid Long-Distance Transit", "Cabin Baggage Included", "In-Flight Service"],
            "cost_breakdown": {
                "title": "Commercial Airline Fare Estimate",
                "distance_km": dist,
                "base_fare": f_base,
                "per_km_rate": f_per_km,
                "fare_per_person": flight_fare_pax,
                "travelers": travelers,
                "formula": f"Base Fare (₹{int(f_base)}) + ({dist} km × ₹{f_per_km}/km) = ₹{int(flight_fare_pax):,} per seat × {travelers} traveler(s)",
                "data_source": "Estimated Domestic Airline Yield Matrix",
                "transit_disclaimer": "Estimated economy airfare for long-haul routes. Subject to dynamic airline pricing and date of travel."
            }
        })


    return options
