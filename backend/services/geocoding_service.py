import time
import math
import requests
from backend.config import Config

# In-memory geocoding cache: { query_lower: (timestamp, results) }
GEOCODE_CACHE = {}
REVERSE_GEOCODE_CACHE = {}
CACHE_TTL_SECONDS = 3600 * 24  # 24 hours

# Comprehensive location coordinates database for Global, National & Kerala travel destinations
# Used for instant search response, fuzzy matching, and robust fallback.
POPULAR_LOCATIONS = [
    # Top Global Destinations
    {"name": "Dubai", "label": "Dubai, Dubai Emirate, United Arab Emirates", "latitude": 25.2048, "longitude": 55.2708, "country": "United Arab Emirates", "region": "Dubai Emirate", "city": "Dubai"},
    {"name": "Abu Dhabi", "label": "Abu Dhabi, United Arab Emirates", "latitude": 24.4539, "longitude": 54.3773, "country": "United Arab Emirates", "region": "Abu Dhabi Emirate", "city": "Abu Dhabi"},
    {"name": "Sharjah", "label": "Sharjah, United Arab Emirates", "latitude": 25.3463, "longitude": 55.4209, "country": "United Arab Emirates", "region": "Sharjah Emirate", "city": "Sharjah"},
    {"name": "Singapore", "label": "Singapore City, Singapore", "latitude": 1.3521, "longitude": 103.8198, "country": "Singapore", "region": "Singapore", "city": "Singapore"},
    {"name": "Bangkok", "label": "Bangkok, Thailand", "latitude": 13.7563, "longitude": 100.5018, "country": "Thailand", "region": "Bangkok", "city": "Bangkok"},
    {"name": "Phuket", "label": "Phuket, Thailand", "latitude": 7.8804, "longitude": 98.3923, "country": "Thailand", "region": "Phuket", "city": "Phuket"},
    {"name": "Bali", "label": "Bali, Indonesia", "latitude": -8.4095, "longitude": 115.1889, "country": "Indonesia", "region": "Bali", "city": "Denpasar"},
    {"name": "Maldives", "label": "Malé, Maldives", "latitude": 4.1755, "longitude": 73.5093, "country": "Maldives", "region": "Kaafu Atoll", "city": "Malé"},
    {"name": "Kuala Lumpur", "label": "Kuala Lumpur, Malaysia", "latitude": 3.1390, "longitude": 101.6869, "country": "Malaysia", "region": "Federal Territory", "city": "Kuala Lumpur"},
    {"name": "Doha", "label": "Doha, Qatar", "latitude": 25.2854, "longitude": 51.5310, "country": "Qatar", "region": "Doha", "city": "Doha"},
    {"name": "Muscat", "label": "Muscat, Oman", "latitude": 23.5880, "longitude": 58.3829, "country": "Oman", "region": "Muscat", "city": "Muscat"},
    {"name": "Riyadh", "label": "Riyadh, Saudi Arabia", "latitude": 24.7136, "longitude": 46.6753, "country": "Saudi Arabia", "region": "Riyadh", "city": "Riyadh"},
    {"name": "London", "label": "London, Greater London, United Kingdom", "latitude": 51.5074, "longitude": -0.1278, "country": "United Kingdom", "region": "Greater London", "city": "London"},
    {"name": "Paris", "label": "Paris, Ile-de-France, France", "latitude": 48.8566, "longitude": 2.3522, "country": "France", "region": "Ile-de-France", "city": "Paris"},
    {"name": "Tokyo", "label": "Tokyo, Japan", "latitude": 35.6762, "longitude": 139.6503, "country": "Japan", "region": "Tokyo", "city": "Tokyo"},
    {"name": "New York", "label": "New York City, New York, United States", "latitude": 40.7128, "longitude": -74.0060, "country": "United States", "region": "New York", "city": "New York"},
    {"name": "Rome", "label": "Rome, Lazio, Italy", "latitude": 41.9028, "longitude": 12.4964, "country": "Italy", "region": "Lazio", "city": "Rome"},
    {"name": "Zurich", "label": "Zurich, Switzerland", "latitude": 47.3769, "longitude": 8.5417, "country": "Switzerland", "region": "Zurich", "city": "Zurich"},
    {"name": "Kuwait City", "label": "Kuwait City, Al Asimah, Kuwait", "latitude": 29.3759, "longitude": 47.9774, "country": "Kuwait", "region": "Al Asimah", "city": "Kuwait City"},
    {"name": "Manama", "label": "Manama, Capital Governorate, Bahrain", "latitude": 26.0667, "longitude": 50.5577, "country": "Bahrain", "region": "Capital Governorate", "city": "Manama"},
    {"name": "Colombo", "label": "Colombo, Western Province, Sri Lanka", "latitude": 6.9271, "longitude": 79.8612, "country": "Sri Lanka", "region": "Western Province", "city": "Colombo"},

    # Top National & Regional Indian Destinations
    {"name": "Goa", "label": "Panaji, Goa, India", "latitude": 15.2993, "longitude": 74.1240, "country": "India", "region": "Goa", "city": "Panaji"},
    {"name": "Mumbai", "label": "Mumbai (Bombay), Maharashtra, India", "latitude": 19.0760, "longitude": 72.8777, "country": "India", "region": "Maharashtra", "city": "Mumbai"},
    {"name": "Delhi", "label": "New Delhi, Delhi, India", "latitude": 28.6139, "longitude": 77.2090, "country": "India", "region": "Delhi", "city": "New Delhi"},
    {"name": "Jaipur", "label": "Jaipur Pink City, Rajasthan, India", "latitude": 26.9124, "longitude": 75.7873, "country": "India", "region": "Rajasthan", "city": "Jaipur"},
    {"name": "Manali", "label": "Manali Hill Station, Himachal Pradesh, India", "latitude": 32.2432, "longitude": 77.1892, "country": "India", "region": "Himachal Pradesh", "city": "Manali"},
    {"name": "Shimla", "label": "Shimla, Himachal Pradesh, India", "latitude": 31.1048, "longitude": 77.1734, "country": "India", "region": "Himachal Pradesh", "city": "Shimla"},
    {"name": "Agra", "label": "Agra (Taj Mahal), Uttar Pradesh, India", "latitude": 27.1767, "longitude": 78.0081, "country": "India", "region": "Uttar Pradesh", "city": "Agra"},
    {"name": "Varanasi", "label": "Varanasi (Kashi), Uttar Pradesh, India", "latitude": 25.3176, "longitude": 82.9739, "country": "India", "region": "Uttar Pradesh", "city": "Varanasi"},
    {"name": "Udaipur", "label": "Udaipur City of Lakes, Rajasthan, India", "latitude": 24.5854, "longitude": 73.7125, "country": "India", "region": "Rajasthan", "city": "Udaipur"},
    {"name": "Leh", "label": "Leh, Ladakh, India", "latitude": 34.1526, "longitude": 77.5771, "country": "India", "region": "Ladakh", "city": "Leh"},
    {"name": "Srinagar", "label": "Srinagar, Kashmir, India", "latitude": 34.0837, "longitude": 74.7973, "country": "India", "region": "Jammu & Kashmir", "city": "Srinagar"},
    {"name": "Chennai", "label": "Chennai (Madras), Tamil Nadu, India", "latitude": 13.0827, "longitude": 80.2707, "country": "India", "region": "Tamil Nadu", "city": "Chennai"},
    {"name": "Hyderabad", "label": "Hyderabad, Telangana, India", "latitude": 17.3850, "longitude": 78.4867, "country": "India", "region": "Telangana", "city": "Hyderabad"},
    {"name": "Kolkata", "label": "Kolkata (Calcutta), West Bengal, India", "latitude": 22.5726, "longitude": 88.3639, "country": "India", "region": "West Bengal", "city": "Kolkata"},
    {"name": "Pune", "label": "Pune, Maharashtra, India", "latitude": 18.5204, "longitude": 73.8567, "country": "India", "region": "Maharashtra", "city": "Pune"},
    {"name": "Ahmedabad", "label": "Ahmedabad, Gujarat, India", "latitude": 23.0225, "longitude": 72.5714, "country": "India", "region": "Gujarat", "city": "Ahmedabad"},
    {"name": "Bangalore (Bengaluru)", "label": "Bengaluru, Karnataka, India", "latitude": 12.9716, "longitude": 77.5946, "country": "India", "region": "Karnataka", "city": "Bengaluru"},
    {"name": "Mysore (Mysuru)", "label": "Mysuru Palace City, Karnataka, India", "latitude": 12.2958, "longitude": 76.6394, "country": "India", "region": "Karnataka", "city": "Mysuru"},
    {"name": "Coimbatore", "label": "Coimbatore, Tamil Nadu, India", "latitude": 11.0168, "longitude": 76.9558, "country": "India", "region": "Tamil Nadu", "city": "Coimbatore"},
    {"name": "Madurai", "label": "Madurai Temple City, Tamil Nadu, India", "latitude": 9.9252, "longitude": 78.1198, "country": "India", "region": "Tamil Nadu", "city": "Madurai"},
    {"name": "Kanyakumari", "label": "Kanyakumari Cape Comorin, Tamil Nadu, India", "latitude": 8.0883, "longitude": 77.5385, "country": "India", "region": "Tamil Nadu", "city": "Kanyakumari"},
    {"name": "Rameswaram", "label": "Rameswaram & Dhanushkodi, Tamil Nadu, India", "latitude": 9.2876, "longitude": 79.3129, "country": "India", "region": "Tamil Nadu", "city": "Rameswaram"},
    {"name": "Ooty", "label": "Udhagamandalam (Ooty), Nilgiris, Tamil Nadu, India", "latitude": 11.4102, "longitude": 76.6950, "country": "India", "region": "Tamil Nadu", "city": "Ooty"},
    {"name": "Kodaikanal", "label": "Kodaikanal Princess of Hills, Dindigul, Tamil Nadu, India", "latitude": 10.2381, "longitude": 77.4892, "country": "India", "region": "Tamil Nadu", "city": "Kodaikanal"},

    # Kerala Destinations & Spots
    {"name": "Kochi", "label": "Kochi (Cochin), Ernakulam, Kerala, India", "latitude": 9.9312, "longitude": 76.2673, "country": "India", "region": "Kerala", "city": "Kochi"},
    {"name": "Ernakulam", "label": "Ernakulam, Kochi, Kerala, India", "latitude": 9.9816, "longitude": 76.2999, "country": "India", "region": "Kerala", "city": "Kochi"},
    {"name": "Fort Kochi", "label": "Fort Kochi, Ernakulam, Kerala, India", "latitude": 9.9658, "longitude": 76.2421, "country": "India", "region": "Kerala", "city": "Kochi"},
    {"name": "Cochin International Airport", "label": "Cochin International Airport (COK), Nedumbassery, Kerala, India", "latitude": 10.1518, "longitude": 76.3930, "country": "India", "region": "Kerala", "city": "Nedumbassery"},
    {"name": "Aluva", "label": "Aluva, Ernakulam, Kerala, India", "latitude": 10.1076, "longitude": 76.3516, "country": "India", "region": "Kerala", "city": "Aluva"},
    {"name": "Munnar", "label": "Munnar, Idukki District, Kerala, India", "latitude": 10.0889, "longitude": 77.0595, "country": "India", "region": "Kerala", "city": "Munnar"},
    {"name": "Kanthalloor", "label": "Kanthalloor Fruit Orchards, Devikulam, Idukki, Kerala, India", "latitude": 10.2132, "longitude": 77.1982, "country": "India", "region": "Kerala", "city": "Kanthalloor"},
    {"name": "Marayoor", "label": "Marayoor Sandalwood Forests, Idukki, Kerala, India", "latitude": 10.2783, "longitude": 77.1594, "country": "India", "region": "Kerala", "city": "Marayoor"},
    {"name": "Vattavada", "label": "Vattavada Vegetable Village, Munnar, Idukki, Kerala, India", "latitude": 10.1837, "longitude": 77.2573, "country": "India", "region": "Kerala", "city": "Vattavada"},
    {"name": "Anakulam", "label": "Anakulam Elephant River Spot, Mankulam, Idukki, Kerala, India", "latitude": 10.1608, "longitude": 76.9126, "country": "India", "region": "Kerala", "city": "Mankulam"},
    {"name": "Mankulam", "label": "Mankulam Eco Village, Idukki, Kerala, India", "latitude": 10.1265, "longitude": 76.9387, "country": "India", "region": "Kerala", "city": "Mankulam"},
    {"name": "Chinnakanal", "label": "Chinnakanal, Munnar, Idukki, Kerala, India", "latitude": 10.0270, "longitude": 77.1585, "country": "India", "region": "Kerala", "city": "Chinnakanal"},
    {"name": "Mattupetty", "label": "Mattupetty Dam & Lake, Munnar, Idukki, Kerala, India", "latitude": 10.1054, "longitude": 77.1245, "country": "India", "region": "Kerala", "city": "Munnar"},
    {"name": "Devikulam", "label": "Devikulam, Idukki, Kerala, India", "latitude": 10.0617, "longitude": 77.1037, "country": "India", "region": "Kerala", "city": "Devikulam"},
    {"name": "Suryanelli", "label": "Suryanelli, Kolukkumalai Base, Idukki, Kerala, India", "latitude": 10.0381, "longitude": 77.1408, "country": "India", "region": "Kerala", "city": "Suryanelli"},
    {"name": "Kolukkumalai", "label": "Kolukkumalai Tea Estate, Highest Peak, Idukki, India", "latitude": 10.0827, "longitude": 77.2281, "country": "India", "region": "Kerala", "city": "Munnar"},
    {"name": "Top Station", "label": "Top Station Scenic Viewpoint, Munnar, Kerala, India", "latitude": 10.1226, "longitude": 77.2447, "country": "India", "region": "Kerala", "city": "Munnar"},
    {"name": "Adimali", "label": "Adimali High Range Foothills, Idukki, Kerala, India", "latitude": 10.0402, "longitude": 76.9554, "country": "India", "region": "Kerala", "city": "Adimali"},
    {"name": "Anachal", "label": "Anachal, Munnar, Idukki, Kerala, India", "latitude": 10.0234, "longitude": 77.0189, "country": "India", "region": "Kerala", "city": "Anachal"},
    {"name": "Idukki", "label": "Idukki Arch Dam & Wildlife, Kerala, India", "latitude": 9.8517, "longitude": 76.9744, "country": "India", "region": "Kerala", "city": "Idukki"},
    {"name": "Cheruthoni", "label": "Cheruthoni, Idukki, Kerala, India", "latitude": 9.8732, "longitude": 76.9538, "country": "India", "region": "Kerala", "city": "Cheruthoni"},
    {"name": "Kattappana", "label": "Kattappana Commercial Capital, Idukki, Kerala, India", "latitude": 9.7431, "longitude": 77.1197, "country": "India", "region": "Kerala", "city": "Kattappana"},
    {"name": "Nedumkandam", "label": "Nedumkandam Spice Hub, Idukki, Kerala, India", "latitude": 9.8336, "longitude": 77.1642, "country": "India", "region": "Kerala", "city": "Nedumkandam"},
    {"name": "Ramakkalmedu", "label": "Ramakkalmedu Windmills, Idukki, Kerala, India", "latitude": 9.8037, "longitude": 77.2415, "country": "India", "region": "Kerala", "city": "Ramakkalmedu"},
    {"name": "Vagamon", "label": "Vagamon Pine Forests & Meadows, Kottayam/Idukki, Kerala, India", "latitude": 9.6896, "longitude": 76.9056, "country": "India", "region": "Kerala", "city": "Vagamon"},
    {"name": "Illikkal Kallu", "label": "Illikkal Kallu Peak, Kottayam, Kerala, India", "latitude": 9.7214, "longitude": 76.8263, "country": "India", "region": "Kerala", "city": "Moonnilavu"},
    {"name": "Kuttikkanam", "label": "Kuttikkanam Hill Station, Peermade, Idukki, Kerala, India", "latitude": 9.5815, "longitude": 76.9687, "country": "India", "region": "Kerala", "city": "Kuttikkanam"},
    {"name": "Parunthumpara", "label": "Parunthumpara Eagle Rock, Peerumedu, Idukki, Kerala, India", "latitude": 9.6053, "longitude": 77.0189, "country": "India", "region": "Kerala", "city": "Peerumedu"},
    {"name": "Thekkady (Kumily)", "label": "Thekkady, Periyar Tiger Reserve, Kumily, Kerala, India", "latitude": 9.6031, "longitude": 77.1615, "country": "India", "region": "Kerala", "city": "Kumily"},
    {"name": "Gavi", "label": "Gavi Eco-tourism & Forests, Pathanamthitta, Kerala, India", "latitude": 9.4350, "longitude": 77.1667, "country": "India", "region": "Kerala", "city": "Gavi"},
    {"name": "Varkala", "label": "Varkala Beach & Papanasam, Thiruvananthapuram, Kerala, India", "latitude": 8.7379, "longitude": 76.7163, "country": "India", "region": "Kerala", "city": "Varkala"},
    {"name": "Varkala Cliff", "label": "North Cliff, Varkala, Kerala, India", "latitude": 8.7402, "longitude": 76.7042, "country": "India", "region": "Kerala", "city": "Varkala"},
    {"name": "Alleppey (Alappuzha)", "label": "Alappuzha (Alleppey) Backwaters, Kerala, India", "latitude": 9.4981, "longitude": 76.3388, "country": "India", "region": "Kerala", "city": "Alappuzha"},
    {"name": "Kumarakom", "label": "Kumarakom Bird Sanctuary & Lake, Kottayam, Kerala, India", "latitude": 9.6175, "longitude": 76.4301, "country": "India", "region": "Kerala", "city": "Kumarakom"},
    {"name": "Marari Beach", "label": "Marari Beach, Mararikulam, Alappuzha, Kerala, India", "latitude": 9.6006, "longitude": 76.2995, "country": "India", "region": "Kerala", "city": "Mararikulam"},
    {"name": "Champakulam", "label": "Champakulam Snake Boat Hub, Kuttanad, Alappuzha, Kerala, India", "latitude": 9.4087, "longitude": 76.4024, "country": "India", "region": "Kerala", "city": "Champakulam"},
    {"name": "Wayanad", "label": "Wayanad, Kalpetta, Kerala, India", "latitude": 11.6050, "longitude": 76.0829, "country": "India", "region": "Kerala", "city": "Kalpetta"},
    {"name": "Kalpetta", "label": "Kalpetta, Wayanad, Kerala, India", "latitude": 11.6050, "longitude": 76.0829, "country": "India", "region": "Kerala", "city": "Kalpetta"},
    {"name": "Vythiri", "label": "Vythiri Rainforests & Resorts, Wayanad, Kerala, India", "latitude": 11.5502, "longitude": 76.0392, "country": "India", "region": "Kerala", "city": "Vythiri"},
    {"name": "Meppadi", "label": "Meppadi Chembra Peak Base, Wayanad, Kerala, India", "latitude": 11.5546, "longitude": 76.1264, "country": "India", "region": "Kerala", "city": "Meppadi"},
    {"name": "Sulthan Bathery", "label": "Sulthan Bathery, Wayanad, Kerala, India", "latitude": 11.6626, "longitude": 76.2570, "country": "India", "region": "Kerala", "city": "Sulthan Bathery"},
    {"name": "Mananthavady", "label": "Mananthavady, Wayanad, Kerala, India", "latitude": 11.8026, "longitude": 76.0034, "country": "India", "region": "Kerala", "city": "Mananthavady"},
    {"name": "Banasura Sagar Dam", "label": "Banasura Sagar Dam, Wayanad, Kerala, India", "latitude": 11.6683, "longitude": 75.9572, "country": "India", "region": "Kerala", "city": "Padinjarathara"},
    {"name": "Athirappilly", "label": "Athirappilly Waterfalls, Chalakkudy, Thrissur, Kerala, India", "latitude": 10.2851, "longitude": 76.5698, "country": "India", "region": "Kerala", "city": "Chalakkudy"},
    {"name": "Vazhachal", "label": "Vazhachal Waterfalls & Sholayar, Thrissur, Kerala, India", "latitude": 10.3015, "longitude": 76.5912, "country": "India", "region": "Kerala", "city": "Vazhachal"},
    {"name": "Kovalam", "label": "Kovalam Lighthouse Beach, Thiruvananthapuram, Kerala, India", "latitude": 8.4004, "longitude": 76.9787, "country": "India", "region": "Kerala", "city": "Kovalam"},
    {"name": "Poovar", "label": "Poovar Island & Golden Sand Beach, Thiruvananthapuram, Kerala, India", "latitude": 8.3188, "longitude": 77.0620, "country": "India", "region": "Kerala", "city": "Poovar"},
    {"name": "Ponmudi", "label": "Ponmudi Misty Peaks, Thiruvananthapuram, Kerala, India", "latitude": 8.7600, "longitude": 77.1167, "country": "India", "region": "Kerala", "city": "Ponmudi"},
    {"name": "Munroe Island", "label": "Munroe Island Canal Backwaters, Kollam, Kerala, India", "latitude": 8.9950, "longitude": 76.6117, "country": "India", "region": "Kerala", "city": "Munroe Island"},
    {"name": "Thenmala", "label": "Thenmala Eco-tourism & Dam, Kollam, Kerala, India", "latitude": 8.9583, "longitude": 77.0625, "country": "India", "region": "Kerala", "city": "Thenmala"},
    {"name": "Nelliyampathy", "label": "Nelliyampathy Orange & Tea Hills, Palakkad, Kerala, India", "latitude": 10.5342, "longitude": 76.6936, "country": "India", "region": "Kerala", "city": "Nelliyampathy"},
    {"name": "Silent Valley", "label": "Silent Valley National Park, Palakkad, Kerala, India", "latitude": 11.1342, "longitude": 76.4278, "country": "India", "region": "Kerala", "city": "Mannarkkad"},
    {"name": "Bekal", "label": "Bekal Fort & Beach, Kasaragod, Kerala, India", "latitude": 12.3926, "longitude": 75.0315, "country": "India", "region": "Kerala", "city": "Bekal"},
    {"name": "Ranipuram", "label": "Ranipuram Hills, Kasaragod, Kerala, India", "latitude": 12.4286, "longitude": 75.3582, "country": "India", "region": "Kerala", "city": "Ranipuram"},
    {"name": "Cherai Beach", "label": "Cherai Beach, Vypin Island, Kochi, Kerala, India", "latitude": 10.1416, "longitude": 76.1783, "country": "India", "region": "Kerala", "city": "Cherai"},
    {"name": "Kothamangalam", "label": "Kothamangalam Gateway to Highrange, Ernakulam, Kerala, India", "latitude": 10.0634, "longitude": 76.6268, "country": "India", "region": "Kerala", "city": "Kothamangalam"},
    {"name": "Muvattupuzha", "label": "Muvattupuzha River City, Ernakulam, Kerala, India", "latitude": 9.9894, "longitude": 76.5790, "country": "India", "region": "Kerala", "city": "Muvattupuzha"},
    {"name": "Thodupuzha", "label": "Thodupuzha, Idukki, Kerala, India", "latitude": 9.8959, "longitude": 76.7184, "country": "India", "region": "Kerala", "city": "Thodupuzha"},
    {"name": "Pala", "label": "Pala Town, Kottayam, Kerala, India", "latitude": 9.7118, "longitude": 76.6836, "country": "India", "region": "Kerala", "city": "Pala"},
    {"name": "Changanassery", "label": "Changanassery, Kottayam, Kerala, India", "latitude": 9.4449, "longitude": 76.5383, "country": "India", "region": "Kerala", "city": "Changanassery"},
    {"name": "Trivandrum (Thiruvananthapuram)", "label": "Thiruvananthapuram Capital, Kerala, India", "latitude": 8.5241, "longitude": 76.9366, "country": "India", "region": "Kerala", "city": "Thiruvananthapuram"},
    {"name": "Calicut (Kozhikode)", "label": "Kozhikode (Calicut) City, Kerala, India", "latitude": 11.2588, "longitude": 75.7804, "country": "India", "region": "Kerala", "city": "Kozhikode"},
    {"name": "Thrissur", "label": "Thrissur Cultural Capital, Kerala, India", "latitude": 10.5276, "longitude": 76.2144, "country": "India", "region": "Kerala", "city": "Thrissur"},
    {"name": "Kollam", "label": "Kollam (Quilon) Port City, Kerala, India", "latitude": 8.8932, "longitude": 76.6141, "country": "India", "region": "Kerala", "city": "Kollam"},
    {"name": "Kottayam", "label": "Kottayam City of Lakes & Letters, Kerala, India", "latitude": 9.5916, "longitude": 76.5222, "country": "India", "region": "Kerala", "city": "Kottayam"},
    {"name": "Palakkad", "label": "Palakkad Gap Gateway, Kerala, India", "latitude": 10.7867, "longitude": 76.6548, "country": "India", "region": "Kerala", "city": "Palakkad"},
    {"name": "Kannur", "label": "Kannur Theyyam & Beaches, Kerala, India", "latitude": 11.8745, "longitude": 75.3704, "country": "India", "region": "Kerala", "city": "Kannur"},
    {"name": "Kasaragod", "label": "Kasaragod Northern Border, Kerala, India", "latitude": 12.5102, "longitude": 74.9852, "country": "India", "region": "Kerala", "city": "Kasaragod"},

    # Island Territories (Lakshadweep & Andaman)
    {"name": "Lakshadweep", "label": "Lakshadweep Islands (Kavaratti / Agatti), India", "latitude": 10.5669, "longitude": 72.6420, "country": "India", "region": "Lakshadweep", "city": "Kavaratti", "is_island": True},
    {"name": "Agatti Island", "label": "Agatti Island & Airport (AGX), Lakshadweep, India", "latitude": 10.8247, "longitude": 72.1760, "country": "India", "region": "Lakshadweep", "city": "Agatti", "is_island": True},
    {"name": "Kavaratti", "label": "Kavaratti Capital, Lakshadweep, India", "latitude": 10.5669, "longitude": 72.6420, "country": "India", "region": "Lakshadweep", "city": "Kavaratti", "is_island": True},
    {"name": "Bangaram Island", "label": "Bangaram Atoll Island Resort, Lakshadweep, India", "latitude": 10.9392, "longitude": 72.2897, "country": "India", "region": "Lakshadweep", "city": "Bangaram", "is_island": True},
    {"name": "Minicoy", "label": "Minicoy Island (Maliku), Lakshadweep, India", "latitude": 8.2833, "longitude": 73.0500, "country": "India", "region": "Lakshadweep", "city": "Minicoy", "is_island": True},
    {"name": "Kadmat Island", "label": "Kadmat Island Marine Reserve, Lakshadweep, India", "latitude": 11.2333, "longitude": 72.7833, "country": "India", "region": "Lakshadweep", "city": "Kadmat", "is_island": True},
    {"name": "Port Blair", "label": "Port Blair (Veer Savarkar Airport IXZ), Andaman & Nicobar, India", "latitude": 11.6234, "longitude": 92.7265, "country": "India", "region": "Andaman and Nicobar", "city": "Port Blair", "is_island": True},
    {"name": "Havelock Island", "label": "Havelock Island (Swaraj Dweep), Andaman, India", "latitude": 11.9761, "longitude": 92.9876, "country": "India", "region": "Andaman and Nicobar", "city": "Havelock", "is_island": True}
]

# Fuzzy spellings & alternative aliases
FUZZY_ALIASES = {
    "dubai": "Dubai",
    "dxb": "Dubai",
    "uae": "Dubai",
    "abu dhabi": "Abu Dhabi",
    "abudhabi": "Abu Dhabi",
    "sharjah": "Sharjah",
    "singapore": "Singapore",
    "singapur": "Singapore",
    "bangkok": "Bangkok",
    "phuket": "Phuket",
    "bali": "Bali",
    "maldives": "Maldives",
    "male": "Maldives",
    "london": "London",
    "paris": "Paris",
    "tokyo": "Tokyo",
    "new york": "New York",
    "nyc": "New York",
    "rome": "Rome",
    "doha": "Doha",
    "muscat": "Muscat",
    "riyadh": "Riyadh",
    "colombo": "Colombo",
    "goa": "Goa",
    "mumbai": "Mumbai",
    "bombay": "Mumbai",
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "jaipur": "Jaipur",
    "manali": "Manali",
    "shimla": "Shimla",
    "agra": "Agra",
    "varanasi": "Varanasi",
    "kashi": "Varanasi",
    "udaipur": "Udaipur",
    "ladakh": "Leh",
    "leh": "Leh",
    "srinagar": "Srinagar",
    "kashmir": "Srinagar",
    "chennai": "Chennai",
    "madras": "Chennai",
    "hyderabad": "Hyderabad",
    "kolkata": "Kolkata",
    "calcutta": "Kolkata",
    "bangalore": "Bangalore (Bengaluru)",
    "bengaluru": "Bangalore (Bengaluru)",
    "kallanthor": "Kanthalloor",
    "kallanthoor": "Kanthalloor",
    "kallanthur": "Kanthalloor",
    "kanthaloor": "Kanthalloor",
    "kanthallur": "Kanthalloor",
    "kandalloor": "Kanthalloor",
    "maryoor": "Marayoor",
    "marayur": "Marayoor",
    "munar": "Munnar",
    "alappuzha": "Alleppey (Alappuzha)",
    "alleppey": "Alleppey (Alappuzha)",
    "varkala cliff": "Varkala Cliff",
    "thekady": "Thekkady (Kumily)",
    "thekkadi": "Thekkady (Kumily)",
    "kumily": "Thekkady (Kumily)",
    "kumili": "Thekkady (Kumily)",
    "cochin": "Kochi",
    "trivandrum": "Trivandrum (Thiruvananthapuram)",
    "thiruvananthapuram": "Trivandrum (Thiruvananthapuram)",
    "calicut": "Calicut (Kozhikode)",
    "kozhikode": "Calicut (Kozhikode)",
    "anakulam": "Anakulam",
    "mankulam": "Mankulam",
    "vattavada": "Vattavada",
    "illikkal": "Illikkal Kallu",
    "illikkal kallu": "Illikkal Kallu",
    "vagamon": "Vagamon",
    "lakshadweep": "Lakshadweep",
    "lakshadeep": "Lakshadweep",
    "lakshadweep islands": "Lakshadweep",
    "lakshadweep island": "Lakshadweep",
    "lakshdweep": "Lakshadweep",
    "agatti": "Agatti Island",
    "agatti island": "Agatti Island",
    "agx": "Agatti Island",
    "kavaratti": "Kavaratti",
    "bangaram": "Bangaram Island",
    "bangaram island": "Bangaram Island",
    "minicoy": "Minicoy",
    "kadmat": "Kadmat Island",
    "andaman": "Port Blair",
    "andaman and nicobar": "Port Blair",
    "andaman islands": "Port Blair",
    "port blair": "Port Blair",
    "ixz": "Port Blair",
    "havelock": "Havelock Island",
    "swaraj dweep": "Havelock Island"
}

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def search_geocode(query: str, limit: int = 6):
    """
    Geocodes a search string into structured location suggestions with coordinates.
    Searches:
    1. Local curated database (instant 0ms response & fuzzy matching for global and regional hubs).
    2. OpenStreetMap Nominatim API (covers any country, city, town, village, or POI worldwide).
    3. OpenRouteService Geocoding API if key configured.
    """
    q = str(query or "").strip()
    if not q or len(q) < 2:
        return []

    q_lower = q.lower()
    # Resolve fuzzy aliases (e.g. dubai -> Dubai, dxb -> Dubai, kallanthor -> Kanthalloor)
    if q_lower in FUZZY_ALIASES:
        target_name = FUZZY_ALIASES[q_lower]
        q_lower = target_name.lower()
        q = target_name

    # 1. Check in-memory cache
    if q_lower in GEOCODE_CACHE:
        cache_time, cached_results = GEOCODE_CACHE[q_lower]
        if time.time() - cache_time < CACHE_TTL_SECONDS:
            return cached_results

    results = []
    seen_coords = set()

    def add_unique(item):
        key = f"{round(float(item['latitude']), 4)}_{round(float(item['longitude']), 4)}"
        if key not in seen_coords:
            seen_coords.add(key)
            results.append(item)

    # 2. Match from local POPULAR_LOCATIONS first
    exact_matches = []
    prefix_matches = []
    contains_matches = []
    token_matches = []
    q_tokens = [t for t in q_lower.split() if len(t) >= 3 and t not in ("near", "from", "the", "and", "via", "to")]

    for item in POPULAR_LOCATIONS:
        n_low = item["name"].lower()
        l_low = item["label"].lower()
        c_low = item.get("city", "").lower()
        
        if n_low == q_lower or c_low == q_lower:
            exact_matches.append(item)
        elif n_low.startswith(q_lower) or c_low.startswith(q_lower):
            prefix_matches.append(item)
        elif q_lower in n_low or q_lower in l_low:
            contains_matches.append(item)
        elif any(t in n_low or t in l_low for t in q_tokens) or n_low in q_lower:
            token_matches.append(item)

    for it in (exact_matches + prefix_matches + contains_matches + token_matches):
        add_unique(it)
        if len(results) >= limit:
            break

    # 3. Live global search via OpenStreetMap Nominatim for all destinations & spots worldwide
    if len(results) < limit:
        try:
            nom_url = "https://nominatim.openstreetmap.org/search"
            nom_params = {
                "q": q,
                "format": "json",
                "limit": limit,
                "addressdetails": 1,
                "accept-language": "en"
            }
            nom_headers = {
                "User-Agent": "AIPlannerGlobal/2.0 (contact@travelplanner.org)"
            }
            resp = requests.get(nom_url, params=nom_params, headers=nom_headers, timeout=3.0)
            if resp.status_code == 200:
                items = resp.json()
                for it in items:
                    lat = float(it.get("lat", 0))
                    lon = float(it.get("lon", 0))
                    if lat and lon:
                        display = it.get("display_name", "")
                        addr = it.get("address", {})
                        p_name = it.get("name") or (display.split(",")[0].strip() if display else q.title())
                        city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb") or addr.get("municipality") or addr.get("county") or p_name
                        state = addr.get("state") or addr.get("region") or addr.get("province") or ""
                        country = addr.get("country", "")

                        label_parts = [p_name]
                        if city and city != p_name:
                            label_parts.append(city)
                        if state and state != city:
                            label_parts.append(state)
                        if country:
                            label_parts.append(country)
                        formatted_label = display or ", ".join(label_parts)

                        add_unique({
                            "name": p_name,
                            "label": formatted_label,
                            "latitude": round(lat, 6),
                            "longitude": round(lon, 6),
                            "country": country,
                            "region": state,
                            "city": city
                        })
                        if len(results) >= limit:
                            break
        except Exception:
            pass

    # 4. Fallback search on CSV database if still empty
    if not results:
        try:
            from backend.utils.csv_manager import get_rows
            dests = get_rows("destinations")
            for d in dests:
                d_name = d.get("name", "")
                if d_name.lower() in q_lower or q_lower in d_name.lower():
                    match = next((p for p in POPULAR_LOCATIONS if p["name"].lower() == d_name.lower()), None)
                    if match:
                        add_unique(match)
                        break
        except Exception:
            pass

    # 5. Final fallback object if absolutely no results found
    if not results and len(q) >= 2:
        is_dubai = "dubai" in q_lower or "uae" in q_lower
        results.append({
            "name": q.title(),
            "label": "Dubai, United Arab Emirates" if is_dubai else q.title(),
            "latitude": 25.2048 if is_dubai else 9.9312,
            "longitude": 55.2708 if is_dubai else 76.2673,
            "country": "United Arab Emirates" if is_dubai else "India",
            "region": "Dubai Emirate" if is_dubai else "Kerala",
            "city": "Dubai" if is_dubai else q.title()
        })

    final_results = results[:limit]
    GEOCODE_CACHE[q_lower] = (time.time(), final_results)
    return final_results

def reverse_geocode(lat: float, lon: float):
    """
    Reverse geocodes a [lat, lon] pair to a human-readable place name and locality.
    Uses:
    1. OpenStreetMap Nominatim reverse geocode (exact village/town/road).
    2. OpenRouteService Reverse Geocode if configured.
    3. Closest known hub in local index.
    """
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return {
            "name": "Custom Location",
            "label": "Custom Selected Point",
            "latitude": 9.9312,
            "longitude": 76.2673,
            "country": "India",
            "region": "Kerala",
            "city": "Kochi"
        }

    cache_key = f"{round(lat, 4)}_{round(lon, 4)}"
    if cache_key in REVERSE_GEOCODE_CACHE:
        c_time, c_val = REVERSE_GEOCODE_CACHE[cache_key]
        if time.time() - c_time < CACHE_TTL_SECONDS:
            return c_val

    # 1. Quick proximity match with curated POPULAR_LOCATIONS (< 0.02 deg ~ 2 km)
    for loc in POPULAR_LOCATIONS:
        if abs(loc["latitude"] - lat) < 0.015 and abs(loc["longitude"] - lon) < 0.015:
            res_obj = {
                "name": loc["name"],
                "label": loc["label"],
                "latitude": lat,
                "longitude": lon,
                "country": loc.get("country", "India"),
                "region": loc.get("region", "Kerala"),
                "city": loc.get("city", loc["name"])
            }
            REVERSE_GEOCODE_CACHE[cache_key] = (time.time(), res_obj)
            return res_obj

    # 2. Try OpenStreetMap Nominatim Reverse Geocoding
    try:
        nom_url = "https://nominatim.openstreetmap.org/reverse"
        nom_params = {
            "lat": lat,
            "lon": lon,
            "format": "json",
            "addressdetails": 1,
            "accept-language": "en"
        }
        nom_headers = {
            "User-Agent": "AIPlannerGlobal/2.0 (contact@travelplanner.org)"
        }
        resp = requests.get(nom_url, params=nom_params, headers=nom_headers, timeout=3.0)
        if resp.status_code == 200:
            data = resp.json()
            display = data.get("display_name", "")
            addr = data.get("address", {})
            p_name = data.get("name") or addr.get("village") or addr.get("town") or addr.get("suburb") or addr.get("city") or (display.split(",")[0].strip() if display else f"Point ({round(lat, 3)}, {round(lon, 3)})")
            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality") or addr.get("county") or p_name
            state = addr.get("state") or addr.get("region") or addr.get("province") or ""
            country = addr.get("country", "")

            label_parts = [p_name]
            if city and city != p_name:
                label_parts.append(city)
            if state and state != city:
                label_parts.append(state)
            if country:
                label_parts.append(country)
            formatted_label = display or ", ".join(label_parts)

            result_obj = {
                "name": p_name,
                "label": formatted_label,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "country": country or "India",
                "region": state or "Kerala",
                "city": city
            }
            REVERSE_GEOCODE_CACHE[cache_key] = (time.time(), result_obj)
            return result_obj
    except Exception:
        pass

    # 2. Try OpenRouteService Reverse Geocode if API key present
    ors_key = (Config.ORS_API_KEY or "").strip()
    if ors_key and not ors_key.startswith("placeholder") and not "placeholder" in ors_key:
        try:
            url = f"{Config.ORS_BASE_URL}/geocode/reverse"
            params = {
                "api_key": ors_key,
                "point.lat": lat,
                "point.lon": lon,
                "size": 1
            }
            resp = requests.get(url, params=params, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if features:
                    props = features[0].get("properties", {})
                    name = props.get("name") or props.get("locality") or props.get("label", f"Point ({round(lat, 3)}, {round(lon, 3)})")
                    label = props.get("label") or f"{name}, India"
                    country = props.get("country", "India")
                    region = props.get("region", "Kerala")
                    city = props.get("locality") or props.get("county") or name
                    result_obj = {
                        "name": name,
                        "label": label,
                        "latitude": round(lat, 6),
                        "longitude": round(lon, 6),
                        "country": country,
                        "region": region,
                        "city": city
                    }
                    REVERSE_GEOCODE_CACHE[cache_key] = (time.time(), result_obj)
                    return result_obj
        except Exception:
            pass

    # 3. Nearest known location in indexed dataset
    closest_loc = None
    min_dist = float("inf")

    for item in POPULAR_LOCATIONS:
        dist = haversine_km(lat, lon, item["latitude"], item["longitude"])
        if dist < min_dist:
            min_dist = dist
            closest_loc = item

    if closest_loc:
        if min_dist < 4.0:
            result_obj = {
                "name": closest_loc["name"],
                "label": closest_loc["label"],
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "country": closest_loc.get("country", "India"),
                "region": closest_loc.get("region", "Kerala"),
                "city": closest_loc.get("city", closest_loc["name"])
            }
            REVERSE_GEOCODE_CACHE[cache_key] = (time.time(), result_obj)
            return result_obj
        elif min_dist < 45.0:
            result_obj = {
                "name": f"Near {closest_loc['name']}",
                "label": f"Near {closest_loc['name']} (~{round(min_dist, 1)} km), {closest_loc.get('region', 'Kerala')}, India",
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "country": closest_loc.get("country", "India"),
                "region": closest_loc.get("region", "Kerala"),
                "city": closest_loc.get("city", closest_loc["name"])
            }
            REVERSE_GEOCODE_CACHE[cache_key] = (time.time(), result_obj)
            return result_obj

    # General point fallback
    result_obj = {
        "name": f"Location ({round(lat, 3)}, {round(lon, 3)})",
        "label": f"Location ({round(lat, 4)}, {round(lon, 4)}), Kerala, India",
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "country": "India",
        "region": "Kerala",
        "city": "Kerala"
    }
    REVERSE_GEOCODE_CACHE[cache_key] = (time.time(), result_obj)
    return result_obj
