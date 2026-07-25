import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { imamService } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ImamDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State
  const [stats, setStats] = useState({
    totalPension: 0,
    totalSupporters: 0,
    totalContributions: 0,
    unreadNotifications: 0
  });
  const [profile, setProfile] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [supporters, setSupporters] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSupporters, setShowSupporters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Edit form
  const [editForm, setEditForm] = useState({
    title: '',
    mosque_name: '',
    mosque_location: '',
    mosque_county: '',
    bio: '',
    years_of_service: ''
  });
  
  const token = localStorage.getItem('halalhub_token');

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    } else {
      navigate('/');
    }
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch all data in parallel
      const [statsRes, profileRes, contribRes, supportersRes, notifRes] = await Promise.all([
        axios.get(`${API_BASE}/imam/dashboard-stats`, config),
        axios.get(`${API_BASE}/imam/profile`, config),
        axios.get(`${API_BASE}/imam/pension/history?limit=20`, config),
        axios.get(`${API_BASE}/imam/supporters`, config),
        axios.get(`${API_BASE}/imam/notifications?limit=10`, config)
      ]);
      
      setStats(statsRes.data.stats || {});
      setProfile(profileRes.data.imam || null);
      setContributions(contribRes.data.contributions || []);
      setSupporters(supportersRes.data.supporters || []);
      setNotifications(notifRes.data.notifications || []);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    if (profile) {
      setEditForm({
        title: profile.title || '',
        mosque_name: profile.mosque_name || '',
        mosque_location: profile.mosque_location || '',
        mosque_county: profile.mosque_county || '',
        bio: profile.bio || '',
        years_of_service: profile.years_of_service || ''
      });
      setShowEditProfile(true);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/imam/profile`, editForm, config);
      setSuccess('✅ Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowEditProfile(false);
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = () => {
    if (profile?.fullname) {
      return profile.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'IM';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">Imam Dashboard</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Manage your profile, pension, and supporters</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="px-4 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition text-sm" onClick={fetchDashboardData}>
              ↻ Refresh
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition" onClick={handleEditProfile}>
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        {/* ERROR/SUCCESS */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center text-sm text-red-600">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">
            ✅ {success}
          </div>
        )}

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {getInitials()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-[#1A2A3A]">{profile?.fullname || 'Imam'}</h2>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  {profile?.is_verified ? '✅ Verified' : '⏳ Pending'}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F1F7FC] text-[#5A6A7A] text-xs font-semibold">
                  {profile?.status || 'pending'}
                </span>
              </div>
              <p className="text-sm text-[#94A3B8]">{profile?.title || 'Imam'}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-[#5A6A7A]">
                <span>🕌 {profile?.mosque_name || 'No mosque'}</span>
                <span>📍 {profile?.mosque_location || 'No location'}</span>
                <span>📅 {profile?.years_of_service || 0} years</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-2xl font-heading font-bold text-[#1769AA]">{formatCurrency(stats.totalPension || 0)}</div>
              <div className="text-xs text-[#94A3B8]">Total Pension Fund</div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">🏛️</div>
            <div className="text-2xl font-heading font-bold text-[#1769AA]">{formatCurrency(stats.totalPension || 0)}</div>
            <div className="text-xs text-[#94A3B8]">Total Pension</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-2xl font-heading font-bold text-emerald-600">{stats.totalSupporters || 0}</div>
            <div className="text-xs text-[#94A3B8]">Supporters</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-2xl font-heading font-bold text-amber-600">{stats.totalContributions || 0}</div>
            <div className="text-xs text-[#94A3B8]">Contributions</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">🔔</div>
            <div className="text-2xl font-heading font-bold text-purple-600">{stats.unreadNotifications || 0}</div>
            <div className="text-xs text-[#94A3B8]">Notifications</div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button 
            className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition text-center cursor-pointer group"
            onClick={handleEditProfile}
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition">✏️</div>
            <div className="text-sm font-semibold text-[#1A2A3A] group-hover:text-[#1769AA] transition">Edit Profile</div>
          </button>
          <button 
            className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition text-center cursor-pointer group"
            onClick={() => setShowSupporters(true)}
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition">👥</div>
            <div className="text-sm font-semibold text-[#1A2A3A] group-hover:text-[#1769AA] transition">View Supporters</div>
          </button>
          <button 
            className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition text-center cursor-pointer group"
            onClick={() => setShowNotifications(true)}
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition">🔔</div>
            <div className="text-sm font-semibold text-[#1A2A3A] group-hover:text-[#1769AA] transition">Notifications</div>
            {stats.unreadNotifications > 0 && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.unreadNotifications}
              </span>
            )}
          </button>
          <button 
            className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition text-center cursor-pointer group"
            onClick={() => navigate('/pension')}
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition">🏛️</div>
            <div className="text-sm font-semibold text-[#1A2A3A] group-hover:text-[#1769AA] transition">Pension Details</div>
          </button>
        </div>

        {/* CONTRIBUTION HISTORY */}
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">📊 Recent Contributions</h3>
            <span className="text-sm text-[#94A3B8]">{contributions.length} transactions</span>
          </div>

          {contributions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏛️</div>
              <p className="text-[#1A2A3A] font-semibold">No contributions yet</p>
              <p className="text-sm text-[#94A3B8]">Supporters will appear here once they contribute</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Supporter</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Method</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((contrib) => (
                    <tr key={contrib.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                      <td className="px-3 py-3 font-medium text-[#1A2A3A]">{contrib.supporter_name || 'Anonymous'}</td>
                      <td className="px-3 py-3 font-semibold text-[#1769AA]">{formatCurrency(contrib.amount)}</td>
                      <td className="px-3 py-3 hidden md:table-cell text-[#94A3B8]">{contrib.payment_method || 'M-Pesa'}</td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${contrib.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {contrib.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#94A3B8]">{formatDate(contrib.contribution_date || contrib.createdat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== EDIT PROFILE MODAL ===== */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditProfile(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">✏️ Edit Profile</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowEditProfile(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Title</label>
                <input
                  type="text"
                  name="title"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={editForm.title}
                  onChange={handleEditChange}
                  placeholder="e.g., Sheikh, Imam, Mufti"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Mosque Name *</label>
                <input
                  type="text"
                  name="mosque_name"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={editForm.mosque_name}
                  onChange={handleEditChange}
                  placeholder="Enter mosque name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Mosque Location *</label>
                <input
                  type="text"
                  name="mosque_location"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={editForm.mosque_location}
                  onChange={handleEditChange}
                  placeholder="e.g., Nairobi CBD, Mombasa"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">County</label>
                <input
                  type="text"
                  name="mosque_county"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={editForm.mosque_county}
                  onChange={handleEditChange}
                  placeholder="e.g., Nairobi, Mombasa"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Years of Service</label>
                <input
                  type="number"
                  name="years_of_service"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={editForm.years_of_service}
                  onChange={handleEditChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Bio</label>
                <textarea
                  name="bio"
                  rows="3"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  placeholder="Tell the community about yourself..."
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowEditProfile(false)}>Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition disabled:opacity-60" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== SUPPORTERS MODAL ===== */}
      {showSupporters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSupporters(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">👥 Supporters</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowSupporters(false)}>✕</button>
            </div>
            <div className="p-6">
              {supporters.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-[#1A2A3A] font-semibold">No supporters yet</p>
                  <p className="text-sm text-[#94A3B8]">Supporters will appear here once they contribute</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supporters.map((supporter) => (
                    <div key={supporter.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E8EEF4]">
                      <div>
                        <div className="font-semibold text-[#1A2A3A]">{supporter.supporter_name || 'Anonymous'}</div>
                        <div className="text-xs text-[#94A3B8]">{supporter.supporter_phone || supporter.supporter_email || ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#1769AA]">{formatCurrency(supporter.amount)}</div>
                        <div className="text-xs text-[#94A3B8]">{supporter.frequency || 'once'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#E8EEF4]">
              <button className="w-full py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowSupporters(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== NOTIFICATIONS MODAL ===== */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNotifications(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">🔔 Notifications</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowNotifications(false)}>✕</button>
            </div>
            <div className="p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-[#1A2A3A] font-semibold">No notifications</p>
                  <p className="text-sm text-[#94A3B8]">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 rounded-xl border ${notif.is_read ? 'bg-white border-[#E8EEF4]' : 'bg-[#F1F7FC] border-[#1769AA]/30'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-[#1A2A3A]">{notif.title}</div>
                          <p className="text-sm text-[#5A6A7A] mt-1">{notif.message}</p>
                          <div className="text-xs text-[#94A3B8] mt-2">{formatDate(notif.createdat)}</div>
                        </div>
                        {!notif.is_read && (
                          <span className="px-2 py-0.5 bg-[#1769AA] text-white text-[10px] rounded-full">New</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#E8EEF4]">
              <button className="w-full py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowNotifications(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImamDashboard;