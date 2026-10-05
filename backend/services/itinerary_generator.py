import pandas as pd
from backend.utils.csv_manager import load_csv, find_by_id

def _get_group_pacing_note(group_type):
    gt = str(group_type).lower()
    if "family" in gt:
        return "Family-friendly pacing with relaxed mid-day breaks and child-safe walking routes."
    elif "couple" in gt or "honeymoon" in gt:
        return "Romantic scenic pacing with sunset viewpoints, candlelit dining, and private leisurely walks."
    elif "solo" in gt:
        return "Flexible solo adventure pacing with authentic cafes, photography trails, and local meet-spots."
    elif "friends" in gt:
        return "Energetic group pacing with exciting outdoor activities, viewpoints, and evening nightlife."
    return "Balanced pacing suitable for thorough destination exploration."

def generate_itinerary(
    destination_id,
    duration_days=3,
    interests=None,
    hotel_id=None,
    restaurant_id=None,
    group_type="family",
    pace="moderate",
    selected_attractions=None,
    selected_restaurants=None,
    selected_hotel_name=None,
    selected_transport=None,
    source_location="Kochi",
    custom_items=None
):
    """
    Generates a deeply personalized, time-slotted day-by-day itinerary tailored
    to user interests, group composition, selected stays, dining, transport, and local attractions.
    Explicitly features the exact names of chosen hotels, restaurants, attractions, and transport.
    """
    destination_id = int(destination_id)
    duration_days = max(1, int(duration_days or 1))
    interests = [str(i).lower() for i in (interests or [])]
    group_type = str(group_type or "family")
    
    dest = find_by_id("destinations", destination_id)
    dest_name = dest["name"] if dest else f"Destination #{destination_id}"
    
    attracts_df = load_csv("attractions")
    rests_df = load_csv("restaurants")
    hotels_df = load_csv("hotels")
    
    # 1. Resolve Selected Hotel Name
    resolved_hotel_name = selected_hotel_name
    hotel_type = "Premium Hotel"
    hotel_rating = 4.6
    if not resolved_hotel_name and hotel_id:
        hotel = find_by_id("hotels", int(hotel_id))
        if hotel:
            resolved_hotel_name = hotel.get("name")
            hotel_type = hotel.get("hotel_type", hotel_type)
            hotel_rating = hotel.get("rating", hotel_rating)
    if not resolved_hotel_name and not hotels_df.empty:
        dest_hotels = hotels_df[hotels_df["destination_id"] == destination_id]
        if not dest_hotels.empty:
            resolved_hotel_name = dest_hotels.iloc[0].get("name")
            hotel_type = dest_hotels.iloc[0].get("hotel_type", hotel_type)
            hotel_rating = dest_hotels.iloc[0].get("rating", hotel_rating)
    if not resolved_hotel_name:
        resolved_hotel_name = f"Selected {dest_name} Premium Stay"

    # 2. Resolve Selected Transport Name
    transport_name = "Private AC Cab"
    if selected_transport:
        if isinstance(selected_transport, dict):
            transport_name = selected_transport.get("transport_type") or selected_transport.get("name") or transport_name
        elif isinstance(selected_transport, str) and selected_transport.strip():
            transport_name = selected_transport.strip()

    # 3. Resolve Selected Restaurants List
    rest_names = []
    if selected_restaurants and isinstance(selected_restaurants, list):
        for r in selected_restaurants:
            if isinstance(r, dict) and r.get("name"):
                rest_names.append(r["name"])
            elif isinstance(r, (int, str)) and str(r).isdigit():
                r_obj = find_by_id("restaurants", int(r))
                if r_obj:
                    rest_names.append(r_obj["name"])
            elif isinstance(r, str) and r.strip():
                rest_names.append(r.strip())
    elif restaurant_id:
        r_obj = find_by_id("restaurants", int(restaurant_id))
        if r_obj:
            rest_names.append(r_obj.get("name"))

    if not rest_names and not rests_df.empty:
        dest_rests = rests_df[rests_df["destination_id"] == destination_id]
        if not dest_rests.empty:
            rest_names = dest_rests["name"].tolist()
    if not rest_names:
        rest_names = [f"Traditional {dest_name} Cuisine House", f"{dest_name} Heritage Restaurant", f"Rooftop Garden Bistro"]

    # 4. Resolve Selected Attractions / Sightseeing
    attraction_objects = []
    if selected_attractions and isinstance(selected_attractions, list):
        for a in selected_attractions:
            if isinstance(a, dict) and a.get("name"):
                attraction_objects.append({
                    "name": a.get("name"),
                    "description": a.get("description", ""),
                    "entry_fee": a.get("entry_fee", 0),
                    "image_url": a.get("image_url", "")
                })
            elif isinstance(a, (int, str)) and str(a).isdigit():
                a_obj = find_by_id("attractions", int(a))
                if a_obj:
                    attraction_objects.append({
                        "name": a_obj.get("name"),
                        "description": a_obj.get("description", ""),
                        "entry_fee": a_obj.get("entry_fee", 0),
                        "image_url": a_obj.get("image_url", "")
                    })

    # Fallback to database attractions if needed
    if len(attraction_objects) < (duration_days * 2) and not attracts_df.empty:
        da = attracts_df[attracts_df["destination_id"] == destination_id]
        if not da.empty:
            for _, a_row in da.iterrows():
                if not any(ao["name"] == a_row["name"] for ao in attraction_objects):
                    attraction_objects.append({
                        "name": a_row["name"],
                        "description": a_row.get("description", ""),
                        "entry_fee": a_row.get("entry_fee", 0),
                        "image_url": a_row.get("image_url", "")
                    })

    if len(attraction_objects) < 2:
        attraction_objects = [
            {"name": f"{dest_name} Heritage Viewpoint & Scenic Promenade", "description": "Panoramic mountain and valley vistas ideal for photography and nature walks.", "entry_fee": 50},
            {"name": f"{dest_name} Botanical Gardens & Lake", "description": "Serene landscaped grounds with boating facilities and rare floral collections.", "entry_fee": 80},
            {"name": f"{dest_name} Cultural Heritage Village", "description": "Authentic handicraft stalls, traditional architecture, and cultural performances.", "entry_fee": 120},
            {"name": f"{dest_name} Forest Sanctuary & Nature Trail", "description": "Lush evergreen canopy trails offering birdwatching and wildlife spotting.", "entry_fee": 150},
            {"name": f"{dest_name} Sunset Ridge & Tea Estate", "description": "Spectacular golden hour views surrounded by rolling emerald tea gardens.", "entry_fee": 40}
        ]

    # Prioritize attractions based on user interests
    if len(interests) > 0 and len(attraction_objects) > 1:
        def get_priority(att):
            desc = str(att.get("description", "")).lower()
            name = str(att.get("name", "")).lower()
            return sum(1 for interest in interests if interest in desc or interest in name)
        attraction_objects = sorted(attraction_objects, key=get_priority, reverse=True)

    itinerary = []
    attraction_idx = 0
    total_attractions = len(attraction_objects)

    for day in range(1, duration_days + 1):
        # Pick lunch & dinner spots
        lunch_place = rest_names[(day - 1) % len(rest_names)]
        dinner_place = rest_names[day % len(rest_names)] if len(rest_names) > 1 else lunch_place

        # Check if Day 1 is flight-based or international origin
        is_flight = False
        trans_lower = str(transport_name).lower()
        src_lower = str(source_location).lower()
        international_hubs = [
            "dubai", "dxb", "uae", "riyadh", "dammam", "jeddah", "al ahsa", "al-ahsa",
            "abu dhabi", "sharjah", "doha", "qatar", "muscat", "oman", "kuwait", "bahrain",
            "singapore", "london", "paris", "frankfurt", "new york", "toronto", "sydney", "tokyo"
        ]
        if (
            any(f in trans_lower for f in ["flight", "emirates", "airline", "air india", "saudia", "qatar", "scoot"]) or
            any(hub in src_lower for hub in international_hubs) or
            (isinstance(selected_transport, dict) and (selected_transport.get("mode") == "flight" or "flight" in str(selected_transport.get("category", "")).lower()))
        ):
            is_flight = True

        # Construct morning, afternoon, evening activities
        if day == 1:
            if is_flight:
                connecting_veh_name = "Private Dedicated AC Sedan (Dzire/Etios)"
                if isinstance(selected_transport, dict):
                    if selected_transport.get("selected_vehicle_obj"):
                        connecting_veh_name = selected_transport["selected_vehicle_obj"].get("name", connecting_veh_name)
                    elif selected_transport.get("connecting_vehicles") and len(selected_transport["connecting_vehicles"]) > 0:
                        connecting_veh_name = selected_transport["connecting_vehicles"][0].get("name", connecting_veh_name)

                flight_airline = "Emirates (EK 530)" if "emirates" in trans_lower or "dubai" in src_lower else (transport_name if "flight" in trans_lower else f"Direct Flight ({transport_name})")
                arr_airport = "Cochin International Airport (COK)" if any(k in dest_name.lower() for k in ["munnar", "vagamon", "kochi", "alleppey", "thekkady", "athirappilly", "idukki", "kanthalloor"]) else "Gateway Airport (COK/TRV/CCJ)"

                morning_title = f"Touchdown at {arr_airport.split('(')[0].strip()} ➔ {connecting_veh_name} to {dest_name}"
                morning_text = (
                    f"**Stage 1 (Flight Touchdown & Clearance • 08:50 AM - 09:35 AM):**\n"
                    f"Fly on **{flight_airline}** (Depart **03:20 AM** from {source_location} ➔ Land **08:50 AM** at **{arr_airport}**). Complete customs, immigration clearance, and retrieve checked bags.\n\n"
                    f"**Stage 2 (Airport ➔ {dest_name} Transfer • 09:35 AM - 12:20 PM):**\n"
                    f"Meet your chauffeur at arrivals with nameboard and board your **{connecting_veh_name}** for a scenic ~95 km (~2h 45m) transfer up to **{dest_name}**.\n\n"
                    f"**Stage 3 (Resort Check-In & Welcome • 12:20 PM - 01:15 PM):**\n"
                    f"Arrive at **{resolved_hotel_name}** ({hotel_type}, ⭐{hotel_rating}), complete check-in, unpack, freshen up, and relax before afternoon activities."
                )
                morning_time = "08:50 AM - 01:15 PM"
                morning_tag = "Flight Arrival & Resort Transfer"
                morning_spec = resolved_hotel_name
            else:
                morning_text = f"Depart from **{source_location}** towards **{dest_name}** via **{transport_name}**. Arrive in {dest_name}, check in to **{resolved_hotel_name}** ({hotel_type}, ⭐{hotel_rating}), refresh and unpack."
                morning_title = f"Arrival & Check-in at {resolved_hotel_name}"
                morning_time = "09:00 AM - 12:00 PM"
                morning_tag = "Arrival & Check-in"
                morning_spec = resolved_hotel_name
        else:
            if attraction_idx < total_attractions:
                att = attraction_objects[attraction_idx]
                attraction_idx += 1
                fee_txt = f" (Entry: ₹{int(att['entry_fee'])})" if float(att.get('entry_fee', 0)) > 0 else " (Free Entry)"
                morning_text = f"Visit **{att['name']}**{fee_txt} - {att.get('description', '')}."
                morning_title = f"Explore {att['name']}"
                morning_spec = att['name']
            else:
                morning_text = f"Enjoy a leisurely breakfast followed by a sunrise walk around {dest_name}'s peaceful trails."
                morning_title = "Morning Scenic Walk"
                morning_spec = f"{dest_name} Scenic Trail"
            morning_time = "09:00 AM - 12:00 PM"
            morning_tag = "Morning Sightseeing"

        lunch_time = "01:15 PM - 02:30 PM" if (day == 1 and is_flight) else "12:30 PM - 02:00 PM"
        lunch_text = f"Enjoy a flavorful lunch at **{lunch_place}** savoring signature local delicacies."
        lunch_title = f"Lunch at {lunch_place}"

        afternoon_time = "02:45 PM - 05:00 PM" if (day == 1 and is_flight) else "02:30 PM - 05:00 PM"
        if attraction_idx < total_attractions:
            att = attraction_objects[attraction_idx]
            attraction_idx += 1
            fee_txt = f" (Entry: ₹{int(att['entry_fee'])})" if float(att.get('entry_fee', 0)) > 0 else " (Free Entry)"
            afternoon_text = f"Head to **{att['name']}**{fee_txt} - {att.get('description', '')}."
            afternoon_title = f"Excursion to {att['name']}"
            afternoon_spec = att['name']
        else:
            afternoon_text = f"Explore the local craft centers and cultural landmarks in central {dest_name}."
            afternoon_title = "Local Heritage Exploration"
            afternoon_spec = f"Central {dest_name}"

        # Evening based on interests
        if day == duration_days:
            evening_text = f"Stroll through the vibrant {dest_name} bazaars for souvenirs, spices, and handmade crafts before departure."
            evening_title = "Bazaar & Souvenir Shopping"
        elif "nature" in interests or "relaxation" in interests:
            evening_text = f"Relax at a scenic sunset point in {dest_name} enjoying warm tea and cool breezes."
            evening_title = "Sunset Overlook & Tea Experience"
        elif "nightlife" in interests:
            evening_text = f"Visit charming cafes and live music lounges in {dest_name} town center."
            evening_title = "Cafe Culture & Live Music"
        else:
            evening_text = f"Take a tranquil evening promenade through {dest_name} town square, capturing photos and relaxing."
            evening_title = "Evening Town Walk"
        evening_time = "05:30 PM - 07:30 PM"

        dinner_text = f"Conclude Day {day} with a relaxing dinner at **{dinner_place}**, followed by an overnight rest at **{resolved_hotel_name}**."
        dinner_title = f"Dinner at {dinner_place} & Rest at {resolved_hotel_name}"
        dinner_time = "08:00 PM - 10:00 PM"

        slots = [
            {"period": "morning", "time": morning_time, "title": morning_title, "description": morning_text, "icon": "sunrise", "tag": morning_tag, "specific_name": morning_spec},
            {"period": "lunch", "time": lunch_time, "title": lunch_title, "description": lunch_text, "icon": "utensils", "tag": "Dining", "specific_name": lunch_place},
            {"period": "afternoon", "time": afternoon_time, "title": afternoon_title, "description": afternoon_text, "icon": "sun", "tag": "Sightseeing", "specific_name": afternoon_spec},
            {"period": "evening", "time": evening_time, "title": evening_title, "description": evening_text, "icon": "sunset", "tag": "Leisure", "specific_name": f"{dest_name} Overlook"},
            {"period": "dinner", "time": dinner_time, "title": dinner_title, "description": dinner_text, "icon": "moon", "tag": "Dinner & Stay", "specific_name": resolved_hotel_name}
        ]

        # Add custom items if any
        if custom_items and isinstance(custom_items, list):
            for ci in custom_items:
                ci_name = ci.get("name") if isinstance(ci, dict) else str(ci)
                ci_desc = ci.get("description", f"Special highlight in {dest_name}.") if isinstance(ci, dict) else ""
                slots.append({
                    "period": "custom",
                    "time": "Flexible Slot",
                    "title": f"Custom Visit: {ci_name}",
                    "description": f"Visit user-selected attraction **{ci_name}** - {ci_desc}",
                    "icon": "sparkles",
                    "tag": "Custom Selection",
                    "specific_name": ci_name
                })

        day_schedule = {
            "day": day,
            "theme": f"Day {day}: Discovering {dest_name}",
            "destination_id": destination_id,
            "destination_name": dest_name,
            "hotel_name": resolved_hotel_name,
            # Standard keys for backward compatibility
            "morning": morning_text,
            "lunch": lunch_text,
            "afternoon": afternoon_text,
            "evening": evening_text,
            "dinner": dinner_text,
            # Structured time slots for rich frontend displays
            "slots": slots
        }
        itinerary.append(day_schedule)

    return itinerary
