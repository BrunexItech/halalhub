import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Import Leaflet and OpenStreetMap components
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker styles using Tailwind classes
const createMosqueIcon = () => {
  return L.divIcon({
    className: 'bg-transparent',
    html: `<div class="text-2xl text-center leading-[30px] w-[30px] h-[30px] drop-shadow-lg">🕌</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const createUserIcon = () => {
  return L.divIcon({
    className: 'bg-transparent',
    html: `<div class="text-3xl text-center leading-[30px] w-[30px] h-[30px] drop-shadow-lg animate-pulse">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const MosqueFinder = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Location & Map
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [searchRadius, setSearchRadius] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  // Mosques
  const [mosques, setMosques] = useState([]);
  const [selectedMosque, setSelectedMosque] = useState(null);
  const [isLoadingMosques, setIsLoadingMosques] = useState(false);
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]);
  
  // Modals
  const [showMosqueModal, setShowMosqueModal] = useState(false);
  const [viewMode, setViewMode] = useState('map');

  // ===== GEOCODING WITH NOMINATIM =====
  const searchLocation = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchSuggestions(false);
      return;
    }
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=KE`
      );
      
      if (!response.ok) throw new Error('Geocoding service unavailable');
      
      const data = await response.json();
      setSearchResults(data);
      setShowSearchSuggestions(data.length > 0);
    } catch (err) {
      console.error('Geocoding error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setMapCenter([lat, lon]);
    setSearchQuery(result.display_name);
    setShowSearchSuggestions(false);
    setSearchResults([]);
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 14);
    }
    
    findNearbyMosques(lat, lon);
  };

  // ===== FIND NEARBY MOSQUES USING OVERPASS API =====
  const findNearbyMosques = async (lat, lon, radius = searchRadius) => {
    setIsLoadingMosques(true);
    setError('');
    
    try {
      const overpassQuery = `
        [out:json];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius * 1000},${lat},${lon});
          node["amenity"="mosque"](around:${radius * 1000},${lat},${lon});
          way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius * 1000},${lat},${lon});
          way["amenity"="mosque"](around:${radius * 1000},${lat},${lon});
          relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radius * 1000},${lat},${lon});
          relation["amenity"="mosque"](around:${radius * 1000},${lat},${lon});
        );
        out center;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch mosque data');
      
      const data = await response.json();
      
      const normalizedMosques = data.elements
        .filter(el => el.tags && el.tags.name)
        .map(el => {
          let lat, lon;
          if (el.type === 'node') {
            lat = el.lat;
            lon = el.lon;
          } else if (el.type === 'way' || el.type === 'relation') {
            lat = el.center?.lat || el.lat || 0;
            lon = el.center?.lon || el.lon || 0;
          }
          
          let distance = null;
          if (userLocation && lat && lon) {
            distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lon);
          }
          
          const address = el.tags['addr:street'] || 
                          el.tags['addr:place'] || 
                          el.tags['addr:city'] || 
                          el.tags['addr:full'] || 
                          el.tags['description'] || '';
          
          return {
            id: el.id,
            name: el.tags.name || 'Unnamed Mosque',
            lat: lat,
            lon: lon,
            address: address,
            city: el.tags['addr:city'] || el.tags['addr:town'] || '',
            phone: el.tags.phone || el.tags['contact:phone'] || '',
            website: el.tags.website || el.tags['contact:website'] || '',
            openingHours: el.tags.opening_hours || '',
            facilities: getFacilities(el.tags),
            distance: distance,
            source: 'osm',
            osmId: el.id,
            tags: el.tags,
          };
        })
        .filter(m => m.lat && m.lon)
        .sort((a, b) => {
          if (a.distance !== null && b.distance !== null) {
            return a.distance - b.distance;
          }
          return 0;
        });
      
      setMosques(normalizedMosques);
      clearMarkers();
      
      if (normalizedMosques.length > 0) {
        addMarkers(normalizedMosques, lat, lon);
      }
      
      if (mapRef.current && normalizedMosques.length > 0) {
        const bounds = normalizedMosques.map(m => [m.lat, m.lon]);
        if (bounds.length > 0) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }
      
    } catch (err) {
      console.error('Overpass API error:', err);
      setError('Failed to find nearby mosques. Please try again.');
    } finally {
      setIsLoadingMosques(false);
    }
  };

  // ===== HELPER FUNCTIONS =====
  const getFacilities = (tags) => {
    const facilities = [];
    if (tags['wudu'] || tags['ablution'] || tags['handwashing']) facilities.push('Wudu Area');
    if (tags['parking'] || tags['parking:street'] === 'yes') facilities.push('Parking');
    if (tags['women'] === 'yes' || tags['women:area'] === 'yes') facilities.push('Women\'s Section');
    if (tags['wheelchair'] === 'yes') facilities.push('Wheelchair Accessible');
    if (tags['school'] === 'yes' || tags['madrasa'] === 'yes') facilities.push('Madrasa');
    if (tags['library'] === 'yes') facilities.push('Library');
    if (tags['kitchen'] === 'yes') facilities.push('Kitchen Facilities');
    if (tags['toilets'] === 'yes') facilities.push('Toilets');
    if (tags['shower'] === 'yes') facilities.push('Shower Facilities');
    return facilities;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // ===== MAP FUNCTIONS =====
  const initializeMap = (lat, lon) => {
    if (mapRef.current) return;
    
    mapRef.current = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    if (userLocation) {
      addUserMarker(userLocation.lat, userLocation.lng);
    }

    mapRef.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setMapCenter([lat, lng]);
      findNearbyMosques(lat, lng);
    });
  };

  const addUserMarker = (lat, lon) => {
    if (!mapRef.current) return;
    
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }
    
    userMarkerRef.current = L.marker([lat, lon], { icon: createUserIcon() })
      .addTo(mapRef.current)
      .bindPopup('Your Location')
      .openPopup();
  };

  const addMarkers = (mosques, centerLat, centerLon) => {
    if (!mapRef.current) return;
    
    const mosqueIcon = createMosqueIcon();
    
    mosques.forEach(mosque => {
      const marker = L.marker([mosque.lat, mosque.lon], { icon: mosqueIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="p-1">
            <strong class="text-sm text-[#1A2A3A]">${mosque.name}</strong>
            ${mosque.distance ? `<br><span class="text-[#1769AA] font-medium text-xs">${mosque.distance.toFixed(1)} km away</span>` : ''}
            ${mosque.address ? `<br><span class="text-[#94A3B8] text-xs">${mosque.address}</span>` : ''}
            <br><button onclick="window.selectMosque(${mosque.id})" class="mt-1.5 px-3 py-1 bg-[#1769AA] text-white text-xs font-medium rounded-lg hover:bg-[#2F80C0] transition-colors cursor-pointer border-none">View Details</button>
          </div>
        `, { className: 'mosque-popup' });
      
      marker.mosqueData = mosque;
      markersRef.current.push(marker);
    });
    
    window.selectMosque = (id) => {
      const mosque = mosques.find(m => m.id === id);
      if (mosque) {
        handleSelectMosque(mosque);
      }
    };
  };

  const clearMarkers = () => {
    if (!mapRef.current) return;
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];
  };

  const centerMapOnLocation = (lat, lon) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 14);
    }
    setMapCenter([lat, lon]);
  };

  // ===== HANDLERS =====
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationPermission('granted');
          setMapCenter([latitude, longitude]);
          centerMapOnLocation(latitude, longitude);
          findNearbyMosques(latitude, longitude);
          setSuccess('Location found! Showing nearby mosques.');
          setTimeout(() => setSuccess(''), 5000);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLocationPermission('denied');
          setError('Unable to access your location. Please search for a location manually.');
          setTimeout(() => setError(''), 5000);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length >= 2) {
      searchLocation(value);
    } else {
      setSearchResults([]);
      setShowSearchSuggestions(false);
    }
  };

  const handleSelectMosque = (mosque) => {
    setSelectedMosque(mosque);
    setShowMosqueModal(true);
    
    if (mapRef.current) {
      mapRef.current.setView([mosque.lat, mosque.lon], 16);
    }
  };

  const handleGetDirections = (mosque) => {
    if (!mosque) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lon}`;
    window.open(url, '_blank');
  };

  const handleRadiusChange = (e) => {
    const radius = parseInt(e.target.value);
    setSearchRadius(radius);
    if (mapCenter) {
      findNearbyMosques(mapCenter[0], mapCenter[1], radius);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.length >= 2) {
      searchLocation(searchQuery);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    const initMap = () => {
      if (!mapContainerRef.current) return;
      if (mapRef.current) return;
      
      initializeMap(mapCenter[0], mapCenter[1]);
      
      setTimeout(() => {
        findNearbyMosques(mapCenter[0], mapCenter[1]);
      }, 1000);
    };
    
    if (userLocation) {
      setTimeout(() => {
        findNearbyMosques(userLocation.lat, userLocation.lng);
      }, 500);
    }
    
    const timer = setTimeout(initMap, 1000);
    
    // Set loading to false after initialization
    setLoading(false);
    
    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && mapCenter) {
      mapRef.current.setView(mapCenter, 14);
    }
  }, [mapCenter]);

  // ===== RENDER FUNCTIONS =====
  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return 'N/A';
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading Mosque Finder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 p-8 md:p-12 shadow-lg shadow-[#1769AA]/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Mosque Finder</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">OpenStreetMap</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Find Mosques Near You
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Discover mosques in your area using OpenStreetMap data. Search by location or use your current position.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                {mosques.length} Mosques Found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* ===== ERROR & SUCCESS ===== */}
        {error && (
          <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm text-emerald-600">
            {success}
          </div>
        )}

        {/* ===== SEARCH & CONTROLS ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleKeyPress}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
                  </div>
                )}
                {showSearchSuggestions && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8EEF4] rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-3 hover:bg-[#F1F7FC] transition-colors border-b border-[#F1F7FC] last:border-0"
                        onClick={() => selectSearchResult(result)}
                      >
                        <div className="text-sm font-medium text-[#1A2A3A]">{result.display_name.split(',')[0]}</div>
                        <div className="text-xs text-[#94A3B8]">{result.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button
              className="px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 whitespace-nowrap"
              onClick={handleUseCurrentLocation}
            >
              Use Current Location
            </button>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Radius:</label>
              <select
                className="px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={searchRadius}
                onChange={handleRadiusChange}
              >
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-[#F1F7FC]">
            <span className="text-sm text-[#94A3B8]">
              {isLoadingMosques ? 'Searching for mosques...' : `${mosques.length} mosques found`}
            </span>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'map' ? 'bg-[#1769AA] text-white' : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                }`}
                onClick={() => setViewMode('map')}
              >
                Map View
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-[#1769AA] text-white' : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                }`}
                onClick={() => setViewMode('list')}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {/* ===== MAP & RESULTS ===== */}
        <div className={`grid ${viewMode === 'map' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
          {/* Map Container */}
          <div className={viewMode === 'map' ? 'lg:col-span-2' : 'w-full'}>
            <div 
              ref={mapContainerRef} 
              className="w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-[#E8EEF4] shadow-sm"
            />
            <div className="text-xs text-[#94A3B8] mt-2 text-center">
              Data © OpenStreetMap contributors · Click on the map to search for mosques at that location
            </div>
          </div>

          {/* Results List */}
          {viewMode === 'map' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 h-[400px] md:h-[500px] lg:h-[600px] overflow-y-auto">
                <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">
                  {isLoadingMosques ? 'Loading...' : `Mosques (${mosques.length})`}
                </h3>
                
                {isLoadingMosques ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
                  </div>
                ) : mosques.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-[#94A3B8]">No mosques found in this area</p>
                    <p className="text-xs text-[#94A3B8] mt-1">Try expanding the search radius or searching another location</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mosques.map((mosque) => (
                      <div 
                        key={mosque.id} 
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedMosque?.id === mosque.id 
                            ? 'border-[#1769AA] bg-[#F1F7FC]' 
                            : 'border-[#E8EEF4] hover:border-[#1769AA]/40 hover:bg-[#F8FAFC]'
                        }`}
                        onClick={() => handleSelectMosque(mosque)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#1A2A3A] text-sm">{mosque.name}</h4>
                            {mosque.address && (
                              <p className="text-xs text-[#94A3B8]">{mosque.address}</p>
                            )}
                            {mosque.city && (
                              <p className="text-xs text-[#94A3B8]">{mosque.city}</p>
                            )}
                            {mosque.distance !== null && (
                              <p className="text-xs text-[#1769AA] font-medium mt-1">
                                {formatDistance(mosque.distance)} away
                              </p>
                            )}
                          </div>
                          <button
                            className="px-3 py-1 bg-[#1769AA] text-white text-xs font-semibold rounded-lg hover:bg-[#2F80C0] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDirections(mosque);
                            }}
                          >
                            Directions
                          </button>
                        </div>
                        {mosque.facilities && mosque.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mosque.facilities.slice(0, 3).map((facility, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                                {facility}
                              </span>
                            ))}
                            {mosque.facilities.length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#94A3B8]">
                                +{mosque.facilities.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 mt-4">
            <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">
              {isLoadingMosques ? 'Loading...' : `Mosques (${mosques.length})`}
            </h3>
            
            {isLoadingMosques ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
              </div>
            ) : mosques.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[#94A3B8]">No mosques found in this area</p>
                <p className="text-xs text-[#94A3B8] mt-1">Try expanding the search radius or searching another location</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mosques.map((mosque) => (
                  <div 
                    key={mosque.id} 
                    className="p-4 rounded-xl border border-[#E8EEF4] hover:border-[#1769AA]/40 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleSelectMosque(mosque)}
                  >
                    <h4 className="font-bold text-[#1A2A3A]">{mosque.name}</h4>
                    {mosque.address && (
                      <p className="text-sm text-[#94A3B8] mt-1">{mosque.address}</p>
                    )}
                    {mosque.city && (
                      <p className="text-sm text-[#94A3B8]">{mosque.city}</p>
                    )}
                    {mosque.distance !== null && (
                      <p className="text-sm text-[#1769AA] font-medium mt-2">
                        {formatDistance(mosque.distance)} away
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        className="flex-1 px-3 py-1.5 bg-[#1769AA] text-white text-xs font-semibold rounded-lg hover:bg-[#2F80C0] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(mosque);
                        }}
                      >
                        Directions
                      </button>
                      <button
                        className="flex-1 px-3 py-1.5 bg-[#F1F7FC] text-[#5A6A7A] text-xs font-semibold rounded-lg hover:bg-[#E8EEF4] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMosque(mosque);
                        }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== MOSQUE DETAILS MODAL ===== */}
      {showMosqueModal && selectedMosque && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">{selectedMosque.name}</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowMosqueModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                {selectedMosque.address && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Address</span>
                    <span className="font-semibold text-[#1A2A3A] text-right max-w-[60%]">{selectedMosque.address}</span>
                  </div>
                )}
                {selectedMosque.city && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">City</span>
                    <span className="font-semibold text-[#1A2A3A]">{selectedMosque.city}</span>
                  </div>
                )}
                {selectedMosque.distance !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Distance</span>
                    <span className="font-semibold text-[#1769AA]">{formatDistance(selectedMosque.distance)}</span>
                  </div>
                )}
                {selectedMosque.phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Phone</span>
                    <span className="font-semibold text-[#1A2A3A]">{selectedMosque.phone}</span>
                  </div>
                )}
                {selectedMosque.website && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Website</span>
                    <span className="font-semibold text-[#1A2A3A] text-right max-w-[60%] truncate">{selectedMosque.website}</span>
                  </div>
                )}
                {selectedMosque.openingHours && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Opening Hours</span>
                    <span className="font-semibold text-[#1A2A3A] text-right max-w-[60%]">{selectedMosque.openingHours}</span>
                  </div>
                )}
              </div>

              {selectedMosque.facilities && selectedMosque.facilities.length > 0 && (
                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-[#1A2A3A] mb-2">Facilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMosque.facilities.map((facility, i) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-full bg-white text-[#5A6A7A] border border-[#E8EEF4]">
                        ✓ {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#1A2A3A] mb-2">Source</h4>
                <p className="text-xs text-[#94A3B8]">Data provided by OpenStreetMap</p>
                <p className="text-xs text-[#94A3B8]">OSM ID: {selectedMosque.osmId}</p>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                  onClick={() => handleGetDirections(selectedMosque)}
                >
                  Get Directions
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA] transition-all duration-200"
                  onClick={() => setShowMosqueModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== LEAFLET POPUP STYLES USING TAILWIND ===== */}
      <style>{`
        .mosque-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        
        .mosque-popup .leaflet-popup-tip {
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        
        .leaflet-control-zoom {
          margin: 10px !important;
        }
        
        .leaflet-control-zoom a {
          background: white !important;
          color: #1A2A3A !important;
          border-color: #E8EEF4 !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: #F1F7FC !important;
        }
        
        @media (max-width: 768px) {
          .leaflet-control-zoom {
            margin: 6px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MosqueFinder;