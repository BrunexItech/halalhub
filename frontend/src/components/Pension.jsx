import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pensionService } from '../services/api';

const Pension = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalImams: 0,
    totalMosques: 0,
    communitiesServed: 0,
    monthlyContributors: 0,
    totalContributions: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pensionService.getStats();
      setStats(response.data.stats || {
        totalImams: 0,
        totalMosques: 0,
        communitiesServed: 0,
        monthlyContributors: 0,
        totalContributions: 0
      });
    } catch (err) {
      console.error('Error fetching pension stats:', err);
      setError('Failed to load stats. Please refresh.');
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

  // SVG Icons
  const MosqueIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const PersonIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const CommunityIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  const HeartIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const ShieldIcon = () => (
    <svg className="w-5 h-5 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-3 sm:p-4 md:p-5 lg:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-3 text-sm">Loading pension stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-2 sm:p-4 md:p-5 lg:p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* ===== HEADER ===== */}
        <div className="mb-4 sm:mb-5">
          <h1 className="text-base sm:text-lg font-bold text-[#1F2937]">Imam Pension</h1>
          <p className="text-xs text-[#6B7280]">Community-powered retirement support</p>
        </div>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#DC2626]">{error}</span>
            <button 
              className="px-3 py-1 bg-[#DC2626] text-white text-[10px] font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={fetchStats}
            >
              Retry
            </button>
          </div>
        )}

        {/* ===== HERO SECTION ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#032A24] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl shadow-black/10 border border-[rgba(201,164,75,0.15)] mb-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-[rgba(201,164,75,0.05)] rounded-full" />
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-[10px] font-semibold text-[#B7C0BA] uppercase tracking-wider">Imam Retirement Support</span>
                  <span className="w-px h-3 bg-[rgba(201,164,75,0.2)]" />
                  <span className="text-[10px] font-medium text-[#C9A44B]">Community-Powered</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F7F6F1] leading-tight">
                  Supporting Imams Through
                  <span className="block text-[#C9A44B]">Community-Powered Retirement</span>
                </h1>
                <p className="text-[#B7C0BA] text-sm mt-2 max-w-lg">
                  Join a community of believers supporting the long-term welfare of Imams 
                  through a structured, dignified, and Sharia-compliant program.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button 
                    className="px-5 py-2 bg-[#C9A44B] text-[#032A24] font-bold text-sm rounded-lg hover:bg-[#E1C16B] transition-all duration-200 shadow-lg shadow-[#C9A44B]/20"
                    onClick={() => navigate('/select-mosque')}
                  >
                    Support an Imam
                  </button>
                  <button 
                    className="px-5 py-2 bg-white/10 backdrop-blur-sm text-[#F7F6F1] font-semibold text-sm rounded-lg border border-[rgba(201,164,75,0.2)] hover:bg-white/20 transition-all duration-200"
                    onClick={() => document.querySelector('.how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Learn More
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 min-w-[160px]">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-[rgba(201,164,75,0.1)]">
                  <div className="text-xl md:text-2xl font-bold text-[#F7F6F1]">{stats.totalImams}</div>
                  <div className="text-[10px] text-[#B7C0BA]/60">Imams</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-[rgba(201,164,75,0.1)]">
                  <div className="text-xl md:text-2xl font-bold text-[#C9A44B]">{stats.totalMosques}</div>
                  <div className="text-[10px] text-[#B7C0BA]/60">Mosques</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-[rgba(201,164,75,0.1)]">
                  <div className="text-xl md:text-2xl font-bold text-[#3FAF73]">{stats.communitiesServed}</div>
                  <div className="text-[10px] text-[#B7C0BA]/60">Communities</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-[rgba(201,164,75,0.1)]">
                  <div className="text-xl md:text-2xl font-bold text-[#F7F6F1]">{stats.monthlyContributors}</div>
                  <div className="text-[10px] text-[#B7C0BA]/60">Contributors</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== HOW IT WORKS ===== */}
        <div className="how-it-works bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5 md:p-6 mb-5">
          <h2 className="text-sm font-bold text-[#1F2937] mb-4 text-center">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-[#0B342B]">1</span>
              </div>
              <div className="font-semibold text-[#1F2937] text-xs">Select Mosque</div>
              <div className="text-[10px] text-[#6B7280] mt-0.5">Choose a mosque</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-[#0B342B]">2</span>
              </div>
              <div className="font-semibold text-[#1F2937] text-xs">Choose Imam</div>
              <div className="text-[10px] text-[#6B7280] mt-0.5">Select an Imam</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-[#0B342B]">3</span>
              </div>
              <div className="font-semibold text-[#1F2937] text-xs">Contribute</div>
              <div className="text-[10px] text-[#6B7280] mt-0.5">Support their welfare</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-[#0B342B]">4</span>
              </div>
              <div className="font-semibold text-[#1F2937] text-xs">Community</div>
              <div className="text-[10px] text-[#6B7280] mt-0.5">Together we support</div>
            </div>
          </div>
        </div>

        {/* ===== STATS CARDS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 text-center hover:shadow-md hover:border-[rgba(11,52,43,0.2)] transition-all duration-200">
            <div className="flex justify-center mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B342B]/10 flex items-center justify-center">
                <PersonIcon />
              </div>
            </div>
            <div className="text-lg font-bold text-[#1F2937]">{stats.totalImams}</div>
            <div className="text-[10px] text-[#6B7280]">Imams Supported</div>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 text-center hover:shadow-md hover:border-[rgba(11,52,43,0.2)] transition-all duration-200">
            <div className="flex justify-center mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B342B]/10 flex items-center justify-center">
                <MosqueIcon />
              </div>
            </div>
            <div className="text-lg font-bold text-[#1F2937]">{stats.totalMosques}</div>
            <div className="text-[10px] text-[#6B7280]">Mosques</div>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 text-center hover:shadow-md hover:border-[rgba(11,52,43,0.2)] transition-all duration-200">
            <div className="flex justify-center mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B342B]/10 flex items-center justify-center">
                <CommunityIcon />
              </div>
            </div>
            <div className="text-lg font-bold text-[#1F2937]">{stats.communitiesServed}</div>
            <div className="text-[10px] text-[#6B7280]">Communities</div>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 text-center hover:shadow-md hover:border-[rgba(11,52,43,0.2)] transition-all duration-200">
            <div className="flex justify-center mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B342B]/10 flex items-center justify-center">
                <HeartIcon />
              </div>
            </div>
            <div className="text-lg font-bold text-[#1F2937]">{stats.monthlyContributors}</div>
            <div className="text-[10px] text-[#6B7280]">Contributors</div>
          </div>
        </div>

        {/* ===== TOTAL CONTRIBUTIONS ===== */}
        {stats.totalContributions > 0 && (
          <div className="bg-gradient-to-r from-[#0B342B] to-[#12342D] rounded-xl border border-[rgba(201,164,75,0.15)] p-5 md:p-6 mb-5 text-[#F7F6F1] text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <ShieldIcon />
              <span className="text-[10px] font-medium text-[#B7C0BA]">Total Community Contributions</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-[#C9A44B]">{formatCurrency(stats.totalContributions)}</div>
            <p className="text-[10px] text-[#B7C0BA]/60 mt-1">Barakah in giving</p>
          </div>
        )}

        {/* ===== CTA SECTION ===== */}
        <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-5 md:p-6 text-center">
          <h3 className="text-sm font-bold text-[#1F2937] mb-1.5">Ready to Support?</h3>
          <p className="text-xs text-[#6B7280] mb-4">Find a mosque and start supporting an Imam today.</p>
          <button 
            className="px-6 py-2 bg-[#0B342B] text-[#F7F6F1] font-bold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
            onClick={() => navigate('/select-mosque')}
          >
            Find a Mosque
          </button>
          <p className="text-[10px] text-[#6B7280] mt-3">Wakala Model · 0% Riba · Community-Powered</p>
        </div>

      </div>
    </div>
  );
};

export default Pension;