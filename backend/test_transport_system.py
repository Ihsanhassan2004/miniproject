import unittest
from backend.app import app
from backend.services.geocoding_service import search_geocode, reverse_geocode
from backend.services.routing_service import calculate_route
from backend.services.transport_cost_service import calculate_transport_options, get_active_rates
from backend.services.recommendation_service import score_transport_options
from backend.services.ai_service import personalize_transport_recommendations

class TestTransportSystem(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_geocoding_service(self):
        # Search Kochi
        results = search_geocode("Kochi", limit=5)
        self.assertGreater(len(results), 0)
        kochi = results[0]
        self.assertIn("latitude", kochi)
        self.assertIn("longitude", kochi)
        self.assertAlmostEqual(kochi["latitude"], 9.9312, delta=0.5)

        # Search Varkala
        varkala_res = search_geocode("Varkala", limit=5)
        self.assertGreater(len(varkala_res), 0)
        self.assertAlmostEqual(varkala_res[0]["latitude"], 8.7379, delta=0.5)

    def test_reverse_geocoding_service(self):
        # Reverse geocode Munnar coordinates (10.0889, 77.0595)
        res = reverse_geocode(10.0889, 77.0595)
        self.assertIn("name", res)
        self.assertIn("Munnar", res["name"])
        self.assertAlmostEqual(res["latitude"], 10.0889, delta=0.01)

        # API endpoint test
        api_res = self.client.get("/api/reverse-geocode?lat=9.9312&lon=76.2673")
        self.assertEqual(api_res.status_code, 200)
        data = api_res.get_json()
        self.assertIn("result", data)
        self.assertIn("Kochi", data["result"]["name"])

    def test_routing_service(self):
        # Kochi to Varkala
        res = calculate_route(9.9312, 76.2673, 8.7379, 76.7163)
        self.assertTrue(res.get("success"))
        self.assertGreater(res.get("distance_km"), 150)
        self.assertLess(res.get("distance_km"), 230)
        self.assertGreater(res.get("duration_minutes"), 120)
        self.assertGreater(len(res.get("geometry", [])), 2)

    def test_transport_cost_service_and_transparency(self):
        options = calculate_transport_options(
            origin_name="Kochi",
            dest_name="Varkala",
            distance_km=191.1,
            duration_minutes=240,
            travelers=2
        )
        self.assertGreaterEqual(len(options), 4)
        
        # Verify Private Cab calculations
        cab = next(o for o in options if o["mode"] == "cab")
        self.assertIn("cost_breakdown", cab)
        breakdown = cab["cost_breakdown"]
        self.assertEqual(breakdown["distance_km"], 191.1)
        self.assertIn("formula", breakdown)
        self.assertEqual(cab["price_label"], "Estimated fare")
        
        # Verify Bus & Train have appropriate disclaimers
        bus = next(o for o in options if o["mode"] == "bus")
        self.assertIn("Estimated", bus["price_label"])
        self.assertIn("transit_disclaimer", bus["cost_breakdown"])

    def test_mcda_recommendation_scoring(self):
        options = calculate_transport_options(
            origin_name="Kochi",
            dest_name="Varkala",
            distance_km=191.1,
            duration_minutes=240,
            travelers=2
        )
        
        # Test Budget persona prioritizing economical transit
        scored_budget = score_transport_options(
            options,
            budget=3000,
            travelers=2,
            preferences={"style": "cheapest"}
        )
        top_budget_mode = scored_budget[0]["mode"]
        self.assertIn(top_budget_mode, ["bus", "train"])

        # Test Comfort persona with large budget
        scored_comfort = score_transport_options(
            options,
            budget=30000,
            travelers=2,
            preferences={"comfort": "Premium Comfort", "style": "comfort"}
        )
        top_comfort_mode = scored_comfort[0]["mode"]
        self.assertIn(top_comfort_mode, ["cab", "self_drive"])

    def test_origin_transit_feasibility_wayanad_no_train(self):
        # Test Wayanad -> Munnar: Neither has railway connectivity
        options_wayanad = calculate_transport_options(
            origin_name="Wayanad",
            dest_name="Munnar",
            distance_km=240.0,
            duration_minutes=330,
            travelers=2
        )
        modes_wayanad = [o["mode"] for o in options_wayanad]
        # Train MUST NOT be in options for Wayanad
        self.assertNotIn("train", modes_wayanad, "Train must not be recommended for Wayanad origin as Wayanad has no railway station")
        self.assertIn("cab", modes_wayanad)
        self.assertIn("bus", modes_wayanad)
        self.assertIn("self_drive", modes_wayanad)

        # Test Kalpetta -> Kochi: Kalpetta (Wayanad) has no railway station
        options_kalpetta = calculate_transport_options(
            origin_name="Kalpetta",
            dest_name="Kochi",
            distance_km=210.0,
            duration_minutes=300,
            travelers=1
        )
        modes_kalpetta = [o["mode"] for o in options_kalpetta]
        self.assertNotIn("train", modes_kalpetta, "Train must not be recommended when origin is Kalpetta")

        # Test Kochi -> Varkala: Both have railway stations
        options_kochi_varkala = calculate_transport_options(
            origin_name="Kochi",
            dest_name="Varkala",
            distance_km=191.1,
            duration_minutes=240,
            travelers=2
        )
        modes_kv = [o["mode"] for o in options_kochi_varkala]
        self.assertIn("train", modes_kv, "Train should be included when both Kochi and Varkala have railway stations")

    def test_api_recommendations_wayanad_excludes_train(self):
        # API test for Wayanad origin
        res = self.client.post("/api/recommendations", json={
            "origin": "Wayanad",
            "destination": "Munnar",
            "travelers": 2,
            "budget": 15000
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        modes = [o["mode"] for o in data.get("options", [])]
        self.assertNotIn("train", modes, "API recommendations for Wayanad must exclude train")
        self.assertIn("excluded_modes", data)
        self.assertTrue(any(ex.get("mode") == "train" for ex in data["excluded_modes"]))
        self.assertIn("ai_feasibility", data)
        self.assertFalse(data["ai_feasibility"]["origin_has_railway"])

    def test_international_transport_al_ahsa_and_foreign_origins(self):
        # 1. Test Al Ahsa Governorate -> Vagamon
        options_al_ahsa = calculate_transport_options(
            origin_name="Al Ahsa Governorate",
            dest_name="Vagamon",
            distance_km=3317.8,
            duration_minutes=285,
            travelers=2
        )
        self.assertGreaterEqual(len(options_al_ahsa), 3)
        # All options MUST be commercial flights, NO road cabs or buses across the Arabian Sea
        for opt in options_al_ahsa:
            self.assertEqual(opt["mode"], "flight")
            self.assertIn("flight_details", opt)
            self.assertIn("Saudia", str(options_al_ahsa))

        # 2. Test API recommendations for Al Ahsa Governorate -> Vagamon
        res = self.client.post("/api/recommendations", json={
            "origin": {"name": "Al Ahsa Governorate", "latitude": 25.3833, "longitude": 49.5833, "country": "Saudi Arabia"},
            "destination": "Vagamon",
            "travelers": 2,
            "budget": 35000
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        modes = [o["mode"] for o in data.get("options", [])]
        self.assertTrue(all(m == "flight" for m in modes), "International route must only return flights")
        self.assertNotIn("cab", modes)
        self.assertNotIn("bus", modes)
        self.assertNotIn("self_drive", modes)
        self.assertTrue(data.get("ai_feasibility", {}).get("is_international"))

        # 3. Test Dubai -> Munnar
        options_dubai = calculate_transport_options(
            origin_name="Dubai",
            dest_name="Munnar",
            distance_km=2780.0,
            duration_minutes=240,
            travelers=1
        )
        for opt in options_dubai:
            self.assertEqual(opt["mode"], "flight")
            self.assertIn("Emirates", str(options_dubai))

    def test_island_transport_lakshadweep_and_andaman(self):
        # 1. Test Lakshadweep / Agatti -> Vagamon
        options_lakshadweep = calculate_transport_options(
            origin_name="Lakshadweep",
            dest_name="Vagamon",
            distance_km=442.0,
            duration_minutes=85,
            travelers=2
        )
        self.assertGreaterEqual(len(options_lakshadweep), 3)
        # MUST only return commercial flights or passenger ships, ZERO road cabs or buses
        for opt in options_lakshadweep:
            self.assertIn(opt["mode"], ["flight", "ferry"])
            self.assertNotIn(opt["mode"], ["cab", "bus", "self_drive", "bike", "train", "walking"])

        # 2. Test API recommendations for Lakshadweep -> Vagamon
        res = self.client.post("/api/recommendations", json={
            "origin": {"name": "Lakshadweep", "latitude": 10.5669, "longitude": 72.6420},
            "destination": "Vagamon",
            "travelers": 2,
            "budget": 20000
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        modes = [o["mode"] for o in data.get("options", [])]
        self.assertNotIn("cab", modes, "Road cabs must be omitted for Lakshadweep")
        self.assertNotIn("bus", modes, "Intercity buses must be omitted for Lakshadweep")
        self.assertNotIn("self_drive", modes, "Self-drive rentals must be omitted for Lakshadweep")
        self.assertTrue(all(m in ["flight", "ferry"] for m in modes))

        # 3. Test route calculation for Lakshadweep -> Vagamon
        route_res = calculate_route(10.5669, 72.6420, 9.6896, 76.9056)
        self.assertTrue(route_res.get("is_flight_route"))
        self.assertEqual(route_res.get("profile"), "flight")
        self.assertEqual(route_res.get("duration_minutes"), 85)

    def test_flask_endpoints(self):
        # 1. GET /api/geocode
        r1 = self.client.get("/api/geocode?q=Munnar")
        self.assertEqual(r1.status_code, 200)
        self.assertGreater(len(r1.json.get("results", [])), 0)

        # 2. POST /api/route
        r2 = self.client.post("/api/route", json={
            "origin": {"name": "Kochi", "latitude": 9.9312, "longitude": 76.2673},
            "destination": {"name": "Varkala", "latitude": 8.7379, "longitude": 76.7163}
        })
        self.assertEqual(r2.status_code, 200)
        self.assertIn("geometry", r2.json)
        self.assertIn("distance_km", r2.json)

        # 3. POST /api/transport-options
        r3 = self.client.post("/api/transport-options", json={
            "origin": "Kochi",
            "destination": "Varkala",
            "travelers": 2,
            "budget": 10000
        })
        self.assertEqual(r3.status_code, 200)
        self.assertGreaterEqual(len(r3.json.get("options", [])), 4)

        # 4. POST /api/recommendations
        r4 = self.client.post("/api/recommendations", json={
            "origin": "Kochi",
            "destination": "Varkala",
            "travelers": 2,
            "budget": 10000,
            "comfort": "Comfortable"
        })
        self.assertEqual(r4.status_code, 200)
        self.assertIn("ai_advice", r4.json)
        self.assertIn("recommendation", r4.json["ai_advice"])

        # 5. GET /api/transport-rates
        r5 = self.client.get("/api/transport-rates")
        self.assertEqual(r5.status_code, 200)
        self.assertGreater(len(r5.json.get("rates", [])), 0)

if __name__ == "__main__":
    unittest.main()

