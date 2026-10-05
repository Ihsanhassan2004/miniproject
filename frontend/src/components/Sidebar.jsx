import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, Compass, BookOpen,
  Map, User, Settings, LogOut, Calendar,
  Hotel, Utensils, Car, Bot, Users, LifeBuoy, BookMarked, Star, MessageSquare, AlertCircle
} from 'lucide-react';
import { authService } from '../services/api';
import { motion } from 'framer-motion';

export default function Sidebar({ isAdmin }) {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Sidebar links layout matching the user module requirements
  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plan-trip', label: 'AI Planner', icon: Sparkles },
    { to: '/chat', label: 'AI Assistant', icon: Bot },
    { to: '/my-trips', label: 'Saved Trips', icon: BookOpen },
    { to: '/diaries', label: 'Travel Diary', icon: BookMarked },
    { to: '/destinations', label: 'Destinations', icon: Map },
    { to: '/reviews', label: 'Review & Feedback', icon: Star },
    { to: '/support', label: 'Help & Support', icon: LifeBuoy },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/trips', label: 'Saved Trips', icon: Calendar },
    { to: '/admin/destinations', label: 'Destinations', icon: Map },
    { to: '/admin/hotels', label: 'Accommodations', icon: Hotel },
    { to: '/admin/restaurants', label: 'Restaurants', icon: Utensils },
    { to: '/admin/transport', label: 'Transportation', icon: Car },
    { to: '/admin/diaries', label: 'Trip Diaries', icon: BookMarked },
    { to: '/admin/reviews-feedback', label: 'Review & Feedback', icon: Star },
    { to: '/admin/complaints', label: 'Complaints', icon: AlertCircle }
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside className="w-64 my-4 ml-4 bg-[#07111f] text-slate-100 rounded-luxury shadow-2xl flex-shrink-0 flex flex-col justify-between hidden md:flex transition-all duration-300 relative z-30 overflow-hidden border border-slate-800/80">

      {/* Upper part */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center space-x-3 border-b border-slate-800/80">
          <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400 shadow-inner">
            <Compass className="h-5 w-5 text-blue-400 animate-spin-slow" />
          </div>
          <span className="font-extrabold text-base text-white tracking-tight uppercase">
            AuraTravel <span className="text-cyan-300">AI</span>
          </span>
        </div>

        {/* Scrollable Nav items */}
        <div className="flex-grow overflow-y-auto px-4 py-6 space-y-4">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
            {isAdmin ? 'Admin Console' : 'Traveler Panel'}
          </p>

          <div className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/admin' || link.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all relative group ${isActive
                      ? 'text-white bg-blue-600 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-[#14233f] border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {Icon && (
                        <Icon className={`h-4.5 w-4.5 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`} />
                      )}
                      <span className="relative z-10">{link.label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="activeSidebarPill"
                          className="absolute inset-0 bg-blue-600 rounded-xl pointer-events-none"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile Footer */}
      {currentUser && (
        <div className="p-4 border-t border-slate-800/80 bg-[#0b1528]/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-inner">
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-black text-white truncate leading-none">
                {currentUser.name || currentUser.username}
              </p>
              <span className="text-[10px] text-slate-400 truncate block mt-1 leading-none font-semibold">
                {currentUser.email || 'System Account'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#14233f] rounded-xl transition-all shrink-0"
            title="Sign Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      )}
    </aside>
  );
}
