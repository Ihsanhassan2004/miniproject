import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Navigation } from 'lucide-react';
import { tripService } from '../../services/api';

export default function LocationSearch({
  value = '',
  placeholder = 'Search place, city or landmark...',
  label = 'Location',
  icon: Icon = MapPin,
  iconColor = 'text-cyan-400',
  onSelect,
  disabled = false
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const blurTimerRef = useRef(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  // Debounce geocoding queries
  useEffect(() => {
    if (!isOpen) return;
    const cleanQ = query.trim();
    if (cleanQ.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await tripService.geocode(cleanQ, 6);
        setSuggestions(res.results || []);
      } catch (err) {
        console.error('Geocoding search failed:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setActiveIndex(-1);
    if (onSelect) {
      onSelect(val);
    }
  };

  const handleSelect = (item) => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }
    const selectedText = item.name || item.label || '';
    setQuery(selectedText);
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else {
        setIsOpen(false);
        if (onSelect) onSelect(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    if (onSelect) {
      onSelect('');
    }
    if (inputRef.current) inputRef.current.focus();
  };

  const handleBlur = () => {
    // Delay hiding dropdown so clicks can be processed
    blurTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="flex items-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
          <Icon className={`h-3 w-3 mr-1 ${iconColor}`} />
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
          ) : (
            <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-[#0b1528] border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (suggestions.length > 0 || (loading && query.length >= 2)) && (
        <div 
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-[#101b30] border border-slate-700/80 rounded-xl shadow-[0_10px_30px_rgba(2,8,23,0.4)] overflow-hidden max-h-60 overflow-y-auto"
        >
          {loading && suggestions.length === 0 && (
            <div className="p-3 text-center text-xs text-slate-400 font-semibold flex items-center justify-center space-x-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
              <span>Searching places...</span>
            </div>
          )}

          {suggestions.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={`${item.latitude}-${item.longitude}-${idx}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(item);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(item);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-start space-x-2.5 border-b border-slate-800/60 last:border-0 cursor-pointer ${
                  isSelected ? 'bg-blue-600/30 text-cyan-200' : 'hover:bg-[#14233f] text-slate-200'
                }`}
              >
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-cyan-400" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-100 block truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate font-medium">
                    {item.label}
                  </span>
                </div>
                {item.region && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded shrink-0">
                    {item.region}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

