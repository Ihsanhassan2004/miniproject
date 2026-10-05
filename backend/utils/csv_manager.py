import os
import pandas as pd
from backend.config import Config

# Define database schemas for all CSV tables
SCHEMAS = {
    "users.csv": ["id", "name", "email", "password_hash", "phone", "created_at"],
    "admins.csv": ["id", "username", "password_hash"],
    "destinations.csv": ["id", "name", "state", "city", "category", "description", "best_time", "budget_min", "budget_max", "image_url", "local_cities"],
    "attractions.csv": ["id", "destination_id", "name", "description", "entry_fee", "visit_time", "image_url"],
    "hotels.csv": ["id", "destination_id", "name", "hotel_type", "price_per_night", "rating", "address", "total_rooms", "website", "amenities"],
    "restaurants.csv": ["id", "destination_id", "name", "cuisine", "avg_cost", "rating", "address"],
    "transportation.csv": ["id", "destination_id", "transport_type", "source", "destination", "travel_time", "fare", "distance", "availability"],
    "saved_trips.csv": ["id", "user_id", "destination_id", "source_location", "budget", "travelers", "duration_days", "interests", "itinerary_text", "estimated_cost", "travel_date", "status", "created_at"],
    "reviews.csv": ["id", "user_id", "destination_id", "rating", "review", "created_at"],
    "feedback.csv": ["id", "user_id", "feedback", "created_at"],
    "trip_diary.csv": ["id", "user_id", "destination_id", "diary", "photo_path", "rating", "created_at"],
    "complaints.csv": ["id", "user_id", "subject", "description", "category", "priority", "trip_id", "status", "admin_reply", "created_at"],
    "weather_cache.csv": ["id", "destination_id", "temperature", "humidity", "weather", "updated_at"],
    "chatbot_logs.csv": ["id", "user_id", "message", "response", "created_at"],
    "transport_rates.csv": ["id", "transport_type", "category", "base_fare", "per_km_rate", "per_person_rate", "fuel_cost_per_km", "daily_rental", "speed_kmh", "min_distance_km", "max_distance_km", "active", "updated_at"]
}

def get_file_path(filename):
    """Returns the absolute path to the CSV file inside Config.CSV_DATA_DIR."""
    if not filename.endswith(".csv"):
        filename += ".csv"
    return os.path.join(Config.CSV_DATA_DIR, filename)

def init_db():
    """Initializes the CSV database, creating files with schemas if they don't exist."""
    for filename, cols in SCHEMAS.items():
        path = get_file_path(filename)
        if not os.path.exists(path):
            df = pd.DataFrame(columns=cols)
            df.to_csv(path, index=False)
            print(f"Initialized CSV table: {filename}")

def load_csv(filename):
    """Loads a CSV file into a Pandas DataFrame. Initializes it if missing."""
    path = get_file_path(filename)
    if not os.path.exists(path):
        init_db()
    try:
        # Prevent pandas from reading numeric columns with decimals or converting ID formats incorrectly
        df = pd.read_csv(path)
        # Ensure all columns defined in the schema exist in the DataFrame
        schema_cols = SCHEMAS.get(filename if filename.endswith(".csv") else f"{filename}.csv", [])
        for col in schema_cols:
            if col not in df.columns:
                df[col] = ""
        # Ensure correct column types
        int_cols = ["id", "destination_id", "user_id", "total_rooms", "active"]
        for col in int_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
                
        float_cols = ["price_per_night", "avg_cost", "budget_min", "budget_max", "entry_fee", "fare", "distance", "rating", "base_fare", "per_km_rate", "per_person_rate", "fuel_cost_per_km", "daily_rental", "speed_kmh", "min_distance_km", "max_distance_km"]
        for col in float_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0).astype(float)
        # Ensure phone and string columns are strings, not float/int
        str_cols = ["phone", "name", "email", "password_hash", "username", "category", "city", "state", "description", "subject", "message", "response", "feedback", "review", "diary", "photo_path", "admin_reply", "status", "amenities", "website", "transport_type", "source", "destination", "updated_at", "image_url", "local_cities"]
        for col in str_cols:
            if col in df.columns:
                df[col] = df[col].fillna("").astype(str)
                
        return df

    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return pd.DataFrame(columns=SCHEMAS.get(filename, []))

def save_csv(filename, df):
    """Saves a Pandas DataFrame back to its CSV file."""
    path = get_file_path(filename)
    df.to_csv(path, index=False)

def insert_row(filename, row_dict):
    """
    Inserts a single row dictionary into the specified CSV table.
    Automatically assigns an auto-incrementing ID.
    Returns the created record as a dictionary.
    """
    df = load_csv(filename)
    
    # Auto-increment integer ID
    if df.empty or "id" not in df.columns:
        new_id = 1
    else:
        new_id = int(df["id"].max()) + 1 if not pd.isna(df["id"].max()) else 1
        
    row_dict["id"] = new_id
    
    # Create single-row DataFrame
    new_row_df = pd.DataFrame([row_dict])
    
    # Ensure all columns exist in the DataFrame
    for col in df.columns:
        if col not in new_row_df.columns:
            new_row_df[col] = None
            
    # Keep columns order consistent
    new_row_df = new_row_df[df.columns]
    
    df = pd.concat([df, new_row_df], ignore_index=True)
    save_csv(filename, df)
    return row_dict

def update_row(filename, id_val, update_dict):
    """
    Updates a row in the CSV file matching the specified ID.
    Returns True if updated, False otherwise.
    """
    df = load_csv(filename)
    id_val = int(id_val)
    
    idx = df[df["id"] == id_val].index
    if not idx.empty:
        target_idx = idx[0]
        for col, val in update_dict.items():
            if col in df.columns and col != "id":
                if df[col].dtype != "object" and isinstance(val, str):
                    df[col] = df[col].astype(object)
                df.at[target_idx, col] = val
        save_csv(filename, df)
        return True
    return False

def delete_row(filename, id_val):
    """
    Deletes a row from the CSV file matching the specified ID.
    Returns True if deleted, False otherwise.
    """
    df = load_csv(filename)
    id_val = int(id_val)
    
    initial_len = len(df)
    df = df[df["id"] != id_val]
    if len(df) < initial_len:
        save_csv(filename, df)
        return True
    return False

def clean_dict(d):
    """Replaces NaN values in a dictionary with None for JSON compliance."""
    import math
    if d is None:
        return None
    cleaned = {}
    for k, v in d.items():
        if isinstance(v, float) and math.isnan(v):
            cleaned[k] = None
        else:
            cleaned[k] = v
    return cleaned

def clean_records(records):
    """Replaces NaN values in a list of dictionaries with None."""
    return [clean_dict(r) for r in records]

def find_by_id(filename, id_val):
    """Finds a single row by ID. Returns the row as a dictionary, or None."""
    df = load_csv(filename)
    id_val = int(id_val)
    row = df[df["id"] == id_val]
    if not row.empty:
        return clean_dict(row.iloc[0].to_dict())
    return None

def find_by_field(filename, field_name, value):
    """Finds a single row by a matching field. Returns dictionary or None."""
    df = load_csv(filename)
    if isinstance(value, str):
        row = df[df[field_name].astype(str).str.lower() == value.lower()]
    else:
        row = df[df[field_name] == value]
        
    if not row.empty:
        return clean_dict(row.iloc[0].to_dict())
    return None

def filter_rows(filename, filter_dict):
    """
    Filters rows in the CSV file that match all key-value pairs in filter_dict.
    Returns a list of dictionaries.
    """
    df = load_csv(filename)
    for col, val in filter_dict.items():
        if col in df.columns:
            if isinstance(val, str):
                df = df[df[col].astype(str).str.lower() == val.lower()]
            else:
                df = df[df[col] == val]
    return clean_records(df.to_dict(orient="records"))

def search_text(filename, col_name, search_query):
    """
    Searches a column for occurrences of a search query (substring search, case-insensitive).
    """
    df = load_csv(filename)
    if col_name in df.columns:
        filtered_df = df[df[col_name].astype(str).str.lower().str.contains(search_query.lower(), na=False)]
        return clean_records(filtered_df.to_dict(orient="records"))
    return []

# Initialize database schemas
init_db()
