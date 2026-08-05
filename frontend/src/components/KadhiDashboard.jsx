import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService, leaderService } from '../services/api';

const KadhiDashboard = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [user, setUser] = useState(null);
  const [leaderProfile, setLeaderProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [leaderType, setLeaderType] = useState(null);
  
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchLeaderProfile();
    fetchBookings();
    fetchStats();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    const storedLeaderType = localStorage.getItem('halalhub_leader_type');
    
    if (token && userData) {
      setUser(userData);
      setUserId(userData.id);
      if (userData.role !== 'leader' && userData.role !== 'imam') {
        navigate('/dashboard');
      }
      if (storedLeaderType) {
        setLeaderType(storedLeaderType);
      }
    } else {
      navigate('/');
    }
  };

  const fetchLeaderProfile = async () => {
    try {
      if (!userId) {
        return;
      }
      const res = await leaderService.getProfile();
      if (res.data.success) {
        setLeaderProfile(res.data.leader);
        if (res.data.leader?.leader_type) {
          setLeaderType(res.data.leader.leader_type);
        }
      }
    } catch (err) {
      console.error('Error fetching leader profile:', err);
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

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

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

  const getLeaderTypeLabel = (type) => {
    const labels = {
      'islamic_scholar': 'Islamic Scholar',
      'imam': 'Imam',
      'adhan_caller': 'Adhan Caller',
      'ustadh': 'Ustadh',
      'ustadha': 'Ustadha',
      'kadhi': 'Kadhi'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      'confirmed': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]',
      'completed': 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]',
      'cancelled': 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-[#1F2937]">Consultation Dashboard</h1>
              <p className="text-[15px] text-[#6B7280] mt-0.5">Manage your consultations and bookings</p>
            </div>
            <div className="flex items-center gap-3">
              {leaderType && (
                <span className="text-[13px] font-medium text-[#0B342B] bg-white px-3 py-1.5 rounded-full border border-[#E8EEF4]">
                  {getLeaderTypeLabel(leaderType)}
                </span>
              )}
              <span className="text-[13px] font-medium text-[#0B342B] bg-white px-3 py-1.5 rounded-full border border-[#E8EEF4]">
                {leaderProfile?.name || user?.fullName || 'Leader'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-[14px] font-medium text-[#6B7280]">Total</div>
            <div className="text-[28px] font-bold text-[#1F2937]">{stats.total || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-[14px] font-medium text-[#6B7280]">Pending</div>
            <div className="text-[28px] font-bold text-[#D97706]">{stats.pending || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-[14px] font-medium text-[#6B7280]">Confirmed</div>
            <div className="text-[28px] font-bold text-[#3FAF73]">{stats.confirmed || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-[14px] font-medium text-[#6B7280]">Completed</div>
            <div className="text-[28px] font-bold text-[#3B82F6]">{stats.completed || 0}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-white border border-[#DC2626]/20 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <span className="text-[15px] text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-[13px] font-medium rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-white border border-[#3FAF73]/20 rounded-xl text-[15px] text-[#3FAF73] shadow-sm">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] font-medium text-[#6B7280]">Filter:</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                    filter === status
                      ? 'bg-[#0B342B] text-white shadow-sm'
                      : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1]'
                  }`}
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="ml-auto text-[13px] text-[#0B342B] hover:text-[#032A24] transition-colors font-medium"
              onClick={() => { fetchBookings(); fetchStats(); }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-[#F4F5F1]">
            <h2 className="text-[17px] font-semibold text-[#1F2937]">Consultations</h2>
            <p className="text-[15px] text-[#6B7280]">{filteredBookings.length} booking(s) found</p>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[15px] text-[#6B7280]">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="bg-[#FAFAF7]">
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Topic</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F5F1]">
                  {filteredBookings.map((booking) => {
                    const status = getStatusBadge(booking.status);
                    const actions = getStatusActions(booking.status);
                    const isVideo = booking.type === 'video' && booking.room_name;
                    
                    return (
                      <tr key={booking.id} className="hover:bg-[#FAFAF7] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-[#1F2937]">{booking.user_name || 'Anonymous'}</div>
                            {booking.user_email && (
                              <div className="text-[13px] text-[#6B7280]">{booking.user_email}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[#1F2937]">{booking.topic || 'N/A'}</span>
                          {booking.notes && (
                            <div className="text-[13px] text-[#6B7280] truncate max-w-[150px]">{booking.notes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#1F2937]">{formatDate(booking.booking_date)}</td>
                        <td className="px-4 py-3 text-[#1F2937]">{formatTime(booking.booking_time)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[13px] px-2 py-0.5 rounded-full border font-medium ${status.style}`}>
                            {status.label}
                          </span>
                          {isVideo && booking.status === 'confirmed' && (
                            <span className="text-[12px] text-[#0B342B] block mt-0.5 font-mono">Video ready</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {actions.includes('accept') && (
                              <button
                                className="px-3 py-1 bg-[#3FAF73] text-white text-[13px] font-medium rounded-lg hover:bg-[#2D8F5E] transition-colors shadow-sm"
                                onClick={() => acceptBooking(booking.id)}
                                disabled={processing}
                              >
                                Accept
                              </button>
                            )}
                            {actions.includes('reject') && (
                              <button
                                className="px-3 py-1 bg-[#DC2626] text-white text-[13px] font-medium rounded-lg hover:bg-[#B91C1C] transition-colors shadow-sm"
                                onClick={() => rejectBooking(booking.id)}
                                disabled={processing}
                              >
                                Reject
                              </button>
                            )}
                            {actions.includes('complete') && (
                              <button
                                className="px-3 py-1 bg-[#3B82F6] text-white text-[13px] font-medium rounded-lg hover:bg-[#2563EB] transition-colors shadow-sm"
                                onClick={() => completeBooking(booking.id)}
                                disabled={processing}
                              >
                                Complete
                              </button>
                            )}
                            {actions.includes('join') && isVideo && (
                              <button
                                className="px-3 py-1 bg-[#0B342B] text-white text-[13px] font-medium rounded-lg hover:bg-[#032A24] transition-colors shadow-sm"
                                onClick={() => joinMeeting(booking)}
                              >
                                Join Call
                              </button>
                            )}
                            <button
                              className="px-3 py-1 bg-[#FAFAF7] text-[#1F2937] text-[13px] font-medium rounded-lg hover:bg-[#F4F5F1] transition-colors border border-[#E8EEF4]"
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

      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Booking Details</h3>
              <button 
                className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]"
                onClick={() => setShowBookingModal(false)}
              >
                X
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Client</span>
                  <span className="font-semibold text-[#1F2937]">{selectedBooking.user_name || 'Anonymous'}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Email</span>
                  <span className="font-semibold text-[#1F2937]">{selectedBooking.user_email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Topic</span>
                  <span className="font-semibold text-[#1F2937]">{selectedBooking.topic || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Date</span>
                  <span className="font-semibold text-[#1F2937]">{formatDate(selectedBooking.booking_date)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Time</span>
                  <span className="font-semibold text-[#1F2937]">{formatTime(selectedBooking.booking_time)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Type</span>
                  <span className="font-semibold text-[#1F2937] capitalize">{selectedBooking.type || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Status</span>
                  <span className="font-semibold capitalize">{selectedBooking.status || 'N/A'}</span>
                </div>
                {selectedBooking.notes && (
                  <div className="flex justify-between text-[15px] border-t border-[#E8EEF4] pt-2">
                    <span className="text-[#6B7280]">Notes</span>
                    <span className="font-semibold text-[#1F2937] text-right max-w-[60%]">{selectedBooking.notes}</span>
                  </div>
                )}
                {selectedBooking.room_name && (
                  <div className="flex justify-between text-[15px] border-t border-[#E8EEF4] pt-2">
                    <span className="text-[#6B7280]">Room</span>
                    <span className="font-mono text-[13px] text-[#0B342B] truncate max-w-[150px]">{selectedBooking.room_name}</span>
                  </div>
                )}
                {selectedBooking.amount > 0 && (
                  <div className="flex justify-between text-[15px] border-t border-[#E8EEF4] pt-2">
                    <span className="text-[#6B7280]">Amount</span>
                    <span className="font-semibold text-[#0B342B]">{formatCurrency(selectedBooking.amount)}</span>
                  </div>
                )}
                {selectedBooking.payment_status && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Payment Status</span>
                    <span className={`font-semibold ${selectedBooking.payment_status === 'paid' ? 'text-[#3FAF73]' : selectedBooking.payment_status === 'pending' ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
                      {selectedBooking.payment_status.charAt(0).toUpperCase() + selectedBooking.payment_status.slice(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      className="flex-1 px-4 py-2.5 bg-[#3FAF73] text-white font-medium rounded-xl hover:bg-[#2D8F5E] transition-colors shadow-sm text-[15px]"
                      onClick={() => {
                        acceptBooking(selectedBooking.id);
                        setShowBookingModal(false);
                      }}
                      disabled={processing}
                    >
                      Accept Booking
                    </button>
                    <button
                      className="flex-1 px-4 py-2.5 bg-[#DC2626] text-white font-medium rounded-xl hover:bg-[#B91C1C] transition-colors shadow-sm text-[15px]"
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
                    className="flex-1 px-4 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-colors shadow-sm text-[15px]"
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
                    className="flex-1 px-4 py-2.5 bg-[#3B82F6] text-white font-medium rounded-xl hover:bg-[#2563EB] transition-colors shadow-sm text-[15px]"
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
                  className="flex-1 px-4 py-2.5 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-colors text-[15px]"
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