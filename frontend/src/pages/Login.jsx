import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Mail, Lock, Compass, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { authService } from '../services/api';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState(location.state?.prefillEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || '');

  if (localStorage.getItem('token') && authService.getCurrentUser()) {
    const user = authService.getCurrentUser();
    return <Navigate to={user.is_admin ? "/admin" : "/dashboard"} replace />;
  }

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Please enter both email/username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (identifier.includes('@')) {
        try {
          await authService.login({ email: identifier, password });
          navigate(from || '/dashboard', { replace: true });
        } catch (userErr) {
          try {
            await authService.adminLogin({ username: identifier, password });
            navigate('/admin', { replace: true });
          } catch (adminErr) {
            setErrorMsg(userErr.response?.data?.message || 'Login failed. Please check credentials.');
          }
        }
      } else {
        try {
          await authService.adminLogin({ username: identifier, password });
          navigate('/admin', { replace: true });
        } catch (adminErr) {
          try {
            await authService.login({ email: identifier, password });
            navigate(from || '/dashboard', { replace: true });
          } catch (userErr) {
            setErrorMsg(adminErr.response?.data?.message || 'Login failed. Please check credentials.');
          }
        }
      }
    } catch (err) {
      setErrorMsg('Authentication failed. Please check your network or inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07111f] text-slate-100">
      <Navbar />

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 min-h-[90vh] pt-20">
        
        {/* Left Side: Illustration / Brand Showcase */}
        <div className="hidden lg:flex lg:col-span-6 bg-slate-900/70 relative items-center justify-center overflow-hidden p-12 border-r border-slate-800">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 text-center max-w-md space-y-6">
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="inline-flex p-4 bg-blue-500/10 rounded-2xl border border-blue-400/20 text-blue-300 shadow-sm"
            >
              <Compass className="h-10 w-10 animate-spin-slow" />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">Your Journey Awaits</h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Unlock custom day-by-day itineraries, dynamic expense estimators, and hotel checks inside our unified minimal travel dashboard.
              </p>
            </div>

            {/* Travel Illustration SVG */}
            <svg className="w-full max-w-xs mx-auto text-primary/20" viewBox="0 0 200 150" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="100" cy="75" r="40" strokeDasharray="4 4" />
              <path d="M60,75 L140,75" />
              <path d="M100,35 L100,115" />
              <path d="M72,47 Q100,75 128,103" strokeWidth="1" />
              <polygon points="100,25 105,38 95,38" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Right Side: Form panel */}
        <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-luxury shadow-lg p-8 space-y-6 text-left">
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Access Account</h1>
              <p className="text-xs text-slate-400 font-semibold">Enter your credentials to manage active travel plans.</p>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-2xl flex items-center space-x-2 font-bold">
                <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl flex items-center space-x-2 font-bold">
                <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address or Username</label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus-within:border-blue-400 transition-all">
                  <Mail className="h-4.5 w-4.5 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="Enter email or username"
                    className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Password</label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus-within:border-blue-400 transition-all">
                  <Lock className="h-4.5 w-4.5 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Proceed Securely</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs font-bold text-slate-400">
              New to AuraTravel?{' '}
              <Link to="/register" className="text-blue-300 hover:underline">
                Create Account
              </Link>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
