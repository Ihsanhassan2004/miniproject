import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, X, Save, AlertCircle, Search, Globe, ExternalLink } from 'lucide-react';
import { tripService, adminService } from '../../services/api';
import { motion } from 'framer-motion';

export default function ManageHotels() {
  const [hotels, setHotels] = useState([]);
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
  const [hotelType, setHotelType] = useState('Hotel');
  const [pricePerNight, setPricePerNight] = useState('');
  const [rating, setRating] = useState('4.0');
  const [address, setAddress] = useState('');
  const [totalRooms, setTotalRooms] = useState('10');
  const [website, setWebsite] = useState('');
  const [amenities, setAmenities] = useState('');
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

  const loadHotelsForDest = async (targetId) => {
    const destToFetch = targetId || filterDestId;
    if (!destToFetch) return;
    try {
      const res = await adminService.getHotels(destToFetch);
      setHotels(res.hotels || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Whenever filterDestId changes, load hotels for that destination
  useEffect(() => {
    if (filterDestId) {
      loadHotelsForDest(filterDestId);
    }
  }, [filterDestId]);

  const resetForm = () => {
    setName('');
    setHotelType('Hotel');
    setPricePerNight('');
    setRating('4.0');
    setAddress('');
    setTotalRooms('10');
    setWebsite('');
    setAmenities('');
    setEditId(null);
    setErrors({});
    setIsFormOpen(false);
  };

  const handleEditClick = (h) => {
    setEditId(h.id);
    setDestinationId(h.destination_id);
    setName(h.name || '');
    setHotelType(h.hotel_type || 'Hotel');
    setPricePerNight(h.price_per_night !== undefined ? h.price_per_night : '');
    setRating(h.rating !== undefined ? h.rating : '4.0');
    setAddress(h.address || '');
    setTotalRooms(h.total_rooms !== undefined ? h.total_rooms : '10');
    setWebsite(h.website || '');
    setAmenities(h.amenities || '');
    setErrors({});
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateHotelForm = () => {
    const errs = {};
    if (!destinationId) {
      errs.destinationId = 'Please select a destination city.';
    }

    if (!name.trim()) {
      errs.name = 'Accommodation name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Accommodation name must be at least 2 characters.';
    }

    if (!hotelType.trim()) {
      errs.hotelType = 'Hotel type is required (e.g. Hotel, Resort, Homestay).';
    } else if (hotelType.trim().length < 2) {
      errs.hotelType = 'Hotel type must be at least 2 characters.';
    }

    const price = pricePerNight !== '' ? parseFloat(pricePerNight) : NaN;
    if (isNaN(price) || price <= 0) {
      errs.pricePerNight = 'Price per day must be greater than ₹0.';
    }

    const rat = rating !== '' ? parseFloat(rating) : NaN;
    if (isNaN(rat) || rat < 1.0 || rat > 5.0) {
      errs.rating = 'Star rating must be between 1.0 and 5.0.';
    }

    const tot = totalRooms !== '' ? parseInt(totalRooms) : NaN;
    if (isNaN(tot) || tot < 1) {
      errs.totalRooms = 'Total rooms capacity must be at least 1.';
    }

    if (!address.trim()) {
      errs.address = 'Address location is required.';
    } else if (address.trim().length < 5) {
      errs.address = 'Address must be at least 5 characters long.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!validateHotelForm()) {
      setErrorMsg('Please resolve the highlighted validation errors before saving.');
      return;
    }

    const targetDestId = parseInt(destinationId);
    const payload = {
      destination_id: targetDestId,
      name: name.trim(),
      hotel_type: hotelType.trim(),
      price_per_night: parseFloat(pricePerNight),
      rating: parseFloat(rating),
      address: address.trim(),
      total_rooms: parseInt(totalRooms),
      website: website.trim(),
      amenities: amenities.trim()
    };

    setLoading(true);
    try {
      if (editId) {
        await adminService.updateHotel(editId, payload);
        setSuccessMsg('Hotel details updated successfully!');
      } else {
        await adminService.createHotel(payload);
        setSuccessMsg('Hotel entry created successfully!');
      }
      resetForm();
      setFilterDestId(targetDestId);
      await loadHotelsForDest(targetDestId);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save hotel details.');
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
      await adminService.deleteHotel(deleteTargetId);
      setSuccessMsg('Hotel deleted successfully.');
      await loadHotelsForDest(filterDestId);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete hotel.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const filteredAndSortedHotels = [...hotels]
    .filter((hotel) => {
      const query = searchQuery.toLowerCase();
      return (
        hotel.name?.toLowerCase().includes(query) ||
        hotel.hotel_type?.toLowerCase().includes(query) ||
        hotel.website?.toLowerCase().includes(query) ||
        hotel.amenities?.toLowerCase().includes(query) ||
        hotel.address?.toLowerCase().includes(query)
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Accommodation Management</h1>
          <p className="text-xs text-luxuryMuted font-semibold">Regulate accommodation listings, total rooms capacity, pricing per day, and official website links.</p>
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
            <span>Add Accommodation</span>
          </button>
        )}
      </div>

      {successMsg && <p className="text-xs text-primary font-bold animate-pulse">{successMsg}</p>}
      {errorMsg && <p className="text-xs text-danger font-bold flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1" /> {errorMsg}</p>}

      {/* Destination filter selector */}
      {!isFormOpen && (
        <div className="bg-luxurySurface p-4.5 rounded-luxury border border-white/5 shadow-xl flex items-center space-x-3.5">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest">Select Destination to View:</span>
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
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-white">{editId ? 'Modify Accommodation Parameters' : 'Add New Accommodation Option'}</h3>
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
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Accommodation / Resort Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                required
                placeholder="e.g. Whispering Palms Resort"
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

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Hotel Type *</label>
              <input
                type="text"
                value={hotelType}
                onChange={(e) => {
                  setHotelType(e.target.value);
                  if (errors.hotelType) setErrors(prev => ({ ...prev, hotelType: '' }));
                }}
                required
                placeholder="e.g. Resort, Hotel, Homestay"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                  errors.hotelType ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              {errors.hotelType && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.hotelType}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Price per Day (₹) *</label>
              <input
                type="number"
                min="1"
                value={pricePerNight}
                onChange={(e) => {
                  setPricePerNight(e.target.value);
                  if (errors.pricePerNight) setErrors(prev => ({ ...prev, pricePerNight: '' }));
                }}
                required
                placeholder="e.g. 3500"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                  errors.pricePerNight ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              {errors.pricePerNight && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.pricePerNight}
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

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Total Rooms Capacity *</label>
              <input
                type="number"
                min="1"
                value={totalRooms}
                onChange={(e) => {
                  setTotalRooms(e.target.value);
                  if (errors.totalRooms) setErrors(prev => ({ ...prev, totalRooms: '' }));
                }}
                required
                placeholder="e.g. 20"
                className={`w-full text-xs bg-luxuryBg border rounded-luxury p-3 focus:outline-none text-white font-bold transition-all ${
                  errors.totalRooms ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              {errors.totalRooms && (
                <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 shrink-0" /> {errors.totalRooms}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Hotel Website / Booking Link</label>
            <div className="relative">
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://www.teavalleyresort.com"
                className="w-full text-xs bg-luxuryBg border border-white/5 rounded-luxury p-3 focus:outline-none text-white font-bold placeholder-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Address Location *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
              }}
              required
              placeholder="e.g. Near Lake View Point, Munnar"
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

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Offered Amenities (Comma Separated)</label>
            <input
              type="text"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="e.g. Free Wifi, Pool, Breakfast, Spa"
              className="w-full text-xs bg-luxuryBg border border-white/5 rounded-luxury p-3 focus:outline-none text-white font-bold"
            />
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
              <span>{editId ? 'Apply Edits' : 'Save Accommodation'}</span>
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
            placeholder="Search accommodations by name, type, website, amenities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxurySurface border border-white/5 rounded-luxury text-xs text-white focus:outline-none focus:border-primary/50 font-bold transition-all placeholder-slate-500"
          />
        </div>
      )}

      {/* Hotel Listings Grid */}
      {!isFormOpen && (
        <div className="bg-luxurySurface rounded-luxury border border-white/5 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-luxuryBg text-slate-500 border-b border-white/5 font-extrabold uppercase tracking-widest text-[9px]">
                  <th className="p-4 pl-6">S.No.</th>
                  <th className="p-4">Hotel / Type</th>
                  <th className="p-4">Total Rooms</th>
                  <th className="p-4">Per Day</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Official Website</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedHotels.map((h, index) => (
                  <tr key={h.id} className="border-b border-white/5 hover:bg-luxuryBg/30 transition-colors font-semibold">
                    <td className="p-4 pl-6 text-slate-400 font-bold">{index + 1}</td>
                    <td className="p-4 font-extrabold text-white py-4">
                      <div>
                        <span>{h.name}</span>
                        <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider mt-0.5">{h.hotel_type}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-300">{h.total_rooms} rooms</td>
                    <td className="p-4 font-black text-white">₹{parseInt(h.price_per_night).toLocaleString()}</td>
                    <td className="p-4 text-amber-500 font-bold">⭐ {h.rating}</td>
                    <td className="p-4 text-slate-300">
                      {h.website ? (
                        <a
                          href={h.website.startsWith('http') ? h.website : `https://${h.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:text-accent font-bold text-xs transition-colors group"
                        >
                          <Globe className="h-3.5 w-3.5 mr-1 text-primary group-hover:text-accent shrink-0" />
                          <span>Visit Website</span>
                          <ExternalLink className="h-3 w-3 ml-1 opacity-70 group-hover:opacity-100 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Not Provided</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => handleEditClick(h)}
                          className="p-2 bg-luxuryBg hover:bg-primary/10 text-primary rounded-xl border border-white/5 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(h.id)}
                          className="p-2 bg-luxuryBg hover:bg-rose-500/10 text-rose-500 rounded-xl border border-white/5 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedHotels.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-luxuryMuted font-bold">No hotels registered under this destination. Add a new hotel listing!</td>
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
              Are you sure you want to delete this accommodation option? All associated listings and travel bookings referencing this hotel may be affected. This action cannot be undone.
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
