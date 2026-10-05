import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Mail, Phone, Calendar, AlertCircle, 
  Trash2, Edit2, Plus, X, Save, Lock, CheckCircle2, 
  MapPin, Compass, ShieldCheck, ShieldAlert, ArrowUpDown
} from 'lucide-react';
import { adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name_asc', 'trips_desc'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminService.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load registered users database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setEditId(null);
    setFormErrors({});
    setIsModalOpen(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditId(user.id);
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setPassword(''); // leave blank unless updating
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters.';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. user@example.com).';
    }

    if (!editId) {
      if (!password) {
        errs.password = 'Password is required for new user.';
      } else if (password.length < 6) {
        errs.password = 'Password must be at least 6 characters.';
      }
    } else {
      if (password && password.length < 6) {
        errs.password = 'New password must be at least 6 characters.';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editId) {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim()
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await adminService.updateUser(editId, payload);
        setSuccessMsg(`User profile "${name.trim()}" updated successfully!`);
      } else {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password.trim()
        };
        await adminService.createUser(payload);
        setSuccessMsg(`New user account for "${name.trim()}" created successfully!`);
      }
      resetForm();
      await loadUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Operation failed. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteTargetUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    setDeleting(true);
    try {
      await adminService.deleteUser(deleteTargetUser.id);
      setSuccessMsg(`User "${deleteTargetUser.name}" was deleted successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadUsers();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete user profile.');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteTargetUser(null);
    }
  };

  // Filter and Sort Users
  const filteredUsers = [...users]
    .filter((user) => {
      const q = searchQuery.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.phone && String(user.phone).includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
      if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'trips_desc') return (b.trips_count || 0) - (a.trips_count || 0);
      return 0;
    });

  const totalTripsAcrossUsers = users.reduce((acc, u) => acc + (u.trips_count || 0), 0);
  const totalReviewsAcrossUsers = users.reduce((acc, u) => acc + (u.reviews_count || 0), 0);

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center py-32 bg-luxuryBg">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans animate-fade-in text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center tracking-tight">
            <Users className="h-7 w-7 text-primary mr-2.5" />
            User Management Console
          </h1>
          <p className="text-xs text-luxuryMuted font-semibold mt-0.5">
            Monitor and manage registered traveler profiles, credentials, and trip activities.
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-luxury flex items-center space-x-2 font-bold"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-luxury flex items-center space-x-2 font-bold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-luxurySurface p-4.5 rounded-2xl border border-white/5 shadow-md">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
            Registered Travelers
          </span>
          <span className="text-2xl font-black text-white">{users.length}</span>
        </div>

        <div className="bg-luxurySurface p-4.5 rounded-2xl border border-white/5 shadow-md">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
            Total Trips Saved
          </span>
          <span className="text-2xl font-black text-cyan-400">{totalTripsAcrossUsers}</span>
        </div>

        <div className="bg-luxurySurface p-4.5 rounded-2xl border border-white/5 shadow-md">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
            Reviews Submitted
          </span>
          <span className="text-2xl font-black text-amber-400">{totalReviewsAcrossUsers}</span>
        </div>

        <div className="bg-luxurySurface p-4.5 rounded-2xl border border-white/5 shadow-md">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
            Active Accounts
          </span>
          <span className="text-2xl font-black text-emerald-400">{users.length}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-luxurySurface border border-white/5 rounded-luxury text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary font-bold transition-all"
          />
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-primary" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-luxurySurface border border-white/5 text-xs px-3.5 py-2.5 rounded-luxury focus:outline-none text-white font-bold"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="trips_desc">Most Trips Planned</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-luxurySurface rounded-luxury border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-luxuryBg text-slate-500 border-b border-white/5 font-extrabold uppercase tracking-widest text-[9px]">
                <th className="p-4 pl-6">S.No.</th>
                <th className="p-4">Traveler Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Phone Contact</th>
                <th className="p-4">Planned Trips</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-luxuryBg/30 transition-colors font-semibold">
                  <td className="p-4 pl-6 text-slate-400 font-bold">{index + 1}</td>
                  
                  {/* User Avatar + Name */}
                  <td className="p-4 font-extrabold text-white flex items-center space-x-3 py-4">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-primary flex items-center justify-center font-black text-xs shadow-inner">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="block">{user.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">User ID: {user.id}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="p-4 text-slate-300">
                    <div className="flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                      <span>{user.email}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="p-4 text-slate-300">
                    <div className="flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                      <span>{user.phone || 'Not provided'}</span>
                    </div>
                  </td>

                  {/* Trips Count Badge */}
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Compass className="h-3 w-3 mr-1" />
                      {user.trips_count || 0} {(user.trips_count === 1) ? 'Trip' : 'Trips'}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="p-4 text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                      <span>{user.created_at ? user.created_at.split(' ')[0] : 'Recently'}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 bg-luxuryBg hover:bg-primary/10 text-primary rounded-xl border border-white/5 transition-colors"
                        title="Edit User Profile"
                        aria-label="Edit User Profile"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="p-2 bg-luxuryBg hover:bg-rose-500/10 text-rose-500 rounded-xl border border-white/5 transition-colors"
                        title="Delete User"
                        aria-label="Delete User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-luxuryMuted italic">
                    {searchQuery ? "No registered users match your search query." : "No users registered yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-luxurySurface w-full max-w-lg rounded-luxury border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 text-left relative"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  {editId ? 'Edit Traveler Profile' : 'Create New Traveler Account'}
                </h3>
                <button 
                  onClick={resetForm}
                  className="p-2 rounded-xl hover:bg-luxuryBg text-slate-500 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    required
                    placeholder="e.g. John Doe"
                    className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                      formErrors.name ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                    }`}
                  />
                  {formErrors.name && (
                    <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                    }}
                    required
                    placeholder="e.g. traveler@example.com"
                    className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                      formErrors.email ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                    }`}
                  />
                  {formErrors.email && (
                    <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {formErrors.email}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                    Phone Number Contact (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full text-xs bg-luxuryBg border border-white/5 focus:border-primary/50 rounded-luxury p-3 focus:outline-none text-white font-bold transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block flex items-center justify-between">
                    <span>{editId ? 'New Password (Optional)' : 'Account Password *'}</span>
                    {editId && <span className="text-[9px] text-slate-500 font-normal lowercase">leave blank to keep existing</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                      }}
                      required={!editId}
                      placeholder={editId ? "•••••••• (Unchanged)" : "Minimum 6 characters"}
                      className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                        formErrors.password ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                      }`}
                    />
                  </div>
                  {formErrors.password && (
                    <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {formErrors.password}
                    </span>
                  )}
                </div>

                <div className="flex justify-end space-x-3.5 pt-4 border-t border-white/5 font-extrabold uppercase tracking-wider text-[10px]">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 bg-luxuryBg hover:opacity-90 border border-white/5 text-slate-400 rounded-luxury"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-luxury flex items-center space-x-1.5 border border-transparent shadow-lg transition-all"
                  >
                    <Save className="h-4 w-4" />
                    <span>{submitting ? 'Saving...' : (editId ? 'Apply Changes' : 'Create User')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deleteTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-luxurySurface w-full max-w-md rounded-luxury border border-white/10 shadow-2xl p-6 space-y-6 text-left relative"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center text-rose-400">
                  <ShieldAlert className="h-4.5 w-4.5 mr-2" />
                  Confirm Account Deletion
                </h3>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="p-2 rounded-xl hover:bg-luxuryBg text-slate-500 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  Are you sure you want to delete the user account for <strong className="text-white">{deleteTargetUser.name}</strong> ({deleteTargetUser.email})?
                </p>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 font-semibold">
                  Warning: This action will permanently remove this account from the platform.
                </div>
              </div>

              <div className="flex justify-end space-x-3.5 pt-2 font-extrabold uppercase tracking-wider text-[10px]">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 bg-luxuryBg hover:opacity-90 border border-white/5 text-slate-400 rounded-luxury"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-luxury border border-transparent transition-all shadow-md"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
