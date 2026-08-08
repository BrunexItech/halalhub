import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, leaderService } from '../../api/client';

const KadhiDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [leaderProfile, setLeaderProfile] = useState<any>(null);
  const [leaderType, setLeaderType] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    fetchLeaderProfile();
    fetchBookings();
    fetchStats();
  }, []);

  const fetchLeaderProfile = async () => {
    try {
      const res = await leaderService.getProfile();
      if (res.data.success) {
        setLeaderProfile(res.data.leader);
        if (res.data.leader?.leader_type) {
          setLeaderType(res.data.leader.leader_type);
        }
      }
    } catch (err) {
      console.log('Error fetching leader profile:', err);
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
      console.log('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await bookingService.getBookingStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.log('Error fetching stats:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
    fetchStats();
  };

  const acceptBooking = async (bookingId: string) => {
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

  const rejectBooking = async (bookingId: string) => {
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

  const completeBooking = async (bookingId: string) => {
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

  const joinMeeting = (booking: any) => {
    if (booking.room_name) {
      navigation.navigate('VideoCall' as never, { bookingId: booking.id });
    } else {
      setError('No video room available for this booking');
      setTimeout(() => setError(''), 3000);
    }
  };

  const viewBookingDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const getLeaderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      islamic_scholar: 'Islamic Scholar',
      imam: 'Imam',
      adhan_caller: 'Adhan Caller',
      ustadh: 'Ustadh',
      ustadha: 'Ustadha',
      kadhi: 'Kadhi',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FEF3C7', text: '#D97706' },
      confirmed: { bg: '#D1FAE5', text: '#3FAF73' },
      completed: { bg: '#DBEAFE', text: '#3B82F6' },
      cancelled: { bg: '#FEE2E2', text: '#DC2626' },
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return { style: styles[status] || styles.pending, label: labels[status] || status };
  };

  const getStatusActions = (status: string) => {
    switch (status) {
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <View>
              <Text style={{ color: '#1F2937', fontSize: 24, fontWeight: '700' }}>Consultation Dashboard</Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Manage your consultations and bookings</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {leaderType && (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                }}>
                  <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>
                    {getLeaderTypeLabel(leaderType)}
                  </Text>
                </View>
              )}
              <View style={{
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#E8EEF4',
              }}>
                <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>
                  {leaderProfile?.name || user?.fullName || 'Leader'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total', value: stats.total || 0, color: '#1F2937' },
              { label: 'Pending', value: stats.pending || 0, color: '#D97706' },
              { label: 'Confirmed', value: stats.confirmed || 0, color: '#3FAF73' },
              { label: 'Completed', value: stats.completed || 0, color: '#3B82F6' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 60,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{item.label}</Text>
                <Text style={{ color: item.color, fontSize: 24, fontWeight: '700' }}>{item.value}</Text>
              </View>
            ))}
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {success ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(63, 175, 115, 0.2)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}>
              <Text style={{ color: '#3FAF73', fontSize: 13 }}>{success}</Text>
            </View>
          ) : null}

          {/* Filters */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>Filter:</Text>
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: filter === status ? '#0B342B' : '#FAFAF7',
                  }}
                  onPress={() => setFilter(status)}
                >
                  <Text style={{
                    color: filter === status ? '#FFFFFF' : '#6B7280',
                    fontSize: 13,
                    fontWeight: filter === status ? '600' : '500',
                    textTransform: 'capitalize',
                  }}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ marginLeft: 'auto' }}
                onPress={() => { fetchBookings(); fetchStats(); }}
              >
                <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bookings Table */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#F4F5F1',
            }}>
              <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Consultations</Text>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>{filteredBookings.length} booking(s) found</Text>
            </View>

            {filteredBookings.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>No bookings found</Text>
              </View>
            ) : (
              filteredBookings.map((booking) => {
                const status = getStatusBadge(booking.status);
                const actions = getStatusActions(booking.status);
                const isVideo = booking.type === 'video' && booking.room_name;

                return (
                  <View key={booking.id} style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F4F5F1',
                    backgroundColor: '#FFFFFF',
                    gap: 6,
                  }}>
                    <View style={{ flex: 1, minWidth: 100 }}>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>
                        {booking.user_name || 'Anonymous'}
                      </Text>
                      {booking.user_email && (
                        <Text style={{ color: '#6B7280', fontSize: 12 }}>{booking.user_email}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 80 }}>
                      <Text style={{ color: '#1F2937', fontSize: 13 }}>{booking.topic || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 0.7, minWidth: 70 }}>
                      <Text style={{ color: '#1F2937', fontSize: 13 }}>{formatDate(booking.booking_date)}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{formatTime(booking.booking_time)}</Text>
                    </View>
                    <View style={{ flex: 0.6, minWidth: 70 }}>
                      <View style={{
                        backgroundColor: status.style.bg,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        alignSelf: 'flex-start',
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.05)',
                      }}>
                        <Text style={{ color: status.style.text, fontSize: 12, fontWeight: '500' }}>{status.label}</Text>
                      </View>
                      {isVideo && booking.status === 'confirmed' && (
                        <Text style={{ color: '#0B342B', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                          Video ready
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 100, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {actions.includes('accept') && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#3FAF73',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 6,
                            opacity: processing ? 0.6 : 1,
                          }}
                          onPress={() => acceptBooking(booking.id)}
                          disabled={processing}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Accept</Text>
                        </TouchableOpacity>
                      )}
                      {actions.includes('reject') && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#DC2626',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 6,
                            opacity: processing ? 0.6 : 1,
                          }}
                          onPress={() => rejectBooking(booking.id)}
                          disabled={processing}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Reject</Text>
                        </TouchableOpacity>
                      )}
                      {actions.includes('complete') && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#3B82F6',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 6,
                            opacity: processing ? 0.6 : 1,
                          }}
                          onPress={() => completeBooking(booking.id)}
                          disabled={processing}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Complete</Text>
                        </TouchableOpacity>
                      )}
                      {actions.includes('join') && isVideo && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#0B342B',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                          onPress={() => joinMeeting(booking)}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Join Call</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                        }}
                        onPress={() => viewBookingDetails(booking)}
                      >
                        <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '500' }}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Booking Details Modal */}
      <Modal visible={showBookingModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Booking Details</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Client</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {selectedBooking?.user_name || 'Anonymous'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Email</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {selectedBooking?.user_email || 'N/A'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Topic</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {selectedBooking?.topic || 'N/A'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Date</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {formatDate(selectedBooking?.booking_date)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Time</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {formatTime(selectedBooking?.booking_time)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Type</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>
                    {selectedBooking?.type || 'N/A'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Status</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>
                    {selectedBooking?.status || 'N/A'}
                  </Text>
                </View>
                {selectedBooking?.notes && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#E8EEF4',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Notes</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                      {selectedBooking.notes}
                    </Text>
                  </View>
                )}
                {selectedBooking?.room_name && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#E8EEF4',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Room</Text>
                    <Text style={{ color: '#0B342B', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                      {selectedBooking.room_name}
                    </Text>
                  </View>
                )}
                {selectedBooking?.amount > 0 && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#E8EEF4',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Amount</Text>
                    <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>
                      {formatCurrency(selectedBooking.amount)}
                    </Text>
                  </View>
                )}
                {selectedBooking?.payment_status && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Payment Status</Text>
                    <Text style={{
                      color: selectedBooking.payment_status === 'paid' ? '#3FAF73' :
                             selectedBooking.payment_status === 'pending' ? '#D97706' :
                             '#DC2626',
                      fontSize: 14,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}>
                      {selectedBooking.payment_status}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {selectedBooking?.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: '#3FAF73',
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: 'center',
                        opacity: processing ? 0.6 : 1,
                      }}
                      onPress={() => {
                        acceptBooking(selectedBooking.id);
                        setShowBookingModal(false);
                      }}
                      disabled={processing}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Accept Booking</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: '#DC2626',
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: 'center',
                        opacity: processing ? 0.6 : 1,
                      }}
                      onPress={() => {
                        rejectBooking(selectedBooking.id);
                        setShowBookingModal(false);
                      }}
                      disabled={processing}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Reject Booking</Text>
                    </TouchableOpacity>
                  </>
                )}
                {selectedBooking?.status === 'confirmed' && selectedBooking?.type === 'video' && selectedBooking?.room_name && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#0B342B',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      joinMeeting(selectedBooking);
                      setShowBookingModal(false);
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Join Video Call</Text>
                  </TouchableOpacity>
                )}
                {selectedBooking?.status === 'confirmed' && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#3B82F6',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      opacity: processing ? 0.6 : 1,
                    }}
                    onPress={() => {
                      completeBooking(selectedBooking.id);
                      setShowBookingModal(false);
                    }}
                    disabled={processing}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}
                  onPress={() => setShowBookingModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default KadhiDashboard;