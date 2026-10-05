import datetime
import pandas as pd
from backend.utils.csv_manager import load_csv, filter_rows, find_by_id


CATEGORY_SIMILARITY = {
    "hill station": {
        "hill station": 35,
        "nature": 30,
        "eco tourism": 28,
        "waterfall": 28,
        "wildlife": 26,
        "adventure": 25,
    },
    "nature": {
        "nature": 35,
        "eco tourism": 32,
        "hill station": 30,
        "wildlife": 30,
        "waterfall": 30,
        "adventure": 28,
        "backwaters": 20,
    },
    "eco tourism": {
        "eco tourism": 35,
        "nature": 32,
        "wildlife": 30,
        "waterfall": 28,
        "hill station": 28,
        "adventure": 25,
    },
    "wildlife": {
        "wildlife": 35,
        "eco tourism": 32,
        "nature": 30,
        "adventure": 28,
        "hill station": 25,
    },
    "waterfall": {
        "waterfall": 35,
        "nature": 32,
        "eco tourism": 30,
        "hill station": 28,
        "adventure": 25,
    },
    "backwaters": {
        "backwaters": 35,
        "beach": 30,
        "nature": 25,
        "wellness": 25,
        "eco tourism": 20,
    },
    "beach": {
        "beach": 35,
        "backwaters": 30,
        "wellness": 22,
        "nature": 20,
        "heritage": 18,
    },
    "wellness": {
        "wellness": 35,
        "backwaters": 28,
        "nature": 25,
        "pilgrimage": 22,
        "beach": 20,
    },
    "adventure": {
        "adventure": 35,
        "nature": 30,
        "eco tourism": 30,
        "wildlife": 28,
        "hill station": 25,
        "waterfall": 25,
    },
    "heritage": {
        "heritage": 35,
        "city tourism": 28,
        "pilgrimage": 28,
        "beach": 18,
    },
    "pilgrimage": {
        "pilgrimage": 35,
        "heritage": 28,
        "wellness": 22,
        "city tourism": 20,
    },
    "city tourism": {
        "city tourism": 35,
        "heritage": 28,
        "beach": 20,
        "pilgrimage": 18,
    }
}


def _to_plain(value):
    if isinstance(value, dict):
        return {k: _to_plain(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_to_plain(v) for v in value]
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass
    if pd.isna(value):
        return None
    return value


def get_user_completed_trips(user_id):
    """
    Returns a list of completed trips for a given user (strictly where status == 'completed').
    Enriched with destination metadata (destination_name, category, state, city, image_url).
    """
    if not user_id:
        return []
    user_trips = filter_rows("saved_trips", {"user_id": int(user_id)})
    dest_df = load_csv("destinations")
    dest_map = {}
    if not dest_df.empty:
        for _, row in dest_df.iterrows():
            dest_map[int(row["id"])] = row.to_dict()

    completed = []
    for t in user_trips:
        raw_status = str(t.get("status", "")).strip().lower()
        # Strictly require status == 'completed'
        if raw_status == "completed":
            t_copy = dict(t)
            t_date = str(t.get("travel_date", "")).strip()
            if not t_date or t_date in ("nan", "None"):
                t_date = str(t.get("created_at", "")).split(" ")[0]
            t_copy["travel_date"] = t_date
            t_copy["status"] = "completed"
            dest_id = int(t.get("destination_id", 0))
            if dest_id in dest_map:
                d_info = dest_map[dest_id]
                t_copy["destination_name"] = d_info.get("name", "Destination")
                t_copy["category"] = d_info.get("category", "")
                t_copy["state"] = d_info.get("state", "")
                t_copy["city"] = d_info.get("city", "")
                t_copy["image_url"] = d_info.get("image_url", "")
            else:
                t_copy["destination_name"] = "Destination"
            completed.append(t_copy)
    # sort by travel_date descending (most recent completed trip first)
    completed = sorted(completed, key=lambda x: str(x.get("travel_date", "")), reverse=True)
    return completed


def recommend_destinations(user_preferences, user_id=None):
    """
    Recommends top 5 destinations based on user preferences and past completed trips history.
    If the user has completed past trips (e.g. Munnar), similar destinations are boosted,
    and visited destinations are deprioritized so fresh similar places are recommended first.
    """
    dest_df = load_csv("destinations")
    hotels_df = load_csv("hotels")
    rest_df = load_csv("restaurants")
    attract_df = load_csv("attractions")
    trans_df = load_csv("transportation")
    
    if dest_df.empty:
        return []
        
    raw_pref_types = user_preferences.get("destination_types") or user_preferences.get("destination_type") or []
    if isinstance(raw_pref_types, str):
        if "," in raw_pref_types:
            pref_types = [t.strip().lower() for t in raw_pref_types.split(",") if t.strip()]
        elif raw_pref_types.strip():
            pref_types = [raw_pref_types.strip().lower()]
        else:
            pref_types = []
    elif isinstance(raw_pref_types, (list, tuple, set)):
        pref_types = [str(t).strip().lower() for t in raw_pref_types if str(t).strip()]
    else:
        pref_types = []

    budget = float(user_preferences.get("budget", 0))
    travelers = int(user_preferences.get("travelers", 1))
    duration = int(user_preferences.get("duration_days", 3))
    interests = [i.lower() for i in user_preferences.get("interests", [])]
    group_type = user_preferences.get("group_type", "family").lower()
    pref_state = user_preferences.get("state", "")
    
    # Check for past completed trips to personalize recommendations
    u_id = user_id or user_preferences.get("user_id")
    completed_trips = get_user_completed_trips(u_id) if u_id else []
    visited_dest_ids = set()
    past_dest_info = []
    for ct in completed_trips:
        did = int(ct.get("destination_id", 0))
        if did > 0:
            visited_dest_ids.add(did)
            d_record = find_by_id("destinations", did)
            if d_record:
                past_dest_info.append({
                    "id": did,
                    "name": d_record.get("name", "Destination"),
                    "category": str(d_record.get("category", "")).lower()
                })

    recommendations = []
    
    # Iterate through all destinations to score them
    for _, dest in dest_df.iterrows():
        dest_id = int(dest["id"])
        dest_name = dest["name"]
        dest_category = str(dest["category"]).lower()
        dest_state = str(dest["state"]).lower()
        is_visited = dest_id in visited_dest_ids
        
        # Optional state filter
        if pref_state and pref_state.lower() not in dest_state:
            continue
            
        score = 0
        reasons = []
        
        # 1. Destination Type / Category Match (30 pts max)
        if not pref_types:
            score += 20
        elif dest_category in pref_types:
            score += 30
            reasons.append(f"Matches your preferred category: {dest['category']}.")
        elif "honeymoon" in pref_types and dest_category in ["beach", "hill station"]:
            score += 25
            reasons.append("Perfect scenic escape for couples.")
        elif "family trip" in pref_types and dest_category in ["heritage", "pilgrimage", "city tourism"]:
            score += 25
            reasons.append("Great destination for family sightseeing and activities.")
        elif "adventure" in pref_types and dest_category in ["adventure", "hill station", "nature"]:
            score += 20
            reasons.append("Offers exciting outdoor and adventure experiences.")
            
        # 2. Budget Scoring (30 pts max)
        dest_hotels = hotels_df[(hotels_df["destination_id"] == dest_id) & (hotels_df["total_rooms"] > 0)]
        avg_hotel_price = dest_hotels["price_per_night"].mean() if not dest_hotels.empty else 1500.0
        
        dest_restaurants = rest_df[rest_df["destination_id"] == dest_id]
        avg_meal_price = dest_restaurants["avg_cost"].mean() if not dest_restaurants.empty else 400.0
        
        dest_trans = trans_df[(trans_df["destination_id"] == dest_id)]
        avg_trans_fare = dest_trans["fare"].mean() if not dest_trans.empty else 500.0
        
        rooms_needed = max(1, -(-travelers // 2))
        nights = max(1, duration - 1)
        est_accommodation = avg_hotel_price * rooms_needed * nights
        est_food = avg_meal_price * travelers * duration * 2.0
        est_local_trans = avg_trans_fare * nights * (1 if travelers <= 4 else 2)
        est_sightseeing = 200.0 * travelers * duration
        subtotal = est_accommodation + est_food + est_local_trans + est_sightseeing
        est_misc = subtotal * 0.05
        
        total_est_cost = subtotal + est_misc
        
        # Strict Budget Check
        if budget > 0 and total_est_cost > budget:
            continue
            
        if budget > 0:
            score += 30
            reasons.append(f"Well within your ₹{int(budget):,} budget (Estimated cost: ₹{int(total_est_cost):,}).")
        else:
            score += 20
            reasons.append(f"Estimated trip cost: ₹{int(total_est_cost):,}.")
            
        # 3. Interests Match (20 pts max)
        interest_hits = 0
        desc_lower = str(dest["description"]).lower()
        
        for interest in interests:
            if interest == "nature" and dest_category in ["nature", "hill station", "beach"]:
                interest_hits += 1
            elif interest == "history" and dest_category == "heritage":
                interest_hits += 1
            elif interest == "culture" and (dest_category in ["heritage", "pilgrimage"] or "culture" in desc_lower):
                interest_hits += 1
            elif interest == "relaxation" and dest_category in ["beach", "hill station", "nature"]:
                interest_hits += 1
            elif interest == "adventure" and (dest_category == "adventure" or "trek" in desc_lower or "safari" in desc_lower):
                interest_hits += 1
            elif interest == "food" and (not dest_restaurants.empty or "food" in desc_lower or "cuisine" in desc_lower or "dining" in desc_lower):
                interest_hits += 1
            elif interest == "shopping" and "market" in desc_lower:
                interest_hits += 1
                
        if len(interests) > 0:
            interest_score = min(20, (interest_hits / len(interests)) * 20)
            score += interest_score
            if interest_hits > 0:
                reasons.append(f"Matches your interest in {', '.join(interests[:3])}.")
                
        # 4. Group Type Match (10 pts max)
        if group_type == "solo" and dest_category in ["adventure", "nature"]:
            score += 10
            reasons.append("Highly rated for solo travelers and explorers.")
        elif group_type == "honeymoon" and dest_category in ["beach", "hill station"]:
            score += 10
            reasons.append("Popular romantic destination with scenic spots.")
        elif group_type == "family" and dest_category in ["heritage", "pilgrimage", "city tourism"]:
            score += 10
            reasons.append("Kid-friendly attractions and comfortable transport.")
        elif group_type == "friends" and dest_category in ["beach", "adventure", "city tourism"]:
            score += 10
            reasons.append("Exciting group activities and vibrant local scenes.")
        else:
            score += 5
            
        # 5. Past Trip Similarity Personalization
        similarity_badge = None
        if past_dest_info:
            matched_past = None
            for p in past_dest_info:
                sim_map = CATEGORY_SIMILARITY.get(p["category"], {})
                if not is_visited and (dest_category == p["category"] or sim_map.get(dest_category, 0) >= 25):
                    matched_past = p
                    break
            
            if matched_past and not is_visited:
                score += 20
                similarity_badge = f"Similar to {matched_past['name']}"
                reasons.insert(0, f"✨ Recommended based on your completed trip to {matched_past['name']} (Similar {dest['category']} vibe).")
            elif is_visited:
                # Deprioritize previously visited destinations so fresh similar places are recommended first
                score = max(10, score - 35)
                reasons.append(f"You already completed a trip to {dest_name} (Revisit).")

        # Compile detail outputs
        hotels_list = dest_hotels.sort_values(by="rating", ascending=False).head(4).to_dict(orient="records")
        rest_list = dest_restaurants.sort_values(by="rating", ascending=False).head(4).to_dict(orient="records")
        attract_list = attract_df[attract_df["destination_id"] == dest_id].head(4).to_dict(orient="records")
        transit_list = dest_trans.head(3).to_dict(orient="records")
        
        recommendation = {
            "destination_id": dest_id,
            "name": dest_name,
            "state": dest["state"],
            "city": dest["city"],
            "category": dest["category"],
            "description": dest["description"],
            "image_url": dest.get("image_url", ""),
            "best_time": dest["best_time"],
            "matching_score": max(0, min(100, int(score))),
            "is_previous_destination": is_visited,
            "similarity_badge": similarity_badge,
            "reasons": reasons,
            "estimated_cost": {
                "accommodation": round(float(est_accommodation), 2),
                "food": round(float(est_food), 2),
                "local_transport": round(float(est_local_trans), 2),
                "sightseeing": round(float(est_sightseeing), 2),
                "miscellaneous": round(float(est_misc), 2),
                "total": round(float(total_est_cost), 2)
            },
            "hotels": hotels_list,
            "restaurants": rest_list,
            "attractions": attract_list,
            "transportation": transit_list
        }
        recommendations.append(_to_plain(recommendation))
        
    # Sort recommendations so unvisited places rank first by score, and visited places come later
    recommendations = sorted(recommendations, key=lambda x: (not x["is_previous_destination"], x["matching_score"]), reverse=True)
    return recommendations[:5]


def recommend_destinations_based_on_past_trips(user_id, base_dest_id=None, budget=None, duration_days=3, travelers=2):
    """
    Recommends destinations specifically tailored to the user's completed trips.
    Users can change the base destination (e.g. from Alleppey to Munnar or Varkala).
    Places similar to the past destination (e.g. Munnar -> Wayanad, Thekkady) are ranked first.
    The visited destination is never placed in the #1 spot.
    """
    dest_df = load_csv("destinations")
    if dest_df.empty:
        return {"has_past_trips": False, "completed_trips": [], "base_trip": None, "recommendations": []}

    completed_trips = get_user_completed_trips(user_id) if user_id else []
    
    # Extract unique completed destinations for the switcher
    seen_dest_ids = set()
    distinct_completed = []
    for ct in completed_trips:
        d_id = int(ct.get("destination_id", 0))
        if d_id not in seen_dest_ids and d_id > 0:
            seen_dest_ids.add(d_id)
            distinct_completed.append({
                "destination_id": d_id,
                "trip_id": ct.get("id"),
                "destination_name": ct.get("destination_name", "Destination"),
                "category": ct.get("category", ""),
                "state": ct.get("state", ""),
                "city": ct.get("city", ""),
                "travel_date": ct.get("travel_date", ""),
                "image_url": ct.get("image_url", "")
            })

    base_dest = None
    base_trip = None
    
    if base_dest_id:
        try:
            target_id = int(base_dest_id)
            match_dest = dest_df[dest_df["id"] == target_id]
            if not match_dest.empty:
                base_dest = match_dest.iloc[0].to_dict()
                for ct in completed_trips:
                    if int(ct.get("destination_id", 0)) == target_id:
                        base_trip = ct
                        break
        except Exception:
            pass
            
    if not base_dest and completed_trips:
        base_trip = completed_trips[0]
        match_dest = dest_df[dest_df["id"] == int(base_trip.get("destination_id", 0))]
        if not match_dest.empty:
            base_dest = match_dest.iloc[0].to_dict()
            
    if not base_dest:
        std_recs = recommend_destinations({
            "budget": budget or 15000.0,
            "duration_days": duration_days,
            "travelers": travelers
        }, user_id=user_id)
        return {
            "has_past_trips": False,
            "completed_trips": [],
            "base_trip": None,
            "message": "No completed past trips found. Here are trending destinations:",
            "recommendations": std_recs
        }

    base_dest_id = int(base_dest["id"])
    base_name = base_dest["name"]
    base_category = str(base_dest["category"]).lower()
    base_desc = str(base_dest.get("description", "")).lower()
    base_state = str(base_dest.get("state", "")).lower()

    # Extract vibe keywords from base destination
    vibe_keywords = []
    for kw in ["tea", "plantation", "mist", "valley", "hill", "mountain", "waterfall", "caves", 
               "wildlife", "sanctuary", "safari", "trek", "beach", "cliff", "backwaters", 
               "houseboat", "temple", "heritage", "port", "spice"]:
        if kw in base_desc or kw in base_category:
            vibe_keywords.append(kw)

    hotels_df = load_csv("hotels")
    rest_df = load_csv("restaurants")
    attract_df = load_csv("attractions")
    trans_df = load_csv("transportation")

    recs = []
    
    for _, dest in dest_df.iterrows():
        d_id = int(dest["id"])
        d_name = dest["name"]
        d_cat = str(dest["category"]).lower()
        d_desc = str(dest.get("description", "")).lower()
        d_state = str(dest.get("state", "")).lower()

        score = 0
        reasons = []
        is_visited_base = (d_id == base_dest_id)
        
        # 1. Category Similarity (up to 35 pts)
        sim_cat_map = CATEGORY_SIMILARITY.get(base_category, {base_category: 35})
        cat_score = sim_cat_map.get(d_cat, 10)
        score += cat_score
        
        if not is_visited_base:
            if d_cat == base_category:
                reasons.append(f"Similar {dest['category']} destination matching your trip to {base_name}.")
            elif cat_score >= 25:
                reasons.append(f"Offers complementary {dest['category']} vibes similar to {base_name}.")
        
        # 2. Vibe / Keyword similarity (up to 30 pts)
        matched_vibes = [kw for kw in vibe_keywords if kw in d_desc]
        vibe_score = min(30, len(matched_vibes) * 12)
        score += vibe_score
        if matched_vibes and not is_visited_base:
            formatted_vibes = ", ".join(matched_vibes[:3])
            reasons.append(f"Shares key scenic highlights with {base_name}: {formatted_vibes}.")
            
        # 3. Geographical / State proximity (up to 15 pts)
        if d_state == base_state:
            score += 15
            if not is_visited_base:
                reasons.append(f"Located in scenic {dest['state']}, perfect for your next regional journey.")
        else:
            score += 5
            
        # 4. Budget & Hospitality Estimation
        dest_hotels = hotels_df[(hotels_df["destination_id"] == d_id) & (hotels_df["total_rooms"] > 0)]
        avg_hotel_price = dest_hotels["price_per_night"].mean() if not dest_hotels.empty else 1500.0
        
        dest_restaurants = rest_df[rest_df["destination_id"] == d_id]
        avg_meal_price = dest_restaurants["avg_cost"].mean() if not dest_restaurants.empty else 400.0
        
        dest_trans = trans_df[(trans_df["destination_id"] == d_id)]
        avg_trans_fare = dest_trans["fare"].mean() if not dest_trans.empty else 500.0
        
        rooms_needed = max(1, -(-travelers // 2))
        nights = max(1, duration_days - 1)
        est_accommodation = avg_hotel_price * rooms_needed * nights
        est_food = avg_meal_price * travelers * duration_days * 2.0
        est_local_trans = avg_trans_fare * nights * (1 if travelers <= 4 else 2)
        est_sightseeing = 200.0 * travelers * duration_days
        subtotal = est_accommodation + est_food + est_local_trans + est_sightseeing
        est_misc = subtotal * 0.05
        total_est_cost = subtotal + est_misc
        
        score += 20
        
        # --- CRITICAL RULE: PREVENT VISITED DESTINATION FROM BEING FIRST ---
        if is_visited_base:
            # Penalize visited destination so unvisited places like Wayanad or Thekkady rank first
            score = max(20, score - 40)
            reasons = [f"You already completed a trip to {base_name}. Placed here in case you wish to revisit."]
        
        hotels_list = dest_hotels.sort_values(by="rating", ascending=False).head(4).to_dict(orient="records")
        rest_list = dest_restaurants.sort_values(by="rating", ascending=False).head(4).to_dict(orient="records")
        attract_list = attract_df[attract_df["destination_id"] == d_id].head(4).to_dict(orient="records")
        transit_list = dest_trans.head(3).to_dict(orient="records")

        norm_score = min(99, max(40, int(score)))
        
        rec_item = {
            "destination_id": d_id,
            "name": d_name,
            "state": dest["state"],
            "city": dest["city"],
            "category": dest["category"],
            "description": dest["description"],
            "image_url": dest.get("image_url", ""),
            "best_time": dest["best_time"],
            "matching_score": norm_score,
            "is_previous_destination": is_visited_base,
            "similarity_badge": f"Similar to {base_name}" if not is_visited_base else "Previously Visited",
            "based_on_destination": {
                "id": base_dest_id,
                "name": base_name,
                "category": base_dest.get("category", "")
            },
            "reasons": reasons,
            "estimated_cost": {
                "accommodation": round(float(est_accommodation), 2),
                "food": round(float(est_food), 2),
                "local_transport": round(float(est_local_trans), 2),
                "sightseeing": round(float(est_sightseeing), 2),
                "miscellaneous": round(float(est_misc), 2),
                "total": round(float(total_est_cost), 2)
            },
            "hotels": hotels_list,
            "restaurants": rest_list,
            "attractions": attract_list,
            "transportation": transit_list
        }
        recs.append(_to_plain(rec_item))
        
    # Sort so unvisited similar destinations are ranked highest, and previous destination is at the end
    recs = sorted(recs, key=lambda x: (not x["is_previous_destination"], x["matching_score"]), reverse=True)
    
    top_fresh = [r["name"] for r in recs if not r["is_previous_destination"]]
    top_fresh_names = " & ".join(top_fresh[:2]) if len(top_fresh) >= 2 else (top_fresh[0] if top_fresh else "similar destinations")

    vibe_desc = f"Our AI finds similar {base_category} & nature escapes (recommending fresh destinations like {top_fresh_names} first)."

    return {
        "has_past_trips": True,
        "completed_trips": distinct_completed,
        "base_trip": {
            "id": base_trip.get("id") if base_trip else None,
            "destination_id": base_dest_id,
            "destination_name": base_name,
            "travel_date": base_trip.get("travel_date") if base_trip else None,
            "category": base_dest.get("category", ""),
            "state": base_dest.get("state", ""),
            "city": base_dest.get("city", ""),
            "image_url": base_dest.get("image_url", ""),
            "vibe_description": vibe_desc
        },
        "message": f"Recommendations based on your completed trip to {base_name}. Similar places like {top_fresh_names} are recommended first.",
        "recommendations": recs[:5]
    }
