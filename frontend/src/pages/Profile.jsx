import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Lock, Save, ShieldAlert, BadgeCheck, 
  Sparkles, CheckCircle2, AlertCircle, Shield, KeyRound
} from 'lucide-react';
import { authService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await authService.getProfile();
        setName(res.user.name || '');
        setEmail(res.user.email || '');
        setPhone(res.user.phone || '');
        setJoinedDate(res.user.created_at || '');
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    loadProfile();
  }, []);

  // Validation function
  const validate = () => {
    const errs = {};

    // 1. Name validation
    const cleanName = name.trim();
    if (!cleanName) {
      errs.name = 'Full Traveler Name is required.';
    } else if (cleanName.length < 2) {
      errs.name = 'Name must be at least 2 characters long.';
    } else if (cleanName.length > 50) {
      errs.name = 'Name must not exceed 50 characters.';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(cleanName)) {
      errs.name = 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    }

    // 2. Email validation
    const cleanEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!cleanEmail) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address (e.g., traveler@example.com).';
    } else {
      const parts = cleanEmail.split('@');
      const domain = parts[1] || '';
      if (!domain.includes('.') || domain.split('.').pop().length < 2) {
        errs.email = 'Email must have a valid domain extension (e.g., .com, .org, .in).';
      }
    }

    // 3. Phone validation (optional, but if filled, must be 10 digits)
    const cleanPhone = phone.trim();
    if (cleanPhone) {
      const digits = cleanPhone.replace(/\D/g, '');
      let normalized = digits;
      if (cleanPhone.startsWith('+91') && digits.length === 12) {
        normalized = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        normalized = digits.slice(1);
      }

      if (normalized.length !== 10 || !['6', '7', '8', '9'].includes(normalized[0])) {
        errs.phone = 'Phone number must be a valid 10-digit mobile number starting with 6-9.';
      }
    }

    // 4. Password validation (optional on update)
    if (password) {
      if (password.length < 6) {
        errs.password = 'Password must be at least 6 characters long.';
      } else if (password.length > 100) {
        errs.password = 'Password must not exceed 100 characters.';
      }

      if (confirmPassword && password !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.';
      }
    } else if (confirmPassword) {
      errs.confirmPassword = 'Please enter a new password first.';
    }

    setErrors(errs);
    return errs;
  };

  useEffect(() => {
    validate();
  }, [name, email, phone, password, confirmPassword]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    });

    const currentErrors = validate();
    if (Object.keys(currentErrors).length > 0) {
      setErrorMsg(Object.values(currentErrors)[0]);
      return;
    }

    setLoading(true);
    setMsg('');
    setErrorMsg('');

    try {
      const payload = { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        phone: phone.trim() 
      };
      if (password) {
        payload.password = password;
      }
      const res = await authService.updateProfile(payload);
      setMsg(res.message || 'Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setTouched({
        name: false,
        email: false,
        phone: false,
        password: false,
        confirmPassword: false
      });
      // Scroll to top of message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile credentials.');
    } finally {
      setLoading(false);
    }
  };

  const hasFormErrors = Object.keys(errors).length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans text-left pb-12">
      
      {/* ── 1. Header Profile Banner ── */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0d2144] via-[#102752] to-[#0a1832] p-6 md:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 relative z-10 text-center sm:text-left">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center font-black text-2xl shadow-xl border-2 border-white/20 shrink-0">
            {name ? name[0].toUpperCase() : 'U'}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {name || 'Traveler Account'}
              </h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <BadgeCheck className="h-3 w-3" />
                <span>Verified Traveler</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-300 truncate">
              {email || 'Loading credentials...'}
            </p>

            {joinedDate && (
              <p className="text-[10px] text-slate-400 font-medium">
                Member since {new Date(joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Alerts ── */}
      <AnimatePresence>
        {msg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs rounded-2xl flex items-center space-x-3 font-bold shadow-lg"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{msg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-2xl flex items-center space-x-3 font-bold shadow-lg"
          >
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Edit Form ── */}
      <form onSubmit={handleUpdate} className="bg-[#0b1528] p-6 sm:p-8 border border-slate-700/80 rounded-3xl shadow-2xl space-y-6">
        
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
            <Shield className="h-4.5 w-4.5 text-cyan-400" />
            <span>Personal & Security Information</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Update your personal profile, contact information, and account password.
          </p>
        </div>

        {/* 1. Full Traveler Name */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
              Full Traveler Name <span className="text-rose-400">*</span>
            </label>
            {touched.name && !errors.name && (
              <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Valid</span>
              </span>
            )}
          </div>
          
          <div className={`flex items-center bg-[#07111f] border rounded-2xl px-4 py-3 transition-all ${
            touched.name && errors.name 
              ? 'border-rose-500 ring-1 ring-rose-500/30' 
              : 'border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400'
          }`}>
            <User className={`h-4.5 w-4.5 mr-3 flex-shrink-0 transition-colors ${
              touched.name && errors.name ? 'text-rose-400' : 'text-slate-400'
            }`} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. John Doe"
              className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-semibold placeholder-slate-500"
            />
          </div>
          {touched.name && errors.name && (
            <p className="text-[11px] text-rose-400 font-semibold flex items-center space-x-1 mt-1 pl-1 animate-fade-in">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* 2. Email Address */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
              Email Address <span className="text-rose-400">*</span>
            </label>
            {touched.email && !errors.email && (
              <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Valid format</span>
              </span>
            )}
          </div>

          <div className={`flex items-center bg-[#07111f] border rounded-2xl px-4 py-3 transition-all ${
            touched.email && errors.email 
              ? 'border-rose-500 ring-1 ring-rose-500/30' 
              : 'border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400'
          }`}>
            <Mail className={`h-4.5 w-4.5 mr-3 flex-shrink-0 transition-colors ${
              touched.email && errors.email ? 'text-rose-400' : 'text-slate-400'
            }`} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="traveler@example.com"
              className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-semibold placeholder-slate-500"
            />
          </div>
          {touched.email && errors.email && (
            <p className="text-[11px] text-rose-400 font-semibold flex items-center space-x-1 mt-1 pl-1 animate-fade-in">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* 3. Contact Phone */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
              Contact Phone (Optional)
            </label>
            {touched.phone && phone && !errors.phone && (
              <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Valid 10-digit mobile</span>
              </span>
            )}
          </div>

          <div className={`flex items-center bg-[#07111f] border rounded-2xl px-4 py-3 transition-all ${
            touched.phone && errors.phone 
              ? 'border-rose-500 ring-1 ring-rose-500/30' 
              : 'border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400'
          }`}>
            <Phone className={`h-4.5 w-4.5 mr-3 flex-shrink-0 transition-colors ${
              touched.phone && errors.phone ? 'text-rose-400' : 'text-slate-400'
            }`} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder="10-digit mobile number (e.g. 9876543210)"
              maxLength={15}
              className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-semibold placeholder-slate-500"
            />
          </div>
          {touched.phone && errors.phone && (
            <p className="text-[11px] text-rose-400 font-semibold flex items-center space-x-1 mt-1 pl-1 animate-fade-in">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>

        {/* 4. Password Section */}
        <div className="pt-2 border-t border-slate-800 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block flex items-center space-x-1.5">
              <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
              <span>New Password (Leave blank to keep current)</span>
            </label>
            <div className={`flex items-center bg-[#07111f] border rounded-2xl px-4 py-3 transition-all ${
              touched.password && errors.password 
                ? 'border-rose-500 ring-1 ring-rose-500/30' 
                : 'border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400'
            }`}>
              <Lock className={`h-4.5 w-4.5 mr-3 flex-shrink-0 transition-colors ${
                touched.password && errors.password ? 'text-rose-400' : 'text-slate-400'
              }`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Min 6 characters"
                className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-semibold placeholder-slate-500"
              />
            </div>
            {touched.password && errors.password && (
              <p className="text-[11px] text-rose-400 font-semibold flex items-center space-x-1 mt-1 pl-1 animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {password && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                Confirm New Password <span className="text-rose-400">*</span>
              </label>
              <div className={`flex items-center bg-[#07111f] border rounded-2xl px-4 py-3 transition-all ${
                touched.confirmPassword && errors.confirmPassword 
                  ? 'border-rose-500 ring-1 ring-rose-500/30' 
                  : 'border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400'
              }`}>
                <Lock className={`h-4.5 w-4.5 mr-3 flex-shrink-0 transition-colors ${
                  touched.confirmPassword && errors.confirmPassword ? 'text-rose-400' : 'text-slate-400'
                }`} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Re-enter new password"
                  className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-semibold placeholder-slate-500"
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-[11px] text-rose-400 font-semibold flex items-center space-x-1 mt-1 pl-1 animate-fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || hasFormErrors}
          className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 border border-transparent disabled:opacity-40 disabled:pointer-events-none hover:scale-[1.01] active:scale-95"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>
      </form>
    </div>
  );
}
