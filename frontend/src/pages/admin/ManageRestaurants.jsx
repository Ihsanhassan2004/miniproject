import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Utensils, X, Save, AlertCircle, Search, Check, Tag } from 'lucide-react';
import { tripService, adminService } from '../../services/api';
import { motion } from 'framer-motion';

const PRESET_CUISINES = [
  'Local Cuisine',
  'South Indian',
  'North Indian',
  'Kerala Traditional',
  'Seafood Specialty',
  'Continental',
  'Chinese & Asian',
  'Arabian & Middle Eastern',
  'Cafe & European Breakfast',
  'Pure Vegetarian',
  'Street Food',
  'Italian & Pizza',
  'Biryani & Mughlai',
  'Tibetan & Momos',
  'Fast Food & Snacks',
  'Desserts & Beverages'
];

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [destinationId, setDestinationId] = useState('');
  const [name, setName] = useState('');
  const [cuisines, setCuisines] = useState(['Local Cuisine']);
  const [customCuisine, setCustomCuisine] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [rating, setRating] = useState('4.0');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});

  const [filterDestId, setFilterDestId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const destRes = await tripService.getDestinations();
      const sortedList = (destRes.destinations || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setDestinations(sortedList);
      if (sortedList.length > 0) {
        setDestinationId(sortedList[0].id);
        setFilterDestId(sortedList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadRestaurantsForDest = async (targetId) => {
    const destToFetch = targetId || filterDestId;
    if (!destToFetch) return;
    try {
      const res = await adminService.getRestaurants(destToFetch);
      setRestaurants(res.restaurants || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (filterDestId) {
      loadRestaurantsForDest(filterDestId);
    }
  }, [filterDestId]);

  const togglePresetCuisine = (preset) => {
    const exists = cuisines.some(c => c.toLowerCase() === preset.toLowerCase());
    if (exists) {
      setCuisines(cuisines.filter(c => c.toLowerCase() !== preset.toLowerCase()));
    } else {
      setCuisines([...cuisines, preset]);
      if (errors.cuisine) setErrors(prev => ({ ...prev, cuisine: '' }));
    }
  };

  const addCustomCuisine = () => {
    const trimmed = customCuisine.trim();
    if (!trimmed) return;

    const newItems = trimmed
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0 && !cuisines.some(c => c.toLowerCase() === item.toLowerCase()));

    if (newItems.length > 0) {
      setCuisines([...cuisines, ...newItems]);
      if (errors.cuisine) setErrors(prev => ({ ...prev, cuisine: '' }));
    }
    setCustomCuisine('');
  };

  const removeCuisine = (indexToRemove) => {
    setCuisines(cuisines.filter((_, idx) => idx !== indexToRemove));
  };

  const clearAllCuisines = () => {
    setCuisines([]);
  };

  const resetForm = () => {
    setName('');
    setCuisines(['Local Cuisine']);
    setCustomCuisine('');
    setAvgCost('');
    setRating('4.0');
    setAddress('');
    setEditId(null);
    setErrors({});
    setIsFormOpen(false);
  };

  const handleEditClick = (r) => {
    setEditId(r.id);
    setDestinationId(r.destination_id);
    setName(r.name || '');
    if (r.cuisine) {
      const parsed = r.cuisine.split(',').map(s => s.trim()).filter(Boolean);
      setCuisines(parsed.length > 0 ? parsed : [r.cuisine.trim()]);
    } else {
      setCuisines(['Local Cuisine']);
    }
    setCustomCuisine('');
    setAvgCost(r.avg_cost !== undefined ? r.avg_cost : '');
    setRating(r.rating !== undefined ? r.rating : '4.0');
    setAddress(r.address || '');
    setErrors({});
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateRestaurantForm = () => {
    const errs = {};
    if (!destinationId) {
      errs.destinationId = 'Please select a destination city.';
    }

    if (!name.trim()) {
      errs.name = 'Restaurant name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Restaurant name must be at least 2 characters.';
    }

    if (!cuisines || cuisines.length === 0) {
      errs.cuisine = 'Please select or add at least one cuisine category.';
    }

    const cost = avgCost !== '' ? parseFloat(avgCost) : NaN;
    if (isNaN(cost) || cost <= 0) {
      errs.avgCost = 'Average cost per person must be greater than ₹0.';
    }

    const rat = rating !== '' ? parseFloat(rating) : NaN;
    if (isNaN(rat) || rat < 1.0 || rat > 5.0) {
      errs.rating = 'Star rating must be between 1.0 and 5.0.';
    }

    if (!address.trim()) {
      errs.address = 'Address location is required.';
    } else if (address.trim().length < 3) {
      errs.address = 'Address location must be at least 3 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!validateRestaurantForm()) {
      setErrorMsg('Please resolve the highlighted validation errors before saving.');
      return;
    }

    const targetDestId = parseInt(destinationId);
    const cuisineString = cuisines.join(', ').trim();
    const payload = {
      destination_id: targetDestId,
      name: name.trim(),
      cuisine: cuisineString,
      avg_cost: parseFloat(avgCost),
      rating: parseFloat(rating),
      address: address.trim()
    };

    setLoading(true);
    try {
      if (editId) {
        await adminService.updateRestaurant(editId, payload);
        setSuccessMsg('Restaurant details updated successfully!');
      } else {
        await adminService.createRestaurant(payload);
        setSuccessMsg('Restaurant entry created successfully!');
      }
      resetForm();
      setFilterDestId(targetDestId);
      await loadRestaurantsForDest(targetDestId);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save restaurant details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await adminService.deleteRestaurant(deleteTargetId);
      setSuccessMsg('Restaurant deleted successfully.');
      await loadRestaurantsForDest(filterDestId);
    } catch (err) {
      setErrorMsg('Failed to delete restaurant.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const filteredAndSortedRestaurants = [...restaurants]
    .filter((restaurant) => {
      const query = searchQuery.toLowerCase();
      return (
        restaurant.name?.toLowerCase().includes(query) ||
        restaurant.cuisine?.toLowerCase().includes(query) ||
        restaurant.address?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (loading && destinations.length === 0) {
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Restaurant Management</h1>
          <p className="text-xs text-luxuryMuted font-semibold">Regulate food & dining parameters, multiple cuisine categories, average meal budgets, and location addresses.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => {
              setDestinationId(filterDestId || (destinations.length > 0 ? destinations[0].id : ''));
              setIsFormOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-5 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-luxury text-xs font-extrabold uppercase tracking-wider shadow-lg transition-all flex items-center space-x-1.5"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Restaurant</span>
          </button>
        )}
      </div>

      {successMsg && <p className="text-xs text-primary font-bold animate-pulse">{successMsg}</p>}
      {errorMsg && <p className="text-xs text-danger font-bold flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1" /> {errorMsg}</p>}

      {/* Destination filter selector */}
      {!isFormOpen && (
        <div className="bg-luxurySurface p-4.5 rounded-luxury border border-white/5 shadow-xl flex items-center space-x-3.5">
          <Utensils className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Select Destination to View:</span>
          <select
            value={filterDestId}
            onChange={(e) => setFilterDestId(e.target.value)}
            className="bg-luxuryBg border border-white/5 text-xs px-3.5 py-2.5 rounded-luxury focus:outline-none text-white font-bold"
          >
            {destinations.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
            ))}
          </select>
        </div>
      )}

      {/* Editor Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-luxurySurface p-6 sm:p-8 rounded-luxury border border-white/5 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-white">{editId ? 'Modify Restaurant Parameters' : 'Add New Restaurant Option'}</h3>
            <button type="button" onClick={resetForm} className="p-2 rounded-xl hover:bg-luxuryBg text-slate-500"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Select Destination City *</label>
              <select
                value={destinationId}
                onChange={(e) => {
                  setDestinationId(e.target.value);
                  if (errors.destinationId) setErrors(prev => ({ ...prev, destinationId: '' }));
                }}
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                  errors.destinationId ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
              >
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
                ))}
              </select>
              {errors.destinationId && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.destinationId}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Restaurant Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                required
                placeholder="e.g. Rapsy Restaurant"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                  errors.name ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              {errors.name && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.name}
                </span>
              )}
            </div>

            {/* Multi-Cuisine Selector Section (Spans 2 columns) */}
            <div className="sm:col-span-2 space-y-3 p-4.5 bg-luxuryBg/80 rounded-2xl border border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <label className="text-[10px] uppercase font-extrabold tracking-widest text-slate-300 flex items-center">
                    <Utensils className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    Cuisine Categories (Multiple Select) *
                  </label>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                    {cuisines.length} {cuisines.length === 1 ? 'Cuisine' : 'Cuisines'} Selected
                  </span>
                </div>

                {cuisines.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllCuisines}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-colors uppercase tracking-wider text-left sm:text-right"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Active Selected Cuisines Badges Area */}
              <div className={`p-3 rounded-xl min-h-[52px] transition-all flex flex-wrap items-center gap-2 ${
                errors.cuisine 
                  ? 'bg-rose-950/20 border border-rose-500/50 ring-1 ring-rose-500/20' 
                  : 'bg-luxurySurface border border-white/10'
              }`}>
                {cuisines.length > 0 ? (
                  cuisines.map((c, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-luxury bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/40 text-white font-bold text-xs shadow-sm animate-fade-in"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => removeCuisine(idx)}
                        className="p-0.5 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-colors ml-1"
                        title={`Remove ${c}`}
                        aria-label={`Remove ${c}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic font-medium">
                    No cuisines selected. Choose from the presets below or type a custom cuisine.
                  </span>
                )}
              </div>

              {errors.cuisine && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.cuisine}
                </span>
              )}

              {/* Custom Cuisine Adder Bar */}
              <div className="flex items-center space-x-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customCuisine}
                    onChange={(e) => setCustomCuisine(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomCuisine();
                      }
                    }}
                    placeholder="Type custom cuisine (e.g. Malabar Seafood, Mughlai) & press Enter"
                    className="w-full text-xs bg-luxurySurface border border-white/10 rounded-luxury px-3.5 py-2.5 focus:outline-none focus:border-primary text-white font-semibold placeholder-slate-500 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCustomCuisine}
                  className="px-4 py-2.5 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/40 hover:border-transparent rounded-luxury text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Preset Quick-Select Chips */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block flex items-center">
                  <Tag className="h-3 w-3 mr-1 text-accent" /> Popular Cuisines (Click to toggle)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESET_CUISINES.map((preset) => {
                    const isSelected = cuisines.some(c => c.toLowerCase() === preset.toLowerCase());
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => togglePresetCuisine(preset)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm ring-1 ring-primary/40'
                            : 'bg-luxurySurface hover:bg-white/10 text-slate-400 hover:text-slate-200 border-white/5'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-0.5 text-white" />}
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Avg Cost (Per Person) (₹) *</label>
              <input
                type="number"
                min="1"
                value={avgCost}
                onChange={(e) => {
                  setAvgCost(e.target.value);
                  if (errors.avgCost) setErrors(prev => ({ ...prev, avgCost: '' }));
                }}
                required
                placeholder="e.g. 500"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                  errors.avgCost ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              {errors.avgCost && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.avgCost}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Star Rating (1.0 - 5.0) *</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={rating}
                onChange={(e) => {
                  setRating(e.target.value);
                  if (errors.rating) setErrors(prev => ({ ...prev, rating: '' }));
                }}
                required
                placeholder="e.g. 4.5"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                  errors.rating ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              {errors.rating && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.rating}
                </span>
              )}
            </div>

            <div className="space-y-1.5 font-bold sm:col-span-2">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Address Location *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                }}
                required
                placeholder="e.g. Main Bazar, Munnar"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                  errors.address ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              {errors.address && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.address}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3.5 pt-2 font-extrabold uppercase tracking-wider text-[10px]">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 bg-luxuryBg hover:opacity-90 border border-white/5 text-slate-400 rounded-luxury"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white rounded-luxury flex items-center space-x-1 border border-transparent"
            >
              <Save className="h-4 w-4" />
              <span>{editId ? 'Apply Edits' : 'Save Restaurant'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      {!isFormOpen && (
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search restaurants by name, cuisine, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxurySurface border border-white/5 rounded-luxury text-xs text-white focus:outline-none focus:border-primary/50 font-bold transition-all placeholder-slate-500"
          />
        </div>
      )}

      {/* Restaurant Listings Grid */}
      {!isFormOpen && (
        <div className="bg-luxurySurface rounded-luxury border border-white/5 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-luxuryBg text-slate-500 border-b border-white/5 font-extrabold uppercase tracking-widest text-[9px]">
                  <th className="p-4 pl-6">S.No.</th>
                  <th className="p-4">Restaurant Name</th>
                  <th className="p-4">Cuisines</th>
                  <th className="p-4">Avg Cost (Per Person)</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Address Location</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRestaurants.map((r, index) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-luxuryBg/30 transition-colors font-semibold">
                    <td className="p-4 pl-6 text-slate-400 font-bold">{index + 1}</td>
                    <td className="p-4 font-extrabold text-white py-4">
                      <span>{r.name}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {r.cuisine ? (
                          r.cuisine.split(',').map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold"
                            >
                              {c.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Unspecified</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-black text-white">₹{parseInt(r.avg_cost).toLocaleString()}</td>
                    <td className="p-4 text-amber-500 font-bold">⭐ {r.rating}</td>
                    <td className="p-4 text-slate-400">{r.address || 'Local Town'}</td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => handleEditClick(r)}
                          className="p-2 bg-luxuryBg hover:bg-primary/10 text-primary rounded-xl border border-white/5 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(r.id)}
                          className="p-2 bg-luxuryBg hover:bg-rose-500/10 text-rose-500 rounded-xl border border-white/5 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedRestaurants.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-luxuryMuted font-bold">
                      {searchQuery ? "No restaurants match your search query." : "No restaurants registered under this destination. Add a new dining option!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-luxurySurface w-full max-w-md rounded-luxury border border-white/5 shadow-2xl p-6 space-y-6 text-left relative"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                Confirm Deletion
              </h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-luxuryBg text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              Are you sure you want to delete this restaurant option? All associated details and dining selections referencing this option may be affected. This action cannot be undone.
            </p>

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
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-luxury border border-transparent transition-all shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
