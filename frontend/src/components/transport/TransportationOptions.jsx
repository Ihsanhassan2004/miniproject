import React, { useState } from 'react';
import { 
  Car, Bus, Train, KeyRound, Bike, Sparkles, Plane,
  ArrowUpDown, Filter, Lightbulb, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Info
} from 'lucide-react';
import TransportationCard from './TransportationCard';

export default function TransportationOptions({
  options = [],
  aiAdvice = null,
  excludedModes = [],
  aiFeasibility = null,
  originName = '',
  selectedId = null,
  onSelect,
  onShowOnMap,
  travelers = 1,
  distanceKm = 0,
  isLoading = false
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [showExcludedDetails, setShowExcludedDetails] = useState(false);

  // Check which categories exist in options
  const isFlightOnly = options.length > 0 && options.every(o => (o.category || o.mode || '').toLowerCase().includes('flight'));
  const hasTrain = options.some(o => (o.category || o.mode || '').toLowerCase().includes('train'));
  const hasBus = options.some(o => (o.category || o.mode || '').toLowerCase().includes('bus'));
  const hasFlight = options.some(o => (o.category || o.mode || '').toLowerCase().includes('flight'));

  // Filter options
  const filteredOptions = options.filter((opt) => {
    if (filterCategory === 'all') return true;
    
    // Flight-only route sub-filters
    if (isFlightOnly) {
      if (filterCategory === 'nonstop') return (opt.stops || opt.flight_details?.stops || '').toLowerCase().includes('non-stop') || (opt.transport_type || '').toLowerCase().includes('non-stop') || (opt.badge || '').toLowerCase().includes('best overall');
      if (filterCategory === 'budget') return (opt.badge || '').toLowerCase().includes('lowest') || (opt.cabin_class || '').toLowerCase().includes('budget') || (opt.airline || '').toLowerCase().includes('express') || (opt.airline || '').toLowerCase().includes('scoot');
      if (filterCategory === 'business') return (opt.cabin_class || '').toLowerCase().includes('business') || (opt.transport_type || '').toLowerCase().includes('business') || (opt.badge || '').toLowerCase().includes('luxury');
      return true;
    }

    // Standard multi-modal route filters
    const cat = String(opt.category || opt.mode || '').toLowerCase();
    if (filterCategory === 'cab' && (cat.includes('cab') || cat.includes('taxi'))) return true;
    if (filterCategory === 'transit' && (cat.includes('bus') || cat.includes('train') || cat.includes('metro'))) return true;
    if (filterCategory === 'self' && (cat.includes('self') || cat.includes('drive') || cat.includes('bike') || cat.includes('scooter') || cat.includes('cycle'))) return true;
    if (filterCategory === 'flight' && cat.includes('flight')) return true;
    return true;
  });

  // Sort options
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (sortBy === 'cheapest') {
      return (a.total_fare || 0) - (b.total_fare || 0);
    }
    if (sortBy === 'fastest') {
      return (a.duration_minutes || 0) - (b.duration_minutes || 0);
    }
    return (b.score || 0) - (a.score || 0);
  });

  return (
    <div className="space-y-4">
      {/* AI Advice Banner (Personalized Gemini Insights) */}
      {aiAdvice && aiAdvice.recommendation && (
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-blue-950/60 via-[#101b30] to-cyan-950/40 p-4 shadow-[0_10px_30px_rgba(6,182,212,0.15)] space-y-2.5 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-200">
                AI Personalized Transit Guidance
              </span>
            </div>

            {aiAdvice.is_ai_generated && (
              <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                Gemini AI Tailored
              </span>
            )}
          </div>

          <div className="space-y-1 relative z-10">
            <div className="text-xs text-slate-200 font-semibold">
              <span className="text-cyan-300 font-black">Top Pick: {aiAdvice.recommendation.transport_type || aiAdvice.recommendation.mode} ➔ </span>
              {aiAdvice.recommendation.reason}
            </div>

            {aiAdvice.travel_tip && (
              <p className="text-[11px] text-amber-300/90 font-medium flex items-center pt-0.5">
                <Lightbulb className="h-3 w-3 mr-1 shrink-0 text-amber-400" />
                <span className="truncate">{aiAdvice.travel_tip}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Origin Transit Feasibility Notice (e.g. Wayanad has no train or International Cross-Border) */}
      {excludedModes && excludedModes.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-[#101b30] to-slate-900/50 p-3.5 shadow-sm space-y-2 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-1">
                AI Transit Feasibility Verified
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowExcludedDetails(prev => !prev)}
              className="text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 transition-all"
            >
              <Info className="h-2.5 w-2.5" />
              <span>{showExcludedDetails ? 'Hide Details' : `${excludedModes.length} Mode(s) Omitted`}</span>
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5">
            {excludedModes.map((ex, i) => (
              <div key={i} className="flex items-start gap-2 bg-black/20 p-2 rounded-xl border border-amber-500/20 text-[11px]">
                <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 uppercase">
                  {ex.mode === 'train' ? 'No Train Station' : (ex.mode === 'road' ? 'Road Transit Infeasible' : 'Unavailable')}
                </span>
                <span className="text-slate-200 font-medium">
                  {ex.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#0b1528] border border-slate-700/70 text-xs">
        {/* Category / Flight Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isFlightOnly ? (
            <>
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                  filterCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                }`}
              >
                <Plane className="h-3 w-3 rotate-45" />
                <span>All Flights ({options.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('nonstop')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                  filterCategory === 'nonstop'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                }`}
              >
                Direct / Non-Stop
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('budget')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                  filterCategory === 'budget'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                }`}
              >
                Budget / Low Fare
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('business')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                  filterCategory === 'business'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                }`}
              >
                Business Class
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                  filterCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                }`}
              >
                All Modes ({options.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('cab')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                  filterCategory === 'cab'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                }`}
              >
                <Car className="h-3 w-3" />
                <span>Cab / Taxi</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('transit')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                  filterCategory === 'transit'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                }`}
              >
                {hasTrain ? <Train className="h-3 w-3" /> : <Bus className="h-3 w-3" />}
                <span>{hasTrain && hasBus ? 'Bus & Train' : (hasTrain ? 'Train' : 'Intercity Bus')}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('self')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                  filterCategory === 'self'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                }`}
              >
                <KeyRound className="h-3 w-3" />
                <span>Self-Drive / Bike</span>
              </button>

              {hasFlight && (
                <button
                  type="button"
                  onClick={() => setFilterCategory('flight')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                    filterCategory === 'flight'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-[#101b30] text-slate-300 hover:text-white border border-slate-700/80 hover:bg-[#14233f]'
                  }`}
                >
                  <Plane className="h-3 w-3" />
                  <span>Flight</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
            Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#101b30] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="score">AI Match Score</option>
            <option value="cheapest">Lowest Fare</option>
            <option value="fastest">Fastest Duration</option>
          </select>
        </div>
      </div>

      {/* Cards Grid: 1 column full-width for spacious ticket-style cards */}
      <div className="grid grid-cols-1 gap-4">
        {sortedOptions.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <TransportationCard
              key={opt.id}
              option={opt}
              isSelected={isSelected}
              onSelect={onSelect}
              onShowOnMap={onShowOnMap}
              travelers={travelers}
              distanceKm={distanceKm}
            />
          );
        })}
      </div>

      {sortedOptions.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-[#0b1528] border border-slate-700/70 text-slate-400 space-y-2">
          <p className="text-xs font-bold">No transportation modes found in this filter.</p>
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className="text-xs text-cyan-400 hover:underline font-bold"
          >
            Show all transportation modes
          </button>
        </div>
      )}
    </div>
  );
}

