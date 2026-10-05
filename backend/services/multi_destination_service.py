import math
import json
import pandas as pd
from backend.utils.csv_manager import load_csv, find_by_id, filter_rows

# Curated geographic and scenic synergy pairings for Kerala & South India destinations
# Includes realistic road distances, driving times, and pairing synergy rationales
NEARBY_DESTINATION_MAP = {
    1: [  # Munnar
        {"id": 22, "name": "Kanthalloor", "distance_km": 48, "drive_time": "1h 30m", "reason": "Fruit orchards, terraced farms, and tranquil pine hills just over the ridge from Munnar."},
        {"id": 21, "name": "Marayoor", "distance_km": 40, "drive_time": "1h 15m", "reason": "Natural sandalwood reserves, ancient dolmens, and scenic waterfalls along the Munnar border."},
        {"id": 10, "name": "Vagamon", "distance_km": 92, "drive_time": "2h 45m", "reason": "Misty rolling meadows, pine forests, and adventure valleys complement Munnar's tea estates."},
        {"id": 6, "name": "Thekkady", "distance_km": 88, "drive_time": "2h 40m", "reason": "Periyar Tiger Reserve, wildlife boat safaris, and spice plantations in the high ranges."},
        {"id": 19, "name": "Idukki", "distance_km": 54, "drive_time": "1h 45m", "reason": "Spectacular arch dam, vast forest reservoirs, and scenic high-altitude viewpoints."},
        {"id": 20, "name": "Ramakkalmedu", "distance_km": 74, "drive_time": "2h 15m", "reason": "Panoramic wind-swept ridges overlooking the Tamil Nadu plains and spice plantations."}
    ],
    2: [  # Wayanad
        {"id": 40, "name": "Thusharagiri", "distance_km": 48, "drive_time": "1h 25m", "reason": "Spectacular cascading waterfalls and trekking trails at the foothills of Wayanad Ghats."},
        {"id": 37, "name": "Kozhikode", "distance_km": 72, "drive_time": "2h 15m", "reason": "Historic Malabar port city famous for culinary heritage, spice markets, and coastal beaches."},
        {"id": 35, "name": "Nilambur", "distance_km": 62, "drive_time": "1h 50m", "reason": "World-famous teak plantations, rainforests, and suspension bridges near Chaliyar river."},
        {"id": 33, "name": "Silent Valley", "distance_km": 108, "drive_time": "3h 20m", "reason": "Pristine rainforest national park with rare flora, fauna, and jungle hiking trails."}
    ],
    3: [  # Alleppey
        {"id": 8, "name": "Kumarakom", "distance_km": 32, "drive_time": "50m", "reason": "Vembanad Lake luxury bird sanctuary and tranquil backwater lagoons just across the water."},
        {"id": 15, "name": "Munroe Island", "distance_km": 68, "drive_time": "1h 45m", "reason": "Narrow canal canoe cruises, mangrove arches, and serene village backwaters."},
        {"id": 5, "name": "Kochi", "distance_km": 53, "drive_time": "1h 20m", "reason": "Colonial Fort Kochi heritage, Chinese fishing nets, and urban Malabar dining."},
        {"id": 14, "name": "Kollam", "distance_km": 82, "drive_time": "2h 00m", "reason": "Ashtamudi Lake gateway, historic lighthouse, and coastal boat cruises."}
    ],
    4: [  # Varkala
        {"id": 7, "name": "Kovalam", "distance_km": 54, "drive_time": "1h 30m", "reason": "Iconic crescent beaches, historic lighthouse, and vibrant beachside promenade."},
        {"id": 12, "name": "Poovar", "distance_km": 68, "drive_time": "1h 45m", "reason": "Golden sandbars where river, backwaters, and the Arabian Sea converge."},
        {"id": 15, "name": "Munroe Island", "distance_km": 42, "drive_time": "1h 10m", "reason": "Idyllic canoe exploration through hidden canal networks and coconut islands."},
        {"id": 13, "name": "Ponmudi", "distance_km": 76, "drive_time": "2h 15m", "reason": "Misty mountain hill station with 22 hairpin turns and cool fresh breezes."},
        {"id": 11, "name": "Thiruvananthapuram", "distance_km": 44, "drive_time": "1h 10m", "reason": "Padmanabhaswamy temple, Napier museum, and royal palaces in Kerala's capital."}
    ],
    5: [  # Kochi
        {"id": 3, "name": "Alleppey", "distance_km": 53, "drive_time": "1h 20m", "reason": "Famous backwater houseboats, paddy canals, and peaceful coastal lagoons."},
        {"id": 29, "name": "Athirappilly", "distance_km": 66, "drive_time": "1h 45m", "reason": "Spectacular 80-foot rainforest waterfalls known as the Niagara of India."},
        {"id": 8, "name": "Kumarakom", "distance_km": 48, "drive_time": "1h 15m", "reason": "Serene Vembanad Lake backwaters, bird sanctuary, and luxury village resorts."},
        {"id": 18, "name": "Vaikom", "distance_km": 36, "drive_time": "55m", "reason": "Historic Shiva temple and traditional backwater heritage village walks."},
        {"id": 28, "name": "Thrissur", "distance_km": 74, "drive_time": "1h 50m", "reason": "Cultural capital with ancient temples, elephants, and traditional art centers."}
    ],
    6: [  # Thekkady
        {"id": 1, "name": "Munnar", "distance_km": 88, "drive_time": "2h 40m", "reason": "Lush emerald tea carpet hills, misty mountain valleys, and cool alpine climate."},
        {"id": 10, "name": "Vagamon", "distance_km": 46, "drive_time": "1h 30m", "reason": "Highland pine forests, rolling green meadows, and paragliding hills."},
        {"id": 23, "name": "Peermade", "distance_km": 28, "drive_time": "50m", "reason": "Colonial summer residence, cardamom estates, and scenic waterfall trails."},
        {"id": 20, "name": "Ramakkalmedu", "distance_km": 42, "drive_time": "1h 20m", "reason": "Windmill farms and awe-inspiring panoramic overlooks of the Western Ghats."}
    ],
    7: [  # Kovalam
        {"id": 4, "name": "Varkala", "distance_km": 54, "drive_time": "1h 30m", "reason": "Dramatic red laterite cliffs, surfing waves, and bohemian beach cafes."},
        {"id": 12, "name": "Poovar", "distance_km": 18, "drive_time": "35m", "reason": "Tranquil floating cottages, mangrove boat tours, and golden beach spit."},
        {"id": 11, "name": "Thiruvananthapuram", "distance_km": 14, "drive_time": "30m", "reason": "Historic royal palaces, world's richest temple, and cultural museums."},
        {"id": 13, "name": "Ponmudi", "distance_km": 62, "drive_time": "1h 50m", "reason": "Scenic mountain drive with tea plantations, river rapids, and cool mist."}
    ],
    10: [  # Vagamon
        {"id": 1, "name": "Munnar", "distance_km": 92, "drive_time": "2h 45m", "reason": "Iconic tea garden hills, Eravikulam National Park, and high-altitude peaks."},
        {"id": 6, "name": "Thekkady", "distance_km": 46, "drive_time": "1h 30m", "reason": "Wildlife jungle boat safaris and aromatic spice plantation walks."},
        {"id": 19, "name": "Idukki", "distance_km": 48, "drive_time": "1h 35m", "reason": "High-altitude reservoir views, hill viewpoints, and peaceful mountain drives."},
        {"id": 23, "name": "Peermade", "distance_km": 24, "drive_time": "45m", "reason": "Rolling cardamom estates, cool mountain breeze, and heritage tea bungalows."}
    ]
}

def get_nearby_destinations(destination_id, limit=6):
    """
    Returns verified nearby complementary destinations for a base destination.
    Uses pre-curated synergy table + fallback geographical proximity matching.
    """
    destination_id = int(destination_id)
    dest_df = load_csv("destinations")
    if dest_df.empty:
        return []

    base_dest = find_by_id("destinations", destination_id)
    if not base_dest:
        return []

    results = []
    seen_ids = {destination_id}

    # 1. First check curated synergy map
    if destination_id in NEARBY_DESTINATION_MAP:
        for item in NEARBY_DESTINATION_MAP[destination_id]:
            d_id = int(item["id"])
            if d_id in seen_ids:
                continue
            dest_row = find_by_id("destinations", d_id)
            if dest_row:
                seen_ids.add(d_id)
                results.append({
                    "destination_id": d_id,
                    "name": dest_row.get("name", item["name"]),
                    "category": dest_row.get("category", "hill station"),
                    "state": dest_row.get("state", "Kerala"),
                    "city": dest_row.get("city", ""),
                    "image_url": dest_row.get("image_url", ""),
                    "description": dest_row.get("description", ""),
                    "distance_km": item["distance_km"],
                    "drive_time": item["drive_time"],
                    "pairing_reason": item["reason"]
                })

    # 2. If fewer than limit, find nearby by same district/state and category synergy
    base_state = str(base_dest.get("state", "")).lower()
    base_city = str(base_dest.get("city", "")).lower()
    base_cat = str(base_dest.get("category", "")).lower()

    for _, row in dest_df.iterrows():
        if len(results) >= limit:
            break
        r_id = int(row["id"])
        if r_id in seen_ids:
            continue

        r_state = str(row.get("state", "")).lower()
        r_city = str(row.get("city", "")).lower()
        r_cat = str(row.get("category", "")).lower()

        # Same district or neighboring region in same state
        if r_state == base_state and (r_city == base_city or r_cat in [base_cat, "hill station", "nature", "backwaters", "wildlife"]):
            seen_ids.add(r_id)
            est_dist = 45 if r_city == base_city else 80
            est_time = f"{math.ceil(est_dist / 35)}h {round((est_dist % 35) * 1.5)}m"
            results.append({
                "destination_id": r_id,
                "name": row.get("name", "Destination"),
                "category": row.get("category", "nature"),
                "state": row.get("state", "Kerala"),
                "city": row.get("city", ""),
                "image_url": row.get("image_url", ""),
                "description": row.get("description", ""),
                "distance_km": est_dist,
                "drive_time": est_time,
                "pairing_reason": f"Complementary {row.get('category')} getaway conveniently accessible from {base_dest.get('name')}."
            })

    return results[:limit]

def suggest_multi_destination_splits(total_days=5, primary_dest_id=1, secondary_dest_id=None):
    """
    Generates intelligent day splits for multi-destination trips.
    E.g., 5 days -> 3 days in Munnar + 2 days in Vagamon.
    """
    total_days = max(2, int(total_days or 5))
    if total_days == 2:
        return [{"destination_id": primary_dest_id, "days": 1}, {"destination_id": secondary_dest_id, "days": 1}]
    elif total_days == 3:
        return [{"destination_id": primary_dest_id, "days": 2}, {"destination_id": secondary_dest_id, "days": 1}]
    elif total_days == 4:
        return [{"destination_id": primary_dest_id, "days": 2}, {"destination_id": secondary_dest_id, "days": 2}]
    elif total_days == 5:
        return [{"destination_id": primary_dest_id, "days": 3}, {"destination_id": secondary_dest_id, "days": 2}]
    elif total_days == 6:
        return [{"destination_id": primary_dest_id, "days": 3}, {"destination_id": secondary_dest_id, "days": 3}]
    elif total_days == 7:
        return [{"destination_id": primary_dest_id, "days": 4}, {"destination_id": secondary_dest_id, "days": 3}]
    else:
        half = math.ceil(total_days * 0.6)
        return [{"destination_id": primary_dest_id, "days": half}, {"destination_id": secondary_dest_id, "days": total_days - half}]

def generate_detailed_personalized_itinerary(
    source_location="Kochi",
    segments=None,
    travelers=2,
    group_type="family",
    pace="moderate"
):
    """
    Builds a deeply personalized, time-slotted day-by-day itinerary spanning
    one or multiple destinations. Explicitly names all selected hotels,
    restaurants, attractions, and transport modes in the time slots.
    """
    if not segments or not isinstance(segments, list):
        return []

    attracts_df = load_csv("attractions")
    rests_df = load_csv("restaurants")
    hotels_df = load_csv("hotels")

    full_itinerary = []
    current_day = 1
    total_segments = len(segments)

    for seg_idx, seg in enumerate(segments):
        dest_id = int(seg.get("destination_id") or 1)
        dest_record = find_by_id("destinations", dest_id)
        dest_name = seg.get("destination_name") or (dest_record["name"] if dest_record else f"Destination #{dest_id}")
        seg_days = max(1, int(seg.get("duration_days") or seg.get("days") or 1))

        # 1. Resolve Selected Hotel for this segment
        hotel_name = seg.get("selected_hotel_name") or seg.get("selected_hotel") or seg.get("hotel_name")
        hotel_type = "Hotel"
        hotel_rating = 4.5
        if isinstance(hotel_name, dict):
            hotel_type = hotel_name.get("hotel_type", "Hotel")
            hotel_rating = hotel_name.get("rating", 4.5)
            hotel_name = hotel_name.get("name")

        if not hotel_name and (seg.get("hotel_id") or seg.get("selected_hotel_id")):
            h_id = seg.get("hotel_id") or seg.get("selected_hotel_id")
            h_obj = find_by_id("hotels", int(h_id))
            if h_obj:
                hotel_name = h_obj.get("name")
                hotel_type = h_obj.get("hotel_type", "Hotel")
                hotel_rating = h_obj.get("rating", 4.5)
        if not hotel_name and not hotels_df.empty:
            dh = hotels_df[hotels_df["destination_id"] == dest_id]
            if not dh.empty:
                hotel_name = dh.iloc[0].get("name")
                hotel_type = dh.iloc[0].get("hotel_type", "Hotel")
                hotel_rating = dh.iloc[0].get("rating", 4.5)
        if not hotel_name:
            hotel_name = f"Premium {dest_name} Resort & Stay"

        # 2. Resolve Selected Transport for this segment
        transport_info = seg.get("selected_transport") or seg.get("transport_option") or seg.get("transport") or {}
        if isinstance(transport_info, str):
            transport_name = transport_info
        elif isinstance(transport_info, dict):
            transport_name = transport_info.get("transport_type") or transport_info.get("mode") or transport_info.get("name") or "Private AC Cab"
        else:
            transport_name = "Private AC Cab"

        # 3. Resolve Selected Restaurants
        seg_rests = seg.get("selected_restaurants") or seg.get("restaurants") or []
        rest_names = []
        if isinstance(seg_rests, list):
            for r in seg_rests:
                if isinstance(r, dict) and r.get("name"):
                    rest_names.append(r["name"])
                elif isinstance(r, (int, str)) and str(r).isdigit():
                    r_obj = find_by_id("restaurants", int(r))
                    if r_obj:
                        rest_names.append(r_obj["name"])
                elif isinstance(r, str) and r.strip():
                    rest_names.append(r.strip())
        
        # Fallback restaurants from database if none selected
        if not rest_names and not rests_df.empty:
            dr = rests_df[rests_df["destination_id"] == dest_id]
            if not dr.empty:
                rest_names = dr["name"].tolist()
        if not rest_names:
            rest_names = [f"Traditional {dest_name} Dining", f"{dest_name} Heritage Restaurant", f"Rooftop Garden Bistro"]

        # 4. Resolve Selected Attractions / Sightseeing
        seg_attracts = seg.get("selected_attractions") or seg.get("attractions") or []
        attraction_objects = []
        if isinstance(seg_attracts, list) and len(seg_attracts) > 0:
            for a in seg_attracts:
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
                elif isinstance(a, str) and a.strip():
                    matching_att = None
                    if not attracts_df.empty:
                        matches = attracts_df[(attracts_df["destination_id"] == dest_id) & (attracts_df["name"].str.lower() == a.strip().lower())]
                        if not matches.empty:
                            matching_att = matches.iloc[0]
                    if matching_att is not None:
                        attraction_objects.append({
                            "name": matching_att.get("name", a.strip()),
                            "description": matching_att.get("description", f"Scenic attraction in {dest_name}"),
                            "entry_fee": matching_att.get("entry_fee", 0),
                            "image_url": matching_att.get("image_url", "")
                        })
                    else:
                        attraction_objects.append({
                            "name": a.strip(),
                            "description": f"Scenic and popular highlight in {dest_name}",
                            "entry_fee": 0,
                            "image_url": ""
                        })

        # Fallback attractions from database if needed
        if len(attraction_objects) < (seg_days * 2) and not attracts_df.empty:
            da = attracts_df[attracts_df["destination_id"] == dest_id]
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
                {"name": f"{dest_name} Scenic Mountain Overlook", "description": f"Panoramic valley views and tea estate walks across {dest_name}.", "entry_fee": 50},
                {"name": f"{dest_name} Botanical Reserve & Waterfalls", "description": f"Lush flora and tranquil water cascades in {dest_name}.", "entry_fee": 80},
                {"name": f"{dest_name} Heritage Village & Bazaar", "description": f"Cultural handicraft stalls, spices, and tea tasting in central {dest_name}.", "entry_fee": 40},
                {"name": f"{dest_name} Sunset Ridge Trail", "description": f"Golden hour views across the mist-covered peaks of {dest_name}.", "entry_fee": 0}
            ]

        att_idx = 0
        total_atts = len(attraction_objects)

        # Generate each day for this segment
        for day_in_seg in range(1, seg_days + 1):
            is_trip_start = (current_day == 1)
            is_segment_start = (day_in_seg == 1 and seg_idx > 0)
            is_trip_end = (seg_idx == total_segments - 1 and day_in_seg == seg_days)

            # Pick dining spots for this day
            lunch_place = rest_names[(day_in_seg - 1) % len(rest_names)]
            dinner_place = rest_names[day_in_seg % len(rest_names)] if len(rest_names) > 1 else lunch_place

            slots = []

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
                (isinstance(transport_info, dict) and (transport_info.get("mode") == "flight" or "flight" in str(transport_info.get("category", "")).lower()))
            ):
                is_flight = True

            # ---------------- Morning Slot ----------------
            if is_trip_start:
                if is_flight:
                    connecting_veh_name = "Private Dedicated AC Sedan (Dzire/Etios)"
                    if isinstance(transport_info, dict):
                        if transport_info.get("selected_vehicle_obj"):
                            connecting_veh_name = transport_info["selected_vehicle_obj"].get("name", connecting_veh_name)
                        elif transport_info.get("connecting_vehicles") and len(transport_info["connecting_vehicles"]) > 0:
                            connecting_veh_name = transport_info["connecting_vehicles"][0].get("name", connecting_veh_name)
                    
                    flight_airline = "Emirates (EK 530)" if "emirates" in trans_lower or "dubai" in src_lower else (transport_name if "flight" in trans_lower else f"Direct Flight ({transport_name})")
                    arr_airport = "Cochin International Airport (COK)" if any(k in dest_name.lower() for k in ["munnar", "vagamon", "kochi", "alleppey", "thekkady", "athirappilly", "idukki", "kanthalloor"]) else "Gateway Airport (COK/TRV/CCJ)"
                    
                    morning_title = f"Touchdown at {arr_airport.split('(')[0].strip()} ➔ {connecting_veh_name} to {dest_name}"
                    morning_desc = (
                        f"**Stage 1 (Flight Touchdown & Clearance • 08:50 AM - 09:35 AM):**\n"
                        f"Fly on **{flight_airline}** (Depart **03:20 AM** from {source_location} ➔ Land **08:50 AM** at **{arr_airport}**). Complete customs, immigration clearance, and retrieve luggage.\n\n"
                        f"**Stage 2 (Airport ➔ {dest_name} Transfer • 09:35 AM - 12:20 PM):**\n"
                        f"Meet your chauffeur at arrivals with nameboard and board your **{connecting_veh_name}** for a scenic ~95 km (~2h 45m) transfer up to **{dest_name}**.\n\n"
                        f"**Stage 3 (Resort Check-In & Welcome • 12:20 PM - 01:15 PM):**\n"
                        f"Arrive at **{hotel_name}** ({hotel_type}, ⭐{hotel_rating}), complete check-in, unpack, freshen up, and relax before afternoon activities."
                    )
                    slots.append({
                        "period": "Morning",
                        "time": "08:50 AM - 01:15 PM",
                        "type": "transit",
                        "tag": "Flight Arrival & Resort Transfer",
                        "icon": "plane",
                        "title": morning_title,
                        "description": morning_desc,
                        "specific_name": hotel_name
                    })
                else:
                    morning_title = f"Departure from {source_location} ➔ Arrival in {dest_name}"
                    morning_desc = f"Depart from **{source_location}** towards **{dest_name}** via **{transport_name}**. Arrive in **{dest_name}**, check into **{hotel_name}** ({hotel_type}, ⭐{hotel_rating}), freshen up and unpack before afternoon activities."
                    slots.append({
                        "period": "Morning",
                        "time": "08:30 AM - 11:30 AM",
                        "type": "transit",
                        "tag": "Departure & Check-in",
                        "icon": "car",
                        "title": morning_title,
                        "description": morning_desc,
                        "specific_name": hotel_name
                    })
            elif is_segment_start:
                prev_seg = segments[seg_idx - 1]
                prev_dest = prev_seg.get("destination_name", "previous destination")
                prev_hotel = prev_seg.get("selected_hotel_name") or prev_seg.get("hotel_name") or f"Hotel in {prev_dest}"
                morning_title = f"Transfer from {prev_dest} to {dest_name} via {transport_name}"
                morning_desc = f"Check out from **{prev_hotel}** in {prev_dest}. Board your **{transport_name}** for a scenic mountain road transfer to **{dest_name}**. Arrive at **{hotel_name}**, complete check-in, and freshen up."
                slots.append({
                    "period": "Morning",
                    "time": "09:00 AM - 12:00 PM",
                    "type": "transit",
                    "tag": "Inter-City Transfer",
                    "icon": "car",
                    "title": morning_title,
                    "description": morning_desc,
                    "specific_name": hotel_name
                })
            else:
                att = attraction_objects[att_idx % total_atts]
                att_idx += 1
                fee_txt = f" (Entry: ₹{int(att['entry_fee'])})" if float(att.get('entry_fee', 0)) > 0 else " (Free Entry)"
                morning_title = f"Visit {att['name']}"
                morning_desc = f"Explore **{att['name']}**{fee_txt} - {att.get('description', '')}. Enjoy crisp morning views and photography in {dest_name}."
                slots.append({
                    "period": "Morning",
                    "time": "09:00 AM - 12:00 PM",
                    "type": "sightseeing",
                    "tag": "Morning Sightseeing",
                    "icon": "sunrise",
                    "title": morning_title,
                    "description": morning_desc,
                    "specific_name": att['name']
                })

            # ---------------- Lunch Slot ----------------
            lunch_time = "01:15 PM - 02:30 PM" if (is_trip_start and is_flight) else "12:30 PM - 02:00 PM"
            lunch_title = f"Lunch at {lunch_place}"
            lunch_desc = f"Savor authentic regional cuisine and specialities at **{lunch_place}** in {dest_name}."
            slots.append({
                "period": "Lunch",
                "time": lunch_time,
                "type": "dining",
                "tag": "Regional Dining",
                "icon": "utensils",
                "title": lunch_title,
                "description": lunch_desc,
                "specific_name": lunch_place
            })

            # ---------------- Afternoon Slot ----------------
            afternoon_time = "02:45 PM - 05:00 PM" if (is_trip_start and is_flight) else "02:30 PM - 05:00 PM"
            att = attraction_objects[att_idx % total_atts]
            att_idx += 1
            fee_txt = f" (Entry: ₹{int(att['entry_fee'])})" if float(att.get('entry_fee', 0)) > 0 else " (Free Entry)"
            afternoon_title = f"Excursion to {att['name']}"
            afternoon_desc = f"Head to **{att['name']}**{fee_txt} - {att.get('description', '')}. Perfect for nature walks and sightseeing."
            slots.append({
                "period": "Afternoon",
                "time": afternoon_time,
                "type": "sightseeing",
                "tag": "Sightseeing",
                "icon": "sun",
                "title": afternoon_title,
                "description": afternoon_desc,
                "specific_name": att['name']
            })

            # ---------------- Evening Slot ----------------
            if is_trip_end:
                evening_title = f"Souvenir Shopping & Golden Hour in {dest_name}"
                evening_desc = f"Stroll through central {dest_name} bazaars for spices, homemade chocolates, tea, and handicrafts before departure."
            else:
                evening_title = f"Sunset Point & Leisure Stroll in {dest_name}"
                evening_desc = f"Relax at scenic sunset viewpoints overlooking rolling hills and tranquil valleys of {dest_name}."
            slots.append({
                "period": "Evening",
                "time": "05:30 PM - 07:30 PM",
                "type": "leisure",
                "tag": "Leisure & Sunset",
                "icon": "sunset",
                "title": evening_title,
                "description": evening_desc,
                "specific_name": f"{dest_name} Sunset Overlook"
            })

            # ---------------- Dinner & Stay Slot ----------------
            dinner_title = f"Dinner at {dinner_place} & Overnight Stay at {hotel_name}"
            dinner_desc = f"Conclude Day {current_day} with a relaxing dinner at **{dinner_place}**, followed by an overnight rest at **{hotel_name}**."
            slots.append({
                "period": "Dinner",
                "time": "08:00 PM - 10:00 PM",
                "type": "dining",
                "tag": "Dinner & Overnight Stay",
                "icon": "moon",
                "title": dinner_title,
                "description": dinner_desc,
                "specific_name": hotel_name
            })

            # Append custom items if user added any specifically for this day
            custom_items = seg.get("custom_items") or []
            if isinstance(custom_items, list):
                for ci in custom_items:
                    ci_name = ci.get("name") if isinstance(ci, dict) else str(ci)
                    ci_desc = ci.get("description", f"Special personalized highlight in {dest_name}.") if isinstance(ci, dict) else ""
                    slots.append({
                        "period": "Added Attraction",
                        "time": "Flexible Slot",
                        "type": "custom",
                        "tag": "Custom Selection",
                        "icon": "sparkles",
                        "title": f"Custom Visit: {ci_name}",
                        "description": f"Visit user-selected attraction **{ci_name}** - {ci_desc}",
                        "specific_name": ci_name
                    })

            full_itinerary.append({
                "day": current_day,
                "segment_index": seg_idx,
                "destination_id": dest_id,
                "destination_name": dest_name,
                "theme": f"Day {current_day}: Discovering {dest_name} (Day {day_in_seg} of {seg_days})",
                "morning": slots[0]["description"],
                "lunch": slots[1]["description"],
                "afternoon": slots[2]["description"],
                "evening": slots[3]["description"],
                "dinner": slots[4]["description"],
                "hotel_name": hotel_name,
                "slots": slots
            })

            current_day += 1

    return full_itinerary

def estimate_multi_destination_cost(segments, travelers=2, user_budget=None):
    """
    Computes accurate combined cost estimations across all multi-destination segments.
    """
    travelers = max(1, int(travelers or 2))
    total_accommodation = 0.0
    total_food = 0.0
    total_transport = 0.0
    total_sightseeing = 0.0
    total_duration = 0

    hotels_df = load_csv("hotels")
    rests_df = load_csv("restaurants")
    attracts_df = load_csv("attractions")

    segment_summaries = []

    for seg in (segments or []):
        dest_id = int(seg.get("destination_id") or 1)
        dest_record = find_by_id("destinations", dest_id)
        dest_name = seg.get("destination_name") or (dest_record["name"] if dest_record else f"Destination #{dest_id}")
        days = max(1, int(seg.get("duration_days") or seg.get("days") or 1))
        total_duration += days

        # Hotel cost for this segment
        hotel_price = 1600.0
        if seg.get("hotel_id"):
            h = find_by_id("hotels", int(seg.get("hotel_id")))
            if h:
                hotel_price = float(h.get("price_per_night", 1600.0))
        elif not hotels_df.empty:
            dh = hotels_df[hotels_df["destination_id"] == dest_id]
            if not dh.empty:
                hotel_price = float(dh["price_per_night"].mean())

        rooms_needed = max(1, math.ceil(travelers / 2.0))
        nights = days
        seg_hotel_cost = round(hotel_price * rooms_needed * nights, 2)
        total_accommodation += seg_hotel_cost

        # Food cost for this segment
        avg_meal = 300.0
        if seg.get("restaurant_id"):
            r = find_by_id("restaurants", int(seg.get("restaurant_id")))
            if r:
                avg_meal = float(r.get("avg_cost", 300.0))
        elif not rests_df.empty:
            dr = rests_df[rests_df["destination_id"] == dest_id]
            if not dr.empty:
                avg_meal = float(dr["avg_cost"].mean())
        seg_food_cost = round(avg_meal * travelers * days * 3, 2)
        total_food += seg_food_cost

        # Transport cost for this segment
        t_opt = seg.get("transport_option") or {}
        seg_trans_cost = 0.0
        if isinstance(t_opt, dict) and t_opt.get("total_fare"):
            seg_trans_cost = float(t_opt["total_fare"])
        else:
            seg_trans_cost = round(1200.0 * days, 2)
        total_transport += seg_trans_cost

        # Sightseeing cost
        seg_attracts = seg.get("selected_attractions") or []
        seg_sight_cost = 0.0
        if isinstance(seg_attracts, list) and len(seg_attracts) > 0:
            for sa in seg_attracts:
                if isinstance(sa, dict):
                    seg_sight_cost += float(sa.get("entry_fee", 0))
                elif isinstance(sa, (int, str)) and str(sa).isdigit():
                    ao = find_by_id("attractions", int(sa))
                    if ao:
                        seg_sight_cost += float(ao.get("entry_fee", 0))
            seg_sight_cost = round(seg_sight_cost * travelers, 2)
        else:
            seg_sight_cost = round(150.0 * travelers * days, 2)
        total_sightseeing += seg_sight_cost

        segment_summaries.append({
            "destination_id": dest_id,
            "destination_name": dest_name,
            "days": days,
            "accommodation": seg_hotel_cost,
            "food": seg_food_cost,
            "transport": seg_trans_cost,
            "sightseeing": seg_sight_cost,
            "subtotal": round(seg_hotel_cost + seg_food_cost + seg_trans_cost + seg_sight_cost, 2)
        })

    subtotal = total_accommodation + total_food + total_transport + total_sightseeing
    misc_cost = round(subtotal * 0.06, 2)
    total_cost = round(subtotal + misc_cost, 2)
    per_person = round(total_cost / travelers, 2)
    daily_avg = round(total_cost / max(1, total_duration), 2)

    return {
        "travelers": travelers,
        "total_days": total_duration,
        "accommodation": total_accommodation,
        "food": total_food,
        "transport": total_transport,
        "sightseeing": total_sightseeing,
        "miscellaneous": misc_cost,
        "total": total_cost,
        "per_person": per_person,
        "daily_average": daily_avg,
        "segments": segment_summaries,
        "is_within_budget": (float(user_budget) >= total_cost) if user_budget else True
    }
