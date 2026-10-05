import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, MessageSquare, CheckCircle2, Clock, AlertTriangle, 
  Send, User, Calendar, RefreshCw, Search, Check, X, Trash2,
  Flame, Shield, ArrowUpRight, Filter
} from 'lucide-react';
import { adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for reply modal / drawer
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('Resolved');
  const [replyPriority, setReplyPriority] = useState('Medium');
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadComplaints = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminService.getComplaints();
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error("Failed to load complaints", err);
      setErrorMsg('Failed to load support tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const openReplyModal = (complaint) => {
    setSelectedComplaint(complaint);
    setReplyText(complaint.admin_reply || '');
    const currentStatus = complaint.status || 'Resolved';
    setReplyStatus(['in review', 'in progress'].includes(currentStatus.toLowerCase()) ? 'In Process' : currentStatus);
    setReplyPriority(complaint.priority || 'Medium');
  };

  const closeReplyModal = () => {
    setSelectedComplaint(null);
    setReplyText('');
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmittingReply(true);
    try {
      await adminService.replyComplaint(selectedComplaint.id, {
        admin_reply: replyText.trim(),
        status: replyStatus,
        priority: replyPriority
      });
      setSuccessMsg(`Ticket ${selectedComplaint.id} updated successfully!`);
      setTimeout(() => setSuccessMsg(''), 3500);
      closeReplyModal();
      await loadComplaints();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update ticket reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently delete ticket ${id}?`)) return;
    try {
      await adminService.deleteComplaint(id);
      setSuccessMsg(`Ticket ${id} deleted successfully!`);
      setTimeout(() => setSuccessMsg(''), 3500);
      await loadComplaints();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete ticket.');
      setTimeout(() => setErrorMsg(''), 3500);
    }
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || 'Medium').toLowerCase();
    switch (p) {
      case 'urgent':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 bg-rose-500/15 border border-rose-500/40 text-rose-400 shadow-sm shadow-rose-950/50">
            <Flame className="h-3 w-3 text-rose-400 animate-pulse" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-400">
            <AlertTriangle className="h-3 w-3 text-amber-400" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 bg-blue-500/15 border border-cyan-400/40 text-cyan-300">
            <Shield className="h-3 w-3 text-cyan-400" /> Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 bg-slate-700/40 border border-slate-600/70 text-slate-400">
            <Clock className="h-3 w-3 text-slate-400" /> Low
          </span>
        );
    }
  };

  // Filtered list
  const filteredComplaints = complaints.filter((c) => {
    const s = (c.status || '').toLowerCase();
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'In Process' 
        ? ['in process', 'in review', 'in progress'].includes(s) 
        : s === statusFilter.toLowerCase());

    const matchesPriority =
      priorityFilter === 'ALL' ||
      (c.priority || 'Medium').toLowerCase() === priorityFilter.toLowerCase();

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      !query ||
      (c.subject || '').toLowerCase().includes(query) ||
      (c.description || '').toLowerCase().includes(query) ||
      (c.user_name || '').toLowerCase().includes(query) ||
      (c.user_email || '').toLowerCase().includes(query) ||
      (c.priority || '').toLowerCase().includes(query) ||
      String(c.id).includes(query);

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const totalCount = complaints.length;
  const urgentCount = complaints.filter(c => (c.priority || '').toLowerCase() === 'urgent').length;
  const pendingCount = complaints.filter(c => (c.status || '').toLowerCase() === 'pending').length;
  const inProcessCount = complaints.filter(c => ['in process', 'in review', 'in progress'].includes((c.status || '').toLowerCase())).length;
  const resolvedCount = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;

  if (loading && complaints.length === 0) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="h-8 w-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center tracking-tight">
            <LifeBuoy className="h-7 w-7 text-cyan-400 mr-2.5" />
            Support Tickets & Complaints Management
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Review user disputes by priority level (Urgent, High, Medium, Low), provide resolution advice, and manage support tickets.
          </p>
        </div>
        <button
          onClick={loadComplaints}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#101b30] hover:bg-[#14233f] text-slate-200 border border-slate-700/70 text-xs font-bold rounded-xl transition-all self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center">
          <Check className="h-4 w-4 mr-2 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div 
          onClick={() => { setStatusFilter('ALL'); setPriorityFilter('ALL'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL' && priorityFilter === 'ALL'
              ? 'bg-blue-600/20 border-cyan-400/60 ring-1 ring-cyan-400/30' 
              : 'bg-[#0b1528] border-slate-700/70 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Total Tickets</span>
          <span className="text-2xl font-black text-white mt-1 block">{totalCount}</span>
        </div>

        <div 
          onClick={() => { setPriorityFilter(priorityFilter === 'Urgent' ? 'ALL' : 'Urgent'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            priorityFilter === 'Urgent'
              ? 'bg-rose-500/25 border-rose-400 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/40' 
              : 'bg-[#0b1528] border-slate-700/70 hover:border-rose-500/50'
          }`}
        >
          <span className="text-[10px] text-rose-400 uppercase font-black tracking-widest block flex items-center gap-1">
            <Flame className="h-3 w-3 text-rose-400 animate-pulse" /> Urgent Priority
          </span>
          <span className="text-2xl font-black text-rose-400 mt-1 block">{urgentCount}</span>
        </div>

        <div 
          onClick={() => { setStatusFilter(statusFilter === 'Pending' ? 'ALL' : 'Pending'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Pending' 
              ? 'bg-amber-500/20 border-amber-400/60 ring-1 ring-amber-400/30' 
              : 'bg-[#0b1528] border-slate-700/70 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest block flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{pendingCount}</span>
        </div>

        <div 
          onClick={() => { setStatusFilter(statusFilter === 'In Process' ? 'ALL' : 'In Process'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'In Process' 
              ? 'bg-cyan-500/20 border-cyan-400/60 ring-1 ring-cyan-400/30' 
              : 'bg-[#0b1528] border-slate-700/70 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest block flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> In Process
          </span>
          <span className="text-2xl font-black text-cyan-400 mt-1 block">{inProcessCount}</span>
        </div>

        <div 
          onClick={() => { setStatusFilter(statusFilter === 'Resolved' ? 'ALL' : 'Resolved'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'Resolved' 
              ? 'bg-emerald-500/20 border-emerald-400/60 ring-1 ring-emerald-400/30' 
              : 'bg-[#0b1528] border-slate-700/70 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest block flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{resolvedCount}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by user, subject, priority (urgent, high...)..."
            className="w-full bg-[#0b1528] border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-semibold focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center space-x-1 bg-[#0b1528] p-1 rounded-xl border border-slate-700/70 text-xs font-bold overflow-x-auto">
          <span className="text-[9px] uppercase font-black tracking-wider text-slate-500 px-2 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Priority:
          </span>
          {['ALL', 'Urgent', 'High', 'Medium', 'Low'].map((p) => {
            const isSelected = priorityFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                  isSelected
                    ? p === 'Urgent'
                      ? 'bg-rose-500 text-white font-black shadow-sm'
                      : p === 'High'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : p === 'Medium'
                          ? 'bg-blue-600 text-white font-black shadow-sm'
                          : p === 'Low'
                            ? 'bg-slate-600 text-white font-black shadow-sm'
                            : 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-[#0b1528] p-1 rounded-xl border border-slate-700/70 text-xs font-bold overflow-x-auto">
          <span className="text-[9px] uppercase font-black tracking-wider text-slate-500 px-2">Status:</span>
          {['ALL', 'Pending', 'In Process', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                statusFilter === tab 
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-[#0b1528] border border-slate-700/70 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/70 bg-[#101b30] text-[10px] uppercase tracking-wider text-slate-400 font-black">
                <th className="py-3.5 px-4">Ticket ID</th>
                <th className="py-3.5 px-4">Traveler</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Subject & Description</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {filteredComplaints.map((c) => {
                const statusLower = (c.status || '').toLowerCase();
                const isPending = statusLower === 'pending';
                const isResolved = statusLower === 'resolved';

                return (
                  <tr key={c.id} className="hover:bg-[#101b30]/60 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-300">
                      {c.id}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-400/20 text-cyan-300 flex items-center justify-center font-black text-[11px] shrink-0">
                          {c.user_name ? c.user_name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-100 truncate">{c.user_name || 'Traveler'}</p>
                          <span className="text-[10px] text-slate-400 block truncate">{c.user_email || `User ${c.user_id}`}</span>
                        </div>
                      </div>
                    </td>

                    {/* Priority Column */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getPriorityBadge(c.priority)}
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-bold text-slate-200 truncate">{c.subject}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.description}</p>
                      {c.admin_reply && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 flex items-start space-x-1">
                          <span className="font-bold shrink-0">Admin:</span>
                          <span className="truncate">{c.admin_reply}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-400 font-semibold whitespace-nowrap text-[11px]">
                      {c.created_at ? c.created_at.split(' ')[0] : 'Recent'}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border ${
                        isPending 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                          : isResolved 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {isPending && <Clock className="h-2.5 w-2.5" />}
                        {isResolved && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {!isPending && !isResolved && <AlertTriangle className="h-2.5 w-2.5" />}
                        {['in review', 'in progress'].includes(statusLower) ? 'In Process' : (c.status || 'Pending')}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => openReplyModal(c)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-cyan-300 border border-cyan-400/40 rounded-xl font-bold text-xs transition-all inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>{c.admin_reply ? 'Edit Reply' : 'Resolve / Reply'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteComplaint(c.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-500/20 transition-all inline-flex items-center cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold italic">
                    No support tickets match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#101b30] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-700/70">
                <div>
                  <h3 className="text-base font-black text-white flex items-center">
                    <LifeBuoy className="h-4.5 w-4.5 text-cyan-400 mr-2" />
                    Resolve Ticket {selectedComplaint.id}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    User: {selectedComplaint.user_name || 'Traveler'} ({selectedComplaint.user_email})
                  </p>
                </div>
                <button
                  onClick={closeReplyModal}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#14233f] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User Issue Preview */}
              <div className="p-3 bg-[#0b1528] rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subject</span>
                  {getPriorityBadge(selectedComplaint.priority)}
                </div>
                <p className="text-xs font-bold text-slate-100">{selectedComplaint.subject}</p>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pt-1">User Message</span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>

              {/* Resolution Form */}
              <form onSubmit={handleSendReply} className="space-y-4">
                
                {/* Priority Selector in Modal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Priority Level (Urgent, High, Medium, Low)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Urgent', 'High', 'Medium', 'Low'].map((p) => {
                      const isSelected = replyPriority.toLowerCase() === p.toLowerCase();
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setReplyPriority(p)}
                          className={`py-2 px-1 text-center rounded-xl text-[11px] font-black transition-all border cursor-pointer ${
                            isSelected
                              ? p === 'Urgent'
                                ? 'bg-rose-500/25 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                                : p === 'High'
                                  ? 'bg-amber-500/25 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                                  : p === 'Medium'
                                    ? 'bg-blue-600/25 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50'
                                    : 'bg-slate-700 border-slate-500 text-slate-200 ring-1 ring-slate-500/50'
                              : 'bg-[#0b1528] border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Update Ticket Status
                  </label>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="w-full bg-[#0b1528] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Pending">Pending (Awaiting Action)</option>
                    <option value="In Process">In Process (Investigating / Working)</option>
                    <option value="Resolved">Resolved (Resolution Sent)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Official Admin Reply / Resolution Advice *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Provide clear resolution advice (e.g., alternative hotel confirmation details, refund processing, transit schedule assistance)..."
                    className="w-full bg-[#0b1528] border border-slate-700/70 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 font-medium focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-700/70">
                  <button
                    type="button"
                    onClick={closeReplyModal}
                    className="px-4 py-2 bg-[#0b1528] hover:bg-[#14233f] text-slate-300 border border-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-xl shadow-md transition-all inline-flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submittingReply ? 'Saving...' : 'Send Resolution'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

