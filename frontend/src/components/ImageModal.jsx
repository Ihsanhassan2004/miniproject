import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ZoomIn, ZoomOut, RotateCcw, ExternalLink, 
  Copy, Check, Image as ImageIcon, MapPin, Sparkles 
} from 'lucide-react';

export default function ImageModal({
  isOpen,
  onClose,
  src,
  alt = 'Image preview',
  title = '',
  subtitle = '',
  description = ''
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset zoom on image change or modal open
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setCopied(false);
      setImgError(false);
    }
  }, [isOpen, src]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleCopyLink = () => {
    if (!src) return;
    navigator.clipboard.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !src) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-hidden animate-fade-in select-none"
        onClick={onClose}
      >
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-[#0b1329]/95 border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Top Header & Toolbar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/40 backdrop-blur-sm z-10 shrink-0">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="truncate">
                <h3 className="text-sm font-extrabold text-white truncate tracking-tight">
                  {title || 'Image Preview'}
                </h3>
                {subtitle && (
                  <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-cyan-400 shrink-0" /> {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 space-x-0.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.7}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Zoom out (-)"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-slate-300 px-1.5 min-w-[42px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Zoom in (+)"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Reset Zoom (0)"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Copy URL */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer flex items-center text-xs font-bold"
                title="Copy Image URL"
                aria-label="Copy image link"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Open in new tab */}
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer flex items-center text-xs font-bold"
                title="Open image in new tab"
                aria-label="Open full image in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/10 rounded-xl transition-all cursor-pointer ml-1"
                title="Close (Esc)"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Image View Area */}
          <div className="relative flex-1 min-h-[320px] max-h-[62vh] sm:max-h-[68vh] overflow-auto flex items-center justify-center p-3 sm:p-6 bg-black/60 scrollbar-thin scrollbar-thumb-white/10">
            {imgError ? (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <div className="text-sm font-bold text-slate-300">Unable to load image</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  The image link may be invalid or protected by CORS policy.
                </p>
                <a 
                  href={src} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3.5 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open direct URL
                </a>
              </div>
            ) : (
              <motion.img
                src={src}
                alt={alt || title || 'Full preview'}
                onError={() => setImgError(true)}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center'
                }}
                className="max-h-[58vh] sm:max-h-[64vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200 cursor-zoom-in"
                onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.6 : 1))}
                title="Click to toggle 160% zoom"
              />
            )}
          </div>

          {/* Footer Caption & Description (if provided) */}
          {(description || title) && (
            <div className="px-4 sm:px-6 py-3 bg-black/50 border-t border-white/10 text-left shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Detailed View
                  </span>
                  {description && (
                    <p className="text-xs text-slate-300 font-medium leading-relaxed max-h-16 overflow-y-auto pr-2">
                      {description}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 self-start sm:self-auto">
                  Click image or press +/- to zoom
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
