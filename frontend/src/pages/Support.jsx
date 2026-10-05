import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  AlertCircle, Clock, ShieldCheck, LifeBuoy, Send, Sparkles,
  Building2, Car, Compass, CreditCard, Filter, CheckCircle2,
  AlertTriangle, Search, MessageSquare, Phone, Mail,
  ArrowRight, ShieldAlert, Bot, Trash2
} from 'lucide-react';
import { tripService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Support() {
  const location = useLocation();

  const [complaints, setComplaints] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Complaint Form Fields
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Accommodation / Stays');
  const [priority, setPriority] = useState('Medium');
  const [selectedTripId, setSelectedTripId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'Accommodation / Stays', icon: Building2 },
    { id: 'Transportation / Transit', icon: Car },
    { id: 'Itinerary & Sightseeing', icon: Compass },
    { id: 'Billing & Payments', icon: CreditCard },
    { id: 'General Inquiries', icon: LifeBuoy }
  ];

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  const loadData = async () => {
    try {
      const [compRes, tripsRes] = await Promise.all([
        tripService.getMyComplaints(),
        tripService.getMyTrips().catch(() => ({ trips: [] }))
      ]);
      setComplaints(compRes.complaints || []);
      setSavedTrips(tripsRes.trips || []);

      // Check if query/state pre-filled any fields
      const params = new URLSearchParams(location.search);
      const qCategory = params.get('category') || location.state?.category;
      const qTripId = params.get('trip_id') || location.state?.trip_id;
      const qSubject = params.get('subject') || location.state?.subject;

      if (qCategory) setCategory(qCategory);
      if (qTripId) setSelectedTripId(qTripId);
      if (qSubject) setSubject(qSubject);
    } catch (err) {
      console.error("Failed to load user support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [location.search, location.state]);

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setErrorMsg('Please enter a ticket title and description.');
      return;
    }

    setSubmitting(true);
    setMsg('');
    setErrorMsg('');
    try {
      await tripService.submitComplaint({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        trip_id: selectedTripId || null
      });
      setMsg('Support ticket submitted successfully. Status: Pending admin review.');
      setSubject('');
      setDescription('');

      const res = await tripService.getMyComplaints();
      setComplaints(res.complaints || []);
    } catch (err) {
      setErrorMsg('Failed to submit support ticket. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this support ticket?")) return;
    setDeletingId(id);
    try {
      await tripService.deleteComplaint(id);
      setComplaints(prev => prev.filter(c => c.id !== id));
      setMsg('Support ticket deleted successfully.');
      setTimeout(() => setMsg(''), 3500);
    } catch (err) {
      setErrorMsg('Failed to delete support ticket. Please try again.');
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'pending':
        return (
          <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center border border-amber-500/20 uppercase tracking-wider">
            <Clock className="h-3 w-3 mr-1 animate-pulse" /> Pending
          </span>
        );
      case 'in process':
      case 'in progress':
      case 'in review':
        return (
          <span className="bg-cyan-500/10 text-cyan-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center border border-cyan-500/20 uppercase tracking-wider">
            <Clock className="h-3 w-3 mr-1" /> In Process
          </span>
        );
      case 'resolved':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center border border-emerald-500/20 uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3 mr-1" /> Resolved
          </span>
        );
      default:
        return (
          <span className="bg-slate-500/10 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase">Urgent</span>;
      case 'High':
        return <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase">High</span>;
      case 'Medium':
        return <span className="text-[10px] font-black text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase">Medium</span>;
      default:
        return <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 uppercase">Low</span>;
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const s = (c.status || '').toLowerCase();
    const matchesFilter = activeFilter === 'All' || 
      (activeFilter === 'In Process' ? ['in process', 'in progress', 'in review'].includes(s) : s === activeFilter.toLowerCase());
    const matchesSearch = !searchTerm.trim() ||
      c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="h-10 w-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans animate-fade-in text-left text-slate-100 pb-12">

      {/* 1. Header Banner */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center tracking-tight">
          <LifeBuoy className="h-7 w-7 text-cyan-400 mr-2.5 animate-pulse" />
          Help & Support Center
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          24/7 Traveler assistance desk: resolve trip issues, get instant AI guidance for overbooked stays and delays, or contact our care team.
        </p>
      </div>

      {/* 2. Quick Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: AI Assistant */}
        <Link
          to="/chat"
          className="bg-[#101b30] p-5 rounded-2xl border border-slate-700/70 hover:border-cyan-500/50 shadow-[0_10px_30px_rgba(2,8,23,0.25)] transition-all group flex items-start space-x-3.5"
        >
          <div className="p-3 bg-gradient-to-br from-blue-600/30 to-cyan-500/30 rounded-xl text-cyan-300 border border-cyan-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors">Aura AI Assistant</h4>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Instant responses on budgets, packing, weather & local transit advice.
            </p>
            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block pt-1">
              Active 24/7 • Instant
            </span>
          </div>
        </Link>

        {/* Card 2: 24/7 Helpline */}
        <div className="bg-[#101b30] p-5 rounded-2xl border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] flex items-start space-x-3.5">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30 shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="font-extrabold text-xs text-slate-100">Traveler Helpline</h4>
            <p className="text-[11px] text-slate-300 font-bold">
              +91 9072165133

            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Toll-free emergency & travel advisory line.
            </p>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block pt-1">
              24/7 Available
            </span>
          </div>
        </div>

        {/* Card 3: Email Support */}
        <div className="bg-[#101b30] p-5 rounded-2xl border border-slate-700/70 shadow-[0_10px_30px_rgba(2,8,23,0.25)] flex items-start space-x-3.5">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30 shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="font-extrabold text-xs text-slate-100">Email Care Desk</h4>
            <p className="text-[11px] text-cyan-300 font-bold truncate">
              support@auratravel.ai
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              For complex booking receipts & refund reviews.
            </p>
            <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider block pt-1">
              Response &lt; 2 Hours
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Support Grid: Submit Ticket + Ticket Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left 5 cols: Support Ticket Form */}
        <div className="lg:col-span-5 bg-[#101b30] p-6 sm:p-7 rounded-[28px] border border-slate-700/70 shadow-[0_20px_50px_rgba(2,8,23,0.35)] space-y-5 h-fit">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
            <h2 className="font-black text-xs uppercase tracking-widest text-slate-200 flex items-center">
              <Sparkles className="h-4.5 w-4.5 text-cyan-400 mr-2 animate-pulse" />
              Support Ticket
            </h2>
            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Instant AI Resolver
            </span>
          </div>

          <AnimatePresence>
            {msg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-2xl flex items-center space-x-2 font-bold"
              >
                <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                <span>{msg}</span>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl flex items-center space-x-2 font-bold"
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleComplaintSubmit} className="space-y-4">

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Issue Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0b1528] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Urgency Priority Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {priorities.map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-1 text-center rounded-xl text-[11px] font-black transition-all border ${isSelected
                        ? p === 'Urgent'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : p === 'High'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-blue-600/20 border-cyan-400 text-cyan-200'
                        : 'bg-[#0b1528] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Linked Trip */}
            {savedTrips.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Link Associated Saved Trip (Optional)
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="w-full bg-[#0b1528] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Standalone / General Issue --</option>
                  {savedTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      Trip to {t.destination_name} (₹{Math.round(t.estimated_cost).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Ticket Title / Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Resort overbooked or transit vehicle delayed"
                required
                className="w-full bg-[#0b1528] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-400 text-slate-100 font-bold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Detailed Description & Context *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide complete details (e.g. mention destination or hotel name for instant alternative suggestions)..."
                rows="4"
                required
                className="w-full bg-[#0b1528] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-400 text-slate-100 font-bold"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
            </button>
          </form>
        </div>

        {/* Right 7 cols: Support Tickets Log & Status Tracker */}
        <div className="lg:col-span-7 bg-[#101b30] p-6 sm:p-7 rounded-[28px] border border-slate-700/70 shadow-[0_20px_50px_rgba(2,8,23,0.35)] space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
            <div>
              <h2 className="font-black text-xs uppercase tracking-widest text-slate-200 flex items-center">
                <Clock className="h-4.5 w-4.5 text-cyan-400 mr-2" />
                Support Ticket Log & Resolution Status
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                Track status, review automated AI suggestions, and view updates.
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 bg-[#0b1528] p-1 rounded-xl border border-slate-700/80">
              {['All', 'Resolved', 'In Process', 'Pending'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${activeFilter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logged support tickets..."
              className="w-full bg-[#0b1528] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Complaints list */}
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {filteredComplaints.map((comp) => {
              const compStatusLower = (comp.status || '').toLowerCase();
              const isResolved = compStatusLower === 'resolved';
              const isInProcess = ['in process', 'in progress', 'in review'].includes(compStatusLower);

              return (
                <div
                  key={comp.id}
                  className="p-5 bg-[#0b1528] rounded-2xl border border-slate-700/70 space-y-3 text-xs transition-all hover:border-slate-600"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-700/60">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-100 text-xs sm:text-sm">{comp.subject}</span>
                        {getPriorityBadge(comp.priority)}
                      </div>
                      <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-semibold">
                        <span>Category: <strong className="text-slate-300">{comp.category || 'General'}</strong></span>
                        <span>●</span>
                        <span>{comp.created_at}</span>
                      </div>
                    </div>

                    {/* Status Badge + Delete Option */}
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(comp.status)}
                      <button
                        onClick={() => handleDeleteComplaint(comp.id)}
                        disabled={deletingId === comp.id}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/20 transition-all disabled:opacity-50"
                        title="Delete this ticket"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-300 font-medium leading-relaxed">
                    {comp.description}
                  </p>

                  {/* AI / Admin Resolution Box */}
                  {comp.admin_reply && (
                    <div className={`p-4 bg-[#07111f] rounded-xl border space-y-1.5 mt-2 ${isResolved
                      ? 'border-emerald-500/30'
                      : isInProcess
                        ? 'border-cyan-500/30'
                        : 'border-amber-500/30'
                      }`}>
                      <div className="flex items-center space-x-1.5">
                        {isResolved ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : isInProcess ? (
                          <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className={`text-[10px] uppercase font-black tracking-wider ${isResolved
                          ? 'text-emerald-300'
                          : isInProcess
                            ? 'text-cyan-300'
                            : 'text-amber-300'
                          }`}>
                          {isResolved
                            ? 'Official Admin Resolution'
                            : isInProcess
                              ? 'Admin Support Update (In Process)'
                              : 'Instant AI Guidance (Pending Admin Review)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200 font-semibold leading-relaxed">
                        {comp.admin_reply}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredComplaints.length === 0 && (
              <div className="text-center py-16 text-slate-400 italic text-xs font-semibold bg-[#0b1528] rounded-2xl border border-slate-800">
                No support tickets matching your selected criteria.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
