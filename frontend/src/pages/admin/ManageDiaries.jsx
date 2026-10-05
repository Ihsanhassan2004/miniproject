import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Trash2, Star, AlertCircle, Calendar, User, ZoomIn, X, 
  Image as ImageIcon, Sparkles, ChevronLeft, ChevronRight, Layers 
} from 'lucide-react';
import { adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to parse multiple photos reliably
const parseDiaryPhotos = (photoPath, photosArray) => {
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

export default function ManageDiaries() {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Lightbox Modal State ({ diary, activeIndex })
  const [lightboxData, setLightboxData] = useState(null);

  const loadDiaries = async () => {
    try {
      const res = await adminService.getDiaries();
      setDiaries(res.diaries || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load diaries list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiaries();
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this diary entry?')) return;
    try {
      await adminService.deleteDiary(id);
      setSuccessMsg('Diary entry deleted successfully.');
      if (lightboxData?.diary?.id === id) setLightboxData(null);
      loadDiaries();
    } catch (err) {
      setErrorMsg('Failed to delete diary entry.');
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
    <div className="space-y-8 font-sans animate-fade-in text-left">
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-extrabold text-white flex items-center tracking-tight">
          <BookOpen className="h-8 w-8 text-primary mr-2.5" />
          Manage Traveler Diaries
        </h1>
        <p className="text-xs text-luxuryMuted font-semibold">Moderate public travel diaries, photo attachments, and ratings left by system travelers.</p>
      </div>

      {successMsg && <p className="text-xs text-primary font-bold animate-pulse">{successMsg}</p>}
      {errorMsg && <p className="text-xs text-danger font-bold flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1" /> {errorMsg}</p>}

      <div className="bg-luxurySurface rounded-luxury border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-luxuryBg text-slate-500 border-b border-white/5 font-extrabold uppercase tracking-widest text-[9px]">
                <th className="p-4 pl-6">S.No.</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Traveler</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Photos</th>
                <th className="p-4">Diary Memory Snippet</th>
                <th className="p-4">Submitted At</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {diaries.map((diary, index) => {
                const photos = parseDiaryPhotos(diary.photo_path, diary.photos);
                return (
                  <tr key={diary.id} className="border-b border-white/5 hover:bg-luxuryBg/30 transition-colors font-semibold">
                    <td className="p-4 pl-6 text-slate-400 font-bold">{index + 1}</td>
                    <td className="p-4 font-extrabold text-white py-4">
                      {diary.destination_name}
                    </td>
                    <td className="p-4 text-slate-300">
                      <span className="flex items-center space-x-1.5 font-bold">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{diary.user_name}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-amber-500 space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < diary.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      {photos.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setLightboxData({ diary, activeIndex: 0 })}
                          className="group relative inline-block rounded-lg overflow-hidden border border-white/10 hover:border-primary/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-md"
                          title={`Click to view ${photos.length} photo${photos.length > 1 ? 's' : ''}`}
                        >
                          <img
                            src={photos[0]}
                            alt={diary.destination_name || 'Travel preview'}
                            className="h-10 w-16 object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {photos.length > 1 && (
                            <div className="absolute top-0.5 right-0.5 bg-black/80 backdrop-blur-sm text-[8px] font-black text-cyan-300 px-1 py-0.2 rounded">
                              +{photos.length}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="h-4 w-4 text-white drop-shadow-md" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> No Image
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-luxuryMuted max-w-xs truncate">{diary.diary}</td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-center text-[10px]">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{diary.created_at || 'Recently'}</span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDelete(diary.id)}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        aria-label="Delete"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {diaries.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-luxuryMuted font-bold">No traveler diaries logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Photo Lightbox Modal with Multi-Photo Carousel & Thumbnails */}
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
                        {lightboxData.diary.destination_name}
                        {currentPhotos.length > 1 && (
                          <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                            Photo {activeIndex + 1} of {currentPhotos.length}
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-luxuryMuted font-bold flex items-center gap-1.5 mt-0.5">
                        <User className="h-3 w-3 text-primary" /> {lightboxData.diary.user_name}
                        <span>•</span>
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

                {/* Main Image Display Area with Navigation Arrows */}
                <div className="bg-black/80 relative flex items-center justify-center p-3 sm:p-5 overflow-hidden min-h-[300px] max-h-[58vh]">
                  {currentPhoto && (
                    <img
                      src={currentPhoto}
                      alt={`${lightboxData.diary.destination_name} photo ${activeIndex + 1}`}
                      className="max-h-[52vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/5 transition-all duration-300"
                    />
                  )}

                  {/* Left / Right Carousel Controls */}
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

                {/* Thumbnail Navigation Strip */}
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
                      Traveler Experience Rating
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
