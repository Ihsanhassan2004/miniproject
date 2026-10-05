import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Compass, AlertCircle, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { authService } from '../services/api';
import { motion } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  if (localStorage.getItem('token') && authService.getCurrentUser()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'No password', color: 'bg-slate-100' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, text: 'Weak', color: 'bg-rose-500' };
    if (score <= 4) return { score, text: 'Medium', color: 'bg-amber-500' };
    return { score, text: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    if (phone) {
      const cleaned = phone.replace(/\D/g, '');
      const testNum = (cleaned.length === 12 && cleaned.startsWith('91')) ? cleaned.slice(2) : cleaned;
      if (!/^[6-9]\d{9}$/.test(testNum)) {
        setErrorMsg('Please enter a valid 10-digit phone number.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await authService.register({ name, email, phone, password });
      navigate('/login', {
        state: {
          successMessage: 'Account created successfully! Please sign in with your credentials.',
          prefillEmail: email
        }
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07111f] text-slate-100">
      <Navbar />

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 min-h-[90vh] pt-20">
        
        {/* Left Side: Brand Showcase */}
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
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">Create Your Workspace</h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Join our premium community to curate, customize, and share customized AI-powered holidays instantly.
              </p>
            </div>

            {/* Travel Illustration SVG */}
            <svg className="w-full max-w-xs mx-auto text-blue-400/20" viewBox="0 0 200 150" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="30" y="20" width="140" height="110" rx="10" strokeDasharray="3 3" />
              <path d="M50,110 L150,110" />
              <path d="M50,40 L150,40" />
              <circle cx="100" cy="75" r="25" />
              <polygon points="100,65 108,80 92,80" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-luxury shadow-lg p-8 space-y-5 text-left relative z-10">
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Create Account</h1>
              <p className="text-xs text-slate-400 font-semibold">Join today and plan custom itineraries instantly.</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl flex items-center space-x-2 font-bold">
                <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Traveler Full Name *</label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                  <User className="h-4.5 w-4.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address *</label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                  <Mail className="h-4.5 w-4.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                    className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                  <Phone className="h-4.5 w-4.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Password *</label>
                  {password && (
                    <span className="text-[9px] font-extrabold uppercase text-slate-400">
                      Strength: <strong className={strength.text === 'Strong' ? 'text-emerald-500' : strength.text === 'Medium' ? 'text-amber-500' : 'text-rose-500'}>{strength.text}</strong>
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Lock className="h-4.5 w-4.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-semibold"
                  />
                </div>
                {/* Strength Meter Bar */}
                {password && (
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-350`} 
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs font-bold text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-300 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
