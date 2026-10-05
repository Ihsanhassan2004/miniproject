import unittest
import json
from backend.app import app
from backend.utils.csv_manager import load_csv
from backend.services.recommender import recommend_destinations
from backend.services.cost_estimator import estimate_trip_cost
from backend.services.transport_service import get_transport_recommendations
from backend.services.weather_service import get_weather_for_destination
from backend.services.itinerary_generator import generate_itinerary
from backend.services.chatbot import respond_to_query
from backend.utils.auth import generate_token

class TestBackendServices(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_csv_init(self):
        """Verify CSV files were created and pre-populated."""
        dests = load_csv("destinations")
        self.assertFalse(dests.empty, "Destinations CSV should not be empty after seeding.")
        
        admins = load_csv("admins")
        self.assertFalse(admins.empty, "Admins CSV should contain the seeded administrator.")

    def test_recommender(self):
        """Verify recommender returns matching destinations sorted by score."""
        preferences = {
            "source_location": "Kochi",
            "destination_type": "hill station",
            "budget": 20000.0,
            "travelers": 2,
            "duration_days": 3,
            "interests": ["nature", "relaxation"],
            "group_type": "family"
        }
        recs = recommend_destinations(preferences)
        self.assertTrue(len(recs) > 0, "Recommender should return suggestions.")
        self.assertEqual(recs[0]["category"], "hill station", "Top recommended category should match the preference.")

    # 1. Transportation Recommendations Test
    def test_transport_recommendations(self):
        """Verify transportation options return enriched categories, badges, and group fares."""
        trans = get_transport_recommendations(destination_id=1, travelers=3, sort_by="cheapest")
        self.assertTrue(len(trans) > 0, "Should return transportation options.")
        first_opt = trans[0]
        self.assertIn("category", first_opt)
        self.assertIn("badge", first_opt)
        self.assertIn("fare_per_person", first_opt)
        self.assertIn("total_fare_for_group", first_opt)
        self.assertIn("amenities", first_opt)
        self.assertEqual(first_opt["travelers_count"], 3)
        self.assertLessEqual(first_opt["fare_per_person"], first_opt["total_fare_for_group"])

    # 2. Weather Forecast Test
    def test_weather_forecast(self):
        """Verify weather forecast provides current metrics and 5-day daily forecast."""
        weather = get_weather_for_destination(destination_id=1, destination_name="Munnar", category="hill station")
        self.assertIn("current", weather)
        self.assertIn("forecast", weather)
        self.assertEqual(len(weather["forecast"]), 5, "Should provide a 5-day weather forecast.")
        
        day1 = weather["forecast"][0]
        self.assertIn("temp_high", day1)
        self.assertIn("temp_low", day1)
        self.assertIn("condition", day1)
        self.assertIn("rain_probability", day1)
        self.assertIn("day_name", day1)

    # 3. Personalized Itinerary Generation Test
    def test_personalized_itinerary(self):
        """Verify personalized itinerary generates time-slotted day schedules tailored to interests."""
        days = generate_itinerary(
            destination_id=1,
            duration_days=3,
            interests=["nature", "photography"],
            group_type="family"
        )
        self.assertEqual(len(days), 3, "Itinerary should have 3 days.")
        day1 = days[0]
        self.assertIn("slots", day1)
        self.assertIn("day", day1)
        self.assertIn("theme", day1)
        self.assertTrue(len(day1["slots"]) >= 3, "Should provide detailed structured time slots.")

    # 4. Overall Trip Cost Estimation Test
    def test_cost_estimator_breakdown(self):
        """Verify cost estimation has itemized sub-values, per-person rates, and budget comparison."""
        cost = estimate_trip_cost(destination_id=1, travelers=2, duration_days=3, user_budget=20000.0)
        self.assertIn("accommodation", cost)
        self.assertIn("food", cost)
        self.assertIn("local_transport", cost)
        self.assertIn("sightseeing", cost)
        self.assertIn("miscellaneous", cost)
        self.assertIn("total", cost)
        self.assertIn("per_person", cost)
        self.assertIn("itemized_details", cost)
        self.assertIn("budget_comparison", cost)
        self.assertTrue(cost["total"] > 0, "Estimated total cost should be positive.")
        self.assertEqual(cost["per_person"], round(cost["total"] / 2.0, 2))
        self.assertTrue(cost["budget_comparison"]["is_within_budget"])

    # 5. Chatbot Service and Route Tests
    def test_chatbot_service(self):
        """Verify chatbot returns intelligent responses, suggestions, and actions."""
        # Greeting
        greet_res = respond_to_query("hello")
        self.assertIn("response", greet_res)
        self.assertIn("suggestions", greet_res)
        self.assertTrue(len(greet_res["suggestions"]) > 0)
        
        # Weather query for Munnar
        weather_res = respond_to_query("Weather in Munnar")
        self.assertIn("Munnar", weather_res["response"])
        self.assertIn("forecast", weather_res["response"].lower())
        
        # Cost estimate query
        cost_res = respond_to_query("Estimate cost for 2 people in Munnar for 3 days")
        self.assertIn("Estimated Total Cost", cost_res["response"])
        
        # Transport query
        trans_res = respond_to_query("How to reach Goa?")
        self.assertIn("Goa", trans_res["response"])

    def test_chatbot_endpoint(self):
        """Test POST /api/chatbot returns structured JSON."""
        response = self.app.post(
            "/api/chatbot",
            json={"message": "Suggest places under 15000"}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("response", data)
        self.assertIn("suggestions", data)
        self.assertTrue(len(data["suggestions"]) > 0)

    # 6. Public and Protected Endpoints
    def test_health_endpoint(self):
        """Test public API health-check route."""
        response = self.app.get("/health")
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["status"], "healthy")

    def test_transportation_endpoint(self):
        """Test GET /api/transportation/<id> endpoint."""
        response = self.app.get("/api/transportation/1?travelers=2&sort_by=cheapest")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("transportation", data)
        self.assertTrue(len(data["transportation"]) > 0)

    def test_weather_endpoint(self):
        """Test GET /api/weather/<id> endpoint."""
        response = self.app.get("/api/weather/1")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("weather", data)
        self.assertIn("forecast", data["weather"])

    def test_plan_trip_endpoint_returns_recommendations(self):
        """The planner endpoint should return serializable recommendations within budget."""
        response = self.app.post(
            "/api/plan-trip",
            json={
                "source_location": "Kochi",
                "destination_type": "hill station",
                "budget": 25000,
                "travelers": 2,
                "duration_days": 3,
                "interests": ["nature"],
                "group_type": "family",
                "state": "Kerala",
                "travel_date": ""
            }
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("recommendations", data)
        self.assertTrue(len(data["recommendations"]) > 0)
        self.assertEqual(data["recommendations"][0]["category"], "hill station")
        for rec in data["recommendations"]:
            self.assertLessEqual(rec["estimated_cost"]["total"], 25000)

    def test_low_budget_returns_no_destinations(self):
        """When budget is too low for any destination, returns empty list with clear message."""
        response = self.app.post(
            "/api/plan-trip",
            json={
                "source_location": "Kochi",
                "destination_type": "hill station",
                "budget": 2000,
                "travelers": 2,
                "duration_days": 3,
                "interests": ["nature"],
                "group_type": "family"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data["recommendations"]), 0, "No destination should be returned over budget.")
        self.assertIn("no destination found within your budget", data["message"].lower())

    def test_past_travel_date_validation(self):
        """When a past travel date is submitted, the endpoint returns 400 error."""
        response = self.app.post(
            "/api/plan-trip",
            json={
                "source_location": "Kochi",
                "destination_type": "hill station",
                "budget": 25000,
                "travelers": 2,
                "duration_days": 3,
                "travel_date": "2020-01-01"
            }
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("cannot be in the past", data["message"])

    def test_multiple_preferred_categories(self):
        """Recommender and /api/plan-trip should support multiple preferred categories."""
        # 1. Direct recommender test with list of categories
        preferences = {
            "source_location": "Kochi",
            "destination_types": ["hill station", "beach"],
            "budget": 30000.0,
            "travelers": 2,
            "duration_days": 3,
            "interests": ["nature", "relaxation"],
            "group_type": "couple"
        }
        recs = recommend_destinations(preferences)
        self.assertTrue(len(recs) > 0)
        returned_categories = [r["category"] for r in recs]
        self.assertTrue(any(c in ["hill station", "beach"] for c in returned_categories))

        # 2. Endpoint test with destination_types array
        response = self.app.post(
            "/api/plan-trip",
            json={
                "source_location": "Kochi",
                "destination_types": ["beach", "city tourism"],
                "budget": 30000,
                "travelers": 2,
                "duration_days": 3
            }
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("recommendations", data)
        self.assertIn("destination_types", data["preferences"])
        self.assertEqual(data["preferences"]["destination_types"], ["beach", "city tourism"])

    def test_saved_trip_date_conflict_validation(self):
        """Verify that when a trip is saved for 05-10-2026 with duration 5 days, no overlapping trip can be saved."""
        users = load_csv("users")
        user_id = int(users.iloc[0]["id"]) if not users.empty else 6
        token = generate_token(user_id, "test_user")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Save first trip starting 2026-10-05 for 5 days (Spans 2026-10-05 to 2026-10-09)
        trip1_payload = {
            "destination_id": 1,
            "source_location": "Kochi",
            "budget": 20000,
            "travelers": 2,
            "duration_days": 5,
            "travel_date": "2026-10-05",
            "trip_name": "Autumn Munnar Retreat"
        }
        res1 = self.app.post("/api/save-trip", json=trip1_payload, headers=headers)
        self.assertEqual(res1.status_code, 201, "First trip should be saved successfully.")
        trip1_data = json.loads(res1.data)
        trip1_id = trip1_data["trip"]["id"]

        # 2. Attempt to save an overlapping trip (same start date 2026-10-05, duration 3 days) -> MUST FAIL (400)
        res_overlap1 = self.app.post("/api/save-trip", json={
            "destination_id": 2,
            "source_location": "Kochi",
            "budget": 15000,
            "travelers": 1,
            "duration_days": 3,
            "travel_date": "2026-10-05",
            "trip_name": "Overlapping Trip Same Date"
        }, headers=headers)
        self.assertEqual(res_overlap1.status_code, 400)
        overlap1_data = json.loads(res_overlap1.data)
        self.assertEqual(overlap1_data.get("error"), "DATE_CONFLICT")
        self.assertIn("Date conflict", overlap1_data["message"])

        # 3. Attempt to save an overlapping trip in the middle of the duration (2026-10-07 for 4 days) -> MUST FAIL (400)
        res_overlap2 = self.app.post("/api/save-trip", json={
            "destination_id": 3,
            "source_location": "Kochi",
            "budget": 18000,
            "travelers": 2,
            "duration_days": 4,
            "travel_date": "2026-10-07",
            "trip_name": "Mid-week Overlap"
        }, headers=headers)
        self.assertEqual(res_overlap2.status_code, 400)
        overlap2_data = json.loads(res_overlap2.data)
        self.assertEqual(overlap2_data.get("error"), "DATE_CONFLICT")

        # 4. Check endpoint /api/check-date-conflict returns has_conflict: True for overlapping dates
        chk_conflict = self.app.post("/api/check-date-conflict", json={
            "travel_date": "2026-10-08",
            "duration_days": 3
        }, headers=headers)
        self.assertEqual(chk_conflict.status_code, 200)
        chk_data = json.loads(chk_conflict.data)
        self.assertTrue(chk_data["has_conflict"])
        self.assertIn("Autumn Munnar Retreat", chk_data["message"])

        # 5. Save a non-overlapping trip after the 5-day span (starting 2026-10-10) -> MUST SUCCEED (201)
        res_non_overlap = self.app.post("/api/save-trip", json={
            "destination_id": 2,
            "source_location": "Kochi",
            "budget": 12000,
            "travelers": 1,
            "duration_days": 3,
            "travel_date": "2026-10-10",
            "trip_name": "Subsequent Trip"
        }, headers=headers)
        self.assertEqual(res_non_overlap.status_code, 201, "Non-overlapping trip should save successfully.")

        # Clean up created test trips
        from backend.utils.csv_manager import delete_row
        delete_row("saved_trips", trip1_id)
        saved_non_overlap_id = json.loads(res_non_overlap.data)["trip"]["id"]
        delete_row("saved_trips", saved_non_overlap_id)

if __name__ == "__main__":
    unittest.main()
