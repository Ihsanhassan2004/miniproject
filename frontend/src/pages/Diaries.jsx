import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Star, Sparkles, Image as ImageIcon, Compass, Save, AlertCircle, 
  Trash2, Edit3, X, Upload, FolderOpen, CheckCircle2, Camera, 
  ZoomIn, Lock, Calendar, Clock, AlertTriangle, ChevronLeft, ChevronRight, Plus, Layers
} from 'lucide-react';
import { tripService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to reliably parse photos from string, JSON array, or list
export const parseDiaryPhotos = (photoPath, photosArray) => {
  if (Array.isArray(photosArray) && photosArray.length > 0) {
    return photosArray.filter(Boolean);
  }
  if (!photoPath) return [];
  if (Array.isArray(photoPath)) return photoPath.filter(Boolean);
  if (typeof photoPath === 'string') {
    const trimmed = photoPath.trim();
    if (!trimmed || trimmed === 'nan' || trimmed === 'None') return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {
        // ignore parse error
      }
    }
    return [trimmed];
  }
  return [];
};

export default function Diaries() {
  const [diaries, setDiaries] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Lightbox Modal State ({ diary, activeIndex })
  const [lightboxData, setLightboxData] = useState(null);

  // Create Form Fields
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedDestId, setSelectedDestId] = useState('');
  const [diaryText, setDiaryText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal States
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDiaryText, setEditDiaryText] = useState('');
  const [editPhotos, setEditPhotos] = useState([]);
  const [editRating, setEditRating] = useState(5);
  const [editDestName, setEditDestName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // File Input References
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Helpers to check if trip has started
  const getTripStartDate = (trip) => {
    const d = trip?.travel_date || (trip?.created_at ? trip.created_at.split(' ')[0] : null);
    return d && d !== 'nan' && d !== 'None' ? d : null;
  };

  const isTripStarted = (trip) => {
    const startDateStr = getTripStartDate(trip);
    if (!startDateStr) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tripDate = new Date(startDateStr);
    tripDate.setHours(0, 0, 0, 0);
    return tripDate <= today;
  };

  // Convert and optimize an image file to a compact Data URL
  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Invalid image type'));
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Image decode error'));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  // Browse multiple images handler
  const handleMultipleImageUpload = async (e, currentPhotos, setPhotosState) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length < files.length) {
      alert('Some non-image files were skipped. Please select JPG, PNG, or WebP images.');
    }

    try {
      const processed = await Promise.all(validFiles.map(processImageFile));
      const combined = [...currentPhotos, ...processed].slice(0, 10);
      setPhotosState(combined);
    } catch (err) {
      console.error('Failed to process images:', err);
      alert('Failed to process one or more images. Please try again.');
    }
    if (e.target) e.target.value = '';
  };

  const removePhotoAtIndex = (index, currentPhotos, setPhotosState) => {
    setPhotosState(currentPhotos.filter((_, i) => i !== index));
  };

  const loadData = async () => {
    try {
      const diariesRes = await tripService.getMyDiaries();
      setDiaries(diariesRes.diaries || []);
      
      const tripsRes = await tripService.getMyTrips();
      const userTrips = tripsRes.trips || [];
      setTrips(userTrips);
      
      const started = userTrips.filter(isTripStarted);
      if (started.length > 0) {
        setSelectedTripId(started[0].id);
        setSelectedDestId(started[0].destination_id);
      } else if (userTrips.length > 0) {
        setSelectedTripId(userTrips[0].id);
        setSelectedDestId(userTrips[0].destination_id);
      }
    } catch (err) {
      console.error("Failed to load diaries setup data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard navigation for Lightbox modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxData) return;
      const photos = parseDiaryPhotos(lightboxData.diary.photo_path, lightboxData.diary.photos);
      if (photos.length <= 1) {
        if (e.key === 'Escape') setLightboxData(null);
        return;
      }
      if (e.key === 'ArrowLeft') {
        setLightboxData((prev) => ({
          ...prev,
          activeIndex: prev.activeIndex > 0 ? prev.activeIndex - 1 : photos.length - 1
        }));
      } else if (e.key === 'ArrowRight') {
        setLightboxData((prev) => ({
          ...prev,
          activeIndex: prev.activeIndex < photos.length - 1 ? prev.activeIndex + 1 : 0
        }));
      } else if (e.key === 'Escape') {
        setLightboxData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxData]);

  const handleTripSelectionChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);
    const chosenTrip = trips.find(t => String(t.id) === String(tripId));
    if (chosenTrip) {
      setSelectedDestId(chosenTrip.destination_id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDestId || !diaryText.trim()) {
      setErrorMsg('Please select a destination and write your diary memory.');
      return;
    }

    const currentTrip = trips.find(t => String(t.id) === String(selectedTripId) || String(t.destination_id) === String(selectedDestId));
    if (currentTrip && !isTripStarted(currentTrip)) {
      setErrorMsg(`You can only add diary entries once your trip starts on ${getTripStartDate(currentTrip) || 'the planned start date'}.`);
      return;
    }

    setSubmitting(true);
    setMsg('');
    setErrorMsg('');
    try {
      await tripService.postDiary({
        destination_id: currentTrip ? currentTrip.destination_id : parseInt(selectedDestId),
        trip_id: currentTrip ? currentTrip.id : selectedTripId,
        diary: diaryText,
        photos: photos,
        photo_path: photos.length > 0 ? (photos.length === 1 ? photos[0] : JSON.stringify(photos)) : '',
        rating: rating
      });
      setMsg('Memory saved to your diary timeline!');
      setDiaryText('');
      setPhotos([]);
      setRating(5);
      
      const diariesRes = await tripService.getMyDiaries();
      setDiaries(diariesRes.diaries || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to post diary. Please verify.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (diary) => {
    setEditId(diary.id);
    setEditDiaryText(diary.diary);
    setEditPhotos(parseDiaryPhotos(diary.photo_path, diary.photos));
    setEditRating(diary.rating);
    setEditDestName(diary.destination_name);
    setEditError('');
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDiaryText.trim()) {
      setEditError('Diary memory text cannot be empty.');
      return;
    }

    setUpdating(true);
    setEditError('');
    try {
      await tripService.updateDiary(editId, {
        diary: editDiaryText,
        photos: editPhotos,
        photo_path: editPhotos.length > 0 ? (editPhotos.length === 1 ? editPhotos[0] : JSON.stringify(editPhotos)) : '',
        rating: editRating
      });
      
      const diariesRes = await tripService.getMyDiaries();
      setDiaries(diariesRes.diaries || []);
      setIsEditing(false);
    } catch (err) {
      setEditError('Failed to update diary. Try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this travel diary entry?")) {
      return;
    }

    try {
      await tripService.deleteDiary(id);
      const diariesRes = await tripService.getMyDiaries();
      setDiaries(diariesRes.diaries || []);
    } catch (err) {
      alert("Failed to delete diary entry. Please check credentials.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 bg-luxuryBg">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans animate-fade-in text-left">
      
      {/* Diaries List Grid */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-2 border-b border-white/5 pb-5">
          <h1 className="text-2xl font-extrabold text-white flex items-center tracking-tight">
            <BookOpen className="h-6 w-6 text-primary mr-2.5" />
            Travel Memories Diary
          </h1>
          <p className="text-luxuryMuted text-xs font-medium">
            Flip through your logs, ratings, and travel thoughts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {diaries.map((diary) => {
            const itemPhotos = parseDiaryPhotos(diary.photo_path, diary.photos);
            return (
              <div 
                key={diary.id} 
                className="bg-luxurySurface border border-white/5 rounded-luxury overflow-hidden flex flex-col justify-between hover:border-primary/20 transition-all duration-300"
              >
                {/* Photo Gallery Header */}
                {itemPhotos.length > 0 && (
                  <div className="relative group overflow-hidden bg-slate-950">
                    {itemPhotos.length === 1 ? (
                      <div 
                        onClick={() => setLightboxData({ diary, activeIndex: 0 })}
                        className="h-44 bg-slate-900 shrink-0 relative cursor-pointer overflow-hidden"
                        title="Click to view full photo"
                      >
                        <img
                          src={itemPhotos[0]}
                          alt={diary.destination_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-lg flex items-center gap-1.5 text-xs font-bold px-3">
                            <ZoomIn className="h-4 w-4 text-primary" /> View Photo
                          </div>
                        </div>
                      </div>
                    ) : itemPhotos.length === 2 ? (
                      <div className="grid grid-cols-2 gap-1 h-44 cursor-pointer">
                        {itemPhotos.map((src, idx) => (
                          <div
                            key={idx}
                            onClick={() => setLightboxData({ diary, activeIndex: idx })}
                            className="relative h-full overflow-hidden bg-slate-900 group/sub"
                          >
                            <img
                              src={src}
                              alt={`${diary.destination_name} photo ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/sub:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/sub:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* 3 or more photos */
                      <div className="cursor-pointer" onClick={() => setLightboxData({ diary, activeIndex: 0 })}>
                        <div className="h-36 relative overflow-hidden bg-slate-900">
                          <img
                            src={itemPhotos[0]}
                            alt={`${diary.destination_name} cover`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-sm border border-white/20 px-2 py-0.5 rounded-full text-[10px] font-black text-cyan-300 flex items-center gap-1 shadow-lg">
                            <Layers className="h-3 w-3 text-cyan-400" />
                            <span>{itemPhotos.length} Photos</span>
                          </div>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="p-1.5 rounded-full bg-black/60 text-white backdrop-blur-sm text-xs font-bold px-3 flex items-center gap-1">
                              <ZoomIn className="h-4 w-4 text-primary" /> Browse Gallery
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 border-t border-white/5">
                          {itemPhotos.slice(1, 4).map((src, idx) => (
                            <div 
                              key={idx} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxData({ diary, activeIndex: idx + 1 });
                              }}
                              className="h-12 rounded overflow-hidden relative group/thumb border border-white/5"
                            >
                              <img
                                src={src}
                                alt={`Thumbnail ${idx + 2}`}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                              />
                              {idx === 2 && itemPhotos.length > 4 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-black text-white">
                                  +{itemPhotos.length - 4}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-extrabold text-xs text-white">Trip to {diary.destination_name}</h3>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5">{diary.created_at.split(' ')[0]}</span>
                      </div>

                      <div className="flex items-center text-amber-500 space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < diary.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-luxuryMuted leading-relaxed font-semibold">
                      {diary.diary}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 border-t border-white/5 pt-3 text-[10px] font-extrabold uppercase tracking-wider">
                    <button
                      onClick={() => startEdit(diary)}
                      className="text-primary hover:text-white flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(diary.id)}
                      className="text-rose-500 hover:text-rose-600 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {diaries.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-luxurySurface border border-white/5 rounded-luxury shadow-2xl space-y-4 max-w-md mx-auto">
              <Compass className="h-10 w-10 text-primary mx-auto animate-spin-slow" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-widest">Your Diary is Empty</h3>
              <p className="text-luxuryMuted text-xs max-w-xs mx-auto leading-relaxed">
                Once you save itineraries, write down your memories, upload photos, and rate your travels here!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Posting Form Box */}
      <div>
        {trips.length === 0 ? (
          <div className="bg-luxurySurface p-8 rounded-luxury border border-white/5 text-center space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-widest">Add Diary Entry</h3>
            <p className="text-xs text-luxuryMuted leading-relaxed font-medium">You must first plan and save at least one travel recommendation to start compiling diary logs.</p>
            <Link
              to="/plan-trip"
              className="w-full block py-3 bg-luxuryBg hover:bg-primary border border-white/5 text-primary hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-luxury transition-all"
            >
              Plan and Save a Trip
            </Link>
          </div>
        ) : trips.filter(isTripStarted).length === 0 ? (
          /* User has saved trips, but ALL are scheduled for future start dates */
          <div className="bg-luxurySurface p-6 sm:p-8 rounded-luxury border border-amber-500/20 shadow-2xl space-y-5 text-left">
            <div className="flex items-center space-x-2 text-amber-400">
              <Lock className="h-5 w-5" />
              <h3 className="font-extrabold text-white text-xs uppercase tracking-widest">
                Diary Locked Until Trip Starts
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300">
                  {trips[0].destination_name}
                </span>
                <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Starts {getTripStartDate(trips[0]) || 'Upcoming'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                You can only add travelogue memories, photos, and ratings once your trip officially starts.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[10px] text-slate-400 font-semibold">
                Your journey will unlock diary entries automatically on <strong>{getTripStartDate(trips[0])}</strong>.
              </p>
              <Link
                to="/plan-trip"
                className="w-full block py-3 text-center bg-luxuryBg hover:bg-primary border border-white/5 text-primary hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-luxury transition-all"
              >
                Plan Another Trip for Today
              </Link>
            </div>
          </div>
        ) : (
          /* User has at least one started trip */
          <div className="bg-luxurySurface p-6 sm:p-8 rounded-luxury border border-white/5 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <h3 className="font-extrabold text-white flex items-center text-xs uppercase tracking-widest">
                <Sparkles className="h-4.5 w-4.5 text-primary mr-1.5 animate-pulse" /> Add Diary Entry
              </h3>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Trip Started
              </span>
            </div>

            {msg && (
              <p className="text-xs text-primary font-bold animate-pulse">{msg}</p>
            )}
            {errorMsg && (
              <p className="text-xs text-danger font-bold flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1" /> {errorMsg}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block">Select Started Trip</label>
                <select
                  value={selectedTripId}
                  onChange={handleTripSelectionChange}
                  className="w-full text-xs bg-luxuryBg border border-white/5 rounded-luxury p-3 focus:outline-none text-white font-bold cursor-pointer"
                >
                  <optgroup label="Started Trips (Eligible for Diary)">
                    {trips.filter(isTripStarted).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.destination_name} (Trip {t.id} • Started {getTripStartDate(t)})
                      </option>
                    ))}
                  </optgroup>
                  {trips.filter(t => !isTripStarted(t)).length > 0 && (
                    <optgroup label="Upcoming Trips (Locked until start date)">
                      {trips.filter(t => !isTripStarted(t)).map((t) => (
                        <option key={t.id} value={t.id} disabled className="text-slate-500">
                          🔒 {t.destination_name} (Starts on {getTripStartDate(t)} - Locked)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {(() => {
                  const activeTrip = trips.find(t => String(t.id) === String(selectedTripId)) || trips.filter(isTripStarted)[0];
                  if (!activeTrip) return null;
                  const started = isTripStarted(activeTrip);
                  return (
                    <div className={`mt-1 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                      started 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {started ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Journey Started on {getTripStartDate(activeTrip)} • Diary Open</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5 shrink-0" />
                          <span>Trip Starts on {getTripStartDate(activeTrip)} • Diary Locked</span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block">Experience Rating</label>
                <div className="flex items-center space-x-1.5 pt-0.5">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setRating(stars)}
                      className="p-1 focus:outline-none text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`h-6 w-6 ${stars <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Memory Photos Multi-Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block flex items-center">
                    <Camera className="h-3.5 w-3.5 mr-1 text-primary animate-pulse" /> Memory Photos
                  </label>
                  {photos.length > 0 && (
                    <span className="text-[10px] font-bold text-cyan-400">
                      {photos.length}/10 selected
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => handleMultipleImageUpload(e, photos, setPhotos)}
                  accept="image/*"
                  className="hidden"
                />

                {photos.length > 0 ? (
                  <div className="space-y-3 rounded-luxury border border-white/10 bg-luxuryBg p-3">
                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{photos.length} Photo{photos.length > 1 ? 's' : ''} Attached</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {photos.length < 10 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                          >
                            <Plus className="h-3 w-3" /> Add More
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPhotos([])}
                          className="text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-500/10"
                          title="Clear all photos"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Photo Thumbnails Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                      {photos.map((photo, index) => (
                        <div 
                          key={index} 
                          className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-slate-900 shadow-md"
                        >
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          
                          {/* Index Badge */}
                          <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-sm text-[8px] font-black text-white px-1.5 py-0.5 rounded">
                            {index === 0 ? 'Cover' : `#${index + 1}`}
                          </div>

                          {/* Delete Single Photo Button */}
                          <button
                            type="button"
                            onClick={() => removePhotoAtIndex(index, photos, setPhotos)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow-lg cursor-pointer"
                            title="Remove this photo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add More Tile if < 10 */}
                      {photos.length < 10 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-primary/60 flex flex-col items-center justify-center gap-1 bg-luxurySurface/60 hover:bg-luxurySurface text-slate-400 hover:text-primary transition-all cursor-pointer group"
                        >
                          <Plus className="h-5 w-5 group-hover:scale-110 transition-transform text-primary" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty Dropzone button */
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/10 hover:border-primary/60 rounded-luxury p-5 flex flex-col items-center justify-center gap-2 bg-luxuryBg hover:bg-luxuryBg/80 text-slate-300 transition-all cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-white group-hover:text-primary block">
                        Browse Multiple Images
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        Select one or more photos (JPG, PNG, WEBP • Up to 10 photos)
                      </span>
                    </div>
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block">Write Travelogue Memories</label>
                <textarea
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="How was the local food? Did you enjoy the sightseeing flow?"
                  rows="5"
                  required
                  className="w-full text-xs bg-luxuryBg border border-white/5 rounded-luxury p-3 focus:outline-none focus:border-primary text-white font-bold"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-white font-extrabold text-xs uppercase tracking-wider rounded-luxury shadow-lg transition-all flex items-center justify-center space-x-1.5 border border-transparent cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{submitting ? 'Saving Memory...' : 'Save Diary Entry'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Edit Modal (Popup window) */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-luxurySurface border border-white/5 rounded-luxury shadow-2xl p-6 sm:p-8 space-y-5 relative text-left max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-luxuryBg hover:bg-luxuryBg/80 text-slate-500 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center">
                  <Edit3 className="h-4.5 w-4.5 text-primary mr-1.5 animate-pulse" />
                  Edit Diary Entry
                </h3>
                <p className="text-[9px] text-slate-500 font-extrabold uppercase">Trip to {editDestName}</p>
              </div>

              {editError && (
                <p className="text-xs text-danger font-bold flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1" /> {editError}</p>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block">Experience Rating</label>
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setEditRating(stars)}
                        className="p-1 focus:outline-none text-amber-500 cursor-pointer"
                      >
                        <Star className={`h-6 w-6 ${stars <= editRating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Multi-Photo Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block flex items-center">
                      <Camera className="h-3.5 w-3.5 mr-1 text-primary animate-pulse" /> Memory Photos
                    </label>
                    {editPhotos.length > 0 && (
                      <span className="text-[10px] font-bold text-cyan-400">
                        {editPhotos.length}/10 selected
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    multiple
                    ref={editFileInputRef}
                    onChange={(e) => handleMultipleImageUpload(e, editPhotos, setEditPhotos)}
                    accept="image/*"
                    className="hidden"
                  />

                  {editPhotos.length > 0 ? (
                    <div className="space-y-3 rounded-luxury border border-white/10 bg-luxuryBg p-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>{editPhotos.length} Photo{editPhotos.length > 1 ? 's' : ''} Attached</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {editPhotos.length < 10 && (
                            <button
                              type="button"
                              onClick={() => editFileInputRef.current?.click()}
                              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                            >
                              <Plus className="h-3 w-3" /> Add More
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditPhotos([])}
                            className="text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-500/10"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                        {editPhotos.map((photo, index) => (
                          <div 
                            key={index} 
                            className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-slate-900 shadow-md"
                          >
                            <img
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-sm text-[8px] font-black text-white px-1.5 py-0.5 rounded">
                              {index === 0 ? 'Cover' : `#${index + 1}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhotoAtIndex(index, editPhotos, setEditPhotos)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow-lg cursor-pointer"
                              title="Remove this photo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}

                        {editPhotos.length < 10 && (
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-primary/60 flex flex-col items-center justify-center gap-1 bg-luxurySurface/60 hover:bg-luxurySurface text-slate-400 hover:text-primary transition-all cursor-pointer group"
                          >
                            <Plus className="h-5 w-5 group-hover:scale-110 transition-transform text-primary" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/10 hover:border-primary/60 rounded-luxury p-5 flex flex-col items-center justify-center gap-2 bg-luxuryBg hover:bg-luxuryBg/80 text-slate-300 transition-all cursor-pointer group"
                    >
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-white group-hover:text-primary block">
                          Browse Multiple Images
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          Supports JPG, PNG, WEBP (Up to 10 photos)
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block">Edit Memories</label>
                  <textarea
                    value={editDiaryText}
                    onChange={(e) => setEditDiaryText(e.target.value)}
                    rows="5"
                    required
                    className="w-full text-xs bg-luxuryBg border border-white/5 rounded-luxury p-3 focus:outline-none focus:border-primary text-white font-bold"
                  ></textarea>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-1/2 py-3 bg-luxuryBg hover:bg-luxuryBg/80 text-slate-400 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-luxury transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-1/2 py-3 bg-gradient-to-r from-primary to-accent text-white font-extrabold text-xs uppercase tracking-wider rounded-luxury shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{updating ? 'Updating...' : 'Update Entry'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Photo Lightbox Modal with Multi-Photo Gallery & Navigation */}
      <AnimatePresence>
        {lightboxData && (() => {
          const currentPhotos = parseDiaryPhotos(lightboxData.diary.photo_path, lightboxData.diary.photos);
          const activeIndex = lightboxData.activeIndex || 0;
          const currentPhoto = currentPhotos[activeIndex] || currentPhotos[0];

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
              onClick={() => setLightboxData(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl bg-luxurySurface border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]"
              >
                {/* Header Bar */}
                <div className="p-4 sm:px-6 border-b border-white/5 flex items-center justify-between bg-luxuryBg/80">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                        Trip to {lightboxData.diary.destination_name}
                        {currentPhotos.length > 1 && (
                          <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                            Photo {activeIndex + 1} of {currentPhotos.length}
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-luxuryMuted font-bold flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" /> {lightboxData.diary.created_at || 'Recently'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLightboxData(null)}
                    className="p-2 rounded-xl bg-luxuryBg hover:bg-luxuryBg/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close photo preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Image Display Area with Left/Right Arrows */}
                <div className="bg-black/80 relative flex items-center justify-center p-3 sm:p-5 overflow-hidden min-h-[300px] max-h-[58vh]">
                  {currentPhoto && (
                    <img
                      src={currentPhoto}
                      alt={`${lightboxData.diary.destination_name} photo ${activeIndex + 1}`}
                      className="max-h-[52vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/5 transition-all duration-300"
                    />
                  )}

                  {/* Previous / Next Arrows */}
                  {currentPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxData((prev) => ({
                            ...prev,
                            activeIndex: activeIndex > 0 ? activeIndex - 1 : currentPhotos.length - 1
                          }));
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-primary text-white backdrop-blur-sm transition-all shadow-xl cursor-pointer border border-white/10"
                        title="Previous photo (←)"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxData((prev) => ({
                            ...prev,
                            activeIndex: activeIndex < currentPhotos.length - 1 ? activeIndex + 1 : 0
                          }));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-primary text-white backdrop-blur-sm transition-all shadow-xl cursor-pointer border border-white/10"
                        title="Next photo (→)"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip if multiple photos */}
                {currentPhotos.length > 1 && (
                  <div className="p-2.5 bg-black/90 border-t border-white/5 flex items-center gap-2 overflow-x-auto justify-center">
                    {currentPhotos.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxData((prev) => ({ ...prev, activeIndex: idx }))}
                        className={`h-12 w-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          idx === activeIndex
                            ? 'border-primary ring-2 ring-primary/40 scale-105'
                            : 'border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Caption / Memory Details Footer */}
                <div className="p-4 sm:px-6 bg-luxuryBg/60 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                      My Trip Rating
                    </span>
                    <div className="flex items-center text-amber-400 space-x-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < lightboxData.diary.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {lightboxData.diary.diary && (
                    <p className="text-xs text-slate-300 font-medium leading-relaxed bg-luxurySurface/80 p-3 rounded-xl border border-white/5">
                      "{lightboxData.diary.diary}"
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
