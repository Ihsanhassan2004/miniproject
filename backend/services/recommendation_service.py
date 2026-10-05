import math

def score_transport_options(options: list, budget: float, travelers: int, preferences: dict = None) -> list:
    """
    Ranks and scores transportation options using deterministic multi-criteria decision analysis (MCDA).
    Computes budget_score, time_score, comfort_score, traveler_score, and convenience_score.
    """
    if not options:
        return []

    travelers = max(1, int(travelers or 1))
    budget = float(budget or 15000.0)
    preferences = preferences or {}

    comfort_pref = str(preferences.get("comfort", "comfortable")).lower()
    style_pref = str(preferences.get("style", preferences.get("sort_by", "balanced"))).lower()
    
    # 1. Determine Dynamic Weights based on traveler preference
    if "cheap" in style_pref or "budget" in style_pref:
        w_budget, w_time, w_comfort, w_conv = 0.50, 0.20, 0.15, 0.15
    elif "fast" in style_pref or "speed" in style_pref:
        w_budget, w_time, w_comfort, w_conv = 0.20, 0.50, 0.15, 0.15
    elif "comfort" in comfort_pref or "luxury" in style_pref or "premium" in style_pref:
        w_budget, w_time, w_comfort, w_conv = 0.15, 0.25, 0.40, 0.20
    elif travelers >= 4:
        w_budget, w_time, w_comfort, w_conv = 0.30, 0.20, 0.25, 0.25
    else:
        w_budget, w_time, w_comfort, w_conv = 0.35, 0.25, 0.20, 0.20

    # Max metrics for normalization
    all_fares = [o.get("total_fare", 1000) for o in options]
    min_fare = min(all_fares) if all_fares else 100
    max_fare = max(all_fares) if all_fares else 5000

    all_durations = [o.get("duration_minutes", 120) for o in options]
    min_dur = min(all_durations) if all_durations else 30
    max_dur = max(all_durations) if all_durations else 360

    # Base comfort mapping
    COMFORT_MAP = {
        "cab": 0.95,
        "flight": 0.90,
        "self_drive": 0.85,
        "taxi": 0.82,
        "train": 0.75,
        "bus": 0.60,
        "bike": 0.50,
        "cycling": 0.45,
        "walking": 0.40
    }

    # Base convenience mapping
    CONV_MAP = {
        "cab": 0.95,       # Doorstep pickup, zero transfer
        "taxi": 0.90,      # Point to point
        "self_drive": 0.85,# Complete route flexibility
        "flight": 0.70,    # Airport transfer and security buffer needed
        "train": 0.72,     # Station transit
        "bus": 0.65,       # Bus stop transit
        "bike": 0.60,      # Luggage constraints
        "cycling": 0.45,
        "walking": 0.40
    }

    scored_options = []
    
    # Estimate reasonable transit budget allocation (approx 20-30% of trip budget)
    target_transit_budget = max(800.0, budget * 0.28)

    for opt in options:
        mode = opt.get("mode", "cab")
        fare = float(opt.get("total_fare", 0.0))
        dur_mins = int(opt.get("duration_minutes", 120))
        dist_km = float(opt.get("distance_km", 20.0))

        # 1. Budget Score (0.0 - 1.0)
        if fare <= target_transit_budget:
            # Within budget target
            budget_score = 1.0 - (0.5 * (fare / target_transit_budget))
        else:
            # Over budget target
            overage_ratio = (fare - target_transit_budget) / max(1.0, budget)
            budget_score = max(0.05, 0.50 - overage_ratio)
        
        # 2. Time Score (0.0 - 1.0)
        if max_dur > min_dur:
            time_score = 1.0 - ((dur_mins - min_dur) / float(max_dur - min_dur)) * 0.8
        else:
            time_score = 0.9

        # 3. Comfort Score
        comfort_score = COMFORT_MAP.get(mode, 0.65)
        if "comfort" in comfort_pref:
            if mode in ["cab", "self_drive", "flight"]:
                comfort_score = min(1.0, comfort_score + 0.08)
            else:
                comfort_score = max(0.2, comfort_score - 0.10)

        # 4. Traveler / Group Synergy Score
        if travelers >= 4:
            if mode in ["cab", "self_drive"]:
                traveler_score = 0.95 # Highly economical for groups
            elif mode in ["bus", "train"]:
                traveler_score = 0.70
            elif mode == "bike":
                traveler_score = 0.20 # Requires multiple bikes
            else:
                traveler_score = 0.60
        elif travelers == 1:
            if mode in ["bus", "train", "bike"]:
                traveler_score = 0.95
            elif mode in ["cab", "self_drive"]:
                traveler_score = 0.60
            else:
                traveler_score = 0.75
        else:
            traveler_score = 0.85

        # 5. Convenience Score
        conv_score = CONV_MAP.get(mode, 0.65)

        # Composite Score (0 - 100)
        raw_score = (
            (budget_score * w_budget) +
            (time_score * w_time) +
            (comfort_score * w_comfort) +
            (conv_score * w_conv)
        )
        total_score_pct = int(round(raw_score * 100))

        # Dynamic Badge Assignment
        badge = opt.get("badge", "Recommended")
        if mode == "bus":
            badge = "Best Budget"
        elif mode == "train":
            badge = "Eco & Reliable"
        elif mode in ["cab", "taxi"] and travelers >= 4:
            badge = "Best for Groups"
        elif mode in ["cab", "taxi"] and ("comfort" in comfort_pref or "luxury" in style_pref):
            badge = "Best for Comfort"
        elif mode == "flight":
            badge = "Fastest Route"
        elif mode == "self_drive":
            badge = "Maximum Freedom"
        elif mode == "bike":
            badge = "Adventure Tour"
        elif mode == "walking":
            badge = "Scenic Promenade"

        # Deterministic personalized reasoning explanation
        if mode == "cab":
            if travelers >= 3:
                reason = f"Excellent group value at ₹{opt.get('fare_per_person')}/person with door-to-door comfort for {travelers} travelers."
            else:
                reason = f"Direct road journey taking ~{opt.get('duration_formatted')} with maximum luggage convenience."
        elif mode == "bus":
            reason = f"Most economical option saving ₹{max(0, int(fare_diff := (all_fares[0] if all_fares else 2000) - fare)):,} on transit budget."
        elif mode == "train":
            reason = f"Comfortable and predictable intercity transit with scenic views across {dist_km} km."
        elif mode == "self_drive":
            reason = f"Offers complete flexibility to stop at viewpoints along the {dist_km} km scenic route."
        elif mode == "bike":
            reason = f"Fun and adventurous two-wheeler ride suitable for the {dist_km} km distance."
        elif mode == "flight":
            reason = f"Saves {max(1, (max_dur - dur_mins)//60)} hours of travel time on long distance route."
        else:
            reason = f"Reliable connection for {opt.get('source')} to {opt.get('destination')}."

        enriched_opt = {
            **opt,
            "score": total_score_pct,
            "badge": badge,
            "personalized_reason": reason,
            "scoring_details": {
                "budget_score": round(budget_score, 2),
                "time_score": round(time_score, 2),
                "comfort_score": round(comfort_score, 2),
                "convenience_score": round(conv_score, 2),
                "weights_used": {
                    "budget": w_budget,
                    "time": w_time,
                    "comfort": w_comfort,
                    "convenience": w_conv
                }
            }
        }
        scored_options.append(enriched_opt)

    # Sort descending by score
    scored_options.sort(key=lambda x: x["score"], reverse=True)
    
    # Set the top 1 as "Best Match"
    if scored_options:
        scored_options[0]["badge"] = "Best Match"
        scored_options[0]["is_top_match"] = True

    return scored_options
