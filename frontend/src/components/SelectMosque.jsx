import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pensionService } from '../services/api';

const SelectMosque = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mosques, setMosques] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [counties, setCounties] = useState(['All']);

  useEffect(() => {
    fetchCounties();
    fetchMosques();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMosques();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCounty]);

  const fetchCounties = async () => {
    try {
      const response = await pensionService.getMosques({ limit: 200 });
      const allCounties = response.data.mosques
        .map(m => m.county)
        .filter(c => c && c !== 'County not specified');
      const uniqueCounties = ['All', ...new Set(allCounties)];
      setCounties(uniqueCounties);
    } catch (err) {
      console.error('Error fetching counties:', err);
    }
  };

  const fetchMosques = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (searchQuery) params.search = searchQuery;
      if (selectedCounty && selectedCounty !== 'All') params.county = selectedCounty;
      
      const response = await pensionService.getMosques(params);
      setMosques(response.data.mosques || []);
    } catch (err) {
      console.error('Error fetching mosques:', err);
      setError('Failed to load mosques. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const getMosqueImage = (name) => {
    return `https://via.placeholder.com/400x200/1769AA/fff?text=${encodeURIComponent(name)}`;
  };

  // SVG Icons
  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const LocationIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const ChevronIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );

  if (loading && mosques.length === 0) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading mosques...</p>
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
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Select a Mosque</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Step 1 of 3</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Find a Mosque in Your Community
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Choose a mosque to view its Imams and start supporting their long-term welfare.
              </p>
            </div>
            <button 
              className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors"
              onClick={() => navigate('/pension')}
            >
              Back to Program
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {error && (
          <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={fetchMosques}
            >
              Retry
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Search</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2.5 pl-9 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                  placeholder="Search by mosque or imam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><SearchIcon /></span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">County</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
              >
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-[#94A3B8] mb-4">
          {mosques.length} mosque{mosques.length !== 1 ? 's' : ''} found
        </div>

        {/* Mosque List */}
        {mosques.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-12 text-center">
            <p className="text-sm text-[#94A3B8]">No mosques found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mosques.map((mosque) => (
              <div 
                key={mosque.id} 
                className="bg-white rounded-xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:border-[#1769AA] hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/mosque/${mosque.id}`)}
              >
                <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${getMosqueImage(mosque.name)})` }}>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified
                  </span>
                  {mosque.imam_verified && (
                    <span className="absolute bottom-3 left-3 text-xs font-semibold px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[#1A2A3A] border border-white/20">
                      Imam Verified
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">{mosque.name}</h3>
                      <p className="text-sm text-[#94A3B8] flex items-center gap-1 mt-1">
                        <LocationIcon /> {mosque.county || 'County not specified'}
                      </p>
                      <p className="text-sm text-[#5A6A7A] mt-2 flex items-center gap-1">
                        <UserIcon /> Imam: {mosque.imam_name || 'No Imam Assigned'}
                      </p>
                      {mosque.imam_title && (
                        <p className="text-xs text-[#94A3B8]">{mosque.imam_title}</p>
                      )}
                    </div>
                    <button 
                      className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-lg hover:bg-[#2F80C0] transition-all duration-200 ml-4 flex items-center gap-1"
                      onClick={(e) => { e.stopPropagation(); navigate(`/mosque/${mosque.id}`); }}
                    >
                      View <ChevronIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectMosque;