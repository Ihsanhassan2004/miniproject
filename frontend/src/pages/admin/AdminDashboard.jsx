import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Map, Calendar, AlertCircle, Star, 
  MessageSquare, ShieldCheck, CornerDownRight, Send 
} from 'lucide-react';
import { adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Exporting custom hook
export function useAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        analyticsRes,
        complaintsRes,
        feedbackRes,
        chatLogsRes
      ] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getComplaints(),
        adminService.getFeedback(),
        adminService.getChatLogs()
      ]);

      setStats(analyticsRes.stats);
      setDistribution(analyticsRes.dest_distribution || {});
      setComplaints(complaintsRes.complaints || []);
      setFeedbacks(feedbackRes.feedback || []);
      setChatLogs((chatLogsRes.logs || []).slice(0, 10));
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const replyToComplaint = async (complaintId, adminReply, status = 'Resolved') => {
    try {
      await adminService.replyComplaint(complaintId, {
        admin_reply: adminReply,
        status
      });
      await loadData();
      return true;
    } catch (error) {
      console.error('Failed to reply to complaint:', error);
      return false;
    }
  };

  return {
    loading,
    stats,
    distribution,
    complaints,
    feedbacks,
    chatLogs,
    loadData,
    replyToComplaint
  };
}

// Default export rendering the dashboard component using the hook
export default function AdminDashboard() {
  const {
    loading,
    stats,
    distribution,
    complaints,
    feedbacks,
    replyToComplaint
  } = useAdminDashboard();

  // Reply states
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('Resolved');
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleReplySubmit = async (e, id) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    const success = await replyToComplaint(id, replyText, replyStatus);
    if (success) {
      setReplyText('');
      setReplyingToId(null);
    }
    setSubmittingReply(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 bg-luxuryBg">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto text-left bg-[#07111f] rounded-3xl p-2 sm:p-6">
      
      {/* Welcome Title */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 border-b border-slate-800 pb-6"
      >
        <h1 className="text-2xl font-extrabold text-white flex items-center tracking-tight">
          <ShieldCheck className="h-6 w-6 text-primary mr-2.5" />
          Administration Command Board
        </h1>
        <p className="text-luxuryMuted text-xs font-semibold">
          Monitor system metrics, update available hotel capacities, and resolve traveler issues.
        </p>
      </motion.div>

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Registered Users', value: stats.users, icon: Users, color: 'text-indigo-400', to: '/admin/users' },
            { label: 'Destinations', value: stats.destinations, icon: Map, color: 'text-purple-400', to: '/admin/destinations' },
            { label: 'Trips Planned', value: stats.trips_planned, icon: Calendar, color: 'text-pink-400', to: '/admin/trips' },
            { label: 'Average Review', value: `${stats.average_rating} ⭐`, icon: Star, color: 'text-amber-400', to: '/admin/reviews-feedback' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Link key={idx} to={stat.to} className="block group">
                <motion.div 
                  whileHover={{ y: -3 }}
                  className="bg-slate-900/85 p-5 rounded-2xl border border-slate-800 group-hover:border-primary/40 shadow-[0_12px_40px_rgba(2,8,23,0.35)] flex items-center justify-between transition-all"
                >
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1 font-extrabold uppercase tracking-widest group-hover:text-primary transition-colors">{stat.label}</span>
                    <span className="text-xl font-extrabold text-slate-100">{stat.value}</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 group-hover:bg-primary/10 text-slate-300 transition-colors">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Feedback row */}
      <div className="bg-slate-900/85 p-6 rounded-2xl border border-slate-800 shadow-[0_12px_40px_rgba(2,8,23,0.35)] space-y-5">
        <h3 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center">
          <MessageSquare className="h-4.5 w-4.5 text-primary mr-1.5" />
          General Platform Feedback
        </h3>
        <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
          {feedbacks.map((f) => (
            <div key={f.id} className="p-4 bg-slate-800/70 rounded-xl border border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between font-extrabold text-slate-100">
                <span>{f.user_name}</span>
                <span className="text-[9px] text-slate-400">{f.created_at.split(' ')[0]}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-semibold">"{f.feedback}"</p>
            </div>
          ))}
          {feedbacks.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No traveler feedbacks registered yet.</p>
          )}
        </div>
      </div>

      {/* Complaints Resolution Board */}
      <div className="bg-slate-900/85 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-[0_12px_40px_rgba(2,8,23,0.35)] space-y-6">
        <h3 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center">
          <AlertCircle className="h-4.5 w-4.5 text-rose-500 mr-2" />
          Traveler Complaints Board
        </h3>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {complaints.map((c) => (
            <div key={c.id} className="p-5 bg-slate-800/70 rounded-xl border border-slate-700 text-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white block text-sm">Complaint {c.id}: {c.subject}</span>
                    {c.priority && (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        c.priority.toLowerCase() === 'urgent'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : c.priority.toLowerCase() === 'high'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : c.priority.toLowerCase() === 'medium'
                              ? 'bg-blue-500/20 text-cyan-300 border border-blue-500/30'
                              : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}>
                        {c.priority}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-1 block">
                    By {c.user_name} | Status: <strong className={c.status === 'Resolved' ? 'text-emerald-400' : 'text-amber-400'}>
                      {['in review', 'in progress'].includes((c.status || '').toLowerCase()) ? 'In Process' : c.status}
                    </strong>
                  </span>
                </div>
                <span className="text-[9px] text-slate-400">{c.created_at ? c.created_at.split(' ')[0] : 'Recent'}</span>
              </div>
              <p className="text-slate-300 font-semibold bg-slate-900/70 p-3 rounded-lg border border-slate-700">"{c.description || c.message || c.subject}"</p>
              
              {c.admin_reply && (
                <div className="pl-4 border-l-2 border-blue-400 text-[11px] text-slate-300 space-y-1 py-1">
                  <span className="font-bold text-slate-300 flex items-center">
                    <CornerDownRight className="h-3 w-3 mr-1" />
                    Admin Resolution:
                  </span>
                  <p className="italic">"{c.admin_reply}"</p>
                </div>
              )}

              {c.status !== 'Resolved' && (
                <div className="pt-2">
                  {replyingToId === c.id ? (
                    <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type resolution guidelines..."
                        required
                        className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 text-slate-100 font-bold transition-all"
                      />
                      <div className="flex justify-between items-center">
                        <select
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value)}
                          className="text-[10px] bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-100 font-bold"
                        >
                          <option value="Resolved">Mark Resolved</option>
                          <option value="In Process">Set In Process</option>
                        </select>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 text-slate-300 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingReply}
                            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white rounded-lg font-bold flex items-center space-x-1 border border-transparent"
                          >
                            <span>Send</span>
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyingToId(c.id);
                        setReplyText('');
                      }}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-blue-400 text-blue-300 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all"
                    >
                      Post Resolution Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {complaints.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No traveler complaints registered.</p>
          )}
        </div>
      </div>

    </div>
  );
}