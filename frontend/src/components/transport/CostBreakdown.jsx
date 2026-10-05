import React from 'react';
import { X, Info, Calculator, ShieldCheck, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CostBreakdown({ isOpen, onClose, option, routeInfo }) {
  if (!isOpen || !option) return null;

  const breakdown = option.cost_breakdown || {};
  const distanceKm = option.distance_km || routeInfo?.distance_km || 0;
  const travelers = option.travelers || routeInfo?.travelers || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-3xl border border-slate-700/80 bg-[#101b30] p-6 shadow-[0_25px_60px_rgba(2,8,23,0.55)] space-y-5 relative font-sans text-left"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-700/60 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                Cost Transparency Engine
              </span>
              <h3 className="text-base font-black text-slate-100 mt-1">
                {option.transport_type}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#0b1528] text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Total Cost Highlight */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0b1528] border border-slate-700/70">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Calculated Total Fare ({travelers} Person{travelers > 1 ? 's' : ''})
            </span>
            <div className="text-2xl font-black text-slate-100 flex items-baseline gap-1 mt-0.5">
              <span>₹{Number(option.total_fare || 0).toLocaleString()}</span>
              <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {option.price_label || 'Estimated fare'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block">Per Person</span>
            <span className="text-sm font-black text-cyan-300">
              ₹{Number(option.fare_per_person || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Step-by-Step Itemized Breakdown */}
        <div className="space-y-2 rounded-2xl bg-[#0b1528]/80 border border-slate-700/60 p-4 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block flex items-center">
            <FileText className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            Formula & Tariff Breakdown
          </span>

          <div className="space-y-2 pt-1 divide-y divide-slate-800/80">
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-400">Actual Road Route Distance:</span>
              <strong className="text-slate-100">{distanceKm} km</strong>
            </div>

            {breakdown.base_fare !== undefined && breakdown.base_fare > 0 && (
              <div className="flex justify-between py-1 text-slate-300">
                <span className="text-slate-400">Base Tariff / Flag Drop:</span>
                <strong className="text-slate-100">₹{breakdown.base_fare}</strong>
              </div>
            )}

            {breakdown.per_km_rate !== undefined && breakdown.per_km_rate > 0 && (
              <div className="flex justify-between py-1 text-slate-300">
                <span className="text-slate-400">Distance Tariff Rate:</span>
                <strong className="text-slate-100">₹{breakdown.per_km_rate} / km</strong>
              </div>
            )}

            {breakdown.daily_rental !== undefined && breakdown.daily_rental > 0 && (
              <div className="flex justify-between py-1 text-slate-300">
                <span className="text-slate-400">Daily Vehicle Rental:</span>
                <strong className="text-slate-100">₹{Number(breakdown.daily_rental).toLocaleString()}</strong>
              </div>
            )}

            {breakdown.estimated_fuel_cost !== undefined && breakdown.estimated_fuel_cost > 0 && (
              <div className="flex justify-between py-1 text-slate-300">
                <span className="text-slate-400">Estimated Fuel Expense ({breakdown.fuel_rate_per_km} ₹/km):</span>
                <strong className="text-slate-100">₹{Number(breakdown.estimated_fuel_cost).toLocaleString()}</strong>
              </div>
            )}

            {breakdown.estimated_toll !== undefined && breakdown.estimated_toll > 0 && (
              <div className="flex justify-between py-1 text-slate-300">
                <span className="text-slate-400">Estimated Highway Toll:</span>
                <strong className="text-slate-100">₹{breakdown.estimated_toll}</strong>
              </div>
            )}

            {breakdown.vehicles_needed && (
              <div className="flex justify-between py-1 text-slate-300">
                <span className="text-slate-400">Vehicles Required for Group:</span>
                <strong className="text-cyan-300">{breakdown.vehicles_needed} Vehicle(s)</strong>
              </div>
            )}
          </div>

          {/* Explicit Mathematical Formula */}
          {breakdown.formula && (
            <div className="p-2.5 mt-2 rounded-xl bg-slate-900 border border-slate-700/80 text-[11px] text-cyan-200 font-mono">
              <strong className="text-[10px] text-slate-400 uppercase font-sans block mb-0.5">Calculation Rule:</strong>
              {breakdown.formula}
            </div>
          )}
        </div>

        {/* Disclaimer / Data Transparency Banner */}
        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-slate-300">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {breakdown.transit_disclaimer || 'Prices are calculated using transparent distance-based models. Live bookings require respective service portal or operator.'}
          </p>
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider transition-all"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
}
