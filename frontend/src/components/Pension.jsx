import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Pension = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalImams: 127,
    totalMosques: 284,
    communitiesServed: 47,
    monthlyContributors: 342
  });

  useEffect(() => {
    setLoading(false);
  }, []);

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
        {/* Decorative Elements */}
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