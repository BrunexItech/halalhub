import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService, kadhiService } from '../services/api';

const KadhiDashboard = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User
  const [user, setUser] = useState(null);
  const [kadhiProfile, setKadhiProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Bookings
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  
  // Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchKadhiProfile();
    fetchBookings();
    fetchStats();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    const subRole = localStorage.getItem('halalhub_subrole');
    
    if (token && userData) {
      setUser(userData);
      setUserId(userData.id);
      if (userData.role !== 'imam' || subRole !== 'kadhi') {
        navigate('/dashboard');
      }
    } else {
      navigate('/');
    }
  };

  const fetchKadhiProfile = async () => {
    try {
      if (!userId) {
        return;
      }
      const res = await kadhiService.getKadhiById(userId);
      if (res.data.success) {
        setKadhiProfile(res.data.kadhi);
      }
    } catch (err) {
      console.error('Error fetching kadhi profile:', err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingService.getBookings();
      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await bookingService.getBookingStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // ===== BOOKING ACTIONS =====
  const acceptBooking = async (bookingId) => {
    setProcessing(true);
    setError('');
    try {
      const res = await bookingService.updateBooking(bookingId, { status: 'confirmed' });
      if (res.data.success) {
        setSuccess('Booking accepted successfully');
        await fetchBookings();
        await fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to accept booking');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const rejectBooking = async (bookingId) => {
    setProcessing(true);
    setError('');
    try {
      const res = await bookingService.updateBooking(bookingId, { status: 'cancelled' });
      if (res.data.success) {
        setSuccess('Booking rejected');
        await fetchBookings();
        await fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to reject booking');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const completeBooking = async (bookingId) => {
    setProcessing(true);
    setError('');
    try {
      const res = await bookingService.updateBooking(bookingId, { status: 'completed' });
      if (res.data.success) {
        setSuccess('Booking marked as completed');
        await fetchBookings();
        await fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to complete booking');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const joinMeeting = (booking) => {
    if (booking.room_name) {
      navigate(`/video-call/${booking.id}`);
    } else {
      setError('No video room available for this booking');
      setTimeout(() => setError(''), 3000);
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  // ===== FILTERS =====
  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  // ===== HELPERS =====
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'completed': 'bg-blue-50 text-blue-700 border-blue-200',
      'cancelled': 'bg-red-50 text-red-700 border-red-200'
    };
    const labels = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return { 
      style: styles[status] || styles.pending, 
      label: labels[status] || status 
    };
  };

  const getStatusActions = (status) => {
    switch(status) {
      case 'pending':
        return ['accept', 'reject'];
      case 'confirmed':
        return ['complete', 'join'];
      case 'completed':
        return [];
      case 'cancelled':
        return [];
      default:
        return [];
    }
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] flex items-center justify-center p-4">
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
        
        {/* ===== HEADER ===== */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A2A3A]">Kadhi Dashboard</h1>
              <p className="text-sm text-[#94A3B8] mt-0.5">Manage your consultations and bookings</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#1769AA] bg-white px-3 py-1.5 rounded-full border border-[#E8EEF4]">
                {kadhiProfile?.name || user?.fullName || 'Kadhi'}
              </span>
            </div>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-sm font-semibold text-[#94A3B8]">Total</div>
            <div className="text-2xl font-bold text-[#1A2A3A]">{stats.total || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-sm font-semibold text-[#94A3B8]">Pending</div>
            <div className="text-2xl font-bold text-amber-600">{stats.pending || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-sm font-semibold text-[#94A3B8]">Confirmed</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.confirmed || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-sm font-semibold text-[#94A3B8]">Completed</div>
            <div className="text-2xl font-bold text-blue-600">{stats.completed || 0}</div>
          </div>
        </div>

        {/* ===== ERROR / SUCCESS ===== */}
        {error && (
          <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm text-emerald-600">
            {success}
          </div>
        )}

        {/* ===== FILTERS ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Filter:</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filter === status
                      ? 'bg-[#1769AA] text-white'
                      : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                  }`}
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="ml-auto text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
              onClick={() => { fetchBookings(); fetchStats(); }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ===== BOOKINGS LIST ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-[#F1F7FC]">
            <h2 className="text-base font-bold text-[#1A2A3A]">Consultations</h2>
            <p className="text-sm text-[#94A3B8]">{filteredBookings.length} booking(s) found</p>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#94A3B8]">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F1F7FC]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F7FC]">
                  {filteredBookings.map((booking) => {
                    const status = getStatusBadge(booking.status);
                    const actions = getStatusActions(booking.status);
                    const isVideo = booking.type === 'video' && booking.room_name;
                    
                    return (
                      <tr key={booking.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-[#1A2A3A]">{booking.user_name || 'Anonymous'}</div>
                            {booking.user_email && (
                              <div className="text-xs text-[#94A3B8]">{booking.user_email}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[#1A2A3A]">{booking.topic || 'N/A'}</span>
                          {booking.notes && (
                            <div className="text-xs text-[#94A3B8] truncate max-w-[150px]">{booking.notes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#1A2A3A]">{formatDate(booking.booking_date)}</td>
                        <td className="px-4 py-3 text-[#1A2A3A]">{formatTime(booking.booking_time)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${status.style}`}>
                            {status.label}
                          </span>
                          {isVideo && booking.status === 'confirmed' && (
                            <span className="text-[10px] text-[#1769AA] block mt-0.5 font-mono">Video ready</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {actions.includes('accept') && (
                              <button
                                className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                                onClick={() => acceptBooking(booking.id)}
                                disabled={processing}
                              >
                                Accept
                              </button>
                            )}
                            {actions.includes('reject') && (
                              <button
                                className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                onClick={() => rejectBooking(booking.id)}
                                disabled={processing}
                              >
                                Reject
                              </button>
                            )}
                            {actions.includes('complete') && (
                              <button
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                onClick={() => completeBooking(booking.id)}
                                disabled={processing}
                              >
                                Complete
                              </button>
                            )}
                            {actions.includes('join') && isVideo && (
                              <button
                                className="px-3 py-1 bg-[#1769AA] text-white text-xs font-semibold rounded-lg hover:bg-[#2F80C0] transition-colors"
                                onClick={() => joinMeeting(booking)}
                              >
                                Join Call
                              </button>
                            )}
                            <button
                              className="px-3 py-1 bg-[#F1F7FC] text-[#5A6A7A] text-xs font-semibold rounded-lg hover:bg-[#E8EEF4] transition-colors"
                              onClick={() => viewBookingDetails(booking)}
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== BOOKING DETAILS MODAL ===== */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Booking Details</h3>
              <button 
                className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors text-xl"
                onClick={() => setShowBookingModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Client</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedBooking.user_name || 'Anonymous'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Email</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedBooking.user_email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Topic</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedBooking.topic || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Date</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(selectedBooking.booking_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Time</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatTime(selectedBooking.booking_time)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Type</span>
                  <span className="font-semibold text-[#1A2A3A] capitalize">{selectedBooking.type || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Status</span>
                  <span className="font-semibold capitalize">{selectedBooking.status || 'N/A'}</span>
                </div>
                {selectedBooking.notes && (
                  <div className="flex justify-between text-sm border-t border-[#E2E8F0] pt-2">
                    <span className="text-[#94A3B8]">Notes</span>
                    <span className="font-semibold text-[#1A2A3A] text-right max-w-[60%]">{selectedBooking.notes}</span>
                  </div>
                )}
                {selectedBooking.room_name && (
                  <div className="flex justify-between text-sm border-t border-[#E2E8F0] pt-2">
                    <span className="text-[#94A3B8]">Room</span>
                    <span className="font-mono text-xs text-[#1769AA] truncate max-w-[150px]">{selectedBooking.room_name}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                      onClick={() => {
                        acceptBooking(selectedBooking.id);
                        setShowBookingModal(false);
                      }}
                      disabled={processing}
                    >
                      Accept Booking
                    </button>
                    <button
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                      onClick={() => {
                        rejectBooking(selectedBooking.id);
                        setShowBookingModal(false);
                      }}
                      disabled={processing}
                    >
                      Reject Booking
                    </button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && selectedBooking.type === 'video' && selectedBooking.room_name && (
                  <button
                    className="flex-1 px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-colors"
                    onClick={() => {
                      joinMeeting(selectedBooking);
                      setShowBookingModal(false);
                    }}
                  >
                    Join Video Call
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      completeBooking(selectedBooking.id);
                      setShowBookingModal(false);
                    }}
                    disabled={processing}
                  >
                    Mark Complete
                  </button>
                )}
                <button
                  className="flex-1 px-4 py-2.5 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-colors"
                  onClick={() => setShowBookingModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KadhiDashboard;