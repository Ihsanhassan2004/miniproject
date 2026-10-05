import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, Calendar, Users, MapPin, ArrowRight, 
  Hourglass, Trash2, AlertTriangle, X, CheckCircle2, Sparkles,
  Layers, Route, Hotel, Utensils, Camera, Navigation
} from 'lucide-react';
import { tripService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function SavedTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingDateTrip, setEditingDateTrip] = useState(null);
  const [newTripDate, setNewTripDate] = useState('');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [completingTripId, setCompletingTripId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const res = await tripService.getMyTrips();
      setTrips(res.trips || []);
    } catch (err) {
      console.error("Error loading user trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompleteTrip = async (trip) => {
    setCompletingTripId(trip.id);
    const targetStatus = trip.is_completed ? 'planned' : 'completed';
    try {
      const res = await tripService.completeTrip(trip.id, targetStatus);
      setTrips(prev => prev.map(t => {
        if (t.id === trip.id) {
          return {
            ...t,
            status: res.status || targetStatus,
            is_completed: res.is_completed !== undefined ? res.is_completed : (targetStatus === 'completed'),
            travel_date: res.travel_date || t.travel_date
          };
        }
        return t;
      }));
      setNotification({
        type: 'success',
        message: targetStatus === 'completed' 
          ? `🎉 Trip to ${trip.destination_name} marked as completed! You can now get AI recommendations & write travel diaries for this destination.`
          : `Trip to ${trip.destination_name} status updated to Planned.`
      });
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update trip completion status. Please try again.'
      });
    } finally {
      setCompletingTripId(null);
    }
  };

  const confirmDeleteTrip = (trip) => {
    setDeletingTrip(trip);
  };

  const handleDeleteTrip = async () => {
    if (!deletingTrip) return;
    setIsDeleting(true);
    try {
      await tripService.deleteTrip(deletingTrip.id);
      setTrips(prev => prev.filter(t => t.id !== deletingTrip.id));
      setNotification({
        type: 'success',
        message: `Trip to ${deletingTrip.destination_name} has been deleted successfully.`
      });
      setDeletingTrip(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete saved trip. Please try again.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateTripDate = async () => {
    if (!editingDateTrip || !newTripDate) return;
    setIsUpdatingDate(true);
    try {
      const res = await tripService.updateTripDate(editingDateTrip.id, newTripDate);
      setTrips(prev => prev.map(t => t.id === editingDateTrip.id ? { ...t, travel_date: res.travel_date || newTripDate } : t));
      setNotification({
        type: 'success',
        message: `Trip start date to ${editingDateTrip.destination_name} updated to ${res.travel_date || newTripDate} successfully!`
      });
      setEditingDateTrip(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update trip start date. Please check date format.'
      });
    } finally {
      setIsUpdatingDate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="h-8 w-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans animate-fade-in text-left">
      
      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2 border-b border-slate-700/60 pb-6">
        <h1 className="text-2xl font-black text-slate-100 flex items-center tracking-tight">
          <Compass className="h-6 w-6 text-cyan-400 mr-2.5 animate-spin-slow" />
          Planned Trips History
        </h1>
        <p className="text-xs text-slate-400 font-semibold">
          Review details of your saved itineraries, personalized stops, hotel/dining bookings, and road routes.
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20 bg-[#101b30] border border-slate-700/70 rounded-luxury shadow-2xl space-y-5 max-w-lg mx-auto p-8">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-widest">No Planned Trips Saved</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed font-semibold">
            You haven't locked in any travel itineraries yet. Use the planner to build personalized multi-destination suggestions!
          </p>
          <Link
            to="/plan-trip"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Plan Your Trip Now</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => {
            const hasSegments = trip.segments && Array.isArray(trip.segments) && trip.segments.length > 1;
            const tripTitle = trip.trip_name || (hasSegments ? trip.multi_destination_title || trip.segments.map(s => s.destination_name).join(' & ') : `Trip to ${trip.destination_name}`);

            return (
              <motion.div 
                key={trip.id} 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#101b30] border border-slate-700/70 rounded-luxury shadow-[0_10px_30px_rgba(2,8,23,0.25)] overflow-hidden flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 relative group"
              >
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-white text-base truncate">
                          {tripTitle}
                        </h3>
                        {hasSegments && (
                          <span className="px-2.5 py-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Layers className="h-3 w-3 text-cyan-400" />
                            Twin-City ({trip.segments.length} Stops)
                          </span>
                        )}
                        {trip.is_completed ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-cyan-400" />
                            Upcoming
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-xs font-semibold flex items-center mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-cyan-400 shrink-0 animate-pulse" /> Source: {trip.source_location}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDateTrip(trip);
                          setNewTripDate(trip.travel_date || (trip.created_at ? trip.created_at.split(' ')[0] : ''));
                        }}
                        className="text-[10px] text-slate-300 hover:text-cyan-300 font-bold px-2.5 py-1 bg-[#0b1528] hover:bg-cyan-950/40 rounded-lg border border-slate-700/70 hover:border-cyan-500/40 transition-all flex items-center cursor-pointer shadow-sm group/btn"
                        title="Click to change or reschedule trip start date"
                      >
                        <Calendar className="h-3 w-3 mr-1.5 text-cyan-400 shrink-0 group-hover/btn:scale-110 transition-transform" />
                        <span>Starts: {trip.travel_date || (trip.created_at ? trip.created_at.split(' ')[0] : 'Planned')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteTrip(trip)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                        title="Delete trip"
                        aria-label="Delete trip"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-destination segment breakdown pills */}
                  {hasSegments && (
                    <div className="bg-[#0b1528]/80 p-3 rounded-xl border border-cyan-500/20 space-y-2">
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Route className="h-3.5 w-3.5 text-cyan-400" />
                        Split Route Breakdown
                      </span>
                      <div className="flex items-center flex-wrap gap-2">
                        {trip.segments.map((seg, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <div className="bg-[#101b30] px-3 py-1.5 rounded-lg border border-slate-700/80 text-left">
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                                {seg.destination_name}
                              </div>
                              <div className="text-[10px] text-cyan-300 font-semibold mt-0.5">
                                {seg.days} Days • {seg.selected_hotel_name ? 'Hotel Set' : 'Auto Hotel'}
                              </div>
                            </div>
                            {sIdx < trip.segments.length - 1 && (
                              <ArrowRight className="h-3.5 w-3.5 text-cyan-400/60 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 bg-[#0b1528] p-4 rounded-xl border border-slate-700/70 text-center text-xs font-semibold">
                    <div>
                      <span className="text-slate-400 text-[9px] font-extrabold block mb-1 uppercase tracking-widest">Duration</span>
                      <strong className="text-white flex items-center justify-center font-extrabold">
                        <Hourglass className="h-3.5 w-3.5 mr-1 text-cyan-400" /> {trip.duration_days} Days
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] font-extrabold block mb-1 uppercase tracking-widest">Travelers</span>
                      <strong className="text-white flex items-center justify-center font-extrabold">
                        <Users className="h-3.5 w-3.5 mr-1 text-blue-400" /> {trip.travelers} Pax
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] font-extrabold block mb-1 uppercase tracking-widest">Total Cost</span>
                      <strong className="text-cyan-300 flex items-center justify-center font-black">
                        ₹{Math.round(trip.estimated_cost).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {trip.interests && Array.isArray(trip.interests) && trip.interests.map((int, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#0b1528] text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700/70 uppercase tracking-wider capitalize">
                        {int}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 bg-[#0b1528]/80 border-t border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 font-bold">
                    Target Budget: <span className="text-slate-200">₹{Math.round(trip.budget).toLocaleString()}</span>
                  </span>
                
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {/* Complete Trip Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCompleteTrip(trip)}
                    disabled={completingTripId === trip.id}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm hover:scale-102 ${
                      trip.is_completed
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 text-emerald-300 border border-emerald-500/40'
                    }`}
                    title={trip.is_completed ? "Click to set back to planned" : "Mark this trip as completed"}
                  >
                    {completingTripId === trip.id ? (
                      <span className="h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <CheckCircle2 className={`h-4 w-4 ${trip.is_completed ? 'text-emerald-400' : 'text-emerald-300'}`} />
                    )}
                    <span>{trip.is_completed ? 'Completed ✓' : 'Complete Trip'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => confirmDeleteTrip(trip)}
                    className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-700/70 hover:border-rose-500/30 transition-all text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    title="Delete Saved Trip"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  <Link
                    to={`/trips/${trip.id}`}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-1"
                  >
                    <span>View Itinerary</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}

      {/* Reschedule Date Modal */}
      <AnimatePresence>
        {editingDateTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#101b30] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-start justify-between border-b border-slate-700/60 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100">
                      Reschedule Trip Date
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Trip to {editingDateTrip.destination_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDateTrip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Select New Trip Start Date:
                </label>
                <input
                  type="date"
                  value={newTripDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewTripDate(e.target.value)}
                  className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-400 font-medium">
                  The date that your trip starts will be updated across your itineraries and travel history.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end items-center space-x-2.5">
                <button
                  type="button"
                  disabled={isUpdatingDate}
                  onClick={() => setEditingDateTrip(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdatingDate || !newTripDate}
                  onClick={handleUpdateTripDate}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingDate ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Update Date</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
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
                    Are you sure you want to delete your saved trip to <strong className="text-slate-200">{deletingTrip.destination_name}</strong>? This action will remove the saved itinerary permanently.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end items-center space-x-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingTrip(null)}
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

