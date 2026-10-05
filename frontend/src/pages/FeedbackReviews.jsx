import React, { useState, useEffect } from 'react';
import { Star, Send, ShieldCheck, AlertCircle, Compass, MessageSquare, Calendar } from 'lucide-react';
import { tripService } from '../services/api';
import { motion } from 'framer-motion';

export default function FeedbackReviews() {
  const [activeTab, setActiveTab] = useState('reviews'); 
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Destination Review Fields
  const [destId, setDestId] = useState('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Platform Feedback Fields
  const [feedback, setFeedback] = useState('');
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadInitialData = async () => {
    try {
      const destRes = await tripService.getDestinations();
      const list = destRes.destinations || [];
      setDestinations(list);
      if (list.length > 0) {
        setDestId(list[0].id.toString());
      }
      
      const feedRes = await tripService.getMyFeedback();
      setFeedbacksList(feedRes.feedback || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load initial data.');
    } finally {
      setLoading(false);
    }
  };

  const loadReviewsForSelected = async (id) => {
    if (!id) return;
    setLoadingReviews(true);
    try {
      const res = await tripService.getReviews(id);
      setRecentReviews(res.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (destId && activeTab === 'reviews') {
      loadReviewsForSelected(destId);
    }
  }, [destId, activeTab]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!destId || !review.trim()) return;

    setSubmittingReview(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await tripService.postReview({
        destination_id: parseInt(destId),
        rating: parseInt(rating),
        review: review
      });
      setSuccessMsg('Thank you for posting your destination review!');
      setReview('');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadReviewsForSelected(destId);
    } catch (err) {
      setErrorMsg('Failed to post review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSubmittingFeedback(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await tripService.postFeedback(feedback);
      setSuccessMsg('Thank you for your valuable feedback!');
      setFeedback('');
      setTimeout(() => setSuccessMsg(''), 3000);
      
      const feedRes = await tripService.getMyFeedback();
      setFeedbacksList(feedRes.feedback || []);
    } catch (err) {
      setErrorMsg('Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
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
      {/* Header Banner */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-extrabold text-white flex items-center tracking-tight">
          <MessageSquare className="h-6 w-6 text-primary mr-2.5" />
          Feedback & Reviews
        </h1>
        <p className="text-xs text-luxuryMuted font-semibold">
          Share your travel reviews or leave platform suggestions all in one unified portal.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex space-x-2 bg-luxurySurface p-1.5 rounded-luxury w-fit text-xs border border-white/5 font-extrabold uppercase tracking-wider">
        <button
          onClick={() => { setActiveTab('reviews'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`px-5 py-2.5 rounded-luxury transition-all ${
            activeTab === 'reviews' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-luxuryMuted hover:text-white'
          }`}
        >
          Destination Reviews
        </button>
        <button
          onClick={() => { setActiveTab('feedback'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`px-5 py-2.5 rounded-luxury transition-all ${
            activeTab === 'feedback' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-luxuryMuted hover:text-white'
          }`}
        >
          Platform Feedback
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-luxury flex items-center space-x-2 font-bold animate-pulse">
          <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-luxury flex items-center space-x-2 font-bold">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'reviews' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submit Form */}
          <div className="bg-luxurySurface p-8 rounded-luxury border border-white/5 shadow-2xl space-y-6 lg:col-span-1 h-fit">
            <h2 className="font-extrabold text-white text-xs uppercase tracking-widest">
              Write Destination Review
            </h2>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Select Destination</label>
                <select
                  value={destId}
                  onChange={(e) => setDestId(e.target.value)}
                  required
                  className="w-full bg-luxuryBg border border-white/5 rounded-luxury px-4 py-3 text-xs focus:outline-none text-white font-bold"
                >
                  {destinations.map(dest => (
                    <option key={dest.id} value={dest.id} className="bg-[#0b1528] text-white">
                      {dest.name} ({dest.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Star Rating</label>
                <div className="flex items-center space-x-1 py-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className="p-1 focus:outline-none"
                    >
                      <Star 
                        className={`h-6 w-6 transition-colors ${
                          val <= rating 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Review Comments</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share details of your experience, recommendations, hotels, or sightseeing highlights..."
                  rows="5"
                  required
                  className="w-full bg-luxuryBg border border-white/5 rounded-luxury px-4 py-3 text-xs focus:outline-none text-white font-bold"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingReview || !review.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-white font-extrabold text-xs uppercase tracking-wider rounded-luxury shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-1.5 border border-transparent"
              >
                <Send className="h-4 w-4" />
                <span>{submittingReview ? 'Posting...' : 'Submit Review'}</span>
              </button>
            </form>
          </div>

          {/* Existing Reviews of the selected destination */}
          <div className="bg-luxurySurface p-8 rounded-luxury border border-white/5 shadow-2xl space-y-6 lg:col-span-2">
            <h2 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center">
              <Compass className="h-5 w-5 text-accent mr-2" />
              Recent Reviews for Selected Destination
            </h2>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {loadingReviews ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentReviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-luxuryBg/60 rounded-luxury border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-white">{rev.user_name}</span>
                      <span className="text-[9px] text-slate-500 block font-bold">{rev.created_at}</span>
                    </div>
                    <div className="flex items-center space-x-0.5 text-amber-450">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-450" />
                      ))}
                    </div>
                  </div>
                  <p className="text-luxuryMuted leading-relaxed font-semibold">
                    "{rev.review}"
                  </p>
                </div>
              ))}
              {!loadingReviews && recentReviews.length === 0 && (
                <div className="text-center py-20 text-luxuryMuted italic">
                  No reviews yet for this destination. Be the first to submit one!
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feedback Submission */}
          <div className="bg-luxurySurface p-8 rounded-luxury border border-white/5 shadow-2xl space-y-6 lg:col-span-1 h-fit">
            <h2 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center">
              Submit Platform Comments
            </h2>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Your Comments</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your ideas, bug reports, design suggestions..."
                  rows="6"
                  required
                  className="w-full bg-luxuryBg border border-white/5 rounded-luxury px-4 py-3 text-xs focus:outline-none text-white font-bold"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingFeedback || !feedback.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-white font-extrabold text-xs uppercase tracking-wider rounded-luxury shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-1.5 border border-transparent"
              >
                <Send className="h-4 w-4" />
                <span>{submittingFeedback ? 'Sending...' : 'Send Feedback'}</span>
              </button>
            </form>
          </div>

          {/* User's Feedback Logs */}
          <div className="bg-luxurySurface p-8 rounded-luxury border border-white/5 shadow-2xl space-y-6 lg:col-span-2">
            <h2 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center">
              My Past Feedback Logs
            </h2>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 text-xs">
              {feedbacksList.map((f) => (
                <div key={f.id} className="p-4 bg-luxuryBg/60 rounded-luxury border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold border-b border-white/5 pb-2">
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-slate-550" />
                      {f.created_at}
                    </span>
                    <span>ID: {f.id}</span>
                  </div>
                  <p className="text-luxuryMuted font-semibold leading-relaxed">
                    "{f.feedback}"
                  </p>
                </div>
              ))}
              {feedbacksList.length === 0 && (
                <div className="text-center py-20 text-luxuryMuted italic">
                  You haven't submitted any platform feedbacks yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
