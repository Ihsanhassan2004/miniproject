import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Users, MapPin, Search, Filter, Trash2, Eye, X, 
  ArrowUpDown, CheckCircle2, AlertTriangle, Route, Layers, 
  DollarSign, Clock, User, Mail, Phone, Sparkles, ChevronRight, 
  ArrowRight, LayoutGrid, List, ExternalLink, ShieldCheck, 
  Tag, Compass, Check, AlertCircle, RefreshCw, Hotel, Utensils
} from 'lucide-react';
import { adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'planned', 'completed'
  const [durationFilter, setDurationFilter] = useState('all'); // 'all', '1-2', '3-5', '6+'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'cost_desc', 'cost_asc', 'duration_desc', 'date_asc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table'

  // Modal states
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [deleteTargetTrip, setDeleteTargetTrip] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadTrips = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await adminService.getTrips();
      setTrips(res.trips || []);
    } catch (err) {
      console.error('Failed to load trips for admin:', err);
      showToast('error', 'Failed to load saved trips database. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleDeleteTrip = async () => {
    if (!deleteTargetTrip) return;
    setDeleting(true);
    try {
      await adminService.deleteTrip(deleteTargetTrip.id);
      setTrips(prev => prev.filter(t => t.id !== deleteTargetTrip.id));
      if (selectedTrip?.id === deleteTargetTrip.id) {
        setSelectedTrip(null);
      }
      showToast('success', `Saved trip ${deleteTargetTrip.id} (${deleteTargetTrip.destination_name}) deleted successfully.`);
      setDeleteTargetTrip(null);
    } catch (err) {
      console.error('Failed to delete trip:', err);
      showToast('error', err.response?.data?.message || 'Failed to delete trip record.');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = trips.length;
    const completed = trips.filter(t => t.is_completed || t.status === 'completed').length;
    const planned = total - completed;
    const totalCost = trips.reduce((sum, t) => sum + (Number(t.estimated_cost) || 0), 0);
    const avgDuration = total > 0 ? (trips.reduce((sum, t) => sum + (Number(t.duration_days) || 0), 0) / total).toFixed(1) : 0;

    return { total, completed, planned, totalCost, avgDuration };
  }, [trips]);

  // Filter & Sort computation
  const filteredTrips = useMemo(() => {
    return trips
      .filter(trip => {
        // Status filter
        if (statusFilter === 'planned' && (trip.is_completed || trip.status === 'completed')) return false;
        if (statusFilter === 'completed' && (!trip.is_completed && trip.status !== 'completed')) return false;

        // Duration filter
        const days = Number(trip.duration_days) || 0;
        if (durationFilter === '1-2' && (days < 1 || days > 2)) return false;
        if (durationFilter === '3-5' && (days < 3 || days > 5)) return false;
        if (durationFilter === '6+' && days < 6) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const destName = (trip.destination_name || '').toLowerCase();
          const userName = (trip.user_name || '').toLowerCase();
          const userEmail = (trip.user_email || '').toLowerCase();
          const source = (trip.source_location || '').toLowerCase();
          const tripName = (trip.trip_name || '').toLowerCase();
          const city = (trip.destination_city || '').toLowerCase();
          const category = (trip.destination_category || '').toLowerCase();

          return (
            destName.includes(q) ||
            userName.includes(q) ||
            userEmail.includes(q) ||
            source.includes(q) ||
            tripName.includes(q) ||
            city.includes(q) ||
            category.includes(q) ||
            String(trip.id).includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
        if (sortBy === 'cost_desc') {
          return (Number(b.estimated_cost) || 0) - (Number(a.estimated_cost) || 0);
        }
        if (sortBy === 'cost_asc') {
          return (Number(a.estimated_cost) || 0) - (Number(b.estimated_cost) || 0);
        }
        if (sortBy === 'duration_desc') {
          return (Number(b.duration_days) || 0) - (Number(a.duration_days) || 0);
        }
        if (sortBy === 'date_asc') {
          return String(a.travel_date || '').localeCompare(String(b.travel_date || ''));
        }
        return 0;
      });
  }, [trips, searchQuery, statusFilter, durationFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="h-10 w-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          Loading platform trip database...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto text-left pb-16">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-2xl backdrop-blur-md max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="p-1 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors ml-3"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-pink-500/15 rounded-xl border border-pink-500/30 text-pink-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                All Saved Trips & Itineraries
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-cyan-300 border border-blue-500/30 rounded-full text-xs font-black">
                  {trips.length} Total
                </span>
              </h1>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                Centralized master register of all traveler-planned journeys, AI itineraries, and completion states.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadTrips(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Refresh Trips"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <Link
            to="/admin"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5"
          >
            <span>Admin Board</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-slate-900/85 p-5 rounded-2xl border border-slate-800/80 shadow-[0_12px_40px_rgba(2,8,23,0.35)] flex items-center justify-between"
        >
          <div>
            <span className="text-[9px] text-slate-400 block mb-1 font-extrabold uppercase tracking-widest">
              Active / Upcoming
            </span>
            <span className="text-2xl font-black text-cyan-400">{metrics.planned}</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-700 bg-slate-800/80 text-cyan-400">
            <Clock className="h-5 w-5" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-slate-900/85 p-5 rounded-2xl border border-slate-800/80 shadow-[0_12px_40px_rgba(2,8,23,0.35)] flex items-center justify-between"
        >
          <div>
            <span className="text-[9px] text-slate-400 block mb-1 font-extrabold uppercase tracking-widest">
              Completed Trips
            </span>
            <span className="text-2xl font-black text-emerald-400">{metrics.completed}</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-700 bg-slate-800/80 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* Control Bar: Search, Filters, Sort & View Mode */}
      <div className="bg-slate-900/85 p-5 rounded-2xl border border-slate-800/80 shadow-[0_12px_40px_rgba(2,8,23,0.35)] space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by destination, traveler name, email, starting city, or trip ID..."
              className="w-full bg-[#0b1528] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-semibold"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Status Filter */}
            <div className="flex items-center bg-[#0b1528] p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
              {[
                { id: 'all', label: 'All Trips' },
                { id: 'planned', label: 'Upcoming' },
                { id: 'completed', label: 'Completed' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Duration Filter */}
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="bg-[#0b1528] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">All Durations</option>
              <option value="1-2">1 - 2 Days</option>
              <option value="3-5">3 - 5 Days</option>
              <option value="6+">6+ Days</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0b1528] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="cost_desc">Cost: High to Low</option>
              <option value="cost_asc">Cost: Low to High</option>
              <option value="duration_desc">Longest Duration</option>
              <option value="date_asc">Travel Date (Upcoming)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0b1528] p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Structured Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active search summary */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-800/60 pt-3">
          <span>
            Showing <strong className="text-cyan-400">{filteredTrips.length}</strong> of {trips.length} saved trips
          </span>
          {(searchQuery || statusFilter !== 'all' || durationFilter !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDurationFilter('all');
                setSortBy('newest');
              }}
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Grid View or Table View */}
      {filteredTrips.length === 0 ? (
        <div className="bg-slate-900/85 p-12 rounded-2xl border border-slate-800/80 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
            <Compass className="h-8 w-8 text-slate-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">No Saved Trips Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 font-semibold">
              {searchQuery || statusFilter !== 'all' 
                ? 'No trip records match the selected search criteria and filters.'
                : 'No travelers have planned or saved trips in the system yet.'}
            </p>
          </div>
          {(searchQuery || statusFilter !== 'all' || durationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDurationFilter('all');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        
        /* ── GRID CARDS VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const hasSegments = Array.isArray(trip.segments) && trip.segments.length > 1;
            const isCompleted = trip.is_completed || trip.status === 'completed';

            return (
              <motion.div
                key={trip.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-[0_12px_40px_rgba(2,8,23,0.35)] overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  {/* Destination Hero Image Thumbnail */}
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                    <img
                      src={trip.destination_image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"}
                      alt={trip.destination_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-slate-950/40 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black rounded-lg border border-slate-700/80 shadow-md uppercase tracking-wider">
                        Trip {trip.id}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 bg-emerald-500/25 backdrop-blur-md text-emerald-300 border border-emerald-500/50 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-cyan-500/25 backdrop-blur-md text-cyan-300 border border-cyan-500/50 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Clock className="h-3 w-3 text-cyan-400" />
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-3 left-4 right-4 text-left">
                      {trip.destination_category && (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-cyan-300 block mb-0.5 drop-shadow">
                          {trip.destination_category}
                        </span>
                      )}
                      <h3 className="text-lg font-extrabold text-white truncate drop-shadow-md">
                        {trip.multi_destination_title || trip.trip_name || trip.destination_name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    
                    {/* Traveler Account Profile Banner */}
                    <div className="bg-[#0b1528] p-3 rounded-xl border border-slate-800/90 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-inner">
                          {(trip.user_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-extrabold text-white truncate">
                            {trip.user_name || `User ID ${trip.user_id}`}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate flex items-center">
                            <Mail className="h-2.5 w-2.5 mr-1 text-slate-500" />
                            {trip.user_email || 'No email registered'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        ID: {trip.user_id}
                      </span>
                    </div>

                    {/* Multi-destination segments if any */}
                    {hasSegments && (
                      <div className="bg-[#0b1528]/80 p-2.5 rounded-xl border border-cyan-500/20 flex items-center flex-wrap gap-1.5 text-xs font-semibold">
                        <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                          <Route className="h-3 w-3" /> Stops:
                        </span>
                        {trip.segments.map((s, idx) => (
                          <span key={idx} className="bg-[#101b30] px-2 py-0.5 rounded text-[10px] text-slate-200 border border-slate-700/80">
                            {s.destination_name} ({s.days}d)
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metrics 3-Column Strip */}
                    <div className="grid grid-cols-3 gap-2 bg-[#0b1528] p-3 rounded-xl border border-slate-800 text-center text-xs">
                      <div>
                        <span className="text-slate-400 text-[9px] font-extrabold block mb-0.5 uppercase tracking-widest">
                          Duration
                        </span>
                        <strong className="text-white font-extrabold flex items-center justify-center">
                          <Clock className="h-3 w-3 mr-1 text-cyan-400" />
                          {trip.duration_days || 1} Days
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] font-extrabold block mb-0.5 uppercase tracking-widest">
                          Travelers
                        </span>
                        <strong className="text-white font-extrabold flex items-center justify-center">
                          <Users className="h-3 w-3 mr-1 text-blue-400" />
                          {trip.travelers || 1} Pax
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] font-extrabold block mb-0.5 uppercase tracking-widest">
                          Total Cost
                        </span>
                        <strong className="text-cyan-300 font-black">
                          ₹{Math.round(trip.estimated_cost || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Additional Metadata Details */}
                    <div className="space-y-1.5 text-[11px] font-semibold text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-slate-400">
                          <Calendar className="h-3 w-3 mr-1.5 text-pink-400" />
                          Travel Date:
                        </span>
                        <strong className="text-slate-200">{trip.travel_date || 'Planned'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-slate-400">
                          <MapPin className="h-3 w-3 mr-1.5 text-cyan-400" />
                          Origin City:
                        </span>
                        <span className="text-slate-200 truncate max-w-[150px]">{trip.source_location || 'Not Specified'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-slate-400">
                          <DollarSign className="h-3 w-3 mr-1.5 text-amber-400" />
                          Target Budget:
                        </span>
                        <span className="text-slate-300">₹{Math.round(trip.budget || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Interests tags */}
                    {Array.isArray(trip.interests) && trip.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {trip.interests.map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-[#0b1528] text-slate-300 text-[9px] font-bold rounded border border-slate-700/80 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-[#0b1528]/90 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDeleteTargetTrip(trip)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                    title="Delete Saved Trip"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setSelectedTrip(trip)}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Itinerary</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        
        /* ── TABLE VIEW ── */
        <div className="bg-slate-900/85 rounded-2xl border border-slate-800/80 shadow-[0_12px_40px_rgba(2,8,23,0.35)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0b1528] text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-4">Trip ID & Destination</th>
                  <th className="py-4 px-4">Traveler</th>
                  <th className="py-4 px-4">Start Date</th>
                  <th className="py-4 px-4">Duration & Group</th>
                  <th className="py-4 px-4">Total Cost</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredTrips.map((trip) => {
                  const isCompleted = trip.is_completed || trip.status === 'completed';
                  return (
                    <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={trip.destination_image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&q=80"}
                            alt={trip.destination_name}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-700 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&q=80";
                            }}
                          />
                          <div>
                            <div className="font-extrabold text-white text-xs">
                              {trip.multi_destination_title || trip.destination_name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                              <span className="text-cyan-400 font-bold">Trip {trip.id}</span> • {trip.destination_city || trip.source_location || 'Origin'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{trip.user_name || `User ID ${trip.user_id}`}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{trip.user_email || `ID: ${trip.user_id}`}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-300">
                        {trip.travel_date || (trip.created_at ? trip.created_at.split(' ')[0] : 'Planned')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{trip.duration_days || 1} Days</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{trip.travelers || 1} Travelers</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-cyan-300">₹{Math.round(trip.estimated_cost || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">Budget: ₹{Math.round(trip.budget || 0).toLocaleString()}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-cyan-400" /> Upcoming
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-cyan-500/30 transition-all font-bold text-[11px] flex items-center gap-1"
                            title="View Full Itinerary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => setDeleteTargetTrip(trip)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete Trip"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FULL ITINERARY DETAILS MODAL ── */}
      <AnimatePresence>
        {selectedTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedTrip(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#07111f] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col text-left"
            >
              {/* Modal Banner */}
              <div className="relative h-48 sm:h-56 w-full bg-slate-800 overflow-hidden shrink-0">
                <img
                  src={selectedTrip.destination_image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80"}
                  alt={selectedTrip.destination_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-[#07111f]/60 to-transparent" />

                {/* Close Button */}
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white transition-all cursor-pointer z-20"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Top Info Banner */}
                <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 bg-blue-500/30 text-cyan-300 border border-blue-400/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Trip ID: {selectedTrip.id} • {selectedTrip.destination_category || 'Travel Itinerary'}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 drop-shadow-md">
                      {selectedTrip.multi_destination_title || selectedTrip.destination_name}
                    </h2>
                    <p className="text-xs text-slate-300 font-semibold flex items-center mt-0.5">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-cyan-400" />
                      Origin: {selectedTrip.source_location || 'Not Specified'} → Destination: {selectedTrip.destination_name}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedTrip.is_completed || selectedTrip.status === 'completed' ? (
                      <span className="px-3 py-1 bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Completed Journey
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-4 w-4 text-cyan-400" /> Upcoming Planned Trip
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                
                {/* Traveler & Account Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0b1528] p-5 rounded-2xl border border-slate-800">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-cyan-400" /> Traveler Account Info
                    </span>
                    <p className="text-sm font-black text-white">{selectedTrip.user_name || `User ID ${selectedTrip.user_id}`}</p>
                    <p className="text-xs text-slate-300 flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-500" /> {selectedTrip.user_email || 'No email provided'}
                    </p>
                    {selectedTrip.user_phone && (
                      <p className="text-xs text-slate-300 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-500" /> {selectedTrip.user_phone}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-[#101b30] p-2.5 rounded-xl border border-slate-700/80">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Start Date</span>
                      <strong className="text-white font-extrabold text-xs block mt-0.5">
                        {selectedTrip.travel_date || 'Planned'}
                      </strong>
                    </div>
                    <div className="bg-[#101b30] p-2.5 rounded-xl border border-slate-700/80">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Duration</span>
                      <strong className="text-cyan-300 font-extrabold text-xs block mt-0.5">
                        {selectedTrip.duration_days} Days ({selectedTrip.travelers} Pax)
                      </strong>
                    </div>
                    <div className="bg-[#101b30] p-2.5 rounded-xl border border-slate-700/80">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Target Budget</span>
                      <strong className="text-slate-200 font-bold text-xs block mt-0.5">
                        ₹{Math.round(selectedTrip.budget || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="bg-[#101b30] p-2.5 rounded-xl border border-slate-700/80">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Estimated Cost</span>
                      <strong className="text-emerald-400 font-black text-xs block mt-0.5">
                        ₹{Math.round(selectedTrip.estimated_cost || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Multi-destination segments if applicable */}
                {Array.isArray(selectedTrip.segments) && selectedTrip.segments.length > 1 && (
                  <div className="bg-[#0b1528] p-5 rounded-2xl border border-cyan-500/30 space-y-3">
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <Route className="h-4 w-4" /> Multi-Destination Segment Breakdown ({selectedTrip.segments.length} Cities)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedTrip.segments.map((seg, sIdx) => (
                        <div key={sIdx} className="bg-[#101b30] p-3 rounded-xl border border-slate-700 text-left">
                          <div className="text-xs font-bold text-white">{seg.destination_name}</div>
                          <div className="text-[11px] text-cyan-300 font-semibold mt-1">
                            {seg.days} Days • {seg.selected_hotel_name || 'Selected Accommodation'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day-by-Day AI Generated Itinerary */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      Day-by-Day Detailed Itinerary
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">
                      {Array.isArray(selectedTrip.itinerary_text) ? `${selectedTrip.itinerary_text.length} Days Generated` : 'Itinerary Plan'}
                    </span>
                  </div>

                  {Array.isArray(selectedTrip.itinerary_text) && selectedTrip.itinerary_text.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTrip.itinerary_text.map((dayPlan, dIdx) => (
                        <div key={dIdx} className="bg-[#0b1528] rounded-2xl border border-slate-800/90 overflow-hidden">
                          <div className="bg-slate-800/80 px-5 py-3 border-b border-slate-700/80 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-white flex items-center gap-2">
                              <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-[10px] font-black">
                                {dayPlan.day || dIdx + 1}
                              </span>
                              {dayPlan.theme || `Day ${dayPlan.day || dIdx + 1}: Highlights & Exploration`}
                            </span>
                          </div>

                          <div className="p-5 space-y-3">
                            {/* Rich slots rendering if structured */}
                            {Array.isArray(dayPlan.slots) && dayPlan.slots.length > 0 ? (
                              <div className="space-y-2.5">
                                {dayPlan.slots.map((slot, sIdx) => (
                                  <div key={sIdx} className="p-3 bg-[#101b30] rounded-xl border border-slate-700/70 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-[9px] font-bold uppercase">
                                          {slot.period || slot.tag || 'Activity'}
                                        </span>
                                        <span className="font-extrabold text-white">{slot.title}</span>
                                      </div>
                                      <p className="text-slate-300 text-[11px] leading-relaxed">
                                        {slot.description}
                                      </p>
                                    </div>
                                    {slot.time && (
                                      <span className="text-[10px] font-bold text-slate-400 shrink-0 self-start bg-slate-800 px-2 py-1 rounded">
                                        {slot.time}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Standard period slots fallback */
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {dayPlan.morning && (
                                  <div className="p-3 bg-[#101b30] rounded-xl border border-slate-700/70">
                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-1">Morning</span>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">{dayPlan.morning}</p>
                                  </div>
                                )}
                                {dayPlan.lunch && (
                                  <div className="p-3 bg-[#101b30] rounded-xl border border-slate-700/70">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Lunch</span>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">{dayPlan.lunch}</p>
                                  </div>
                                )}
                                {dayPlan.afternoon && (
                                  <div className="p-3 bg-[#101b30] rounded-xl border border-slate-700/70">
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-1">Afternoon</span>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">{dayPlan.afternoon}</p>
                                  </div>
                                )}
                                {dayPlan.evening && (
                                  <div className="p-3 bg-[#101b30] rounded-xl border border-slate-700/70">
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">Evening</span>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">{dayPlan.evening}</p>
                                  </div>
                                )}
                                {dayPlan.dinner && (
                                  <div className="p-3 bg-[#101b30] rounded-xl border border-slate-700/70 sm:col-span-2">
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Dinner</span>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">{dayPlan.dinner}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-[#0b1528] rounded-2xl border border-slate-800 text-center">
                      <p className="text-xs text-slate-400 font-semibold">
                        {typeof selectedTrip.itinerary_text === 'string' && selectedTrip.itinerary_text.trim()
                          ? selectedTrip.itinerary_text
                          : 'General customized itinerary generated for destination.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional System Parameters */}
                <div className="p-4 bg-[#0b1528] rounded-xl border border-slate-800 text-[11px] font-semibold text-slate-400 flex flex-wrap items-center justify-between gap-3">
                  <span>Record Created: <strong className="text-slate-200">{selectedTrip.created_at || 'N/A'}</strong></span>
                  <span>Destination ID: <strong className="text-slate-200">{selectedTrip.destination_id}</strong></span>
                  <span>Traveler ID: <strong className="text-slate-200">{selectedTrip.user_id}</strong></span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 bg-[#0b1528] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => setDeleteTargetTrip(selectedTrip)}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Trip Record</span>
                </button>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/destinations/${selectedTrip.destination_id}`}
                    target="_blank"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                  >
                    <span>View Destination</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
                  >
                    Close Itinerary
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {deleteTargetTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !deleting && setDeleteTargetTrip(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#07111f] border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Delete Trip Itinerary?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <div className="p-4 bg-[#0b1528] rounded-xl border border-slate-800 text-xs space-y-1.5 font-semibold text-slate-300">
                <p>Trip ID: <strong className="text-white">{deleteTargetTrip.id}</strong></p>
                <p>Destination: <strong className="text-white">{deleteTargetTrip.destination_name}</strong></p>
                <p>Traveler: <strong className="text-white">{deleteTargetTrip.user_name || `User ${deleteTargetTrip.user_id}`}</strong></p>
                <p>Planned Date: <strong className="text-slate-200">{deleteTargetTrip.travel_date || 'N/A'}</strong></p>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteTargetTrip(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteTrip}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  {deleting ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Confirm Delete</span>
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
