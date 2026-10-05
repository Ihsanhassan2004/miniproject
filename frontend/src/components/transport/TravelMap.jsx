import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Maximize2, Minimize2, MapPin, Navigation, Compass, 
  Layers, Shield, MousePointer, Check, Sparkles, Map, Info, RotateCcw, Crosshair,
  Search, X, Loader2, Target
} from 'lucide-react';
import { tripService } from '../../services/api';

// Global, National & Regional Top POIs for instant 1-click selection & quick search
const QUICK_POIS = [
  { name: "Dubai", label: "Dubai, United Arab Emirates", lat: 25.2048, lon: 55.2708, category: "Global Hub" },
  { name: "Abu Dhabi", label: "Abu Dhabi, United Arab Emirates", lat: 24.4539, lon: 54.3773, category: "Global Hub" },
  { name: "Singapore", label: "Singapore City, Singapore", lat: 1.3521, lon: 103.8198, category: "Global Hub" },
  { name: "Bangkok", label: "Bangkok, Thailand", lat: 13.7563, lon: 100.5018, category: "Global Hub" },
  { name: "Phuket", label: "Phuket, Thailand", lat: 7.8804, lon: 98.3923, category: "Beach" },
  { name: "Bali", label: "Bali, Indonesia", lat: -8.4095, lon: 115.1889, category: "Island" },
  { name: "Maldives", label: "Malé, Maldives", lat: 4.1755, lon: 73.5093, category: "Island" },
  { name: "Paris", label: "Paris, France", lat: 48.8566, lon: 2.3522, category: "Global Hub" },
  { name: "London", label: "London, United Kingdom", lat: 51.5074, lon: -0.1278, category: "Global Hub" },
  { name: "Tokyo", label: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, category: "Global Hub" },
  { name: "New York", label: "New York City, United States", lat: 40.7128, lon: -74.0060, category: "Global Hub" },
  { name: "Goa", label: "Panaji, Goa, India", lat: 15.2993, lon: 74.1240, category: "Beach" },
  { name: "Mumbai", label: "Mumbai, Maharashtra, India", lat: 19.0760, lon: 72.8777, category: "City" },
  { name: "Delhi", label: "New Delhi, Delhi, India", lat: 28.6139, lon: 77.2090, category: "City" },
  { name: "Jaipur", label: "Jaipur Pink City, Rajasthan", lat: 26.9124, lon: 75.7873, category: "Heritage" },
  { name: "Manali", label: "Manali Hill Station, Himachal", lat: 32.2432, lon: 77.1892, category: "Hill Station" },
  { name: "Kochi", label: "Kochi (Cochin), Ernakulam", lat: 9.9312, lon: 76.2673, category: "Hub" },
  { name: "Munnar", label: "Munnar Hill Station, Idukki", lat: 10.0889, lon: 77.0595, category: "Hill Station" },
  { name: "Kanthalloor", label: "Kanthalloor Fruit Orchards, Devikulam", lat: 10.2132, lon: 77.1982, category: "Hill Station" },
  { name: "Marayoor", label: "Marayoor Sandalwood Forests, Idukki", lat: 10.2783, lon: 77.1594, category: "Nature" },
  { name: "Vattavada", label: "Vattavada Vegetable Village, Munnar", lat: 10.1837, lon: 77.2573, category: "Hill Station" },
  { name: "Anakulam", label: "Anakulam Elephant Spot, Mankulam", lat: 10.1608, lon: 76.9126, category: "Wildlife" },
  { name: "Mankulam", label: "Mankulam Eco Village, Idukki", lat: 10.1265, lon: 76.9387, category: "Nature" },
  { name: "Chinnakanal", label: "Chinnakanal & Power House Waterfalls", lat: 10.0270, lon: 77.1585, category: "Waterfalls" },
  { name: "Mattupetty", label: "Mattupetty Dam & Lake, Munnar", lat: 10.1054, lon: 77.1245, category: "Lake" },
  { name: "Kolukkumalai", label: "Kolukkumalai Highest Tea Peak", lat: 10.0827, lon: 77.2281, category: "Hill Station" },
  { name: "Top Station", label: "Top Station Cloud Viewpoint, Munnar", lat: 10.1226, lon: 77.2447, category: "Viewpoint" },
  { name: "Adimali", label: "Adimali Gateway, Idukki", lat: 10.0402, lon: 76.9554, category: "Town" },
  { name: "Anachal", label: "Anachal Scenic Valley, Munnar", lat: 10.0234, lon: 77.0189, category: "Nature" },
  { name: "Vagamon", label: "Vagamon Pine Forests & Meadows", lat: 9.6896, lon: 76.9056, category: "Hill Station" },
  { name: "Illikkal Kallu", label: "Illikkal Kallu Highest Point, Kottayam", lat: 9.7214, lon: 76.8263, category: "Viewpoint" },
  { name: "Kuttikkanam", label: "Kuttikkanam Mist Valley, Peermade", lat: 9.5815, lon: 76.9687, category: "Hill Station" },
  { name: "Parunthumpara", label: "Parunthumpara Eagle Rock, Idukki", lat: 9.6053, lon: 77.0189, category: "Viewpoint" },
  { name: "Thekkady", label: "Thekkady Periyar Reserve, Kumily", lat: 9.6031, lon: 77.1615, category: "Wildlife" },
  { name: "Gavi", label: "Gavi Eco-tourism, Pathanamthitta", lat: 9.4350, lon: 77.1667, category: "Eco Tourism" },
  { name: "Alleppey", label: "Alappuzha (Alleppey) Backwaters", lat: 9.4981, lon: 76.3388, category: "Backwaters" },
  { name: "Kumarakom", label: "Kumarakom Bird Sanctuary & Lake", lat: 9.6175, lon: 76.4301, category: "Backwaters" },
  { name: "Marari Beach", label: "Marari Peaceful Beach, Alappuzha", lat: 9.6006, lon: 76.2995, category: "Beach" },
  { name: "Varkala", label: "Varkala Cliff Beach, Trivandrum", lat: 8.7379, lon: 76.7163, category: "Beach" },
  { name: "Kovalam", label: "Kovalam Lighthouse Beach", lat: 8.4004, lon: 76.9787, category: "Beach" },
  { name: "Poovar", label: "Poovar Golden Sand Estuary", lat: 8.3188, lon: 77.0620, category: "Backwaters" },
  { name: "Ponmudi", label: "Ponmudi Misty Peaks, Trivandrum", lat: 8.7600, lon: 77.1167, category: "Hill Station" },
  { name: "Munroe Island", label: "Munroe Island Canal Rides, Kollam", lat: 8.9950, lon: 76.6117, category: "Backwaters" },
  { name: "Thenmala", label: "Thenmala Eco-tourism & Dam, Kollam", lat: 8.9583, lon: 77.0625, category: "Eco Tourism" },
  { name: "Athirappilly", label: "Athirappilly Waterfalls, Thrissur", lat: 10.2851, lon: 76.5698, category: "Waterfalls" },
  { name: "Vazhachal", label: "Vazhachal Waterfalls & Sholayar", lat: 10.3015, lon: 76.5912, category: "Waterfalls" },
  { name: "Wayanad", label: "Wayanad Rainforests, Kalpetta", lat: 11.6050, lon: 76.0829, category: "Hill Station" },
  { name: "Vythiri", label: "Vythiri Rainforest Resorts, Wayanad", lat: 11.5502, lon: 76.0392, category: "Nature" },
  { name: "Meppadi", label: "Meppadi Chembra Peak, Wayanad", lat: 11.5546, lon: 76.1264, category: "Trek" },
  { name: "Sulthan Bathery", label: "Sulthan Bathery, Wayanad", lat: 11.6626, lon: 76.2570, category: "Heritage" },
  { name: "Bekal", label: "Bekal Fort & Beach, Kasaragod", lat: 12.3926, lon: 75.0315, category: "Heritage" },
  { name: "Ranipuram", label: "Ranipuram Hills, Kasaragod", lat: 12.4286, lon: 75.3582, category: "Hill Station" },
  { name: "Nelliyampathy", label: "Nelliyampathy Hills, Palakkad", lat: 10.5342, lon: 76.6936, category: "Hill Station" },
  { name: "Silent Valley", label: "Silent Valley National Park, Palakkad", lat: 11.1342, lon: 76.4278, category: "Nature" },
  { name: "Trivandrum", label: "Thiruvananthapuram Capital", lat: 8.5241, lon: 76.9366, category: "City" },
  { name: "Calicut", label: "Kozhikode (Calicut)", lat: 11.2588, lon: 75.7804, category: "City" },
  { name: "Ooty", label: "Ooty (Nilgiris), Tamil Nadu", lat: 11.4102, lon: 76.6950, category: "Hill Station" },
  { name: "Kodaikanal", label: "Kodaikanal Princess of Hills", lat: 10.2381, lon: 77.4892, category: "Hill Station" }
];

export default function TravelMap({
  origin,
  destination,
  geometry = [],
  distanceKm = 0,
  durationFormatted = '',
  dataSource = 'OpenRouteService',
  height = '380px',
  interactive = true,
  onOriginChange,
  onDestinationChange,
  allowSelection = true,
  showDestinationPicker = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const poiLayerGroupRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const canPickDestination = Boolean(allowSelection && onDestinationChange && showDestinationPicker !== false);
  const canPickOrigin = Boolean(allowSelection && onOriginChange);
  const shouldShowDestination = Boolean(destination && showDestinationPicker !== false);

  // Selection mode: null | 'origin' | 'destination'
  const [activePickMode, setActivePickMode] = useState(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState(null);
  const [showPOIs, setShowPOIs] = useState(true);

  // In-Map Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchInputRef = useRef(null);

  // Ref to hold activePickMode so leaflet event handlers always access the latest value without re-binding
  const activePickModeRef = useRef(activePickMode);
  useEffect(() => {
    activePickModeRef.current = activePickMode;
  }, [activePickMode]);

  // Helper to reverse geocode and trigger callback
  const handlePointPicked = useCallback(async (lat, lon, targetType) => {
    setReverseLoading(true);
    setSelectionNotice(`Resolving location coordinates...`);
    try {
      const res = await tripService.reverseGeocode(lat, lon);
      const locObj = res.result || {
        name: `Point (${roundCoord(lat)}, ${roundCoord(lon)})`,
        label: `Location (${roundCoord(lat)}, ${roundCoord(lon)})`,
        latitude: lat,
        longitude: lon,
        city: 'Kerala',
        region: 'Kerala',
        country: 'India'
      };

      if (targetType === 'origin' && onOriginChange) {
        onOriginChange(locObj);
        setSelectionNotice(`📍 Origin updated to "${locObj.name}"`);
      } else if (targetType === 'destination' && canPickDestination) {
        onDestinationChange(locObj);
        setSelectionNotice(`🎯 Destination updated to "${locObj.name}"`);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      const fallbackObj = {
        name: `Location (${roundCoord(lat)}, ${roundCoord(lon)})`,
        label: `Coordinates ${roundCoord(lat)}, ${roundCoord(lon)}`,
        latitude: lat,
        longitude: lon,
        country: 'India'
      };
      if (targetType === 'origin' && onOriginChange) onOriginChange(fallbackObj);
      if (targetType === 'destination' && canPickDestination) onDestinationChange(fallbackObj);
      setSelectionNotice(`Updated coordinates on route.`);
    } finally {
      setReverseLoading(false);
      setActivePickMode(null);
      setTimeout(() => setSelectionNotice(null), 3500);
    }
  }, [onOriginChange, onDestinationChange, canPickDestination]);

  const roundCoord = (num) => Number(num).toFixed(4);

  // In-Map Search Logic - Searches Local POIs & Live OpenStreetMap Nominatim for all small places
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    setIsSearching(true);

    searchDebounceRef.current = setTimeout(async () => {
      const q = searchQuery.trim().toLowerCase();
      
      // 1. Instant local matching
      const localMatches = QUICK_POIS.filter(poi => 
        poi.name.toLowerCase().includes(q) || poi.label.toLowerCase().includes(q) || poi.category.toLowerCase().includes(q)
      ).map(poi => ({
        name: poi.name,
        label: poi.label,
        latitude: poi.lat,
        longitude: poi.lon,
        category: poi.category,
        isLocal: true
      }));

      // 2. Fetch API geocode suggestions (backed by OpenStreetMap Nominatim for ALL small places)
      try {
        const apiRes = await tripService.geocode(q, 8);
        const apiList = Array.isArray(apiRes?.results) ? apiRes.results : (Array.isArray(apiRes) ? apiRes : []);
        
        // Combine & deduplicate (API results first for accurate global places, then local POIs)
        const combined = [];
        const seen = new Set();

        const addRes = (name, label, lat, lon, category) => {
          const k = `${name.toLowerCase()}_${roundCoord(lat)}_${roundCoord(lon)}`;
          if (!seen.has(k)) {
            seen.add(k);
            combined.push({
              name,
              label,
              latitude: Number(lat),
              longitude: Number(lon),
              category: category || 'Destination'
            });
          }
        };

        apiList.forEach(item => {
          const lat = item.latitude || item.lat;
          const lon = item.longitude || item.lon;
          if (lat && lon) {
            const lbl = item.label || `${item.name}${item.region ? ', ' + item.region : ''}${item.country ? ', ' + item.country : ''}`;
            addRes(item.name, lbl, lat, lon, item.city || item.country || 'Destination');
          }
        });

        localMatches.forEach(item => {
          addRes(item.name, item.label, item.latitude, item.longitude, item.category);
        });

        setSearchResults(combined.slice(0, 8));
      } catch (err) {
        setSearchResults(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Handle User Selecting a Search Result
  const handleSelectSearchResult = (item, actionType = 'fly') => {
    const map = mapInstanceRef.current;
    if (!map || !item.latitude || !item.longitude) return;

    // Pan & zoom map to selected location
    map.flyTo([item.latitude, item.longitude], 12, { animate: true, duration: 1.2 });

    // Drop interactive search marker
    if (searchMarkerRef.current) {
      layerGroupRef.current?.removeLayer(searchMarkerRef.current);
    }

    const searchIcon = L.divIcon({
      className: 'custom-search-marker',
      html: `
        <div style="background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(139,92,246,0.8); border: 2px solid white; cursor: pointer; animation: pulse 1.5s infinite;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });

    const marker = L.marker([item.latitude, item.longitude], { icon: searchIcon });
    
    const popupContent = document.createElement('div');
    popupContent.innerHTML = `
      <div style="font-family: inherit; font-size: 11px; padding: 3px; min-width: 170px;">
        <div style="font-weight: 800; color: #f8fafc; font-size: 12px; margin-bottom: 2px;">${item.name}</div>
        <div style="color: #94a3b8; font-size: 10px; margin-bottom: 8px;">${item.label}</div>
        <div style="display: flex; gap: 5px;">
          <button type="button" id="search-set-from" style="flex: 1; background: #0284c7; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-weight: 700; font-size: 10px; cursor: pointer; width: 100%;">
            📍 Set as Starting Origin
          </button>
          ${canPickDestination ? `
          <button type="button" id="search-set-to" style="flex: 1; background: #e11d48; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-weight: 700; font-size: 10px; cursor: pointer;">
            🎯 Set To
          </button>
          ` : ''}
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.on('popupopen', () => {
      const fromBtn = document.getElementById('search-set-from');
      const toBtn = document.getElementById('search-set-to');
      if (fromBtn && onOriginChange) {
        fromBtn.onclick = () => {
          map.closePopup();
          onOriginChange(item);
          setSelectionNotice(`📍 Origin updated to "${item.name}"`);
          setTimeout(() => setSelectionNotice(null), 3000);
        };
      }
      if (toBtn && canPickDestination && onDestinationChange) {
        toBtn.onclick = () => {
          map.closePopup();
          onDestinationChange(item);
          setSelectionNotice(`🎯 Destination updated to "${item.name}"`);
          setTimeout(() => setSelectionNotice(null), 3000);
        };
      }
    });

    layerGroupRef.current?.addLayer(marker);
    searchMarkerRef.current = marker;
    marker.openPopup();

    if (actionType === 'from' && onOriginChange) {
      onOriginChange(item);
      setSelectionNotice(`📍 Origin set to "${item.name}"`);
      setTimeout(() => setSelectionNotice(null), 3000);
    } else if (actionType === 'to' && onDestinationChange) {
      onDestinationChange(item);
      setSelectionNotice(`🎯 Destination set to "${item.name}"`);
      setTimeout(() => setSelectionNotice(null), 3000);
    }

    setIsSearchOpen(false);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (container._leaflet_id && !mapInstanceRef.current) {
      delete container._leaflet_id;
    }

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(container, {
          center: [10.0, 76.5],
          zoom: 8,
          zoomControl: true,
          scrollWheelZoom: interactive,
          attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | openrouteservice'
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        const poiLayerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        poiLayerGroupRef.current = poiLayerGroup;
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Map initialization warning:', err);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (container && container._leaflet_id) {
        delete container._leaflet_id;
      }
    };
  }, [interactive]);

  // Handle map clicks based on active selection mode or general popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMapClick = (e) => {
      const { lat, lng } = e.latlng;
      const currentMode = activePickModeRef.current;

      if (currentMode === 'origin' && canPickOrigin) {
        handlePointPicked(lat, lng, 'origin');
        return;
      }

      if (currentMode === 'destination' && canPickDestination) {
        handlePointPicked(lat, lng, 'destination');
        return;
      }

      // Default click behavior: show popup to set From or To
      if (allowSelection && (canPickOrigin || canPickDestination)) {
        const popupContent = document.createElement('div');
        popupContent.className = 'custom-map-click-popup';
        popupContent.innerHTML = `
          <div style="font-family: inherit; font-size: 11px; padding: 4px; min-width: 170px;">
            <div style="font-weight: 800; color: #f8fafc; margin-bottom: 2px;">Selected Point</div>
            <div style="color: #94a3b8; font-size: 10px; margin-bottom: 8px;">Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              ${canPickOrigin ? `
              <button type="button" id="btn-set-origin" style="background: #0284c7; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-weight: 700; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%;">
                📍 Set as Starting Origin
              </button>` : ''}
              ${canPickDestination ? `
              <button type="button" id="btn-set-dest" style="background: #e11d48; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-weight: 700; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%;">
                🎯 Set as "To" (Destination)
              </button>` : ''}
            </div>
          </div>
        `;

        const popup = L.popup({ className: 'custom-leaflet-popup' })
          .setLatLng([lat, lng])
          .setContent(popupContent)
          .openOn(map);

        setTimeout(() => {
          const originBtn = document.getElementById('btn-set-origin');
          const destBtn = document.getElementById('btn-set-dest');
          if (originBtn && canPickOrigin) {
            originBtn.onclick = (ev) => {
              if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
              }
              map.closePopup();
              handlePointPicked(lat, lng, 'origin');
            };
          }
          if (destBtn && canPickDestination) {
            destBtn.onclick = (ev) => {
              if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
              }
              map.closePopup();
              handlePointPicked(lat, lng, 'destination');
            };
          }
        }, 50);
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [allowSelection, handlePointPicked, canPickOrigin, canPickDestination]);

  // Render Tourist Hotspot Dots
  useEffect(() => {
    const poiLayer = poiLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!poiLayer || !map) return;

    poiLayer.clearLayers();

    if (!showPOIs || !allowSelection) return;

    QUICK_POIS.forEach(poi => {
      const poiIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid #38bdf8; color: #38bdf8; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(56,189,248,0.4); cursor: pointer;" title="${poi.name}">
            <div style="background: #38bdf8; width: 5px; height: 5px; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([poi.lat, poi.lon], { icon: poiIcon });
      
      const popupDiv = document.createElement('div');
      popupDiv.innerHTML = `
        <div style="font-family: inherit; font-size: 11px; padding: 4px; min-width: 160px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <b style="color: #f8fafc; font-size: 12px;">${poi.name}</b>
            <span style="font-size: 9px; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.3);">${poi.category}</span>
          </div>
          <div style="color: #94a3b8; font-size: 10px; margin-bottom: 6px;">${poi.label}</div>
          <div style="display: flex; gap: 4px;">
            <button type="button" id="poi-from-${poi.name.replace(/\s+/g, '')}" style="flex: 1; background: #0284c7; color: white; border: none; padding: 5px 6px; border-radius: 5px; font-weight: 700; font-size: 9px; cursor: pointer; width: 100%;">
              📍 Set Origin
            </button>
            ${canPickDestination ? `
            <button type="button" id="poi-to-${poi.name.replace(/\s+/g, '')}" style="flex: 1; background: #e11d48; color: white; border: none; padding: 5px 6px; border-radius: 5px; font-weight: 700; font-size: 9px; cursor: pointer;">
              🎯 Set To
            </button>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupDiv);

      marker.on('click', (e) => {
        const currentMode = activePickModeRef.current;
        if (currentMode) {
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          marker.closePopup();
          handlePointPicked(poi.lat, poi.lon, currentMode);
        }
      });

      marker.on('popupopen', () => {
        const fromBtn = document.getElementById(`poi-from-${poi.name.replace(/\s+/g, '')}`);
        const toBtn = document.getElementById(`poi-to-${poi.name.replace(/\s+/g, '')}`);
        if (fromBtn && onOriginChange) {
          fromBtn.onclick = (e) => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            map.closePopup();
            onOriginChange({
              name: poi.name,
              label: poi.label,
              latitude: poi.lat,
              longitude: poi.lon,
              region: 'Kerala',
              country: 'India'
            });
            setSelectionNotice(`📍 Origin set to "${poi.name}"`);
            setTimeout(() => setSelectionNotice(null), 3000);
          };
        }
        if (toBtn && canPickDestination && onDestinationChange) {
          toBtn.onclick = (e) => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            map.closePopup();
            onDestinationChange({
              name: poi.name,
              label: poi.label,
              latitude: poi.lat,
              longitude: poi.lon,
              region: 'Kerala',
              country: 'India'
            });
            setSelectionNotice(`🎯 Destination set to "${poi.name}"`);
            setTimeout(() => setSelectionNotice(null), 3000);
          };
        }
      });

      poiLayer.addLayer(marker);
    });
  }, [showPOIs, allowSelection, onOriginChange, onDestinationChange, handlePointPicked, canPickDestination]);

  // Update Route Polyline & Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    searchMarkerRef.current = null;

    const bounds = [];

    try {
      // 1. Origin Marker
      let oLat = origin?.latitude || (typeof origin === 'object' && origin.lat);
      let oLon = origin?.longitude || (typeof origin === 'object' && (origin.lon || origin.lng));
      const oName = origin?.name || origin?.label || (typeof origin === 'string' ? origin : 'Origin');

      if ((!oLat || !oLon) && Array.isArray(geometry) && geometry.length > 0) {
        oLat = geometry[0][0];
        oLon = geometry[0][1];
      }

      if (oLat && oLon) {
        const originIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="background: linear-gradient(135deg, #0284c7, #06b6d4); color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(2,132,199,0.6); border: 2.5px solid white; cursor: grab;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        });

        const originMarker = L.marker([oLat, oLon], { 
          icon: originIcon,
          draggable: Boolean(allowSelection && onOriginChange)
        }).bindPopup(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #38bdf8; font-weight: 800; font-size: 9px; text-transform: uppercase;">📍 Origin Pickup (From)</span>
            </div>
            <b style="color: #f1f5f9; font-size: 13px; display: block; margin: 2px 0;">${oName}</b>
            <div style="color: #94a3b8; font-size: 10px;">Lat: ${Number(oLat).toFixed(4)}, Lon: ${Number(oLon).toFixed(4)}</div>
            <div style="color: #38bdf8; font-size: 9px; margin-top: 4px; font-weight: 600;">💡 Drag pin to reposition origin</div>
          </div>
        `);

        originMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          handlePointPicked(lat, lng, 'origin');
        });

        layerGroup.addLayer(originMarker);
        bounds.push([oLat, oLon]);
      }

      // 2. Destination Marker (only rendered when shouldShowDestination is true)
      if (shouldShowDestination) {
        let dLat = destination?.latitude || (typeof destination === 'object' && destination.lat);
        let dLon = destination?.longitude || (typeof destination === 'object' && (destination.lon || destination.lng));
        const dName = destination?.name || destination?.label || (typeof destination === 'string' ? destination : 'Destination');

        if ((!dLat || !dLon) && Array.isArray(geometry) && geometry.length > 0) {
          dLat = geometry[geometry.length - 1][0];
          dLon = geometry[geometry.length - 1][1];
        }

        if (dLat && dLon) {
          const destIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div style="background: linear-gradient(135deg, #e11d48, #f97316); color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(225,29,72,0.6); border: 2.5px solid white; cursor: grab;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
          });

          const destMarker = L.marker([dLat, dLon], { 
            icon: destIcon,
            draggable: Boolean(allowSelection && onDestinationChange && canPickDestination)
          }).bindPopup(`
            <div style="font-family: inherit; font-size: 11px; padding: 2px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #fb7185; font-weight: 800; font-size: 9px; text-transform: uppercase;">🔴 Target Destination (To)</span>
              </div>
              <b style="color: #f1f5f9; font-size: 13px; display: block; margin: 2px 0;">${dName}</b>
              <div style="color: #94a3b8; font-size: 10px;">${distanceKm > 0 ? `Distance: ~${distanceKm} km` : ''} (Lat: ${Number(dLat).toFixed(4)}, Lon: ${Number(dLon).toFixed(4)})</div>
              <div style="color: #fb7185; font-size: 9px; margin-top: 4px; font-weight: 600;">💡 Drag pin to reposition destination</div>
            </div>
          `);

          destMarker.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            handlePointPicked(lat, lng, 'destination');
          });

          layerGroup.addLayer(destMarker);
          bounds.push([dLat, dLon]);
        }
      }

      // 3. Draw Route Polyline (only if shouldShowDestination and geometry exists)
      if (shouldShowDestination && geometry && geometry.length > 0) {
        const isFlightRoute = String(dataSource || '').toLowerCase().includes('flight') || 
                              String(dataSource || '').toLowerCase().includes('aviation') || 
                              distanceKm >= 1200;

        if (isFlightRoute) {
          // Commercial Flight Great-Circle Arc Styling
          const flightGlow = L.polyline(geometry, {
            color: '#38bdf8',
            weight: 7,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round'
          });
          layerGroup.addLayer(flightGlow);

          const flightAirway = L.polyline(geometry, {
            color: '#06b6d4',
            weight: 3.5,
            opacity: 0.95,
            dashArray: '10, 8',
            lineCap: 'round',
            lineJoin: 'round'
          });
          layerGroup.addLayer(flightAirway);

          // Add midpoint airplane indicator
          const midIdx = Math.floor(geometry.length / 2);
          const midPt = geometry[midIdx];
          if (midPt && Array.isArray(midPt) && midPt.length >= 2) {
            const planeIcon = L.divIcon({
              className: 'custom-flight-midpoint-marker',
              html: `
                <div style="background: rgba(15, 23, 42, 0.9); border: 2px solid #38bdf8; color: #38bdf8; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(56,189,248,0.7);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            const planeMarker = L.marker([midPt[0], midPt[1]], { icon: planeIcon }).bindPopup(`
              <div style="font-family: inherit; font-size: 11px; padding: 2px;">
                <b style="color: #38bdf8;">✈️ Non-Stop Commercial Airway</b>
                <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">Cruising Altitude • Great-Circle Route</div>
              </div>
            `);
            layerGroup.addLayer(planeMarker);
          }
        } else {
          // Standard Highway Route Styling
          const glowPolyline = L.polyline(geometry, {
            color: '#0284c7',
            weight: 8,
            opacity: 0.4,
            lineCap: 'round',
            lineJoin: 'round'
          });
          layerGroup.addLayer(glowPolyline);

          const routePolyline = L.polyline(geometry, {
            color: '#06b6d4',
            weight: 4.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          });
          layerGroup.addLayer(routePolyline);
        }

        geometry.forEach((pt) => {
          if (Array.isArray(pt) && pt.length >= 2) bounds.push(pt);
        });
      }

      // 4. Auto-fit bounds
      if (bounds.length > 0) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: distanceKm >= 1200 ? 8 : 14,
          animate: true,
          duration: 0.8
        });
      }
    } catch (err) {
      console.error('Error drawing route on map:', err);
    }
  }, [origin, destination, geometry, distanceKm, dataSource, allowSelection, onOriginChange, onDestinationChange, handlePointPicked, shouldShowDestination, canPickDestination]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = [];
    let oLat = origin?.latitude || (typeof origin === 'object' && origin.lat);
    let oLon = origin?.longitude || (typeof origin === 'object' && (origin.lon || origin.lng));
    if (oLat && oLon) bounds.push([oLat, oLon]);

    if (shouldShowDestination) {
      let dLat = destination?.latitude || (typeof destination === 'object' && destination.lat);
      let dLon = destination?.longitude || (typeof destination === 'object' && (destination.lon || destination.lng));
      if (dLat && dLon) bounds.push([dLat, dLon]);

      if (geometry && geometry.length > 0) {
        geometry.forEach(pt => {
          if (Array.isArray(pt) && pt.length >= 2) bounds.push(pt);
        });
      }
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
      handleRecenter();
    }, 250);
  };

  const originDisplayName = typeof origin === 'object' ? (origin.name || origin.label) : origin;
  const destDisplayName = typeof destination === 'object' ? (destination.name || destination.label) : destination;

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#07111f] shadow-2xl transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]' : 'w-full'
    }`}>
      {/* Top Map Action Bar */}
      <div className="absolute top-2 left-2 right-2 z-[400] flex items-center justify-between pointer-events-none">
        {/* Route / Origin Info Badge */}
        <div className="bg-[#0b1528]/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-cyan-500/40 text-xs shadow-lg flex items-center space-x-2 pointer-events-auto">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div className="flex items-center space-x-1.5 font-black text-slate-100 truncate max-w-[190px] sm:max-w-xs md:max-w-md">
            {shouldShowDestination ? (
              <>
                <span className="text-cyan-300 truncate">{originDisplayName || 'Origin'}</span>
                <span className="text-slate-500">➔</span>
                <span className="text-rose-400 truncate">{destDisplayName || 'Destination'}</span>
              </>
            ) : (
              <>
                <span className="text-slate-400 font-semibold text-[11px]">Selected Starting Origin:</span>
                <span className="text-cyan-300 font-bold truncate">{originDisplayName || 'Choose on Map'}</span>
              </>
            )}
          </div>
          {shouldShowDestination && distanceKm > 0 && (
            <span className="hidden sm:inline-block bg-[#101b30] text-cyan-300 border border-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              {distanceKm} km {durationFormatted ? `• ${durationFormatted}` : ''}
            </span>
          )}
        </div>

        {/* Map Toolbar Controls */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          
          {/* In-Map Search Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(p => !p);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className={`px-2.5 py-1.5 rounded-xl border shadow-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSearchOpen 
                  ? 'bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-400/50' 
                  : 'bg-[#0b1528]/90 hover:bg-[#14233f] text-cyan-300 border-slate-700/80'
              }`}
              title="Search any town, village, viewpoint or spot"
            >
              <Search className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Search Map</span>
            </button>

            {/* In-Map Search Dropdown Menu */}
            {isSearchOpen && (
              <div className="absolute right-0 top-10 w-72 sm:w-84 bg-[#101b30]/95 backdrop-blur-md rounded-2xl border border-cyan-500/40 p-3 shadow-2xl space-y-2 z-[500] text-left">
                <div className="flex items-center space-x-2 bg-[#0b1528] px-3 py-2 rounded-xl border border-slate-700">
                  <Search className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any destination (e.g. Dubai, Paris, Kochi, Munnar)..."
                    className="bg-transparent border-none outline-none text-xs text-slate-100 placeholder-slate-500 font-semibold w-full"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {isSearching && <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin shrink-0" />}
                </div>

                {/* Search Results List */}
                <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin">
                  {searchResults.length > 0 ? (
                    searchResults.map((res, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-2 rounded-xl bg-[#0b1528] hover:bg-[#14233f] border border-slate-800 flex items-center justify-between gap-2 text-xs group transition-colors"
                      >
                        <div 
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => handleSelectSearchResult(res, 'fly')}
                        >
                          <span className="font-bold text-slate-100 block truncate group-hover:text-cyan-300">
                            {res.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {res.label}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectSearchResult(res, 'from')}
                            className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white rounded-lg text-[9px] font-black border border-cyan-500/40 cursor-pointer"
                            title="Set as Origin (From)"
                          >
                            {canPickDestination ? 'From' : 'Set Origin'}
                          </button>
                          {canPickDestination && (
                            <button
                              type="button"
                              onClick={() => handleSelectSearchResult(res, 'to')}
                              className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-lg text-[9px] font-black border border-rose-500/40 cursor-pointer"
                              title="Set as Destination (To)"
                            >
                              To
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <div className="p-3 text-center text-[11px] text-slate-400 font-medium">
                      No matching locations found. Try another place name.
                    </div>
                  ) : (
                    <div className="p-2 space-y-1.5 text-[11px]">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Popular Global & Local Destinations:</span>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_POIS.slice(0, 10).map((p, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleSelectSearchResult({
                              name: p.name,
                              label: p.label,
                              latitude: p.lat,
                              longitude: p.lon,
                              category: p.category
                            }, 'fly')}
                            className="px-2 py-0.5 rounded bg-[#0b1528] hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-700 font-medium cursor-pointer"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {allowSelection && (
            <>
              {/* Pick From Mode Button */}
              {canPickOrigin && (
                <button
                  type="button"
                  onClick={() => setActivePickMode(m => m === 'origin' ? null : 'origin')}
                  className={`px-2.5 py-1.5 rounded-xl border shadow-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePickMode === 'origin'
                      ? 'bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-900 animate-pulse'
                      : 'bg-[#0b1528]/90 hover:bg-[#14233f] text-cyan-400 border-slate-700/80'
                  }`}
                  title="Click anywhere on the map to set starting origin"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{activePickMode === 'origin' ? 'Click Map...' : (canPickDestination ? 'Pick From' : 'Pick Origin')}</span>
                </button>
              )}

              {/* Pick To Mode Button - Only if canPickDestination */}
              {canPickDestination && (
                <button
                  type="button"
                  onClick={() => setActivePickMode(m => m === 'destination' ? null : 'destination')}
                  className={`px-2.5 py-1.5 rounded-xl border shadow-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePickMode === 'destination'
                      ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-300 ring-offset-1 ring-offset-slate-900 animate-pulse'
                      : 'bg-[#0b1528]/90 hover:bg-[#14233f] text-rose-400 border-slate-700/80'
                  }`}
                  title="Click anywhere on the map to set 'To' destination"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>{activePickMode === 'destination' ? 'Click Map...' : 'Pick To'}</span>
                </button>
              )}
            </>
          )}

          {/* Recenter */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 rounded-xl bg-[#0b1528]/90 hover:bg-[#14233f] text-slate-300 hover:text-cyan-300 border border-slate-700/80 shadow-md text-xs font-bold transition-all cursor-pointer"
            title="Fit Route to View"
          >
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
          </button>

          {/* Fullscreen Expand */}
          <button
            type="button"
            onClick={toggleExpand}
            className="p-2 rounded-xl bg-[#0b1528]/90 hover:bg-[#14233f] text-slate-300 hover:text-cyan-300 border border-slate-700/80 shadow-md text-xs font-bold transition-all cursor-pointer"
            title={isExpanded ? 'Exit Fullscreen' : 'Expand Map'}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Active Picking Mode Floating Banner */}
      {activePickMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[450] bg-[#0b1528]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-cyan-400/80 shadow-[0_10px_30px_rgba(6,182,212,0.4)] text-xs font-bold text-white flex items-center space-x-2.5 animate-bounce">
          <Crosshair className={`h-4 w-4 animate-spin ${activePickMode === 'origin' ? 'text-cyan-400' : 'text-rose-400'}`} />
          <span>
            {activePickMode === 'origin' 
              ? 'Click anywhere on the map or tap any blue hotspot to set "From" (Origin)'
              : 'Click anywhere on the map or tap any blue hotspot to set "To" (Destination)'}
          </span>
          <button 
            type="button" 
            onClick={() => {
              setIsSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer"
          >
            Search Instead
          </button>
          <button 
            type="button" 
            onClick={() => setActivePickMode(null)}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selection Feedback Notification */}
      {selectionNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[450] bg-[#0b1528]/95 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow-lg flex items-center space-x-2">
          {reverseLoading ? (
            <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-emerald-400" />
          )}
          <span>{selectionNotice}</span>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height: isExpanded ? 'calc(100vh - 70px)' : height }}
        className={`w-full relative z-10 ${activePickMode ? 'cursor-crosshair' : 'cursor-grab'}`}
      />

      {/* Map Footer Bar */}
      <div className="absolute bottom-2 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        <div className="bg-[#0b1528]/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-semibold text-slate-400 flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 text-cyan-400">
            <Shield className="h-3 w-3" />
            <span>{dataSource}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hidden sm:inline">💡 Click map, drag pins, search any place, or tap blue spots</span>
        </div>

        {/* POIs toggle */}
        {allowSelection && (
          <button
            type="button"
            onClick={() => setShowPOIs(p => !p)}
            className="pointer-events-auto bg-[#0b1528]/90 hover:bg-[#14233f] border border-slate-700/80 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 flex items-center gap-1 shadow transition-colors cursor-pointer"
            title="Toggle Tourist Destinations Dots"
          >
            <Sparkles className={`h-3 w-3 ${showPOIs ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{showPOIs ? 'Hide Hotspots' : 'Show Hotspots'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
