import unittest
import json
from backend.app import app
from backend.utils.auth import generate_token
from backend.utils.csv_manager import load_csv, insert_row

class TestProfileValidations(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
        # Create a test user token with valid user ID from users CSV
        users_df = load_csv("users")
        user_id = int(users_df.iloc[0]["id"]) if not users_df.empty else 1
        username = str(users_df.iloc[0].get("name", "Test Traveler")) if not users_df.empty else "Test Traveler"
        self.user_token = generate_token(user_id, username, is_admin=False)
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Content-Type": "application/json"
        }

    # 1. Email Format Validations
    def test_invalid_email_format_no_tld(self):
        """Rejects emails like 'e@g' without proper domain extension."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "Ihsan",
            "email": "e@g"
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn("valid email address", data["message"].lower())

    def test_invalid_email_format_no_at_sign(self):
        """Rejects emails missing '@'."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "Ihsan",
            "email": "invalidemail.com"
        })
        self.assertEqual(res.status_code, 400)

    # 2. Name Validations
    def test_short_name(self):
        """Rejects single letter names."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "A",
            "email": "ihsan@example.com"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("between 2 and 50 characters", res.get_json()["message"])

    def test_numeric_or_special_char_name(self):
        """Rejects names with numbers or illegal special characters."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "User 12345",
            "email": "ihsan@example.com"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("only letters, spaces", res.get_json()["message"])

    # 3. Phone Number Validations
    def test_invalid_short_phone(self):
        """Rejects phone numbers that are not 10 digits."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "Ihsan Hassan",
            "email": "ihsan@example.com",
            "phone": "12345"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("10-digit mobile number", res.get_json()["message"])

    def test_invalid_phone_starting_digit(self):
        """Rejects phone numbers starting with invalid digits (e.g. 1-5)."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "Ihsan Hassan",
            "email": "ihsan@example.com",
            "phone": "2072165133"
        })
        self.assertEqual(res.status_code, 400)

    def test_valid_phone(self):
        """Accepts valid 10-digit mobile numbers."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "Ihsan Hassan",
            "email": "ihsan@example.com",
            "phone": "9072165133"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["user"]["phone"], "9072165133")

    # 4. Password Validations
    def test_short_password(self):
        """Rejects password shorter than 6 characters."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "Ihsan Hassan",
            "email": "ihsan@example.com",
            "password": "123"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least 6 characters", res.get_json()["message"])

    # 5. Successful Profile Update
    def test_successful_profile_update(self):
        """Successfully updates valid user profile."""
        res = self.app.put("/api/profile", headers=self.headers, json={
            "name": "Ihsan Hassan",
            "email": "ihsan.traveler@example.com",
            "phone": "9072165133"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["message"], "Profile updated successfully!")
        self.assertEqual(data["user"]["name"], "Ihsan Hassan")
        self.assertEqual(data["user"]["email"], "ihsan.traveler@example.com")

if __name__ == "__main__":
    unittest.main()
