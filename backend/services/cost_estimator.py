import math
from backend.utils.csv_manager import find_by_id, load_csv

def estimate_trip_cost(destination_id, travelers=1, duration_days=3, hotel_id=None, transport_id=None, restaurant_id=None, user_budget=None):
    """
    Estimates the detailed, transparent cost of a trip to a given destination.
    Provides itemized breakdowns, per-person rates, daily group burn rates,
    budget comparison, and smart cost-saving suggestions.
    """
    travelers = max(1, int(travelers or 1))
    duration_days = max(1, int(duration_days or 1))
    destination_id = int(destination_id)
    
    dest = find_by_id("destinations", destination_id)
    dest_name = dest["name"] if dest else f"Destination #{destination_id}"

    # 1. ACCOMMODATION COST
    hotel_price_per_night = 1500.0
    hotel_name = "Recommended Standard Accommodation"
    if hotel_id:
        hotel = find_by_id("hotels", hotel_id)
        if hotel:
            hotel_price_per_night = float(hotel.get("price_per_night", 1500.0))
            hotel_name = hotel.get("name", hotel_name)
    else:
        hotels_df = load_csv("hotels")
        dest_hotels = hotels_df[hotels_df["destination_id"] == destination_id]
        if not dest_hotels.empty:
            hotel_price_per_night = float(dest_hotels["price_per_night"].mean())
            hotel_name = f"Average {dest_name} Stay"

    rooms_needed = max(1, math.ceil(travelers / 2.0))
    nights = max(1, duration_days - 1)  # N days trip has N-1 nights (or 1 if 1-day)
    accommodation_cost = round(hotel_price_per_night * rooms_needed * nights, 2)

    # 2. FOOD & DINING COST
    avg_meal_price = 320.0
    restaurant_name = "Local Cuisine & Dining"
    if restaurant_id:
        rest = find_by_id("restaurants", restaurant_id)
        if rest:
            avg_meal_price = float(rest.get("avg_cost", 320.0))
            restaurant_name = rest.get("name", restaurant_name)
    else:
        rest_df = load_csv("restaurants")
        dest_rests = rest_df[rest_df["destination_id"] == destination_id]
        if not dest_rests.empty:
            avg_meal_price = float(dest_rests["avg_cost"].mean())

    # 3 meals a day per traveler
    meals_per_day = 3
    food_cost = round(avg_meal_price * travelers * duration_days * meals_per_day, 2)

    # 3. TRANSPORT COST
    transport_fare = 500.0
    transport_name = "Local Sightseeing & Transit"
    is_flat_rate = False
    
    if transport_id:
        transport = find_by_id("transportation", transport_id)
        if transport:
            transport_fare = float(transport.get("fare", 500.0))
            transport_name = transport.get("transport_type", transport_name)
            t_type_lower = str(transport.get("transport_type", "")).lower()
            if any(k in t_type_lower for k in ["taxi", "cab", "rental car", "rental bike", "scooter"]):
                is_flat_rate = True
    else:
        trans_df = load_csv("transportation")
        dest_trans = trans_df[trans_df["destination_id"] == destination_id]
        if not dest_trans.empty:
            transport_fare = float(dest_trans["fare"].mean())

    if is_flat_rate:
        vehicles_needed = max(1, math.ceil(travelers / 4.0))
        transport_cost = round(transport_fare * vehicles_needed * duration_days, 2)
    else:
        # Per person transit + daily local autos/cabs
        local_daily_transit = 200.0 * duration_days * max(1, math.ceil(travelers / 3.0))
        transport_cost = round((transport_fare * travelers) + local_daily_transit, 2)

    # 4. SIGHTSEEING & ATTRACTIONS COST
    sightseeing_cost = 0.0
    attract_df = load_csv("attractions")
    dest_attracts = attract_df[attract_df["destination_id"] == destination_id]
    if not dest_attracts.empty:
        total_fees = float(dest_attracts["entry_fee"].astype(float).sum())
        sightseeing_cost = round(total_fees * travelers, 2)
    else:
        sightseeing_cost = round(150.0 * travelers * duration_days, 2)

    # 5. MISCELLANEOUS & EMERGENCY BUFFER (6% of subtotal)
    subtotal = accommodation_cost + food_cost + transport_cost + sightseeing_cost
    misc_cost = round(subtotal * 0.06, 2)

    total_cost = round(subtotal + misc_cost, 2)
    per_person_cost = round(total_cost / travelers, 2)
    daily_average_cost = round(total_cost / duration_days, 2)

    # Budget Comparison
    budget_comparison = None
    if user_budget is not None and float(user_budget) > 0:
        u_budget = float(user_budget)
        diff = round(u_budget - total_cost, 2)
        pct_used = round((total_cost / u_budget) * 100, 1)
        budget_comparison = {
            "user_budget": u_budget,
            "estimated_total": total_cost,
            "variance": diff,
            "is_within_budget": diff >= 0,
            "budget_utilized_pct": pct_used,
            "status_label": "Well Within Budget" if diff >= 0 else f"Exceeds Budget by ₹{abs(diff):,}"
        }

    # Smart Money-Saving Tips
    saving_tips = [
        f"🏨 Booking accommodations 2+ weeks early can reduce lodging rates by up to 15%.",
        f"🚆 Opting for express trains or Volvo buses over private outstation taxis saves roughly ₹{int(transport_cost * 0.35):,}.",
        f"🍽️ Sampling authentic thalis and local markets for lunch helps preserve your dining budget."
    ]

    return {
        "destination_id": destination_id,
        "destination_name": dest_name,
        "travelers": travelers,
        "duration_days": duration_days,
        "accommodation": accommodation_cost,
        "food": food_cost,
        "local_transport": transport_cost,
        "sightseeing": sightseeing_cost,
        "miscellaneous": misc_cost,
        "total": total_cost,
        "per_person": per_person_cost,
        "daily_average": daily_average_cost,
        "itemized_details": {
            "accommodation": {
                "label": "Lodging & Stays",
                "amount": accommodation_cost,
                "details": f"{rooms_needed} room(s) × {nights} night(s) @ ₹{int(hotel_price_per_night):,}/night ({hotel_name})"
            },
            "food": {
                "label": "Meals & Refreshments",
                "amount": food_cost,
                "details": f"{travelers} person(s) × {duration_days} day(s) × {meals_per_day} meals @ ~₹{int(avg_meal_price):,}/meal ({restaurant_name})"
            },
            "transport": {
                "label": "Transit & Local Travel",
                "amount": transport_cost,
                "details": f"{transport_name} for {travelers} passenger(s) across {duration_days} day(s)"
            },
            "sightseeing": {
                "label": "Attractions & Entry Tickets",
                "amount": sightseeing_cost,
                "details": f"Entrance permits & activity tickets for {travelers} traveler(s)"
            },
            "miscellaneous": {
                "label": "Emergency Reserve (6%)",
                "amount": misc_cost,
                "details": "Safety buffer for shopping, tips, snacks, and unforeseen travel expenses"
            }
        },
        "budget_comparison": budget_comparison,
        "saving_tips": saving_tips
    }
