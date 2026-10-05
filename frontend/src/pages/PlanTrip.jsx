import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Compass, MapPin, Receipt, Users, Clock, ArrowRight, 
  Calendar as CalendarIcon, Sparkles, ChevronLeft, ChevronRight, 
  X, Check, Clock3, ChevronDown, Mountain, Sun, Landmark, Trees, Church, Building2, Map,
  Leaf, Waves, PawPrint, Droplets, HeartPulse
} from 'lucide-react';
import { tripService } from '../services/api';
import { LocationSearch, TravelMap } from '../components/transport';
import { motion, AnimatePresence } from 'framer-motion';

const DESTINATION_CATEGORY_OPTIONS = [
  { id: 'hill station', label: 'Hill Stations', icon: Mountain, desc: 'Mist valleys, tea estates & mountains', badgeColor: 'from-emerald-500/25 to-teal-500/25 text-emerald-300 border-emerald-500/40' },
  { id: 'beach', label: 'Beaches & Coastal', icon: Sun, desc: 'Coastal sands, cliffs & ocean breezes', badgeColor: 'from-amber-500/25 to-orange-500/25 text-amber-300 border-amber-500/40' },
  { id: 'backwaters', label: 'Backwaters & Canals', icon: Waves, desc: 'Houseboats, tranquil lagoons & waterways', badgeColor: 'from-cyan-500/25 to-blue-500/25 text-cyan-300 border-cyan-500/40' },
  { id: 'eco tourism', label: 'Eco Tourism & Reserves', icon: Leaf, desc: 'Community reserves, forest trails & eco-parks', badgeColor: 'from-lime-500/25 to-emerald-500/25 text-lime-300 border-lime-500/40' },
  { id: 'nature', label: 'Nature & Greenery', icon: Trees, desc: 'Highlands, spice estates & rural landscapes', badgeColor: 'from-green-500/25 to-emerald-500/25 text-green-300 border-green-500/40' },
  { id: 'wildlife', label: 'Wildlife & Sanctuaries', icon: PawPrint, desc: 'Jungle safaris, tiger reserves & biodiversity', badgeColor: 'from-yellow-500/25 to-amber-500/25 text-yellow-300 border-yellow-500/40' },
  { id: 'waterfall', label: 'Waterfalls & Cascades', icon: Droplets, desc: 'Roaring waterfalls, rainforests & scenic pools', badgeColor: 'from-sky-500/25 to-cyan-500/25 text-sky-300 border-sky-500/40' },
  { id: 'heritage', label: 'Heritage & History', icon: Landmark, desc: 'Historic forts, monuments, palaces & culture', badgeColor: 'from-purple-500/25 to-pink-500/25 text-purple-300 border-purple-500/40' },
  { id: 'pilgrimage', label: 'Pilgrimage & Temples', icon: Church, desc: 'Spiritual temples, sacred shrines & serenity', badgeColor: 'from-indigo-500/25 to-blue-500/25 text-indigo-300 border-indigo-500/40' },
  { id: 'wellness', label: 'Wellness & Ayurveda', icon: HeartPulse, desc: 'Ayurvedic rejuvenation, wellness spas & healing', badgeColor: 'from-rose-500/25 to-pink-500/25 text-rose-300 border-rose-500/40' },
  { id: 'city tourism', label: 'City Tourism', icon: Building2, desc: 'Vibrant urban culture, food, markets & nightlife', badgeColor: 'from-blue-500/25 to-cyan-500/25 text-blue-300 border-blue-500/40' },
  { id: 'adventure', label: 'Adventure & Trekking', icon: Compass, desc: 'High-altitude trails, bamboo rafting & thrills', badgeColor: 'from-orange-500/25 to-red-500/25 text-orange-300 border-orange-500/40' }
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRelativeDateStr = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getUpcomingWeekendStr = () => {
  const d = new Date();
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatIsoToDisplay = (isoStr) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

const parseDisplayToIso = (dispStr) => {
  if (!dispStr) return '';
  const parts = dispStr.split('/');
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      const testDate = new Date(year, month - 1, day);
      if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return null;
};

export default function PlanTrip() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve initial saved preferences from navigation state OR sessionStorage
  const getInitialPreferences = () => {
    if (location.state?.preferences) {
      return location.state.preferences;
    }
    try {
      const saved = sessionStorage.getItem('lastTripPlan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.preferences) return parsed.preferences;
      }
    } catch {
      // ignore parse error
    }
    return null;
  };

  const initialPrefs = getInitialPreferences();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields initialized with previous preferences if available
  const [sourceLocation, setSourceLocation] = useState(
    initialPrefs?.source_location || initialPrefs?.sourceLocation || 'Kochi'
  );
  const [showMap, setShowMap] = useState(false);
  // Parse initial preferred categories (support array, string, or comma-separated)
  const getInitialCategories = () => {
    const raw = initialPrefs?.destination_types || initialPrefs?.destinationTypes || initialPrefs?.destination_type || initialPrefs?.destinationType;
    if (Array.isArray(raw)) {
      const filtered = raw.map(s => String(s).trim().toLowerCase()).filter(Boolean);
      return filtered.length > 0 ? filtered : ['hill station'];
    }
    if (typeof raw === 'string' && raw.trim()) {
      if (raw.includes(',')) {
        const list = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        return list.length > 0 ? list : ['hill station'];
      }
      return [raw.trim().toLowerCase()];
    }
    return ['hill station'];
  };

  const [destinationTypes, setDestinationTypes] = useState(getInitialCategories);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  const [budget, setBudget] = useState(
    initialPrefs?.budget !== undefined ? String(initialPrefs.budget) : '15000'
  );
  const [travelers, setTravelers] = useState(
    initialPrefs?.travelers !== undefined ? String(initialPrefs.travelers) : '2'
  );
  const [durationDays, setDurationDays] = useState(
    initialPrefs?.duration_days !== undefined
      ? String(initialPrefs.duration_days)
      : (initialPrefs?.durationDays !== undefined ? String(initialPrefs.durationDays) : '3')
  );
  const [groupType, setGroupType] = useState(
    initialPrefs?.group_type || initialPrefs?.groupType || 'family'
  );

  const initialIsoDate = initialPrefs?.travel_date || initialPrefs?.travelDate || '';
  const [travelDate, setTravelDate] = useState(initialIsoDate);
  const [dateInput, setDateInput] = useState(
    initialPrefs?.dateInput || (initialIsoDate ? formatIsoToDisplay(initialIsoDate) : '')
  );

  // Custom Calendar State
  const todayObj = new Date();
  const initialDateObj = initialIsoDate ? new Date(initialIsoDate) : null;
  const activeDateObj = initialDateObj && !isNaN(initialDateObj.getTime()) ? initialDateObj : todayObj;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(activeDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(activeDateObj.getMonth());
  const calendarRef = useRef(null);

  // Close dropdowns on outside clicks
  const pastTripDropdownRef = useRef(null);
  const [isPastTripDropdownOpen, setIsPastTripDropdownOpen] = useState(false);
  const [loadingPastTrip, setLoadingPastTrip] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
      if (pastTripDropdownRef.current && !pastTripDropdownRef.current.contains(event.target)) {
        setIsPastTripDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync state if navigation state changes
  useEffect(() => {
    if (location.state?.preferences) {
      const p = location.state.preferences;
      if (p.source_location !== undefined || p.sourceLocation !== undefined) {
        setSourceLocation(p.source_location || p.sourceLocation || '');
      }
      const rawTypes = p.destination_types || p.destinationTypes || p.destination_type || p.destinationType;
      if (rawTypes !== undefined) {
        if (Array.isArray(rawTypes)) {
          const filtered = rawTypes.map(s => String(s).trim().toLowerCase()).filter(Boolean);
          setDestinationTypes(filtered.length > 0 ? filtered : ['hill station']);
        } else if (typeof rawTypes === 'string' && rawTypes.trim()) {
          const list = rawTypes.includes(',') 
            ? rawTypes.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
            : [rawTypes.trim().toLowerCase()];
          setDestinationTypes(list.length > 0 ? list : ['hill station']);
        }
      }
      if (p.budget !== undefined) {
        setBudget(String(p.budget));
      }
      if (p.travelers !== undefined) {
        setTravelers(String(p.travelers));
      }
      if (p.duration_days !== undefined || p.durationDays !== undefined) {
        setDurationDays(String(p.duration_days || p.durationDays || '3'));
      }
      if (p.group_type !== undefined || p.groupType !== undefined) {
        setGroupType(p.group_type || p.groupType || 'family');
      }
      const iso = p.travel_date || p.travelDate || '';
      if (iso) {
        setTravelDate(iso);
        setDateInput(p.dateInput || formatIsoToDisplay(iso));
        const [y, m] = iso.split('-').map(Number);
        if (y && m) {
          setViewYear(y);
          setViewMonth(m - 1);
        }
      }
    }
  }, [location.state]);

  // Past completed trip recommendation suggestion
  const [pastTripSuggestion, setPastTripSuggestion] = useState(null);

  const fetchPastTripRecs = async (baseDestId = null) => {
    try {
      setLoadingPastTrip(true);
      const params = baseDestId ? { base_dest_id: baseDestId } : {};
      const res = await tripService.getRecommendationsBasedOnPastTrips(params);
      if (res && res.has_past_trips && res.base_trip && res.completed_trips?.length > 0) {
        setPastTripSuggestion(res);
      } else {
        setPastTripSuggestion(null);
      }
    } catch (e) {
      console.warn("Could not load past trip recommendations:", e);
      setPastTripSuggestion(null);
    } finally {
      setLoadingPastTrip(false);
    }
  };

  useEffect(() => {
    fetchPastTripRecs();
  }, []);

  const handleSelectBaseTrip = (destId) => {
    setIsPastTripDropdownOpen(false);
    fetchPastTripRecs(destId);
  };

  // Calendar navigation
  const isViewingCurrentMonth = () => {
    return viewYear === todayObj.getFullYear() && viewMonth === todayObj.getMonth();
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (isViewingCurrentMonth()) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    const displayStr = `${formattedDay}/${formattedMonth}/${viewYear}`;
    setTravelDate(isoStr);
    setDateInput(displayStr);
    setErrorMsg('');
    setIsCalendarOpen(false);
  };

  const handleSelectPreset = (isoStr) => {
    setTravelDate(isoStr);
    const displayStr = formatIsoToDisplay(isoStr);
    setDateInput(displayStr);
    const [y, m] = isoStr.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    setErrorMsg('');
    setIsCalendarOpen(false);
  };

  const handleClearDate = (e) => {
    if (e) e.stopPropagation();
    setTravelDate('');
    setDateInput('');
    setErrorMsg('');
  };

  const handleDateInputChange = (e) => {
    let val = e.target.value;
    
    // Only allow digits and slashes
    val = val.replace(/[^0-9/]/g, '');
    
    // Auto-insert slash when typing numbers consecutively
    if (val.length === 2 && !val.includes('/') && e.nativeEvent?.inputType !== 'deleteContentBackward') {
      val = val + '/';
    } else if (val.length === 5 && val.split('/').length === 2 && e.nativeEvent?.inputType !== 'deleteContentBackward') {
      val = val + '/';
    }
    
    if (val.length > 10) {
      val = val.slice(0, 10);
    }
    
    setDateInput(val);

    if (!val.trim()) {
      setTravelDate('');
      setErrorMsg('');
      return;
    }

    if (val.length === 10) {
      const iso = parseDisplayToIso(val);
      if (iso) {
        const todayStr = getTodayDateStr();
        if (iso < todayStr) {
          setErrorMsg('Please enter a correct date. Travel date cannot be in the past.');
          setTravelDate(iso);
        } else {
          setErrorMsg('');
          setTravelDate(iso);
          const [y, m] = iso.split('-').map(Number);
          setViewYear(y);
          setViewMonth(m - 1);
        }
      } else {
        setErrorMsg('Please enter a valid date in dd/mm/yyyy format.');
      }
    }
  };

  // Generate days in month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const isDayInPast = (day) => {
    const checkDate = new Date(viewYear, viewMonth, day);
    const today = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
    return checkDate < today;
  };

  const isDaySelected = (day) => {
    if (!travelDate) return false;
    const [y, m, d] = travelDate.split('-').map(Number);
    return y === viewYear && (m - 1) === viewMonth && d === day;
  };

  const isDayToday = (day) => {
    return todayObj.getFullYear() === viewYear && 
           todayObj.getMonth() === viewMonth && 
           todayObj.getDate() === day;
  };

  const handleToggleCategory = (catId) => {
    if (destinationTypes.includes(catId)) {
      setDestinationTypes(destinationTypes.filter(id => id !== catId));
    } else {
      setDestinationTypes([...destinationTypes, catId]);
    }
    setErrorMsg('');
  };

  const handleSelectAllCategories = () => {
    setDestinationTypes(DESTINATION_CATEGORY_OPTIONS.map(c => c.id));
    setErrorMsg('');
  };

  const handleClearCategories = () => {
    setDestinationTypes([]);
  };

  const getSourceLocName = () => {
    if (!sourceLocation) return '';
    if (typeof sourceLocation === 'object' && sourceLocation !== null) {
      return (sourceLocation.name || sourceLocation.label || '').trim();
    }
    return String(sourceLocation).trim();
  };

  const validateForm = () => {
    const srcName = getSourceLocName();
    if (!srcName) {
      setErrorMsg('Please populate your starting point location.');
      return false;
    }
    if (!destinationTypes || destinationTypes.length === 0) {
      setErrorMsg('Please select at least one preferred destination class category.');
      return false;
    }
    if (!budget || !travelers || !durationDays) {
      setErrorMsg('Please specify all budget, travelers, and duration inputs.');
      return false;
    }
    if (parseFloat(budget) <= 0) {
      setErrorMsg('Please enter a valid budget greater than 0.');
      return false;
    }
    if (parseInt(travelers) <= 0) {
      setErrorMsg('Please enter at least 1 traveler.');
      return false;
    }
    if (parseInt(durationDays) <= 0) {
      setErrorMsg('Please enter a valid duration of at least 1 day.');
      return false;
    }
    if (dateInput.trim()) {
      const iso = parseDisplayToIso(dateInput.trim());
      if (!iso) {
        setErrorMsg('Please enter a valid date in dd/mm/yyyy format.');
        return false;
      }
      const today = getTodayDateStr();
      if (iso < today) {
        setErrorMsg('Please enter a correct date. Travel date cannot be in the past.');
        return false;
      }
    }
    if (groupType === 'solo' && parseInt(travelers) !== 1) {
      setErrorMsg('Solo Adventure must have exactly 1 traveler.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleGroupTypeChange = (newType) => {
    setGroupType(newType);
    if (newType === 'solo') {
      setTravelers('1');
    } else if (newType === 'couple') {
      setTravelers('2');
    } else if (parseInt(travelers) <= 1) {
      setTravelers('2');
    }
  };

  const handleTravelersChange = (val) => {
    setTravelers(val);
    const count = parseInt(val);
    if (count === 1) {
      setGroupType('solo');
    } else if (count === 2 && groupType === 'solo') {
      setGroupType('couple');
    } else if (count > 2 && (groupType === 'solo' || groupType === 'couple')) {
      setGroupType('family');
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateForm()) return;

    let finalIsoDate = travelDate;
    if (dateInput.trim()) {
      finalIsoDate = parseDisplayToIso(dateInput.trim()) || travelDate;
    }
    if (!finalIsoDate) {
      finalIsoDate = getTodayDateStr();
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const srcLocStr = getSourceLocName() || 'Kochi';

      const payload = {
        source_location: srcLocStr,
        destination_type: destinationTypes.join(', '),
        destination_types: destinationTypes,
        budget: parseFloat(budget),
        travelers: parseInt(travelers),
        duration_days: parseInt(durationDays),
        interests: [],
        group_type: groupType,
        travel_date: finalIsoDate
      };
      const res = await tripService.planTrip(payload);
      const planData = {
        recommendations: res.recommendations || [],
        preferences: res.preferences || payload,
        message: res.message || ''
      };

      sessionStorage.setItem('lastTripPlan', JSON.stringify(planData));

      navigate('/recommendations', { 
        state: planData
      });
    } catch (err) {
      console.error('Plan trip compilation error:', err);
      setErrorMsg(err.response?.data?.message || 'Recommendation compilation failed. Please check server connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-left text-slate-100">
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl flex items-center space-x-2 font-bold">
          <Sparkles className="h-4.5 w-4.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-[#101b30] border border-slate-700/70 rounded-luxury shadow-[0_10px_30px_rgba(2,8,23,0.25)] p-6 sm:p-8 overflow-visible relative">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-100 flex items-center">
                <MapPin className="h-5 w-5 text-blue-300 mr-1.5" />
                Plan Your Trip
              </h3>
              <p className="text-xs text-slate-400 font-semibold">Fill in your trip details or pick your origin directly on the interactive map.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowMap(m => !m)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                showMap 
                  ? 'bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-400/40' 
                  : 'bg-[#0b1528] hover:bg-[#14233f] text-cyan-400 border-slate-700/80'
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              <span>{showMap ? 'Hide Map Picker' : '🗺️ Pick Origin on Map'}</span>
            </button>
          </div>

          {/* Past Completed Trip Recommendation Prompt with Destination Switcher */}
          {pastTripSuggestion && pastTripSuggestion.has_past_trips && pastTripSuggestion.base_trip && pastTripSuggestion.completed_trips?.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-950/60 via-cyan-950/40 to-[#0b1528] rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-lg relative z-20">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5 sm:mt-0">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-100">
                      Looking for places like your past trip to:
                    </span>
                    
                    {/* Destination Switcher Dropdown */}
                    <div className="relative inline-block" ref={pastTripDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsPastTripDropdownOpen(v => !v)}
                        disabled={loadingPastTrip}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/60 text-xs font-black transition-all cursor-pointer shadow-sm hover:scale-102"
                        title="Click to switch base completed trip"
                      >
                        <span>{pastTripSuggestion.base_trip.destination_name}</span>
                        <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded-md border border-cyan-500/30 capitalize">
                          {pastTripSuggestion.base_trip.category}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 text-cyan-400 transition-transform duration-200 ${isPastTripDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu for Switching Completed Trips */}
                      {isPastTripDropdownOpen && (
                        <div className="absolute left-0 top-full mt-2 w-72 bg-[#0b1528] border border-cyan-500/40 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 flex items-center justify-between">
                            <span>Switch Completed Trip</span>
                            <span className="text-cyan-400">{pastTripSuggestion.completed_trips?.length || 1} completed</span>
                          </div>
                          
                          <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                            {pastTripSuggestion.completed_trips && pastTripSuggestion.completed_trips.length > 0 ? (
                              pastTripSuggestion.completed_trips.map((ct) => {
                                const isSelected = ct.destination_id === pastTripSuggestion.base_trip.destination_id;
                                return (
                                  <button
                                    key={ct.destination_id}
                                    type="button"
                                    onClick={() => handleSelectBaseTrip(ct.destination_id)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-400/60'
                                        : 'hover:bg-slate-800/80 text-slate-200 border border-transparent'
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-white font-extrabold">{ct.destination_name}</span>
                                        {isSelected && <span className="text-[10px] text-cyan-400">✓ Active</span>}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                                        <span className="capitalize text-cyan-300/80">{ct.category}</span>
                                        {ct.travel_date && <span>• {ct.travel_date}</span>}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Select ➔</span>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-3 py-2 text-xs text-slate-400">No other completed trips found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <span className="text-[10px] text-slate-300 font-medium block">
                    {pastTripSuggestion.base_trip.vibe_description || 
                     `Our AI finds similar ${pastTripSuggestion.base_trip.category} escapes (recommending fresh unvisited destinations first).`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const cat = pastTripSuggestion.base_trip.category || 'hill station';
                    setDestinationTypes([cat]);
                    setErrorMsg('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-102 flex items-center gap-1.5"
                >
                  <span>Recommend Places Like {pastTripSuggestion.base_trip.destination_name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Optional Interactive Map on PlanTrip Form */}
          {showMap && (
            <div className="space-y-2 p-3 bg-[#0b1528] rounded-2xl border border-cyan-500/30">
              <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Click anywhere on the map or tap any destination spot to set your starting origin:
                </span>
                <span className="text-slate-400 text-[10px]">
                  Selected: <strong className="text-slate-200">{typeof sourceLocation === 'object' ? sourceLocation.name : sourceLocation}</strong>
                </span>
              </div>
              <TravelMap
                origin={typeof sourceLocation === 'object' ? sourceLocation : { name: sourceLocation || 'Kochi', latitude: 9.9312, longitude: 76.2673 }}
                destination={null}
                height="320px"
                allowSelection={true}
                showDestinationPicker={false}
                onOriginChange={(loc) => {
                  setSourceLocation(loc);
                  setErrorMsg('');
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <LocationSearch
                label="Source Starting Point *"
                icon={MapPin}
                iconColor="text-cyan-400"
                value={typeof sourceLocation === 'object' ? (sourceLocation.name || sourceLocation.label || '') : (sourceLocation || '')}
                placeholder="e.g. Dubai, Abu Dhabi, Singapore, London, Kochi, Bengaluru..."
                onSelect={(loc) => {
                  setSourceLocation(loc);
                  setErrorMsg('');
                }}
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Quick Origins:</span>
                {[
                  { name: 'Dubai', label: 'Dubai, UAE', isIntl: true },
                  { name: 'Singapore', label: 'Singapore', isIntl: true },
                  { name: 'London', label: 'London, UK', isIntl: true },
                  { name: 'Doha', label: 'Doha, Qatar', isIntl: true },
                  { name: 'Kochi', label: 'Kochi, Kerala', isIntl: false },
                  { name: 'Bengaluru', label: 'Bengaluru', isIntl: false }
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setSourceLocation(item.name);
                      setErrorMsg('');
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      (typeof sourceLocation === 'object' ? sourceLocation.name : sourceLocation)?.toLowerCase().includes(item.name.toLowerCase())
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-sm'
                        : item.isIntl
                          ? 'bg-[#0b1528] text-amber-300/90 border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-950/30'
                          : 'bg-[#0b1528] text-slate-300 border-slate-700/70 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {item.isIntl ? '✈️ ' : '📍 '}{item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Multiple Destination Class Categories Selector */}
            <div className="space-y-1.5 relative" ref={categoryDropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center">
                  Destination Class Category *
                  <span className="ml-1.5 text-[9px] text-cyan-400 font-bold lowercase">
                    ({destinationTypes.length} selected)
                  </span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold tracking-wider uppercase transition-colors"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600 text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={handleClearCategories}
                    className="text-[10px] text-slate-400 hover:text-rose-400 font-bold tracking-wider uppercase transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Interactive Category Trigger Field */}
              <div
                onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                className={`w-full min-h-[46px] bg-[#0b1528] border ${
                  destinationTypes.length === 0 && errorMsg
                    ? 'border-rose-500 ring-1 ring-rose-500/30'
                    : isCategoryDropdownOpen
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-700/70 hover:border-slate-500'
                } rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all`}
              >
                <div className="flex flex-wrap gap-1.5 items-center max-w-[calc(100%-28px)]">
                  {destinationTypes.length === 0 ? (
                    <span className="text-xs text-slate-500 font-semibold pl-1">
                      Choose one or more categories...
                    </span>
                  ) : (
                    destinationTypes.map(typeId => {
                      const cat = DESTINATION_CATEGORY_OPTIONS.find(c => c.id === typeId) || { label: typeId, badgeColor: 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-blue-500/40' };
                      const IconComp = cat.icon || Sparkles;
                      return (
                        <span
                          key={typeId}
                          className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${cat.badgeColor} shadow-sm animate-fade-in`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCategory(typeId);
                          }}
                        >
                          <IconComp className="h-3 w-3 mr-1 opacity-85" />
                          <span>{cat.label}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCategory(typeId);
                            }}
                            className="ml-1.5 hover:text-rose-400 text-slate-400 hover:bg-slate-800/60 rounded p-0.5 transition-colors"
                            title={`Remove ${cat.label}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center text-slate-400 pl-1">
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCategoryDropdownOpen ? 'transform rotate-180 text-cyan-400' : ''}`} />
                </div>
              </div>

              {/* Animated Category Dropdown Menu */}
              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0d182b] border border-slate-700/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-3 space-y-2 backdrop-blur-xl max-h-80 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                        Choose Preferred Categories
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllCategories();
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider"
                        >
                          Select All
                        </button>
                        <span className="text-slate-600 text-[10px]">•</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearCategories();
                          }}
                          className="text-[10px] text-slate-400 hover:text-rose-400 font-bold uppercase tracking-wider"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {DESTINATION_CATEGORY_OPTIONS.map((cat) => {
                        const isSelected = destinationTypes.includes(cat.id);
                        const IconComp = cat.icon;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => handleToggleCategory(cat.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-blue-600/15 border-blue-500/40 text-slate-100'
                                : 'bg-[#07111f] border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-blue-600/30 border-blue-500/50 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                                <IconComp className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold flex items-center text-slate-100">
                                  <span>{cat.label}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {cat.desc}
                                </div>
                              </div>
                            </div>

                            <div className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 border-cyan-400 text-white shadow-sm'
                                : 'border-slate-700 bg-slate-900/60'
                            }`}>
                              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Maximum Budget Limit (₹) *</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                className="w-full text-xs bg-[#0b1528] border border-slate-700/70 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-slate-100 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Travel Companions *
                </label>
                {groupType === 'solo' && (
                  <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
                    (1 Traveler for Solo)
                  </span>
                )}
              </div>
              <input
                type="number"
                value={groupType === 'solo' ? '1' : travelers}
                onChange={(e) => handleTravelersChange(e.target.value)}
                disabled={groupType === 'solo'}
                required
                min="1"
                max={groupType === 'solo' ? 1 : 50}
                className={`w-full text-xs bg-[#0b1528] border rounded-xl p-3 focus:outline-none text-slate-100 font-bold transition-all ${
                  groupType === 'solo' 
                    ? 'border-slate-800 text-slate-400 cursor-not-allowed opacity-80' 
                    : 'border-slate-700/70 focus:border-blue-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Duration (Days) *</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                required
                min="1"
                className="w-full text-xs bg-[#0b1528] border border-slate-700/70 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-slate-100 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Group Type *</label>
              <select
                value={groupType}
                onChange={(e) => handleGroupTypeChange(e.target.value)}
                className="w-full text-xs bg-[#0b1528] border border-slate-700/70 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-slate-100 font-bold"
              >
                <option value="solo">Solo Adventure (1 Traveler)</option>
                <option value="couple">Couple Honeymoon (2 Travelers)</option>
                <option value="family">Family Trip</option>
                <option value="friends">Group of Friends</option>
              </select>
            </div>
          </div>

          {/* Interactive Target Date (dd/mm/yyyy) & Calendar Picker */}
          <div className="space-y-1.5 relative" ref={calendarRef}>
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Target Travel Date (Optional)
              </label>
              {dateInput && (
                <button
                  type="button"
                  onClick={handleClearDate}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors uppercase font-bold tracking-wider"
                >
                  Clear Date
                </button>
              )}
            </div>

            {/* Input with dd/mm/yyyy placeholder and clickable Calendar icon */}
            <div 
              className={`relative flex items-center bg-[#0b1528] border ${
                (travelDate && travelDate < getTodayDateStr()) || (errorMsg && errorMsg.toLowerCase().includes('date'))
                  ? 'border-rose-500 ring-1 ring-rose-500/30' 
                  : isCalendarOpen 
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                    : 'border-slate-700/70 hover:border-slate-500'
              } rounded-xl transition-all`}
            >
              <input
                type="text"
                value={dateInput}
                onChange={handleDateInputChange}
                placeholder="dd/mm/yyyy"
                maxLength={10}
                className="w-full text-xs bg-transparent py-3 pl-3.5 pr-20 focus:outline-none text-slate-100 font-bold placeholder-slate-500"
              />

              {/* Right side controls: Clear X button & Calendar trigger button */}
              <div className="absolute right-2 flex items-center space-x-1.5">
                {dateInput && (
                  <button
                    type="button"
                    onClick={handleClearDate}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                    title="Clear date"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(prev => !prev)}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                    isCalendarOpen
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-400'
                      : 'bg-blue-600/20 text-cyan-400 hover:bg-blue-600 hover:text-white border border-blue-500/30'
                  }`}
                  title="Open calendar picker"
                  aria-label="Toggle calendar"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* In-place validation message if past date */}
            {travelDate && travelDate < getTodayDateStr() && (
              <p className="text-[11px] text-rose-400 font-bold flex items-center pt-0.5">
                <span>Please enter a correct date. Travel date cannot be in the past.</span>
              </p>
            )}

            {/* Interactive Calendar Popup Dropdown */}
            <AnimatePresence>
              {isCalendarOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-2 z-50 bg-[#0d182b] border border-slate-700/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-4 space-y-3.5 backdrop-blur-xl"
                >
                  {/* Quick Select Preset Chips */}
                  <div className="space-y-1.5 pb-2 border-b border-slate-800">
                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 flex items-center">
                      <Clock3 className="h-3 w-3 mr-1 text-cyan-400" /> Quick Date Select
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Today', value: getTodayDateStr() },
                        { label: 'Tomorrow', value: getRelativeDateStr(1) },
                        { label: 'This Weekend', value: getUpcomingWeekendStr() },
                        { label: 'In 1 Week', value: getRelativeDateStr(7) },
                        { label: 'In 1 Month', value: getRelativeDateStr(30) }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSelectPreset(preset.value)}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all border ${
                            travelDate === preset.value
                              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                              : 'bg-[#07111f] hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month & Year Navigation Header */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      disabled={isViewingCurrentMonth()}
                      className={`p-1.5 rounded-xl border border-slate-800 transition-colors ${
                        isViewingCurrentMonth() 
                          ? 'text-slate-600 cursor-not-allowed bg-slate-900/50' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800 bg-[#07111f]'
                      }`}
                      aria-label="Previous Month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="text-xs font-black text-white tracking-wide">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 bg-[#07111f] transition-colors"
                      aria-label="Next Month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {DAYS_OF_WEEK.map((d) => (
                      <span key={d} className="text-[10px] font-black uppercase text-slate-500 py-1">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty padding slots for days before the 1st */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-8 w-8" />
                    ))}

                    {/* Day buttons */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isPast = isDayInPast(day);
                      const isSelected = isDaySelected(day);
                      const isToday = isDayToday(day);

                      return (
                        <button
                          key={`day-${day}`}
                          type="button"
                          disabled={isPast}
                          onClick={() => handleSelectDay(day)}
                          className={`h-8 w-8 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all relative ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg ring-2 ring-cyan-400/50 scale-105 z-10'
                              : isPast
                                ? 'text-slate-600 cursor-not-allowed opacity-30'
                                : isToday
                                  ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-blue-600 hover:text-white'
                                  : 'text-slate-200 hover:bg-slate-800/90 hover:text-white'
                          }`}
                        >
                          <span>{day}</span>
                          {isToday && !isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-cyan-400"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(getTodayDateStr())}
                      className="text-cyan-400 hover:underline uppercase tracking-wider"
                    >
                      Pick Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg uppercase tracking-wider transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-cyan-100" />
                  <span>Compile AI Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
