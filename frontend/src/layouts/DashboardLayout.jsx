import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/api';
import { Menu, X, LogOut, Compass, ChevronDown, User, Settings, LifeBuoy, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ErrorBoundary from '../components/ErrorBoundary';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const currentUser = authService.getCurrentUser();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!token || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute && !currentUser.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Overview';
    if (path.startsWith('/plan-trip')) return 'AI Planner';
    if (path.startsWith('/chat')) return 'AI Travel Assistant';
    if (path.startsWith('/my-trips')) return 'Saved Trips';
    if (path.startsWith('/diaries') || path.startsWith('/diary')) return 'Travel Diary & Memories';
    if (path.startsWith('/reviews') || path.startsWith('/feedback')) return 'Reviews & Feedback';
    if (path.startsWith('/support')) return 'Help & Support';
    if (path.startsWith('/profile')) return 'My Profile';
    if (path.startsWith('/admin/users')) return 'Users Control';
    if (path.startsWith('/admin/trips')) return 'All Saved Trips Control';
    if (path.startsWith('/admin/destinations')) return 'Destinations Config';
    if (path.startsWith('/admin/hotels')) return 'Hotels Config';
    if (path.startsWith('/admin/restaurants')) return 'Restaurants Config';
    if (path.startsWith('/admin/transport')) return 'Transportation Config';
    if (path.startsWith('/admin/complaints')) return 'Complaints Center';
    if (path.startsWith('/admin/reviews-feedback')) return 'Reviews Config';
    if (path.startsWith('/admin/diaries')) return 'Diaries Config';
    if (path.startsWith('/admin')) return 'Admin Core Dashboard';
    return 'AuraTravel';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#07111f] text-slate-100 antialiased">
      
      {/* 1. Left Sidebar Navigation (Desktop) */}
      <Sidebar isAdmin={isAdminRoute} />

      {/* 2. Main Content Right Section */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Horizontal Header Cockpit */}
        <header className="h-20 border-b border-slate-800/80 bg-[#0b1528] px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-[0_8px_30px_rgba(2,8,23,0.35)]">
          
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-300 hover:bg-[#14233f] hover:text-white md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* User profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 hover:bg-[#14233f] rounded-full transition-all border border-slate-700/60 shadow-sm"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-xs">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-slate-200 hidden lg:inline-block max-w-[100px] truncate">
                  {currentUser.name || currentUser.username}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden lg:inline-block" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-48 bg-[#101b30] border border-slate-700/70 rounded-2xl shadow-xl z-50 p-1.5"
                    >
                      {!currentUser.is_admin && (
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2.5 hover:bg-[#14233f] rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                          >
                            <User className="h-4 w-4 text-slate-400" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/reviews"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2.5 hover:bg-[#14233f] rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 text-slate-400" />
                            <span>Reviews & Feedback</span>
                          </Link>
                          <Link
                            to="/support"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2.5 hover:bg-[#14233f] rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                          >
                            <LifeBuoy className="h-4 w-4 text-slate-400" />
                            <span>Help & Support</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2.5 hover:bg-[#14233f] rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                          >
                            <Settings className="h-4 w-4 text-slate-400" />
                            <span>Settings</span>
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2.5 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold text-left transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic page content rendering container */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 relative">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </main>
      </div>

      {/* 3. Mobile Sidebar Drawer Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setMobileOpen(false)}
            />

            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-[#07111f] text-slate-100 p-5 border-r border-slate-800/80 shadow-2xl"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-black/20 text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-grow flex flex-col justify-between overflow-y-auto pt-5">
                <div>
                  <div className="flex items-center space-x-2 px-3 pb-6 border-b border-slate-800/80">
                    <Compass className="h-5 w-5 text-blue-400" />
                    <span className="font-extrabold text-sm uppercase text-white">
                      AuraTravel <span className="text-cyan-300">AI</span>
                    </span>
                  </div>

                  <div className="py-6 space-y-4">
                    <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Navigation
                    </p>
                    
                    <div className="space-y-1">
                      {(isAdminRoute 
                        ? [
                            { to: '/admin', label: 'Dashboard' },
                            { to: '/admin/users', label: 'Users' },
                            { to: '/admin/trips', label: 'Saved Trips' },
                            { to: '/admin/destinations', label: 'Destinations' },
                            { to: '/admin/hotels', label: 'Accommodations' },
                            { to: '/admin/restaurants', label: 'Restaurants' },
                            { to: '/admin/transport', label: 'Transportation' },
                            { to: '/admin/diaries', label: 'Trip Diaries' },
                            { to: '/admin/reviews-feedback', label: 'Review & Feedback' },
                            { to: '/admin/complaints', label: 'Complaints' }
                          ]
                        : [
                            { to: '/dashboard', label: 'Dashboard' },
                            { to: '/plan-trip', label: 'AI Planner' },
                            { to: '/chat', label: 'AI Assistant' },
                            { to: '/my-trips', label: 'Saved Trips' },
                            { to: '/diaries', label: 'Travel Diary' },
                            { to: '/destinations', label: 'Destinations' },
                            { to: '/reviews', label: 'Review & Feedback' },
                            { to: '/support', label: 'Help & Support' },
                            { to: '/profile', label: 'Profile' }
                          ]
                      ).map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                            location.pathname === link.to
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-[#14233f]'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {currentUser && (
                  <div className="p-4 border-t border-slate-800/80 bg-[#0b1528]/80 flex items-center justify-between rounded-xl">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center font-extrabold text-xs">
                        {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-extrabold text-white truncate">
                          {currentUser.name || currentUser.username}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
