import React from 'react';
import { Loader2, Navigation, Compass, Sparkles } from 'lucide-react';

export default function LoadingState({ message = 'Evaluating route & computing location-aware transport fares...' }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-[#101b30] p-8 text-center space-y-4 shadow-[0_10px_30px_rgba(2,8,23,0.25)] animate-pulse">
      <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <Navigation className="h-5 w-5 text-cyan-400" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-black text-slate-100">
          Calculating Real Road Route & Transit Fares
        </h4>
        <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
          {message}
        </p>
      </div>
    </div>
  );
}
