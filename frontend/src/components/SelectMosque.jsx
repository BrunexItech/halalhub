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
    return `https://via.placeholder.com/400x200/0B342B/fff?text=${encodeURIComponent(name)}`;
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
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading mosques...</p>
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
                <span className="text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">Select a Mosque</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-[13px] font-medium text-[#C9A44B]/70">Step 1 of 3</span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Find a Mosque in Your Community
              </h1>
              <p className="text-white/70 text-[15px] mt-3 max-w-lg leading-relaxed">
                Choose a mosque to view its Imams and start supporting their long-term welfare.
              </p>
            </div>
            <button 
              className="text-white/60 hover:text-white text-[15px] flex items-center gap-2 transition-colors font-medium"
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
          <div className="mb-4 p-4 bg-white border border-[#DC2626]/20 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <span className="text-[15px] text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-[13px] font-medium rounded-lg hover:bg-[#B91C1C] transition-colors"
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
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Search</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2.5 pl-9 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                  placeholder="Search by mosque or imam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"><SearchIcon /></span>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">County</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white appearance-none"
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
        <div className="text-[15px] text-[#6B7280] mb-4">
          {mosques.length} mosque{mosques.length !== 1 ? 's' : ''} found
        </div>

        {/* Mosque List */}
        {mosques.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-16 text-center">
            <p className="text-[15px] text-[#6B7280]">No mosques found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mosques.map((mosque) => (
              <div 
                key={mosque.id} 
                className="bg-white rounded-xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:border-[#0B342B] hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/mosque/${mosque.id}`)}
              >
                <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${getMosqueImage(mosque.name)})` }}>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#D1FAE5] text-[#3FAF73] border border-[#A7F3D0]">
                    Verified
                  </span>
                  {mosque.imam_verified && (
                    <span className="absolute bottom-3 left-3 text-[13px] font-medium px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[#1F2937] border border-white/20">
                      Imam Verified
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1F2937] group-hover:text-[#0B342B] transition-colors text-[15px]">{mosque.name}</h3>
                      <p className="text-[14px] text-[#6B7280] flex items-center gap-1 mt-1">
                        <LocationIcon /> {mosque.county || 'County not specified'}
                      </p>
                      <p className="text-[14px] text-[#6B7280] mt-2 flex items-center gap-1">
                        <UserIcon /> Imam: {mosque.imam_name || 'No Imam Assigned'}
                      </p>
                      {mosque.imam_title && (
                        <p className="text-[13px] text-[#6B7280]">{mosque.imam_title}</p>
                      )}
                    </div>
                    <button 
                      className="px-4 py-2 bg-[#0B342B] text-white text-[14px] font-medium rounded-lg hover:bg-[#032A24] transition-all duration-200 shadow-sm flex items-center gap-1 flex-shrink-0"
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