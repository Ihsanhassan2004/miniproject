import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Compass, User, LogOut, LayoutDashboard, Calendar } from 'lucide-react';
import { authService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-7xl mx-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/70 rounded-luxury shadow-lg px-6 py-3.5 flex items-center justify-between"
      >
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="bg-blue-500/10 p-2 rounded-xl border border-blue-400/20 text-blue-300 flex items-center justify-center shadow-sm"
            >
              <Compass className="h-4.5 w-4.5" />
            </motion.div>
            <span className="font-extrabold text-sm text-slate-100 tracking-tight uppercase">
              AuraTravel <span className="text-primary">AI</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {[
            { to: '/', label: 'Home' },
            { to: '/about', label: 'About' }
          ].map((item) => (
            <Link 
              key={item.to}
              to={item.to}
              className="relative text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-wider py-1.5"
            >
              {item.label}
              {isActive(item.to) && (
                <motion.span 
                   layoutId="activeNavLine"
                   className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded"
                />
              )}
            </Link>
          ))}
          
          <div className="h-4 w-px bg-slate-200"></div>

          {/* User Console buttons */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-luxury bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all focus:outline-none"
              >
                <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-400/20 flex items-center justify-center font-extrabold text-xs">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-extrabold text-slate-200">
                  {currentUser.name || currentUser.username}
                </span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 rounded-luxury bg-slate-900 border border-slate-700 shadow-2xl py-2 focus:outline-none z-50 text-left"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-extrabold text-slate-100 truncate">{currentUser.name || currentUser.username}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-1">{currentUser.email || 'System Account'}</p>
                    </div>

                    <div className="py-1.5 px-1.5 space-y-0.5">
                      {currentUser.is_admin ? (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-3 py-2 text-xs font-extrabold text-slate-300 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 mr-2.5 text-blue-300" /> Admin Console
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-3 py-2 text-xs font-extrabold text-slate-300 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 mr-2.5 text-blue-300" /> Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 my-1"></div>
                    <div className="px-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-3 py-2 text-xs font-extrabold text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-2.5" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-slate-400 hover:text-blue-300 font-extrabold text-xs uppercase tracking-wider transition-all">
                Login
              </Link>
              <Link to="/register" className="px-5 py-2.5 rounded-luxury bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Action */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300"
          >
            {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-2 rounded-luxury border border-slate-700 bg-slate-900 px-4 py-4 space-y-1.5 shadow-xl overflow-hidden text-left"
          >
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 font-bold text-xs uppercase tracking-wider text-slate-300">
              Home
            </Link>
            <Link to="/about" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 font-bold text-xs uppercase tracking-wider text-slate-300">
              About
            </Link>

            <div className="border-t border-slate-100 my-2.5"></div>

            {currentUser ? (
              <div className="space-y-1.5">
                {currentUser.is_admin ? (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-primary font-bold text-xs uppercase tracking-wider hover:bg-slate-50">
                    Admin Console
                  </Link>
                ) : (
                  <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 font-bold text-xs uppercase tracking-wider text-slate-600">
                      Dashboard
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2.5 rounded-xl text-rose-500 font-extrabold text-xs uppercase tracking-wider hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-center px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs tracking-wider uppercase hover:bg-slate-50 transition-colors text-slate-600">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="text-center px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-primary/20">
                  Register
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
