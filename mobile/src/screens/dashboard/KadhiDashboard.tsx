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
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, leaderService } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// ===== PROFESSIONAL SVG ICONS =====
const BackIcon = ({ color = '#032A24', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const DashboardIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const UsersIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const CalendarIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="6" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5"/>
    <Path d="M3 10H21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M16 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ClockIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 6V12L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const VideoIcon = ({ color = '#FFFFFF', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 10L20 6V18L15 14V10Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Rect x="2" y="6" width="13" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const FilterIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6H21M6 12H18M10 18H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ChevronDownIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronUpIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const KadhiDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
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
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await fetchLeaderProfile();
      await fetchBookings();
      await fetchStats();
    } catch (err) {
      console.log('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded(!filtersExpanded);
  };

  const fetchLeaderProfile = async () => {
    try {
      const res = await leaderService.getProfile();
      if (res.data && res.data.success) {
        setLeaderProfile(res.data.leader);
        if (res.data.leader?.leader_type) {
          setLeaderType(res.data.leader.leader_type);
        }
      } else {
        setLeaderProfile(null);
        setLeaderType(null);
      }
    } catch (err) {
      console.log('Error fetching leader profile:', err);
      setLeaderProfile(null);
      setLeaderType(null);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await bookingService.getBookings();
      if (res.data && res.data.success) {
        setBookings(res.data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.log('Error fetching bookings:', err);
      setError('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoadingBookings(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await bookingService.getBookingStats();
      if (res.data && res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.log('Error fetching stats:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchBookings(), fetchStats()]).finally(() => {
      setRefreshing(false);
    });
  };

  const acceptBooking = async (bookingId: string) => {
    setProcessing(true);
    setError('');
    try {
      const res = await bookingService.updateBooking(bookingId, { status: 'confirmed' });
      if (res.data && res.data.success) {
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
      if (res.data && res.data.success) {
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
      if (res.data && res.data.success) {
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
  return <LoadingSpinner message="Loading dashboard..." />;
}

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#032A24" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* ===== PREMIUM HEADER ===== */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <View style={{
              position: 'absolute',
              top: 0,
              left: 40,
              right: 40,
              height: 2,
              backgroundColor: '#C9A44B',
              opacity: 0.3,
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={{
                  padding: 6,
                  marginRight: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                }}
              >
                <BackIcon color="#C9A44B" size={22} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <DashboardIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Dashboard
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Consultation Dashboard
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Manage your consultations and bookings
                </Text>
              </View>

              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.1)',
              }}>
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#C9A44B',
                  opacity: 0.5,
                }} />
              </View>
            </View>
          </View>

          {/* ===== LEADER INFO ===== */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#032A24',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  {leaderProfile?.name?.charAt(0) || user?.fullName?.charAt(0) || 'L'}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>
                  {leaderProfile?.name || user?.fullName || 'Leader'}
                </Text>
                {leaderType && (
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    {getLeaderTypeLabel(leaderType)}
                  </Text>
                )}
              </View>
            </View>
            <View style={{
              backgroundColor: 'rgba(63, 175, 115, 0.06)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(63, 175, 115, 0.08)',
            }}>
              <Text style={{ color: '#3FAF73', fontSize: 10, fontWeight: '500' }}>
                Online
              </Text>
            </View>
          </View>

          {/* ===== STATS ===== */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 16,
          }}>
            {[
              { label: 'Total', value: stats.total || 0, color: '#032A24' },
              { label: 'Pending', value: stats.pending || 0, color: '#D97706' },
              { label: 'Confirmed', value: stats.confirmed || 0, color: '#3FAF73' },
              { label: 'Completed', value: stats.completed || 0, color: '#3B82F6' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 60,
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 11 }}>{item.label}</Text>
                <Text style={{ color: item.color, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {success ? (
            <View style={{
              backgroundColor: 'rgba(63, 175, 115, 0.04)',
              borderWidth: 1,
              borderColor: 'rgba(63, 175, 115, 0.08)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
            }}>
              <Text style={{ color: '#3FAF73', fontSize: 13 }}>{success}</Text>
            </View>
          ) : null}

          {/* ===== COLLAPSIBLE FILTERS ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
            elevation: 1,
            marginBottom: 16,
            overflow: 'hidden',
          }}>
            <TouchableOpacity
              onPress={toggleFilters}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 3,
                  height: 14,
                  backgroundColor: '#C9A44B',
                  borderRadius: 2,
                }} />
                <FilterIcon color="#032A24" size={14} />
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
                  Filter Bookings
                </Text>
                <Text style={{ color: '#8B8A86', fontSize: 10 }}>
                  {filteredBookings.length} bookings
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={() => { fetchBookings(); fetchStats(); }} activeOpacity={0.7}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Refresh</Text>
                </TouchableOpacity>
                {filtersExpanded ? (
                  <ChevronUpIcon color="#6B7280" size={16} />
                ) : (
                  <ChevronDownIcon color="#6B7280" size={16} />
                )}
              </View>
            </TouchableOpacity>

            {filtersExpanded && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: filter === status ? '#032A24' : '#F3F4F6',
                      }}
                      onPress={() => setFilter(status)}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        color: filter === status ? '#FFFFFF' : '#6B7280',
                        fontSize: 12,
                        fontWeight: filter === status ? '600' : '500',
                        textTransform: 'capitalize',
                      }}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ===== PREMIUM BOOKINGS LIST ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
            elevation: 1,
            overflow: 'hidden',
          }}>
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(3, 42, 36, 0.04)',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                Consultations
              </Text>
              <Text style={{ color: '#8B8A86', fontSize: 12 }}>
                {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {loadingBookings ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#032A24" />
              </View>
            ) : filteredBookings.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No bookings found</Text>
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
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(3, 42, 36, 0.03)',
                    backgroundColor: '#FFFFFF',
                    gap: 6,
                  }}>
                    <View style={{ flex: 1, minWidth: 100 }}>
                      <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '500' }}>
                        {booking.user_name || 'Anonymous'}
                      </Text>
                      {booking.user_email && (
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>{booking.user_email}</Text>
                      )}
                    </View>
                    <View style={{ flex: 0.7, minWidth: 70 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{booking.topic || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 0.7, minWidth: 70 }}>
                      <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>
                        {formatDate(booking.booking_date)}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>{formatTime(booking.booking_time)}</Text>
                    </View>
                    <View style={{ flex: 0.6, minWidth: 60 }}>
                      <View style={{
                        backgroundColor: status.style.bg,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        alignSelf: 'flex-start',
                      }}>
                        <Text style={{ color: status.style.text, fontSize: 10, fontWeight: '500' }}>{status.label}</Text>
                      </View>
                      {isVideo && booking.status === 'confirmed' && (
                        <Text style={{ color: '#3FAF73', fontSize: 9, marginTop: 2 }}>Video ready</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 90, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {actions.includes('accept') && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#3FAF73',
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            opacity: processing ? 0.6 : 1,
                          }}
                          onPress={() => acceptBooking(booking.id)}
                          disabled={processing}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }}>Accept</Text>
                        </TouchableOpacity>
                      )}
                      {actions.includes('reject') && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#DC2626',
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            opacity: processing ? 0.6 : 1,
                          }}
                          onPress={() => rejectBooking(booking.id)}
                          disabled={processing}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }}>Reject</Text>
                        </TouchableOpacity>
                      )}
                      {actions.includes('complete') && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#3B82F6',
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            opacity: processing ? 0.6 : 1,
                          }}
                          onPress={() => completeBooking(booking.id)}
                          disabled={processing}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }}>Complete</Text>
                        </TouchableOpacity>
                      )}
                      {actions.includes('join') && isVideo && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#032A24',
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          onPress={() => joinMeeting(booking)}
                          activeOpacity={0.7}
                        >
                          <VideoIcon color="#FFFFFF" size={10} />
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }}>Join</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                        }}
                        onPress={() => viewBookingDetails(booking)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500' }}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ===== FOOTER ===== */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Consultation Dashboard
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== BOOKING DETAILS MODAL ===== */}
      <Modal visible={showBookingModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Booking Details
              </Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Client</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {selectedBooking?.user_name || 'Anonymous'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Email</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {selectedBooking?.user_email || 'N/A'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Topic</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {selectedBooking?.topic || 'N/A'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Date</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {formatDate(selectedBooking?.booking_date)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Time</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {formatTime(selectedBooking?.booking_time)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Type</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>
                    {selectedBooking?.type || 'N/A'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Status</Text>
                  <Text style={{
                    color: getStatusBadge(selectedBooking?.status).style.text,
                    fontSize: 13,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}>
                    {selectedBooking?.status || 'N/A'}
                  </Text>
                </View>
                {selectedBooking?.notes && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(3, 42, 36, 0.04)',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Notes</Text>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 8 }}>
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
                    borderTopColor: 'rgba(3, 42, 36, 0.04)',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Room</Text>
                    <Text style={{ color: '#032A24', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
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
                    borderTopColor: 'rgba(3, 42, 36, 0.04)',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Amount</Text>
                    <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '700' }}>
                      {formatCurrency(selectedBooking.amount)}
                    </Text>
                  </View>
                )}
                {selectedBooking?.payment_status && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Payment Status</Text>
                    <Text style={{
                      color: selectedBooking.payment_status === 'paid' ? '#3FAF73' :
                             selectedBooking.payment_status === 'pending' ? '#D97706' :
                             '#DC2626',
                      fontSize: 13,
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
                        borderRadius: 10,
                        alignItems: 'center',
                        opacity: processing ? 0.5 : 1,
                      }}
                      onPress={() => {
                        acceptBooking(selectedBooking.id);
                        setShowBookingModal(false);
                      }}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Accept Booking</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: '#DC2626',
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        opacity: processing ? 0.5 : 1,
                      }}
                      onPress={() => {
                        rejectBooking(selectedBooking.id);
                        setShowBookingModal(false);
                      }}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Reject Booking</Text>
                    </TouchableOpacity>
                  </>
                )}
                {selectedBooking?.status === 'confirmed' && selectedBooking?.type === 'video' && selectedBooking?.room_name && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#032A24',
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    onPress={() => {
                      joinMeeting(selectedBooking);
                      setShowBookingModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <VideoIcon color="#FFFFFF" size={14} />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Join Video Call</Text>
                  </TouchableOpacity>
                )}
                {selectedBooking?.status === 'confirmed' && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#3B82F6',
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      opacity: processing ? 0.5 : 1,
                    }}
                    onPress={() => {
                      completeBooking(selectedBooking.id);
                      setShowBookingModal(false);
                    }}
                    disabled={processing}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowBookingModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Close</Text>
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