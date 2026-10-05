import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Compass, Sparkles, MapPin, Search, ArrowRight, Star, Heart,
  ShieldCheck, Award, MessageSquare, Plus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { tripService } from '../services/api';
import { motion } from 'framer-motion';

export default function Home() {
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDestinations() {
      try {
        const res = await tripService.getDestinations();
        setDestinations((res.destinations || []).slice(0, 4)); 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDestinations();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/destinations');
    }
  };


  const toggleFavorite = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // User-requested categories listing
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

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 antialiased overflow-x-hidden selection:bg-blue-500/20">
      <Navbar />

      {/* 1. Spacious Hero Section with light accents */}
      <header className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden flex items-center min-h-[85vh]">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Futuristic SVG Map backdrop pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full max-w-7xl" viewBox="0 0 1000 600" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M150,150 Q300,100 450,250 T750,150 T900,450" strokeDasharray="5,5" />
            <path d="M100,400 Q300,500 500,300 T900,300" strokeDasharray="3,3" />
            <circle cx="150" cy="150" r="4" fill="currentColor" />
            <circle cx="450" cy="250" r="4" fill="currentColor" />
            <circle cx="750" cy="150" r="4" fill="currentColor" />
            <circle cx="900" cy="450" r="4" fill="currentColor" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Text details */}
            <motion.div 
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[10px] font-extrabold uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                <span>Next-Gen Travel Copilot</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-100 tracking-tight leading-[1.1] font-sans">
                Escape bounds with <br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Artificial Intelligence
                </span>
              </h1>
              
              <p className="text-sm md:text-base text-slate-400 font-medium leading-relaxed max-w-xl">
                Plan customized holiday itineraries, predict local accommodations, dining shacks, and transit pricing using smart automated filters.
              </p>

              {/* Main Search Panel */}
              <form onSubmit={handleSearchSubmit} className="bg-slate-900/80 p-2.5 rounded-full border border-slate-700 shadow-lg flex items-center space-x-2 w-full max-w-lg transition-all focus-within:ring-4 focus-within:ring-blue-400/20">
                <div className="flex items-center space-x-2 flex-grow pl-3">
                  <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Where is your next escape? (e.g. Munnar)"
                    className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-wider hover:bg-blue-500 transition-all shadow-md shrink-0"
                >
                  Explore
                </button>
              </form>

              {/* Quick stats tags */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-bold text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-teal-600" />
                  <span>Secure Booking Mappings</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Award className="h-4.5 w-4.5 text-teal-600" />
                  <span>Personalized Itineraries</span>
                </div>
              </div>
            </motion.div>


          </div>
        </div>
      </header>

      {/* 2. TRAVEL CATEGORIES (User requested layout) */}
      <section className="py-12 bg-slate-900/70 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-6">Search by Category</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => navigate(`/destinations?category=${encodeURIComponent(cat.query)}`)}
                className="flex items-center space-x-2 px-5 py-3 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-blue-400 hover:text-blue-300 hover:shadow-md transition-all text-xs font-bold text-slate-300"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRENDING DESTINATIONS (User requested layout) */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-1">
            <span className="text-xs text-blue-300 uppercase font-extrabold tracking-widest">Inspirational Catalog</span>
            <h2 className="text-3xl font-black text-slate-100 tracking-tight">Trending Destinations</h2>
          </div>
          <Link to="/destinations" className="flex items-center space-x-1.5 text-xs text-blue-300 font-bold hover:underline">
            <span>Explore All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-80 bg-slate-800 rounded-3xl animate-pulse border border-slate-700"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest) => (
              <Link 
                key={dest.id}
                to={`/destinations/${dest.id}`}
                className="group bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden block hover:shadow-xl transition-all duration-300 relative"
              >
                {/* Favorite Button */}
                <button
                  onClick={(e) => toggleFavorite(dest.id, e)}
                  className="absolute top-4 right-4 z-20 p-2 bg-slate-800/90 backdrop-blur-md rounded-full shadow-md text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Heart className={`h-4.5 w-4.5 ${favorites[dest.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Large Image with hover zoom */}
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={dest.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <span className="absolute bottom-4 left-4 text-[9px] uppercase font-bold tracking-widest text-white bg-blue-600 px-2.5 py-1 rounded-full">
                    {dest.category}
                  </span>
                </div>

                {/* Details layout */}
                <div className="p-5 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-100 group-hover:text-blue-300 transition-colors leading-tight">
                        {dest.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mt-0.5">
                        {dest.city}, {dest.state}
                      </span>
                    </div>
                    <div className="flex items-center text-amber-500 space-x-1 shrink-0 font-extrabold text-xs">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>4.5</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Estimated Cost</span>
                    <span className="font-black text-slate-100">
                      ₹{parseInt(dest.budget_min).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {destinations.length === 0 && (
              <div className="col-span-4 text-center py-12 text-slate-400 font-semibold italic bg-slate-900 rounded-3xl border border-slate-800">
                No verified tourist locations found. Run backend service to inspect.
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
