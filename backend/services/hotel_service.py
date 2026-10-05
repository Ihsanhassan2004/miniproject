import pandas as pd
from backend.utils.csv_manager import load_csv, update_row, find_by_id

def get_available_hotels(destination_id):
    """
    Returns all hotels for a destination with total_rooms > 0.
    """
    hotels_df = load_csv("hotels")
    if hotels_df.empty:
        return []
    
    # Filter by destination and valid room capacity
    available_hotels = hotels_df[
        (hotels_df["destination_id"] == int(destination_id)) & 
        (hotels_df["total_rooms"].astype(int) > 0)
    ]
    return available_hotels.to_dict(orient="records")

def book_hotel_room(hotel_id, count=1):
    """
    Records a hotel booking for a trip.
    """
    hotel = find_by_id("hotels", hotel_id)
    if hotel:
        return True
    return False

def release_hotel_room(hotel_id, count=1):
    """
    Releases a hotel booking if cancelled.
    """
    hotel = find_by_id("hotels", hotel_id)
    if hotel:
        return True
    return False
