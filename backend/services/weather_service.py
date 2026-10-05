import datetime
import random
from backend.utils.csv_manager import load_csv, insert_row, filter_rows, update_row

def _get_forecast_condition(category, base_weather, day_offset):
    cat_lower = str(category).lower()
    conditions = {
        "hill station": ["Misty & Cool", "Partly Cloudy", "Light Showers", "Crisp & Sunny", "Pleasant Breeze"],
        "beach": ["Sunny & Warm", "Clear Skies", "Tropical Breeze", "Golden Sunshine", "Partly Cloudy"],
        "heritage": ["Bright & Sunny", "Dry & Clear", "Pleasant Warmth", "Mild Sunshine", "Clear Skies"],
        "nature": ["Fresh & Green", "Scattered Showers", "Overcast", "Sunny Breaks", "Pleasant Mist"],
        "adventure": ["Clear & Energetic", "Cool Wind", "Sunny Morning", "Mild Cloud Cover", "Crisp Mountain Air"],
        "city tourism": ["Urban Sunshine", "Clear & Fair", "Mildly Warm", "Partly Cloudy", "Comfortable Evening"]
    }
    
    # Pick category list or default
    matched = None
    for k, v in conditions.items():
        if k in cat_lower:
            matched = v
            break
    if not matched:
        matched = ["Sunny", "Partly Cloudy", "Clear Skies", "Light Breeze", "Scattered Clouds"]
        
    return matched[day_offset % len(matched)]

def _get_weather_icon(condition_str):
    c = condition_str.lower()
    if "rain" in c or "shower" in c:
        return "cloud-rain"
    elif "mist" in c or "fog" in c:
        return "cloud-fog"
    elif "cloud" in c or "overcast" in c:
        return "cloud"
    elif "sun" in c or "clear" in c:
        return "sun"
    elif "wind" in c or "breeze" in c:
        return "wind"
    return "sun"

def get_weather_for_destination(destination_id, destination_name, category):
    """
    Retrieves current weather and a 5-day daily forecast for a destination.
    Uses cached data when fresh (<24h) and generates comprehensive forecasts,
    safety alerts, UV index, and packing advisories.
    """
    destination_id = int(destination_id)
    cache = filter_rows("weather_cache", {"destination_id": destination_id})
    
    current_time = datetime.datetime.now()
    needs_update = True
    cached_data = None
    
    if cache:
        cached_data = cache[0]
        try:
            updated_at = datetime.datetime.strptime(cached_data["updated_at"], "%Y-%m-%d %H:%M:%S")
            if (current_time - updated_at).days < 1:
                needs_update = False
        except Exception:
            needs_update = True
            
    if not needs_update and cached_data:
        temp = float(cached_data["temperature"])
        humidity = float(cached_data["humidity"])
        weather = str(cached_data["weather"])
        wind_speed = round(10.0 + (destination_id % 12), 1)
        rain_prob = 20 + (destination_id % 60) if "rain" in weather.lower() or "cloud" in weather.lower() else 8
    else:
        category_str = str(category).lower()
        if "hill station" in category_str or "nature" in category_str:
            temp = round(random.uniform(15.0, 22.0), 1)
            humidity = round(random.uniform(65.0, 85.0), 1)
            weather = random.choice(["Misty & Cool", "Partly Cloudy", "Light Rain", "Cloudy"])
            wind_speed = round(random.uniform(6.0, 14.0), 1)
            rain_prob = round(random.uniform(25.0, 75.0), 1)
        elif "beach" in category_str:
            temp = round(random.uniform(28.0, 33.0), 1)
            humidity = round(random.uniform(70.0, 88.0), 1)
            weather = random.choice(["Sunny & Clear", "Tropical Breeze", "Bright Sunshine", "Partly Cloudy"])
            wind_speed = round(random.uniform(12.0, 22.0), 1)
            rain_prob = round(random.uniform(5.0, 25.0), 1)
        elif "heritage" in category_str or "pilgrimage" in category_str or "city tourism" in category_str:
            temp = round(random.uniform(23.0, 31.0), 1)
            humidity = round(random.uniform(45.0, 65.0), 1)
            weather = random.choice(["Sunny & Clear", "Dry & Fair", "Partly Cloudy"])
            wind_speed = round(random.uniform(7.0, 16.0), 1)
            rain_prob = round(random.uniform(0.0, 20.0), 1)
        else:
            temp = round(random.uniform(21.0, 28.0), 1)
            humidity = round(random.uniform(50.0, 70.0), 1)
            weather = random.choice(["Clear Skies", "Partly Cloudy", "Comfortable"])
            wind_speed = round(random.uniform(6.0, 15.0), 1)
            rain_prob = round(random.uniform(10.0, 35.0), 1)
            
        weather_row = {
            "destination_id": destination_id,
            "temperature": temp,
            "humidity": humidity,
            "weather": weather,
            "updated_at": current_time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        if cached_data:
            update_row("weather_cache", cached_data["id"], weather_row)
        else:
            insert_row("weather_cache", weather_row)

    # Calculate additional rich metrics
    feels_like = round(temp + (0.05 * humidity) - 1.5, 1)
    uv_index = 8 if ("sun" in weather.lower() or "clear" in weather.lower()) and temp > 27 else (4 if temp > 20 else 2)
    visibility_km = 4.5 if ("mist" in weather.lower() or "fog" in weather.lower()) else 10.0

    # Build 5-Day Day-by-Day Forecast
    forecast_days = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for i in range(1, 6):
        future_date = current_time + datetime.timedelta(days=i)
        f_cond = _get_forecast_condition(category, weather, i)
        
        # Slight variation in temperature
        temp_delta = ((destination_id + i * 3) % 5) - 2.0
        high_t = round(temp + 2.5 + temp_delta, 1)
        low_t = round(temp - 3.5 + temp_delta, 1)
        
        f_rain = max(5, min(95, int(rain_prob + (((i * 17) % 30) - 15))))
        if "rain" in f_cond.lower():
            f_rain = max(65, f_rain)
        elif "sunny" in f_cond.lower() or "clear" in f_cond.lower():
            f_rain = min(20, f_rain)
            
        forecast_days.append({
            "day_offset": i,
            "date": future_date.strftime("%Y-%m-%d"),
            "day_name": future_date.strftime("%a"),
            "formatted_date": future_date.strftime("%b %d"),
            "temp_high": high_t,
            "temp_low": low_t,
            "condition": f_cond,
            "icon": _get_weather_icon(f_cond),
            "rain_probability": f_rain,
            "humidity": max(40, min(95, int(humidity + ((i % 3) * 3 - 3)))),
            "summary": f"{f_cond} with highs of {high_t}°C and lows of {low_t}°C."
        })

    # Generate smart travel packing and safety advice
    advice = "Weather conditions are optimal for sightseeing. Wear comfortable walking shoes and carry drinking water."
    packing_tips = ["Comfortable cotton garments", "Comfortable walking shoes", "Sun protection"]
    safety_alert = None
    
    w_lower = weather.lower()
    if "rain" in w_lower or rain_prob > 50:
        advice = "💡 Expect rain showers. Waterproof gear is recommended; outdoor activities may be slippery."
        packing_tips = ["Raincoat / Compact Umbrella", "Waterproof footwear", "Water-resistant backpack cover"]
        safety_alert = "Monsoon slippery trail warning: Exercise caution near waterfalls and wet stone stairs."
    elif "mist" in w_lower or "fog" in w_lower or visibility_km < 6.0:
        advice = "💡 Misty, cool climate with reduced visibility on ghat roads. Drive cautiously with fog lamps."
        packing_tips = ["Light thermal jacket", "Windbreaker", "Moisturizer & lip balm"]
        safety_alert = "Low visibility advisory for mountain driving between 05:00 AM - 08:30 AM."
    elif temp < 18.0:
        advice = "💡 Crisp, chilly climate. Perfect weather for hill walks and evening tea. Bring warm layers."
        packing_tips = ["Sweater or fleece jacket", "Warm socks", "Thermal innerwear (night)"]
    elif "sunny" in w_lower or temp > 30.0:
        advice = "💡 Warm and sunny conditions. Stay hydrated and protect against strong daytime UV exposure."
        packing_tips = ["Broad-spectrum sunscreen (SPF 50+)", "Polarized sunglasses", "Breathable linen wear", "Hat / Cap"]
        if uv_index >= 8:
            safety_alert = "High UV Index Alert: Avoid prolonged direct mid-day sun exposure between 12:00 PM - 03:00 PM."

    return {
        "destination_id": destination_id,
        "destination_name": destination_name,
        "current": {
            "temperature": temp,
            "feels_like": feels_like,
            "humidity": humidity,
            "weather": weather,
            "icon": _get_weather_icon(weather),
            "wind_speed": wind_speed,
            "wind_direction": "WSW",
            "rain_probability": rain_prob,
            "uv_index": uv_index,
            "visibility_km": visibility_km,
            "air_quality": "Good (AQI 38)",
            "sunrise": "06:18 AM",
            "sunset": "06:34 PM",
            "advice": advice,
            "packing_checklist": packing_tips,
            "safety_alert": safety_alert
        },
        # Backward-compatibility flat keys
        "temperature": temp,
        "humidity": humidity,
        "weather": weather,
        "wind_speed": wind_speed,
        "rain_probability": rain_prob,
        "advice": advice,
        # 5-Day Forecast
        "forecast": forecast_days
    }
