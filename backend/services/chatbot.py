import re
import pandas as pd
from backend.utils.csv_manager import load_csv, find_by_id
from backend.services.weather_service import get_weather_for_destination
from backend.services.transport_service import get_transport_recommendations
from backend.services.cost_estimator import estimate_trip_cost
from backend.services.itinerary_generator import generate_itinerary

def respond_to_query(user_message, user_id=None):
    """
    Analyzes the user_message using multi-domain NLP and keyword matching,
    querying live destination data, weather forecasts, transport schedules,
    cost estimates, itineraries, and accommodations.
    
    Returns a dict:
      {
        "response": "<markdown formatted response>",
        "suggestions": ["<prompt1>", "<prompt2>", ...],
        "action": { ... } or None
      }
    """
    raw_message = str(user_message or "").strip()
    message = raw_message.lower()
    
    if not message:
        return {
            "response": "Hello! I am your AI Travel Assistant. How can I assist you with your travels today?",
            "suggestions": ["Suggest hill stations", "Weekend trips under ₹15,000", "Weather in Munnar", "3-Day plan for Munnar"],
            "action": None
        }

    # Load databases
    dest_df = load_csv("destinations")
    hotels_df = load_csv("hotels")
    rest_df = load_csv("restaurants")
    attract_df = load_csv("attractions")
    
    # 1. MATCH DESTINATION
    mentioned_dest = None
    dest_row = None
    dest_id = None
    
    if not dest_df.empty:
        # Sort by length descending to match longer names first
        for _, row in dest_df.sort_values(by="name", key=lambda x: x.str.len(), ascending=False).iterrows():
            name = str(row["name"]).strip().lower()
            if name in message or (len(name) > 3 and name in message.replace(" ", "")):
                mentioned_dest = row["name"]
                dest_row = row
                dest_id = int(row["id"])
                break

    # Extract numbers (e.g., budget, days, travelers)
    days_match = re.search(r'(\d+)\s*(?:days?|day|nights?|night)', message)
    duration_days = int(days_match.group(1)) if days_match else 3

    travelers_match = re.search(r'(\d+)\s*(?:people|persons?|travelers?|friends?|members?|adults?)', message)
    travelers_count = int(travelers_match.group(1)) if travelers_match else (2 if "couple" in message else 1)

    price_match = re.search(r'(?:under|below|budget|less than|rs\.?|₹|\binr)\s*[:=]?\s*(\d{4,6})', message)
    budget_value = float(price_match.group(1)) if price_match else None

    # ─────────────────────────────────────────────────────────
    # 1. GREETINGS & INTRODUCTIONS
    # ─────────────────────────────────────────────────────────
    if any(greet in message.split() for greet in ["hi", "hello", "hey", "hola", "greetings", "yo", "morning", "afternoon", "evening"]):
        return {
            "response": (
                "👋 **Hello! I'm Aura, your AI Travel Copilot.**\n\n"
                "I can help you build custom vacations, check real-time weather & packing checklists, "
                "find the best transport routes, estimate exact itemized trip costs, and discover top-rated stays & cuisine.\n\n"
                "**What would you like to explore today?**"
            ),
            "suggestions": [
                "Suggest trips under ₹15,000",
                "Weather in Munnar",
                "3-Day plan for Munnar",
                "Houseboats in Alleppey",
                "Best hill stations in India"
            ],
            "action": None
        }

    # ─────────────────────────────────────────────────────────
    # 2. EMERGENCY CONTACTS & DISPUTES
    # ─────────────────────────────────────────────────────────
    if any(keyword in message for keyword in ["emergency", "hospital", "police", "ambulance", "sos", "helpline", "security", "accident"]):
        return {
            "response": (
                "🚨 **Emergency & Traveler Support Hotlines** 🚨\n\n"
                "• **National Emergency All-in-One**: `112`\n"
                "• **Police Assistance**: `100`\n"
                "• **Ambulance & Medical**: `102` / `108`\n"
                "• **Tourist Support Helpline**: `1800-11-1363` *(Toll-Free, 24x7 Multi-lingual)*\n"
                "• **Women Helpline**: `1091`\n\n"
                "ℹ️ If you have encountered a booking, hotel, or transit dispute, you can instantly lodge a ticket in the **[Support & Complaints](/support)** center."
            ),
            "suggestions": ["Go to Support Center", "Emergency contacts for Munnar", "Suggest places under ₹15,000"],
            "action": {"type": "NAVIGATE", "url": "/support", "label": "Open Support Center"}
        }

    # ─────────────────────────────────────────────────────────
    # 3. ITINERARY GENERATION & DAY-WISE PLANS
    # ─────────────────────────────────────────────────────────
    if any(keyword in message for keyword in ["itinerary", "day plan", "schedule", "day-by-day", "plan for", "days in", "what to do in"]):
        if mentioned_dest:
            group_type = "couple" if "couple" in message or "honeymoon" in message else ("friends" if "friends" in message else "family")
            days_list = generate_itinerary(dest_id, duration_days=duration_days, group_type=group_type)
            
            day_sections = []
            for day in (days_list if isinstance(days_list, list) else [])[:3]:
                day_num = day.get("day", day.get("day_number", 1))
                theme = day.get("title", day.get("day_theme", "Exploration"))
                slots = day.get("slots", [])
                acts = []
                for s in slots[:3]:
                    acts.append(f"  • **{s.get('time', s.get('time_slot', ''))}**: {s.get('activity', s.get('title', ''))}")
                if not acts:
                    if day.get("morning"):
                        acts.append(f"  • **Morning**: {day.get('morning', {}).get('title', 'Sightseeing')}")
                    if day.get("afternoon"):
                        acts.append(f"  • **Afternoon**: {day.get('afternoon', {}).get('title', 'Excursion')}")
                    if day.get("evening"):
                        acts.append(f"  • **Evening**: {day.get('evening', {}).get('title', 'Sunset View')}")
                day_sections.append(f"📅 **Day {day_num}: {theme}**\n" + "\n".join(acts))
                
            response_text = (
                f"🗺️ **Personalized {duration_days}-Day Itinerary for {mentioned_dest}**\n\n"
                f"*Pacing: Tailored for {group_type.capitalize()} Travel*\n\n"
                + "\n\n".join(day_sections)
            )
            return {
                "response": response_text,
                "suggestions": [
                    f"Cost estimate for {mentioned_dest}",
                    f"Weather in {mentioned_dest}",
                    f"Transport to {mentioned_dest}",
                    f"Hotels in {mentioned_dest}"
                ],
                "action": {
                    "type": "PLAN_TRIP",
                    "url": f"/plan-trip?destination={mentioned_dest}",
                    "label": f"Customize Itinerary for {mentioned_dest}"
                }
            }
        else:
            return {
                "response": "Which destination would you like an itinerary for? For example: *'Give me a 3-day itinerary for Munnar'* or *'2-day plan for Goa with friends'*.",
                "suggestions": ["3-day plan for Munnar", "4-day itinerary for Goa", "2-day plan for Manali", "3-day plan for Wayanad"],
                "action": None
            }

    # ─────────────────────────────────────────────────────────
    # 4. WEATHER & PACKING CHECKLISTS
    # ─────────────────────────────────────────────────────────
    if any(keyword in message for keyword in ["weather", "temperature", "forecast", "climate", "rain", "pack", "packing", "clothes", "luggage"]):
        if mentioned_dest:
            weather_data = get_weather_for_destination(dest_id, mentioned_dest, dest_row["category"])
            current = weather_data.get("current", {})
            forecast = weather_data.get("forecast", [])
            packing = current.get("packing_checklist", ["Comfortable clothes", "Walking shoes", "Power bank", "Umbrella"])
            safety_alert = current.get("safety_alert", "")
            
            if any(p_word in message for p_word in ["pack", "packing", "clothes", "luggage", "carry"]):
                packing_bullets = "\n".join([f"• {item}" for item in packing])
                advisory = f"\n\n**Safety Advisory:** {safety_alert}" if safety_alert else ""
                response_text = (
                    f"🧳 **Packing Checklist for {mentioned_dest}** ({dest_row['category']})\n\n"
                    f"**Current Atmosphere:** {current.get('temperature', 24)}°C, {current.get('weather', 'Pleasant')} | Humidity: {current.get('humidity', '65%')}%\n\n"
                    f"**Recommended Gear & Clothing:**\n{packing_bullets}"
                    f"{advisory}"
                )
            else:
                forecast_lines = []
                for d in forecast[:4]:
                    forecast_lines.append(f"• **{d.get('day_name', '')} ({d.get('formatted_date', '')})**: {d.get('condition', '')} | High: {d.get('temp_high', '')}°C / Low: {d.get('temp_low', '')}°C (🌧️ Rain: {d.get('rain_probability', '10%')}%)")
                
                response_text = (
                    f"☀️ **Weather Forecast for {mentioned_dest}**\n\n"
                    f"• **Current Temperature:** {current.get('temperature', 24)}°C (Feels like {current.get('feels_like', 24)}°C)\n"
                    f"• **Condition:** {current.get('weather', 'Clear & Pleasant')}\n"
                    f"• **Humidity & Wind:** {current.get('humidity', '60%')}% | {current.get('wind_speed', '12')} km/h\n"
                    f"• **Air Quality:** {current.get('air_quality', 'Good (AQI 38)')} | UV Index: {current.get('uv_index', '2')}\n\n"
                    f"**4-Day Outlook:**\n" + "\n".join(forecast_lines) +
                    f"\n\n🗓️ **Best Season to Visit:** {dest_row.get('best_time', 'October - March')}"
                )
                
            return {
                "response": response_text,
                "suggestions": [
                    f"What to pack for {mentioned_dest}",
                    f"Transport options for {mentioned_dest}",
                    f"Hotels in {mentioned_dest}",
                    f"Estimate cost for {mentioned_dest}"
                ],
                "action": None
            }
        else:
            return {
                "response": "Please mention the destination name for weather details or packing advice (e.g. *'Weather in Munnar'* or *'Packing tips for Goa'*).",
                "suggestions": ["Weather in Munnar", "Packing tips for Goa", "Weather in Manali", "Climate in Wayanad"],
                "action": None
            }

    # ─────────────────────────────────────────────────────────
    # 5. TRANSPORTATION & TRANSIT OPTIONS
    # ─────────────────────────────────────────────────────────
    if any(keyword in message for keyword in ["transport", "transit", "reach", "travel to", "how to get to", "train", "bus", "flight", "cab", "taxi", "drive", "route"]):
        if mentioned_dest:
            options = get_transport_recommendations(dest_id, travelers=travelers_count, sort_by="cheapest")
            
            if options and isinstance(options, list):
                opt_lines = []
                for opt in options[:3]:
                    opt_lines.append(
                        f"🚗 **{opt.get('category', 'Transit')}** — *{opt.get('badge', '')}*\n"
                        f"   • Mode: {opt.get('transport_type', '')} ({opt.get('route', '')})\n"
                        f"   • Fare: ₹{int(opt.get('total_fare_for_group', opt.get('fare', 0))):,} total (₹{int(opt.get('fare_per_person', opt.get('fare', 0))):,}/person for {travelers_count} travelers)\n"
                        f"   • Duration: {opt.get('duration', 'N/A')} (~{opt.get('distance_km', 'N/A')} km)"
                    )
                response_text = (
                    f"🛣️ **Recommended Transportation Options to {mentioned_dest}**\n\n"
                    + "\n\n".join(opt_lines) +
                    f"\n\n💡 *Note: Fares calculated for {travelers_count} traveler(s).*"
                )
                return {
                    "response": response_text,
                    "suggestions": [
                        f"Cost estimate for {mentioned_dest}",
                        f"Hotels in {mentioned_dest}",
                        f"3-Day plan for {mentioned_dest}",
                        f"Weather in {mentioned_dest}"
                    ],
                    "action": {
                        "type": "VIEW_DESTINATION",
                        "url": f"/destinations/{dest_id}",
                        "label": f"Explore {mentioned_dest} Transport Details"
                    }
                }
            else:
                return {
                    "response": f"Direct transit schedules for **{mentioned_dest}** are currently being mapped. State transport buses and private tourist cabs are easily available from the nearest major hub.",
                    "suggestions": [f"Hotels in {mentioned_dest}", f"Weather in {mentioned_dest}"],
                    "action": None
                }
        else:
            return {
                "response": "Which destination do you need travel routes and fares for? (e.g. *'How to reach Munnar?'* or *'Cheapest transport to Goa'*).",
                "suggestions": ["How to reach Munnar?", "Transport to Goa", "Transit to Manali", "How to get to Wayanad?"],
                "action": None
            }

    # ─────────────────────────────────────────────────────────
    # 6. ESTIMATE TRIP COST & BUDGET BREAKDOWNS
    # ─────────────────────────────────────────────────────────
    if any(keyword in message for keyword in ["cost", "estimate", "expense", "budget breakdown", "how much", "price estimate", "total price"]):
        if mentioned_dest:
            cost_result = estimate_trip_cost(
                dest_id,
                travelers=travelers_count,
                duration_days=duration_days,
                user_budget=budget_value
            )
            itemized = cost_result.get("itemized_details", {})
            
            response_text = (
                f"💰 **Itemized Trip Cost Estimate for {mentioned_dest}**\n\n"
                f"• **Duration & Travelers:** {duration_days} Days / {duration_days-1} Nights ({travelers_count} Traveler{'s' if travelers_count > 1 else ''})\n"
                f"• 🏨 **Accommodation:** ₹{int(cost_result.get('accommodation', 0)):,} *({itemized.get('accommodation', {}).get('details', '')})*\n"
                f"• 🍽️ **Food & Dining:** ₹{int(cost_result.get('food', 0)):,} *({itemized.get('food', {}).get('details', '')})*\n"
                f"• 🚗 **Local Transit:** ₹{int(cost_result.get('local_transport', 0)):,} *({itemized.get('transport', {}).get('details', '')})*\n"
                f"• 🎟️ **Sightseeing & Entry:** ₹{int(cost_result.get('sightseeing', 0)):,} *({itemized.get('sightseeing', {}).get('details', '')})*\n"
                f"• 🛡️ **Emergency Buffer:** ₹{int(cost_result.get('miscellaneous', 0)):,}\n\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"💳 **Estimated Total Cost: ₹{int(cost_result.get('total', 0)):,}**\n"
                f"👤 **Per Person Cost: ₹{int(cost_result.get('per_person', 0)):,}**\n"
                f"📊 **Daily Average Burn Rate: ₹{int(cost_result.get('daily_average', 0)):,}/day**\n\n"
                f"💡 *Savings Tip:* {cost_result.get('saving_tips', ['Book accommodation in advance for off-peak deals.'])[0]}"
            )
            return {
                "response": response_text,
                "suggestions": [
                    f"3-Day plan for {mentioned_dest}",
                    f"Hotels in {mentioned_dest}",
                    f"Weather in {mentioned_dest}",
                    f"Transport to {mentioned_dest}"
                ],
                "action": {
                    "type": "PLAN_TRIP",
                    "url": f"/plan-trip?destination={mentioned_dest}",
                    "label": f"Book/Save Trip to {mentioned_dest}"
                }
            }
        else:
            return {
                "response": "Please specify the destination, number of days, and travelers to estimate your trip cost! (e.g. *'Estimate cost for 2 people in Munnar for 3 days'*).",
                "suggestions": [
                    "Cost for 2 people in Munnar for 3 days",
                    "Cost for 4 people in Goa for 4 days",
                    "Cost for Manali trip for 3 days",
                    "Cost for Wayanad for 2 days"
                ],
                "action": None
            }

    # ─────────────────────────────────────────────────────────
    # 7. BUDGET DESTINATIONS & CATEGORY BROWSING
    # ─────────────────────────────────────────────────────────
    if budget_value or any(b_kw in message for b_kw in ["budget", "under", "cheap", "affordable", "places under"]):
        target_budget = budget_value if budget_value else 15000.0
        if not dest_df.empty:
            matches = dest_df[dest_df["budget_min"].astype(float) <= target_budget]
            if not matches.empty:
                dest_list = []
                for _, row in matches.head(4).iterrows():
                    dest_list.append(
                        f"• 🌟 **{row['name']}** ({row['category']}) — Range: ₹{int(row['budget_min']):,} to ₹{int(row['budget_max']):,}\n"
                        f"   *Best time: {row['best_time']} | Rating: {row.get('rating', '4.7')}⭐*"
                    )
                response = (
                    f"✨ **Recommended Destinations for Budget ~₹{int(target_budget):,}**:\n\n"
                    + "\n\n".join(dest_list) +
                    f"\n\nWould you like an itemized cost estimate or day-wise itinerary for any of these places?"
                )
                first_name = matches.iloc[0]["name"]
                return {
                    "response": response,
                    "suggestions": [
                        f"Itinerary for {first_name}",
                        f"Cost estimate for {first_name}",
                        f"Weather in {first_name}",
                        "Suggest hill stations"
                    ],
                    "action": None
                }
            else:
                return {
                    "response": f"We couldn't find destinations under ₹{int(target_budget):,}. Try increasing the budget to ₹12,000–₹25,000 to unlock exciting hill stations and coastal getaways!",
                    "suggestions": ["Places under ₹15,000", "Places under ₹25,000", "Top hill stations"],
                    "action": None
                }

    # Category vibes: Hill station, Beach, Heritage, Adventure, Wildlife
    for cat_key in ["hill station", "beach", "heritage", "adventure", "wildlife", "nature", "backwater"]:
        if cat_key in message:
            matches = dest_df[dest_df["category"].str.lower().str.contains(cat_key, na=False)]
            if not matches.empty:
                items = []
                for _, row in matches.head(4).iterrows():
                    items.append(f"• **{row['name']}** — ₹{int(row['budget_min']):,} - ₹{int(row['budget_max']):,} *(Best Time: {row['best_time']})*")
                return {
                    "response": f"🏔️ **Top {cat_key.title()} Getaways in India**:\n\n" + "\n".join(items) + "\n\nClick any below to get an instant day-wise itinerary or weather advisory!",
                    "suggestions": [f"Itinerary for {matches.iloc[0]['name']}", f"Weather in {matches.iloc[0]['name']}", f"Cost for {matches.iloc[0]['name']}"],
                    "action": None
                }

    # ─────────────────────────────────────────────────────────
    # 8. HOTELS & ACCOMMODATIONS
    # ─────────────────────────────────────────────────────────
    if any(keyword in message for keyword in ["hotel", "stay", "resort", "room", "accommodation", "homestay", "hostel"]):
        if mentioned_dest:
            dest_hotels = hotels_df[(hotels_df["destination_id"] == dest_id) & (hotels_df["total_rooms"] > 0)]
            if not dest_hotels.empty:
                hotel_list = []
                for _, h in dest_hotels.head(3).iterrows():
                    website_str = str(h.get("website", "")).strip() if pd.notna(h.get("website")) else ""
                    website_md = f" | [🌐 Official Website]({website_str})" if website_str else ""
                    hotel_list.append(
                        f"🏨 **{h['name']}** ({h.get('hotel_type', 'Standard')})\n"
                        f"   • Price: ₹{int(h['price_per_night']):,}/night | Rating: {h.get('rating', '4.5')}⭐{website_md}\n"
                        f"   • Address: {h.get('address', 'Town Central')}\n"
                        f"   • Amenities: {h.get('amenities', 'Wi-Fi, AC, Parking')}"
                    )
                return {
                    "response": f"🛌 **Top Rated Stays in {mentioned_dest}**:\n\n" + "\n\n".join(hotel_list),
                    "suggestions": [
                        f"Cost estimate for {mentioned_dest}",
                        f"Restaurants in {mentioned_dest}",
                        f"3-Day plan for {mentioned_dest}",
                        f"Weather in {mentioned_dest}"
                    ],
                    "action": {
                        "type": "VIEW_DESTINATION",
                        "url": f"/destinations/{dest_id}",
                        "label": f"View All Hotels in {mentioned_dest}"
                    }
                }
            else:
                return {
                    "response": f"We are currently updating our partner hotels catalog for **{mentioned_dest}**. Verified homestays and resorts are available near the town center.",
                    "suggestions": [f"Attractions in {mentioned_dest}", f"Weather in {mentioned_dest}"],
                    "action": None
                }
        else:
            return {
                "response": "Which destination do you need accommodations for? (e.g. *'Hotels in Munnar'* or *'Resorts in Goa'*).",
                "suggestions": ["Hotels in Munnar", "Resorts in Goa", "Hotels in Wayanad", "Stays in Manali"],
                "action": None
            }

    # ─────────────────────────────────────────────────────────
    # 9. RESTAURANTS & CUISINE
    # ─────────────────────────────────────────────────────────
    if any(keyword in message for keyword in ["restaurant", "food", "eat", "dining", "cuisine", "cafe", "dinner", "lunch"]):
        if mentioned_dest:
            dest_rests = rest_df[rest_df["destination_id"] == dest_id]
            if not dest_rests.empty:
                rest_list = []
                for _, r in dest_rests.head(3).iterrows():
                    rest_list.append(
                        f"🍽️ **{r['name']}** — Cuisine: {r['cuisine']}\n"
                        f"   • Average Cost: ₹{int(r['avg_cost']):,} per meal | Rating: {r.get('rating', '4.5')}⭐\n"
                        f"   • *Address: {r.get('address', 'Local Market Area')}*"
                    )
                return {
                    "response": f"🍴 **Top Dining & Food Spots in {mentioned_dest}**:\n\n" + "\n\n".join(rest_list),
                    "suggestions": [
                        f"Attractions in {mentioned_dest}",
                        f"Hotels in {mentioned_dest}",
                        f"3-Day plan for {mentioned_dest}"
                    ],
                    "action": None
                }
            else:
                return {
                    "response": f"There are numerous local dining spots in **{mentioned_dest}** serving authentic regional delicacies around the central bazaar!",
                    "suggestions": [f"Hotels in {mentioned_dest}", f"Attractions in {mentioned_dest}"],
                    "action": None
                }
        else:
            return {
                "response": "Which destination would you like dining recommendations for? (e.g. *'Restaurants in Goa'* or *'Where to eat in Munnar'*).",
                "suggestions": ["Restaurants in Goa", "Food spots in Munnar", "Cuisine in Wayanad", "Where to eat in Manali"],
                "action": None
            }

    # ─────────────────────────────────────────────────────────
    # 10. SIGHTSEEING & ATTRACTIONS
    # ─────────────────────────────────────────────────────────
    if any(keyword in message for keyword in ["attraction", "sightseeing", "places to see", "visit", "tourist", "spot", "monument", "things to do"]):
        if mentioned_dest:
            dest_attracts = attract_df[attract_df["destination_id"] == dest_id]
            if not dest_attracts.empty:
                att_list = []
                for _, a in dest_attracts.head(4).iterrows():
                    att_list.append(
                        f"📍 **{a['name']}** — {a.get('description', '')}\n"
                        f"   • Entry Fee: ₹{int(a.get('entry_fee', 0)):,} | Recommended Duration: {a.get('visit_time', '2 hours')}"
                    )
                return {
                    "response": f"🏞️ **Must-Visit Attractions in {mentioned_dest}**:\n\n" + "\n\n".join(att_list),
                    "suggestions": [
                        f"3-Day plan for {mentioned_dest}",
                        f"Cost estimate for {mentioned_dest}",
                        f"Hotels in {mentioned_dest}",
                        f"Weather in {mentioned_dest}"
                    ],
                    "action": {
                        "type": "VIEW_DESTINATION",
                        "url": f"/destinations/{dest_id}",
                        "label": f"Explore {mentioned_dest} Guide"
                    }
                }
            else:
                return {
                    "response": f"**{mentioned_dest}** features scenic viewpoints, local walking trails, and cultural hubs throughout the region!",
                    "suggestions": [f"Weather in {mentioned_dest}", f"Hotels in {mentioned_dest}"],
                    "action": None
                }
        else:
            return {
                "response": "Which destination's attractions would you like to explore? (e.g. *'Attractions in Munnar'* or *'Things to do in Wayanad'*).",
                "suggestions": ["Attractions in Munnar", "Things to do in Goa", "Sightseeing in Manali", "Places to see in Wayanad"],
                "action": None
            }

    # ─────────────────────────────────────────────────────────
    # 11. GENERAL DESTINATION OVERVIEW (If user just names a place)
    # ─────────────────────────────────────────────────────────
    if mentioned_dest:
        return {
            "response": (
                f"📍 **{mentioned_dest}** ({dest_row['category']})\n\n"
                f"{dest_row.get('description', 'A marvelous travel destination.')}\n\n"
                f"• 🗓️ **Best Time to Visit:** {dest_row.get('best_time', 'All year round')}\n"
                f"• 💰 **Estimated Budget Range:** ₹{int(dest_row.get('budget_min', 8000)):,} to ₹{int(dest_row.get('budget_max', 20000)):,}\n"
                f"• ⭐ **Traveler Rating:** {dest_row.get('rating', '4.8')} / 5.0\n\n"
                f"What would you like to plan for **{mentioned_dest}**?"
            ),
            "suggestions": [
                f"3-Day itinerary for {mentioned_dest}",
                f"Cost estimate for {mentioned_dest}",
                f"Weather in {mentioned_dest}",
                f"Transport to {mentioned_dest}",
                f"Hotels in {mentioned_dest}"
            ],
            "action": {
                "type": "VIEW_DESTINATION",
                "url": f"/destinations/{dest_id}",
                "label": f"View {mentioned_dest} Details"
            }
        }

    # ─────────────────────────────────────────────────────────
    # 12. FALLBACK SMART ASSISTANCE
    # ─────────────────────────────────────────────────────────
    return {
        "response": (
            "I'm here to help you plan your journey! You can ask me about:\n\n"
            "• 🏔️ **Destinations & Budgets**: *'Suggest places under ₹15,000'* or *'Best hill stations in India'*\n"
            "• ☀️ **Weather & Packing**: *'Weather in Munnar'* or *'What should I pack for Goa?'*\n"
            "• 🚗 **Transit Routes & Fares**: *'How to reach Wayanad?'* or *'Cheapest cab to Manali'*\n"
            "• 💰 **Trip Cost Calculations**: *'Estimate cost for 3 people in Munnar for 3 days'*\n"
            "• 🗺️ **Personalized Itineraries**: *'Give me a 3-day itinerary for Goa with friends'*\n"
            "• 🏨 **Hotels & Dining**: *'Hotels in Munnar'* or *'Top restaurants in Kochi'*"
        ),
        "suggestions": [
            "Places under ₹15,000",
            "3-Day plan for Munnar",
            "Weather in Goa",
            "How to reach Manali?",
            "Hotels in Wayanad"
        ],
        "action": None
    }
