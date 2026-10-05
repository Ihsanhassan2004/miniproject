import os
import pandas as pd
from backend.utils.csv_manager import load_csv, insert_row, save_csv
from backend.utils.auth import hash_password

def seed_all_data():
    """
    Seeds initial data into CSV files if they are currently empty.
    """
    # 1. Seed Admin
    admin_df = load_csv("admins")
    if admin_df.empty:
        admin_row = {
            "username": "admin",
            "password_hash": hash_password("admin123")
        }
        insert_row("admins", admin_row)
        print("Seeded admin account: admin / admin123")

    # 2. Seed Destinations
    dest_df = load_csv("destinations")
    if dest_df.empty:
        destinations = [
            {
                "id": 1,
                "name": "Munnar",
                "state": "Kerala",
                "city": "Munnar",
                "category": "hill station",
                "description": "Breathtaking hill station famous for its lush green tea plantations, misty valleys, and winding roads.",
                "best_time": "September to May",
                "budget_min": 8000,
                "budget_max": 25000,
                "image_url": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80"
            },
            {
                "id": 2,
                "name": "Wayanad",
                "state": "Kerala",
                "city": "Kalpetta",
                "category": "nature",
                "description": "Spiced plantation town featuring waterfalls, prehistoric caves, and rich wildlife sanctuaries.",
                "best_time": "October to May",
                "budget_min": 7000,
                "budget_max": 20000,
                "image_url": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
            },
            {
                "id": 3,
                "name": "Alleppey",
                "state": "Kerala",
                "city": "Alappuzha",
                "category": "beach",
                "description": "Venice of the East, renowned for its houseboat cruises through tranquil backwaters and canals.",
                "best_time": "November to February",
                "budget_min": 9000,
                "budget_max": 30000,
                "image_url": "https://images.unsplash.com/photo-1582299863777-6ef7093259cc?auto=format&fit=crop&w=800&q=80"
            },
            {
                "id": 4,
                "name": "Varkala",
                "state": "Kerala",
                "city": "Varkala",
                "category": "beach",
                "description": "Coastal town featuring unique red-cliff beaches, surfing, and the ancient Janardanaswamy Temple.",
                "best_time": "October to March",
                "budget_min": 6000,
                "budget_max": 18000,
                "image_url": "https://images.unsplash.com/photo-1590050752117-238cb061295a?auto=format&fit=crop&w=800&q=80"
            },
            {
                "id": 5,
                "name": "Kochi",
                "state": "Kerala",
                "city": "Kochi",
                "category": "city tourism",
                "description": "Historic spice port showcasing Chinese fishing nets, colonial architecture, and dynamic city life.",
                "best_time": "October to April",
                "budget_min": 5000,
                "budget_max": 20000,
                "image_url": "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80"
            },
            {
                "id": 6,
                "name": "Athirappilly",
                "state": "Kerala",
                "city": "Chalakkudy",
                "category": "nature",
                "description": "The Niagara of India, famous for its grand, roaring waterfalls and lush rainforest views.",
                "best_time": "June to November",
                "budget_min": 6000,
                "budget_max": 15000,
                "image_url": "https://images.unsplash.com/photo-1626244675549-06ccb31b3e34?auto=format&fit=crop&w=800&q=80"
            },
            {
                "id": 7,
                "name": "Thekkady",
                "state": "Kerala",
                "city": "Kumily",
                "category": "adventure",
                "description": "Home to the Periyar National Park, offering jungle treks, bamboo rafting, and spice plantations.",
                "best_time": "October to March",
                "budget_min": 8000,
                "budget_max": 22000,
                "image_url": "https://images.unsplash.com/photo-1616388969587-8196f32388b4?auto=format&fit=crop&w=800&q=80"
            },
            {
                "id": 8,
                "name": "Kovalam",
                "state": "Kerala",
                "city": "Kovalam",
                "category": "honeymoon",
                "description": "Romantic coastal resort town famous for its crescent beaches, lighthouse, and premium wellness spas.",
                "best_time": "November to February",
                "budget_min": 10000,
                "budget_max": 35000,
                "image_url": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80"
            }
        ]
        
        # Save directly
        df = pd.DataFrame(destinations)
        save_csv("destinations", df)
        print("Seeded destinations")

    # 3. Seed Attractions
    attr_df = load_csv("attractions")
    if attr_df.empty:
        attractions = [
            # Munnar
            {"destination_id": 1, "name": "Eravikulam National Park", "description": "Home of the endangered Nilgiri Tahr mountain goat.", "entry_fee": 200, "visit_time": "3 Hours"},
            {"destination_id": 1, "name": "Mattupetty Dam", "description": "Scenic concrete gravity dam with boating and misty lake views.", "entry_fee": 50, "visit_time": "2 Hours"},
            {"destination_id": 1, "name": "Anamudi Peak", "description": "Highest peak in South India, popular for scenic trekking views.", "entry_fee": 100, "visit_time": "4 Hours"},
            # Wayanad
            {"destination_id": 2, "name": "Edakkal Caves", "description": "Ancient rock caves featuring Neolithic carvings.", "entry_fee": 80, "visit_time": "3 Hours"},
            {"destination_id": 2, "name": "Banasura Sagar Dam", "description": "Largest earthen dam in India with speedboating.", "entry_fee": 100, "visit_time": "2 Hours"},
            # Alleppey
            {"destination_id": 3, "name": "Alappuzha Beach", "description": "Historical beach with a 150-year-old pier and lighthouse.", "entry_fee": 0, "visit_time": "2 Hours"},
            {"destination_id": 3, "name": "Vembanad Lake Houseboats", "description": "Ride across Kerala's vast backwaters in standard houseboats.", "entry_fee": 1500, "visit_time": "6 Hours"},
            # Varkala
            {"destination_id": 4, "name": "Papanasam Beach Cliff", "description": "Natural red clay cliffs overlooking the Arabian Sea.", "entry_fee": 0, "visit_time": "3 Hours"},
            {"destination_id": 4, "name": "Janardanaswamy Temple", "description": "2000-year-old historic Vishnu temple.", "entry_fee": 0, "visit_time": "1 Hour"},
            # Kochi
            {"destination_id": 5, "name": "Fort Kochi Chinese Fishing Nets", "description": "Iconic land-cantilevered fishing structures built in the 14th century.", "entry_fee": 0, "visit_time": "1 Hour"},
            {"destination_id": 5, "name": "Mattancherry Dutch Palace", "description": "Traditional Kerala palace built by Portuguese and gifted to Raja of Kochi.", "entry_fee": 20, "visit_time": "2 Hours"},
            # Athirappilly
            {"destination_id": 6, "name": "Athirappilly Waterfalls", "description": "80-foot roaring waterfall cascading down green rocks.", "entry_fee": 50, "visit_time": "3 Hours"},
            # Thekkady
            {"destination_id": 7, "name": "Periyar Lake Boating", "description": "Boat safari through Periyar sanctuary, viewing wild elephants.", "entry_fee": 250, "visit_time": "2.5 Hours"},
            {"destination_id": 7, "name": "Jungle Bamboo Rafting", "description": "Adventurous forest trek combined with raft rides.", "entry_fee": 1800, "visit_time": "6 Hours"},
            # Kovalam
            {"destination_id": 8, "name": "Lighthouse Beach", "description": "Famous crescent-shaped beach with a tall red-and-white lighthouse.", "entry_fee": 10, "visit_time": "2 Hours"}
        ]
        
        df = pd.DataFrame(attractions)
        # Add id column
        df.insert(0, "id", range(1, len(df) + 1))
        save_csv("attractions", df)
        print("Seeded attractions")

    # 4. Seed Hotels
    hotels_df = load_csv("hotels")
    if hotels_df.empty:
        hotels = [
            # Munnar
            {"destination_id": 1, "name": "Tea Valley Resort", "hotel_type": "Resort", "price_per_night": 3500, "rating": 4.5, "address": "Chithirapuram, Munnar", "total_rooms": 20, "website": "https://www.teavalleyresort.com", "amenities": "Free Wifi, Campfire, Restaurant"},
            {"destination_id": 1, "name": "Munnar Castle", "hotel_type": "Hotel", "price_per_night": 1800, "rating": 4.0, "address": "Munnar Town", "total_rooms": 30, "website": "https://www.munnarcastle.com", "amenities": "Free Wifi, LED TV, Room Service"},
            # Wayanad
            {"destination_id": 2, "name": "Vythiri Village Resort", "hotel_type": "Luxury Resort", "price_per_night": 7500, "rating": 4.7, "address": "Vythiri, Wayanad", "total_rooms": 40, "website": "https://www.vythirivillage.com", "amenities": "Pool, Spa, Wifi, Trekking"},
            {"destination_id": 2, "name": "Green Gates Hotel", "hotel_type": "Hotel", "price_per_night": 2200, "rating": 4.1, "address": "Kalpetta, Wayanad", "total_rooms": 25, "website": "https://www.greengateshotel.com", "amenities": "Gym, Restaurant, Wifi"},
            # Alleppey
            {"destination_id": 3, "name": "Lake Palace Backwater Resort", "hotel_type": "Resort", "price_per_night": 9000, "rating": 4.8, "address": "Thathampally, Alleppey", "total_rooms": 15, "website": "https://www.lakepalacekerala.com", "amenities": "Lake View, Pool, Spa, Houseboat cruises"},
            {"destination_id": 3, "name": "Zostel Alappuzha", "hotel_type": "Hostel", "price_per_night": 800, "rating": 4.4, "address": "Alleppey Beach Road", "total_rooms": 10, "website": "https://www.zostel.com/zostel/alappuzha/", "amenities": "Wifi, Cafe, Locker, Beach Front"},
            # Varkala
            {"destination_id": 4, "name": "Clifftoten Resort", "hotel_type": "Resort", "price_per_night": 3200, "rating": 4.3, "address": "North Cliff, Varkala", "total_rooms": 15, "website": "https://www.clifftotenresort.com", "amenities": "Sea View, Wifi, Cafe, Yoga"},
            # Kochi
            {"destination_id": 5, "name": "Brunton Boatyard", "hotel_type": "Luxury Hotel", "price_per_night": 12000, "rating": 4.9, "address": "Fort Kochi", "total_rooms": 22, "website": "https://www.cghearth.com/brunton-boatyard", "amenities": "Historic Architecture, Swimming Pool, High-end Dining"},
            {"destination_id": 5, "name": "Fort House Hotel", "hotel_type": "Boutique Hotel", "price_per_night": 2500, "rating": 4.2, "address": "Fort Kochi", "total_rooms": 18, "website": "https://www.hotelforthouse.com", "amenities": "Wifi, Waterfront Dining, Garden"},
            # Athirappilly
            {"destination_id": 6, "name": "Rainforest Resort", "hotel_type": "Luxury Resort", "price_per_night": 11000, "rating": 4.8, "address": "Athirappilly Falls", "total_rooms": 10, "website": "https://www.rainforest.in", "amenities": "Waterfall View, Pool, Forest Walk"},
            # Thekkady
            {"destination_id": 7, "name": "Jungle Park Resort", "hotel_type": "Resort", "price_per_night": 2800, "rating": 4.2, "address": "Kumily, Thekkady", "total_rooms": 20, "website": "https://www.jungleparkresort.com", "amenities": "Wifi, Spice tour booking, Restaurant"},
            # Kovalam
            {"destination_id": 8, "name": "The Leela Kovalam", "hotel_type": "Luxury Resort", "price_per_night": 14000, "rating": 4.9, "address": "Kovalam Beach", "total_rooms": 50, "website": "https://www.theleela.com/the-leela-kovalam-a-raviz-hotel", "amenities": "Infinity Pool, Private Beach Access, Ayurveda Spa"}
        ]
        
        df = pd.DataFrame(hotels)
        df.insert(0, "id", range(1, len(df) + 1))
        save_csv("hotels", df)
        print("Seeded hotels")

    # 5. Seed Restaurants
    rests_df = load_csv("restaurants")
    if rests_df.empty:
        restaurants = [
            # Munnar
            {"destination_id": 1, "name": "Rapsy Restaurant", "cuisine": "Kerala & North Indian", "avg_cost": 250, "rating": 4.4, "address": "Munnar Main Market"},
            {"destination_id": 1, "name": "Saravana Bhavan", "cuisine": "South Indian Vegetarian", "avg_cost": 150, "rating": 4.2, "address": "Munnar Town"},
            # Wayanad
            {"destination_id": 2, "name": "1980's A Nostalgic Restaurant", "cuisine": "Traditional Kerala Meals", "avg_cost": 300, "rating": 4.6, "address": "Kalpetta Bypass"},
            {"destination_id": 2, "name": "Wilton Hotel & Restaurant", "cuisine": "Malabar Biriyani & Arabian", "avg_cost": 350, "rating": 4.3, "address": "Sultan Bathery Road"},
            # Alleppey
            {"destination_id": 3, "name": "Cassia Restaurant", "cuisine": "Seafood & Continental", "avg_cost": 450, "rating": 4.5, "address": "Beach Road, Alleppey"},
            # Varkala
            {"destination_id": 4, "name": "Darjeeling Cafe", "cuisine": "Tibetan, Continental & Seafood", "avg_cost": 500, "rating": 4.7, "address": "Varkala Cliff"},
            # Kochi
            {"destination_id": 5, "name": "Kashi Art Cafe", "cuisine": "Cafe & European Breakfast", "avg_cost": 400, "rating": 4.6, "address": "Burgher Street, Fort Kochi"},
            {"destination_id": 5, "name": "Oceanos Restaurant", "cuisine": "Kerala Seafood Specialty", "avg_cost": 600, "rating": 4.5, "address": "Elphinstone Road, Kochi"},
            # Athirappilly
            {"destination_id": 6, "name": "Waterfalls Cafe", "cuisine": "Traditional Kerala", "avg_cost": 200, "rating": 4.0, "address": "Waterfall Entry Gate Road"},
            # Thekkady
            {"destination_id": 7, "name": "Ambadi Restaurant", "cuisine": "Traditional Kerala", "avg_cost": 250, "rating": 4.1, "address": "Kumily"},
            # Kovalam
            {"destination_id": 8, "name": "Bait Seafood Restaurant", "cuisine": "Fine Dining Seafood", "avg_cost": 1200, "rating": 4.8, "address": "The Leela Beachside"}
        ]
        
        df = pd.DataFrame(restaurants)
        df.insert(0, "id", range(1, len(df) + 1))
        save_csv("restaurants", df)
        print("Seeded restaurants")

    # 6. Seed Transportation
    trans_df = load_csv("transportation")
    if trans_df.empty:
        transit_options = [
            # Munnar
            {"destination_id": 1, "transport_type": "KSRTC Bus", "source": "Kochi", "destination": "Munnar", "travel_time": "4.5 Hours", "fare": 180, "distance": 130, "availability": "available"},
            {"destination_id": 1, "transport_type": "Private AC Cab", "source": "Kochi Airport", "destination": "Munnar", "travel_time": "3.5 Hours", "fare": 3500, "distance": 120, "availability": "available"},
            {"destination_id": 1, "transport_type": "Rental Bike (Royal Enfield)", "source": "Munnar Town", "destination": "Mattupetty", "travel_time": "Per Day", "fare": 800, "distance": 15, "availability": "available"},
            # Wayanad
            {"destination_id": 2, "transport_type": "KSRTC Bus", "source": "Calicut (Kozhikode)", "destination": "Wayanad", "travel_time": "3 Hours", "fare": 120, "distance": 85, "availability": "available"},
            {"destination_id": 2, "transport_type": "Tourist Taxi", "source": "Calicut Railway Station", "destination": "Wayanad", "travel_time": "2.5 Hours", "fare": 2500, "distance": 85, "availability": "available"},
            {"destination_id": 2, "transport_type": "Rental Scooter", "source": "Kalpetta", "destination": "Vythiri", "travel_time": "Per Day", "fare": 400, "distance": 12, "availability": "available"},
            # Alleppey
            {"destination_id": 3, "transport_type": "Express Train", "source": "Ernakulam (Kochi)", "destination": "Alappuzha", "travel_time": "1 Hour", "fare": 150, "distance": 57, "availability": "available"},
            {"destination_id": 3, "transport_type": "Private Taxi", "source": "Ernakulam", "destination": "Alleppey Houseboat Pier", "travel_time": "1.2 Hours", "fare": 1800, "distance": 55, "availability": "available"},
            # Varkala
            {"destination_id": 4, "transport_type": "Passenger Train", "source": "Trivandrum (TRV)", "destination": "Varkala Sivagiri", "travel_time": "45 Mins", "fare": 80, "distance": 41, "availability": "available"},
            {"destination_id": 4, "transport_type": "Prepaid Taxi", "source": "Trivandrum Airport", "destination": "Varkala Cliff", "travel_time": "1.1 Hours", "fare": 1600, "distance": 45, "availability": "available"},
            # Kochi
            {"destination_id": 5, "transport_type": "Kochi Metro", "source": "Aluva", "destination": "MG Road Kochi", "travel_time": "30 Mins", "fare": 50, "distance": 18, "availability": "available"},
            # Athirappilly
            {"destination_id": 6, "transport_type": "Bus & Auto Link", "source": "Chalakkudy", "destination": "Athirappilly Falls", "travel_time": "1.2 Hours", "fare": 150, "distance": 30, "availability": "available"},
            # Thekkady
            {"destination_id": 7, "transport_type": "KSRTC Bus", "source": "Kottayam", "destination": "Thekkady (Kumily)", "travel_time": "3.5 Hours", "fare": 160, "distance": 105, "availability": "available"},
            # Kovalam
            {"destination_id": 8, "transport_type": "Airport Auto Rickshaw", "source": "Trivandrum Airport", "destination": "Kovalam Beach", "travel_time": "30 Mins", "fare": 400, "distance": 15, "availability": "available"}
        ]
        
        df = pd.DataFrame(transit_options)
        df.insert(0, "id", range(1, len(df) + 1))
        save_csv("transportation", df)
        print("Seeded transportation options")

    # 7. Seed Transport Rates (Configurable Cost Engine Rates)
    rates_df = load_csv("transport_rates")
    if rates_df.empty:
        transport_rates = [
            {
                "id": 1,
                "transport_type": "Private AC Cab",
                "category": "Private Cab",
                "base_fare": 300.0,
                "per_km_rate": 18.0,
                "per_person_rate": 0.0,
                "fuel_cost_per_km": 0.0,
                "daily_rental": 0.0,
                "speed_kmh": 48.0,
                "min_distance_km": 5.0,
                "max_distance_km": 1500.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            },
            {
                "id": 2,
                "transport_type": "Prepaid Taxi",
                "category": "Taxi",
                "base_fare": 200.0,
                "per_km_rate": 15.0,
                "per_person_rate": 0.0,
                "fuel_cost_per_km": 0.0,
                "daily_rental": 0.0,
                "speed_kmh": 45.0,
                "min_distance_km": 2.0,
                "max_distance_km": 400.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            },
            {
                "id": 3,
                "transport_type": "State AC Volvo Intercity Bus",
                "category": "Bus",
                "base_fare": 0.0,
                "per_km_rate": 3.5,
                "per_person_rate": 3.5,
                "fuel_cost_per_km": 0.0,
                "daily_rental": 0.0,
                "speed_kmh": 38.0,
                "min_distance_km": 15.0,
                "max_distance_km": 1500.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            },
            {
                "id": 4,
                "transport_type": "Express Intercity Train",
                "category": "Train",
                "base_fare": 0.0,
                "per_km_rate": 2.2,
                "per_person_rate": 2.2,
                "fuel_cost_per_km": 0.0,
                "daily_rental": 0.0,
                "speed_kmh": 60.0,
                "min_distance_km": 20.0,
                "max_distance_km": 3500.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            },
            {
                "id": 5,
                "transport_type": "Self-Drive SUV Rental",
                "category": "Self Drive",
                "base_fare": 0.0,
                "per_km_rate": 0.0,
                "per_person_rate": 0.0,
                "fuel_cost_per_km": 7.5,
                "daily_rental": 1800.0,
                "speed_kmh": 52.0,
                "min_distance_km": 10.0,
                "max_distance_km": 2500.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            },
            {
                "id": 6,
                "transport_type": "Rental Scooter / Bike",
                "category": "Bike/Scooter",
                "base_fare": 0.0,
                "per_km_rate": 0.0,
                "per_person_rate": 0.0,
                "fuel_cost_per_km": 2.5,
                "daily_rental": 500.0,
                "speed_kmh": 38.0,
                "min_distance_km": 1.0,
                "max_distance_km": 180.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            },
            {
                "id": 7,
                "transport_type": "Eco Cycling / Rental Cycle",
                "category": "Cycling",
                "base_fare": 0.0,
                "per_km_rate": 0.0,
                "per_person_rate": 0.0,
                "fuel_cost_per_km": 0.0,
                "daily_rental": 200.0,
                "speed_kmh": 15.0,
                "min_distance_km": 0.5,
                "max_distance_km": 35.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            },
            {
                "id": 8,
                "transport_type": "Scenic Walking / Hiking",
                "category": "Walking",
                "base_fare": 0.0,
                "per_km_rate": 0.0,
                "per_person_rate": 0.0,
                "fuel_cost_per_km": 0.0,
                "daily_rental": 0.0,
                "speed_kmh": 4.5,
                "min_distance_km": 0.0,
                "max_distance_km": 8.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            },
            {
                "id": 9,
                "transport_type": "Connecting / Direct Flight",
                "category": "Flight",
                "base_fare": 2500.0,
                "per_km_rate": 4.5,
                "per_person_rate": 4.5,
                "fuel_cost_per_km": 0.0,
                "daily_rental": 0.0,
                "speed_kmh": 550.0,
                "min_distance_km": 280.0,
                "max_distance_km": 5000.0,
                "active": 1,
                "updated_at": "2026-09-24 00:00:00"
            }
        ]
        save_csv("transport_rates", pd.DataFrame(transport_rates))
        print("Seeded transport rates table")
        
    print("Seed process completed successfully.")

