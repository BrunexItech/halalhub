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
    <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const PersonIcon = () => (
    <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const CommunityIcon = () => (
    <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  const HeartIcon = () => (
    <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  return (
    <div className="min-h-screen bg-[#F1F7FC]">
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 p-8 md:p-12 lg:p-16 shadow-lg shadow-[#1769AA]/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Imam Retirement Support</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Community-Powered</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Supporting Imams Through
                <span className="block text-[#E8C96A]">Community-Powered Retirement</span>
              </h1>
              <p className="text-white/70 text-sm md:text-base mt-4 max-w-lg">
                Join a community of believers supporting the long-term welfare of Imams 
                through a structured, dignified, and Sharia-compliant program.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button 
                  className="px-6 py-3 bg-[#E8C96A] text-[#0a1628] font-bold rounded-xl hover:bg-[#d4b95a] transition-all duration-200 shadow-lg shadow-[#E8C96A]/20"
                  onClick={() => navigate('/select-mosque')}
                >
                  Support an Imam
                </button>
                <button 
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
                  onClick={() => document.querySelector('.how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 min-w-[200px]">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalImams}</div>
                <div className="text-xs text-white/50">Imams</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#E8C96A]">{stats.totalMosques}</div>
                <div className="text-xs text-white/50">Mosques</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-emerald-300">{stats.communitiesServed}</div>
                <div className="text-xs text-white/50">Communities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-white">{stats.monthlyContributors}</div>
                <div className="text-xs text-white/50">Contributors</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mt-4">
          <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={fetchStats}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* How It Works */}
        <div className="how-it-works bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 md:p-8 mb-8">
          <h2 className="text-lg md:text-xl font-bold text-[#1A2A3A] mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1769AA]/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-[#1769AA]">1</span>
              </div>
              <div className="font-semibold text-[#1A2A3A] text-sm">Select Mosque</div>
              <div className="text-xs text-[#94A3B8] mt-1">Choose a mosque in your community</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1769AA]/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-[#1769AA]">2</span>
              </div>
              <div className="font-semibold text-[#1A2A3A] text-sm">Choose Imam</div>
              <div className="text-xs text-[#94A3B8] mt-1">Select an Imam to support</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1769AA]/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-[#1769AA]">3</span>
              </div>
              <div className="font-semibold text-[#1A2A3A] text-sm">Contribute</div>
              <div className="text-xs text-[#94A3B8] mt-1">Support their long-term welfare</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1769AA]/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-[#1769AA]">4</span>
              </div>
              <div className="font-semibold text-[#1A2A3A] text-sm">Community</div>
              <div className="text-xs text-[#94A3B8] mt-1">Together we support our Imams</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 text-center hover:shadow-md transition">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#1769AA]/10 flex items-center justify-center">
                <PersonIcon />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1A2A3A]">{stats.totalImams}</div>
            <div className="text-xs text-[#94A3B8]">Imams Supported</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 text-center hover:shadow-md transition">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#1769AA]/10 flex items-center justify-center">
                <MosqueIcon />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1A2A3A]">{stats.totalMosques}</div>
            <div className="text-xs text-[#94A3B8]">Mosques</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 text-center hover:shadow-md transition">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#1769AA]/10 flex items-center justify-center">
                <CommunityIcon />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1A2A3A]">{stats.communitiesServed}</div>
            <div className="text-xs text-[#94A3B8]">Communities</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 text-center hover:shadow-md transition">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#1769AA]/10 flex items-center justify-center">
                <HeartIcon />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1A2A3A]">{stats.monthlyContributors}</div>
            <div className="text-xs text-[#94A3B8]">Contributors</div>
          </div>
        </div>

        {/* Total Contributions */}
        {stats.totalContributions > 0 && (
          <div className="bg-gradient-to-r from-[#1769AA] to-[#2F80C0] rounded-xl p-6 md:p-8 mb-8 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MoneyIcon />
              <span className="text-sm font-medium text-white/70">Total Community Contributions</span>
            </div>
            <div className="text-3xl md:text-4xl font-bold">{formatCurrency(stats.totalContributions)}</div>
            <p className="text-white/60 text-sm mt-2">Barakah in giving</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 md:p-8 text-center">
          <h3 className="text-lg font-bold text-[#1A2A3A] mb-2">Ready to Support?</h3>
          <p className="text-sm text-[#94A3B8] mb-4">Find a mosque and start supporting an Imam today.</p>
          <button 
            className="px-8 py-3 bg-[#1769AA] text-white font-bold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-lg shadow-[#1769AA]/20"
            onClick={() => navigate('/select-mosque')}
          >
            Find a Mosque
          </button>
          <p className="text-xs text-[#94A3B8] mt-4">Wakala Model · 0% Riba · Community-Powered</p>
        </div>
      </div>
    </div>
  );
};

export default Pension;