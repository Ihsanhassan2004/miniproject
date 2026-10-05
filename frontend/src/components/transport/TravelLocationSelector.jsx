import React from 'react';
import { ArrowUpDown, MapPin, Navigation, Users, Sparkles, Compass } from 'lucide-react';
import LocationSearch from './LocationSearch';

export default function TravelLocationSelector({
  origin,
  destination,
  travelers = 2,
  budget = 10000,
  onOriginChange,
  onDestinationChange,
  onSwap,
  onPickOnMap,
  isLoading = false
}) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-[#101b30] p-4 sm:p-5 shadow-[0_10px_30px_rgba(2,8,23,0.25)] space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/50 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
              Route & Transit Coordinates
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Live location search or click & drag pins directly on the map
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-bold">
          <span className="bg-[#0b1528] border border-slate-700/70 text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Users className="h-3 w-3 text-cyan-400" />
            <span>{travelers} Traveler{travelers > 1 ? 's' : ''}</span>
          </span>
          {budget > 0 && (
            <span className="bg-[#0b1528] border border-slate-700/70 text-emerald-400 px-2.5 py-1 rounded-lg">
              ₹{Number(budget).toLocaleString()} Budget
            </span>
          )}
        </div>
      </div>

      {/* Input columns with responsive Swap button */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Origin */}
        <div className="space-y-1">
          <LocationSearch
            label="From (Origin)"
            icon={MapPin}
            iconColor="text-cyan-400"
            value={(typeof origin === 'object' && origin !== null) ? (origin.name || origin.label || '') : (origin || '')}
            placeholder="Enter origin (e.g. Dubai, London, Kochi, Bengaluru)"
            onSelect={(loc) => onOriginChange && onOriginChange(loc)}
            disabled={isLoading}
          />
        </div>

        {/* Swap button (floating in middle on larger screens, between inputs on mobile) */}
        <div className="flex justify-center md:absolute md:left-1/2 md:top-8 md:-translate-x-1/2 md:-translate-y-1/2 z-20">
          <button
            type="button"
            onClick={onSwap}
            disabled={isLoading}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-[#0b1528] hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-400/60 text-cyan-400 hover:text-cyan-300 shadow-md transition-all group cursor-pointer disabled:opacity-50"
            title="Swap Origin and Destination"
          >
            <ArrowUpDown className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        {/* Destination */}
        <div className="space-y-1">
          <LocationSearch
            label="To (Destination)"
            icon={Navigation}
            iconColor="text-rose-400"
            value={(typeof destination === 'object' && destination !== null) ? (destination.name || destination.label || '') : (destination || '')}
            placeholder="Enter destination (e.g. Varkala, Munnar)"
            onSelect={(loc) => onDestinationChange && onDestinationChange(loc)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Coordinate status feedback bar */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-700/40">
        <div className="flex items-center space-x-3 truncate">
          {(typeof origin === 'object' && origin !== null && origin.latitude) && (
            <span className="truncate">
              📍 Origin: <strong className="text-slate-300">{origin.name}</strong> ({Number(origin.latitude).toFixed(3)}, {Number(origin.longitude).toFixed(3)})
            </span>
          )}
          {(typeof destination === 'object' && destination !== null && destination.latitude) && (
            <span className="truncate">
              🎯 Dest: <strong className="text-slate-300">{destination.name}</strong> ({Number(destination.latitude).toFixed(3)}, {Number(destination.longitude).toFixed(3)})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <span className="text-slate-500 text-[9px] hidden sm:inline">Tip: Drag markers on map to change route</span>
          <button
            type="button"
            onClick={onSwap}
            className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 hover:underline transition-colors cursor-pointer shrink-0"
          >
            <ArrowUpDown className="h-2.5 w-2.5" />
            <span>Swap</span>
          </button>
        </div>
      </div>
    </div>
  );
}
