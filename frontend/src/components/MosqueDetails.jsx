import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pensionService } from '../services/api';

const MosqueDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mosque, setMosque] = useState(null);
  const [imams, setImams] = useState([]);

  useEffect(() => {
    fetchMosqueDetails();
  }, [id]);

  const fetchMosqueDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pensionService.getMosqueById(id);
      setMosque(response.data.mosque);
      setImams(response.data.imams || []);
    } catch (err) {
      console.error('Error fetching mosque details:', err);
      setError('Failed to load mosque details. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getMosqueImage = (name) => {
    return `https://via.placeholder.com/800x400/1769AA/fff?text=${encodeURIComponent(name)}`;
  };

  // SVG Icons
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

  const CheckIcon = () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

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
            Back to Mosques
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
              <p className="text-white/70 text-sm mt-2 flex items-center gap-1">
                <LocationIcon /> {mosque.county || 'County not specified'} · {mosque.location || 'Location not specified'}
              </p>
              {mosque.imam && (
                <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                  <UserIcon /> Imam: {mosque.imam.name || 'No Imam Assigned'}
                </p>
              )}
            </div>
            <button 
              className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors"
              onClick={() => navigate('/select-mosque')}
            >
              Back to Mosques
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
              onClick={fetchMosqueDetails}
            >
              Retry
            </button>
          </div>
        )}

        {/* Mosque Description */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 mb-6">
          {mosque.imam && (
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#F1F7FC]">
              {mosque.imam.image ? (
                <img src={mosque.imam.image} alt={mosque.imam.name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-2xl">
                  {mosque.imam.name?.charAt(0) || 'I'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1A2A3A]">{mosque.imam.name || 'No Imam Assigned'}</span>
                  {mosque.imam.verified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckIcon /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#94A3B8]">{mosque.imam.title || 'Imam'}</p>
                <p className="text-sm text-[#94A3B8]">{mosque.imam.yearsOfService || 0} years of service</p>
                {mosque.imam.totalContributions > 0 && (
                  <p className="text-sm text-[#1769AA] flex items-center gap-1">
                    <MoneyIcon /> {formatCurrency(mosque.imam.totalContributions)} raised
                  </p>
                )}
              </div>
            </div>
          )}
          <p className="text-sm text-[#5A6A7A] leading-relaxed">
            {mosque.imam?.bio || 'No description available for this mosque.'}
          </p>
        </div>

        {/* Imams Section */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A2A3A]">Imams at This Mosque</h2>
            <span className="text-sm text-[#94A3B8]">{imams.length} imams</span>
          </div>
          
          {imams.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-8">No imams registered at this mosque</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {imams.map((imam) => (
                <div 
                  key={imam.imam_id} 
                  className="border border-[#E8EEF4] rounded-xl p-5 hover:border-[#1769AA] hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/imam/${imam.imam_id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {imam.profile_image ? (
                          <img src={imam.profile_image} alt={imam.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {imam.name?.charAt(0) || 'I'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">{imam.name}</h3>
                            {imam.verified && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#94A3B8]">{imam.title || 'Imam'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#5A6A7A] mt-2">{imam.years_of_service || 0} years of service</p>
                      {imam.total_contributions > 0 && (
                        <p className="text-sm text-[#1769AA] mt-1 flex items-center gap-1">
                          <MoneyIcon /> {formatCurrency(imam.total_contributions)} raised
                        </p>
                      )}
                    </div>
                    <button 
                      className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-lg hover:bg-[#2F80C0] transition-all duration-200 ml-4 flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); navigate(`/imam/${imam.imam_id}`); }}
                    >
                      Support <ChevronIcon />
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