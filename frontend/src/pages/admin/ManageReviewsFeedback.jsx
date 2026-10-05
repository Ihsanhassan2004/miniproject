import React, { useState, useEffect } from 'react';
import { ClipboardList, MessageSquare, Trash2, Star, AlertCircle, Calendar, User } from 'lucide-react';
import { adminService } from '../../services/api';
import { motion } from 'framer-motion';

export default function ManageReviewsFeedback() {
  const [activeTab, setActiveTab] = useState('reviews'); 
  const [reviews, setReviews] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const revRes = await adminService.getReviews();
      setReviews(revRes.reviews || []);

      const feedRes = await adminService.getFeedback();
      setFeedbacks(feedRes.feedback || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load reviews and feedback logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await adminService.deleteReview(id);
      setSuccessMsg('Review deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      
      const revRes = await adminService.getReviews();
      setReviews(revRes.reviews || []);
    } catch (err) {
      setErrorMsg('Failed to delete review.');
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback log?')) return;
    try {
      await adminService.deleteFeedback(id);
      setSuccessMsg('Feedback log deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      
      const feedRes = await adminService.getFeedback();
      setFeedbacks(feedRes.feedback || []);
    } catch (err) {
      setErrorMsg('Failed to delete feedback log.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 bg-luxuryBg">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans animate-fade-in text-left">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-extrabold text-white flex items-center tracking-tight">
          <ClipboardList className="h-8 w-8 text-primary mr-2.5" />
          Review & Feedback Management
        </h1>
        <p className="text-xs text-luxuryMuted font-semibold">
          Moderate destination reviews and view traveler comments/feedback left on the platform.
        </p>
      </div>

      {successMsg && <p className="text-xs text-primary font-bold animate-pulse">{successMsg}</p>}
      {errorMsg && (
        <p className="text-xs text-danger font-bold flex items-center">
          <AlertCircle className="h-3.5 w-3.5 mr-1" /> {errorMsg}
        </p>
      )}

      {/* Tabs Switcher */}
      <div className="flex space-x-2 bg-luxurySurface p-1.5 rounded-luxury w-fit text-xs border border-white/5 font-extrabold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-2.5 rounded-luxury transition-all ${
            activeTab === 'reviews' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-luxuryMuted hover:text-white'
          }`}
        >
          Destination Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-5 py-2.5 rounded-luxury transition-all ${
            activeTab === 'feedback' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-luxuryMuted hover:text-white'
          }`}
        >
          Platform Feedback ({feedbacks.length})
        </button>
      </div>

      {activeTab === 'reviews' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev, index) => (
            <div 
              key={rev.id} 
              className="bg-luxurySurface border border-white/5 rounded-luxury p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-white">Review {index + 1} | {rev.user_name}</h4>
                      <span className="text-[9px] text-slate-500 font-bold block">{rev.created_at}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500 space-x-0.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>

                <div className="text-xs text-luxuryMuted font-semibold leading-relaxed">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Target Destination: {rev.destination_name}</span>
                  <p className="bg-luxuryBg p-3.5 rounded-luxury border border-white/5 text-slate-200">
                    "{rev.review}"
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-extrabold uppercase tracking-wider rounded-luxury transition-all flex items-center space-x-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Review</span>
                </button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-luxurySurface border border-white/5 rounded-luxury text-luxuryMuted italic">
              No traveler reviews registered.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedbacks.map((feed, index) => (
            <div 
              key={feed.id} 
              className="bg-luxurySurface border border-white/5 rounded-luxury p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex items-center space-x-2 font-extrabold text-white text-xs">
                    <MessageSquare className="h-4 w-4 text-accent" />
                    <span>Feedback {index + 1} | {feed.user_name}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {feed.created_at}
                  </span>
                </div>
                <p className="text-xs text-luxuryMuted leading-relaxed font-semibold bg-luxuryBg p-3.5 rounded-luxury border border-white/5">
                  "{feed.feedback}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => handleDeleteFeedback(feed.id)}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-extrabold uppercase tracking-wider rounded-luxury transition-all flex items-center space-x-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Feedback</span>
                </button>
              </div>
            </div>
          ))}
          {feedbacks.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-luxurySurface border border-white/5 rounded-luxury text-luxuryMuted italic">
              No platform feedback logs found.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
