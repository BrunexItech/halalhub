import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SelectMosque = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [mosques, setMosques] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('All');

  const counties = ['All', 'Nairobi', 'Mombasa', 'Kisumu', 'Garissa', 'Nakuru', 'Eldoret', 'Malindi', 'Kitale', 'Kakamega'];

  useEffect(() => {
    const mockMosques = [
      { id: 1, name: 'Jamia Mosque Nairobi', county: 'Nairobi', imam: 'Sheikh Abdul Rahman', congregation: 3000, verified: true, address: 'City Centre, Nairobi' },
      { id: 2, name: 'Masjid Al-Nur', county: 'Nairobi', imam: 'Sheikh Mohammed Idd', congregation: 800, verified: true, address: 'Westlands, Nairobi' },
      { id: 3, name: 'Mombasa Mandhry Mosque', county: 'Mombasa', imam: 'Sheikh Omar Said', congregation: 1200, verified: true, address: 'Old Town, Mombasa' },
      { id: 4, name: 'Garissa Central Mosque', county: 'Garissa', imam: 'Sheikh Abdirahman', congregation: 700, verified: true, address: 'Garissa Town, Garissa' },
      { id: 5, name: 'Nakuru Central Mosque', county: 'Nakuru', imam: 'Sheikh Hassan Juma', congregation: 500, verified: true, address: 'Nakuru CBD, Nakuru' }
    ];
    setMosques(mockMosques);
    setLoading(false);
  }, []);

  const filteredMosques = mosques.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.imam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.county.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCounty = selectedCounty === 'All' || m.county === selectedCounty;
    return matchesSearch && matchesCounty;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading...</p>
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
              ← Back to Program
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Search</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                placeholder="Search by mosque or imam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
          {filteredMosques.length} mosque{filteredMosques.length !== 1 ? 's' : ''} found
        </div>

        {/* Mosque List */}
        {filteredMosques.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-12 text-center">
            <p className="text-sm text-[#94A3B8]">No mosques found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMosques.map((mosque) => (
              <div 
                key={mosque.id} 
                className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 hover:border-[#1769AA] hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/mosque/${mosque.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#1A2A3A]">{mosque.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                    </div>
                    <p className="text-sm text-[#94A3B8] mt-1">{mosque.county}</p>
                    <p className="text-sm text-[#5A6A7A] mt-2">Imam: {mosque.imam}</p>
                    <p className="text-sm text-[#5A6A7A]">{mosque.congregation.toLocaleString()} members</p>
                  </div>
                  <button 
                    className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-lg hover:bg-[#2F80C0] transition-all duration-200 ml-4"
                    onClick={(e) => { e.stopPropagation(); navigate(`/mosque/${mosque.id}`); }}
                  >
                    View Imams →
                  </button>
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