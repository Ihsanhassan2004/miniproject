import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function RouteError({
  message = 'Route information is temporarily unavailable.',
  onRetry
}) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-[#101b30] p-6 text-left space-y-3 shadow-[0_10px_30px_rgba(2,8,23,0.25)]">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-100">
            Route Calculation Notice
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0b1528] hover:bg-slate-800 text-cyan-400 border border-slate-700 text-xs font-bold transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Recalculate Route</span>
          </button>
        </div>
      )}
    </div>
  );
}
