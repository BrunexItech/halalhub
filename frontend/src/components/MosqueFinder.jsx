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

// Custom marker styles
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
    setError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=KE`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service temporarily unavailable');
      }
      
      const data = await response.json();
      setSearchResults(data);
      setShowSearchSuggestions(data.length > 0);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Location search failed. Please try again.');
      setSearchResults([]);
      setShowSearchSuggestions(false);
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
    setError('');
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 14);
    }
    
    findNearbyMosques(lat, lon);
  };

  // ===== FIND NEARBY MOSQUES USING Time.Now API =====
  const findNearbyMosques = async (lat, lon, radius = searchRadius) => {
    setIsLoadingMosques(true);
    setError('');
    
    try {
      // Use the free Time.Now API
      const response = await fetch(
        `https://time.now/mosques/api/mosques?lat=${lat}&lon=${lon}&radius=${radius}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch mosque data');
      }
      
      const data = await response.json();
      
      // Transform API response to match our format
      const transformedMosques = data.map((item, index) => ({
        id: `mosque-${index}-${Date.now()}`,
        name: item.name || 'Unnamed Mosque',
        address: item.address || '',
        lat: item.lat || 0,
        lon: item.lon || 0,
        distance: item.distance_km || 0,
        city: item.city_slug ? item.city_slug.replace(/-/g, ' ') : '',
        verified: true,
        source: 'database',
        facilities: ['Prayer Hall', 'Wudu Area'],
        website: item.url || '',
        phone: '',
        imam_name: '',
        openingHours: '',
        osmId: null
      }));
      
      // Filter out mosques with invalid coordinates
      const validMosques = transformedMosques.filter(m => m.lat && m.lon);
      
      setMosques(validMosques);
      clearMarkers();
      
      if (validMosques.length > 0) {
        addMarkers(validMosques, lat, lon);
        setSuccess(`${validMosques.length} mosques found nearby`);
        
        if (mapRef.current) {
          const bounds = validMosques.map(m => [m.lat, m.lon]);
          if (bounds.length > 0) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          }
        }
      } else {
        setSuccess('No mosques found in this area. Try expanding the radius.');
      }
      
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to find mosques. Please try again.');
    } finally {
      setIsLoadingMosques(false);
    }
  };

  // ===== HELPER FUNCTIONS =====
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

  const addMarkers = (mosquesList, centerLat, centerLon) => {
    if (!mapRef.current) return;
    
    const mosqueIcon = createMosqueIcon();
    
    mosquesList.forEach(mosque => {
      const popupContent = `
        <div class="p-2 max-w-[220px]">
          <strong class="text-sm text-[#1F2937] block">${mosque.name}</strong>
          ${mosque.distance ? `<span class="text-[#0B342B] font-medium text-xs">${mosque.distance.toFixed(1)} km away</span>` : ''}
          ${mosque.address ? `<br><span class="text-[#6B7280] text-xs">${mosque.address}</span>` : ''}
          ${mosque.verified ? '<br><span class="text-xs text-[#3FAF73]">✓ Verified</span>' : ''}
          <br><button onclick="window.selectMosque('${mosque.id}')" class="mt-2 px-3 py-1 bg-[#0B342B] text-white text-xs font-medium rounded-lg hover:bg-[#032A24] transition-colors cursor-pointer border-none">View Details</button>
        </div>
      `;
      
      const marker = L.marker([mosque.lat, mosque.lon], { icon: mosqueIcon })
        .addTo(mapRef.current)
        .bindPopup(popupContent, { className: 'mosque-popup' });
      
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
      setError('');
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

  const handleSelectMosque = async (mosque) => {
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

  const getSourceBadge = (source, verified) => {
    if (source === 'database' || verified === true) {
      return { label: 'Verified', className: 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]' };
    }
    return { label: 'OSM Data', className: 'bg-[#FAFAF7] text-[#6B7280] border-[#E8EEF4]' };
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading Mosque Finder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-[#0B342B] mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 rounded-2xl p-8 md:p-12 shadow-lg shadow-[#0B342B]/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">Mosque Finder</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-[13px] font-medium text-[#C9A44B]/70">Powered by Time.Now</span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Find Mosques Near You
              </h1>
              <p className="text-white/70 text-[15px] mt-3 max-w-lg leading-relaxed">
                Discover verified mosques and community centers near your location. Data provided by Time.Now.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] font-semibold text-[#C9A44B] bg-white/10 px-4 py-2 rounded-xl border border-[#C9A44B]/20">
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
          <div className="mb-6 p-4 bg-white border border-[#DC2626]/20 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <span className="text-[15px] text-[#DC2626]">{error}</span>
            <button 
              className="px-5 py-2 bg-[#DC2626] text-white text-[13px] font-medium rounded-xl hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-white border border-[#3FAF73]/20 rounded-xl text-[15px] text-[#3FAF73] shadow-sm">
            {success}
          </div>
        )}

        {/* ===== SEARCH & CONTROLS ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleKeyPress}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin" />
                  </div>
                )}
                {showSearchSuggestions && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8EEF4] rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-3 hover:bg-[#FAFAF7] transition-colors border-b border-[#F4F5F1] last:border-0"
                        onClick={() => selectSearchResult(result)}
                      >
                        <div className="text-[15px] font-medium text-[#1F2937]">{result.display_name.split(',')[0]}</div>
                        <div className="text-[13px] text-[#6B7280]">{result.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button
              className="px-5 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 whitespace-nowrap shadow-md shadow-[#0B342B]/20 text-[15px]"
              onClick={handleUseCurrentLocation}
            >
              Use Current Location
            </button>
            
            <div className="flex items-center gap-2">
              <label className="text-[13px] font-medium text-[#6B7280]">Radius:</label>
              <select
                className="px-3 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
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
          
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[#F4F5F1]">
            <span className="text-[15px] text-[#6B7280]">
              {isLoadingMosques ? 'Searching for mosques...' : `${mosques.length} mosques found`}
            </span>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 text-[15px] font-medium rounded-xl transition-all duration-200 ${
                  viewMode === 'map' ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1]'
                }`}
                onClick={() => setViewMode('map')}
              >
                Map View
              </button>
              <button
                className={`px-4 py-2 text-[15px] font-medium rounded-xl transition-all duration-200 ${
                  viewMode === 'list' ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1]'
                }`}
                onClick={() => setViewMode('list')}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {/* ===== MAP & RESULTS ===== */}
        <div className={`grid ${viewMode === 'map' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {/* Map Container */}
          <div className={viewMode === 'map' ? 'lg:col-span-2' : 'w-full'}>
            <div 
              ref={mapContainerRef} 
              className="w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-[#E8EEF4] shadow-sm"
            />
            <div className="text-[13px] text-[#6B7280] mt-3 text-center">
              Data © Time.Now · Click on the map to search for mosques at that location
            </div>
          </div>

          {/* Results List */}
          {viewMode === 'map' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 h-[400px] md:h-[500px] lg:h-[600px] overflow-y-auto">
                <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">
                  {isLoadingMosques ? 'Loading...' : `Mosques (${mosques.length})`}
                </h3>
                
                {isLoadingMosques ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin" />
                  </div>
                ) : mosques.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[15px] text-[#6B7280]">No mosques found in this area</p>
                    <p className="text-[13px] text-[#6B7280] mt-1">Try expanding the search radius or searching another location</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mosques.map((mosque) => {
                      const sourceBadge = getSourceBadge(mosque.source, mosque.verified);
                      return (
                        <div 
                          key={mosque.id} 
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            selectedMosque?.id === mosque.id 
                              ? 'border-[#0B342B] bg-[#FAFAF7] shadow-sm' 
                              : 'border-[#E8EEF4] hover:border-[#0B342B]/30 hover:bg-[#FAFAF7]'
                          }`}
                          onClick={() => handleSelectMosque(mosque)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-[15px] text-[#1F2937]">{mosque.name}</h4>
                                <span className={`text-[12px] px-2 py-0.5 rounded-full border ${sourceBadge.className}`}>
                                  {sourceBadge.label}
                                </span>
                              </div>
                              {mosque.address && (
                                <p className="text-[13px] text-[#6B7280] mt-1">{mosque.address}</p>
                              )}
                              {mosque.city && (
                                <p className="text-[13px] text-[#6B7280]">{mosque.city}</p>
                              )}
                              {mosque.distance !== null && (
                                <p className="text-[13px] text-[#0B342B] font-medium mt-1">
                                  {formatDistance(mosque.distance)} away
                                </p>
                              )}
                              {mosque.imam_name && (
                                <p className="text-[13px] text-[#6B7280] mt-0.5">Imam: {mosque.imam_name}</p>
                              )}
                            </div>
                            <button
                              className="px-4 py-1.5 bg-[#0B342B] text-white text-[13px] font-medium rounded-xl hover:bg-[#032A24] transition-colors flex-shrink-0 shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGetDirections(mosque);
                              }}
                            >
                              Directions
                            </button>
                          </div>
                          {mosque.facilities && mosque.facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {mosque.facilities.slice(0, 3).map((facility, i) => (
                                <span key={i} className="text-[12px] px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                                  {facility}
                                </span>
                              ))}
                              {mosque.facilities.length > 3 && (
                                <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                                  +{mosque.facilities.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 mt-6">
            <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">
              {isLoadingMosques ? 'Loading...' : `Mosques (${mosques.length})`}
            </h3>
            
            {isLoadingMosques ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin" />
              </div>
            ) : mosques.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[15px] text-[#6B7280]">No mosques found in this area</p>
                <p className="text-[13px] text-[#6B7280] mt-1">Try expanding the search radius or searching another location</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mosques.map((mosque) => {
                  const sourceBadge = getSourceBadge(mosque.source, mosque.verified);
                  return (
                    <div 
                      key={mosque.id} 
                      className="p-5 rounded-xl border border-[#E8EEF4] hover:border-[#0B342B]/30 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                      onClick={() => handleSelectMosque(mosque)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-[15px] text-[#1F2937]">{mosque.name}</h4>
                        <span className={`text-[12px] px-2 py-0.5 rounded-full border ${sourceBadge.className}`}>
                          {sourceBadge.label}
                        </span>
                      </div>
                      {mosque.address && (
                        <p className="text-[14px] text-[#6B7280] mt-1">{mosque.address}</p>
                      )}
                      {mosque.city && (
                        <p className="text-[14px] text-[#6B7280]">{mosque.city}</p>
                      )}
                      {mosque.distance !== null && (
                        <p className="text-[14px] text-[#0B342B] font-medium mt-2">
                          {formatDistance(mosque.distance)} away
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          className="flex-1 px-3 py-2 bg-[#0B342B] text-white text-[13px] font-medium rounded-xl hover:bg-[#032A24] transition-colors shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDirections(mosque);
                          }}
                        >
                          Directions
                        </button>
                        <button
                          className="flex-1 px-3 py-2 bg-[#FAFAF7] text-[#1F2937] text-[13px] font-medium rounded-xl hover:bg-[#F4F5F1] transition-colors border border-[#E8EEF4]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectMosque(mosque);
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== FOOTER ATTRIBUTION (Required by Time.Now) ===== */}
        <div className="mt-6 text-center text-[13px] text-[#6B7280]">
          <a 
            href="https://time.now" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-[#0B342B] transition-colors"
          >
            Mosque data by Time.Now
          </a>
          <span className="mx-2">·</span>
          <span>Data © OpenStreetMap contributors</span>
        </div>
      </div>

      {/* ===== MOSQUE DETAILS MODAL ===== */}
      {showMosqueModal && selectedMosque && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">{selectedMosque.name}</h3>
                {selectedMosque.verified && (
                  <span className="text-[12px] px-3 py-1 rounded-full bg-[#D1FAE5] text-[#3FAF73] border border-[#A7F3D0] font-medium">
                    Verified
                  </span>
                )}
              </div>
              <button 
                className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]"
                onClick={() => setShowMosqueModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                {selectedMosque.address && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Address</span>
                    <span className="font-semibold text-[#1F2937] text-right max-w-[60%]">{selectedMosque.address}</span>
                  </div>
                )}
                {selectedMosque.city && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">City</span>
                    <span className="font-semibold text-[#1F2937]">{selectedMosque.city}</span>
                  </div>
                )}
                {selectedMosque.distance !== null && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Distance</span>
                    <span className="font-semibold text-[#0B342B]">{formatDistance(selectedMosque.distance)}</span>
                  </div>
                )}
                {selectedMosque.phone && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Phone</span>
                    <span className="font-semibold text-[#1F2937]">{selectedMosque.phone}</span>
                  </div>
                )}
                {selectedMosque.website && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Website</span>
                    <span className="font-semibold text-[#1F2937] text-right max-w-[60%] truncate">{selectedMosque.website}</span>
                  </div>
                )}
                {selectedMosque.imam_name && (
                  <div className="flex justify-between text-[15px] pt-3 border-t border-[#E8EEF4]">
                    <span className="text-[#6B7280]">Imam</span>
                    <span className="font-semibold text-[#1F2937]">{selectedMosque.imam_name}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] pt-3 border-t border-[#E8EEF4]">
                  <span className="text-[#6B7280]">Source</span>
                  <span className="font-semibold text-[#1F2937]">
                    {selectedMosque.verified ? 'Time.Now Verified' : 'OpenStreetMap'}
                  </span>
                </div>
              </div>

              {/* Facilities */}
              {selectedMosque.facilities && selectedMosque.facilities.length > 0 && (
                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <h4 className="text-[14px] font-semibold text-[#1F2937] mb-2">Facilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMosque.facilities.map((facility, i) => (
                      <span key={i} className="text-[13px] px-3 py-1 rounded-full bg-white text-[#6B7280] border border-[#E8EEF4]">
                        ✓ {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 px-5 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
                  onClick={() => handleGetDirections(selectedMosque)}
                >
                  Get Directions
                </button>
                <button
                  className="flex-1 px-5 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:border-[#0B342B] hover:text-[#0B342B] transition-all duration-200 text-[15px]"
                  onClick={() => setShowMosqueModal(false)}
                >
                  Close
                </button>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-3 border border-[#E8EEF4]">
                <p className="text-[13px] text-[#6B7280]">
                  {selectedMosque.verified ? 'Data provided by Time.Now' : 'Data provided by OpenStreetMap'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== LEAFLET POPUP STYLES ===== */}
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
          background: #FAFAF7 !important;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
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