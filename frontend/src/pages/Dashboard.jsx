import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Sparkles, MapPin, Search, Star, Heart,
  Compass, Plus, Send, CheckCircle, Clock, Shield, BookMarked, ArrowRight
} from 'lucide-react';
import { tripService, authService } from '../services/api';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || { name: 'Traveler' };
  
  const [stats, setStats] = useState({
    tripsPlanned: 0,
    upcomingTrips: 0,
    diariesCount: 0
  });

  const [trips, setTrips] = useState([]);
  const [upcomingTrip, setUpcomingTrip] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [trendingDests, setTrendingDests] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [pastTripRecs, setPastTripRecs] = useState(null);

  // Quick categories
  const categories = [
    { label: 'Hill Stations', icon: '🏔', query: 'hill station' },
    { label: 'Beaches', icon: '🏖', query: 'beach' },
    { label: 'Backwaters', icon: '🛶', query: 'backwaters' },
    { label: 'Eco Tourism', icon: '🌱', query: 'eco tourism' },
    { label: 'Wildlife', icon: '🐘', query: 'wildlife' },
    { label: 'Waterfalls', icon: '💦', query: 'waterfall' },
    { label: 'Nature', icon: '🌿', query: 'nature' },
    { label: 'Heritage', icon: '🏛', query: 'heritage' },
    { label: 'Pilgrimage', icon: '🛕', query: 'pilgrimage' },
    { label: 'Wellness', icon: '🧘', query: 'wellness' },
    { label: 'Cities', icon: '🌆', query: 'city tourism' }
  ];

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const tripsRes = await tripService.getMyTrips();
        const destRes = await tripService.getDestinations();
        let myDiaries = [];
        try {
          const diaryRes = await tripService.getMyDiaries();
          myDiaries = diaryRes.diaries || [];
        } catch (dErr) {
          console.warn("Could not fetch user diaries:", dErr);
        }
        
        const myTrips = tripsRes.trips || [];
        setTrips(myTrips);

        setStats({
          tripsPlanned: myTrips.length,
          upcomingTrips: myTrips.length > 0 ? 1 : 0,
          diariesCount: myDiaries.length
        });

        if (myTrips.length > 0) {
          const upcoming = myTrips[0];
          setUpcomingTrip(upcoming);
          setCountdown(5 + (upcoming.id % 12));
        }

        // Set top trending cards
        setTrendingDests((destRes.destinations || []).slice(0, 3));

        // Fetch Recommendations based on user's completed trips
        try {
          const pRes = await tripService.getRecommendationsBasedOnPastTrips();
          if (pRes && pRes.has_past_trips && pRes.recommendations?.length > 0) {
            setPastTripRecs(pRes);
          }
        } catch (pErr) {
          console.warn("Could not fetch past trip recommendations:", pErr);
        }

      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const [loadingPastTrip, setLoadingPastTrip] = useState(false);

  const handleSwitchPastTrip = async (destId) => {
    try {
      setLoadingPastTrip(true);
      const pRes = await tripService.getRecommendationsBasedOnPastTrips({ base_dest_id: destId });
      if (pRes && pRes.has_past_trips && pRes.recommendations?.length > 0) {
        setPastTripRecs(pRes);
      }
    } catch (err) {
      console.warn("Failed to switch past trip in dashboard:", err);
    } finally {
      setLoadingPastTrip(false);
    }
  };

  const handleFavoriteToggle = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto text-left text-slate-100">
      
      {/* 1. Greeting Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            Hello, {currentUser.name || currentUser.username} 👋
          </h1>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Ready for your next adventure?
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/diaries"
            className="flex items-center space-x-1.5 px-4 py-3 bg-[#101b30] hover:bg-[#14233f] text-cyan-300 border border-cyan-500/40 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all"
          >
            <BookMarked className="h-4.5 w-4.5 text-cyan-400" />
            <span>Travel Diary</span>
          </Link>
          <Link
            to="/plan-trip"
            className="flex items-center space-x-1.5 px-5 py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:bg-primary-dark transition-all self-start sm:self-center"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New AI Plan</span>
          </Link>
        </div>
      </div>

      {/* 2. Quick Stats Cards (Three Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: 'Trips Planned', value: stats.tripsPlanned, suffix: 'Schedules', icon: CalendarIcon, bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', link: '/my-trips' },
          { label: 'Upcoming Trips', value: stats.upcomingTrips, suffix: 'Active', icon: Compass, bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]', link: '/my-trips' },
          { label: 'Travel Diaries', value: stats.diariesCount, suffix: 'Memories Saved', icon: BookMarked, bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', link: '/diaries' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              to={item.link}
              className="bg-[#101b30] p-5 rounded-luxury border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] flex items-center justify-between transition-all hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(37,99,235,0.14)] block"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{item.label}</span>
                <span className="text-2xl font-black text-slate-100 block">{item.value}</span>
                <span className="text-[9px] text-slate-400 font-semibold block uppercase">{item.suffix}</span>
              </div>
              <div className={`p-3 rounded-2xl ${item.bg} ${item.text} border border-slate-700/60 shadow-sm`}>
                <Icon className="h-5 w-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. RECOMMENDATIONS BASED ON COMPLETED PAST TRIP */}
      {pastTripRecs && pastTripRecs.has_past_trips && pastTripRecs.recommendations?.length > 0 && (
        <div className="bg-gradient-to-br from-[#101b30] via-[#0d172a] to-[#122240] p-6 sm:p-7 rounded-3xl border border-cyan-500/30 shadow-[0_10px_35px_rgba(6,182,212,0.15)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Recommended Based on Your Completed Trip to <span className="text-cyan-300">{pastTripRecs.base_trip?.destination_name}</span>
                </h2>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {pastTripRecs.base_trip?.vibe_description || 
                 `Because you visited ${pastTripRecs.base_trip?.destination_name}, our AI recommends similar destinations matching its scenic nature & atmosphere:`}
              </p>

              {/* Completed Trips Switcher Pills */}
              {pastTripRecs.completed_trips && pastTripRecs.completed_trips.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Change Past Trip:
                  </span>
                  {pastTripRecs.completed_trips.map(ct => {
                    const isActive = ct.destination_id === pastTripRecs.base_trip?.destination_id;
                    return (
                      <button
                        key={ct.destination_id}
                        type="button"
                        onClick={() => handleSwitchPastTrip(ct.destination_id)}
                        disabled={loadingPastTrip}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isActive
                            ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-102 ring-2 ring-cyan-300/60'
                            : 'bg-[#0b1528] hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-cyan-500/50'
                        }`}
                      >
                        <span>{ct.destination_name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-md capitalize ${isActive ? 'bg-black/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                          {ct.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to="/plan-trip"
              state={{
                destination_types: [pastTripRecs.base_trip?.category || 'hill station'],
                interests: ['nature', 'relaxation']
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-black uppercase tracking-wider transition-all self-start sm:self-auto shrink-0 cursor-pointer shadow-sm hover:scale-102"
            >
              <Compass className="h-4 w-4" />
              <span>Explore All Similar</span>
            </Link>
          </div>

          {/* Destination Cards Grid (Similar unvisited destinations first!) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {pastTripRecs.recommendations.slice(0, 3).map((dest) => (
              <div
                key={dest.destination_id}
                className="group bg-[#0b1528] border border-cyan-500/20 hover:border-cyan-400 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_10px_25px_rgba(6,182,212,0.2)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-36 overflow-hidden relative">
                    <img
                      src={dest.image_url || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=500&q=80'}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-[9px] font-black text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-cyan-400" />
                      <span>{dest.similarity_badge || `Similar to ${pastTripRecs.base_trip?.destination_name}`}</span>
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-cyan-950/80 backdrop-blur-md text-[9px] font-black text-white px-2 py-0.5 rounded-full border border-white/20">
                      {dest.matching_score}% Match
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors">
                          {dest.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          {dest.city}, {dest.state} • {dest.category}
                        </span>
                      </div>
                    </div>

                    {dest.reasons && dest.reasons.length > 0 && (
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-white/5">
                        {dest.reasons[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2.5">
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Est. Starting Budget</span>
                    <span className="text-cyan-300 font-extrabold text-xs">₹{dest.estimated_cost?.total ? parseInt(dest.estimated_cost.total).toLocaleString() : '8,000'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigate('/plan-trip', {
                        state: {
                          destination_types: [dest.category],
                          suggested_destination: dest.name,
                          budget: dest.estimated_cost?.total || 15000
                        }
                      });
                    }}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center shadow-md transition-all block cursor-pointer"
                  >
                    Plan Trip to {dest.name} ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid containing central workspace details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column Content details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* TRAVEL CATEGORIES */}
          <div className="bg-[#101b30] p-6 rounded-luxury border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Travel Categories</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/destinations?category=${encodeURIComponent(cat.query)}`)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0b1528] border border-slate-700/70 hover:border-blue-500 hover:text-blue-300 transition-all text-xs font-bold text-slate-200 cursor-pointer"
                >
                  <span className="text-xl mb-1">{cat.icon}</span>
                  <span className="text-[10px]">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TRENDING DESTINATIONS slider */}
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Trending Destinations</h3>
              <Link to="/destinations" className="text-xs text-primary font-bold hover:underline">See Explore</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {trendingDests.map((dest) => (
                <Link
                  key={dest.id}
                  to={`/destinations/${dest.id}`}
                  className="group bg-[#101b30] border border-slate-700/70 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(2,8,23,0.25)] hover:shadow-[0_12px_35px_rgba(37,99,235,0.14)] transition-all relative block"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleFavoriteToggle(dest.id);
                    }}
                    className="absolute top-3.5 right-3.5 z-10 p-2 bg-[#0b1528]/90 backdrop-blur-md rounded-full shadow-sm text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Heart className={`h-4 w-4 ${favorites[dest.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={dest.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80'}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-100 group-hover:text-blue-300 transition-colors leading-tight">{dest.name}</h4>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 block">{dest.city}, {dest.state}</span>
                      </div>
                      <div className="flex items-center text-amber-500 space-x-0.5 font-bold text-[10px]">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>4.5</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-700/60 flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>Est. Cost</span>
                      <span className="text-slate-100 font-extrabold">₹{parseInt(dest.budget_min).toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column Content details */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* UPCOMING TRIP */}
          <div className="bg-[#101b30] p-6 rounded-luxury border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Upcoming Trip</h3>
            </div>
            
            {upcomingTrip ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#0b1528] rounded-2xl border border-slate-700/70 flex items-start space-x-3.5">
                  <div className="h-12 w-12 rounded-xl bg-blue-600/20 text-cyan-300 flex items-center justify-center shrink-0">
                    <Compass className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div className="space-y-0.5 text-xs font-semibold">
                    <h4 className="font-extrabold text-slate-100 leading-tight">Trip to {upcomingTrip.destination_name}</h4>
                    <span className="text-slate-400 block text-[10px]">From {upcomingTrip.source_location}</span>
                    <span className="text-[10px] text-cyan-300 font-bold block pt-1">{upcomingTrip.duration_days} Days Plan</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0b1528] rounded-2xl border border-slate-700/70 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Preparation Countdown</span>
                  <span className="px-2.5 py-1 bg-blue-600/20 text-cyan-300 font-black rounded-lg text-[10px]">
                    {countdown} Days left
                  </span>
                </div>

                <div className="pt-1">
                  <Link
                    to={`/trips/${upcomingTrip.id}`}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl text-center shadow transition-all hover:opacity-95 block"
                  >
                    View Itinerary & Cost Breakdown
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 italic text-xs font-semibold space-y-3">
                <p>No active bookings. Plan your adventure!</p>
                <Link
                  to="/plan-trip"
                  className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Create Trip Plan
                </Link>
              </div>
            )}
          </div>

          {/* TRAVELER CARE & SUPPORT DESK */}
          <div className="bg-[#101b30] p-6 rounded-luxury border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Traveler Care Desk</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Encountering overbooked accommodations, transit delays, or need refunds?
            </p>
            <Link
              to="/support"
              className="w-full py-2.5 bg-[#0b1528] hover:bg-[#14233f] border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl text-center block transition-all"
            >
              Support Ticket & Help Desk 💬
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
