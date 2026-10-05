import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Compass, Calendar, MapPin, Users, Hourglass, 
  Receipt, ShieldAlert, ArrowLeft, Sun, Share2, Printer, Map,
  Car, Building2, Utensils, CheckCircle2, Sparkles,
  CloudRain, AlertTriangle, LifeBuoy, ChevronRight, Wind, Droplets, Trash2, X,
  Globe, ExternalLink, Star, ArrowUpDown, Navigation
} from 'lucide-react';
import { tripService } from '../services/api';
import { 
  TravelLocationSelector, 
  TravelMap, 
  RouteSummary, 
  TransportationOptions, 
  LoadingState, 
  RouteError 
} from '../components/transport';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [weather, setWeather] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [hotelOptions, setHotelOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Dynamic Route & Transportation State
  const [fromLocation, setFromLocation] = useState('Kochi');
  const [toLocation, setToLocation] = useState('Munnar');
  const [selectedTransitId, setSelectedTransitId] = useState(null);
  const [transitData, setTransitData] = useState({
    origin: null,
    destination: null,
    distance_km: 0,
    duration_minutes: 0,
    duration_formatted: '',
    geometry: [],
    options: [],
    ai_advice: null,
    dataSource: 'OpenRouteService Directions API',
    loading: false,
    error: null,
    showMap: true
  });

  // Memoized computations - declared at TOP level before any conditional returns
  const daysList = useMemo(() => {
    if (!trip?.itinerary_text) return [];
    if (Array.isArray(trip.itinerary_text)) return trip.itinerary_text;
    if (typeof trip.itinerary_text === 'string') {
      try {
        const parsed = JSON.parse(trip.itinerary_text);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  }, [trip?.itinerary_text]);

  const currentDayData = useMemo(() => {
    return daysList.find(d => d.day === selectedDay) || daysList[0] || null;
  }, [daysList, selectedDay]);

  const activeTransitOption = useMemo(() => {
    const opts = transitData?.options || [];
    if (opts.length === 0) return null;
    return opts.find(t => t.id === selectedTransitId) || opts[0];
  }, [transitData?.options, selectedTransitId]);

  const dynamicTransitCost = useMemo(() => {
    if (activeTransitOption && typeof activeTransitOption.total_fare === 'number') {
      return activeTransitOption.total_fare;
    }
    return costBreakdown?.local_transport || 0;
  }, [activeTransitOption, costBreakdown]);

  const dynamicTotalCost = useMemo(() => {
    if (!costBreakdown) return Math.round(Number(trip?.estimated_cost || 0));
    return Math.round(
      Number(costBreakdown.accommodation || 0) +
      Number(costBreakdown.food || 0) +
      Number(dynamicTransitCost || 0) +
      Number(costBreakdown.sightseeing || 0) +
      Number(costBreakdown.miscellaneous || 0)
    );
  }, [costBreakdown, dynamicTransitCost, trip?.estimated_cost]);

  const dynamicPerPerson = useMemo(() => {
    const travelersCount = Number(trip?.travelers || 1);
    if (!travelersCount || !dynamicTotalCost) return 0;
    return Math.round(dynamicTotalCost / travelersCount);
  }, [dynamicTotalCost, trip?.travelers]);

  const fetchRouteData = async (orig, dest) => {
    if (!orig || !dest) return;
    setTransitData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await tripService.getRecommendations({
        origin: orig,
        destination: dest,
        travelers: trip?.travelers || 2,
        budget: trip?.budget || 15000,
        comfort: 'Comfortable'
      });
      setTransitData({
        origin: res.origin,
        destination: res.destination,
        distance_km: res.distance_km,
        duration_minutes: res.duration_minutes,
        duration_formatted: res.duration_formatted,
        geometry: res.geometry || [],
        options: res.options || [],
        excluded_modes: res.excluded_modes || [],
        ai_feasibility: res.ai_feasibility || null,
        ai_advice: res.ai_advice || null,
        dataSource: res.data_source || 'OpenRouteService Directions API',
        loading: false,
        error: null,
        showMap: true
      });
      if (res.options && res.options.length > 0) {
        setSelectedTransitId(res.options[0].id);
      }

    } catch (err) {
      console.error('Failed to load trip route data:', err);
      setTransitData(prev => ({
        ...prev,
        loading: false,
        error: 'Route calculation is temporarily unavailable.'
      }));
    }
  };


  useEffect(() => {
    async function loadTripDetail() {
      try {
        const res = await tripService.getMyTrips();
        const selected = (res.trips || []).find(t => String(t.id) === String(id));
        if (selected) {
          setTrip(selected);
          setFromLocation(selected.source_location || 'Kochi');
          setToLocation(selected.destination_name || 'Munnar');
          
          // 1. Fetch weather (current + 5-day forecast)
          try {
            const weatherRes = await tripService.getWeather(selected.destination_id);
            if (weatherRes?.weather) {
              setWeather(weatherRes.weather);
            }
          } catch (wErr) {
            console.warn("Non-critical weather fetch warning:", wErr);
          }

          // 2. Fetch cost estimation
          try {
            const costRes = await tripService.estimateCost({
              destination_id: selected.destination_id,
              travelers: selected.travelers || 1,
              duration_days: selected.duration_days || 3,
              budget: selected.budget || 15000
            });
            if (costRes?.cost_estimation) {
              setCostBreakdown(costRes.cost_estimation);
            }
          } catch (cErr) {
            console.warn("Non-critical cost estimate warning:", cErr);
          }

          // 3. Fetch transportation recommendations and live road routing
          try {
            fetchRouteData(selected.source_location || 'Kochi', selected.destination_name || 'Munnar');
          } catch (rErr) {
            console.warn("Non-critical routing warning:", rErr);
          }

          // 4. Fetch hotels with websites
          try {
            const hotelsRes = await tripService.getHotels(selected.destination_id);
            setHotelOptions(hotelsRes?.hotels || []);
          } catch {
            setHotelOptions([]);
          }
        }
      } catch (err) {
        console.error("Failed to load trip details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTripDetail();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShareMsg('Itinerary link copied to clipboard!');
    setTimeout(() => setShareMsg(''), 3000);
  };

  const handleDeleteTrip = async () => {
    if (!trip) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await tripService.deleteTrip(trip.id);
      navigate('/my-trips');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete trip. Please try again.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="h-10 w-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-20 font-sans space-y-4 max-w-sm mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <Compass className="h-12 w-12 text-cyan-400 animate-spin-slow" />
        <h2 className="text-xl font-black text-slate-100">Trip Plan Not Found</h2>
        <Link to="/my-trips" className="text-cyan-400 hover:underline text-xs font-bold block mt-2">
          Back to Trips History
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans animate-fade-in text-left text-slate-100 pb-12 print:bg-white print:text-black">
      
      {/* 1. Action Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden border-b border-slate-800 pb-5">
        <Link
          to="/my-trips"
          className="flex items-center space-x-1.5 text-slate-400 hover:text-white font-bold text-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Saved Trips</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {shareMsg && (
            <span className="text-[10px] text-cyan-300 font-bold mr-2 animate-pulse">{shareMsg}</span>
          )}

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 rounded-xl text-xs font-bold transition-all"
            title="Delete this saved trip"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Trip</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#101b30] border border-slate-700/80 text-slate-200 rounded-xl text-xs font-bold hover:bg-[#14233f] transition-all"
          >
            <Share2 className="h-4 w-4 text-cyan-400" />
            <span>Share</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow hover:opacity-95 transition-all"
          >
            <Printer className="h-4 w-4 mr-1" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Card Details */}
      <div className="bg-[#101b30] border border-slate-700/70 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(2,8,23,0.35)] space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest inline-block">
                AI Personalized Travel Plan
              </span>
              {trip.is_multi_destination && (
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-widest inline-block">
                  Multi-Destination Split Stay
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight leading-tight">
              {trip.trip_name || (trip.multi_destination_title ? `Journey to ${trip.multi_destination_title}` : `Journey to ${trip.destination_name}`)}
            </h1>

            <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-cyan-400" /> Source: {trip.source_location}
              </span>
              <span className="flex items-center">
                <Hourglass className="h-4 w-4 mr-1 text-cyan-400" /> {trip.duration_days} Days
              </span>
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-cyan-400" /> {trip.travelers} Travelers
              </span>
              {(trip.travel_date || trip.created_at) && (
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-cyan-400" /> Starts: {trip.travel_date || (typeof trip.created_at === 'string' ? trip.created_at.split(' ')[0] : 'Scheduled')}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-left md:text-right border-l md:border-l-0 md:border-r border-slate-800 pl-4 md:pl-0 md:pr-6 font-bold space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Overall Trip Cost</span>
            <span className="text-2xl font-black text-cyan-300">₹{Math.round(Number(trip.estimated_cost || 0)).toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block">Allocated Budget: ₹{Math.round(Number(trip.budget || 0)).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 3. FEATURE 2: 5-Day Weather Forecast Widget */}
      {weather && (
        <div className="bg-[#101b30] p-6 rounded-[28px] border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
            <div className="flex items-center space-x-2">
              <Sun className="h-5 w-5 text-amber-400 animate-spin-slow" />
              <h3 className="text-xs uppercase font-black tracking-widest text-slate-200">
                Weather Forecast & Travel Advisory ({trip.destination_name})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
              Current: {weather.temperature}°C ({weather.weather})
            </span>
          </div>

          {/* 5-Day Day-by-Day Forecast Pills */}
          {weather.forecast && weather.forecast.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {weather.forecast.map((f, fIdx) => (
                <div key={fIdx} className="bg-[#0b1528] p-3 rounded-2xl border border-slate-700/60 text-center space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">{f.day_name} ({f.formatted_date})</span>
                  <div className="flex items-center justify-center space-x-1 py-1">
                    {f.rain_probability > 40 ? (
                      <CloudRain className="h-5 w-5 text-cyan-400" />
                    ) : (
                      <Sun className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  <div className="text-xs font-black text-slate-100">
                    <span>{f.temp_high}°</span> <span className="text-slate-500 text-[10px]">/ {f.temp_low}°C</span>
                  </div>
                  <span className="text-[9px] text-cyan-300 font-bold block truncate">{f.condition}</span>
                </div>
              ))}
            </div>
          )}

          {/* Weather Safety & Packing Advice */}
          <div className="p-3.5 bg-[#0b1528] rounded-2xl border border-slate-700/60 flex items-start space-x-2.5 text-xs text-slate-300 font-medium leading-relaxed">
            <ShieldAlert className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5" />
            <p>{weather.current?.advice || weather.advice}</p>
          </div>
        </div>
      )}

      {/* 4. Main Grid: Personalized Itinerary + Cost & Transport Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 cols: Personalized Day-Wise Itinerary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-100 flex items-center">
              <Compass className="h-5 w-5 text-cyan-400 mr-2" />
              Personalized Day-Wise Itinerary
            </h2>

            {/* Day Selector Tabs */}
            {daysList.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-[#0b1528] p-1 rounded-xl border border-slate-700/80">
                {daysList.map((d) => (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedDay === d.day
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Day {d.day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Render selected day activities */}
          {currentDayData && (
            <div className="bg-[#101b30] p-6 sm:p-7 rounded-[28px] border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/60">
                <div>
                  <span className="font-black text-sm text-cyan-300 block">
                    Day {currentDayData.day}: Activity Schedule
                  </span>
                  {currentDayData.hotel_name && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Stay: <strong className="text-slate-200">{currentDayData.hotel_name}</strong>
                    </span>
                  )}
                </div>
                {currentDayData.destination_name && (
                  <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider bg-[#0b1528] px-2.5 py-1 rounded-lg border border-slate-700">
                    📍 {currentDayData.destination_name}
                  </span>
                )}
              </div>

              {/* Structured time slots if available, otherwise standard keys */}
              {Array.isArray(currentDayData.slots) && currentDayData.slots.length > 0 ? (
                <div className="space-y-3.5">
                  {currentDayData.slots.map((slot, sIdx) => {
                    const isTransit = slot.type === 'transit' || slot.period === 'Morning' && currentDayData.day === 1;
                    const isDining = slot.type === 'dining' || slot.period === 'Lunch' || slot.period === 'Dinner';

                    return (
                      <div
                        key={sIdx}
                        className={`p-3.5 rounded-2xl border text-xs transition-all space-y-1.5 ${
                          isTransit ? 'bg-cyan-950/20 border-cyan-500/30' :
                          isDining ? 'bg-amber-950/20 border-amber-500/30' :
                          'bg-[#0b1528] border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            isTransit ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            isDining ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {slot.period}: {slot.tag || slot.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            ⏰ {slot.time}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-100 text-sm">
                          {slot.title}
                        </h4>

                        <div className="space-y-1.5 pt-0.5">
                          {renderFormattedText(slot.description)}
                        </div>

                        {slot.specific_name && (
                          <div className="pt-1 flex items-center justify-end">
                            <span className="text-[10px] font-black text-cyan-300 bg-[#101b30] px-2 py-0.5 rounded border border-slate-700">
                              {slot.specific_name}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4 text-xs text-slate-300 font-semibold leading-relaxed">
                  <div className="p-4 bg-[#0b1528] rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-[9px] uppercase font-black text-cyan-400 block tracking-widest">
                      🌅 Morning Excursion (09:00 AM - 12:00 PM)
                    </span>
                    <p className="pl-2 border-l-2 border-cyan-400/40 text-slate-200 font-medium">
                      {currentDayData.morning}
                    </p>
                  </div>

                  <div className="p-4 bg-[#0b1528] rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-[9px] uppercase font-black text-amber-400 block tracking-widest">
                      🍽️ Mid-Day Lunch & Cuisine (12:30 PM - 02:00 PM)
                    </span>
                    <p className="pl-2 border-l-2 border-amber-400/40 text-slate-200 font-medium">
                      {currentDayData.lunch}
                    </p>
                  </div>

                  <div className="p-4 bg-[#0b1528] rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-[9px] uppercase font-black text-cyan-400 block tracking-widest">
                      ☀️ Afternoon Sightseeing (02:30 PM - 05:00 PM)
                    </span>
                    <p className="pl-2 border-l-2 border-cyan-400/40 text-slate-200 font-medium">
                      {currentDayData.afternoon}
                    </p>
                  </div>

                  <div className="p-4 bg-[#0b1528] rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-[9px] uppercase font-black text-pink-400 block tracking-widest">
                      🌇 Evening Leisure & Sunset (05:30 PM - 07:30 PM)
                    </span>
                    <p className="pl-2 border-l-2 border-pink-400/40 text-slate-200 font-medium">
                      {currentDayData.evening}
                    </p>
                  </div>

                  <div className="p-4 bg-[#0b1528] rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-[9px] uppercase font-black text-indigo-400 block tracking-widest">
                      🌙 Evening Dinner & Rest (08:00 PM - 10:00 PM)
                    </span>
                    <p className="pl-2 border-l-2 border-indigo-400/40 text-slate-200 font-medium">
                      {currentDayData.dinner}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 5 cols: Cost Breakdown + Transportation + Raise Complaint CTA */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* FEATURE 4: Overall Trip Cost Breakdown Card (Recalculated dynamically) */}
          {costBreakdown && (
            <div className="bg-[#101b30] p-6 rounded-[28px] border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                <h3 className="text-xs uppercase font-black tracking-widest text-slate-200 flex items-center">
                  <Receipt className="h-4 w-4 text-cyan-400 mr-2" />
                  Estimated Trip Cost Breakdown
                </h3>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ₹{dynamicPerPerson.toLocaleString()} / pax
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-[#0b1528] rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 flex items-center">
                    <Building2 className="h-3.5 w-3.5 mr-1.5 text-cyan-400" /> Accommodation Stay
                  </span>
                  <strong className="text-slate-100">₹{Math.round(Number(costBreakdown.accommodation || 0)).toLocaleString()}</strong>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-[#0b1528] rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 flex items-center">
                    <Utensils className="h-3.5 w-3.5 mr-1.5 text-cyan-400" /> Food & Meals (3/day)
                  </span>
                  <strong className="text-slate-100">₹{Math.round(Number(costBreakdown.food || 0)).toLocaleString()}</strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
                  <span className="text-slate-300 flex items-center">
                    <Car className="h-3.5 w-3.5 mr-1.5 text-cyan-400" /> Local & Intercity Transit
                  </span>
                  <div className="text-right">
                    <strong className="text-cyan-300">₹{Math.round(Number(dynamicTransitCost || 0)).toLocaleString()}</strong>
                    {activeTransitOption && (
                      <span className="text-[9px] text-cyan-400/80 block font-semibold">
                        ({activeTransitOption.transport_type ? String(activeTransitOption.transport_type).split('(')[0].trim() : 'Transit'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-[#0b1528] rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 flex items-center">
                    <Compass className="h-3.5 w-3.5 mr-1.5 text-cyan-400" /> Sightseeing & Permits
                  </span>
                  <strong className="text-slate-100">₹{Math.round(Number(costBreakdown.sightseeing || 0)).toLocaleString()}</strong>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-[#0b1528] rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 flex items-center">
                    <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-cyan-400" /> Emergency Reserve
                  </span>
                  <strong className="text-slate-100">₹{Math.round(Number(costBreakdown.miscellaneous || 0)).toLocaleString()}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex justify-between items-center">
                <span className="text-xs font-black text-slate-300">Total Calculated Cost</span>
                <span className="text-xl font-black text-cyan-300">₹{dynamicTotalCost.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* FEATURE: Recommended Accommodations & Stays Showcase */}
          {hotelOptions.length > 0 && (
            <div className="bg-[#101b30] p-6 rounded-[28px] border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                <h3 className="text-xs uppercase font-black tracking-widest text-slate-200 flex items-center">
                  <Building2 className="h-4 w-4 text-cyan-400 mr-2" />
                  Accommodations & Stays
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {hotelOptions.length} Options
                </span>
              </div>

              <div className="space-y-2.5">
                {hotelOptions.slice(0, 3).map((h) => (
                  <div key={h.id} className="p-3 bg-[#0b1528] rounded-2xl border border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-100">{h.name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {h.hotel_type || 'Hotel'} • ⭐ {h.rating || 4.2}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-cyan-300 font-black">₹{parseInt(h.price_per_night).toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400 block font-semibold">/ night</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-700/40">
                      <span>{h.address || 'Town Central'}</span>
                      {h.website ? (
                        <a
                          href={h.website.startsWith('http') ? h.website : `https://${h.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 hover:underline"
                        >
                          <Globe className="h-2.5 w-2.5" />
                          <span>Official Website</span>
                          <ExternalLink className="h-2 w-2" />
                        </a>
                      ) : (
                        <span className="text-slate-500">Standard Stay</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FEATURE 1: Recommended Transportation Showcase with User Input From & To */}
          <div className="bg-[#101b30] p-6 rounded-[28px] border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <h3 className="text-xs uppercase font-black tracking-widest text-slate-200 flex items-center">
                <Car className="h-4 w-4 text-cyan-400 mr-2" />
                Location-Aware Transportation & Route Engine
              </h3>
              {transitData.distance_km > 0 && (
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                  🛣️ ~{transitData.distance_km} km Route
                </span>
              )}
            </div>

            {/* Interactive User Input Route Selector (From / To) */}
            <TravelLocationSelector
              origin={fromLocation}
              destination={toLocation}
              travelers={trip.travelers}
              budget={trip.budget}
              onOriginChange={(newOrigin) => {
                setFromLocation(newOrigin);
                fetchRouteData(newOrigin, toLocation);
              }}
              onDestinationChange={(newDest) => {
                setToLocation(newDest);
                fetchRouteData(fromLocation, newDest);
              }}
              onSwap={() => {
                const tempOrigin = toLocation;
                const tempDest = fromLocation;
                setFromLocation(tempOrigin);
                setToLocation(tempDest);
                fetchRouteData(tempOrigin, tempDest);
              }}
              isLoading={transitData.loading}
            />

            {/* Route Summary */}
            {transitData.distance_km > 0 && (
              <RouteSummary
                originName={(typeof fromLocation === 'object' && fromLocation !== null) ? (fromLocation.name || fromLocation.label || '') : (fromLocation || '')}
                destinationName={(typeof toLocation === 'object' && toLocation !== null) ? (toLocation.name || toLocation.label || '') : (toLocation || '')}
                distanceKm={transitData.distance_km}
                durationFormatted={transitData.duration_formatted}
                dataSource={transitData.dataSource}
                travelers={trip.travelers}
              />
            )}

            {/* Interactive Leaflet Map */}
            {transitData.showMap && (
              <div id="trip-details-map-section" className="scroll-mt-24 transition-all">
                <TravelMap
                  origin={fromLocation}
                  destination={toLocation}
                  geometry={transitData.geometry}
                  distanceKm={transitData.distance_km}
                  durationFormatted={transitData.duration_formatted}
                  dataSource={transitData.dataSource}
                  height="320px"
                  allowSelection={true}
                  onOriginChange={(newOrigin) => {
                    setFromLocation(newOrigin);
                    fetchRouteData(newOrigin, toLocation);
                  }}
                  onDestinationChange={(newDest) => {
                    setToLocation(newDest);
                    fetchRouteData(fromLocation, newDest);
                  }}
                />
              </div>
            )}

            {/* Loading / Error States */}
            {transitData.loading && (
              <LoadingState message="Calculating real road route and tariffs..." />
            )}

            {transitData.error && (
              <RouteError
                message={transitData.error}
                onRetry={() => fetchRouteData(fromLocation, toLocation)}
              />
            )}

            {/* Dynamic Transportation Cards */}
            {!transitData.loading && !transitData.error && (
              <TransportationOptions
                options={transitData.options || []}
                aiAdvice={transitData.ai_advice}
                excludedModes={transitData.excluded_modes || []}
                aiFeasibility={transitData.ai_feasibility}
                originName={(typeof fromLocation === 'object' && fromLocation !== null) ? (fromLocation.name || fromLocation.label || '') : (fromLocation || '')}
                selectedId={selectedTransitId}
                onSelect={(opt) => setSelectedTransitId(opt.id)}
                onShowOnMap={(opt) => {
                  setTransitData(prev => ({ ...prev, showMap: true }));
                  if (opt) setSelectedTransitId(opt.id);
                  setTimeout(() => {
                    const elem = document.getElementById('trip-details-map-section');
                    if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
                travelers={trip.travelers}
                distanceKm={transitData.distance_km}
              />
            )}

          </div>


          {/* FEATURE 6: Raise Complaint / Report Issue CTA */}
          <div className="bg-[#101b30] p-6 rounded-[28px] border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-3">
            <h3 className="text-xs uppercase font-black tracking-widest text-slate-200 flex items-center">
              <LifeBuoy className="h-4 w-4 text-amber-400 mr-2" />
              Need Assistance With This Trip?
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Facing issues with hotel check-in, delays, or itinerary adjustments? Lodge an instant ticket with our Support Desk.
            </p>
            <Link
              to={`/support?trip_id=${trip.id}&subject=${encodeURIComponent(`Issue regarding Trip to ${trip.destination_name}`)}`}
              className="w-full py-3 bg-[#0b1528] hover:bg-[#14233f] text-slate-200 hover:text-white border border-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <span>Raise Complaint / Request Help</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#101b30] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-100">
                    Delete Saved Trip?
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Are you sure you want to delete your saved trip to <strong className="text-slate-200">{trip.destination_name}</strong>? This will permanently delete the itinerary, budget records, and booking references.
                  </p>
                  {deleteError && (
                    <p className="text-xs text-rose-400 font-bold pt-1">{deleteError}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end items-center space-x-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteTrip}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition-all flex items-center space-x-1.5"
                >
                  {isDeleting ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Trip</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
