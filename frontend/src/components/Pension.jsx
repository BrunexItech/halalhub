import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pensionService } from '../services/api';

const Pension = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalLeaders: 0,
    totalSupporters: 0,
    totalContributions: 0,
    pendingContributions: 0,
    typeBreakdown: {}
  });
  const [leaders, setLeaders] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderTypes, setLeaderTypes] = useState([]);

  const LEADER_TYPE_LABELS = {
    'islamic_scholar': 'Islamic Scholar',
    'imam': 'Imam',
    'adhan_caller': 'Adhan Caller',
    'ustadh': 'Ustadh',
    'ustadha': 'Ustadha',
    'kadhi': 'Kadhi'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, leadersRes] = await Promise.all([
        pensionService.getStats(),
        pensionService.getLeaders({ limit: 100 })
      ]);

      setStats(statsRes.data.stats || {
        totalLeaders: 0,
        totalSupporters: 0,
        totalContributions: 0,
        pendingContributions: 0,
        typeBreakdown: {}
      });
      setLeaders(leadersRes.data.leaders || []);

      const types = Object.keys(statsRes.data.stats?.typeBreakdown || {});
      setLeaderTypes(types);

    } catch (err) {
      console.error('Error fetching pension data:', err);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const getLeaderTypeLabel = (type) => {
    return LEADER_TYPE_LABELS[type] || type;
  };

  const getInitials = (name) => {
    if (!name) return 'LD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredLeaders = leaders.filter(leader => {
    const matchesType = filterType === 'all' || leader.leader_type === filterType;
    const matchesSearch = leader.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          leader.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          getLeaderTypeLabel(leader.leader_type).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-6 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-red-600">{error}</span>
            <button 
              className="px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition"
              onClick={fetchData}
            >
              Retry
            </button>
          </div>
        )}

        {/* Hero Section - Slimmer */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#032A24] rounded-2xl px-8 py-6 md:px-10 md:py-7 shadow-xl shadow-black/10 border border-[rgba(201,164,75,0.12)] mb-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#C9A44B]/10 border border-[#C9A44B]/20 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A44B] animate-pulse" />
                  <span className="text-[9px] font-medium text-[#C9A44B] uppercase tracking-wider">Itqaan Pension</span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#FFFFFF] leading-snug">
                  Support Religious Leaders
                  <span className="block text-[#C9A44B]">Secure Their Future</span>
                </h1>
                <p className="text-[#B7C0BA] text-xs md:text-sm mt-2 max-w-lg leading-relaxed">
                  Contribute to the long-term welfare of Islamic Scholars, Imams, Adhan Callers, 
                  Ustadhs, Ustadhas, and Kadhis through a community-powered retirement program.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button 
                  className="px-5 py-2 bg-[#C9A44B] text-[#032A24] font-semibold text-sm rounded-lg hover:bg-[#E1C16B] transition shadow-md shadow-[#C9A44B]/20"
                  onClick={() => document.querySelector('.leaders-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Support a Leader
                </button>
                <button 
                  className="px-5 py-2 bg-white/10 backdrop-blur-sm text-[#F7F6F1] font-medium text-sm rounded-lg border border-[rgba(201,164,75,0.2)] hover:bg-white/20 transition"
                  onClick={() => document.querySelector('.how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-[#0B342B]">{stats.totalLeaders}</p>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Leaders</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-[#C9A44B]">{stats.totalSupporters}</p>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Supporters</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-[#0B342B]">{Object.keys(stats.typeBreakdown || {}).length}</p>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Leader Types</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="how-it-works bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 md:p-6 mb-6">
          <h2 className="text-sm font-semibold text-[#1F2937] mb-4 text-center">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: '1', label: 'Browse Leaders', desc: 'Find a religious leader' },
              { num: '2', label: 'View Profile', desc: 'Learn about their work' },
              { num: '3', label: 'Contribute', desc: 'Support their welfare' },
              { num: '4', label: 'Community', desc: 'Together we support' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-9 h-9 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-1.5">
                  <span className="text-xs font-bold text-[#0B342B]">{item.num}</span>
                </div>
                <p className="text-sm font-medium text-[#1F2937]">{item.label}</p>
                <p className="text-xs text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leader Type Breakdown */}
        {stats.typeBreakdown && Object.keys(stats.typeBreakdown).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(stats.typeBreakdown).map(([type, count]) => (
              <span key={type} className="px-3 py-1 bg-white rounded-full border border-[#E8EEF4] text-xs font-medium text-[#1F2937] shadow-sm">
                {getLeaderTypeLabel(type)} <span className="text-[#6B7280]">({count})</span>
              </span>
            ))}
          </div>
        )}

        {/* Leaders Section */}
        <div className="leaders-section bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-[#1F2937]">Support a Leader</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                className="px-3 py-1.5 border border-[#E8EEF4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition bg-white w-40 sm:w-48"
                placeholder="Search leaders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="px-3 py-1.5 border border-[#E8EEF4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                {leaderTypes.map((type) => (
                  <option key={type} value={type}>{getLeaderTypeLabel(type)}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredLeaders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6B7280]">No leaders found</p>
              <p className="text-xs text-[#6B7280] mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeaders.map((leader) => (
                <div 
                  key={leader.id} 
                  className="border border-[#E8EEF4] rounded-xl p-4 hover:shadow-md hover:border-[#C9A44B] transition-all duration-200 cursor-pointer bg-white"
                  onClick={() => navigate(`/pension/leader/${leader.share_link || leader.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {leader.profile_image ? (
                      <img src={leader.profile_image} alt={leader.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#0B342B] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {getInitials(leader.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-[#1F2937] truncate">{leader.name}</h3>
                        {leader.is_verified && (
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#3FAF73] border border-[#A7F3D0]">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280]">{getLeaderTypeLabel(leader.leader_type)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#F4F5F1]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B7280]">{leader.location || 'Location not specified'}</span>
                      <span className="text-[#6B7280]">{leader.total_supporters || 0} supporters</span>
                    </div>
                    {leader.mosque_name && (
                      <p className="text-xs text-[#6B7280] mt-1">{leader.mosque_name}</p>
                    )}
                    {leader.qualifications && leader.qualifications.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {leader.qualifications.slice(0, 2).map((q, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                            {q}
                          </span>
                        ))}
                        {leader.qualifications.length > 2 && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                            +{leader.qualifications.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    className="w-full mt-3 py-1.5 bg-[#0B342B] text-white text-sm font-medium rounded-lg hover:bg-[#032A24] transition shadow-sm"
                    onClick={(e) => { e.stopPropagation(); navigate(`/pension/leader/${leader.share_link || leader.id}`); }}
                  >
                    Support Leader
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Pension;