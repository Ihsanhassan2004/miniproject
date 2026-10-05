import React from 'react';
import { Navigation, Clock, MapPin, Shield, Zap, Sparkles } from 'lucide-react';

export default function RouteSummary({
  originName,
  destinationName,
  distanceKm,
  durationFormatted,
  dataSource = 'OpenRouteService',
  travelers = 1,
  className = ''
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0b1528] border border-slate-700/70 text-xs ${className}`}>
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
          <Navigation className="h-4 w-4" />
        </div>
        <div className="truncate">
          <div className="flex items-center space-x-1.5 font-black text-slate-100 truncate">
            <span>{originName || 'Origin'}</span>
            <span className="text-cyan-400">➔</span>
            <span>{destinationName || 'Destination'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">
            Actual Road Routing for {travelers} Traveler{travelers > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-bold">
        {distanceKm !== undefined && (
          <span className="inline-flex items-center text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
            🛣️ {distanceKm} km
          </span>
        )}

        {durationFormatted && (
          <span className="inline-flex items-center text-[11px] text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            <Clock className="h-3 w-3 mr-1" />
            ~{durationFormatted} by road
          </span>
        )}

        <span className="text-[10px] text-slate-400 bg-[#101b30] border border-slate-700/60 px-2 py-1 rounded-lg hidden sm:inline-block">
          Provider: {dataSource}
        </span>
      </div>
    </div>
  );
}
