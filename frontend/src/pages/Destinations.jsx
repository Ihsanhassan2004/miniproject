import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Compass, SlidersHorizontal, Map as MapIcon, Calendar, Star, ArrowLeft, ZoomIn } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageModal from '../components/ImageModal';
import { tripService } from '../services/api';
import { motion } from 'framer-motion';

export default function Destinations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [budgetSort, setBudgetSort] = useState('none'); 
  const [previewImage, setPreviewImage] = useState(null); 

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const categoryParam = selectedCategory === 'all' ? '' : selectedCategory;
        const res = await tripService.getDestinations({
          search: searchVal,
          category: categoryParam
        });
        
        let list = res.destinations || [];
        
        if (budgetSort === 'asc') {
          list = [...list].sort((a, b) => floatVal(a.budget_min) - floatVal(b.budget_min));
        } else if (budgetSort === 'desc') {
          list = [...list].sort((a, b) => floatVal(b.budget_min) - floatVal(a.budget_min));
        }
        
        setDestinations(list);
      } catch (err) {
        console.error("Error loading destinations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchVal, selectedCategory, budgetSort]);

  const floatVal = (v) => parseFloat(v || 0);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'hill station', name: 'Hill Stations' },
    { id: 'beach', name: 'Beaches & Coastal' },
    { id: 'backwaters', name: 'Backwaters' },
    { id: 'eco tourism', name: 'Eco Tourism' },
    { id: 'wildlife', name: 'Wildlife & Sanctuaries' },
    { id: 'waterfall', name: 'Waterfalls' },
    { id: 'nature', name: 'Nature & Greenery' },
    { id: 'heritage', name: 'Heritage' },
    { id: 'pilgrimage', name: 'Pilgrimage' },
    { id: 'wellness', name: 'Wellness & Ayurveda' },
    { id: 'city tourism', name: 'City Tourism' }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full relative z-10 text-left space-y-6">
        
        {/* Title */}
        <div className="space-y-3 border-b border-slate-800/80 pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Explore Destinations</h1>
              <p className="text-slate-400 text-xs font-semibold">Browse tourism spots, check travel costs, and view local recommendations.</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#0b1528] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-[#12213d]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Discovery Layout: Left Sidebar + Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar Filter Section */}
          <aside className="lg:col-span-4 bg-[#101b30] border border-slate-700/70 rounded-luxury p-6 space-y-6 lg:sticky lg:top-28 shadow-[0_10px_30px_rgba(2,8,23,0.25)]">
            <h3 className="font-extrabold text-xs uppercase tracking-widest flex items-center text-slate-300">
              <SlidersHorizontal className="h-4.5 w-4.5 text-blue-300 mr-2" />
              Search & Filters
            </h3>

            {/* Interactive Search */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Search keyword</label>
              <div className="flex items-center bg-[#0b1528] border border-slate-700/70 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <Search className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => {
                    setSearchVal(e.target.value);
                    setSearchParams({ search: e.target.value, category: selectedCategory });
                  }}
                  placeholder="e.g. Munnar, Beach..."
                  className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-400 focus:outline-none font-semibold"
                />
              </div>
            </div>

            {/* Category Filter list */}
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Filter Category</label>
              <div className="flex flex-col space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSearchParams({ search: searchVal, category: cat.id });
                    }}
                    className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      selectedCategory === cat.id 
                        ? 'bg-blue-600/20 text-blue-200 border-blue-500/30 shadow-inner' 
                        : 'text-slate-300 border-transparent hover:bg-[#0b1528] hover:text-slate-100'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <Compass className={`h-3.5 w-3.5 opacity-60 ${selectedCategory === cat.id ? 'text-blue-300' : 'text-slate-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter selector */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Sort Budget (₹)</label>
              <select
                value={budgetSort}
                onChange={(e) => setBudgetSort(e.target.value)}
                className="w-full bg-[#0b1528] border border-slate-700/70 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="none">Default Listing</option>
                <option value="asc">Budget: Low to High</option>
                <option value="desc">Budget: High to Low</option>
              </select>
            </div>
          </aside>

          {/* Right Grid */}
          <div className="lg:col-span-8 space-y-8">
            {/* Destinations listings */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="h-80 bg-[#101b30] border border-slate-700/70 rounded-3xl animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {destinations.map((dest) => (
                  <Link
                    key={dest.id}
                    to={`/destinations/${dest.id}`}
                    className="group bg-[#101b30] border border-slate-700/70 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(2,8,23,0.25)] hover:shadow-[0_12px_35px_rgba(37,99,235,0.14)] transition-all duration-300 relative block"
                  >
                    <div className="h-48 overflow-hidden relative group/img">
                      <img
                        src={dest.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80'}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewImage({
                            url: dest.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
                            title: dest.name,
                            subtitle: `${dest.city}, ${dest.state} • ${dest.category}`,
                            description: dest.description
                          });
                        }}
                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-cyan-500 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg border border-white/10"
                        title="Click to view full image"
                        aria-label="View photo"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-4 left-4 text-[9px] uppercase font-extrabold tracking-widest text-white bg-blue-600 px-3 py-1 rounded-full shadow-md">
                        {dest.category}
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-blue-300 transition-colors leading-tight">{dest.name}</h4>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase mt-0.5">{dest.city}, {dest.state}</span>
                        </div>
                        <div className="flex items-center text-amber-500 space-x-0.5 font-bold text-xs shrink-0">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          <span>4.5</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-700/60 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Estimated Cost (₹)</span>
                        <span className="font-black text-slate-100">
                          ₹{parseInt(dest.budget_min).toLocaleString()} - ₹{parseInt(dest.budget_max).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {destinations.length === 0 && (
                  <div className="col-span-2 text-center py-16 px-6 text-slate-400 bg-[#101b30] border border-slate-700/70 rounded-3xl flex flex-col items-center justify-center space-y-4">
                    <p className="italic font-bold text-xs">
                      No matching destinations found for current category/search.
                    </p>
                    <Link 
                      to="/plan-trip" 
                      className="inline-block px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md"
                    >
                      Launch AI Planner
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

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
