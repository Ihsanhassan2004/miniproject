import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Car, X, Save, AlertCircle, Search, 
  Sliders, Calculator, RefreshCw, CheckCircle2, Shield, Fuel, Clock
} from 'lucide-react';
import { tripService, adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageTransportation() {
  const [activeTab, setActiveTab] = useState('rates'); // 'rates' or 'catalog'
  const [transports, setTransports] = useState([]);
  const [transportRates, setTransportRates] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Rate Edit Modal State
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [rateFormData, setRateFormData] = useState({
    transport_type: '',
    category: '',
    base_fare: 0,
    per_km_rate: 0,
    fuel_cost_per_km: 0,
    daily_rental: 0,
    speed_kmh: 45,
    min_distance_km: 0,
    max_distance_km: 3000,
    active: 1
  });

  // Legacy Transit Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Legacy Transit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [destinationId, setDestinationId] = useState('');
  const [transportType, setTransportType] = useState('KSRTC Bus');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [travelTime, setTravelTime] = useState('3 Hours');
  const [fare, setFare] = useState('');
  const [availability, setAvailability] = useState('available');
  const [errors, setErrors] = useState({});
  const [filterDestId, setFilterDestId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // Load destinations
      const destRes = await tripService.getDestinations();
      const sortedList = (destRes.destinations || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setDestinations(sortedList);
      if (sortedList.length > 0) {
        setDestinationId(sortedList[0].id);
        setFilterDestId(sortedList[0].id);
      }

      // Load configurable transport rates
      const ratesRes = await adminService.getTransportRates();
      setTransportRates(ratesRes.rates || []);
    } catch (err) {
      console.error('Failed to load admin transportation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadTransportForDest = async (targetId) => {
    const destToFetch = targetId || filterDestId;
    if (!destToFetch) return;
    try {
      const res = await adminService.getTransport(destToFetch);
      setTransports(res.transportation || res.transports || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (filterDestId) {
      loadTransportForDest(filterDestId);
    }
  }, [filterDestId]);

  // Rate management handlers
  const handleOpenRateEdit = (rate) => {
    setEditingRate(rate);
    setRateFormData({
      transport_type: rate.transport_type || '',
      category: rate.category || '',
      base_fare: parseFloat(rate.base_fare || 0),
      per_km_rate: parseFloat(rate.per_km_rate || 0),
      fuel_cost_per_km: parseFloat(rate.fuel_cost_per_km || 0),
      daily_rental: parseFloat(rate.daily_rental || 0),
      speed_kmh: parseFloat(rate.speed_kmh || 45),
      min_distance_km: parseFloat(rate.min_distance_km || 0),
      max_distance_km: parseFloat(rate.max_distance_km || 3000),
      active: parseInt(rate.active ?? 1)
    });
    setIsRateModalOpen(true);
    setErrorMsg('');
  };

  const handleOpenRateCreate = () => {
    setEditingRate(null);
    setRateFormData({
      transport_type: '',
      category: 'Private Cab',
      base_fare: 300,
      per_km_rate: 18,
      fuel_cost_per_km: 0,
      daily_rental: 0,
      speed_kmh: 48,
      min_distance_km: 5,
      max_distance_km: 1500,
      active: 1
    });
    setIsRateModalOpen(true);
    setErrorMsg('');
  };

  const handleSaveRate = async (e) => {
    e.preventDefault();
    if (!rateFormData.transport_type.trim()) {
      setErrorMsg('Transport type name is required.');
      return;
    }

    setLoading(true);
    try {
      if (editingRate && editingRate.id) {
        await adminService.updateTransportRate(editingRate.id, rateFormData);
        setSuccessMsg(`Rate configuration for "${rateFormData.transport_type}" updated successfully!`);
      } else {
        await adminService.createTransportRate(rateFormData);
        setSuccessMsg(`New transport rate configuration "${rateFormData.transport_type}" created successfully!`);
      }
      setIsRateModalOpen(false);
      const ratesRes = await adminService.getTransportRates();
      setTransportRates(ratesRes.rates || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save transport rate configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Title & Notification Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/70 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center">
            <Car className="h-6 w-6 text-cyan-400 mr-2" />
            Transportation & Dynamic Tariff Engine
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Configure transparent per-km calculation rates, daily rentals, speed formulas, and destination transit routes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-[#0b1528] p-1.5 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('rates')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'rates'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Tariff Rate Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Legacy Transit Records</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg('')} className="p-1 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg('')} className="p-1 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DYNAMIC TRANSPORT RATE ENGINE CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1528] p-4 rounded-2xl border border-slate-700/70">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center">
                <Sliders className="h-3.5 w-3.5 text-cyan-400 mr-1.5" />
                Active Calculation Rates ({transportRates.length} Categories)
              </span>
              <p className="text-[11px] text-slate-400 font-semibold">
                These rates drive all distance-based route fares and transparent cost breakdown calculations.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenRateCreate}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Rate Rule</span>
            </button>
          </div>

          {/* Rates Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[#101b30] shadow-[0_10px_30px_rgba(2,8,23,0.25)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0b1528] text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-700/70">
                  <tr>
                    <th className="py-3 px-4">Transport Mode</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Base Fare</th>
                    <th className="py-3 px-3">Rate / km</th>
                    <th className="py-3 px-3">Daily Rental</th>
                    <th className="py-3 px-3">Fuel / km</th>
                    <th className="py-3 px-3">Avg Speed</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {transportRates.map((r) => (
                    <tr key={r.id} className="hover:bg-[#14233f] transition-colors">
                      <td className="py-3 px-4 font-black text-slate-100 flex items-center space-x-2">
                        <span>{r.transport_type}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-cyan-300 font-bold">
                        {r.base_fare > 0 ? `₹${Number(r.base_fare).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-100 font-bold">
                        {r.per_km_rate > 0 ? `₹${r.per_km_rate}/km` : '—'}
                      </td>
                      <td className="py-3 px-3 text-amber-300 font-bold">
                        {r.daily_rental > 0 ? `₹${Number(r.daily_rental).toLocaleString()}/day` : '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {r.fuel_cost_per_km > 0 ? `₹${r.fuel_cost_per_km}/km` : '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {r.speed_kmh} km/h
                      </td>
                      <td className="py-3 px-3">
                        {parseInt(r.active) === 1 ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenRateEdit(r)}
                          className="p-1.5 rounded-lg bg-[#0b1528] hover:bg-cyan-600/20 text-cyan-400 border border-slate-700 hover:border-cyan-400/50 transition-all text-xs inline-flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rate Edit Modal */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-3xl border border-slate-700/80 bg-[#101b30] p-6 shadow-[0_25px_60px_rgba(2,8,23,0.55)] space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h3 className="text-base font-black text-slate-100 flex items-center">
                <Calculator className="h-5 w-5 text-cyan-400 mr-2" />
                {editingRate ? `Edit Rate: ${editingRate.transport_type}` : 'Create Transport Tariff Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRateModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#0b1528] text-slate-400 hover:text-white border border-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Transport Title</label>
                  <input
                    type="text"
                    value={rateFormData.transport_type}
                    onChange={(e) => setRateFormData({ ...rateFormData, transport_type: e.target.value })}
                    placeholder="e.g. Private AC Cab"
                    required
                    className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Category</label>
                  <select
                    value={rateFormData.category}
                    onChange={(e) => setRateFormData({ ...rateFormData, category: e.target.value })}
                    className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Private Cab">Private Cab</option>
                    <option value="Taxi">Taxi</option>
                    <option value="Bus">Bus</option>
                    <option value="Train">Train</option>
                    <option value="Self Drive">Self Drive</option>
                    <option value="Bike/Scooter">Bike/Scooter</option>
                    <option value="Cycling">Cycling</option>
                    <option value="Walking">Walking</option>
                    <option value="Flight">Flight</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Base Fare (₹)</label>
                  <input
                    type="number"
                    step="10"
                    value={rateFormData.base_fare}
                    onChange={(e) => setRateFormData({ ...rateFormData, base_fare: parseFloat(e.target.value || 0) })}
                    className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Per-Km Rate (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={rateFormData.per_km_rate}
                    onChange={(e) => setRateFormData({ ...rateFormData, per_km_rate: parseFloat(e.target.value || 0) })}
                    className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Rental (₹)</label>
                  <input
                    type="number"
                    step="50"
                    value={rateFormData.daily_rental}
                    onChange={(e) => setRateFormData({ ...rateFormData, daily_rental: parseFloat(e.target.value || 0) })}
                    className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fuel Cost/Km (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={rateFormData.fuel_cost_per_km}
                    onChange={(e) => setRateFormData({ ...rateFormData, fuel_cost_per_km: parseFloat(e.target.value || 0) })}
                    className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg Speed (km/h)</label>
                  <input
                    type="number"
                    step="1"
                    value={rateFormData.speed_kmh}
                    onChange={(e) => setRateFormData({ ...rateFormData, speed_kmh: parseFloat(e.target.value || 45) })}
                    className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={rateFormData.active}
                    onChange={(e) => setRateFormData({ ...rateFormData, active: parseInt(e.target.value) })}
                    className="w-full bg-[#0b1528] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0b1528] text-slate-400 hover:text-white border border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{loading ? 'Saving...' : 'Save Rate Rule'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DESTINATION FIXED TRANSIT CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1528] p-4 rounded-2xl border border-slate-700/70">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filter By Destination</label>
              <select
                value={filterDestId}
                onChange={(e) => setFilterDestId(e.target.value)}
                className="bg-[#101b30] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100"
              >
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.city})</option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-400 font-bold">
              {transports.length} Options Recorded
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[#101b30]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0b1528] text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-700/70">
                <tr>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-3">Route (From ➔ To)</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Fare (₹)</th>
                  <th className="py-3 px-3">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {transports.map((t) => (
                  <tr key={t.id} className="hover:bg-[#14233f]">
                    <td className="py-3 px-4 font-bold text-slate-100">{t.transport_type}</td>
                    <td className="py-3 px-3 text-slate-300">{t.source} ➔ {t.destination}</td>
                    <td className="py-3 px-3 text-amber-300">{t.travel_time}</td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">₹{Number(t.fare).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {t.availability || 'Available'}
                      </span>
                    </td>
                  </tr>
                ))}
                {transports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No transit options found for this destination.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
