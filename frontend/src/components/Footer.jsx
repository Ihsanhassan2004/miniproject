import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Phone, Award, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950/90 text-slate-400 border-t border-slate-800 transition-all duration-300 py-12 px-4 z-10 relative">
      <div className="max-w-7xl mx-auto p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-100 font-bold text-lg">
              <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-400/20 text-blue-300">
                <Compass className="h-5 w-5 animate-spin-slow" />
              </div>
              <span className="font-extrabold text-base tracking-tight uppercase">
                AuraTravel <span className="text-blue-300">AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 font-medium">
              Experience the future of holiday planning. AuraTravel AI designs fully personalized itineraries, estimates local dining/hotel/transit expenses, and optimizes room search inside a singular luxury portal.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:pl-8">
            <h3 className="text-slate-100 font-extrabold text-xs uppercase tracking-widest mb-6">Platform</h3>
            <ul className="space-y-3.5 text-xs font-bold">
              <li>
                <Link to="/" className="hover:text-blue-300 transition-all flex items-center group text-slate-400">
                  <span>Home</span>
                  <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-300 transition-all flex items-center group text-slate-400">
                  <span>About Us</span>
                  <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-blue-300 transition-all flex items-center group">
                  <span>Admin Command</span>
                  <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div>
            <h3 className="text-slate-100 font-extrabold text-xs uppercase tracking-widest mb-6">Connect</h3>
            <ul className="space-y-4 text-xs font-semibold">
              <li className="flex items-center space-x-3">
                <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <span className="text-slate-300">support@auratravel.ai</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <span className="text-slate-300">+91 0000000000</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                  <Award className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <span className="text-slate-300 font-bold">MCA Mini Project</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
}
