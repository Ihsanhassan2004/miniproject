import React from 'react';
import { Sparkles, Coins, Star, Zap, Users, KeyRound, Leaf, Footprints, ShieldCheck } from 'lucide-react';

export default function RecommendationBadge({ badge, className = '' }) {
  if (!badge) return null;

  const bLower = String(badge).toLowerCase();

  let bgClasses = 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300';
  let Icon = Sparkles;

  if (bLower.includes('match') || bLower.includes('top')) {
    bgClasses = 'bg-gradient-to-r from-blue-600/30 to-cyan-500/30 border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]';
    Icon = Sparkles;
  } else if (bLower.includes('budget') || bLower.includes('economical') || bLower.includes('cheap')) {
    bgClasses = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
    Icon = Coins;
  } else if (bLower.includes('comfort') || bLower.includes('luxury') || bLower.includes('premium')) {
    bgClasses = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    Icon = Star;
  } else if (bLower.includes('fast') || bLower.includes('speed') || bLower.includes('rapid')) {
    bgClasses = 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300';
    Icon = Zap;
  } else if (bLower.includes('group')) {
    bgClasses = 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300';
    Icon = Users;
  } else if (bLower.includes('freedom') || bLower.includes('flex')) {
    bgClasses = 'bg-sky-500/15 border-sky-500/40 text-sky-300';
    Icon = KeyRound;
  } else if (bLower.includes('eco') || bLower.includes('green') || bLower.includes('reliable')) {
    bgClasses = 'bg-teal-500/15 border-teal-500/40 text-teal-300';
    Icon = Leaf;
  } else if (bLower.includes('walk') || bLower.includes('hike') || bLower.includes('promenade')) {
    bgClasses = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
    Icon = Footprints;
  }

  return (
    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${bgClasses} ${className}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{badge}</span>
    </span>
  );
}
