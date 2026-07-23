import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MosqueDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [mosque, setMosque] = useState(null);
  const [imams, setImams] = useState([]);

  useEffect(() => {
    const mockMosque = {
      id: parseInt(id),
      name: 'Jamia Mosque Nairobi',
      county: 'Nairobi',
      address: 'City Centre, Nairobi',
      imam: 'Sheikh Abdul Rahman',
      congregation: 3000,
      verified: true,
      description: 'The oldest and largest mosque in Nairobi. A center for Islamic learning and community activities.'
    };
    setMosque(mockMosque);
    
    setImams([
      { id: 101, name: 'Sheikh Abdul Rahman', role: 'Chief Imam', verified: true, yearsOfService: 12 },
      { id: 102, name: 'Sheikh Musa Ibrahim', role: 'Assistant Imam', verified: true, yearsOfService: 5 }
    ]);
    setLoading(false);
  }, [id]);

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

  if (!mosque) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-[#FECACA] shadow-sm p-8 text-center max-w-md">
          <p className="text-sm text-[#94A3B8]">Mosque not found</p>
          <button 
            className="mt-4 px-6 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
            onClick={() => navigate('/select-mosque')}
          >
            ← Back
          </button>
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
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Mosque Details</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Step 2 of 3</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{mosque.name}</h1>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/20">Verified</span>
              </div>
              <p className="text-white/70 text-sm mt-2">{mosque.county} · {mosque.address}</p>
              <p className="text-white/60 text-sm mt-1">Imam: {mosque.imam} · {mosque.congregation.toLocaleString()} members</p>
            </div>
            <button 
              className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors"
              onClick={() => navigate('/select-mosque')}
            >
              ← Back to Mosques
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Mosque Description */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 mb-6">
          <p className="text-sm text-[#5A6A7A] leading-relaxed">{mosque.description}</p>
        </div>

        {/* Imams Section */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1A2A3A] mb-4">Imams at This Mosque</h2>
          
          {imams.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-8">No imams registered at this mosque</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {imams.map((imam) => (
                <div 
                  key={imam.id} 
                  className="border border-[#E8EEF4] rounded-xl p-5 hover:border-[#1769AA] hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/imam/${imam.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1A2A3A]">{imam.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                      </div>
                      <p className="text-sm text-[#94A3B8]">{imam.role}</p>
                      <p className="text-sm text-[#5A6A7A] mt-1">{imam.yearsOfService} years of service</p>
                    </div>
                    <button 
                      className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-lg hover:bg-[#2F80C0] transition-all duration-200"
                      onClick={(e) => { e.stopPropagation(); navigate(`/imam/${imam.id}`); }}
                    >
                      Support →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MosqueDetails;