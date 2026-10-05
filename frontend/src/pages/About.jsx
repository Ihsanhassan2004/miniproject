import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Compass, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07111f] text-[#0F172A]">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-28 space-y-16 relative z-10">
        {/* Decorative backdrop glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight leading-none">
            About <span className="text-luxury">AuraTravel AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed font-semibold">
            AI Travel Planner: A Personalized Budget-Based Tourism Recommendation Website Using AI.
          </p>
        </motion.div>

        {/* Project Overview */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-8 sm:p-10 rounded-luxury border border-slate-200 shadow-sm space-y-6 text-left"
        >
          <div className="flex items-center space-x-3 text-primary font-bold">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Compass className="h-5 w-5 animate-spin-slow text-primary" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Project Overview</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
            This platform is built to solve the hassle of travel planning by consolidating destination research, hotel room checking, cost estimators, transit comparing, and hourly itineraries into one portal.
            By providing a budget-friendly custom travel matrix, users input their source, duration, companion sizes, categories, and interest tags, receiving scoring-based recommendations instantly.
          </p>
        </motion.section>

       
      </main>

      <Footer />
    </div>
  );
}
