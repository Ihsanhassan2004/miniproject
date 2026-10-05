// Client-side Transit & Cost Estimation Engine for instant real-time calculation

export const KNOWN_COORDINATES = {
  // Global & Foreign Origin Hubs
  // Saudi Arabia
  "al ahsa": { lat: 25.3833, lon: 49.5833, is_international: true, country: "Saudi Arabia", airport: "DMM", airport_name: "King Fahd International Airport (DMM) / Al-Ahsa" },
  "al-ahsa": { lat: 25.3833, lon: 49.5833, is_international: true, country: "Saudi Arabia", airport: "DMM", airport_name: "King Fahd International Airport (DMM)" },
  "al ahsa governorate": { lat: 25.3833, lon: 49.5833, is_international: true, country: "Saudi Arabia", airport: "DMM", airport_name: "King Fahd International Airport (DMM) / Al-Ahsa" },
  "hofuf": { lat: 25.3647, lon: 49.5883, is_international: true, country: "Saudi Arabia", airport: "HOF", airport_name: "Al-Ahsa International Airport (HOF)" },
  "dammam": { lat: 26.4207, lon: 50.0888, is_international: true, country: "Saudi Arabia", airport: "DMM", airport_name: "King Fahd International Airport (DMM)" },
  "khobar": { lat: 26.2172, lon: 50.1971, is_international: true, country: "Saudi Arabia", airport: "DMM", airport_name: "King Fahd International Airport (DMM)" },
  "dhahran": { lat: 26.2361, lon: 50.0393, is_international: true, country: "Saudi Arabia", airport: "DMM", airport_name: "King Fahd International Airport (DMM)" },
  "jubail": { lat: 27.0174, lon: 49.6225, is_international: true, country: "Saudi Arabia", airport: "DMM", airport_name: "King Fahd International Airport (DMM)" },
  "riyadh": { lat: 24.7136, lon: 46.6753, is_international: true, country: "Saudi Arabia", airport: "RUH", airport_name: "King Khalid International Airport (RUH)" },
  "jeddah": { lat: 21.4858, lon: 39.1925, is_international: true, country: "Saudi Arabia", airport: "JED", airport_name: "King Abdulaziz International Airport (JED)" },
  "mecca": { lat: 21.3891, lon: 39.8579, is_international: true, country: "Saudi Arabia", airport: "JED", airport_name: "King Abdulaziz International Airport (JED)" },
  "makkah": { lat: 21.3891, lon: 39.8579, is_international: true, country: "Saudi Arabia", airport: "JED", airport_name: "King Abdulaziz International Airport (JED)" },
  "medina": { lat: 24.5247, lon: 39.5692, is_international: true, country: "Saudi Arabia", airport: "MED", airport_name: "Prince Mohammad bin Abdulaziz Airport (MED)" },

  // UAE & Gulf
  "dubai": { lat: 25.2048, lon: 55.2708, is_international: true, country: "United Arab Emirates", airport: "DXB", airport_name: "Dubai International Airport (DXB)" },
  "dxb": { lat: 25.2048, lon: 55.2708, is_international: true, country: "United Arab Emirates", airport: "DXB", airport_name: "Dubai International Airport (DXB)" },
  "uae": { lat: 25.2048, lon: 55.2708, is_international: true, country: "United Arab Emirates", airport: "DXB", airport_name: "Dubai International Airport (DXB)" },
  "abu dhabi": { lat: 24.4539, lon: 54.3773, is_international: true, country: "United Arab Emirates", airport: "AUH", airport_name: "Zayed International Airport (AUH)" },
  "sharjah": { lat: 25.3463, lon: 55.4209, is_international: true, country: "United Arab Emirates", airport: "SHJ", airport_name: "Sharjah International Airport (SHJ)" },
  "doha": { lat: 25.2854, lon: 51.5310, is_international: true, country: "Qatar", airport: "DOH", airport_name: "Hamad International Airport (DOH)" },
  "qatar": { lat: 25.2854, lon: 51.5310, is_international: true, country: "Qatar", airport: "DOH", airport_name: "Hamad International Airport (DOH)" },
  "muscat": { lat: 23.5880, lon: 58.3829, is_international: true, country: "Oman", airport: "MCT", airport_name: "Muscat International Airport (MCT)" },
  "oman": { lat: 23.5880, lon: 58.3829, is_international: true, country: "Oman", airport: "MCT", airport_name: "Muscat International Airport (MCT)" },
  "kuwait": { lat: 29.3759, lon: 47.9774, is_international: true, country: "Kuwait", airport: "KWI", airport_name: "Kuwait International Airport (KWI)" },
  "kuwait city": { lat: 29.3759, lon: 47.9774, is_international: true, country: "Kuwait", airport: "KWI", airport_name: "Kuwait International Airport (KWI)" },
  "bahrain": { lat: 26.0667, lon: 50.5577, is_international: true, country: "Bahrain", airport: "BAH", airport_name: "Bahrain International Airport (BAH)" },
  "manama": { lat: 26.0667, lon: 50.5577, is_international: true, country: "Bahrain", airport: "BAH", airport_name: "Bahrain International Airport (BAH)" },

  // Global Hubs
  "singapore": { lat: 1.3521, lon: 103.8198, is_international: true, country: "Singapore", airport: "SIN", airport_name: "Singapore Changi Airport (SIN)" },
  "kuala lumpur": { lat: 3.1390, lon: 101.6869, is_international: true, country: "Malaysia", airport: "KUL", airport_name: "Kuala Lumpur International Airport (KUL)" },
  "bangkok": { lat: 13.7563, lon: 100.5018, is_international: true, country: "Thailand", airport: "BKK", airport_name: "Suvarnabhumi Airport (BKK)" },
  "phuket": { lat: 7.8804, lon: 98.3923, is_international: true, country: "Thailand", airport: "HKT", airport_name: "Phuket International Airport (HKT)" },
  "bali": { lat: -8.4095, lon: 115.1889, is_international: true, country: "Indonesia", airport: "DPS", airport_name: "Ngurah Rai International Airport (DPS)" },
  "maldives": { lat: 4.1755, lon: 73.5093, is_international: true, country: "Maldives", airport: "MLE", airport_name: "Velana International Airport (MLE)" },
  "colombo": { lat: 6.9271, lon: 79.8612, is_international: true, country: "Sri Lanka", airport: "CMB", airport_name: "Bandaranaike International Airport (CMB)" },
  "london": { lat: 51.5074, lon: -0.1278, is_international: true, country: "United Kingdom", airport: "LHR", airport_name: "London Heathrow Airport (LHR)" },
  "paris": { lat: 48.8566, lon: 2.3522, is_international: true, country: "France", airport: "CDG", airport_name: "Paris Charles de Gaulle Airport (CDG)" },
  "frankfurt": { lat: 50.1109, lon: 8.6821, is_international: true, country: "Germany", airport: "FRA", airport_name: "Frankfurt Airport (FRA)" },
  "new york": { lat: 40.7128, lon: -74.0060, is_international: true, country: "United States", airport: "JFK", airport_name: "John F. Kennedy International Airport (JFK)" },
  "toronto": { lat: 43.6532, lon: -79.3832, is_international: true, country: "Canada", airport: "YYZ", airport_name: "Toronto Pearson International Airport (YYZ)" },
  "sydney": { lat: -33.8688, lon: 151.2093, is_international: true, country: "Australia", airport: "SYD", airport_name: "Sydney Kingsford Smith Airport (SYD)" },
  "tokyo": { lat: 35.6762, lon: 139.6503, is_international: true, country: "Japan", airport: "HND", airport_name: "Tokyo Haneda Airport (HND)" },

  // Island Territories (Lakshadweep & Andaman)
  "lakshadweep": { lat: 10.5669, lon: 72.6420, is_island: true, airport: "AGX", airport_name: "Agatti Airport (AGX)" },
  "lakshadeep": { lat: 10.5669, lon: 72.6420, is_island: true, airport: "AGX", airport_name: "Agatti Airport (AGX)" },
  "agatti": { lat: 10.8247, lon: 72.1760, is_island: true, airport: "AGX", airport_name: "Agatti Airport (AGX)" },
  "kavaratti": { lat: 10.5669, lon: 72.6420, is_island: true, airport: "AGX", airport_name: "Agatti Airport (AGX) / Kavaratti Port" },
  "bangaram": { lat: 10.9392, lon: 72.2897, is_island: true, airport: "AGX", airport_name: "Agatti Airport (AGX)" },
  "minicoy": { lat: 8.2833, lon: 73.0500, is_island: true, airport: "AGX", airport_name: "Agatti Airport (AGX) / Minicoy Port" },
  "kadmat": { lat: 11.2333, lon: 72.7833, is_island: true, airport: "AGX", airport_name: "Agatti Airport (AGX)" },
  "andaman": { lat: 11.6234, lon: 92.7265, is_island: true, airport: "IXZ", airport_name: "Veer Savarkar International Airport (IXZ)" },
  "port blair": { lat: 11.6234, lon: 92.7265, is_island: true, airport: "IXZ", airport_name: "Veer Savarkar International Airport (IXZ)" },
  "havelock": { lat: 11.9761, lon: 92.9876, is_island: true, airport: "IXZ", airport_name: "Veer Savarkar Airport (IXZ) / Havelock Ferry" },

  // Kerala & Indian Hubs
  "kochi": { lat: 9.9312, lon: 76.2673 },
  "ernakulam": { lat: 9.9816, lon: 76.2999 },
  "munnar": { lat: 10.0889, lon: 77.0595 },
  "alleppey": { lat: 9.4981, lon: 76.3388 },
  "alappuzha": { lat: 9.4981, lon: 76.3388 },
  "varkala": { lat: 8.7379, lon: 76.7163 },
  "trivandrum": { lat: 8.5241, lon: 76.9366 },
  "thiruvananthapuram": { lat: 8.5241, lon: 76.9366 },
  "calicut": { lat: 11.2588, lon: 75.7804 },
  "kozhikode": { lat: 11.2588, lon: 75.7804 },
  "wayanad": { lat: 11.6050, lon: 76.0829 },
  "kalpetta": { lat: 11.6050, lon: 76.0829 },
  "thekkady": { lat: 9.6031, lon: 77.1615 },
  "kumily": { lat: 9.6031, lon: 77.1615 },
  "idukki": { lat: 9.8497, lon: 76.9806 },
  "vagamon": { lat: 9.6896, lon: 76.9056 },
  "athirappilly": { lat: 10.2851, lon: 76.5698 },
  "thrissur": { lat: 10.5276, lon: 76.2144 },
  "kovalam": { lat: 8.4004, lon: 76.9787 },
  "bangalore": { lat: 12.9716, lon: 77.5946 },
  "bengaluru": { lat: 12.9716, lon: 77.5946 },
  "chennai": { lat: 13.0827, lon: 80.2707 },
  "coimbatore": { lat: 11.0168, lon: 76.9558 },
  "madurai": { lat: 9.9252, lon: 78.1198 },
  "mysore": { lat: 12.2958, lon: 76.6394 },
  "mysuru": { lat: 12.2958, lon: 76.6394 },
  "mumbai": { lat: 19.0760, lon: 72.8777 },
  "delhi": { lat: 28.6139, lon: 77.2090 },
  "goa": { lat: 15.4909, lon: 73.8278 },
  "hyderabad": { lat: 17.3850, lon: 78.4867 },
  "ooty": { lat: 11.4102, lon: 76.6950 },
  "kodaikanal": { lat: 10.2381, lon: 77.4892 },
  "kannur": { lat: 11.8745, lon: 75.3704 },
  "kottayam": { lat: 9.5916, lon: 76.5222 },
  "kollam": { lat: 8.8932, lon: 76.6141 },
  "palakkad": { lat: 10.7867, lon: 76.6548 },
  "airport": { lat: 10.1518, lon: 76.3930 },
  "cochin": { lat: 9.9312, lon: 76.2673 },
  "nedumbassery": { lat: 10.1518, lon: 76.3930 },
  "aluva": { lat: 10.1076, lon: 76.3516 },
  "kakkanad": { lat: 10.0159, lon: 76.3419 },
  "fort kochi": { lat: 9.9658, lon: 76.2421 },
  "devikulam": { lat: 10.0617, lon: 77.1037 },
  "mattupetty": { lat: 10.1054, lon: 77.1245 },
  "cherthala": { lat: 9.6848, lon: 76.3317 },
  "kanthalloor": { lat: 10.2132, lon: 77.1982 },
  "marayoor": { lat: 10.2783, lon: 77.1594 },
  "vattavada": { lat: 10.1837, lon: 77.2573 },
  "anakulam": { lat: 10.1608, lon: 76.9126 },
  "mankulam": { lat: 10.1265, lon: 76.9387 },
  "chinnakanal": { lat: 10.0270, lon: 77.1585 },
  "kolukkumalai": { lat: 10.0827, lon: 77.2281 },
  "top station": { lat: 10.1226, lon: 77.2447 },
  "adimali": { lat: 10.0402, lon: 76.9554 },
  "anachal": { lat: 10.0234, lon: 77.0189 },
  "illikkal kallu": { lat: 9.7214, lon: 76.8263 },
  "kuttikkanam": { lat: 9.5815, lon: 76.9687 },
  "parunthumpara": { lat: 9.6053, lon: 77.0189 },
  "gavi": { lat: 9.4350, lon: 77.1667 },
  "kumarakom": { lat: 9.6175, lon: 76.4301 },
  "marari": { lat: 9.6006, lon: 76.2995 },
  "marari beach": { lat: 9.6006, lon: 76.2995 },
  "poovar": { lat: 8.3188, lon: 77.0620 },
  "ponmudi": { lat: 8.7600, lon: 77.1167 },
  "munroe island": { lat: 8.9950, lon: 76.6117 },
  "thenmala": { lat: 8.9583, lon: 77.0625 },
  "vazhachal": { lat: 10.3015, lon: 76.5912 },
  "vythiri": { lat: 11.5502, lon: 76.0392 },
  "meppadi": { lat: 11.5546, lon: 76.1264 },
  "sulthan bathery": { lat: 11.6626, lon: 76.2570 },
  "bekal": { lat: 12.3926, lon: 75.0315 },
  "ranipuram": { lat: 12.4286, lon: 75.3582 },
  "nelliyampathy": { lat: 10.5342, lon: 76.6936 },
  "silent valley": { lat: 11.1342, lon: 76.4278 },
  "kasaragod": { lat: 12.5102, lon: 74.9852 },
  "malappuram": { lat: 11.0732, lon: 76.0740 },
  "pathanamthitta": { lat: 9.2648, lon: 76.7870 }
};

export const ISLAND_ORIGIN_KEYWORDS = [
  'lakshadweep', 'lakshadeep', 'agatti', 'kavaratti', 'bangaram', 'minicoy', 'kadmat', 'amini', 'agx',
  'andaman', 'nicobar', 'port blair', 'havelock', 'swaraj dweep', 'neil island', 'ixz'
];

export const INTERNATIONAL_ORIGIN_KEYWORDS = [
  'saudi', 'ksa', 'al ahsa', 'al-ahsa', 'hofuf', 'dammam', 'khobar', 'dhahran', 'jubail',
  'riyadh', 'jeddah', 'mecca', 'makkah', 'medina', 'madinah', 'taif', 'tabuk', 'abha', 'yanbu', 'eastern province',
  'dubai', 'dxb', 'uae', 'united arab emirates', 'abu dhabi', 'sharjah', 'shj', 'ajman', 'ras al khaimah', 'fujairah',
  'doha', 'qatar', 'kuwait', 'kwi', 'bahrain', 'bah', 'manama', 'muscat', 'mct', 'oman', 'salalah',
  'singapore', 'sin', 'malaysia', 'kuala lumpur', 'kul', 'thailand', 'bangkok', 'bkk', 'phuket', 'hkt', 'bali', 'dps', 'jakarta',
  'maldives', 'male', 'mle', 'colombo', 'sri lanka', 'tokyo', 'japan',
  'london', 'lhr', 'uk', 'united kingdom', 'manchester', 'paris', 'cdg', 'france', 'germany', 'frankfurt', 'fra', 'amsterdam', 'zurich', 'rome',
  'new york', 'jfk', 'usa', 'united states', 'america', 'toronto', 'canada', 'sydney', 'australia'
];

export const NON_RAIL_LOCATIONS = [
  'wayanad', 'kalpetta', 'vythiri', 'sulthan bathery', 'mananthavady', 'meppadi', 'lakkidi', 'banasura',
  'munnar', 'devikulam', 'chinnakanal', 'mattupetty', 'marayoor',
  'idukki', 'vagamon', 'thekkady', 'kumily', 'athirappilly', 'vazhachal',
  'kodaikanal', 'ooty', 'coorg', 'madikeri', 'manali', 'shimla'
];

export const AIRPORT_HUBS = [
  'lakshadweep', 'lakshadeep', 'agatti', 'port blair', 'andaman',
  'al ahsa', 'dammam', 'riyadh', 'jeddah', 'medina',
  'dubai', 'dxb', 'uae', 'abu dhabi', 'sharjah', 'singapore', 'doha', 'muscat',
  'kuwait', 'bahrain', 'london', 'paris', 'new york', 'tokyo', 'bangkok', 'phuket', 'bali', 'maldives', 'colombo',
  'kochi', 'ernakulam', 'nedumbassery', 'calicut', 'kozhikode', 'trivandrum', 'thiruvananthapuram',
  'kannur', 'bangalore', 'bengaluru', 'chennai', 'coimbatore', 'madurai', 'mysore', 'mysuru',
  'mumbai', 'delhi', 'goa', 'hyderabad', 'pune', 'jaipur', 'agra'
];

/**
 * Resolves latitude and longitude coordinates from a place name, object, or search term
 */
export function getCoordinates(loc) {
  if (!loc) return null;
  if (typeof loc === 'object') {
    const lat = loc.lat != null ? loc.lat : (loc.latitude != null ? loc.latitude : loc.latitud);
    const lon = loc.lon != null ? loc.lon : (loc.longitude != null ? loc.longitude : (loc.lng != null ? loc.lng : loc.longitud));
    if (lat != null && lon != null && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
      return { lat: Number(lat), lon: Number(lon) };
    }
  }

  const nameStr = (typeof loc === 'object' ? (loc.name || loc.label || loc.query || loc.place_name || loc.city || '') : String(loc)).toLowerCase().trim();
  if (!nameStr) return null;

  // Direct exact match
  if (KNOWN_COORDINATES[nameStr]) {
    return KNOWN_COORDINATES[nameStr];
  }

  // Partial match in KNOWN_COORDINATES
  const entries = Object.entries(KNOWN_COORDINATES);
  for (const [k, coords] of entries) {
    if (nameStr.includes(k) || k.includes(nameStr)) {
      return coords;
    }
  }

  // Word token matching
  const tokens = nameStr.split(/[\s,.-]+/).filter(t => t.length > 2);
  for (const token of tokens) {
    if (KNOWN_COORDINATES[token]) {
      return KNOWN_COORDINATES[token];
    }
  }

  return null;
}

/**
 * Computes approximate distance in kilometers between two locations using the Haversine formula
 */
export function calculateDistanceKm(source, destination) {
  const p1 = getCoordinates(source);
  const p2 = getCoordinates(destination);

  if (!p1 || !p2) {
    return 130; // sensible fallback distance in km
  }

  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
  const dLon = (p2.lon - p1.lon) * (Math.PI / 180);
  const lat1 = p1.lat * (Math.PI / 180);
  const lat2 = p2.lat * (Math.PI / 180);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDist = R * c;

  if (rawDist <= 0) return 10;

  // For long distance / overseas (flights), great-circle distance is accurate.
  // For regional ground travel (<= 500km), add ~25% road winding factor.
  const isFlightOrLong = rawDist > 500;
  const factor = isFlightOrLong ? 1.05 : 1.25;

  return Math.max(5, Math.round(rawDist * factor));
}

/**
 * Formats a decimal hour number into a human-readable duration string (e.g. 2.5 -> "2h 30m")
 */
export function formatTravelDuration(hoursFloat) {
  if (!hoursFloat || isNaN(hoursFloat) || hoursFloat <= 0) return '1h';
  const totalMinutes = Math.round(hoursFloat * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours <= 0) {
    return `${Math.max(1, mins)}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Adds minutes to a 12-hour AM/PM time string (e.g., "08:50 AM" + 45 -> "09:35 AM")
 */
export function addMinutesToTime(timeStr, minsToAdd) {
  if (!timeStr) return '09:00 AM';
  const clean = String(timeStr).trim().toUpperCase();
  const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : (hours >= 12 ? 'PM' : 'AM');

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  let totalMinutes = (hours * 60 + minutes + parseInt(minsToAdd || 0)) % (24 * 60);
  if (totalMinutes < 0) totalMinutes += (24 * 60);

  let newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  const newPeriod = newHours >= 12 ? 'PM' : 'AM';

  let displayHours = newHours % 12;
  if (displayHours === 0) displayHours = 12;

  const paddedHours = String(displayHours).padStart(2, '0');
  const paddedMins = String(newMins).padStart(2, '0');

  return `${paddedHours}:${paddedMins} ${newPeriod}`;
}

/**
 * Resolves the closest Kerala gateway airport and ground transfer fleet for a given destination
 */
export function getAirportTransferDetails(destination, travelers = 1) {
  const travelersCount = Math.max(1, parseInt(travelers || 1));
  const destName = typeof destination === 'object' ? (destination.name || destination.label || '') : String(destination || '');
  const dClean = destName.toLowerCase().trim();

  let airportCode = 'COK';
  let airportName = 'Cochin International Airport (COK)';
  let transferDist = 95;
  let transferMins = 165; // ~2h 45m

  if (dClean.includes('wayanad') || dClean.includes('kalpetta') || dClean.includes('vythiri') || dClean.includes('meppadi') || dClean.includes('sulthan')) {
    airportCode = 'CCJ';
    airportName = 'Calicut International Airport (CCJ)';
    transferDist = 85;
    transferMins = 150;
  } else if (dClean.includes('varkala') || dClean.includes('kovalam') || dClean.includes('trivandrum') || dClean.includes('thiruvananthapuram') || dClean.includes('poovar') || dClean.includes('ponmudi')) {
    airportCode = 'TRV';
    airportName = 'Trivandrum International Airport (TRV)';
    transferDist = dClean.includes('kovalam') ? 15 : (dClean.includes('varkala') ? 45 : 30);
    transferMins = dClean.includes('kovalam') ? 35 : (dClean.includes('varkala') ? 80 : 50);
  } else if (dClean.includes('munnar') || dClean.includes('devikulam') || dClean.includes('chinnakanal') || dClean.includes('mattupetty') || dClean.includes('marayoor')) {
    airportCode = 'COK';
    airportName = 'Cochin International Airport (COK)';
    transferDist = 110;
    transferMins = 195; // ~3h 15m
  } else if (dClean.includes('alleppey') || dClean.includes('alappuzha') || dClean.includes('kumarakom') || dClean.includes('marari')) {
    airportCode = 'COK';
    airportName = 'Cochin International Airport (COK)';
    transferDist = 75;
    transferMins = 105; // ~1h 45m
  } else if (dClean.includes('thekkady') || dClean.includes('kumily') || dClean.includes('idukki')) {
    airportCode = 'COK';
    airportName = 'Cochin International Airport (COK)';
    transferDist = 140;
    transferMins = 225; // ~3h 45m
  } else if (dClean.includes('kochi') || dClean.includes('cochin') || dClean.includes('ernakulam') || dClean.includes('fort kochi')) {
    airportCode = 'COK';
    airportName = 'Cochin International Airport (COK)';
    transferDist = 35;
    transferMins = 50;
  } else if (dClean.includes('athirappilly')) {
    airportCode = 'COK';
    airportName = 'Cochin International Airport (COK)';
    transferDist = 42;
    transferMins = 65;
  }

  const transferDurationFormatted = formatTravelDuration(transferMins / 60);

  // Vehicle Rates for Ground Transfer Connection
  const cabSedanFare = Math.max(1200, Math.round((500 + transferDist * 20) / 50) * 50);
  const suvInnovaFare = Math.max(1800, Math.round((800 + transferDist * 27) / 50) * 50);
  const prepaidTaxiFare = Math.max(1000, Math.round((400 + transferDist * 18) / 50) * 50);
  const tempoFare = Math.max(3000, Math.round((1500 + transferDist * 34) / 100) * 100);
  const shuttleFarePerPax = Math.max(180, Math.round((120 + transferDist * 2.5) / 10) * 10);

  const connectingVehicles = [
    {
      id: 'cab_sedan',
      name: 'Private Dedicated AC Sedan (Dzire / Etios)',
      vehicle_type: 'AC Sedan Cab',
      icon: 'Car',
      badge: '⭐ Most Popular',
      fare: cabSedanFare,
      fare_per_person: Math.round(cabSedanFare / travelersCount),
      capacity: '1 - 4 Passengers + Standard Luggage',
      duration: transferDurationFormatted,
      duration_minutes: transferMins,
      distance_km: transferDist,
      amenities: ['Airport Arrivals Meet & Greet with Nameboard', 'Dedicated AC Sedan (Private)', 'Direct Doorstep Drop to Hotel', 'Ghat Road Tolls & Parking Included'],
      description: `Dedicated chauffeur waiting at ${airportCode} Arrivals with your nameboard. Direct AC Sedan transfer up to your resort in ${destName}.`
    },
    {
      id: 'suv_innova',
      name: 'Premium AC SUV (Toyota Innova Crysta)',
      vehicle_type: 'Luxury AC SUV',
      icon: 'Car',
      badge: '🏔️ Best for Mountain Ghat Roads',
      fare: suvInnovaFare,
      fare_per_person: Math.round(suvInnovaFare / travelersCount),
      capacity: '4 - 6 Passengers + Extra Luggage',
      duration: transferDurationFormatted,
      duration_minutes: transferMins,
      distance_km: transferDist,
      amenities: ['Spacious Recliner Captain Seats', 'High Ground Clearance for Hill Roads', 'Ample Trunk Space for 6 Bags', 'Complimentary Bottled Water in Cab'],
      description: `Premium Innova Crysta SUV with smooth suspension for mountain curves and extra luggage comfort.`
    },
    {
      id: 'prepaid_taxi',
      name: 'Official Airport Prepaid Taxi',
      vehicle_type: 'Prepaid Taxi',
      icon: 'CarFront',
      badge: '🚕 Official Airport Counter',
      fare: prepaidTaxiFare,
      fare_per_person: Math.round(prepaidTaxiFare / travelersCount),
      capacity: '1 - 4 Passengers',
      duration: transferDurationFormatted,
      duration_minutes: transferMins,
      distance_km: transferDist,
      amenities: ['Instant Dispatch at Terminal Exit', 'Government Regulated Fixed Fare', 'Standard Sedan/Hatchback', 'Direct Transfer'],
      description: `Official prepaid taxi booked directly at the ${airportCode} terminal arrival counter with fixed meter tariffs.`
    },
    {
      id: 'tempo_traveller',
      name: 'AC Luxury Group Tempo Traveller (12-Seater)',
      vehicle_type: 'Group Luxury Van',
      icon: 'Bus',
      badge: '👥 Ideal for Groups & Families',
      fare: tempoFare,
      fare_per_person: Math.round(tempoFare / travelersCount),
      capacity: '7 - 14 Passengers + Heavy Luggage',
      duration: transferDurationFormatted,
      duration_minutes: transferMins,
      distance_km: transferDist,
      amenities: ['Pushback Recliner Seats', 'High Roof & Individual AC Vents', 'Dedicated Large Luggage Boot', 'Experienced Hill Driver'],
      description: `Spacious luxury minibus ideal for larger families and group tours traveling together.`
    },
    {
      id: 'airport_shuttle',
      name: 'Direct AC Airport Feeder / Volvo Coach',
      vehicle_type: 'Airport Bus Coach',
      icon: 'Bus',
      badge: '💰 Budget Connection',
      fare: shuttleFarePerPax * travelersCount,
      fare_per_person: shuttleFarePerPax,
      capacity: 'Per Person Seat',
      duration: formatTravelDuration((transferMins + 30) / 60),
      duration_minutes: transferMins + 30,
      distance_km: transferDist,
      amenities: ['Scheduled Airport Bus Bay Departure', 'AC Low-Floor Coach', 'Central Town Bus Stand Drop', 'Economical Travel'],
      description: `Scheduled AC feeder coach departing directly from ${airportCode} Bus Bay to central ${destName} stand.`
    }
  ];

  const defaultVehicleId = travelersCount > 6 ? 'tempo_traveller' : (travelersCount > 4 ? 'suv_innova' : 'cab_sedan');
  const defaultVehicle = connectingVehicles.find(v => v.id === defaultVehicleId) || connectingVehicles[0];

  return {
    airport_code: airportCode,
    airport_name: airportName,
    distance_km: transferDist,
    duration_minutes: transferMins,
    duration_formatted: transferDurationFormatted,
    destination_name: destName,
    connecting_vehicles: connectingVehicles,
    default_vehicle: defaultVehicle
  };
}

/**
 * Computes realistic, chronologically consistent Day 1 time slots based on flight schedule & airport transfer
 */
export function calculateDay1Timeline({
  flightOption = null,
  connectingVehicle = null,
  destinationName = 'Destination',
  hotelName = 'Resort Stay',
  originName = 'Origin'
}) {
  const isFlight = flightOption && (flightOption.mode === 'flight' || (flightOption.category || '').toLowerCase().includes('flight'));

  if (!isFlight) {
    // Standard Ground Transit Day 1
    const depTime = '08:30 AM';
    const arrTime = '11:30 AM';
    return {
      arrivalSlotTime: `${depTime} - ${arrTime}`,
      slots: [
        {
          period: 'Morning',
          time: `${depTime} - ${arrTime}`,
          type: 'transit',
          tag: 'Departure & Check-in',
          icon: 'car',
          title: `Departure from ${originName} ➔ Arrival in ${destinationName}`,
          description: `Depart from **${originName}** and travel to **${destinationName}** via **${flightOption?.transport_type || 'Private AC Cab'}**. Arrive in **${destinationName}**, check in to **${hotelName}**, freshen up and unpack before afternoon activities.`,
          specific_name: hotelName
        }
      ],
      lunchTime: '12:30 PM - 02:00 PM',
      afternoonTime: '02:30 PM - 05:00 PM',
      eveningTime: '05:30 PM - 07:30 PM',
      dinnerTime: '08:00 PM - 10:00 PM'
    };
  }

  // International / Flight Journey Timing
  const flightDetails = flightOption.flight_details || {};
  const depTime = flightOption.departure_time || flightDetails.departure?.time || '03:20 AM';
  const arrTime = flightOption.arrival_time || flightDetails.arrival?.time || '08:50 AM';
  const depAirport = flightOption.departure_airport || flightDetails.departure?.airport || `${originName} Airport`;
  const arrAirport = flightOption.arrival_airport || flightDetails.arrival?.airport || 'Cochin International Airport (COK)';
  const airline = flightOption.airline || flightDetails.airline || 'Commercial Airline';
  const flightNo = flightOption.flight_number || flightDetails.flight_number || 'Direct Flight';

  const transfer = connectingVehicle || flightOption.connecting_vehicles?.[0] || {
    name: 'Private AC Mountain Cab',
    vehicle_type: 'AC Sedan Cab',
    duration_minutes: 165,
    distance_km: 95
  };

  // Step 1: Airport clearance (Immigration, baggage retrieval) = 45 mins after touchdown
  const clearanceEndTime = addMinutesToTime(arrTime, 45);

  // Step 2: Road transfer from Airport to Destination Resort
  const driveMinutes = transfer.duration_minutes || 165;
  const resortArrivalTime = addMinutesToTime(clearanceEndTime, driveMinutes);

  // Step 3: Check-in & freshen up = 50 mins
  const checkInEndTime = addMinutesToTime(resortArrivalTime, 50);

  // Sequence Subsequent Slots
  const arrivalSlotTime = `${arrTime} - ${checkInEndTime}`;
  const lunchTime = `${checkInEndTime} - ${addMinutesToTime(checkInEndTime, 60)}`;
  const afternoonStartTime = addMinutesToTime(checkInEndTime, 75);
  const afternoonEndTime = addMinutesToTime(afternoonStartTime, 135);
  const eveningStartTime = addMinutesToTime(afternoonEndTime, 30);
  const eveningEndTime = addMinutesToTime(eveningStartTime, 120);
  const dinnerStartTime = '08:00 PM';
  const dinnerEndTime = '10:00 PM';

  const multiLegDescription = `**Stage 1 (Flight Touchdown & Clearance • ${arrTime} - ${clearanceEndTime}):**\n` +
    `Fly on **${airline} (${flightNo})** (Depart **${depTime}** from ${depAirport} ➔ Land **${arrTime}** at **${arrAirport}**). Complete customs, immigration, and retrieve checked luggage at Arrivals.\n\n` +
    `**Stage 2 (Airport ➔ ${destinationName} Transfer • ${clearanceEndTime} - ${resortArrivalTime}):**\n` +
    `Meet your chauffeur at the terminal exit with nameboard and board your **${transfer.name || transfer.vehicle_type || 'Private AC Cab'}** for a scenic ~${transfer.distance_km || 95} km (~${formatTravelDuration(driveMinutes / 60)}) drive up to **${destinationName}**.\n\n` +
    `**Stage 3 (Resort Check-In & Welcome • ${resortArrivalTime} - ${checkInEndTime}):**\n` +
    `Arrive at **${hotelName}**, complete check-in procedures, unpack, freshen up, and relax before afternoon activities.`;

  return {
    arrivalSlotTime,
    clearanceEndTime,
    resortArrivalTime,
    checkInEndTime,
    multiLegDescription,
    lunchTime,
    afternoonTime: `${afternoonStartTime} - ${afternoonEndTime}`,
    eveningTime: `${eveningStartTime} - ${eveningEndTime}`,
    dinnerTime: `${dinnerStartTime} - ${dinnerEndTime}`,
    slots: [
      {
        period: 'Morning',
        time: arrivalSlotTime,
        type: 'transit',
        tag: 'Flight Arrival & Resort Transfer',
        icon: 'plane',
        title: `Touchdown at ${arrAirport.split('(')[0].trim()} ➔ ${transfer.name || 'Cab Transfer'} to ${destinationName}`,
        description: multiLegDescription,
        specific_name: hotelName
      }
    ]
  };
}

/**
 * Generates dynamic transportation options for given From and To locations
 */
export function computeTransitOptions(source, destination, travelers = 1) {
  const travelersCount = Math.max(1, parseInt(travelers || 1));
  const dist = calculateDistanceKm(source, destination);

  const sName = typeof source === 'object' ? (source.name || source.label || '') : String(source || '');
  const dName = typeof destination === 'object' ? (destination.name || destination.label || '') : String(destination || '');
  const sCountry = typeof source === 'object' ? String(source.country || '') : '';
  const dCountry = typeof destination === 'object' ? String(destination.country || '') : '';

  const sClean = (sName + ' ' + sCountry).toLowerCase().trim();
  const dClean = (dName + ' ' + dCountry).toLowerCase().trim();

  const isIntlCountry = (sCountry && !['india', 'in', 'ind', 'bharat'].includes(sCountry.toLowerCase())) ||
                        (dCountry && !['india', 'in', 'ind', 'bharat'].includes(dCountry.toLowerCase()));

  const isIsland = ISLAND_ORIGIN_KEYWORDS.some(k => sClean.includes(k) || dClean.includes(k)) ||
                   (typeof source === 'object' && source?.is_island) ||
                   (typeof destination === 'object' && destination?.is_island);

  const isInternational = isIsland || isIntlCountry || INTERNATIONAL_ORIGIN_KEYWORDS.some(k => sClean.includes(k)) || dist >= 1500;

  // Resolve Ground Connection Transfer fleet from Kerala Gateway Airport to Destination
  const airportTransfer = getAirportTransferDetails(destination, travelersCount);
  const transferDist = airportTransfer.distance_km;
  const transferMins = airportTransfer.duration_minutes;
  const transferDurationFormatted = airportTransfer.duration_formatted;
  const defaultGroundVehicle = airportTransfer.default_vehicle;

  // ── INTERNATIONAL OVERSEAS & WATER-SEPARATED ISLAND JOURNEYS ──
  if (isInternational) {
    const isLakshadweep = sClean.includes('lakshadweep') || sClean.includes('lakshadeep') || sClean.includes('agatti') || sClean.includes('kavaratti') || sClean.includes('bangaram') || sClean.includes('minicoy') || sClean.includes('kadmat') || sClean.includes('agx');
    const isAndaman = sClean.includes('andaman') || sClean.includes('nicobar') || sClean.includes('port blair') || sClean.includes('havelock') || sClean.includes('ixz');
    const isSaudi = sClean.includes('saudi') || sClean.includes('al ahsa') || sClean.includes('al-ahsa') || sClean.includes('hofuf') || sClean.includes('dammam') || sClean.includes('riyadh') || sClean.includes('jeddah') || sClean.includes('khobar');
    const isDubai = sClean.includes('dubai') || sClean.includes('dxb') || sClean.includes('uae') || sClean.includes('abu dhabi') || sClean.includes('sharjah');
    const isQatar = sClean.includes('qatar') || sClean.includes('doha');
    const isKuwait = sClean.includes('kuwait');
    const isBahrain = sClean.includes('bahrain') || sClean.includes('manama');
    const isOman = sClean.includes('oman') || sClean.includes('muscat');
    const isSingapore = sClean.includes('singapore') || sClean.includes('malaysia') || sClean.includes('bangkok') || sClean.includes('bali');
    const isLondon = sClean.includes('london') || sClean.includes('uk') || sClean.includes('paris') || sClean.includes('germany') || sClean.includes('frankfurt');

    let flagshipAirline = 'Saudia';
    let flagshipFlightNo = 'SV 774';
    let budgetAirline = 'Air India Express';
    let budgetFlightNo = 'IX 486';
    let eveAirline = 'Flynas';
    let eveFlightNo = 'XY 822';
    let flagshipFarePerPerson = 15800;
    let budgetFarePerPerson = 10500;
    let eveFarePerPerson = 12400;
    let flightDuration = '4h 15m';
    let flightDurationMins = 255;
    let departureAirport = 'King Fahd International Airport (DMM) / Al-Ahsa Hub';
    let arrivalAirport = `${airportTransfer.airport_name}`;
    let flagDepTime = '02:45 AM';
    let flagArrTime = '09:15 AM';
    let budDepTime = '08:15 AM';
    let budArrTime = '02:40 PM';
    let eveDepTime = '07:30 PM';
    let eveArrTime = '02:15 AM (+1)';
    let baggageText = '30 kg Check-in + 7 kg Cabin';
    let flagshipBadge = '⭐ Flagship Airline';
    let budgetBadge = '💰 Best Value Flight';
    let altOptionTitle = 'Evening Express Flight';
    let isCruiseOption = false;

    if (isLakshadweep) {
      flagshipAirline = 'IndiGo';
      flagshipFlightNo = '6E 7731';
      budgetAirline = 'Alliance Air';
      budgetFlightNo = '9I 506';
      eveAirline = 'Lakshadweep Samudram (MV Kavaratti Cruise)';
      eveFlightNo = 'First Class AC Cabin';
      flagshipFarePerPerson = 5850;
      budgetFarePerPerson = 5400;
      eveFarePerPerson = 4200;
      flightDuration = '1h 25m';
      flightDurationMins = 85;
      departureAirport = 'Agatti Airport (AGX) / Lakshadweep';
      flagDepTime = '10:15 AM';
      flagArrTime = '11:40 AM';
      budDepTime = '01:40 PM';
      budArrTime = '03:05 PM';
      baggageText = '15 kg Check-in + 7 kg Cabin Bag';
      flagshipBadge = '⚡ Fastest Direct Flight';
      budgetBadge = '💰 Value Island Flight';
      altOptionTitle = 'Luxury Passenger Cruise (MV Kavaratti)';
      isCruiseOption = true;
    } else if (isAndaman) {
      flagshipAirline = 'IndiGo';
      flagshipFlightNo = '6E 6812';
      budgetAirline = 'Air India';
      budgetFlightNo = 'AI 549';
      eveAirline = 'SpiceJet Express';
      eveFlightNo = 'SG 298';
      flagshipFarePerPerson = 6850;
      budgetFarePerPerson = 6200;
      eveFarePerPerson = 6500;
      flightDuration = '2h 45m';
      flightDurationMins = 165;
      departureAirport = 'Veer Savarkar International Airport (IXZ) / Port Blair';
      flagDepTime = '09:40 AM';
      flagArrTime = '12:25 PM';
      budDepTime = '08:15 AM';
      budArrTime = '11:30 AM';
      baggageText = '15 kg Check-in + 7 kg Cabin Bag';
      flagshipBadge = '⚡ Direct Non-Stop Flight';
      budgetBadge = '💰 Best Value Air';
      altOptionTitle = 'Evening Coastal Flight';
    } else if (isSaudi) {
      flagshipAirline = 'Saudia';
      flagshipFlightNo = 'SV 774';
      budgetAirline = 'Air India Express';
      budgetFlightNo = 'IX 486';
      eveAirline = 'Flynas';
      eveFlightNo = 'XY 822';
      flagshipFarePerPerson = 15800;
      budgetFarePerPerson = 10500;
      eveFarePerPerson = 12400;
      flightDuration = '4h 25m';
      flightDurationMins = 265;
      departureAirport = `${sName || 'Al Ahsa / Dammam'} Airport (DMM)`;
      flagDepTime = '02:45 AM';
      flagArrTime = '09:15 AM';
      budDepTime = '08:15 AM';
      budArrTime = '02:40 PM';
    } else if (isDubai) {
      flagshipAirline = 'Emirates';
      flagshipFlightNo = 'EK 530';
      budgetAirline = 'Air India Express';
      budgetFlightNo = 'IX 434';
      eveAirline = 'Flydubai';
      eveFlightNo = 'FZ 441';
      flagshipFarePerPerson = 14500;
      budgetFarePerPerson = 8200;
      eveFarePerPerson = 9800;
      flightDuration = '3h 30m';
      flightDurationMins = 210;
      departureAirport = 'Dubai International Airport (DXB)';
      flagDepTime = '03:20 AM';
      flagArrTime = '08:50 AM';
      budDepTime = '08:00 AM';
      budArrTime = '01:30 PM';
      eveDepTime = '06:45 PM';
      eveArrTime = '12:15 AM (+1)';
    } else if (isQatar) {
      flagshipAirline = 'Qatar Airways';
      flagshipFlightNo = 'QR 516';
      budgetAirline = 'Air India Express';
      budgetFlightNo = 'IX 476';
      eveAirline = 'Qatar Airways (Evening)';
      eveFlightNo = 'QR 518';
      flagshipFarePerPerson = 15200;
      budgetFarePerPerson = 9100;
      eveFarePerPerson = 14200;
      flightDuration = '4h 05m';
      flightDurationMins = 245;
      departureAirport = 'Hamad International Airport (DOH)';
      flagDepTime = '01:50 AM';
      flagArrTime = '08:25 AM';
    } else if (isKuwait) {
      flagshipAirline = 'Kuwait Airways';
      flagshipFlightNo = 'KU 351';
      budgetAirline = 'Jazeera Airways';
      budgetFlightNo = 'J9 407';
      eveAirline = 'Kuwait Airways (Evening)';
      eveFlightNo = 'KU 353';
      flagshipFarePerPerson = 14500;
      budgetFarePerPerson = 8900;
      eveFarePerPerson = 13500;
      flightDuration = '4h 40m';
      flightDurationMins = 280;
      departureAirport = 'Kuwait International Airport (KWI)';
      flagDepTime = '01:10 AM';
      flagArrTime = '08:30 AM';
    } else if (isBahrain) {
      flagshipAirline = 'Gulf Air';
      flagshipFlightNo = 'GF 270';
      budgetAirline = 'Air India Express';
      budgetFlightNo = 'IX 474';
      eveAirline = 'Gulf Air (Evening)';
      eveFlightNo = 'GF 272';
      flagshipFarePerPerson = 14200;
      budgetFarePerPerson = 8800;
      eveFarePerPerson = 13200;
      flightDuration = '4h 15m';
      flightDurationMins = 255;
      departureAirport = 'Bahrain International Airport (BAH)';
      flagDepTime = '02:00 AM';
      flagArrTime = '08:45 AM';
    } else if (isOman) {
      flagshipAirline = 'Oman Air';
      flagshipFlightNo = 'WY 225';
      budgetAirline = 'SalamAir';
      budgetFlightNo = 'OV 421';
      eveAirline = 'Oman Air (Evening)';
      eveFlightNo = 'WY 227';
      flagshipFarePerPerson = 13800;
      budgetFarePerPerson = 8500;
      eveFarePerPerson = 12800;
      flightDuration = '3h 35m';
      flightDurationMins = 215;
      departureAirport = 'Muscat International Airport (MCT)';
      flagDepTime = '02:15 AM';
      flagArrTime = '08:15 AM';
    } else if (isSingapore) {
      flagshipAirline = 'Singapore Airlines';
      flagshipFlightNo = 'SQ 534';
      budgetAirline = 'Scoot';
      budgetFlightNo = 'TR 564';
      eveAirline = 'IndiGo';
      eveFlightNo = '6E 1008';
      flagshipFarePerPerson = 18500;
      budgetFarePerPerson = 9500;
      eveFarePerPerson = 12200;
      flightDuration = '4h 15m';
      flightDurationMins = 255;
      departureAirport = 'Singapore Changi Airport (SIN)';
      flagDepTime = '08:00 PM';
      flagArrTime = '10:15 PM';
      budDepTime = '10:15 AM';
      budArrTime = '01:45 PM';
    } else if (isLondon) {
      flagshipAirline = 'British Airways';
      flagshipFlightNo = 'BA 119';
      budgetAirline = 'Air India';
      budgetFlightNo = 'AI 148';
      eveAirline = 'Emirates Fast-Connect';
      eveFlightNo = 'EK 002+530';
      flagshipFarePerPerson = 38000;
      budgetFarePerPerson = 24000;
      eveFarePerPerson = 32000;
      flightDuration = '9h 30m';
      flightDurationMins = 570;
      departureAirport = 'London Heathrow Airport (LHR)';
      flagDepTime = '10:30 AM';
      flagArrTime = '02:15 AM (+1)';
    }

    const groundTransferFare = defaultGroundVehicle.fare;
    const suvTransferVehicle = airportTransfer.connecting_vehicles?.find(v => v.id === 'suv_innova') || defaultGroundVehicle;
    const suvTransferFare = suvTransferVehicle.fare;

    const internationalOptions = [
      {
        id: 101,
        transport_type: `Direct Non-Stop Flight (${flagshipAirline} • ${flagshipFlightNo})`,
        category: isIsland ? 'Domestic Island Flight' : 'International Flight',
        mode: 'flight',
        airline: flagshipAirline,
        flight_number: flagshipFlightNo,
        badge: flagshipBadge,
        source: departureAirport,
        destination: arrivalAirport,
        departure_airport: departureAirport,
        arrival_airport: arrivalAirport,
        departure_time: flagDepTime,
        arrival_time: flagArrTime,
        distance_km: dist,
        travel_time: flightDuration,
        duration_minutes: flightDurationMins,
        duration_formatted: `${flightDuration} Non-Stop`,
        fare: flagshipFarePerPerson,
        flight_fare: flagshipFarePerPerson * travelersCount,
        connecting_vehicle_fare: groundTransferFare,
        total_fare: (flagshipFarePerPerson * travelersCount) + groundTransferFare,
        fare_per_person: Math.round(((flagshipFarePerPerson * travelersCount) + groundTransferFare) / travelersCount),
        is_flat_rate: false,
        cabin_class: isIsland ? 'Economy (Coral Route)' : 'Economy (Premium Service)',
        baggage: isSaudi ? '46 kg (2 × 23 kg) Check-in + 7 kg Cabin' : baggageText,
        onward_transfer: `Flight lands at ${arrivalAirport}. A dedicated scenic ${transferDist} km (~${transferDurationFormatted}) pre-booked ${defaultGroundVehicle.name} transfer to your resort in ${dName || 'Kerala'} is arranged upon landing.`,
        connecting_vehicles: airportTransfer.connecting_vehicles,
        selected_connecting_vehicle: defaultGroundVehicle.id,
        airport_transfer_info: airportTransfer,
        flight_details: {
          airline: flagshipAirline,
          flight_number: flagshipFlightNo,
          aircraft: isSaudi ? 'Boeing 787-9 Dreamliner' : (isDubai ? 'Boeing 777-300ER' : 'Commercial Jet'),
          departure: { airport: departureAirport, time: flagDepTime },
          arrival: { airport: arrivalAirport, time: flagArrTime },
          duration: `${flightDuration} Non-Stop`,
          cabin: isIsland ? 'Economy (Coral Route)' : 'Economy (Premium Service)',
          baggage: isSaudi ? '46 kg (2 × 23 kg) Check-in' : baggageText,
          meal: 'Complimentary Hot Gourmet Meal & Beverages',
          onward_transfer: `Flight lands at ${arrivalAirport}. Dedicated ~${transferDist} km (~${transferDurationFormatted}) pre-booked ${defaultGroundVehicle.name} connection to your resort in ${dName}.`
        },
        personalized_reason: `Saves travel time with premier direct flight from ${sName} arriving early at ${airportTransfer.airport_code} ready for resort transfer.`,
        amenities: isLakshadweep
          ? ['Direct Non-Stop Arabian Sea Coral Route', '15 kg Checked Baggage Included', 'Complimentary Snack & Water', 'Scenic Aerial Lagoon Views', 'Web Check-in Ready']
          : ['Non-Stop Direct Runway Routing', isSaudi ? '46 kg Checked Baggage (2 pcs)' : '30 kg Checked Baggage', 'Complimentary In-Flight Dining', 'In-Seat USB Charging', 'Instant Confirmation']
      },
      {
        id: 102,
        transport_type: `Budget Direct Flight (${budgetAirline} • ${budgetFlightNo})`,
        category: isIsland ? 'Regional Island Air' : 'Economy Flight',
        mode: 'flight',
        airline: budgetAirline,
        flight_number: budgetFlightNo,
        badge: budgetBadge,
        source: departureAirport,
        destination: arrivalAirport,
        departure_airport: departureAirport,
        arrival_airport: arrivalAirport,
        departure_time: budDepTime,
        arrival_time: budArrTime,
        distance_km: dist,
        travel_time: flightDuration,
        duration_minutes: flightDurationMins,
        duration_formatted: `${flightDuration} Non-Stop`,
        fare: budgetFarePerPerson,
        flight_fare: budgetFarePerPerson * travelersCount,
        connecting_vehicle_fare: groundTransferFare,
        total_fare: (budgetFarePerPerson * travelersCount) + groundTransferFare,
        fare_per_person: Math.round(((budgetFarePerPerson * travelersCount) + groundTransferFare) / travelersCount),
        is_flat_rate: false,
        cabin_class: 'Economy (Budget Value)',
        baggage: '15 kg Check-in + 7 kg Cabin Bag',
        onward_transfer: `Flight lands at ${arrivalAirport}. Dedicated scenic ${transferDist} km (~${transferDurationFormatted}) pre-booked ${defaultGroundVehicle.name} transfer to your hotel in ${dName}.`,
        connecting_vehicles: airportTransfer.connecting_vehicles,
        selected_connecting_vehicle: defaultGroundVehicle.id,
        airport_transfer_info: airportTransfer,
        flight_details: {
          airline: budgetAirline,
          flight_number: budgetFlightNo,
          aircraft: 'Airbus A320neo / Boeing 737 MAX',
          departure: { airport: departureAirport, time: budDepTime },
          arrival: { airport: arrivalAirport, time: budArrTime },
          duration: `${flightDuration} Non-Stop`,
          cabin: 'Economy (Budget Value)',
          baggage: '15 kg Check-in + 7 kg Cabin Bag',
          meal: 'Pre-order Meals & Snacks Available',
          onward_transfer: `Flight lands at ${arrivalAirport}. Dedicated ~${transferDist} km (~${transferDurationFormatted}) pre-booked ${defaultGroundVehicle.name} connection to your resort in ${dName}.`
        },
        personalized_reason: `Lowest available direct flight fare for travelers prioritizing value.`,
        amenities: ['Direct Non-Stop Runway Route', 'Checked Baggage Included', 'Standard Cabin Bag (7 kg)', 'Web Check-in Ready']
      },
      {
        id: 103,
        transport_type: isCruiseOption ? `${eveAirline}` : `${altOptionTitle} (${eveAirline} • ${eveFlightNo})`,
        category: isCruiseOption ? 'Luxury Passenger Cruise' : 'Fast Evening Flight',
        mode: isCruiseOption ? 'ferry' : 'flight',
        airline: eveAirline,
        flight_number: eveFlightNo,
        badge: isCruiseOption ? '🚢 Scenic Luxury Cruise' : '⚡ Prime Evening Schedule',
        source: isCruiseOption ? 'Kavaratti / Agatti Port' : departureAirport,
        destination: isCruiseOption ? 'Cochin Port Terminal / Kerala' : arrivalAirport,
        departure_airport: departureAirport,
        arrival_airport: arrivalAirport,
        departure_time: isCruiseOption ? '04:00 PM' : eveDepTime,
        arrival_time: isCruiseOption ? '08:00 AM (+1)' : eveArrTime,
        distance_km: dist,
        travel_time: isCruiseOption ? '14 - 16 Hours (Overnight)' : flightDuration,
        duration_minutes: isCruiseOption ? 900 : flightDurationMins,
        duration_formatted: isCruiseOption ? '15h Overnight Voyage' : `${flightDuration} Non-Stop`,
        fare: eveFarePerPerson,
        flight_fare: eveFarePerPerson * travelersCount,
        connecting_vehicle_fare: groundTransferFare,
        total_fare: (eveFarePerPerson * travelersCount) + groundTransferFare,
        fare_per_person: Math.round(((eveFarePerPerson * travelersCount) + groundTransferFare) / travelersCount),
        is_flat_rate: false,
        cabin_class: isCruiseOption ? 'First Class AC Deluxe Cabin' : 'Economy (Comfort Class)',
        baggage: isCruiseOption ? '40 kg Luggage Allowance' : '30 kg Check-in + 7 kg Cabin Bag',
        onward_transfer: `Dedicated scenic ${transferDist} km (~${transferDurationFormatted}) pre-booked ${defaultGroundVehicle.name} transfer to your resort in ${dName}.`,
        connecting_vehicles: airportTransfer.connecting_vehicles,
        selected_connecting_vehicle: defaultGroundVehicle.id,
        airport_transfer_info: airportTransfer,
        flight_details: {
          airline: eveAirline,
          flight_number: eveFlightNo,
          aircraft: isCruiseOption ? 'MV Kavaratti Luxury Passenger Vessel' : 'Airbus A320neo',
          departure: { airport: departureAirport, time: isCruiseOption ? '04:00 PM' : eveDepTime },
          arrival: { airport: arrivalAirport, time: isCruiseOption ? '08:00 AM (+1)' : eveArrTime },
          duration: isCruiseOption ? '15h Overnight Voyage' : `${flightDuration} Non-Stop`,
          cabin: isCruiseOption ? 'First Class AC Deluxe Cabin' : 'Economy Class',
          baggage: isCruiseOption ? '40 kg Luggage Allowance' : '30 kg Check-in + 7 kg Cabin Bag',
          meal: isCruiseOption ? 'All Meals Included (Buffet Dinner & Breakfast)' : 'Complimentary Hot Snack & Water',
          onward_transfer: `Dedicated pre-booked ${defaultGroundVehicle.name} connection to your resort in ${dName}.`
        },
        personalized_reason: isCruiseOption ? 'Scenic Arabian Sea luxury cruise experience with private AC deluxe cabin.' : 'Convenient evening departure after work.',
        amenities: isCruiseOption
          ? ['First Class AC Private Cabin Berth', 'All Meals Included (Buffet Breakfast, Lunch & Dinner)', 'Doctor on Board & Entertainment Lounge', 'Scenic Arabian Sea Sunrise Experience']
          : ['Convenient Evening Departure', 'Full Day at Work Before Travel', 'Fast Track Baggage', 'Complimentary Hot Snack']
      },
      {
        id: 104,
        transport_type: `Seamless End-to-End Package (${flagshipAirline} + Private Mountain SUV Transfer)`,
        category: 'Combined Air & Road Transfer',
        mode: 'flight',
        airline: `${flagshipAirline} + Dedicated Resort Chauffeur`,
        flight_number: `${flagshipFlightNo} + Mountain Cab`,
        badge: '🚘 Full Door-to-Door Package',
        source: departureAirport,
        destination: `${dName || 'Kerala Resort'} (Direct Doorstep)`,
        departure_airport: departureAirport,
        arrival_airport: `${arrivalAirport} ➔ ${dName} Resort`,
        departure_time: flagDepTime,
        arrival_time: `${flagArrTime} (Airport) ➔ Check-in Ready`,
        distance_km: dist + transferDist,
        travel_time: `${flightDuration} Flight + ${transferDurationFormatted} Drive`,
        duration_minutes: flightDurationMins + transferMins,
        duration_formatted: `${flightDuration} Flight + Mountain Drive`,
        fare: flagshipFarePerPerson + Math.round(suvTransferFare / travelersCount),
        flight_fare: flagshipFarePerPerson * travelersCount,
        connecting_vehicle_fare: suvTransferFare,
        total_fare: (flagshipFarePerPerson * travelersCount) + suvTransferFare,
        fare_per_person: Math.round(((flagshipFarePerPerson * travelersCount) + suvTransferFare) / travelersCount),
        is_flat_rate: false,
        cabin_class: 'Flight + Dedicated Innova Crysta SUV Chauffeur',
        baggage: 'Flight Luggage + Dedicated SUV Trunk Space',
        onward_transfer: `Includes pre-booked dedicated Innova Crysta SUV waiting with nameboard at Arrivals, direct transfer up to your resort in ${dName}.`,
        connecting_vehicles: airportTransfer.connecting_vehicles,
        selected_connecting_vehicle: 'suv_innova',
        selected_vehicle_obj: suvTransferVehicle,
        airport_transfer_info: airportTransfer,
        flight_details: {
          airline: flagshipAirline,
          flight_number: flagshipFlightNo,
          aircraft: 'Commercial Jet + Toyota Innova Crysta SUV',
          departure: { airport: departureAirport, time: flagDepTime },
          arrival: { airport: arrivalAirport, time: flagArrTime },
          duration: `${flightDuration} Flight + ${transferDurationFormatted} Scenic Cab`,
          cabin: 'Flagship Flight + Dedicated Chauffeur SUV',
          baggage: 'Full baggage allowance + SUV trunk space',
          meal: 'In-Flight Dining + Chilled Bottled Water in Cab',
          onward_transfer: `Pre-booked Innova Crysta SUV directly to ${dName} resort.`
        },
        personalized_reason: `Complete door-to-door peace of mind with premium flight and pre-booked mountain SUV waiting at airport arrivals.`,
        amenities: ['Direct Commercial Flight', 'Airport Chauffeur Meet & Greet with Nameboard at Arrivals', `Dedicated AC SUV directly up to your resort in ${dName}`, 'All Ghat Road Tolls & Parking Included']
      }
    ];

    const overseasExcluded = isIsland ? [
      {
        mode: 'cab',
        transport_type: 'Private Road Cab & Taxi',
        reason: `Road cabs omitted: ${sName || 'Origin'} is an offshore island territory in the Arabian Sea separated by ocean waters. Direct commercial flight (AGX) or passenger ship transit is required.`
      },
      {
        mode: 'bus',
        transport_type: 'Intercity Bus',
        reason: 'Intercity buses omitted: No overland road corridor exists across ocean waters.'
      },
      {
        mode: 'train',
        transport_type: 'Express Intercity Train',
        reason: 'Trains omitted: No trans-oceanic railway tracks connect offshore island territories to mainland India.'
      },
      {
        mode: 'self_drive',
        transport_type: 'Self-Drive Vehicle Rental',
        reason: 'Self-drive road rentals omitted: Separated from mainland India by ocean waters.'
      },
      {
        mode: 'bike',
        transport_type: 'Rental Motorcycle / Bike',
        reason: 'Bike rentals omitted: Offshore island route.'
      }
    ] : [
      {
        mode: 'cab',
        transport_type: 'Private Road Cab & Taxi',
        reason: `Road cabs omitted: ${sName || 'Origin'} is an international cross-border location across the Arabian Sea. Direct commercial airline flight transit is required.`
      },
      {
        mode: 'bus',
        transport_type: 'Intercity Bus',
        reason: 'Intercity buses omitted: No overland road corridor exists across international maritime borders.'
      },
      {
        mode: 'train',
        transport_type: 'Express Intercity Train',
        reason: 'Trains omitted: No trans-oceanic railway network exists between foreign countries and India.'
      },
      {
        mode: 'self_drive',
        transport_type: 'Self-Drive Vehicle Rental',
        reason: 'Self-drive road rentals omitted: Cross-border overseas journey.'
      },
      {
        mode: 'bike',
        transport_type: 'Rental Motorcycle / Bike',
        reason: 'Bike rentals omitted: Cross-border overseas journey.'
      }
    ];

    return {
      distance_km: dist,
      options: internationalOptions,
      excluded_modes: overseasExcluded,
      has_railway: false,
      is_international: true,
      airport_transfer_info: airportTransfer
    };
  }

  // ── DOMESTIC ROUTES ──
  const sourceNoRail = NON_RAIL_LOCATIONS.some(loc => sClean.includes(loc));
  const destNoRail = NON_RAIL_LOCATIONS.some(loc => dClean.includes(loc));
  const hasRailway = !sourceNoRail && !destNoRail;

  const sourceHasAir = AIRPORT_HUBS.some(loc => sClean.includes(loc));
  const destHasAir = AIRPORT_HUBS.some(loc => dClean.includes(loc));
  const hasAirport = sourceHasAir && destHasAir && (dist >= 280);

  const excludedModes = [];
  if (!hasRailway) {
    const locName = sourceNoRail ? (source || 'Origin') : (destination || 'Destination');
    excludedModes.push({
      mode: 'train',
      transport_type: 'Express Intercity Train',
      reason: `Train omitted: ${locName} has no railway station or tracks. Direct road transit is verified.`
    });
  }

  // 1. Private AC Cab
  const cabHours = Math.max(0.5, dist / 48.0);
  let cabFare = Math.max(600, Math.round((450 + dist * 16) / 50) * 50);
  const cabsNeeded = Math.max(1, Math.ceil(travelersCount / 4));
  const totalCabFare = cabFare * cabsNeeded;

  // 2. Volvo / State Bus
  const busHours = Math.max(0.8, dist / 38.0 + 0.4);
  const busFarePerPerson = Math.max(80, Math.round((50 + dist * 2.4) / 10) * 10);
  const totalBusFare = busFarePerPerson * travelersCount;

  // 3. Rental Vehicle
  const isShortTrip = dist <= 150;
  const rentalTitle = isShortTrip ? 'Rental Scooter / Bike' : 'Self-Drive SUV Rental';
  const rentalDuration = isShortTrip ? 'Flexible / Per Day' : formatTravelDuration(dist / 52.0);
  const rentalFare = isShortTrip
    ? 600 + Math.round(dist * 3.5)
    : 1800 + Math.round(dist * 7.5);

  const options = [
    {
      id: 101,
      transport_type: 'Private AC Cab (Door-to-Door)',
      category: 'Private Cab / Taxi',
      mode: 'cab',
      badge: '⭐ Premium Comfort',
      source: source || 'Origin Location',
      destination: destination || 'Destination',
      distance_km: dist,
      travel_time: formatTravelDuration(cabHours),
      duration_minutes: Math.round(cabHours * 60),
      fare: cabFare,
      total_fare: totalCabFare,
      fare_per_person: Math.round(totalCabFare / travelersCount),
      is_flat_rate: true,
      amenities: ['Doorstep Pickup', 'AC Sedan / SUV', 'Luggage Assistance', 'Flexible Breaks']
    },
    {
      id: 102,
      transport_type: 'State AC Volvo Intercity Bus',
      category: 'Intercity Bus',
      mode: 'bus',
      badge: '💰 Most Economical',
      source: `${source || 'Central'} Bus Terminal`,
      destination: `${destination || 'City'} Stand`,
      distance_km: dist,
      travel_time: formatTravelDuration(busHours),
      duration_minutes: Math.round(busHours * 60),
      fare: busFarePerPerson,
      total_fare: totalBusFare,
      fare_per_person: busFarePerPerson,
      is_flat_rate: false,
      amenities: ['AC Semi-Sleeper', 'Overhead Luggage', 'Frequent Departures', 'Reserved Seats']
    }
  ];

  // 4. Express Train (Only if both origin and destination have railway connectivity)
  if (hasRailway) {
    const trainHours = Math.max(0.6, dist / 65.0 + 0.2);
    const trainFarePerPerson = Math.max(60, Math.round((40 + dist * 1.5) / 10) * 10);
    const totalTrainFare = trainFarePerPerson * travelersCount;

    options.push({
      id: 103,
      transport_type: 'Express Intercity Train',
      category: 'Train / Metro',
      mode: 'train',
      badge: '🌿 Scenic & Reliable',
      source: `${source || 'Central'} Rail Junction`,
      destination: `${destination || 'Nearest'} Rail Station`,
      distance_km: dist,
      travel_time: formatTravelDuration(trainHours),
      duration_minutes: Math.round(trainHours * 60),
      fare: trainFarePerPerson,
      total_fare: totalTrainFare,
      fare_per_person: trainFarePerPerson,
      is_flat_rate: false,
      amenities: ['Reserved Seating', 'Spacious Legroom', 'Scenic Route Views', 'Punctual Schedule']
    });
  }

  // 5. Rental Vehicle
  options.push({
    id: 104,
    transport_type: rentalTitle,
    category: 'Rental Vehicle',
    mode: 'self_drive',
    badge: '🚗 Maximum Freedom',
    source: `${source || 'Hub'} Pickup`,
    destination: `${destination || 'Route'} Self-Drive`,
    distance_km: dist,
    travel_time: rentalDuration,
    duration_minutes: isShortTrip ? 60 : Math.round((dist / 52.0) * 60),
    fare: rentalFare,
    total_fare: rentalFare,
    fare_per_person: Math.round(rentalFare / travelersCount),
    is_flat_rate: true,
    amenities: ['Self-Drive Privacy', 'Unlimited Sightseeing', 'Helmets/GPS Provided']
  });

  // 6. Add Flight option if distance >= 280 km and airport connectivity exists
  if (hasAirport) {
    const flightFare = Math.max(3200, Math.round((2500 + dist * 4.2) / 100) * 100);
    options.push({
      id: 105,
      transport_type: 'Direct / Connecting Flight',
      category: 'Flight',
      mode: 'flight',
      badge: '⚡ Fastest Route',
      source: `${source || 'Origin'} Airport`,
      destination: `${destination || 'Destination'} Airport`,
      distance_km: dist,
      travel_time: '1.5 - 2.5 Hours',
      duration_minutes: 120,
      fare: flightFare,
      total_fare: flightFare * travelersCount,
      fare_per_person: flightFare,
      is_flat_rate: false,
      amenities: ['Rapid Transit', 'Cabin Baggage', 'In-Flight Refreshments']
    });
  }

  return {
    distance_km: dist,
    options,
    excluded_modes: excludedModes,
    has_railway: hasRailway,
    is_international: false
  };
}

