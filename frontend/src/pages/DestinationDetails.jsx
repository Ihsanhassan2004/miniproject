import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Calendar, Sun, Building2, Utensils, Compass, Car, 
  Star, MessageSquare, Droplets, Wind, ArrowLeft,
  Globe, ExternalLink, Sparkles, Clock, Ticket, ChevronRight,
  ShieldCheck, AlertCircle, ZoomIn
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageModal from '../components/ImageModal';
import { tripService, authService } from '../services/api';
import { motion } from 'framer-motion';

const ATTRACTION_IMAGE_FALLBACKS = {
  park: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=60',
  dam: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=60',
  peak: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=60',
  cave: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=60',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60',
  lake: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=60',
  cliff: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=60',
  temple: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=60',
  fort: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800&auto=format&fit=crop&q=60',
  palace: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=60',
  waterfall: 'https://images.unsplash.com/photo-1546853020-ca4909aef454?w=800&auto=format&fit=crop&q=60',
  boating: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=60',
  rafting: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=60'
};

export default function DestinationDetails() {
  const { id } = useParams();
  const [destination, setDestination] = useState(null);
  const [weather, setWeather] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const currentUser = authService.getCurrentUser();

  const loadData = async () => {
    try {
      const detailRes = await tripService.getDestinationDetail(id);
      setDestination(detailRes.destination);
      
      const weatherRes = await tripService.getWeather(id);
      setWeather(weatherRes.weather);
      
      const reviewsRes = await tripService.getReviews(id);
      setReviews(reviewsRes.reviews || []);
    } catch (err) {
      console.error("Failed to load destination details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    setSubmittingReview(true);
    setReviewMsg('');
    try {
      await tripService.postReview({
        destination_id: parseInt(id),
        rating: rating,
        review: reviewText
      });
      setReviewText('');
      setReviewMsg('Review submitted successfully!');
      const reviewsRes = await tripService.getReviews(id);
      setReviews(reviewsRes.reviews || []);
    } catch (err) {
      setReviewMsg('Failed to post review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getAttractionImage = (att) => {
    if (att.image_url && att.image_url.trim()) return att.image_url;
    const firstWord = att.name.toLowerCase().split(' ')[0];
    return ATTRACTION_IMAGE_FALLBACKS[firstWord] || ATTRACTION_IMAGE_FALLBACKS['beach'] || destination?.image_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
        <Navbar />
        <div className="flex-grow text-center py-24 space-y-4 max-w-sm mx-auto flex flex-col justify-center items-center">
          <Compass className="h-12 w-12 text-slate-500 animate-spin-slow" />
          <h2 className="text-xl font-extrabold text-slate-100">Destination Not Found</h2>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">The requested tourist destination details do not exist.</p>
          <Link to="/destinations" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"> 
            <ArrowLeft className="h-4 w-4" />
            Back to Destinations
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const attractionsList = destination.attractions || [];
  const hotelsList = destination.hotels || [];
  const restaurantsList = destination.restaurants || [];
  const transportList = destination.transportation || [];

  return (
    <div className="w-full relative z-10 text-left space-y-6 text-slate-100">
      {/* Fullscreen Hero Image Section */}
      <div className="relative h-[65vh] w-full overflow-hidden rounded-luxury shadow-2xl border border-slate-700/60 group">
        <Link
          to="/destinations"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#0b1528]/85 border border-slate-700/80 px-4 py-2 text-xs font-bold text-slate-200 shadow-xl backdrop-blur-md transition hover:bg-[#12213d] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 text-cyan-400" />
          Back to Explore
        </Link>
        <button
          type="button"
          onClick={() => setPreviewImage({
            url: destination.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            title: destination.name,
            subtitle: `${destination.city}, ${destination.state} • ${destination.category}`,
            description: destination.description
          })}
          className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#0b1528]/85 border border-slate-700/80 px-3.5 py-1.5 text-xs font-bold text-slate-200 shadow-xl backdrop-blur-md transition hover:bg-[#12213d] hover:text-white cursor-pointer"
          title="Click to view full hero image"
        >
          <ZoomIn className="h-3.5 w-3.5 text-cyan-400" />
          <span>View Photo</span>
        </button>
        <img
          src={destination.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'}
          alt={destination.name}
          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-700"
          onClick={() => setPreviewImage({
            url: destination.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            title: destination.name,
            subtitle: `${destination.city}, ${destination.state} • ${destination.category}`,
            description: destination.description
          })}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/50 to-transparent pointer-events-none"></div>
        
        {/* Title elements aligned on image bottom */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 text-left text-white space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md shadow-blue-600/30">
              {destination.category}
            </span>
            <span className="px-3 py-1 bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold rounded-full backdrop-blur-md">
              ✨ {attractionsList.length} Attractions Registered
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">{destination.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-cyan-400" />
              {destination.city}, {destination.state}
            </span>
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-amber-400" />
              Best Season: {destination.best_time || 'All year'}
            </span>
            <span className="flex items-center">
              <span className="text-emerald-400 mr-1 font-extrabold">₹</span>
              Budget: ₹{parseInt(destination.budget_min || 0).toLocaleString()} – ₹{parseInt(destination.budget_max || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid container: Details + Booking side panel */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full text-left flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main info panel */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-800 text-xs font-bold uppercase tracking-wider space-x-1 overflow-x-auto pb-0.5">
              {[
                { id: 'overview', label: 'Overview', icon: Compass, count: null },
                { id: 'attractions', label: 'Attractions', icon: Sparkles, count: attractionsList.length },
                { id: 'hotels', label: 'Hotels', icon: Building2, count: hotelsList.length },
                { id: 'restaurants', label: 'Restaurants', icon: Utensils, count: restaurantsList.length },
                { id: 'transport', label: 'Transportation', icon: Car, count: transportList.length },
                { id: 'reviews', label: 'Reviews', icon: MessageSquare, count: reviews.length }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-all -mb-[1px] whitespace-nowrap rounded-t-lg ${
                      isActive
                        ? 'border-cyan-400 text-cyan-400 font-black bg-cyan-500/10'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content wrappers */}
            <div className="space-y-6">
              
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overview summary */}
                  <div className="bg-[#101b30] p-6 sm:p-7 border border-slate-700/70 rounded-luxury shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
                    <h3 className="font-extrabold text-xs text-cyan-400 uppercase tracking-widest flex items-center">
                      <Compass className="h-4 w-4 mr-2 text-cyan-400" />
                      About Local Destination
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      {destination.description || 'Welcome to this beautiful destination in Kerala.'}
                    </p>
                  </div>

                  {/* Top Attractions Preview Strip */}
                  {attractionsList.length > 0 && (
                    <div className="bg-[#101b30] p-6 border border-slate-700/70 rounded-luxury shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest flex items-center">
                          <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
                          Top Sightseeing & Attractions
                        </h3>
                        <button
                          onClick={() => setActiveTab('attractions')}
                          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center transition-colors"
                        >
                          View all ({attractionsList.length}) <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {attractionsList.slice(0, 2).map((att, idx) => (
                          <div 
                            key={att.id || idx}
                            className="bg-[#0b1528] border border-slate-700/60 rounded-2xl overflow-hidden group hover:border-cyan-500/50 transition-all flex flex-col justify-between"
                          >
                            <div 
                              className="h-32 overflow-hidden relative cursor-pointer group/img"
                              onClick={() => setPreviewImage({
                                url: getAttractionImage(att),
                                title: att.name,
                                subtitle: `${destination?.name} • Spot #${idx + 1}`,
                                description: att.description
                              })}
                              title="Click to view attraction photo"
                            >
                              <img 
                                src={getAttractionImage(att)} 
                                alt={att.name} 
                                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" 
                              />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="h-5 w-5 text-white drop-shadow-md" />
                              </div>
                              <div className="absolute top-2 left-2 bg-[#0b1528]/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-cyan-300 border border-slate-700">
                                Spot {idx + 1}
                              </div>
                              <div className="absolute top-2 right-2 bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                                {parseFloat(att.entry_fee || 0) > 0 ? `🎟️ ₹${parseFloat(att.entry_fee).toLocaleString()}` : 'Free Entry'}
                              </div>
                            </div>
                            <div className="p-3.5 space-y-1.5">
                              <h4 className="font-extrabold text-xs text-slate-100 line-clamp-1">{att.name}</h4>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{att.description}</p>
                              <div className="flex items-center text-[10px] text-slate-400 pt-1">
                                <Clock className="h-3 w-3 mr-1 text-cyan-400" /> {att.visit_time || '2 Hours'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weather widget */}
                  {weather ? (
                    <div className="bg-[#101b30] p-6 border border-slate-700/70 rounded-luxury shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-5">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest flex items-center">
                          <Sun className="h-4.5 w-4.5 text-amber-400 mr-2" />
                          Climate & 5-Day Weather Forecast
                        </h3>
                        <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                          {weather.current?.air_quality || 'Good AQI'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        <div className="bg-[#0b1528] p-4 border border-slate-700/60 rounded-2xl space-y-1 text-center">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Temperature</span>
                          <span className="text-xl font-black text-slate-100 block flex items-center justify-center">
                            <Sun className="h-4 w-4 mr-1 text-amber-400 shrink-0" />
                            {weather.temperature}°C
                          </span>
                        </div>
                        <div className="bg-[#0b1528] p-4 border border-slate-700/60 rounded-2xl space-y-1 text-center">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Condition</span>
                          <span className="text-xs font-black text-cyan-300 block uppercase pt-1">{weather.weather}</span>
                        </div>
                        <div className="bg-[#0b1528] p-4 border border-slate-700/60 rounded-2xl space-y-1 text-center">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Humidity</span>
                          <span className="text-xl font-black text-slate-100 block flex items-center justify-center">
                            <Droplets className="h-4 w-4 mr-1 text-blue-400 shrink-0" />
                            {weather.humidity}%
                          </span>
                        </div>
                        <div className="bg-[#0b1528] p-4 border border-slate-700/60 rounded-2xl space-y-1 text-center">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Wind Speed</span>
                          <span className="text-xl font-black text-slate-100 block flex items-center justify-center">
                            <Wind className="h-4 w-4 mr-1 text-teal-400 shrink-0" />
                            {weather.wind_speed} km/h
                          </span>
                        </div>
                      </div>

                      {/* 5-Day Forecast Grid */}
                      {weather.forecast && weather.forecast.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-slate-800">
                          <span className="text-xs font-extrabold text-slate-300 block">5-Day Daily Outlook</span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            {weather.forecast.map((f, idx) => (
                              <div key={idx} className="bg-[#0b1528] p-2.5 rounded-xl border border-slate-700/50 text-center space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-slate-400 block">{f.day_name}</span>
                                <div className="text-xs font-black text-slate-100">
                                  {f.temp_high}° <span className="text-slate-500 text-[10px]">/ {f.temp_low}°</span>
                                </div>
                                <span className="text-[9px] text-cyan-300 font-bold block truncate">{f.condition}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Packing & Safety Advisory */}
                      <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-200 font-medium leading-relaxed flex items-start space-x-2">
                        <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{weather.current?.advice || weather.advice}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 bg-[#101b30] border border-slate-700/70 rounded-luxury animate-pulse"></div>
                  )}
                </div>
              )}

              {/* 2. ATTRACTIONS TAB */}
              {activeTab === 'attractions' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">
                        Attractions & Sightseeing Spots
                      </h3>
                      <p className="text-xs text-slate-400">Discover must-see natural wonders, heritage sites, and attractions in {destination.name}.</p>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
                      {attractionsList.length} Places
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {attractionsList.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="bg-[#101b30] border border-slate-700/70 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(2,8,23,0.25)] flex flex-col justify-between group hover:border-cyan-500/50 transition-all"
                      >
                        <div>
                          {/* Image thumbnail */}
                          <div 
                            className="h-44 overflow-hidden relative cursor-pointer group/img"
                            onClick={() => setPreviewImage({
                              url: getAttractionImage(att),
                              title: att.name,
                              subtitle: `${destination?.name} • Attraction #${idx + 1}`,
                              description: att.description
                            })}
                            title="Click to view attraction photo"
                          >
                            <img
                              src={getAttractionImage(att)}
                              alt={att.name}
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="h-6 w-6 text-white drop-shadow-md" />
                            </div>
                            <div className="absolute top-2.5 left-2.5 bg-[#0b1528]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-black text-cyan-300 border border-slate-700">
                              Attraction {idx + 1}
                            </div>
                            <div className="absolute top-2.5 right-2.5 bg-emerald-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                              {parseFloat(att.entry_fee || 0) > 0 ? `🎟️ ₹${parseFloat(att.entry_fee).toLocaleString()}` : 'Free Entry'}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-4 space-y-2">
                            <h4 className="font-black text-sm text-slate-100 leading-tight">
                              {att.name}
                            </h4>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center text-amber-400">
                                <Star className="h-3 w-3 mr-0.5 fill-amber-400" /> 4.7
                              </span>
                              <span>•</span>
                              <span className="flex items-center text-cyan-300">
                                <Clock className="h-3 w-3 mr-0.5 text-cyan-400" /> {att.visit_time || '2–3 Hours'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                              {att.description || `Scenic tourist spot and recommended sightseeing landmark located in ${destination.name}.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {attractionsList.length === 0 && (
                    <div className="text-center py-16 bg-[#101b30] border border-slate-700/70 rounded-3xl space-y-2 text-slate-400">
                      <Sparkles className="h-8 w-8 mx-auto text-slate-500" />
                      <p className="text-xs font-semibold">No registered attractions found for this destination yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. HOTELS TAB */}
              {activeTab === 'hotels' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {hotelsList.map((hotel) => (
                    <div key={hotel.id} className="bg-[#101b30] border border-slate-700/70 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(2,8,23,0.25)] flex flex-col justify-between hover:border-slate-600 transition-all">
                      <div className="p-5 space-y-3.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-100 leading-tight">{hotel.name}</h4>
                            <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider block mt-0.5">{hotel.hotel_type}</span>
                          </div>
                          <span className="flex items-center text-amber-400 font-extrabold text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                            {hotel.rating}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium flex items-center">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
                          {hotel.address || 'Town Central'}
                        </p>
                        <div className="pt-1 flex justify-between text-xs font-bold text-slate-400">
                          <span>Total Rooms</span>
                          <span className="text-slate-200 font-extrabold">{hotel.total_rooms} Rooms</span>
                        </div>
                        {hotel.website && (
                          <div className="pt-1">
                            <a
                              href={hotel.website.startsWith('http') ? hotel.website : `https://${hotel.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors group"
                            >
                              <Globe className="h-3.5 w-3.5 mr-1 text-cyan-400 shrink-0" />
                              <span>Visit Official Website</span>
                              <ExternalLink className="h-3 w-3 ml-1 opacity-70 group-hover:opacity-100 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="bg-[#0b1528] border-t border-slate-700/60 px-5 py-3 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Per Night</span>
                        <span className="font-black text-cyan-400 text-sm">₹{parseInt(hotel.price_per_night || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {hotelsList.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-400 font-semibold italic bg-[#101b30] border border-slate-700/70 rounded-3xl">
                      No matching accommodations registered under this destination.
                    </div>
                  )}
                </div>
              )}

              {/* 4. RESTAURANTS TAB */}
              {activeTab === 'restaurants' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {restaurantsList.map((rest) => (
                    <div key={rest.id} className="bg-[#101b30] border border-slate-700/70 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(2,8,23,0.25)] flex flex-col justify-between hover:border-slate-600 transition-all">
                      <div className="p-5 space-y-3.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-100 leading-tight">{rest.name}</h4>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(rest.cuisine || 'Local Cuisine').split(',').map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="text-[9px] uppercase font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md tracking-wider inline-block"
                                >
                                  {c.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="flex items-center text-amber-400 font-extrabold text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                            {rest.rating}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium flex items-center">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
                          {rest.address || `${destination.name} Central`}
                        </p>
                      </div>
                      <div className="bg-[#0b1528] border-t border-slate-700/60 px-5 py-3 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Avg. Cost (Per Person)</span>
                        <span className="font-black text-slate-100">₹{parseInt(rest.avg_cost || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {restaurantsList.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-400 font-semibold italic bg-[#101b30] border border-slate-700/70 rounded-3xl">
                      No verified dining locations found.
                    </div>
                  )}
                </div>
              )}

              {/* 5. TRANSPORTATION TAB */}
              {activeTab === 'transport' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {transportList.map((trans) => (
                    <div key={trans.id} className="bg-[#101b30] border border-slate-700/70 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(2,8,23,0.25)] flex flex-col justify-between hover:border-slate-600 transition-all">
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-100 leading-tight">{trans.transport_type}</h4>
                            <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-widest block mt-0.5">{trans.availability}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 font-semibold">
                          Route: <strong className="text-white">{trans.source} &rarr; {trans.destination}</strong>
                        </p>
                        <div className="flex justify-between text-xs font-bold text-slate-400 pt-1">
                          <span>Travel Time</span>
                          <span className="text-slate-200">{trans.travel_time}</span>
                        </div>
                        {trans.distance && parseFloat(trans.distance) > 0 ? (
                          <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>Distance</span>
                            <span className="text-slate-200">{trans.distance} km</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="bg-[#0b1528] border-t border-slate-700/60 px-5 py-3 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Estimated Fare</span>
                        <span className="font-black text-cyan-400 text-sm">₹{parseInt(trans.fare || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {transportList.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-400 font-semibold italic bg-[#101b30] border border-slate-700/70 rounded-3xl">
                      No transit details registered.
                    </div>
                  )}
                </div>
              )}

              {/* 6. REVIEWS TAB */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Write a review card */}
                  <div>
                    {currentUser ? (
                      <div className="bg-[#101b30] p-6 sm:p-7 border border-slate-700/70 rounded-luxury shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
                        <h3 className="font-extrabold text-cyan-400 text-xs uppercase tracking-widest">Write a Review</h3>
                        
                        {reviewMsg && (
                          <p className="text-xs text-emerald-400 font-extrabold">{reviewMsg}</p>
                        )}

                        <form onSubmit={handlePostReview} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating Score</label>
                            <div className="flex items-center space-x-1.5">
                              {[1, 2, 3, 4, 5].map((stars) => (
                                <button
                                  key={stars}
                                  type="button"
                                  onClick={() => setRating(stars)}
                                  className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                                >
                                  <Star className={`h-6 w-6 ${stars <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Share your experience</label>
                            <textarea
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="What did you explore? How was the local environment?"
                              rows="3"
                              className="w-full text-xs bg-[#0b1528] border border-slate-700/70 rounded-xl p-3 focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-500 font-medium"
                            ></textarea>
                          </div>

                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
                          >
                            {submittingReview ? 'Posting...' : 'Submit Review'}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="p-5 bg-[#101b30] border border-slate-700/70 text-slate-300 text-xs rounded-2xl text-center font-bold">
                        Please <Link to="/login" className="underline text-cyan-400 hover:text-cyan-300">Login</Link> to share reviews.
                      </div>
                    )}
                  </div>

                  {/* Reviews timeline list */}
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="bg-[#101b30] p-5 border border-slate-700/70 rounded-2xl shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2 font-bold text-xs">
                            <div className="h-7 w-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-cyan-300 flex items-center justify-center font-black">
                              {rev.user_name ? rev.user_name[0].toUpperCase() : 'U'}
                            </div>
                            <span className="text-slate-200">{rev.user_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{rev.created_at || 'Recently'}</span>
                        </div>
                        <div className="flex items-center text-amber-400 space-x-0.5">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium italic bg-[#0b1528] p-3 rounded-xl border border-slate-700/50">
                          "{rev.review}"
                        </p>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="text-center py-8 text-slate-500 italic text-xs font-semibold">
                        No reviews posted yet. Be the first to share your thoughts!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right sidebar: Booking Details Card */}
          <div className="lg:col-span-4 bg-[#101b30] border border-slate-700/70 rounded-luxury p-6 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-5 lg:sticky lg:top-28">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-cyan-400 border-b border-slate-800 pb-3 flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-cyan-400" />
              Destination Summary
            </h3>
            
            <div className="space-y-4 text-xs font-semibold text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Category</span>
                <span className="font-bold text-slate-100 uppercase bg-slate-800/80 px-2 py-0.5 rounded text-[10px]">{destination.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Best Season</span>
                <span className="font-bold text-slate-100">{destination.best_time || 'September to March'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Attractions</span>
                <span className="font-bold text-cyan-300">{attractionsList.length} Places to Visit</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Stays & Hotels</span>
                <span className="font-bold text-slate-200">{hotelsList.length} Options</span>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>Budget Estimate</span>
                  <span className="text-cyan-400 font-black">
                    ₹{parseInt(destination.budget_min || 0).toLocaleString()} – ₹{parseInt(destination.budget_max || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">Covers stays, dining, transport, and attraction tickets.</p>
              </div>

              <Link
                to={`/plan-trip?destination=${encodeURIComponent(destination.name)}`}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Plan Trip with AI</span>
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Image Preview Lightbox Modal */}
      <ImageModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        src={previewImage?.url}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        description={previewImage?.description}
      />
    </div>
  );
}
