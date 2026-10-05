import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, X, Save, AlertCircle, Search, ZoomIn, Eye, Image as ImageIcon } from 'lucide-react';
import { tripService, adminService } from '../../services/api';
import { motion } from 'framer-motion';
import ImageModal from '../../components/ImageModal';

export default function ManageDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('hill station');
  const [description, setDescription] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [localCities, setLocalCities] = useState('');
  const [errors, setErrors] = useState({});

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Attraction Management State
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [selectedDestForAttr, setSelectedDestForAttr] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [loadingAttr, setLoadingAttr] = useState(false);
  const [attrSuccessMsg, setAttrSuccessMsg] = useState('');
  const [attrErrorMsg, setAttrErrorMsg] = useState('');

  // Attraction Form State
  const [isAttrFormOpen, setIsAttrFormOpen] = useState(false);
  const [editAttrId, setEditAttrId] = useState(null);
  const [attrName, setAttrName] = useState('');
  const [attrDesc, setAttrDesc] = useState('');
  const [attrFee, setAttrFee] = useState('');
  const [attrTime, setAttrTime] = useState('2 Hours');
  const [attrImage, setAttrImage] = useState('');
  const [attrErrors, setAttrErrors] = useState({});
  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState(null);

  const [submittingAttr, setSubmittingAttr] = useState(false);

  const loadDestinations = async () => {
    setLoading(true);
    try {
      const res = await tripService.getDestinations();
      setDestinations(res.destinations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  const resetForm = () => {
    setName('');
    setState('');
    setCity('');
    setCategory('hill station');
    setDescription('');
    setBestTime('');
    setBudgetMin('');
    setBudgetMax('');
    setImageUrl('');
    setLocalCities('');
    setEditId(null);
    setErrors({});
    setIsFormOpen(false);
  };

  const handleEditClick = (dest) => {
    setEditId(dest.id);
    setName(dest.name || '');
    setState(dest.state || '');
    setCity(dest.city || '');
    setCategory(dest.category || 'hill station');
    setDescription(dest.description || '');
    setBestTime(dest.best_time || '');
    setBudgetMin(dest.budget_min || '');
    setBudgetMax(dest.budget_max || '');
    setImageUrl(dest.image_url || '');
    setLocalCities(dest.local_cities || '');
    setErrors({});
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateDestinationForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Destination name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Destination name must be at least 2 characters.';
    }

    if (!category) {
      errs.category = 'Please select a preferred category.';
    }

    if (!city.trim()) {
      errs.city = 'City name is required.';
    } else if (city.trim().length < 2) {
      errs.city = 'City name must be at least 2 characters.';
    }

    if (!state.trim()) {
      errs.state = 'State / region is required.';
    } else if (state.trim().length < 2) {
      errs.state = 'State / region must be at least 2 characters.';
    }

    const minB = budgetMin !== '' ? parseFloat(budgetMin) : 5000;
    const maxB = budgetMax !== '' ? parseFloat(budgetMax) : 15000;

    if (isNaN(minB) || minB < 0) {
      errs.budgetMin = 'Minimum budget must be ₹0 or greater.';
    }
    if (isNaN(maxB) || maxB < 0) {
      errs.budgetMax = 'Maximum budget must be a positive number.';
    } else if (minB > maxB) {
      errs.budgetMax = 'Maximum budget cannot be less than minimum budget.';
    }

    if (!bestTime.trim()) {
      errs.bestTime = 'Best travel period is required (e.g. October to March).';
    } else if (bestTime.trim().length < 2) {
      errs.bestTime = 'Best travel period must be at least 2 characters.';
    }

    if (imageUrl.trim()) {
      if (!imageUrl.trim().startsWith('http://') && !imageUrl.trim().startsWith('https://') && !imageUrl.trim().startsWith('/')) {
        errs.imageUrl = 'Image URL must start with http://, https://, or /.';
      }
    }

    if (!description.trim()) {
      errs.description = 'Description is required.';
    } else if (description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters long.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!validateDestinationForm()) {
      setErrorMsg('Please resolve the highlighted validation errors before saving.');
      return;
    }

    const payload = {
      name: name.trim(),
      state: state.trim(),
      city: city.trim(),
      category: category.toLowerCase(),
      description: description.trim(),
      best_time: bestTime.trim(),
      budget_min: budgetMin !== '' ? parseFloat(budgetMin) : 5000,
      budget_max: budgetMax !== '' ? parseFloat(budgetMax) : 15000,
      image_url: imageUrl.trim(),
      local_cities: localCities.trim()
    };

    setLoading(true);
    try {
      if (editId) {
        await adminService.updateDestination(editId, payload);
        setSuccessMsg('Destination updated successfully!');
      } else {
        await adminService.createDestination(payload);
        setSuccessMsg('Destination created successfully!');
      }
      resetForm();
      loadDestinations();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save destination details.');
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
      await adminService.deleteDestination(deleteTargetId);
      setSuccessMsg('Destination deleted successfully.');
      loadDestinations();
    } catch (err) {
      console.error("Delete destination failed:", err);
      setErrorMsg(err.response?.data?.message || 'Failed to delete destination.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  // Open modal and fetch attractions
  const handleAttractionsClick = async (dest) => {
    setSelectedDestForAttr(dest);
    setIsAttrModalOpen(true);
    setLoadingAttr(true);
    setAttrSuccessMsg('');
    setAttrErrorMsg('');
    setIsAttrFormOpen(false);
    setAttrErrors({});

    try {
      const res = await tripService.getDestinationDetail(dest.id);
      setAttractions(res.destination.attractions || []);
    } catch (err) {
      console.error(err);
      setAttrErrorMsg('Failed to load attractions.');
    } finally {
      setLoadingAttr(false);
    }
  };

  const closeAttrModal = () => {
    setIsAttrModalOpen(false);
    setSelectedDestForAttr(null);
    setAttractions([]);
    setEditAttrId(null);
    setAttrErrors({});
    setIsAttrFormOpen(false);
  };

  // Prepare edit attraction
  const handleEditAttrClick = (attr) => {
    setEditAttrId(attr.id);
    setAttrName(attr.name || '');
    setAttrDesc(attr.description || '');
    setAttrFee(attr.entry_fee !== undefined ? attr.entry_fee : '');
    setAttrTime(attr.visit_time || '2 Hours');
    setAttrImage(attr.image_url || '');
    setAttrErrors({});
    setIsAttrFormOpen(true);
  };

  const validateAttrForm = () => {
    const errs = {};
    if (!attrName.trim()) {
      errs.attrName = 'Attraction name is required.';
    } else if (attrName.trim().length < 2) {
      errs.attrName = 'Attraction name must be at least 2 characters.';
    }

    const fee = attrFee !== '' ? parseFloat(attrFee) : 0;
    if (isNaN(fee) || fee < 0) {
      errs.attrFee = 'Entry fee must be ₹0 or greater.';
    }

    if (!attrTime.trim()) {
      errs.attrTime = 'Visit duration is required (e.g. 2 Hours).';
    }

    if (!attrDesc.trim()) {
      errs.attrDesc = 'Attraction description is required.';
    } else if (attrDesc.trim().length < 5) {
      errs.attrDesc = 'Description must be at least 5 characters.';
    }

    setAttrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit new or edited attraction
  const handleAttrSubmit = async (e) => {
    e.preventDefault();
    setAttrSuccessMsg('');
    setAttrErrorMsg('');

    if (!validateAttrForm()) {
      setAttrErrorMsg('Please resolve attraction form errors.');
      return;
    }

    const payload = {
      destination_id: parseInt(selectedDestForAttr.id),
      name: attrName.trim(),
      description: attrDesc.trim(),
      entry_fee: attrFee !== '' ? parseFloat(attrFee) : 0.0,
      visit_time: attrTime.trim() || '2 Hours',
      image_url: attrImage.trim()
    };

    setSubmittingAttr(true);

    try {
      if (editAttrId) {
        await adminService.updateAttraction(editAttrId, payload);
        setAttrSuccessMsg('Attraction updated successfully!');
      } else {
        await adminService.createAttraction(payload);
        setAttrSuccessMsg('Attraction created successfully!');
      }

      // Reset form
      setAttrName('');
      setAttrDesc('');
      setAttrFee('');
      setAttrTime('2 Hours');
      setAttrImage('');
      setEditAttrId(null);
      setAttrErrors({});
      setIsAttrFormOpen(false);

      // Reload attractions
      setLoadingAttr(true);
      const res = await tripService.getDestinationDetail(selectedDestForAttr.id);
      setAttractions(res.destination.attractions || []);
    } catch (err) {
      console.error(err);
      setAttrErrorMsg(err.response?.data?.message || 'Failed to save attraction details.');
    } finally {
      setSubmittingAttr(false);
      setLoadingAttr(false);
    }
  };

  // Delete attraction
  const handleDeleteAttr = async (attrId) => {
    if (!window.confirm('Are you sure you want to delete this attraction?')) return;

    setAttrSuccessMsg('');
    setAttrErrorMsg('');
    try {
      await adminService.deleteAttraction(attrId);
      setAttrSuccessMsg('Attraction deleted successfully.');

      // Reload attractions
      setLoadingAttr(true);
      const res = await tripService.getDestinationDetail(selectedDestForAttr.id);
      setAttractions(res.destination.attractions || []);
    } catch (err) {
      console.error(err);
      setAttrErrorMsg(err.response?.data?.message || 'Failed to delete attraction.');
    } finally {
      setLoadingAttr(false);
    }
  };

  const filteredAndSortedDestinations = [...destinations]
    .filter((dest) => {
      const query = searchQuery.toLowerCase();
      return (
        dest.name?.toLowerCase().includes(query) ||
        dest.city?.toLowerCase().includes(query) ||
        dest.state?.toLowerCase().includes(query) ||
        dest.category?.toLowerCase().includes(query)
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Manage Destinations</h1>
          <p className="text-xs text-luxuryMuted font-semibold">Add, edit, or delete tourist locations catalog entries.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => {
              setIsFormOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-5 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-luxury text-xs font-extrabold uppercase tracking-wider shadow-lg transition-all flex items-center space-x-1.5"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Destination</span>
          </button>
        )}
      </div>

      {successMsg && <p className="text-xs text-primary font-bold animate-pulse">{successMsg}</p>}
      {errorMsg && <p className="text-xs text-danger font-bold flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1" /> {errorMsg}</p>}

      {/* Editor Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-luxurySurface p-6 sm:p-8 rounded-luxury border border-white/5 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-white">{editId ? 'Modify Destination Details' : 'Register New Destination'}</h3>
            <button type="button" onClick={resetForm} className="p-2 rounded-xl hover:bg-luxuryBg text-slate-500"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Destination Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                required
                placeholder="e.g. Munnar"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.name ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                  }`}
              />
              {errors.name && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.name}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Preferred Category *</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                }}
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.category ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                  }`}
              >
                <option value="hill station">Hill Station</option>
                <option value="beach">Beach</option>
                <option value="heritage">Heritage</option>
                <option value="adventure">Adventure</option>
                <option value="nature">Nature & Wildlife</option>
                <option value="pilgrimage">Pilgrimage</option>
                <option value="city tourism">City Tourism</option>
              </select>
              {errors.category && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.category}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">City Name *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                }}
                required
                placeholder="e.g. Idukki"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.city ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                  }`}
              />
              {errors.city && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.city}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">State Region *</label>
              <input
                type="text"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
                }}
                required
                placeholder="e.g. Kerala"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.state ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                  }`}
              />
              {errors.state && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.state}
                </span>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Local Cities / Route Stops (comma-separated)</label>
              <input
                type="text"
                value={localCities}
                onChange={(e) => setLocalCities(e.target.value)}
                placeholder="e.g. Vattavada, Munnar Local, Devikulam"
                className="w-full text-xs bg-luxuryBg border border-white/5 rounded-luxury p-3 focus:outline-none text-white font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Budget Minimum (₹) *</label>
              <input
                type="number"
                min="0"
                value={budgetMin}
                onChange={(e) => {
                  setBudgetMin(e.target.value);
                  if (errors.budgetMin || errors.budgetMax) {
                    setErrors(prev => ({ ...prev, budgetMin: '', budgetMax: '' }));
                  }
                }}
                placeholder="e.g. 5000"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.budgetMin ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                  }`}
              />
              {errors.budgetMin && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.budgetMin}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Budget Maximum (₹) *</label>
              <input
                type="number"
                min="0"
                value={budgetMax}
                onChange={(e) => {
                  setBudgetMax(e.target.value);
                  if (errors.budgetMax) setErrors(prev => ({ ...prev, budgetMax: '' }));
                }}
                placeholder="e.g. 15000"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.budgetMax ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                  }`}
              />
              {errors.budgetMax && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.budgetMax}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Best Travel Period *</label>
              <input
                type="text"
                value={bestTime}
                onChange={(e) => {
                  setBestTime(e.target.value);
                  if (errors.bestTime) setErrors(prev => ({ ...prev, bestTime: '' }));
                }}
                required
                placeholder="e.g. September to March"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.bestTime ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                  }`}
              />
              {errors.bestTime && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.bestTime}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block flex items-center">
                <Plus className="h-3.5 w-3.5 mr-1" /> Image Landscape URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (errors.imageUrl) setErrors(prev => ({ ...prev, imageUrl: '' }));
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.imageUrl ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                    }`}
                />
                {imageUrl.trim() && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage({
                      url: imageUrl.trim(),
                      title: name || 'Destination Preview',
                      subtitle: city ? `${city}, ${state}` : 'Image Preview',
                      description: description || 'Destination cover photo'
                    })}
                    className="p-3 bg-luxuryBg hover:bg-primary/20 text-primary border border-white/10 rounded-luxury transition-all shrink-0 cursor-pointer shadow-sm"
                    title="Click to preview image"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
              </div>
              {errors.imageUrl && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.imageUrl}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">About & Local Environment Summary *</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              required
              placeholder="Describe tourist points, local highlights, altitude, etc. (min 10 characters)"
              rows="3"
              className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${errors.description ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
            ></textarea>
            {errors.description && (
              <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.description}
              </span>
            )}
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
              <span>{editId ? 'Apply Edits' : 'Save Destination'}</span>
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
            placeholder="Search destinations by name, city, state, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxurySurface border border-white/5 rounded-luxury text-xs text-white focus:outline-none focus:border-primary/50 font-bold transition-all placeholder-slate-500"
          />
        </div>
      )}

      {/* Grid listing */}
      <div className="bg-luxurySurface rounded-luxury border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-luxuryBg text-slate-500 border-b border-white/5 font-extrabold uppercase tracking-widest text-[9px]">
                <th className="p-4 pl-6">S.No.</th>
                <th className="p-4">Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Category</th>
                <th className="p-4">Best Period</th>
                <th className="p-4">Budget Span(Per Head)</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDestinations.map((dest, index) => (
                <tr key={dest.id} className="border-b border-white/5 hover:bg-luxuryBg/30 transition-colors font-semibold">
                  <td className="p-4 pl-6 text-slate-400 font-bold">{index + 1}</td>
                  <td className="p-4 font-extrabold text-white py-4">
                    <div className="flex items-center space-x-3">
                      {dest.image_url ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage({
                            url: dest.image_url,
                            title: dest.name,
                            subtitle: `${dest.city}, ${dest.state} • ${dest.category}`,
                            description: dest.description
                          })}
                          className="group relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary shrink-0 cursor-pointer shadow-md transition-all"
                          title="Click to view destination photo"
                        >
                          <img
                            src={dest.image_url}
                            alt={dest.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-115"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="h-4 w-4 text-white drop-shadow-md" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-luxuryBg border border-white/5 flex items-center justify-center text-slate-600 shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <div>{dest.name}</div>

                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">
                    <div>{dest.city}, {dest.state}</div>
                    {dest.local_cities && (
                      <div className="text-[10px] text-luxuryMuted mt-0.5 font-bold">Local: {dest.local_cities}</div>
                    )}
                  </td>
                  <td className="p-4 text-primary uppercase text-[9px] tracking-wider font-bold">{dest.category}</td>
                  <td className="p-4 text-slate-400">{dest.best_time}</td>
                  <td className="p-4 font-black text-white">₹{parseInt(dest.budget_min).toLocaleString()} - ₹{parseInt(dest.budget_max).toLocaleString()}</td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2.5">
                      <button
                        onClick={() => handleAttractionsClick(dest)}
                        className="p-2 bg-luxuryBg hover:bg-cyan-500/10 text-cyan-400 rounded-xl border border-white/5 transition-colors flex items-center space-x-1"
                        title="Manage Attractions"
                        aria-label="Manage Attractions"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold px-0.5">Attractions</span>
                      </button>
                      <button
                        onClick={() => handleEditClick(dest)}
                        className="p-2 bg-luxuryBg hover:bg-primary/10 text-primary rounded-xl border border-white/5 transition-colors"
                        aria-label="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(dest.id)}
                        className="p-2 bg-luxuryBg hover:bg-rose-500/10 text-rose-500 rounded-xl border border-white/5 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attractions Modal */}
      {isAttrModalOpen && selectedDestForAttr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-luxurySurface w-full max-w-4xl rounded-luxury border border-white/5 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative animate-fade-in text-left">

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                  Attractions in {selectedDestForAttr.name}
                </h3>
                <p className="text-[11px] text-luxuryMuted mt-1">
                  Manage points of interest and landmarks.
                </p>
              </div>
              <button
                onClick={closeAttrModal}
                className="p-2 rounded-xl hover:bg-luxuryBg text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error & Success Messages */}
            {attrSuccessMsg && <p className="text-xs text-primary font-bold animate-pulse">{attrSuccessMsg}</p>}
            {attrErrorMsg && <p className="text-xs text-rose-500 font-bold flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1" /> {attrErrorMsg}</p>}

            {/* Two-Column Grid: Left: List, Right: Form (if open or editing) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left: Attractions List */}
              <div className={`${isAttrFormOpen ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                    Current Attractions ({attractions.length})
                  </h4>
                  {!isAttrFormOpen && (
                    <button
                      onClick={() => {
                        setIsAttrFormOpen(true);
                        setEditAttrId(null);
                        setAttrName('');
                        setAttrDesc('');
                        setAttrFee('');
                        setAttrTime('2 Hours');
                        setAttrErrors({});
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-primary to-accent text-white rounded-luxury text-[10px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Attraction</span>
                    </button>
                  )}
                </div>

                {loadingAttr ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : attractions.length === 0 ? (
                  <div className="text-center py-12 bg-luxuryBg/40 rounded-luxury border border-dashed border-white/5">
                    <p className="text-xs text-luxuryMuted">No attractions registered for this destination yet.</p>
                  </div>
                ) : (
                  <div className="bg-luxuryBg/40 border border-white/5 rounded-luxury overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-luxuryBg/80 text-slate-500 border-b border-white/5 font-extrabold uppercase tracking-widest text-[9px]">
                            <th className="p-3 pl-4">S.No.</th>
                            <th className="p-3">Name & Description</th>
                            <th className="p-3">Visit Time</th>
                            <th className="p-3">Entry Fee</th>
                            <th className="p-3 pr-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attractions.map((attr, index) => (
                            <tr key={attr.id} className="border-b border-white/5 hover:bg-luxuryBg/20 font-semibold">
                              <td className="p-3 pl-4 text-slate-400 font-bold">{index + 1}</td>
                              <td className="p-3 max-w-[200px] sm:max-w-xs text-left">
                                <div className="flex items-center space-x-2.5">
                                  {attr.image_url ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage({
                                        url: attr.image_url,
                                        title: attr.name,
                                        subtitle: `${selectedDestForAttr?.name || ''} Attraction • ₹${parseFloat(attr.entry_fee || 0) === 0 ? 'Free Entry' : parseFloat(attr.entry_fee).toLocaleString()}`,
                                        description: attr.description
                                      })}
                                      className="group relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 shrink-0 cursor-pointer shadow-md transition-all"
                                      title="Click to view attraction photo"
                                    >
                                      <img
                                        src={attr.image_url}
                                        alt={attr.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-115"
                                      />
                                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <ZoomIn className="h-4 w-4 text-white drop-shadow-md" />
                                      </div>
                                    </button>
                                  ) : null}
                                  <div>
                                    <div className="font-extrabold text-white">{attr.name}</div>
                                    <div className="text-[10px] text-luxuryMuted font-medium line-clamp-2 mt-0.5">{attr.description}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-slate-300 whitespace-nowrap">{attr.visit_time}</td>
                              <td className="p-3 text-white font-bold">
                                {parseFloat(attr.entry_fee) === 0 ? (
                                  <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider">Free</span>
                                ) : (
                                  `₹${parseFloat(attr.entry_fee).toLocaleString()}`
                                )}
                              </td>
                              <td className="p-3 pr-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleEditAttrClick(attr)}
                                    className="p-1.5 bg-luxuryBg hover:bg-primary/10 text-primary rounded-lg border border-white/5 transition-colors"
                                    title="Edit Attraction"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAttr(attr.id)}
                                    className="p-1.5 bg-luxuryBg hover:bg-rose-500/10 text-rose-500 rounded-lg border border-white/5 transition-colors"
                                    title="Delete Attraction"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Add/Edit Attraction Form */}
              {isAttrFormOpen && (
                <div className="lg:col-span-5 bg-luxuryBg/40 border border-white/5 rounded-luxury p-5 space-y-4 h-fit">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h5 className="font-extrabold text-[10px] uppercase tracking-widest text-white">
                      {editAttrId ? 'Modify Attraction' : 'New Attraction Form'}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsAttrFormOpen(false)}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAttrSubmit} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Attraction Name *</label>
                      <input
                        type="text"
                        value={attrName}
                        onChange={(e) => {
                          setAttrName(e.target.value);
                          if (attrErrors.attrName) setAttrErrors(prev => ({ ...prev, attrName: '' }));
                        }}
                        required
                        placeholder="e.g. Eravikulam National Park"
                        className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${attrErrors.attrName ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                          }`}
                      />
                      {attrErrors.attrName && (
                        <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {attrErrors.attrName}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Entry Fee (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={attrFee}
                          onChange={(e) => {
                            setAttrFee(e.target.value);
                            if (attrErrors.attrFee) setAttrErrors(prev => ({ ...prev, attrFee: '' }));
                          }}
                          placeholder="e.g. 150 (0 for Free)"
                          className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${attrErrors.attrFee ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                            }`}
                        />
                        {attrErrors.attrFee && (
                          <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {attrErrors.attrFee}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Visit Duration *</label>
                        <input
                          type="text"
                          value={attrTime}
                          onChange={(e) => {
                            setAttrTime(e.target.value);
                            if (attrErrors.attrTime) setAttrErrors(prev => ({ ...prev, attrTime: '' }));
                          }}
                          required
                          placeholder="e.g. 3 Hours"
                          className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${attrErrors.attrTime ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                            }`}
                        />
                        {attrErrors.attrTime && (
                          <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {attrErrors.attrTime}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Image URL (Optional)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={attrImage}
                          onChange={(e) => setAttrImage(e.target.value)}
                          placeholder="e.g. https://images.unsplash.com/..."
                          className="w-full text-xs bg-luxuryBg border border-white/5 focus:border-primary/50 rounded-luxury p-3 focus:outline-none text-white font-bold transition-all"
                        />
                        {attrImage.trim() && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({
                              url: attrImage.trim(),
                              title: attrName || 'Attraction Preview',
                              subtitle: selectedDestForAttr?.name || 'Attraction Photo',
                              description: attrDesc || ''
                            })}
                            className="p-3 bg-luxuryBg hover:bg-cyan-500/20 text-cyan-400 border border-white/10 rounded-luxury transition-all shrink-0 cursor-pointer shadow-sm"
                            title="Click to preview attraction image"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Description *</label>
                      <textarea
                        value={attrDesc}
                        onChange={(e) => {
                          setAttrDesc(e.target.value);
                          if (attrErrors.attrDesc) setAttrErrors(prev => ({ ...prev, attrDesc: '' }));
                        }}
                        required
                        placeholder="Brief description about the landmark (min 5 characters)..."
                        rows="3"
                        className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${attrErrors.attrDesc ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                          }`}
                      ></textarea>
                      {attrErrors.attrDesc && (
                        <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {attrErrors.attrDesc}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 font-extrabold uppercase tracking-wider text-[9px]">
                      <button
                        type="button"
                        onClick={() => setIsAttrFormOpen(false)}
                        className="px-4 py-2 bg-luxuryBg hover:opacity-90 border border-white/5 text-slate-400 rounded-luxury"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingAttr}
                        className="px-4 py-2 bg-primary text-white rounded-luxury flex items-center space-x-1"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{editAttrId ? 'Update' : 'Save'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

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
              Are you sure you want to delete this destination? All associated attractions, hotels, and travel plans referencing this destination may be affected. This action cannot be undone.
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

      {/* Image Preview Lightbox Modal */}
      <ImageModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        src={previewImage?.url}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        description={previewImage?.description}
      />

    </div>
  );
}
