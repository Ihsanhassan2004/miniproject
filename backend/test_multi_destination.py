import unittest
import json
from backend.app import app
from backend.services.multi_destination_service import (
    get_nearby_destinations,
    suggest_multi_destination_splits,
    generate_detailed_personalized_itinerary,
    estimate_multi_destination_cost,
    NEARBY_DESTINATION_MAP
)

class MultiDestinationTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_nearby_destinations_function(self):
        nearby = get_nearby_destinations(1, limit=4)
        self.assertIsInstance(nearby, list)
        self.assertGreater(len(nearby), 0)
        first = nearby[0]
        self.assertIn("destination_id", first)
        self.assertIn("name", first)
        self.assertIn("distance_km", first)
        self.assertIn("drive_time", first)
        self.assertIn("pairing_reason", first)

    def test_suggest_splits(self):
        splits = suggest_multi_destination_splits(5, 1, 2)
        self.assertEqual(len(splits), 2)
        self.assertEqual(splits[0]["days"] + splits[1]["days"], 5)

    def test_generate_detailed_personalized_itinerary(self):
        segments = [
            {
                "destination_id": 1,
                "destination_name": "Munnar",
                "days": 3,
                "selected_hotel_name": "Windermere Estate",
                "selected_hotel_cost": 4500,
                "selected_restaurants": ["Rapsy Restaurant", "Saravana Bhavan"],
                "selected_attractions": ["Eravikulam National Park", "Mattupetty Dam", "Top Station"],
                "selected_transport": {"mode": "Private AC Cab", "type": "cab"}
            },
            {
                "destination_id": 2,
                "destination_name": "Vagamon",
                "days": 2,
                "selected_hotel_name": "Foggy Knolls Resort",
                "selected_hotel_cost": 3800,
                "selected_restaurants": ["Green Valley Restaurant"],
                "selected_attractions": ["Vagamon Pine Forest", "Kurisumala Ashram"],
                "selected_transport": {"mode": "Private AC Cab", "type": "cab"}
            }
        ]
        itinerary = generate_detailed_personalized_itinerary("Kochi", segments, 2, "family", "moderate")
        self.assertEqual(len(itinerary), 5)
        # Check Day 1 (Munnar)
        day1 = itinerary[0]
        self.assertEqual(day1["destination_name"], "Munnar")
        self.assertTrue(any("Windermere Estate" in slot["description"] or "Windermere Estate" in slot.get("specific_name", "") for slot in day1["slots"]))
        # Check Day 4 (Vagamon transit and checkin)
        day4 = itinerary[3]
        self.assertEqual(day4["destination_name"], "Vagamon")
        self.assertTrue(any("Vagamon" in slot["title"] or "Vagamon" in slot["description"] for slot in day4["slots"]))

    def test_estimate_multi_cost(self):
        segments = [
            {
                "destination_id": 1,
                "destination_name": "Munnar",
                "days": 3,
                "selected_hotel_name": "Windermere Estate",
                "selected_hotel_cost": 4500,
                "selected_restaurants": ["Rapsy Restaurant"],
                "selected_attractions": ["Eravikulam National Park"],
                "selected_transport": {"mode": "Private AC Cab", "cost": 3500}
            },
            {
                "destination_id": 2,
                "destination_name": "Vagamon",
                "days": 2,
                "selected_hotel_name": "Foggy Knolls Resort",
                "selected_hotel_cost": 3800,
                "selected_restaurants": ["Green Valley Restaurant"],
                "selected_attractions": ["Vagamon Pine Forest"],
                "selected_transport": {"mode": "Private AC Cab", "cost": 2500}
            }
        ]
        cost = estimate_multi_destination_cost(segments, 2, 25000)
        self.assertIn("total", cost)
        self.assertIn("accommodation", cost)
        self.assertIn("food", cost)
        self.assertIn("transport", cost)
        self.assertIn("segments", cost)
        self.assertEqual(len(cost["segments"]), 2)

    def test_nearby_api_route(self):
        res = self.client.get('/api/destinations/1/nearby')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("nearby_destinations", data)
        self.assertGreater(len(data["nearby_destinations"]), 0)

    def test_multi_itinerary_api_route(self):
        payload = {
            "source_location": "Kochi",
            "segments": [
                {
                    "destination_id": 1,
                    "destination_name": "Munnar",
                    "days": 3,
                    "selected_hotel_name": "Tea County",
                    "selected_restaurants": ["Saravana Bhavan"],
                    "selected_attractions": ["Mattupetty Dam"]
                },
                {
                    "destination_id": 2,
                    "destination_name": "Vagamon",
                    "days": 2,
                    "selected_hotel_name": "Vagamon Heights",
                    "selected_restaurants": ["Orchid Family Restaurant"],
                    "selected_attractions": ["Pine Forest"]
                }
            ],
            "travelers": 2,
            "group_type": "family",
            "pace": "moderate"
        }
        res = self.client.post('/api/multi-destination-itinerary', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("itinerary", data)
        self.assertEqual(len(data["itinerary"]), 5)

if __name__ == '__main__':
    unittest.main()
