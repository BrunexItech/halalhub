import React, { useState, useEffect, useRef } from 'react';

// SVG Icons - Each used only once
const LocationIcon = () => (
  <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MosqueIcon = () => (
  <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const GPSIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18v-5m0 0V8m0 5h5m-5 0H8m4 10a10 10 0 100-20 10 10 0 000 20z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const LoadingIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-[#3FAF73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const MosqueFinder = () => {
  const [location, setLocation] = useState('');
  const [mosqueOrCity, setMosqueOrCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [error, setError] = useState('');
  const locationInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('mosqueRecentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  const saveRecentSearch = (location, mosque) => {
    const search = {
      location,
      mosque: mosque || 'All Mosques',
      timestamp: Date.now()
    };
    const updated = [search, ...recentSearches.filter(s => 
      s.location !== location || s.mosque !== mosque
    )].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('mosqueRecentSearches', JSON.stringify(updated));
  };

  const buildGoogleMapsUrl = (locationInput, mosqueInput) => {
    const trimmedLocation = locationInput.trim();
    const trimmedMosque = mosqueInput.trim();

    if (!trimmedLocation) {
      setError('Please enter your location or starting point');
      return null;
    }

    setError('');

    if (trimmedLocation && trimmedMosque) {
      return `https://www.google.com/maps/search/${encodeURIComponent(trimmedMosque)}+near+${encodeURIComponent(trimmedLocation)}`;
    }

    if (trimmedLocation && !trimmedMosque) {
      return `https://www.google.com/maps/search/mosque+near+${encodeURIComponent(trimmedLocation)}`;
    }

    return `https://www.google.com/maps/search/mosque`;
  };

  const handleSearch = () => {
    const trimmedLocation = location.trim();
    
    if (!trimmedLocation) {
      setError('Please enter your location or starting point');
      locationInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError('');

    const url = buildGoogleMapsUrl(location, mosqueOrCity);
    
    if (url) {
      saveRecentSearch(trimmedLocation, mosqueOrCity.trim());
      
      setTimeout(() => {
        window.open(url, '_blank');
        setIsLoading(false);
      }, 300);
    } else {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/search/mosque/@${latitude},${longitude},14z`;
        window.open(url, '_blank');
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please enter your location manually.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    if (error) setError('');
  };

  const handleMosqueChange = (e) => {
    setMosqueOrCity(e.target.value);
    if (error) setError('');
  };

  const loadRecentSearch = (search) => {
    setLocation(search.location);
    if (search.mosque !== 'All Mosques') {
      setMosqueOrCity(search.mosque);
    } else {
      setMosqueOrCity('');
    }
    setShowRecent(false);
    setTimeout(handleSearch, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF7] to-[#F0EFEB]">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#032A24] via-[#0B342B] to-[#032A24] mx-3 sm:mx-4 md:mx-6 lg:mx-8 mt-3 sm:mt-4 md:mt-6 rounded-2xl shadow-lg border border-[#C9A44B]/20">
        <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-48 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <span className="text-[11px] sm:text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">Mosque Finder</span>
                <span className="w-px h-3 sm:h-4 bg-[#C9A44B]/30" />
                <span className="text-[11px] sm:text-[13px] font-medium text-[#C9A44B]/70">Google Maps</span>
              </div>
              <h1 className="text-[22px] sm:text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Find Mosques Near You
              </h1>
              <p className="text-white/70 text-[14px] sm:text-[15px] mt-2 sm:mt-3 max-w-lg leading-relaxed">
                Enter your location to find mosques, masjids, and Islamic centers. Get directions instantly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className="text-[11px] sm:text-[13px] font-semibold text-[#C9A44B] bg-white/10 px-3 sm:px-4 py-1.5 rounded-xl border border-[#C9A44B]/20 whitespace-nowrap">
                Search & Navigate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        
        {/* Search Section */}
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-4 sm:p-6 md:p-8">
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fadeIn">
              <ErrorIcon />
              <div className="flex-1">
                <p className="text-[14px] sm:text-[15px] text-red-600">{error}</p>
              </div>
              <button 
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                onClick={() => setError('')}
              >
                <CloseIcon />
              </button>
            </div>
          )}

          <div className="space-y-4 sm:space-y-5">
            
            {/* Location Field - Mandatory */}
            <div>
              <label className="block text-[13px] sm:text-[14px] font-semibold text-[#1F2937] mb-1.5">
                Current Location / Starting Point <span className="text-red-500 text-sm">*</span>
              </label>
              <div className="relative">
                <input
                  ref={locationInputRef}
                  type="text"
                  className="w-full px-4 py-2.5 sm:py-3 border-2 border-[#E8EEF4] rounded-xl text-[15px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-200 bg-white pl-11 sm:pl-12"
                  placeholder="e.g., Nairobi CBD, Mombasa, Parklands..."
                  value={location}
                  onChange={handleLocationChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setShowRecent(true)}
                  onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                />
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                  <LocationIcon />
                </span>
                {location && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors"
                    onClick={() => setLocation('')}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
              <p className="text-[11px] sm:text-[12px] text-[#6B7280] mt-1.5">
                <span className="text-red-500">*</span> Required — Enter where you are starting from
              </p>

              {/* Recent Searches */}
              {showRecent && recentSearches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-[#E8EEF4] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  <div className="px-4 py-2 text-[11px] sm:text-[12px] text-[#6B7280] border-b border-[#F4F5F1] flex items-center gap-2">
                    <ClockIcon />
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-[#FAFAF7] transition-colors border-b border-[#F4F5F1] last:border-0 flex items-center gap-2"
                      onClick={() => loadRecentSearch(search)}
                    >
                      <span className="text-[#6B7280]">
                        <LocationIcon />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] sm:text-[14px] font-medium text-[#1F2937] truncate">{search.location}</div>
                        <div className="text-[11px] sm:text-[12px] text-[#6B7280] truncate">{search.mosque}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mosque/City Field - Optional */}
            <div>
              <label className="block text-[13px] sm:text-[14px] font-semibold text-[#1F2937] mb-1.5">
                Mosque or City <span className="text-[#6B7280] font-normal text-[12px]">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2.5 sm:py-3 border-2 border-[#E8EEF4] rounded-xl text-[15px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-200 bg-white pl-11 sm:pl-12"
                  placeholder="e.g., Jamia Mosque, or leave blank to browse all"
                  value={mosqueOrCity}
                  onChange={handleMosqueChange}
                  onKeyPress={handleKeyPress}
                />
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                  <MosqueIcon />
                </span>
                {mosqueOrCity && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors"
                    onClick={() => setMosqueOrCity('')}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
              <p className="text-[11px] sm:text-[12px] text-[#6B7280] mt-1.5">
                Leave blank to see <span className="font-medium text-[#0B342B]">all mosques</span> near your location
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                className="flex-1 px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#0B342B] to-[#032A24] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#0B342B]/20 transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[14px] sm:text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSearch}
                disabled={isLoading || !location.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingIcon />
                    Searching...
                  </span>
                ) : (
                  <>
                    <SearchIcon />
                    Find Mosques
                  </>
                )}
              </button>
              
              <button
                className="px-6 py-2.5 sm:py-3 bg-white text-[#0B342B] font-semibold rounded-xl border-2 border-[#0B342B] hover:bg-[#0B342B] hover:text-white transition-all duration-200 text-[14px] sm:text-[15px] flex items-center justify-center gap-2 whitespace-nowrap"
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
              >
                <GPSIcon />
                Use My Location
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-4 sm:mt-6 bg-[#0B342B]/5 rounded-xl border border-[#C9A44B]/20 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <GlobeIcon />
              Google Maps
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5">
              <CheckIcon />
              Accurate locations
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5">
              <MapPinIcon />
              Real-time directions
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl border border-[#E8EEF4] p-3 sm:p-4 text-center shadow-sm">
            <p className="text-lg sm:text-xl font-bold text-[#0B342B]">1000+</p>
            <p className="text-[10px] sm:text-[11px] text-[#6B7280] uppercase tracking-wider">Mosques</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] p-3 sm:p-4 text-center shadow-sm">
            <p className="text-lg sm:text-xl font-bold text-[#C9A44B]">47</p>
            <p className="text-[10px] sm:text-[11px] text-[#6B7280] uppercase tracking-wider">Counties</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] p-3 sm:p-4 text-center shadow-sm">
            <p className="text-lg sm:text-xl font-bold text-[#0B342B]">24/7</p>
            <p className="text-[10px] sm:text-[11px] text-[#6B7280] uppercase tracking-wider">Available</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] p-3 sm:p-4 text-center shadow-sm">
            <p className="text-lg sm:text-xl font-bold text-[#C9A44B]">Free</p>
            <p className="text-[10px] sm:text-[11px] text-[#6B7280] uppercase tracking-wider">To Use</p>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @media (max-width: 480px) {
          input {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MosqueFinder;