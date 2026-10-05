import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, Star, Building2, MapPin, Car, Utensils,
  ShieldCheck, Calendar, ArrowLeft, ArrowRight, Compass,
  AlertCircle, Receipt, Users, Clock, Lightbulb, CheckCircle2,
  AlertTriangle, Navigation, Globe, ExternalLink, Sun, CloudRain,
  Train, Plane, Tag, Radio, ArrowUpDown, Map, ChevronDown,
  ChevronRight, ChevronLeft, Plus, Check, Trash2, Maximize2,
  Minimize2, Eye, Bed, Bus, Bike, KeyRound, Cloud, Wind,
  Droplets, Info, Heart, Layers, SlidersHorizontal, Share2,
  Printer, Crosshair, DollarSign, CheckSquare, Square, RefreshCw,
  Bookmark, Save, Calculator, X, MessageSquare, Send, ThumbsUp, ZoomIn,
  Split, GitFork, ArrowRightLeft, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripService } from '../services/api';
import ImageModal from '../components/ImageModal';
import { 
  TravelLocationSelector, 
  TravelMap, 
  TransportationOptions, 
  CostBreakdown 
} from '../components/transport';
import { computeTransitOptions, calculateDay1Timeline, getAirportTransferDetails } from '../utils/transitCalculator';

// Fallback high-res imagery for places without database images
const DESTINATION_IMAGE_FALLBACKS = {
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  'tokyo': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
  'goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  'munnar': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
  'wayanad': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
  'alleppey': 'https://wallpaperaccess.com/full/9210600.jpg',
  'varkala': 'https://media.istockphoto.com/id/909034418/photo/varkala-beach-kerala-south-india.jpg?s=170667a&w=0&k=20&c=NMWZ5Yf1rvl2FaRUDs24PhdrNcoaqff6TBm9Qz1JF8A=',
  'kochi': 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
  'athirappilly': 'https://images.unsplash.com/photo-1626244675549-06ccb31b3e34?auto=format&fit=crop&w=1200&q=80',
  'thekkady': 'https://images.unsplash.com/photo-1616388969587-8196f32388b4?auto=format&fit=crop&w=1200&q=80',
  'kovalam': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  'vagamon': 'https://www.ekeralatourism.net/wp-content/uploads/2017/12/Vagamon-1.jpg',
  'kanthalloor': 'https://b3681537.smushcdn.com/3681537/wp-content/uploads/2026/02/kanthalloor-waterfalls-munnar-1-1536x864.jpg?lossy=2&strip=1&webp=1',
  'marayoor': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqLiWkf2hR7V9CKXqc7rVTP7FxaVShbRHmb5_d_T6MWA&s=10',
  'idukki': 'https://images.travelandleisureasia.com/wp-content/uploads/sites/2/2025/08/05123106/Idukki-arch-dam.jpg',
  'ramakkalmedu': 'https://mediaim.expedia.com/destination/2/a2088ad8990582da245cebf098247af2.jpg',
  'kumarakom': 'https://im.whatshot.in/img/2020/Sep/shutterstock-545452072-cropped-1546935970-1601351857.jpg',
  'bekal': 'https://www.indianholiday.com/wordpress/wp-content/uploads/2026/03/Best-Time-to-Visit-Bekal.jpg',
  'thiruvananthapuram': 'https://deih43ym53wif.cloudfront.net/large_thiruvananthapuram-india-shutterstock_498424870_54ec620099.jpeg',
  'poovar': 'https://www.keralatourism.org/images/enchanting_kerala/large/poovar20210607132228_1090_1.jpg',
  'ponmudi': 'https://www.keralatourism.org/_next/image/?url=http:%2F%2F127.0.0.1%2Fktadmin%2Fimg%2Fpages%2Flarge-desktop%2Fponmudi-1728573914_d51268d5e5353e9b4d19.webp&w=3840&q=75',
  'munroe island': 'https://www.keralatourism.org/_next/image/?url=http:%2F%2F127.0.0.1%2Fktadmin%2Fimg%2Fpages%2Ftablet%2Fmunroe-island-1725340721_047ef1ec7ff251377ddd.webp&w=1920&q=75'
};

const ATTRACTION_IMAGE_FALLBACKS = {
  'eravikulam': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
  'mattupetty': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'anamudi': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
  'edakkal': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  'banasura': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  'lake': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80',
  'temple': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
  'falls': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80',
  'boating': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
  'rafting': 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=600&q=80',
  'pine': 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
  'meadow': 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80'
};

// Utility to format bold markdown and paragraph breaks cleanly
const renderFormattedText = (text) => {
  if (!text) return null;
  const paragraphs = String(text).split('\n\n');
  return paragraphs.map((para, pIdx) => {
    const parts = para.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={pIdx} className="text-slate-300 font-medium leading-relaxed text-xs">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-extrabold text-cyan-200">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    );
  });
};

export default function Recommendations() {
  const location = useLocation();
  const navigate = useNavigate();

  // Load initial planning data from router state or sessionStorage
  const [planData, setPlanData] = useState(() => {
    const initialData = location.state || {};
    if (initialData.recommendations !== undefined || initialData.preferences) {
      return initialData;
    }
    try {
      const saved = sessionStorage.getItem('lastTripPlan');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const recs = Array.isArray(planData.recommendations) ? planData.recommendations : [];
  const preferences = planData.preferences || null;
  const apiMessage = planData.message || '';

  // Duration & Group Parameters
  const initialDuration = Math.max(1, parseInt(preferences?.duration_days || 3));
  const travelersCount = Math.max(1, parseInt(preferences?.travelers || 2));
  const userBudget = parseFloat(preferences?.budget || 0);

  // Normalized Recommendations List
  const normalizedRecs = useMemo(() => {
    return recs.map((dest, index) => {
      const id = dest.destination_id || dest.id;
      const name = dest.destination_name || dest.name || `Destination ${index + 1}`;
      const rawScore = Number(dest.match_score ?? dest.matching_score ?? 0);
      const score = rawScore > 1 ? Math.min(100, Math.round(rawScore)) : Math.min(100, Math.round(rawScore * 100));

      const fallbackImg = DESTINATION_IMAGE_FALLBACKS[name.toLowerCase()] ||
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';

      return {
        ...dest,
        destinationId: id,
        destinationName: name,
        displayScore: score,
        image_url: dest.image_url || fallbackImg,
        hotels: dest.hotels || [],
        restaurants: dest.restaurants || [],
        attractions: dest.attractions || [],
        reasons: dest.reasons || [],
        similarity_badge: dest.similarity_badge || null,
        is_previous_destination: dest.is_previous_destination || false
      };
    });
  }, [recs]);

  // Primary Destination
  const primaryDest = normalizedRecs[0] || null;
  const primaryDestId = primaryDest?.destinationId;

  // Global All Destinations Catalog (for choosing beyond recommendations)
  const [allDestinations, setAllDestinations] = useState([]);
  const [nearbySuggestions, setNearbySuggestions] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // =========================================================================
  // MULTI-DESTINATION STOPS STATE (SUPPORTS 1, 2, 3, 4, 5+ STOPS DYNAMICALLY)
  // =========================================================================
  const [isMultiDestMode, setIsMultiDestMode] = useState(() => {
    return preferences?.multi_destination || (initialDuration >= 4);
  });

  // Dynamic Stops Array: [{ destinationId, destinationName, category, image_url, days }]
  const [stops, setStops] = useState(() => {
    if (!primaryDest) return [];
    if (isMultiDestMode && normalizedRecs.length > 1) {
      const pDays = Math.ceil(initialDuration * 0.6);
      return [
        {
          destinationId: primaryDest.destinationId,
          destinationName: primaryDest.destinationName,
          category: primaryDest.category || 'Hill Station',
          image_url: primaryDest.image_url,
          days: pDays
        },
        {
          destinationId: normalizedRecs[1].destinationId,
          destinationName: normalizedRecs[1].destinationName,
          category: normalizedRecs[1].category || 'Nature Escape',
          image_url: normalizedRecs[1].image_url,
          days: Math.max(1, initialDuration - pDays)
        }
      ];
    }
    return [
      {
        destinationId: primaryDest.destinationId,
        destinationName: primaryDest.destinationName,
        category: primaryDest.category || 'Destination',
        image_url: primaryDest.image_url,
        days: initialDuration
      }
    ];
  });

  // Keep stops synced if primary destination loads late
  useEffect(() => {
    if (primaryDest && stops.length === 0) {
      setStops([
        {
          destinationId: primaryDest.destinationId,
          destinationName: primaryDest.destinationName,
          category: primaryDest.category || 'Destination',
          image_url: primaryDest.image_url,
          days: initialDuration
        }
      ]);
    }
  }, [primaryDest, stops.length, initialDuration]);

  // Total calculated trip duration based on allocated stop days
  const durationDays = useMemo(() => {
    if (stops.length === 0) return initialDuration;
    return stops.reduce((acc, s) => acc + (parseInt(s.days) || 1), 0);
  }, [stops, initialDuration]);

  // Active Stop Tab being customized in workspace (0 = Stop 1, 1 = Stop 2, etc.)
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(0);

  // Active Workspace Tab ('all', 'places', 'hotels', 'restaurants', 'transport', 'itinerary')
  const [activeSection, setActiveSection] = useState('hotels');

  // Destination Details Cache per Destination ID
  const [destDetailsMap, setDestDetailsMap] = useState({});
  // Real Transit & Routing Cache per Destination ID
  const [destTransitState, setDestTransitState] = useState({});

  // =========================================================================
  // USER SELECTIONS (KEYED BY DESTINATION ID)
  // =========================================================================
  const [selectedHotels, setSelectedHotels] = useState({});
  const [selectedTransports, setSelectedTransports] = useState({});
  const [selectedRestaurants, setSelectedRestaurants] = useState({});
  const [selectedAttractions, setSelectedAttractions] = useState({});
  const [customItineraryItems, setCustomItineraryItems] = useState({});

  // =========================================================================
  // ITINERARY GENERATION & VISIBILITY STATE
  // =========================================================================
  const [isItineraryGenerated, setIsItineraryGenerated] = useState(false);
  const [selectionAlert, setSelectionAlert] = useState(null);

  // =========================================================================
  // SAVE TRIP MODAL STATE & DATE CONFLICT STATE
  // =========================================================================
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customTripName, setCustomTripName] = useState('');
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [tripSavedSuccessfully, setTripSavedSuccessfully] = useState(false);
  const [dateConflictError, setDateConflictError] = useState(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Formatted date range display helper
  const formattedTripDateRange = useMemo(() => {
    const rawDate = preferences?.travel_date || preferences?.travelDate;
    if (!rawDate) return { start: 'Flexible / Upcoming', end: '', range: 'Flexible / Upcoming' };
    try {
      const parts = String(rawDate).split('-');
      let startD;
      if (parts.length === 3 && parts[0].length === 4) {
        startD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        startD = new Date(rawDate);
      }
      if (isNaN(startD.getTime())) return { start: String(rawDate), end: '', range: String(rawDate) };
      const endD = new Date(startD);
      endD.setDate(startD.getDate() + Math.max(1, durationDays) - 1);

      const fmt = (d) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      };
      const startStr = fmt(startD);
      const endStr = fmt(endD);
      return {
        start: startStr,
        end: endStr,
        range: `${startStr} to ${endStr} (${durationDays} Days)`
      };
    } catch {
      return { start: String(rawDate), end: '', range: String(rawDate) };
    }
  }, [preferences?.travel_date, preferences?.travelDate, durationDays]);

  // Fetch full list of destinations from API for adding / changing stops
  useEffect(() => {
    async function loadAllDests() {
      try {
        const res = await tripService.getDestinations({ limit: 60 });
        if (res?.destinations) {
          setAllDestinations(res.destinations);
        }
      } catch (err) {
        console.warn("Could not fetch full destination catalog:", err);
      }
    }
    loadAllDests();
  }, []);

  // Sync state if navigation state changes
  useEffect(() => {
    if (location.state && (location.state.recommendations !== undefined || location.state.preferences)) {
      setPlanData(location.state);
      sessionStorage.setItem('lastTripPlan', JSON.stringify(location.state));
    }
  }, [location.state]);

  // Fetch Nearby Destinations whenever primary destination changes
  useEffect(() => {
    if (!primaryDestId) return;

    let isMounted = true;
    async function fetchNearby() {
      setLoadingNearby(true);
      try {
        const res = await tripService.getNearbyDestinations(primaryDestId, 8);
        if (isMounted && res?.nearby_destinations) {
          setNearbySuggestions(res.nearby_destinations);
        }
      } catch (err) {
        console.warn("Failed to fetch nearby destinations:", err);
      } finally {
        if (isMounted) setLoadingNearby(false);
      }
    }
    fetchNearby();
    return () => { isMounted = false; };
  }, [primaryDestId]);

  // Fetch Full Details (Attractions, Hotels, Restaurants) for any destination ID
  const fetchDetailsForDest = useCallback(async (destId) => {
    if (!destId || destDetailsMap[destId]) return;
    try {
      const res = await tripService.getDestinationDetail(destId);
      if (res?.destination) {
        setDestDetailsMap(prev => ({ ...prev, [destId]: res.destination }));
      }
    } catch (err) {
      console.warn(`Destination detail fetch for dest ${destId}:`, err);
    }
  }, [destDetailsMap]);

  // Fetch Transit & Route for a destination
  const fetchTransitForDest = useCallback(async (destId, originInput, destInput) => {
    if (!destId) return;

    setDestTransitState(prev => ({
      ...prev,
      [destId]: {
        ...(prev[destId] || {}),
        loading: true,
        error: null
      }
    }));

    try {
      const payload = {
        origin: originInput,
        destination: destInput,
        travelers: travelersCount,
        budget: userBudget || 15000,
        interests: preferences?.interests || [],
        comfort: preferences?.comfort || 'Comfortable',
        style: preferences?.style || 'balanced'
      };

      const res = await tripService.getRecommendations(payload);

      setDestTransitState(prev => {
        const opts = res.options || [];
        if (!selectedTransports[destId] && opts.length > 0) {
          setSelectedTransports(s => ({ ...s, [destId]: opts[0].id }));
        }

        return {
          ...prev,
          [destId]: {
            origin: res.origin,
            destination: res.destination,
            distance_km: res.distance_km,
            duration_minutes: res.duration_minutes,
            duration_formatted: res.duration_formatted,
            geometry: res.geometry || [],
            options: opts,
            excluded_modes: res.excluded_modes || [],
            ai_feasibility: res.ai_feasibility || null,
            ai_advice: res.ai_advice || null,
            dataSource: res.data_source || 'OpenRouteService Directions API',
            loading: false,
            error: null
          }
        };
      });

    } catch (err) {
      console.error(`Failed to fetch route for destination ${destId}:`, err);
      setDestTransitState(prev => ({
        ...prev,
        [destId]: {
          ...(prev[destId] || {}),
          loading: false,
          error: 'Route calculation is temporarily unavailable.'
        }
      }));
    }
  }, [travelersCount, userBudget, preferences, selectedTransports]);

  // Ensure details and initial transit are loaded for all active stops
  useEffect(() => {
    if (stops.length === 0) return;
    const defaultOrigin = preferences?.source_location || 'Kochi';

    stops.forEach((stop, idx) => {
      fetchDetailsForDest(stop.destinationId);

      const expectedOrigin = idx === 0 ? defaultOrigin : (stops[idx - 1]?.destinationName || defaultOrigin);
      const expectedDest = stop.destinationName;
      const existingTransit = destTransitState[stop.destinationId];

      if (!existingTransit) {
        fetchTransitForDest(stop.destinationId, expectedOrigin, expectedDest);
      }
    });
  }, [stops, preferences?.source_location, fetchDetailsForDest, fetchTransitForDest, destTransitState]);

  // Active Destination currently focused in Workspace
  const safeSegmentIdx = Math.min(activeSegmentIdx, Math.max(0, stops.length - 1));
  const focusedDest = stops[safeSegmentIdx] || primaryDest;
  const focusedDestId = focusedDest?.destinationId || focusedDest?.id;
  const defaultOrigin = preferences?.source_location || 'Kochi';
  const expectedOriginForFocused = safeSegmentIdx === 0
    ? defaultOrigin
    : (stops[safeSegmentIdx - 1]?.destinationName || 'Munnar');
  const expectedDestForFocused = focusedDest?.destinationName || 'Destination';

  // Active Data for Focused Destination
  const focusedAttractions = useMemo(() => {
    const detailed = destDetailsMap[focusedDestId]?.attractions;
    if (Array.isArray(detailed) && detailed.length > 0) return detailed;
    const match = normalizedRecs.find(r => r.destinationId === focusedDestId);
    return match?.attractions || [];
  }, [destDetailsMap, focusedDestId, normalizedRecs]);

  const focusedHotels = useMemo(() => {
    const detailed = destDetailsMap[focusedDestId]?.hotels;
    if (Array.isArray(detailed) && detailed.length > 0) return detailed;
    const match = normalizedRecs.find(r => r.destinationId === focusedDestId);
    return match?.hotels || [];
  }, [destDetailsMap, focusedDestId, normalizedRecs]);

  const focusedRestaurants = useMemo(() => {
    const detailed = destDetailsMap[focusedDestId]?.restaurants;
    if (Array.isArray(detailed) && detailed.length > 0) return detailed;
    const match = normalizedRecs.find(r => r.destinationId === focusedDestId);
    return match?.restaurants || [];
  }, [destDetailsMap, focusedDestId, normalizedRecs]);

  const focusedTransit = destTransitState[focusedDestId] || {};
  const focusedTransitList = useMemo(() => {
    if (focusedTransit.options && focusedTransit.options.length > 0) return focusedTransit.options;
    const computed = computeTransitOptions(expectedOriginForFocused, expectedDestForFocused, travelersCount);
    return computed?.options || [];
  }, [focusedTransit.options, expectedOriginForFocused, expectedDestForFocused, travelersCount]);

  // Selections for focused destination
  const selectedHotelForFocused = selectedHotels[focusedDestId] || null;
  const activeHotel = focusedHotels.find(h => h.id === selectedHotelForFocused) || null;

  const selectedRestIdsForFocused = selectedRestaurants[focusedDestId] || [];
  const activeRestaurants = focusedRestaurants.filter(r => selectedRestIdsForFocused.includes(r.id));

  const selectedAttractIdsForFocused = selectedAttractions[focusedDestId] || [];
  const activeAttractions = focusedAttractions.filter(a => selectedAttractIdsForFocused.includes(a.id));

  const selectedTransIdForFocused = selectedTransports[focusedDestId] || null;
  const activeTransOption = focusedTransitList.find(t => t.id === selectedTransIdForFocused) || null;

  // =========================================================================
  // MULTI-STOP MANAGEMENT ACTIONS
  // =========================================================================
  // 1. Toggle Single vs Multi Destination
  const handleToggleMode = (isMulti) => {
    setIsMultiDestMode(isMulti);
    if (!isMulti) {
      // Collapse to single primary stop
      if (stops.length > 0) {
        setStops([{ ...stops[0], days: durationDays }]);
        setActiveSegmentIdx(0);
      }
    } else {
      // Expand to multi-destination with second stop if only 1 exists
      if (stops.length === 1) {
        const pDays = Math.max(1, Math.ceil(durationDays * 0.6));
        const sDays = Math.max(1, durationDays - pDays);
        const secondOption = nearbySuggestions[0] || normalizedRecs[1] || allDestinations.find(d => d.id !== stops[0].destinationId) || {
          destination_id: 22,
          name: 'Kanthalloor',
          category: 'Hill Station'
        };

        const newSecond = {
          destinationId: secondOption.destination_id || secondOption.id,
          destinationName: secondOption.name || secondOption.destinationName || 'Kanthalloor',
          category: secondOption.category || 'Scenic Valley',
          image_url: secondOption.image_url || DESTINATION_IMAGE_FALLBACKS[secondOption.name?.toLowerCase()] || DESTINATION_IMAGE_FALLBACKS['kanthalloor'],
          days: sDays
        };

        setStops([
          { ...stops[0], days: pDays },
          newSecond
        ]);
      }
    }
  };

  // 2. Add New Destination Stop
  const handleAddStop = (destToAdd) => {
    let targetDest = destToAdd;
    if (!targetDest) {
      // Find candidate not already in stops
      const currentIds = stops.map(s => s.destinationId);
      targetDest = nearbySuggestions.find(n => !currentIds.includes(n.destination_id)) ||
        normalizedRecs.find(n => !currentIds.includes(n.destinationId)) ||
        allDestinations.find(n => !currentIds.includes(n.id)) || {
          id: 6,
          name: 'Thekkady',
          category: 'Wildlife'
        };
    }

    const newStopId = targetDest.destination_id || targetDest.destinationId || targetDest.id;
    const newStopName = targetDest.name || targetDest.destinationName || 'New Destination';
    const fallbackImg = targetDest.image_url || DESTINATION_IMAGE_FALLBACKS[newStopName.toLowerCase()] || DESTINATION_IMAGE_FALLBACKS['munnar'];

    const newStopObj = {
      destinationId: newStopId,
      destinationName: newStopName,
      category: targetDest.category || 'Scenic Destination',
      image_url: fallbackImg,
      days: 1
    };

    const updated = [...stops, newStopObj];
    setStops(updated);
    setActiveSegmentIdx(updated.length - 1);
    fetchDetailsForDest(newStopId);

    setSaveStatus(`Added ${newStopName} (Stop #${updated.length}) to your journey!`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // 3. Remove Destination Stop
  const handleRemoveStop = (stopIdx) => {
    if (stops.length <= 1) return;
    const removedName = stops[stopIdx]?.destinationName;
    const daysToRefund = stops[stopIdx]?.days || 1;

    const filtered = stops.filter((_, idx) => idx !== stopIdx);
    // Refund days to first stop
    if (filtered.length > 0) {
      filtered[0].days = (filtered[0].days || 1) + daysToRefund;
    }

    setStops(filtered);
    setActiveSegmentIdx(Math.max(0, Math.min(activeSegmentIdx, filtered.length - 1)));

    setSaveStatus(`Removed ${removedName} from trip stops.`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // 4. Change Destination for a Stop
  const handleChangeStopDestination = (stopIdx, newDestObj) => {
    const newId = newDestObj.destination_id || newDestObj.destinationId || newDestObj.id;
    const newName = newDestObj.name || newDestObj.destinationName;
    const newImg = newDestObj.image_url || DESTINATION_IMAGE_FALLBACKS[newName.toLowerCase()] || DESTINATION_IMAGE_FALLBACKS['munnar'];

    setStops(prev => prev.map((s, idx) => {
      if (idx === stopIdx) {
        return {
          ...s,
          destinationId: newId,
          destinationName: newName,
          category: newDestObj.category || s.category,
          image_url: newImg
        };
      }
      return s;
    }));

    fetchDetailsForDest(newId);
    setSaveStatus(`Updated Stop #${stopIdx + 1} to ${newName}!`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // 5. Adjust Days for a Stop
  const handleAdjustStopDays = (stopIdx, delta) => {
    setStops(prev => prev.map((s, idx) => {
      if (idx === stopIdx) {
        const newDays = Math.max(1, (s.days || 1) + delta);
        return { ...s, days: newDays };
      }
      return s;
    }));
  };

  // =========================================================================
  // SELECTION VALIDATION CHECKLIST & REQUIREMENTS
  // =========================================================================
  const selectionStatus = useMemo(() => {
    if (!stops || stops.length === 0) {
      return { isComplete: false, stopsStatus: [], missingList: [] };
    }

    const stopsStatus = stops.map((stop, sIdx) => {
      const sId = stop.destinationId;
      const sHotels = (destDetailsMap[sId]?.hotels || []).length > 0 ? destDetailsMap[sId].hotels : (normalizedRecs.find(r => r.destinationId === sId)?.hotels || []);
      const sRests = (destDetailsMap[sId]?.restaurants || []).length > 0 ? destDetailsMap[sId].restaurants : (normalizedRecs.find(r => r.destinationId === sId)?.restaurants || []);

      // Check if user has selected, or fallback if empty catalog
      const hasHotel = Boolean(selectedHotels[sId]) || (sHotels.length === 0);
      const hasTransport = Boolean(selectedTransports[sId]);
      const restSelections = selectedRestaurants[sId] || [];
      const hasRestaurant = (restSelections.length > 0) || (sRests.length === 0);

      const isStopComplete = hasHotel && hasTransport && hasRestaurant;

      const chosenHotelName = sHotels.find(h => h.id === selectedHotels[sId])?.name || null;
      const chosenTransName = (destTransitState[sId]?.options || []).find(t => t.id === selectedTransports[sId])?.transport_type || null;

      return {
        stopIndex: sIdx,
        stopName: stop.destinationName,
        destinationId: sId,
        hasHotel,
        hasTransport,
        hasRestaurant,
        chosenHotelName,
        chosenTransName,
        restCount: restSelections.length,
        isStopComplete
      };
    });

    const missingList = [];
    stopsStatus.forEach(st => {
      if (!st.hasHotel) missingList.push({ stopIdx: st.stopIndex, stopName: st.stopName, section: 'hotels', message: `Select a Hotel/Stay in ${st.stopName}` });
      if (!st.hasTransport) missingList.push({ stopIdx: st.stopIndex, stopName: st.stopName, section: 'transport', message: `Select Transportation for ${st.stopName}` });
      if (!st.hasRestaurant) missingList.push({ stopIdx: st.stopIndex, stopName: st.stopName, section: 'restaurants', message: `Select at least 1 Restaurant in ${st.stopName}` });
    });

    const isComplete = stopsStatus.every(st => st.isStopComplete);

    return {
      isComplete,
      stopsStatus,
      missingList
    };
  }, [stops, selectedHotels, selectedTransports, selectedRestaurants, destDetailsMap, normalizedRecs, destTransitState]);

  // =========================================================================
  // MULTI-DESTINATION SEGMENT CONFIGURATION
  // =========================================================================
  const segmentsConfig = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops.map((stop, sIdx) => {
      const sId = stop.destinationId;
      const sDetails = destDetailsMap[sId] || (normalizedRecs.find(r => r.destinationId === sId)) || stop;
      const sHotels = sDetails.hotels || [];
      const sHotel = sHotels.find(h => h.id === selectedHotels[sId]) || sHotels[0];

      const sAttracts = (selectedAttractions[sId] || []).length > 0
        ? (sDetails.attractions || []).filter(a => (selectedAttractions[sId] || []).includes(a.id))
        : (sDetails.attractions || []).slice(0, (stop.days || 1) * 2);

      const sRests = (selectedRestaurants[sId] || []).length > 0
        ? (sDetails.restaurants || []).filter(r => (selectedRestaurants[sId] || []).includes(r.id))
        : (sDetails.restaurants || []).slice(0, 3);

      const transState = destTransitState[sId] || {};
      const transList = transState.options || [];
      const sTrans = transList.find(t => t.id === selectedTransports[sId]) || transList[0] || {
        id: `cab-${sId}`,
        transport_type: sIdx === 0 ? 'Private AC Sedan Cab' : 'Inter-City Transfer Cab',
        total_fare: Math.round(1400 * (stop.days || 1))
      };

      return {
        destination_id: sId,
        destination_name: stop.destinationName,
        duration_days: stop.days || 1,
        hotel_id: sHotel?.id || null,
        hotel_name: sHotel?.name || `Stay in ${stop.destinationName}`,
        hotel_type: sHotel?.hotel_type || 'Resort',
        hotel_price: parseFloat(sHotel?.price_per_night || 1600),
        selected_restaurants: sRests,
        selected_attractions: sAttracts,
        transport_option: sTrans,
        distance_km: transState.distance_km || sTrans.distance_km || null,
        duration_formatted: transState.duration_formatted || sTrans.duration_formatted || null,
        origin_name: (typeof transState.origin === 'object' && transState.origin !== null) ? (transState.origin.name || transState.origin.label || '') : (transState.origin || (sIdx === 0 ? (preferences?.source_location || 'Kochi') : (stops[sIdx - 1]?.destinationName || 'Kochi'))),
        custom_items: customItineraryItems[sId] || []
      };
    });
  }, [
    stops,
    destDetailsMap,
    normalizedRecs,
    selectedHotels,
    selectedAttractions,
    selectedRestaurants,
    destTransitState,
    selectedTransports,
    customItineraryItems,
    preferences?.source_location
  ]);

  // =========================================================================
  // DYNAMIC STRUCTURED ITINERARY PAYLOAD (EXPLICIT USER-SELECTED CHOICES)
  // =========================================================================
  const structuredItineraryPayload = useMemo(() => {
    if (!segmentsConfig || segmentsConfig.length === 0) return [];

    const fullItinerary = [];
    let currentDayNumber = 1;
    const totalSegs = segmentsConfig.length;
    const defaultOriginCity = (typeof focusedTransit.origin === 'object' && focusedTransit.origin !== null)
      ? (focusedTransit.origin.name || focusedTransit.origin.label || '')
      : (focusedTransit.origin || preferences?.source_location || 'Kochi');

    segmentsConfig.forEach((seg, segIdx) => {
      const segDays = seg.duration_days;
      const destName = seg.destination_name;
      const hotelName = seg.hotel_name;
      const transName = seg.transport_option?.transport_type || 'Private AC Cab';

      const restList = seg.selected_restaurants.length > 0
        ? seg.selected_restaurants.map(r => r.name)
        : [`Traditional ${destName} Bistro`, `Garden Terrace Restaurant in ${destName}`];

      const attractList = seg.selected_attractions.length > 0
        ? seg.selected_attractions
        : [
          { name: `${destName} Panoramic Mountain Ridge`, description: `Scenic mountain trails and tea plantations in ${destName}.`, entry_fee: 40 },
          { name: `${destName} Botanical Waterfalls`, description: `Cascading streams and rainforest pools in ${destName}.`, entry_fee: 50 },
          { name: `${destName} Cultural Heritage Bazaar`, description: `Traditional handicraft shops and spices in ${destName}.`, entry_fee: 0 }
        ];

      let attIdx = 0;
      const totalAtts = attractList.length;

      for (let dayInSeg = 1; dayInSeg <= segDays; dayInSeg++) {
        const isTripStart = (currentDayNumber === 1);
        const isSegTransfer = (dayInSeg === 1 && segIdx > 0);
        const isTripEnd = (segIdx === totalSegs - 1 && dayInSeg === segDays);

        const lunchSpot = restList[(dayInSeg - 1) % restList.length] || `Traditional ${destName} Dining`;
        const dinnerSpot = restList[dayInSeg % restList.length] || `Rooftop Dining in ${destName}`;

        const slots = [];

        // Check if Day 1 is flight-based
        const isFlightTripStart = isTripStart && (
          seg.transport_option?.mode === 'flight' ||
          (seg.transport_option?.category || '').toLowerCase().includes('flight') ||
          (transName || '').toLowerCase().includes('flight') ||
          (transName || '').toLowerCase().includes('emirates') ||
          (transName || '').toLowerCase().includes('air')
        );

        let day1Timeline = null;
        if (isFlightTripStart) {
          const connectingVeh = seg.transport_option?.selected_vehicle_obj ||
            (seg.transport_option?.connecting_vehicles?.find(v => v.id === seg.transport_option?.selected_connecting_vehicle)) ||
            (seg.transport_option?.connecting_vehicles?.[0]);

          day1Timeline = calculateDay1Timeline({
            flightOption: seg.transport_option,
            connectingVehicle: connectingVeh,
            destinationName: destName,
            hotelName: hotelName,
            originName: seg.origin_name || defaultOriginCity
          });
        }

        // 1. Morning Slot (Transfer Details on Arrival/Transition Days, Sightseeing on Full Stay Days)
        if (isTripStart) {
          if (isFlightTripStart && day1Timeline) {
            slots.push(day1Timeline.slots[0]);
          } else {
            const distTxt = seg.distance_km ? ` (~${seg.distance_km} km • ${seg.duration_formatted || 'drive'})` : '';
            const startOrigin = seg.origin_name || defaultOriginCity;
            slots.push({
              period: 'Morning',
              time: '08:30 AM - 11:30 AM',
              type: 'transit',
              tag: 'Departure & Check-in',
              icon: 'car',
              title: `Departure from ${startOrigin} ➔ Arrival in ${destName}`,
              description: `Depart from **${startOrigin}** and travel to **${destName}** via **${transName}**${distTxt}. Arrive in **${destName}**, check in to **${hotelName}**, freshen up and unpack before afternoon activities.`,
              specific_name: hotelName
            });
          }
        } else if (isSegTransfer) {
          const prevSeg = segmentsConfig[segIdx - 1];
          const prevCity = prevSeg?.destination_name || 'previous destination';
          const prevHotel = prevSeg?.hotel_name || `Hotel in ${prevCity}`;
          const distTxt = seg.distance_km ? ` (~${seg.distance_km} km • ${seg.duration_formatted || 'scenic drive'})` : '';
          slots.push({
            period: 'Morning',
            time: '09:00 AM - 12:00 PM',
            type: 'transit',
            tag: 'Inter-City Transfer',
            icon: 'car',
            title: `Transfer from ${prevCity} to ${destName} via ${transName}`,
            description: `Check out from **${prevHotel}** in ${prevCity}. Board your **${transName}** for a scenic mountain road transfer to **${destName}**${distTxt}. Arrive at **${hotelName}**, complete check-in, and freshen up.`,
            specific_name: hotelName
          });
        } else {
          const morningAtt = attractList[attIdx % totalAtts];
          attIdx++;
          const feeStr = morningAtt.entry_fee > 0 ? ` (Entry: ₹${parseInt(morningAtt.entry_fee)})` : '';
          slots.push({
            period: 'Morning',
            time: '09:00 AM - 12:00 PM',
            type: 'sightseeing',
            tag: 'Morning Sightseeing',
            icon: 'sunrise',
            title: `Visit ${morningAtt.name}`,
            description: `Explore **${morningAtt.name}**${feeStr} - ${morningAtt.description || `Famous scenic highlight and nature viewpoint in ${destName}.`}`,
            specific_name: morningAtt.name
          });
        }

        // 2. Lunch Slot
        const lunchTimeSlot = (isFlightTripStart && day1Timeline) ? day1Timeline.lunchTime : '12:30 PM - 02:00 PM';
        slots.push({
          period: 'Lunch',
          time: lunchTimeSlot,
          type: 'dining',
          tag: 'Regional Dining',
          icon: 'utensils',
          title: `Lunch at ${lunchSpot}`,
          description: `Savor signature Kerala delicacies and regional specialities at **${lunchSpot}** in ${destName}.`,
          specific_name: lunchSpot
        });

        // 3. Afternoon Slot
        const afternoonTimeSlot = (isFlightTripStart && day1Timeline) ? day1Timeline.afternoonTime : '02:30 PM - 05:00 PM';
        const afternoonAtt = attractList[attIdx % totalAtts];
        attIdx++;
        const aFeeStr = afternoonAtt.entry_fee > 0 ? ` (Entry: ₹${parseInt(afternoonAtt.entry_fee)})` : '';
        slots.push({
          period: 'Afternoon',
          time: afternoonTimeSlot,
          type: 'sightseeing',
          tag: 'Afternoon Excursion',
          icon: 'sun',
          title: `Excursion to ${afternoonAtt.name}`,
          description: `Head to **${afternoonAtt.name}**${aFeeStr} - ${afternoonAtt.description || `Guided exploration at ${afternoonAtt.name}.`}`,
          specific_name: afternoonAtt.name
        });

        // 4. Evening Slot
        const eveningTimeSlot = (isFlightTripStart && day1Timeline) ? day1Timeline.eveningTime : '05:30 PM - 07:30 PM';
        slots.push({
          period: 'Evening',
          time: eveningTimeSlot,
          type: 'leisure',
          tag: isTripEnd ? 'Souvenir Shopping' : 'Sunset Overlook',
          icon: 'sunset',
          title: isTripEnd ? `Souvenir Shopping & Golden Hour in ${destName}` : `Sunset Point & Tea Estate Stroll in ${destName}`,
          description: isTripEnd
            ? `Stroll through ${destName} town bazaars for organic spices, handcrafted souvenirs, and tea estates before wrapping up.`
            : `Experience the breathtaking sunset views and refreshing mountain breeze in ${destName}.`,
          specific_name: `${destName} Promenade`
        });

        // 5. Dinner & Overnight Stay Slot
        const dinnerTimeSlot = (isFlightTripStart && day1Timeline) ? day1Timeline.dinnerTime : '08:00 PM - 10:00 PM';
        slots.push({
          period: 'Dinner',
          time: dinnerTimeSlot,
          type: 'dining',
          tag: 'Dinner & Stay',
          icon: 'moon',
          title: `Dinner at ${dinnerSpot} & Rest at ${hotelName}`,
          description: `Conclude Day ${currentDayNumber} with a relaxing dinner at **${dinnerSpot}**, followed by an overnight rest at **${hotelName}**.`,
          specific_name: hotelName
        });

        // Add custom items for this segment
        (seg.custom_items || []).forEach(ci => {
          slots.push({
            period: 'Custom Activity',
            time: 'Flexible Slot',
            type: 'custom',
            tag: 'Personalized Highlight',
            icon: 'sparkles',
            title: `Custom Visit: ${ci.name}`,
            description: ci.description || `Special personalized stop in ${destName}.`,
            specific_name: ci.name
          });
        });

        fullItinerary.push({
          day: currentDayNumber,
          segment_index: segIdx,
          destination_id: seg.destination_id,
          destination_name: destName,
          theme: `Day ${currentDayNumber}: Highlights of ${destName} (Day ${dayInSeg} of ${segDays})`,
          morning: slots[0].description,
          lunch: slots[1].description,
          afternoon: slots[2].description,
          evening: slots[3].description,
          dinner: slots[4].description,
          hotel_name: hotelName,
          slots
        });

        currentDayNumber++;
      }
    });

    return fullItinerary;
  }, [segmentsConfig, focusedTransit.origin, preferences?.source_location]);

  // =========================================================================
  // ITEMIZED DYNAMIC BUDGET & COST CALCULATIONS
  // =========================================================================
  const budgetCalculations = useMemo(() => {
    let accommodationCost = 0;
    let transportCost = 0;
    let foodCost = 0;
    let sightseeingCost = 0;
    const roomsNeeded = Math.max(1, Math.ceil(travelersCount / 2));

    segmentsConfig.forEach(seg => {
      const nights = seg.duration_days;
      accommodationCost += Math.round((seg.hotel_price || 1600) * roomsNeeded * nights);

      const transFare = seg.transport_option?.total_fare ? parseFloat(seg.transport_option.total_fare) : (1200 * seg.duration_days);
      transportCost += Math.round(transFare);

      const avgMeal = seg.selected_restaurants.length > 0
        ? seg.selected_restaurants.reduce((acc, r) => acc + parseFloat(r.avg_cost || 300), 0) / seg.selected_restaurants.length
        : 300;
      foodCost += Math.round(avgMeal * travelersCount * seg.duration_days * 3);

      const totalFees = seg.selected_attractions.reduce((sum, a) => sum + parseFloat(a.entry_fee || 0), 0);
      sightseeingCost += Math.round(totalFees > 0 ? (totalFees * travelersCount) : (150 * travelersCount * seg.duration_days));
    });

    const subtotal = accommodationCost + transportCost + foodCost + sightseeingCost;
    const miscCost = Math.round(subtotal * 0.06);
    const totalEstimatedCost = Math.round(subtotal + miscCost);
    const perPersonCost = Math.round(totalEstimatedCost / travelersCount);
    const dailyAverageCost = Math.round(totalEstimatedCost / durationDays);

    const isWithinBudget = userBudget > 0 ? (totalEstimatedCost <= userBudget) : true;
    const budgetVariance = userBudget > 0 ? Math.round(userBudget - totalEstimatedCost) : 0;
    const budgetUtilizedPct = userBudget > 0 ? Math.min(100, Math.round((totalEstimatedCost / userBudget) * 100)) : 100;

    return {
      accommodationCost,
      transportCost,
      foodCost,
      sightseeingCost,
      miscCost,
      totalEstimatedCost,
      perPersonCost,
      dailyAverageCost,
      isWithinBudget,
      budgetVariance,
      budgetUtilizedPct,
      roomsNeeded,
      nights: durationDays
    };
  }, [segmentsConfig, travelersCount, durationDays, userBudget]);

  // Handle Adding Place to Custom Day Highlights
  const handleAddPlaceToTrip = (place) => {
    const destId = focusedDestId;
    setCustomItineraryItems(prev => {
      const currentList = prev[destId] || [];
      if (currentList.some(item => item.id === place.id && item.name === place.name)) {
        return { ...prev, [destId]: currentList.filter(item => item.id !== place.id) };
      }
      return { ...prev, [destId]: [...currentList, place] };
    });

    setSaveStatus(`Updated trip highlights for ${place.name}!`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const isPlaceInTrip = (placeId) => {
    const customList = customItineraryItems[focusedDestId] || [];
    const checkedList = selectedAttractions[focusedDestId] || [];
    return customList.some(p => p.id === placeId) || checkedList.includes(placeId);
  };

  const toggleAttractionSelection = (att) => {
    const destId = focusedDestId;
    setSelectedAttractions(prev => {
      const current = prev[destId] || [];
      if (current.includes(att.id)) {
        return { ...prev, [destId]: current.filter(id => id !== att.id) };
      }
      return { ...prev, [destId]: [...current, att.id] };
    });
  };

  // Location Selector Handlers
  const handleOriginChange = (newOrigin) => {
    fetchTransitForDest(focusedDestId, newOrigin, focusedTransit.destination || expectedDestForFocused);
  };

  const handleDestinationChange = (newDest) => {
    fetchTransitForDest(focusedDestId, focusedTransit.origin || expectedOriginForFocused, newDest);
  };

  const handleSwapLocations = () => {
    const orig = focusedTransit.origin || expectedOriginForFocused;
    const dest = focusedTransit.destination || expectedDestForFocused;
    fetchTransitForDest(focusedDestId, dest, orig);
  };

  // =========================================================================
  // VIEW & GENERATE ITINERARY HANDLER (STRICT SELECTION ENFORCEMENT)
  // =========================================================================
  const handleGenerateOrViewItinerary = () => {
    if (!selectionStatus.isComplete) {
      const firstMissing = selectionStatus.missingList[0];
      setSelectionAlert({
        title: 'Complete Selections to Generate Itinerary',
        missing: selectionStatus.missingList,
        targetStopIdx: firstMissing?.stopIdx ?? 0,
        targetSection: firstMissing?.section ?? 'hotels'
      });
      return;
    }

    setIsItineraryGenerated(true);
    setActiveSection('itinerary');
    setSelectionAlert(null);

    // Smooth scroll down to itinerary
    setTimeout(() => {
      const el = document.getElementById('section-itinerary');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    setSaveStatus('✨ Personalized Day-by-Day Itinerary Generated Successfully!');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Quick auto-select recommendations for missing items
  const handleAutoSelectMissingAndGenerate = () => {
    // Auto-fill hotels, transports, restaurants for any unfilled stop
    stops.forEach((st) => {
      const sId = st.destinationId;
      const sHotels = (destDetailsMap[sId]?.hotels || []).length > 0 ? destDetailsMap[sId].hotels : (normalizedRecs.find(r => r.destinationId === sId)?.hotels || []);
      const sRests = (destDetailsMap[sId]?.restaurants || []).length > 0 ? destDetailsMap[sId].restaurants : (normalizedRecs.find(r => r.destinationId === sId)?.restaurants || []);
      const sTrans = destTransitState[sId]?.options || [];

      if (!selectedHotels[sId] && sHotels.length > 0) {
        setSelectedHotels(prev => ({ ...prev, [sId]: sHotels[0].id }));
      }
      if (!selectedTransports[sId] && sTrans.length > 0) {
        setSelectedTransports(prev => ({ ...prev, [sId]: sTrans[0].id }));
      }
      if ((!selectedRestaurants[sId] || selectedRestaurants[sId].length === 0) && sRests.length > 0) {
        setSelectedRestaurants(prev => ({ ...prev, [sId]: sRests.slice(0, 2).map(r => r.id) }));
      }
    });

    setIsItineraryGenerated(true);
    setActiveSection('itinerary');
    setSelectionAlert(null);

    setTimeout(() => {
      const el = document.getElementById('section-itinerary');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    setSaveStatus('✨ Auto-Selected Recommended Stays, Dining & Transit — Itinerary Generated!');
    setTimeout(() => setSaveStatus(null), 4500);
  };

  // =========================================================================
  // SAVE TRIP POPUP DIALOG & SUBMISSION
  // =========================================================================
  const handleOpenSaveModal = () => {
    if (!primaryDest) return;

    // Generate smart default trip title
    const stopNames = stops.map(s => s.destinationName).join(' & ');
    const defaultTitle = stops.length > 1
      ? `${stopNames} Multi-Destination Journey`
      : `Journey to ${stops[0]?.destinationName || primaryDest.destinationName}`;

    setCustomTripName(defaultTitle);
    setIsSaveModalOpen(true);
  };

  const buildSaveTripPayload = (tripTitleToUse) => {
    const originName = (typeof focusedTransit.origin === 'object' && focusedTransit.origin !== null)
      ? (focusedTransit.origin.name || focusedTransit.origin.label || '')
      : (focusedTransit.origin || preferences?.source_location || 'Kochi');

    const primaryDestObj = segmentsConfig[0];
    const defaultTitle = stops.length > 1
      ? `${stops.map(s => s.destinationName).join(' & ')} Multi-Destination Journey`
      : `Journey to ${stops[0]?.destinationName || primaryDest.destinationName}`;

    return {
      destination_id: primaryDestId,
      source_location: originName,
      budget: userBudget || budgetCalculations.totalEstimatedCost,
      travelers: travelersCount,
      duration_days: durationDays,
      interests: preferences?.interests || [],
      itinerary: structuredItineraryPayload,
      estimated_cost: budgetCalculations.totalEstimatedCost,
      hotel_id: primaryDestObj?.hotel_id || null,
      travel_date: preferences?.travel_date || preferences?.travelDate || '',
      trip_name: tripTitleToUse || defaultTitle,
      travel_style: preferences?.style || 'balanced',
      pace: preferences?.pace || 'moderate',
      segments: segmentsConfig.map(s => ({
        destination_id: s.destination_id,
        destination_name: s.destination_name,
        duration_days: s.duration_days,
        hotel_id: s.hotel_id,
        hotel_name: s.hotel_name,
        hotel_price: s.hotel_price,
        selected_restaurants: s.selected_restaurants,
        selected_attractions: s.selected_attractions,
        transport_option: s.transport_option
      })),
      route_data: {
        origin: originName,
        primary_destination: primaryDest.destinationName,
        stops: stops.map(s => s.destinationName),
        distance_km: focusedTransit.distance_km || 0
      },
      cost_breakdown: budgetCalculations
    };
  };

  const handleConfirmSaveTrip = async (customTitle) => {
    if (!primaryDest) return;
    setSavingTrip(true);
    setSaveStatus('Saving your personalized trip plan...');
    setDateConflictError(null);

    try {
      const payload = buildSaveTripPayload(customTitle);
      await tripService.saveTrip(payload);
      setTripSavedSuccessfully(true);
      setIsSaveModalOpen(false);
      setDateConflictError(null);
      setSaveStatus(`🎉 Trip "${customTitle}" saved successfully! You can view and manage it anytime in "My Trips".`);
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err) {
      console.error('Failed to save trip plan:', err);
      const resMsg = err?.response?.data?.message || err?.message;
      if (err?.response?.status === 401 || !localStorage.getItem('token')) {
        setSaveStatus('Please log in to save your trip.');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err?.response?.data?.error === 'DATE_CONFLICT' || (resMsg && resMsg.toLowerCase().includes('date conflict'))) {
        setDateConflictError(resMsg);
        setSaveStatus(`⚠️ ${resMsg}`);
      } else {
        setSaveStatus(resMsg || 'Could not save trip. Please check your connection and try again.');
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } finally {
      setSavingTrip(false);
    }
  };

  const handleGoToItineraryAndWeather = async () => {
    if (!primaryDest) return;

    if (!selectionStatus.isComplete) {
      handleGenerateOrViewItinerary();
      return;
    }

    setSavingTrip(true);
    setSaveStatus('Saving your personalized trip and opening full itinerary...');
    setDateConflictError(null);

    try {
      const stopNames = stops.map(s => s.destinationName).join(' & ');
      const defaultTitle = stops.length > 1
        ? `${stopNames} Multi-Destination Journey`
        : `Journey to ${stops[0]?.destinationName || primaryDest.destinationName}`;

      const payload = buildSaveTripPayload(customTripName || defaultTitle);
      const saveRes = await tripService.saveTrip(payload);

      setSaveStatus('Opening your day-by-day Itinerary & Weather Forecast...');
      setTimeout(() => {
        if (saveRes?.trip?.id) {
          navigate(`/trips/${saveRes.trip.id}`);
        } else {
          navigate('/my-trips');
        }
      }, 700);
    } catch (err) {
      console.error('Failed to save trip plan:', err);
      const resMsg = err?.response?.data?.message || err?.message;
      if (err?.response?.status === 401 || !localStorage.getItem('token')) {
        setSaveStatus('Please log in to save and view your full itinerary.');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err?.response?.data?.error === 'DATE_CONFLICT' || (resMsg && resMsg.toLowerCase().includes('date conflict'))) {
        setDateConflictError(resMsg);
        setIsConflictModalOpen(true);
        setSaveStatus(`⚠️ ${resMsg}`);
      } else {
        setSaveStatus(resMsg || 'Could not load itinerary. Please ensure all details are valid.');
        setTimeout(() => setSaveStatus(null), 3500);
      }
    } finally {
      setSavingTrip(false);
    }
  };

  // -------------------------------------------------------------------------
  // 1. EMPTY STATE: NO PREFERENCES
  // -------------------------------------------------------------------------
  if (normalizedRecs.length === 0 && !preferences) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.2),_transparent_35%),linear-gradient(135deg,_#07111f_0%,_#0b1528_100%)] text-slate-100 py-24 px-4 font-sans">
        <div className="text-center space-y-5 max-w-md mx-auto rounded-3xl border border-slate-700/70 bg-[#101b30]/95 p-8 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 w-fit mx-auto">
            <Compass className="h-10 w-10 animate-spin-slow" />
          </div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">No Trip Recommendations Loaded</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-semibold">
            Please enter your travel dates, budget, origin, and interests in the planner to generate personalized recommendations.
          </p>
          <Link
            to="/plan-trip"
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md hover:opacity-95 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Launch Trip Planner</span>
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. EMPTY STATE: BUDGET CONSTRAINT NOTICE
  // -------------------------------------------------------------------------
  if (normalizedRecs.length === 0 && preferences) {
    const enteredBudget = parseFloat(preferences.budget || 0);
    const recommendedMinBudget = Math.round(travelersCount * durationDays * 1500 * 1.35);

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.2),_transparent_35%),linear-gradient(135deg,_#07111f_0%,_#0b1528_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8 font-sans">
        <div className="mx-auto max-w-3xl space-y-6 text-left">
          <Link
            to="/plan-trip"
            state={{ preferences }}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Trip Planner</span>
          </Link>

          <div className="rounded-[28px] border border-amber-500/30 bg-[#101b30]/95 p-6 sm:p-8 shadow-[0_20px_60px_rgba(2,8,23,0.35)] space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-block text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Budget Constraint Notice
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  No Destinations Found Within That Budget
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {apiMessage || `There are no destinations in our catalog with total estimated trip costs within your budget limit of ₹${enteredBudget.toLocaleString()}.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b1528] rounded-2xl border border-slate-700/60 p-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                  <Receipt className="h-3 w-3 mr-1 text-cyan-400" /> Entered Budget
                </span>
                <span className="text-sm font-black text-amber-400">₹{enteredBudget.toLocaleString()}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                  <Users className="h-3 w-3 mr-1 text-cyan-400" /> Travelers
                </span>
                <span className="text-sm font-black text-slate-100">{travelersCount} Pax</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-cyan-400" /> Duration
                </span>
                <span className="text-sm font-black text-slate-100">{durationDays} Days</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-cyan-400" /> Source
                </span>
                <span className="text-sm font-black text-slate-100 truncate block">
                  {preferences?.source_location || 'Kochi'}
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-[#0b1528]/80 border border-slate-700/60 p-5">
              <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300">
                <Lightbulb className="h-4 w-4" />
                <span>AI Suggestions to Match Destinations:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium list-disc list-inside">
                <li>
                  <strong className="text-slate-100">Increase Budget:</strong> For {travelersCount} traveler(s) across {durationDays} day(s), minimum estimated costs typically begin around <span className="text-cyan-300 font-bold">₹{recommendedMinBudget.toLocaleString()}</span>.
                </li>
                <li>
                  <strong className="text-slate-100">Adjust Duration or Travelers:</strong> Reducing duration or group size brings transport and stay costs within range.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/plan-trip"
                state={{ preferences }}
                className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
              >
                <Sparkles className="h-4 w-4 text-cyan-100" />
                <span>Modify Travel Budget & Preferences</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 3. MAIN WORKSPACE
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.2),_transparent_35%),linear-gradient(135deg,_#07111f_0%,_#0b1528_100%)] text-slate-100 px-3 sm:px-6 py-6 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ========================================================================= */}
        {/* SECTION 1: WORKSPACE HEADER & MULTI-DESTINATION TRIP CONTROLLER */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-700/70 bg-[#0b1528]/95 p-5 sm:p-6 shadow-[0_20px_50px_rgba(2,8,23,0.35)] backdrop-blur-md space-y-5">

          {/* Top Row: Navigation + Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/plan-trip"
                state={{ preferences }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-cyan-300 border border-slate-700/80 bg-[#101b30] px-3 py-2 rounded-xl transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Edit Input</span>
              </Link>

              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  Travel Recommendations Workspace
                </h1>
              </div>

              {primaryDest && (
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-full">
                  Match Score: {primaryDest.displayScore}%
                </span>
              )}
            </div>

            {/* TOP CTA BUTTONS: SAVE TRIP + ESTIMATE COST + VIEW ITINERARY */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenSaveModal}
                disabled={savingTrip}
                className="flex items-center space-x-1.5 rounded-2xl bg-[#101b30] hover:bg-[#14233f] text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 px-4 py-3.5 text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {tripSavedSuccessfully ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300">Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 text-cyan-400" />
                    <span>Save Trip</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsCostModalOpen(true)}
                className="flex items-center space-x-2 rounded-2xl bg-[#101b30] hover:bg-[#14233f] text-amber-300 border border-amber-500/50 hover:border-amber-400 px-4 py-3.5 text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer group"
                title="View detailed itemized trip cost estimate"
              >
                <Calculator className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Estimate Cost</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateOrViewItinerary}
                disabled={savingTrip}
                className={`flex items-center space-x-2 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer group ${
                  selectionStatus.isComplete
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:opacity-95 shadow-[0_0_25px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50 animate-pulse'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-95'
                }`}
              >
                <Calendar className="h-4 w-4 text-cyan-100" />
                <span>{isItineraryGenerated ? 'View Itinerary' : 'Generate Itinerary'}</span>
                <ArrowRight className="h-4 w-4 text-cyan-100 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* FEATURE: MULTI-DESTINATION / SPLIT STAY CONTROLLER (EXPANDED FOR 3+ STOPS) */}
          <div className="rounded-2xl bg-gradient-to-r from-[#101b30] to-[#0f1d38] border border-cyan-500/30 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Split className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 tracking-tight flex items-center gap-2">
                    <span>Multi-Destination Journey Personalization</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      {stops.length} Stops ({durationDays} Days Total)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Customize single or multi-stop routes across Kerala. Add stops, allocate days, and choose stays & dining for each destination.
                  </p>
                </div>
              </div>

              {/* Mode Toggle Button & Add Stop */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleMode(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isMultiDestMode
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'bg-[#0b1528] text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  Single Destination
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMode(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isMultiDestMode
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black shadow-md'
                      : 'bg-[#0b1528] text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Multi-Stop ({stops.length} Stops)</span>
                </button>

                {isMultiDestMode && (
                  <button
                    type="button"
                    onClick={() => handleAddStop(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/50 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Stop</span>
                  </button>
                )}
              </div>
            </div>

            {/* STOPS CARDS GRID (1, 2, 3, 4, 5+ DESTINATION STOPS) */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {stops.map((stop, sIdx) => {
                  const isCurrentActive = activeSegmentIdx === sIdx;
                  const stStatus = selectionStatus.stopsStatus[sIdx];

                  return (
                    <div
                      key={`${stop.destinationId}-${sIdx}`}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isCurrentActive
                          ? 'bg-blue-600/20 border-cyan-400 ring-1 ring-cyan-400/40 shadow-lg'
                          : 'bg-[#0b1528] border-slate-700/70 hover:border-slate-600'
                      }`}
                    >
                      {/* Top Header of Stop */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className={`h-6 w-6 rounded-lg font-black text-xs flex items-center justify-center border shrink-0 ${
                            sIdx === 0
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : sIdx === 1
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {sIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                              {sIdx === 0 ? 'Primary Stop' : `Stop #${sIdx + 1}`}
                            </span>

                            {/* Dropdown / Destination Selector */}
                            <select
                              value={stop.destinationId}
                              onChange={(e) => {
                                const chosenId = parseInt(e.target.value);
                                const found = allDestinations.find(d => d.id === chosenId) ||
                                  normalizedRecs.find(d => d.destinationId === chosenId) ||
                                  nearbySuggestions.find(d => d.destination_id === chosenId);
                                if (found) handleChangeStopDestination(sIdx, found);
                              }}
                              className="bg-[#101b30] text-slate-100 font-black text-xs sm:text-sm border border-slate-700 rounded-lg px-2 py-1 focus:border-cyan-400 outline-none cursor-pointer mt-0.5 max-w-[150px] sm:max-w-[180px] truncate"
                            >
                              <optgroup label="Recommended">
                                {normalizedRecs.map(nr => (
                                  <option key={`rec-${nr.destinationId}`} value={nr.destinationId}>
                                    ⭐ {nr.destinationName}
                                  </option>
                                ))}
                              </optgroup>
                              {nearbySuggestions.length > 0 && (
                                <optgroup label="Nearby Scenic Pairings">
                                  {nearbySuggestions.map(nb => (
                                    <option key={`nb-${nb.destination_id}`} value={nb.destination_id}>
                                      📍 {nb.name} ({nb.drive_time})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="All Kerala Escapes">
                                {allDestinations.map(ad => (
                                  <option key={`all-${ad.id}`} value={ad.id}>
                                    {ad.name} ({ad.category || 'Kerala'})
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                        </div>

                        {/* Days Stepper & Delete */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <div className="flex items-center space-x-1.5 bg-[#101b30] px-2 py-1 rounded-xl border border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleAdjustStopDays(sIdx, -1)}
                              className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-cyan-300 min-w-[38px] text-center">
                              {stop.days || 1}D
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStopDays(sIdx, 1)}
                              className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {stops.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStop(sIdx)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title={`Remove Stop #${sIdx + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Selection Status Checklist Indicators for Stop */}
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold pt-1 border-t border-slate-800/80">
                        <div className={`p-1 rounded-lg border text-center flex items-center justify-center gap-1 ${
                          stStatus?.hasHotel
                            ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                            : 'bg-[#101b30] text-slate-500 border-slate-800'
                        }`}>
                          <Bed className="h-3 w-3" />
                          <span>{stStatus?.hasHotel ? 'Stay Set' : 'Stay Pending'}</span>
                        </div>

                        <div className={`p-1 rounded-lg border text-center flex items-center justify-center gap-1 ${
                          stStatus?.hasTransport
                            ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30'
                            : 'bg-[#101b30] text-slate-500 border-slate-800'
                        }`}>
                          <Car className="h-3 w-3" />
                          <span>{stStatus?.hasTransport ? 'Transit Set' : 'Transit Pending'}</span>
                        </div>

                        <div className={`p-1 rounded-lg border text-center flex items-center justify-center gap-1 ${
                          stStatus?.hasRestaurant
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                            : 'bg-[#101b30] text-slate-500 border-slate-800'
                        }`}>
                          <Utensils className="h-3 w-3" />
                          <span>{stStatus?.hasRestaurant ? `${stStatus.restCount} Dining` : 'Dining Pending'}</span>
                        </div>
                      </div>

                      {/* Bottom Active Switch */}
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => setActiveSegmentIdx(sIdx)}
                          className={`text-xs font-bold transition-all ${
                            isCurrentActive
                              ? 'text-cyan-300 underline font-black'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {isCurrentActive
                            ? `● Customizing ${stop.destinationName}`
                            : `Click to customize ${stop.destinationName}`
                          }
                        </button>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Stop {sIdx + 1} of {stops.length}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Destination Pills for Easy Stop Addition / Swap */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Quick-Add Scenic Escapes & Paired Destinations:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold hidden sm:inline">
                    Click any destination to append to your trip route
                  </span>
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {(nearbySuggestions.length > 0 ? nearbySuggestions : allDestinations.slice(0, 10)).map((nearby) => {
                    const dId = nearby.destination_id || nearby.id;
                    const dName = nearby.name;
                    const isAlreadyStop = stops.some(s => s.destinationId === dId);

                    return (
                      <button
                        key={dId}
                        type="button"
                        onClick={() => {
                          if (!isAlreadyStop) {
                            handleAddStop({
                              destination_id: dId,
                              name: dName,
                              category: nearby.category,
                              image_url: nearby.image_url,
                              distance_km: nearby.distance_km,
                              drive_time: nearby.drive_time
                            });
                          } else {
                            const foundIdx = stops.findIndex(s => s.destinationId === dId);
                            if (foundIdx !== -1) setActiveSegmentIdx(foundIdx);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all flex items-center space-x-2 cursor-pointer ${
                          isAlreadyStop
                            ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-sm ring-1 ring-purple-400/40'
                            : 'bg-[#0b1528] border-slate-700/70 text-slate-300 hover:border-cyan-500 hover:bg-[#101b30]'
                        }`}
                      >
                        <span>{dName}</span>
                        {nearby.distance_km && (
                          <span className="text-[10px] text-cyan-400 bg-[#101b30] px-1.5 py-0.5 rounded border border-slate-700">
                            ~{nearby.distance_km} km
                          </span>
                        )}
                        {isAlreadyStop ? (
                          <CheckCircle2 className="h-3 w-3 text-purple-300" />
                        ) : (
                          <Plus className="h-3 w-3 text-cyan-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
            {/* 1. Route */}
            <div className="p-3 bg-[#101b30] rounded-2xl border border-slate-700/60 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-cyan-400" /> Route Stops
              </span>
              <div className="font-black text-slate-100 truncate flex items-center gap-1 text-[11px]">
                <span className="text-cyan-300">{preferences?.source_location || 'Kochi'}</span>
                {stops.map((s, idx) => (
                  <React.Fragment key={idx}>
                    <span className="text-slate-500">➔</span>
                    <span className={idx === 0 ? 'text-emerald-300' : 'text-purple-300'}>
                      {s.destinationName}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* 2. Dates & Duration */}
            <div className="p-3 bg-[#101b30] rounded-2xl border border-slate-700/60 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-cyan-400" /> Travel Dates
              </span>
              <span className="font-black text-slate-100 block truncate">
                {preferences?.travel_date || 'Upcoming'} • {durationDays} Days
              </span>
            </div>

            {/* 3. Travelers */}
            <div className="p-3 bg-[#101b30] rounded-2xl border border-slate-700/60 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                <Users className="h-3 w-3 mr-1 text-cyan-400" /> Group Size
              </span>
              <span className="font-black text-slate-100 block capitalize">
                {travelersCount} Traveler{travelersCount > 1 ? 's' : ''} ({preferences?.group_type || 'Family'})
              </span>
            </div>

            {/* 4. Estimated Cost */}
            <div className="p-3 bg-[#101b30] rounded-2xl border border-slate-700/60 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                <Receipt className="h-3 w-3 mr-1 text-cyan-400" /> Estimated Cost
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="font-black text-slate-100 text-sm">₹{budgetCalculations.totalEstimatedCost.toLocaleString()}</span>
                <span className="text-[10px] text-cyan-300 font-bold">(₹{budgetCalculations.perPersonCost.toLocaleString()}/pax)</span>
              </div>
            </div>

            {/* 5. Budget Status */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3 bg-[#101b30] rounded-2xl border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400 uppercase">Budget Tracker</span>
                {budgetCalculations.isWithinBudget ? (
                  <span className="text-emerald-400 font-black flex items-center">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Within
                  </span>
                ) : (
                  <span className="text-amber-400 font-black flex items-center">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Exceeds
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    budgetCalculations.isWithinBudget
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetCalculations.budgetUtilizedPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Status Alert Banner */}
          {saveStatus && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-xs text-cyan-300 font-bold flex items-center space-x-2"
            >
              <Check className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{saveStatus}</span>
            </motion.div>
          )}

          {/* Selection Alert Banner (when user attempts to view itinerary without selecting all required items) */}
          {selectionAlert && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 font-medium space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{selectionAlert.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectionAlert(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1 pl-6">
                <p className="text-[11px] text-slate-300">
                  To personalize every slot in your day-by-day plan, please choose your hotel stay, dining spots, and transportation:
                </p>
                <ul className="list-disc list-inside text-[11px] text-amber-300 font-semibold space-y-0.5">
                  {selectionAlert.missing.map((m, mIdx) => (
                    <li key={mIdx}>{m.message}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2 pt-1 pl-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSegmentIdx(selectionAlert.targetStopIdx);
                    setActiveSection(selectionAlert.targetSection);
                    const el = document.getElementById(`section-${selectionAlert.targetSection}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 transition-colors"
                >
                  Go to {selectionAlert.targetSection.toUpperCase()} for Stop {selectionAlert.targetStopIdx + 1}
                </button>
                <button
                  type="button"
                  onClick={handleAutoSelectMissingAndGenerate}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700"
                >
                  Auto-Select Recommendations & Generate
                </button>
              </div>
            </motion.div>
          )}

          {/* Quick Section Jump Navigation Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pt-1 pb-1 scrollbar-none text-xs font-bold border-t border-slate-700/50">
            {[
              { id: 'hotels', label: '🏨 1. Stays & Hotels', badge: selectedHotelForFocused ? '✓ Chosen' : 'Required' },
              { id: 'transport', label: '🚗 2. Transport & Route', badge: selectedTransIdForFocused ? '✓ Chosen' : 'Required' },
              { id: 'restaurants', label: '🍽️ 3. Dining & Restaurants', badge: selectedRestIdsForFocused.length > 0 ? `${selectedRestIdsForFocused.length} Selected` : 'Required' },
              { id: 'places', label: '🏛️ 4. Attractions & Sightseeing' },
              { id: 'all', label: '🗂️ All Customization Panels' },
              { id: 'itinerary', label: '📅 Detailed Personalized Itinerary', badge: isItineraryGenerated ? `${structuredItineraryPayload.length} Days` : 'Locked' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSection(tab.id);
                  if (tab.id !== 'all' && tab.id !== 'itinerary') {
                    const el = document.getElementById(`section-${tab.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`px-3.5 py-2 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeSection === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black shadow-md border-transparent'
                    : 'bg-[#101b30] border-slate-700/60 text-slate-300 hover:text-white hover:bg-[#14233f]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black ${
                    tab.badge.includes('✓')
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : tab.badge === 'Required'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* WORKSPACE CONTENT AREA */}
        {/* ========================================================================= */}
        <div className="space-y-6">

          {/* ===================================================================== */}
          {/* TAB 1: ACCOMMODATIONS & STAYS CUSTOMIZATION */}
          {/* ===================================================================== */}
          {(activeSection === 'hotels' || activeSection === 'all') && (
            <div id="section-hotels" className="rounded-3xl border border-slate-700/70 bg-[#101b30] p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                    <Bed className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <span>Accommodations & Stays ({focusedDest?.destinationName})</span>
                      {selectedHotelForFocused && (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                          ✓ Stay Selected
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Select your preferred accommodation. It will be scheduled for check-in and overnight stays in {focusedDest?.destinationName}.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {focusedHotels.length} Stays Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {focusedHotels.map((h, idx) => {
                  const isSelected = (selectedHotelForFocused === h.id) || (!selectedHotelForFocused && idx === 0);
                  const currentStopDays = focusedDest?.days || 2;
                  const stayTotal = Math.round(parseFloat(h.price_per_night || 1500) * budgetCalculations.roomsNeeded * currentStopDays);

                  return (
                    <div
                      key={h.id || idx}
                      onClick={() => {
                        setSelectedHotels(prev => ({ ...prev, [focusedDestId]: h.id }));
                        setSaveStatus(`Selected ${h.name} for ${focusedDest?.destinationName}!`);
                        setTimeout(() => setSaveStatus(null), 2500);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-blue-600/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/30'
                          : 'bg-[#0b1528] border-slate-700/70 hover:border-slate-600 hover:bg-[#101b30]'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] uppercase font-black tracking-wider text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                              {h.hotel_type || 'Resort Stay'}
                            </span>
                            <h4 className="font-black text-sm text-slate-100 flex items-center gap-1.5 mt-1">
                              <span>{h.name}</span>
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300 shrink-0" />}
                            </h4>
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              ⭐ {h.rating || 4.4} • {h.address || `${focusedDest?.destinationName} Center`}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-cyan-300 font-black text-sm block">
                              ₹{parseInt(h.price_per_night || 1500).toLocaleString()}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold block">/ night</span>
                          </div>
                        </div>

                        {h.amenities && (
                          <div className="flex flex-wrap gap-1">
                            {h.amenities.split(',').slice(0, 3).map((amen, aIdx) => (
                              <span key={aIdx} className="text-[9px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-medium">
                                {amen.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div className="text-[10px] text-slate-400">
                          Total for {currentStopDays} Nights: <strong className="text-slate-100">₹{stayTotal.toLocaleString()}</strong> ({budgetCalculations.roomsNeeded} room)
                        </div>

                        {h.website && (
                          <a
                            href={h.website.startsWith('http') ? h.website : `https://${h.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            <Globe className="h-2.5 w-2.5" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: TRANSPORTATION & ROUTE MAP */}
          {/* ===================================================================== */}
          {(activeSection === 'transport' || activeSection === 'all') && (
            <div id="section-transport" className="rounded-3xl border border-slate-700/70 bg-[#101b30] p-5 sm:p-6 shadow-lg space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
                      <span>Transportation & Live Route ({focusedDest?.destinationName})</span>
                      {selectedTransIdForFocused && (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                          ✓ Mode Selected
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Select your transit mode to connect your origin or previous stop with {focusedDest?.destinationName}
                    </p>
                  </div>
                </div>

                {focusedTransit.distance_km > 0 && (
                  <span className="text-xs font-black text-slate-100 bg-[#0b1528] px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-sm flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{focusedTransit.distance_km} km</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-cyan-300">{focusedTransit.duration_formatted || 'Road route'}</span>
                  </span>
                )}
              </div>

              {/* Location Search & Swap */}
              <TravelLocationSelector
                origin={focusedTransit.origin || expectedOriginForFocused}
                destination={focusedTransit.destination || expectedDestForFocused}
                travelers={travelersCount}
                budget={userBudget}
                onOriginChange={handleOriginChange}
                onDestinationChange={handleDestinationChange}
                onSwap={handleSwapLocations}
                isLoading={focusedTransit.loading}
              />

              {/* Interactive Route Map */}
              <TravelMap
                origin={focusedTransit.origin || expectedOriginForFocused}
                destination={focusedTransit.destination || expectedDestForFocused}
                geometry={focusedTransit.geometry || []}
                distanceKm={focusedTransit.distance_km || 0}
                durationFormatted={focusedTransit.duration_formatted || ''}
                dataSource={focusedTransit.dataSource || 'OpenRouteService Directions API'}
                height="360px"
                interactive={true}
                allowSelection={true}
                onOriginChange={handleOriginChange}
                onDestinationChange={handleDestinationChange}
              />

              {/* Transportation Options Cards */}
              <TransportationOptions
                options={focusedTransitList}
                aiAdvice={focusedTransit.ai_advice}
                excludedModes={focusedTransit.excluded_modes}
                aiFeasibility={focusedTransit.ai_feasibility}
                originName={(typeof focusedTransit.origin === 'object' && focusedTransit.origin !== null) ? (focusedTransit.origin.name || focusedTransit.origin.label || '') : (focusedTransit.origin || preferences?.source_location || 'Kochi')}
                selectedId={selectedTransIdForFocused}
                onSelect={(opt) => {
                  setSelectedTransports(prev => ({ ...prev, [focusedDestId]: opt.id }));
                  setDestTransitState(prev => {
                    const current = prev[focusedDestId] || {};
                    const currentOpts = (current.options && current.options.length > 0) ? current.options : focusedTransitList;
                    const updatedOpts = currentOpts.map(o => o.id === opt.id ? { ...o, ...opt } : o);
                    return {
                      ...prev,
                      [focusedDestId]: {
                        ...current,
                        options: updatedOpts
                      }
                    };
                  });
                  setSaveStatus(`Selected ${opt.transport_type} for ${focusedDest?.destinationName}!`);
                  setTimeout(() => setSaveStatus(null), 2500);
                }}
                travelers={travelersCount}
                distanceKm={focusedTransit.distance_km || 0}
                isLoading={focusedTransit.loading}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: DINING & RESTAURANTS CUSTOMIZATION */}
          {/* ===================================================================== */}
          {(activeSection === 'restaurants' || activeSection === 'all') && (
            <div id="section-restaurants" className="rounded-3xl border border-slate-700/70 bg-[#101b30] p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <span>Dining & Restaurants ({focusedDest?.destinationName})</span>
                      {selectedRestIdsForFocused.length > 0 && (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                          ✓ {selectedRestIdsForFocused.length} Selected
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Select restaurants to schedule into your lunch and dinner slots during your stay in {focusedDest?.destinationName}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {focusedRestaurants.length} Places Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {focusedRestaurants.map((r, idx) => {
                  const isSelected = selectedRestIdsForFocused.includes(r.id);

                  return (
                    <div
                      key={r.id || idx}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-amber-600/15 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-[#0b1528] border-slate-700/70 hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] uppercase font-black tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                              {r.cuisine || 'Local Cuisine'}
                            </span>
                            <h4 className="font-black text-xs text-slate-100 mt-1">
                              {r.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              ⭐ {r.rating || 4.5} {r.address ? `• ${r.address}` : ''}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-amber-300 font-black text-xs block">
                              ~₹{parseInt(r.avg_cost || 300).toLocaleString()}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold block">/ meal</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-end text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRestaurants(prev => {
                              const list = prev[focusedDestId] || [];
                              if (list.includes(r.id)) {
                                return { ...prev, [focusedDestId]: list.filter(id => id !== r.id) };
                              }
                              return { ...prev, [focusedDestId]: [...list, r.id] };
                            });
                          }}
                          className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                              : 'bg-[#101b30] hover:bg-[#14233f] text-slate-200 border border-slate-700'
                          }`}
                        >
                          {isSelected ? '✓ In Dining Schedule' : '+ Add to Dining Schedule'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: ATTRACTIONS & SIGHTSEEING CUSTOMIZATION */}
          {/* ===================================================================== */}
          {(activeSection === 'places' || activeSection === 'all') && (
            <div id="section-places" className="rounded-3xl border border-slate-700/70 bg-[#101b30] p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-300">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                      Attractions & Sightseeing ({focusedDest?.destinationName})
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Select places to incorporate into your day-by-day morning and afternoon itinerary
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {focusedAttractions.length} Attractions Available
                </span>
              </div>

              {/* Attractions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {focusedAttractions.map((att, idx) => {
                  const isAdded = isPlaceInTrip(att.id);
                  const attImg = (att.image_url && att.image_url.trim()) ? att.image_url : (
                    ATTRACTION_IMAGE_FALLBACKS[att.name.toLowerCase().split(' ')[0]] ||
                    ATTRACTION_IMAGE_FALLBACKS['beach'] || focusedDest?.image_url
                  );

                  return (
                    <div
                      key={att.id || idx}
                      className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                        isAdded
                          ? 'bg-blue-950/30 border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                          : 'bg-[#0b1528] border-slate-700/70 hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Image Thumbnail */}
                        <div 
                          className="h-36 overflow-hidden relative cursor-pointer group"
                          onClick={() => setPreviewImage({
                            url: attImg,
                            title: att.name,
                            subtitle: `${focusedDest?.destinationName} • Attraction #${idx + 1}`,
                            description: att.description
                          })}
                        >
                          <img
                            src={attImg}
                            alt={att.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="h-5 w-5 text-white" />
                          </div>
                          <div className="absolute top-2 left-2 bg-[#0b1528]/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black text-cyan-300 border border-slate-700">
                            Attraction {idx + 1}
                          </div>
                          {parseFloat(att.entry_fee || 0) > 0 ? (
                            <div className="absolute top-2 right-2 bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                              🎟️ ₹{parseFloat(att.entry_fee).toLocaleString()}
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 bg-blue-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black text-cyan-300 border border-cyan-500/30">
                              Free Entry
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-3.5 space-y-1.5">
                          <h4 className="font-black text-xs text-slate-100 line-clamp-1">
                            {att.name}
                          </h4>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                            <span className="flex items-center text-amber-400">
                              <Star className="h-3 w-3 mr-0.5 fill-amber-400" /> 4.6
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-0.5 text-cyan-400" /> {att.visit_time || '2–3 hours'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {att.description || `Famous sightseeing point and scenic highlight in ${focusedDest?.destinationName}.`}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="p-3.5 pt-0 flex items-center justify-end gap-2 border-t border-slate-800/80 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            toggleAttractionSelection(att);
                            handleAddPlaceToTrip(att);
                          }}
                          className={`w-full py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                              : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-sm'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Included in Itinerary</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>Select for Itinerary</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: PERSONALIZED DAY-BY-DAY ITINERARY SECTION */}
          {/* ===================================================================== */}
          <div id="section-itinerary" className="rounded-3xl border border-slate-700/70 bg-[#101b30] p-5 sm:p-7 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
                    <span>Personalized Day-by-Day Detailed Itinerary</span>
                    {isItineraryGenerated ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                        Generated & Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/90 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                        Select All Options to Reveal
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Explicitly scheduled with your chosen accommodations, restaurants, transit options, and attractions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isItineraryGenerated && (
                  <button
                    type="button"
                    onClick={handleGoToItineraryAndWeather}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View & Print Full Itinerary</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* IF ITINERARY IS NOT YET GENERATED: SHOW CHECKLIST & GENERATE CTA */}
            {!isItineraryGenerated ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0b1528] to-[#12203b] border border-cyan-500/30 text-center space-y-5">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                  <Calendar className="h-6 w-6" />
                </div>

                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h4 className="text-lg font-black text-slate-100">
                    Ready to Generate Your Personalized Schedule?
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    To craft your exact day-by-day plan with specific check-ins, dining spots, and route transit, ensure all choices are selected above, then click the button below.
                  </p>
                </div>

                {/* Progress Checklist */}
                <div className="max-w-xl mx-auto bg-[#101b30] p-4 rounded-2xl border border-slate-700/80 space-y-3 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Stop-by-Stop Selection Status:
                  </span>

                  <div className="space-y-2 text-xs">
                    {selectionStatus.stopsStatus.map((st, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#0b1528] border border-slate-700/60 flex items-center justify-between">
                        <span className="font-bold text-slate-200">
                          Stop {idx + 1}: {st.stopName}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <span className={st.hasHotel ? 'text-emerald-400' : 'text-amber-400'}>
                            {st.hasHotel ? '✓ Stay' : '○ Stay Pending'}
                          </span>
                          <span>•</span>
                          <span className={st.hasTransport ? 'text-emerald-400' : 'text-amber-400'}>
                            {st.hasTransport ? '✓ Transit' : '○ Transit Pending'}
                          </span>
                          <span>•</span>
                          <span className={st.hasRestaurant ? 'text-emerald-400' : 'text-amber-400'}>
                            {st.hasRestaurant ? `✓ Dining (${st.restCount})` : '○ Dining Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerateOrViewItinerary}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer inline-flex items-center gap-2 group"
                >
                  <Sparkles className="h-4 w-4 text-cyan-100 group-hover:scale-110 transition-transform" />
                  <span>Generate & View Personalized Itinerary</span>
                  <ArrowRight className="h-4 w-4 text-cyan-100 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              /* GENERATED DETAILED DAY-BY-DAY TIMELINE */
              <div className="space-y-4">
                {structuredItineraryPayload.map((dayPlan) => (
                  <div
                    key={dayPlan.day}
                    className="rounded-2xl border border-slate-700/80 bg-[#0b1528] overflow-hidden shadow-sm"
                  >
                    {/* Day Header */}
                    <div className="p-4 bg-gradient-to-r from-[#101b30] to-[#0b1528] border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs shadow-sm">
                          Day {dayPlan.day}
                        </span>
                        <div>
                          <h4 className="font-black text-sm text-slate-100">{dayPlan.theme}</h4>
                          <span className="text-[10px] text-cyan-400 font-semibold">
                            Stay: {dayPlan.hotel_name} • Location: {dayPlan.destination_name}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-slate-400 hidden sm:block">
                        {dayPlan.slots.length} Activities Scheduled
                      </span>
                    </div>

                    {/* Time Slots Grid */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {dayPlan.slots.map((slot, sIdx) => {
                        const isTransit = slot.type === 'transit';
                        const isDining = slot.type === 'dining';
                        const isSightseeing = slot.type === 'sightseeing';

                        return (
                          <div
                            key={sIdx}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs transition-all ${
                              isTransit ? 'bg-cyan-950/20 border-cyan-500/30' :
                              isDining ? 'bg-amber-950/20 border-amber-500/30' :
                              isSightseeing ? 'bg-blue-950/20 border-blue-500/30' :
                              'bg-[#101b30] border-slate-700/60'
                            }`}
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                  isTransit ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                                  isDining ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  isSightseeing ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                  'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}>
                                  {slot.period}: {slot.tag || slot.type}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  ⏰ {slot.time}
                                </span>
                              </div>

                              <h5 className="font-extrabold text-slate-100 text-sm pt-0.5">
                                {slot.title}
                              </h5>

                              <div className="space-y-1.5 pt-0.5">
                                {renderFormattedText(slot.description)}
                              </div>
                            </div>

                            {slot.specific_name && (
                              <div className="shrink-0 sm:text-right">
                                <span className="text-[10px] font-black text-cyan-300 bg-[#0b1528] px-2.5 py-1 rounded-lg border border-slate-700 block">
                                  {slot.specific_name}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* BOTTOM PERSISTENT SAVE & ITINERARY CTA BAR */}
          {/* ===================================================================== */}
          <div className="rounded-3xl border border-slate-700/70 bg-[#0b1528]/95 p-5 sm:p-6 shadow-[0_20px_50px_rgba(2,8,23,0.35)] backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-bold text-slate-400">Ready to lock in your personalized journey?</span>
              <div className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <span>
                  {stops.map(s => `${s.destinationName} (${s.days}D)`).join(' + ')}
                </span>
                <span className="text-cyan-300">• ₹{budgetCalculations.totalEstimatedCost.toLocaleString()}</span>
                <span className="text-xs text-slate-400 font-bold">({durationDays} Days Total)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
              <button
                type="button"
                onClick={handleOpenSaveModal}
                disabled={savingTrip}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 rounded-2xl bg-[#101b30] hover:bg-[#14233f] text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 px-6 py-3.5 text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {tripSavedSuccessfully ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300">Saved to Trips</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 text-cyan-400" />
                    <span>Save Trip</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsCostModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 rounded-2xl bg-[#101b30] hover:bg-[#14233f] text-amber-300 border border-amber-500/50 hover:border-amber-400 px-6 py-3.5 text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer group"
              >
                <Calculator className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Estimate Cost</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateOrViewItinerary}
                disabled={savingTrip}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:opacity-95 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                <Calendar className="h-4 w-4" />
                <span>{isItineraryGenerated ? 'View Itinerary & Weather' : 'Generate & View Itinerary'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: ENTER CUSTOM TRIP NAME BEFORE SAVING TRIP */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-lg rounded-3xl border border-cyan-500/40 bg-[#101b30] p-6 sm:p-7 shadow-2xl space-y-5 text-left relative"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-700/70 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                    <Bookmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-100">Save Trip to My Trips</h3>
                    <p className="text-xs text-slate-400 font-medium">Enter a custom title to easily identify this trip in your saved history</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="p-1.5 rounded-xl bg-[#0b1528] text-slate-400 hover:text-white border border-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Trip Name Input Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Trip Name / Title <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  value={customTripName}
                  onChange={(e) => setCustomTripName(e.target.value)}
                  placeholder="e.g. Kerala Holiday 2026, Munnar & Thekkady Escape"
                  className="w-full px-4 py-3 bg-[#0b1528] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-semibold outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Trip Snapshot */}
              <div className="bg-[#0b1528] p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-semibold">
                  <span>Route & Stops:</span>
                  <span className="text-slate-100 font-bold text-right truncate max-w-[240px]">
                    {stops.map(s => `${s.destinationName} (${s.days}D)`).join(' ➔ ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 font-semibold">
                  <span>Duration & Group:</span>
                  <span className="text-slate-100 font-bold">{durationDays} Days • {travelersCount} Travelers</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 font-semibold">
                  <span>Estimated Total:</span>
                  <span className="text-cyan-300 font-black">₹{budgetCalculations.totalEstimatedCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 font-semibold">
                  <span>Planned Dates:</span>
                  <span className="text-cyan-200 font-bold">{formattedTripDateRange.range}</span>
                </div>
              </div>

              {/* Date Conflict Error Banner */}
              {dateConflictError && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/50 rounded-2xl flex items-start space-x-3 text-xs text-rose-200 animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-black text-rose-300">Schedule Date Conflict Detected</div>
                    <div className="text-[11px] leading-relaxed text-rose-100">{dateConflictError}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsSaveModalOpen(false);
                    setDateConflictError(null);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSaveTrip(customTripName)}
                  disabled={savingTrip || !customTripName.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingTrip ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Trip Plan</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* POPUP MODAL: DATE CONFLICT ALERT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isConflictModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-lg rounded-3xl border border-rose-500/50 bg-[#101b30] p-6 sm:p-7 shadow-2xl space-y-5 text-left relative"
            >
              <div className="flex items-start justify-between border-b border-slate-700/70 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-100">Schedule Conflict Detected</h3>
                    <p className="text-xs text-slate-400 font-medium">Overlapping trip already exists for these dates</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConflictModalOpen(false)}
                  className="p-1.5 rounded-xl bg-[#0b1528] text-slate-400 hover:text-white border border-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 leading-relaxed space-y-2">
                <div className="font-bold text-rose-300 text-sm">Cannot Schedule Multiple Trips in the Same Duration</div>
                <p>{dateConflictError || `You already have another trip saved during ${formattedTripDateRange.range}. No other trip can be scheduled within this time frame.`}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsConflictModalOpen(false);
                    navigate('/plan', { state: { preferences } });
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Change Travel Dates in Plan Trip</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConflictModalOpen(false);
                    navigate('/my-trips');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View Saved Trips</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* COST ESTIMATE MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700/80 bg-[#101b30] p-6 sm:p-7 shadow-2xl space-y-6 text-left relative scrollbar-thin"
            >
              <div className="flex items-start justify-between border-b border-slate-700/70 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                      Personalized Cost Engine
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-100 mt-1">
                      {stops.map(s => s.destinationName).join(' & ')} Estimated Budget
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCostModalOpen(false)}
                  className="p-2 rounded-xl bg-[#0b1528] text-slate-400 hover:text-white border border-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Total Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#0b1528] to-[#12203b] border border-slate-700/80">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Estimated Cost</span>
                  <div className="text-2xl font-black text-amber-300">
                    ₹{budgetCalculations.totalEstimatedCost.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {travelersCount} travelers • {durationDays} days
                  </span>
                </div>

                <div className="space-y-0.5 sm:border-l sm:border-slate-700/60 sm:pl-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cost Per Person</span>
                  <div className="text-2xl font-black text-cyan-300">
                    ₹{budgetCalculations.perPersonCost.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ₹{budgetCalculations.dailyAverageCost.toLocaleString()} / day avg
                  </span>
                </div>

                <div className="space-y-0.5 sm:border-l sm:border-slate-700/60 sm:pl-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Budget Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {budgetCalculations.isWithinBudget ? (
                      <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Within Budget
                      </span>
                    ) : (
                      <span className="text-sm font-black text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Exceeds by ₹{Math.abs(budgetCalculations.budgetVariance).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {userBudget > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Target: ₹{userBudget.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Itemized Categories */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                  Category Breakdown
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-3 bg-[#0b1528] rounded-xl border border-slate-700/60">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Bed className="h-4 w-4 text-purple-400" /> Lodging & Hotels
                    </span>
                    <strong className="text-slate-100 font-black">₹{budgetCalculations.accommodationCost.toLocaleString()}</strong>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#0b1528] rounded-xl border border-slate-700/60">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-amber-400" /> Food & Dining (3 meals/day)
                    </span>
                    <strong className="text-slate-100 font-black">₹{budgetCalculations.foodCost.toLocaleString()}</strong>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#0b1528] rounded-xl border border-slate-700/60">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Car className="h-4 w-4 text-cyan-400" /> Transportation & Transfers
                    </span>
                    <strong className="text-slate-100 font-black">₹{budgetCalculations.transportCost.toLocaleString()}</strong>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#0b1528] rounded-xl border border-slate-700/60">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-emerald-400" /> Sightseeing & Permits
                    </span>
                    <strong className="text-slate-100 font-black">₹{budgetCalculations.sightseeingCost.toLocaleString()}</strong>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#0b1528] rounded-xl border border-slate-700/60">
                    <span className="text-slate-300 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-slate-400" /> Safety Reserve Buffer (6%)
                    </span>
                    <strong className="text-slate-100 font-black">₹{budgetCalculations.miscCost.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCostModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMAGE PREVIEW MODAL */}
      <ImageModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        description={previewImage?.description}
      />

    </div>
  );
}
