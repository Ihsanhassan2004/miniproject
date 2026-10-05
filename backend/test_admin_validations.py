import unittest
import json
import datetime
from backend.app import app
from backend.utils.auth import generate_token

class TestAdminValidations(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        self.admin_token = generate_token(1, "admin", is_admin=True)
        self.headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }

    # ----------------- DESTINATIONS -----------------
    def test_destination_missing_or_short_name(self):
        res = self.app.post("/api/admin/destinations", headers=self.headers, json={
            "name": "A",
            "category": "hill station",
            "city": "Idukki",
            "state": "Kerala",
            "description": "A beautiful scenic hill station in Kerala with tea gardens.",
            "best_time": "Sep to Mar",
            "budget_min": 5000,
            "budget_max": 15000
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("minimum 2 characters", res.get_json()["message"])

    def test_destination_invalid_category(self):
        res = self.app.post("/api/admin/destinations", headers=self.headers, json={
            "name": "Test Place",
            "category": "invalid_cat",
            "city": "Idukki",
            "state": "Kerala",
            "description": "A beautiful scenic hill station in Kerala with tea gardens.",
            "best_time": "Sep to Mar"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid category", res.get_json()["message"])

    def test_destination_invalid_budget(self):
        # min budget > max budget
        res = self.app.post("/api/admin/destinations", headers=self.headers, json={
            "name": "Test Place",
            "category": "hill station",
            "city": "Idukki",
            "state": "Kerala",
            "description": "A beautiful scenic hill station in Kerala with tea gardens.",
            "best_time": "Sep to Mar",
            "budget_min": 20000,
            "budget_max": 10000
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Maximum budget cannot be less than minimum budget", res.get_json()["message"])

    def test_destination_invalid_image_url(self):
        res = self.app.post("/api/admin/destinations", headers=self.headers, json={
            "name": "Test Place",
            "category": "hill station",
            "city": "Idukki",
            "state": "Kerala",
            "description": "A beautiful scenic hill station in Kerala with tea gardens.",
            "best_time": "Sep to Mar",
            "image_url": "ftp://bad-url"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Image URL must start with", res.get_json()["message"])

    def test_destination_valid_creation(self):
        res = self.app.post("/api/admin/destinations", headers=self.headers, json={
            "name": "Temp Test Dest",
            "category": "hill station",
            "city": "Idukki",
            "state": "Kerala",
            "description": "A pristine mountain paradise with lush greenery and tea plantations.",
            "best_time": "Sep to Mar",
            "budget_min": 6000,
            "budget_max": 16000,
            "image_url": "https://images.unsplash.com/photo-test"
        })
        self.assertEqual(res.status_code, 201)
        created_dest = res.get_json().get("destination", {})
        if created_dest.get("id"):
            self.app.delete(f"/api/admin/destinations/{created_dest['id']}", headers=self.headers)

    # ----------------- ATTRACTIONS -----------------
    def test_attraction_negative_fee(self):
        res = self.app.post("/api/admin/attractions", headers=self.headers, json={
            "destination_id": 1,
            "name": "Waterfalls",
            "entry_fee": -50,
            "visit_time": "2 Hours",
            "description": "Beautiful cascades."
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Entry fee must be ₹0 or greater", res.get_json()["message"])

    # ----------------- HOTELS -----------------
    def test_hotel_invalid_total_rooms(self):
        res = self.app.post("/api/admin/hotels", headers=self.headers, json={
            "destination_id": 1,
            "name": "Grand Palace",
            "hotel_type": "Resort",
            "price_per_night": 3000,
            "rating": 4.5,
            "total_rooms": 0,
            "website": "https://grandpalace.com",
            "address": "Hilltop Road, Munnar"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Total rooms capacity must be at least 1", res.get_json()["message"])

    def test_hotel_negative_price(self):
        res = self.app.post("/api/admin/hotels", headers=self.headers, json={
            "destination_id": 1,
            "name": "Grand Palace",
            "hotel_type": "Resort",
            "price_per_night": -100,
            "rating": 4.5,
            "total_rooms": 10,
            "website": "https://grandpalace.com",
            "address": "Hilltop Road, Munnar"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Price per night must be greater than ₹0", res.get_json()["message"])

    def test_hotel_invalid_rating(self):
        res = self.app.post("/api/admin/hotels", headers=self.headers, json={
            "destination_id": 1,
            "name": "Grand Palace",
            "hotel_type": "Resort",
            "price_per_night": 3000,
            "rating": 6.5,
            "total_rooms": 10,
            "website": "https://grandpalace.com",
            "address": "Hilltop Road, Munnar"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Rating must be between 1.0 and 5.0", res.get_json()["message"])

    # ----------------- RESTAURANTS -----------------
    def test_restaurant_negative_cost(self):
        res = self.app.post("/api/admin/restaurants", headers=self.headers, json={
            "destination_id": 1,
            "name": "Spice Cafe",
            "cuisine": "Kerala Traditional",
            "avg_cost": -200,
            "rating": 4.2,
            "address": "Town Center"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Average cost per person must be greater than ₹0", res.get_json()["message"])

    def test_restaurant_invalid_rating(self):
        res = self.app.post("/api/admin/restaurants", headers=self.headers, json={
            "destination_id": 1,
            "name": "Spice Cafe",
            "cuisine": "Kerala Traditional",
            "avg_cost": 350,
            "rating": 0.5,
            "address": "Town Center"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Rating must be between 1.0 and 5.0", res.get_json()["message"])

    def test_restaurant_multiple_cuisines_list(self):
        res = self.app.post("/api/admin/restaurants", headers=self.headers, json={
            "destination_id": 1,
            "name": "Temp Spice Test",
            "cuisines": ["Kerala Traditional", "Seafood", "South Indian"],
            "avg_cost": 450,
            "rating": 4.5,
            "address": "Bazaar Road, Munnar"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data["restaurant"]["cuisine"], "Kerala Traditional, Seafood, South Indian")
        if data.get("restaurant", {}).get("id"):
            self.app.delete(f"/api/admin/restaurants/{data['restaurant']['id']}", headers=self.headers)

    # ----------------- TRANSPORTATION -----------------
    def test_transport_source_equals_destination(self):
        res = self.app.post("/api/admin/transportation", headers=self.headers, json={
            "destination_id": 1,
            "transport_type": "Taxi",
            "source": "Munnar",
            "destination": "Munnar",
            "travel_time": "1 Hour",
            "fare": 500,
            "distance": 10,
            "availability": "available"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("cannot be identical", res.get_json()["message"])

    def test_transport_negative_fare_or_distance(self):
        res = self.app.post("/api/admin/transportation", headers=self.headers, json={
            "destination_id": 1,
            "transport_type": "Taxi",
            "source": "Kochi",
            "destination": "Munnar",
            "travel_time": "3 Hours",
            "fare": -500,
            "distance": 120,
            "availability": "available"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Estimated fare cost must be greater than ₹0", res.get_json()["message"])

    def test_transport_invalid_availability(self):
        res = self.app.post("/api/admin/transportation", headers=self.headers, json={
            "destination_id": 1,
            "transport_type": "Taxi",
            "source": "Kochi",
            "destination": "Munnar",
            "travel_time": "3 Hours",
            "fare": 1500,
            "distance": 120,
            "availability": "unknown_status"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Availability must be either", res.get_json()["message"])

    # ----------------- USER MANAGEMENT -----------------
    def test_admin_get_users_list(self):
        res = self.app.get("/api/admin/users", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("users", data)
        self.assertIsInstance(data["users"], list)

    def test_admin_create_and_update_user(self):
        # Create User
        test_email = f"testadminuser_{datetime.datetime.now().timestamp()}@example.com"
        res = self.app.post("/api/admin/users", headers=self.headers, json={
            "name": "Admin Created User",
            "email": test_email,
            "phone": "9876543210",
            "password": "securepassword123"
        })
        self.assertEqual(res.status_code, 201)
        created_user = res.get_json()["user"]
        user_id = created_user["id"]

        # Update User
        update_res = self.app.put(f"/api/admin/users/{user_id}", headers=self.headers, json={
            "name": "Updated Name Admin",
            "phone": "9998887776"
        })
        self.assertEqual(update_res.status_code, 200)

        # Delete User
        del_res = self.app.delete(f"/api/admin/users/{user_id}", headers=self.headers)
        self.assertEqual(del_res.status_code, 200)

    # ----------------- TRIPS OVERVIEW -----------------
    def test_admin_get_all_trips(self):
        res = self.app.get("/api/admin/trips", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("trips", data)
        self.assertIsInstance(data["trips"], list)
        if len(data["trips"]) > 0:
            sample = data["trips"][0]
            self.assertIn("destination_name", sample)
            self.assertIn("user_name", sample)
            self.assertIn("status", sample)

if __name__ == "__main__":
    unittest.main()
