import React from 'react';
import { Users, Receipt, Star, Zap, Sliders, Shield } from 'lucide-react';

export default function TripPreferences({
  travelers = 2,
  budget = 10000,
  comfort = 'Comfortable',
  style = 'balanced',
  onTravelersChange,
  onBudgetChange,
  onComfortChange,
  onStyleChange
}) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-[#101b30] p-4 sm:p-5 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
        <span className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center">
          <Sliders className="h-3.5 w-3.5 text-cyan-400 mr-1.5" />
          AI Scoring & Personalization Preferences
        </span>
        <span className="text-[10px] text-slate-400 font-bold">
          Dynamic MCDA Weights
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        {/* Travelers */}
        <div className="space-y-1.5 bg-[#0b1528] p-3 rounded-xl border border-slate-700/70">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center">
            <Users className="h-3 w-3 mr-1 text-cyan-400" /> Travelers
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onTravelersChange && onTravelersChange(Math.max(1, travelers - 1))}
              className="h-7 w-7 rounded-lg bg-[#101b30] hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className="flex-1 text-center font-black text-slate-100 text-sm">
              {travelers}
            </span>
            <button
              type="button"
              onClick={() => onTravelersChange && onTravelersChange(travelers + 1)}
              className="h-7 w-7 rounded-lg bg-[#101b30] hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Comfort Priority */}
        <div className="space-y-1.5 bg-[#0b1528] p-3 rounded-xl border border-slate-700/70">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center">
            <Star className="h-3 w-3 mr-1 text-amber-400" /> Comfort Priority
          </label>
          <select
            value={comfort}
            onChange={(e) => onComfortChange && onComfortChange(e.target.value)}
            className="w-full bg-[#101b30] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
          >
            <option value="Budget Friendly">Budget Friendly</option>
            <option value="Comfortable">Comfortable (Balanced)</option>
            <option value="Premium Comfort">Premium Comfort</option>
          </select>
        </div>

        {/* Priority Style */}
        <div className="space-y-1.5 bg-[#0b1528] p-3 rounded-xl border border-slate-700/70">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center">
            <Zap className="h-3 w-3 mr-1 text-cyan-400" /> Recommendation Goal
          </label>
          <select
            value={style}
            onChange={(e) => onStyleChange && onStyleChange(e.target.value)}
            className="w-full bg-[#101b30] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
          >
            <option value="balanced">Best Balanced Match</option>
            <option value="cheapest">Cheapest / Most Economical</option>
            <option value="fastest">Fastest Travel Duration</option>
            <option value="comfort">Highest Comfort</option>
          </select>
        </div>
      </div>
    </div>
  );
}
