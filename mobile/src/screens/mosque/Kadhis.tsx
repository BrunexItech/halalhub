import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  Image,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, walletService, clientService, getImageUrl } from '../../api/client';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const ScholarIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M12 8L12 12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="12" cy="14" r="1" fill={color} opacity="0.5"/>
  </Svg>
);

const SearchIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const UserIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M5.5 20C5.5 16.6863 8.18629 14 11.5 14H12.5C15.8137 14 18.5 16.6863 18.5 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const StarIcon = ({ color = '#C9A44B', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const ClockIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 6V12L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
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

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronDownIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronUpIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const FilterIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6H21M6 12H18M10 18H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const VideoIcon = ({ color = '#FFFFFF', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 10L20 6V18L15 14V10Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Rect x="2" y="6" width="13" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const Kadhis = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [professionalType, setProfessionalType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderTypes, setLeaderTypes] = useState<string[]>([]);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showConsultations, setShowConsultations] = useState(false);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [userBalance, setUserBalance] = useState(0);
  const [fetchingBalance, setFetchingBalance] = useState(false);

  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'video',
    notes: '',
    topic: '',
  });

  // Date and Time Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const LEADER_TYPE_LABELS: Record<string, string> = {
    islamic_scholar: 'Islamic Scholar',
    imam: 'Imam',
    adhan_caller: 'Adhan Caller',
    ustadh: 'Ustadh',
    ustadha: 'Ustadha',
    kadhi: 'Kadhi',
  };

  const LEADER_TYPES = [
    { id: 'islamic_scholar', label: 'Islamic Scholar' },
    { id: 'imam', label: 'Imam' },
    { id: 'adhan_caller', label: 'Adhan Caller' },
    { id: 'ustadh', label: 'Ustadh' },
    { id: 'ustadha', label: 'Ustadha' },
    { id: 'kadhi', label: 'Kadhi' },
  ];

  const consultationTopics = [
    'Family Matter',
    'Inheritance',
    'Marriage',
    'Business',
    'Finance',
    'Zakat',
    'Takaful',
    'General Guidance',
    'Other',
  ];

  useEffect(() => {
    fetchProfessionals();
    fetchLeaderTypes();
    if (isAuthenticated) {
      fetchBookings();
      fetchUserBalance();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchBookings();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfessionals();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, professionalType]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded(!filtersExpanded);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfessionals();
    if (isAuthenticated) {
      fetchBookings();
      fetchUserBalance();
    }
    setRefreshing(false);
  };

  const fetchLeaderTypes = async () => {
    try {
      const res = await bookingService.getLeaderTypes();
      if (res.data.success) {
        setLeaderTypes(res.data.types || []);
      }
    } catch (err) {
      console.log('Error fetching leader types:', err);
    }
  };

  const fetchProfessionals = async () => {
    setError('');
    setLoading(true);
    try {
      const params: any = {};
      if (professionalType !== 'all') params.leader_type = professionalType;
      if (searchQuery) params.search = searchQuery;

      const res = await clientService.getConsultationLeaders(params);
      if (res.data.success) {
        setProfessionals(res.data.leaders || []);
      } else {
        setProfessionals([]);
      }
    } catch (err) {
      console.log('Error fetching professionals:', err);
      setError('Failed to load professionals. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!isAuthenticated) return;
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
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchUserBalance = async () => {
    setFetchingBalance(true);
    try {
      const res = await walletService.getBalance();
      if (res.data.success) {
        setUserBalance(res.data.balance || 0);
      }
    } catch (err) {
      console.log('Error fetching balance:', err);
    } finally {
      setFetchingBalance(false);
    }
  };

  const handleBook = async (professional: any) => {
    if (!isAuthenticated) {
      setError('Please sign in to book a consultation.');
      return;
    }
    setSelectedProfessional(professional);
    // Reset date/time to current
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(now);
    setBookingData({
      ...bookingData,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      topic: '',
    });
    await fetchUserBalance();
    setShowBookingModal(true);
  };

  const handleBookingChange = (field: string, value: string) => {
    setBookingData({ ...bookingData, [field]: value });
    setError('');
  };

  const onDateChange = (event: any, selectedDateValue: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDateValue) {
      setSelectedDate(selectedDateValue);
      const formattedDate = selectedDateValue.toISOString().split('T')[0];
      setBookingData({ ...bookingData, date: formattedDate });
    }
  };

  const onTimeChange = (event: any, selectedTimeValue: Date | undefined) => {
    setShowTimePicker(false);
    if (selectedTimeValue) {
      setSelectedTime(selectedTimeValue);
      const formattedTime = selectedTimeValue.toTimeString().slice(0, 5);
      setBookingData({ ...bookingData, time: formattedTime });
    }
  };

  const confirmBooking = async () => {
    if (!bookingData.date || !bookingData.time) {
      setError('Please select a date and time');
      return;
    }
    if (!bookingData.topic) {
      setError('Please select a consultation topic');
      return;
    }

    const fee = selectedProfessional?.fee || 0;

    if (userBalance < fee) {
      setError(`Insufficient balance. You have ${formatCurrency(userBalance)} but need ${formatCurrency(fee)}. Please top up your wallet.`);
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const response = await bookingService.createBooking({
        leader: selectedProfessional.id,
        date: bookingData.date,
        time: bookingData.time,
        type: 'video',
        topic: bookingData.topic,
        notes: bookingData.notes,
        user_name: user?.fullName || 'Guest',
        user_email: user?.email || '',
      });

      if (response.data.success) {
        setShowBookingModal(false);
        setShowSuccessModal(true);
        await fetchBookings();
        await fetchProfessionals();
        await fetchUserBalance();
        setSuccess('Consultation booked successfully');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to book. Please try again.';
      setError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewProfile = (professional: any) => {
    setSelectedProfessional(professional);
    setShowProfileModal(true);
  };

  const handleJoinMeeting = (booking: any) => {
    if (booking.room_name) {
      navigation.navigate('VideoCall' as never, { bookingId: booking.id });
    } else {
      setError('No video call available for this booking');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewConsultations = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowConsultations(!showConsultations);
    if (!showConsultations && bookings.length === 0 && isAuthenticated) {
      fetchBookings();
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const getLeaderTypeLabel = (type: string) => {
    return LEADER_TYPE_LABELS[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      islamic_scholar: { bg: '#DBEAFE', text: '#3B82F6' },
      imam: { bg: '#D1FAE5', text: '#3FAF73' },
      adhan_caller: { bg: '#FEF3C7', text: '#D97706' },
      ustadh: { bg: '#E0E7FF', text: '#4F46E5' },
      ustadha: { bg: '#F3E8FF', text: '#9333EA' },
      kadhi: { bg: '#D1FAE5', text: '#3FAF73' },
    };
    return colors[type] || { bg: '#F4F5F1', text: '#6B7280' };
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      confirmed: { bg: '#D1FAE5', text: '#3FAF73' },
      completed: { bg: '#DBEAFE', text: '#3B82F6' },
      cancelled: { bg: '#FEE2E2', text: '#DC2626' },
      pending: { bg: '#FEF3C7', text: '#D97706' },
    };
    const labels: Record<string, string> = {
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      pending: 'Pending',
    };
    return { style: styles[status] || styles.pending, label: labels[status] || status };
  };

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

  const isVideoBooking = (booking: any) => {
    return booking.type === 'video' && booking.room_name;
  };

  const latestBookings = bookings.slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#032A24" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
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
                  <ScholarIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Islamic Guidance
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Guidance Rooted in Knowledge
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Verified Religious Leaders · Trusted Guidance
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
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 3,
                  height: 16,
                  backgroundColor: '#C9A44B',
                  borderRadius: 2,
                }} />
                <FilterIcon color="#032A24" size={16} />
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                  Search & Filters
                </Text>
                <Text style={{ color: '#8B8A86', fontSize: 10 }}>
                  {professionals.length} professionals
                </Text>
              </View>
              {filtersExpanded ? (
                <ChevronUpIcon color="#6B7280" size={18} />
              ) : (
                <ChevronDownIcon color="#6B7280" size={18} />
              )}
            </TouchableOpacity>

            {filtersExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 130 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Search
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                      <SearchIcon color="#9CA3AF" size={14} />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search by name or expertise..."
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 0.7, minWidth: 90 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Type
                    </Text>
                    <View style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <TextInput
                        style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                        value={professionalType}
                        onChangeText={(text) => setProfessionalType(text)}
                        placeholder="All Types"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>
                    <Text style={{ fontWeight: '600', color: '#032A24' }}>{professionals.length}</Text> professionals available
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ===== PREMIUM PROFESSIONAL CARDS ===== */}
          {professionals.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 48,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>No professionals found. Try adjusting your search.</Text>
            </View>
          ) : (
            professionals.map((professional) => {
              const typeColor = getTypeColor(professional.leader_type);
              const profileImage = professional.profile_image ? getImageUrl(professional.profile_image) : null;
              
              return (
                <View key={professional.id} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                  shadowColor: '#032A24',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.02,
                  shadowRadius: 8,
                  elevation: 1,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {profileImage ? (
                        <Image
                          source={{ uri: profileImage }}
                          style={{ width: 44, height: 44, borderRadius: 10 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: '#032A24',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                            {professional.name?.charAt(0) || 'L'}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>{professional.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          <View style={{
                            backgroundColor: typeColor.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.04)',
                          }}>
                            <Text style={{ color: typeColor.text, fontSize: 10, fontWeight: '500' }}>
                              {getLeaderTypeLabel(professional.leader_type)}
                            </Text>
                          </View>
                          {professional.verified && (
                            <View style={{
                              backgroundColor: 'rgba(63, 175, 115, 0.06)',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: 'rgba(63, 175, 115, 0.08)',
                            }}>
                              <Text style={{ color: '#3FAF73', fontSize: 10, fontWeight: '500' }}>Verified</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: professional.available ? 'rgba(63, 175, 115, 0.06)' : 'rgba(220, 38, 38, 0.06)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: professional.available ? 'rgba(63, 175, 115, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                    }}>
                      <Text style={{
                        color: professional.available ? '#3FAF73' : '#DC2626',
                        fontSize: 10,
                        fontWeight: '500',
                      }}>
                        {professional.available ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {(professional.expertise || []).slice(0, 4).map((exp: string, i: number) => (
                      <View key={i} style={{
                        backgroundColor: 'rgba(3, 42, 36, 0.03)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 10 }}>{exp}</Text>
                      </View>
                    ))}
                    {(professional.expertise || []).length > 4 && (
                      <View style={{
                        backgroundColor: 'rgba(3, 42, 36, 0.03)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 10 }}>+{(professional.expertise || []).length - 4}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8, lineHeight: 18 }} numberOfLines={2}>
                    {professional.bio || 'No bio available'}
                  </Text>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <StarIcon color="#C9A44B" size={12} />
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{professional.rating || 0}</Text>
                      <Text style={{ color: '#8B8A86', fontSize: 12 }}>({professional.reviews || 0})</Text>
                      <Text style={{ color: '#8B8A86', fontSize: 12 }}>·</Text>
                      <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>
                        {professional.fee ? formatCurrency(professional.fee) + '/hr' : 'Contact'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          backgroundColor: '#FAFAF7',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                        }}
                        onPress={() => handleViewProfile(professional)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500' }}>Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: professional.available ? '#032A24' : '#F3F4F6',
                          opacity: professional.available ? 1 : 0.6,
                        }}
                        onPress={() => professional.available && handleBook(professional)}
                        disabled={!professional.available}
                        activeOpacity={0.7}
                      >
                        <Text style={{
                          color: professional.available ? '#FFFFFF' : '#6B7280',
                          fontSize: 11,
                          fontWeight: '600',
                        }}>
                          {professional.available ? 'Book' : 'Unavailable'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* ===== MY CONSULTATIONS ===== */}
          {isAuthenticated && (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 8,
              elevation: 1,
              overflow: 'hidden',
            }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: '#032A24',
                }}
                onPress={handleViewConsultations}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>My Consultations</Text>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{bookings.length}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                    {showConsultations ? 'Hide' : 'Show'}
                  </Text>
                  {showConsultations ? (
                    <ChevronUpIcon color="rgba(255,255,255,0.6)" size={16} />
                  ) : (
                    <ChevronDownIcon color="rgba(255,255,255,0.6)" size={16} />
                  )}
                </View>
              </TouchableOpacity>

              {showConsultations && (
                <View style={{ padding: 16 }}>
                  {loadingBookings ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator size="small" color="#032A24" />
                    </View>
                  ) : latestBookings.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No consultations booked</Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                        Book a consultation with a religious leader
                      </Text>
                    </View>
                  ) : (
                    latestBookings.map((booking) => {
                      const status = getStatusBadge(booking.status);
                      const isVideo = isVideoBooking(booking);
                      const canJoin = isVideo && booking.status === 'confirmed';

                      return (
                        <View key={booking.id} style={{
                          backgroundColor: '#FAFAF7',
                          padding: 12,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                          marginBottom: 8,
                        }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                                {booking.leader_name || 'Leader'}
                              </Text>
                              <Text style={{ color: '#6B7280', fontSize: 11 }}>
                                {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
                              </Text>
                              <Text style={{ color: '#6B7280', fontSize: 11, textTransform: 'capitalize' }}>
                                {booking.type}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <View style={{
                                  backgroundColor: status.style.bg,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 6,
                                  borderWidth: 1,
                                  borderColor: 'rgba(0,0,0,0.04)',
                                }}>
                                  <Text style={{ color: status.style.text, fontSize: 9, fontWeight: '500' }}>{status.label}</Text>
                                </View>
                              </View>
                            </View>
                            {canJoin && (
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#032A24',
                                  paddingHorizontal: 12,
                                  paddingVertical: 6,
                                  borderRadius: 8,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                onPress={() => handleJoinMeeting(booking)}
                                activeOpacity={0.7}
                              >
                                <VideoIcon color="#FFFFFF" size={12} />
                                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Join</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          )}

          {/* ===== FOOTER ===== */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Islamic Guidance
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== BOOKING MODAL WITH DATE/TIME PICKERS ===== */}
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
                Book Consultation
              </Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>{selectedProfessional?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>
                  {getLeaderTypeLabel(selectedProfessional?.leader_type)}
                </Text>
                <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                  {selectedProfessional?.fee ? formatCurrency(selectedProfessional.fee) + '/hr' : 'Fee upon consultation'}
                </Text>
              </View>

              {selectedProfessional?.fee > 0 && (
                <View style={{
                  backgroundColor: userBalance >= selectedProfessional.fee ? 'rgba(3, 42, 36, 0.02)' : '#FEF2F2',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: userBalance >= selectedProfessional.fee ? 'rgba(3, 42, 36, 0.04)' : '#FECACA',
                  marginBottom: 12,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Your Balance</Text>
                    <Text style={{
                      color: userBalance >= selectedProfessional.fee ? '#032A24' : '#DC2626',
                      fontSize: 13,
                      fontWeight: '600',
                    }}>
                      {formatCurrency(userBalance)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Consultation Fee</Text>
                    <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '600' }}>{formatCurrency(selectedProfessional.fee)}</Text>
                  </View>
                  {userBalance < selectedProfessional.fee && !fetchingBalance && (
                    <View style={{
                      backgroundColor: '#FEF2F2',
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#FECACA',
                      marginTop: 8,
                    }}>
                      <Text style={{ color: '#DC2626', fontSize: 12, textAlign: 'center' }}>
                        Insufficient balance. You need {formatCurrency(selectedProfessional.fee)} but have {formatCurrency(userBalance)}.
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#032A24',
                          paddingVertical: 6,
                          borderRadius: 8,
                          alignItems: 'center',
                          marginTop: 6,
                        }}
                        onPress={() => {
                          setShowBookingModal(false);
                          navigation.navigate('Wallet' as never);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Top Up Wallet</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Consultation Topic *
                </Text>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={bookingData.topic}
                    onChangeText={(text) => handleBookingChange('topic', text)}
                    placeholder="Select a topic"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Date Picker */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Date *
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <CalendarIcon color="#9CA3AF" size={16} />
                  <Text style={{
                    flex: 1,
                    color: bookingData.date ? '#1F2937' : '#9CA3AF',
                    fontSize: 14,
                    paddingHorizontal: 10,
                  }}>
                    {bookingData.date || 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Time Picker */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Time *
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <ClockIcon color="#9CA3AF" size={16} />
                  <Text style={{
                    flex: 1,
                    color: bookingData.time ? '#1F2937' : '#9CA3AF',
                    fontSize: 14,
                    paddingHorizontal: 10,
                  }}>
                    {bookingData.time || 'Select time'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Consultation Type
                </Text>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={bookingData.type}
                    onChangeText={(text) => handleBookingChange('type', text)}
                    placeholder="video"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Notes
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 50,
                    textAlignVertical: 'top',
                  }}
                  value={bookingData.notes}
                  onChangeText={(text) => handleBookingChange('notes', text)}
                  placeholder="Brief description of your consultation needs..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.04)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.06)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  Your consultation information will be handled confidentially and only shared with the professional you are booking.
                </Text>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
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
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor:
                      userBalance >= (selectedProfessional?.fee || 0) &&
                      bookingData.date &&
                      bookingData.time &&
                      bookingData.topic &&
                      !processing
                        ? '#032A24'
                        : '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity:
                      userBalance >= (selectedProfessional?.fee || 0) &&
                      bookingData.date &&
                      bookingData.time &&
                      bookingData.topic &&
                      !processing
                        ? 1
                        : 0.6,
                  }}
                  onPress={confirmBooking}
                  disabled={
                    processing ||
                    !bookingData.date ||
                    !bookingData.time ||
                    !bookingData.topic ||
                    userBalance < (selectedProfessional?.fee || 0)
                  }
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Booking...</Text>
                    </View>
                  ) : (
                    <Text style={{
                      color:
                        userBalance >= (selectedProfessional?.fee || 0) &&
                        bookingData.date &&
                        bookingData.time &&
                        bookingData.topic &&
                        !processing
                          ? '#FFFFFF'
                          : '#6B7280',
                      fontSize: 14,
                      fontWeight: '600',
                    }}>
                      Confirm Booking
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DateTimePicker for Date */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* DateTimePicker for Time */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade">
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
                Professional Profile
              </Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {selectedProfessional?.profile_image ? (
                  <Image
                    source={{ uri: getImageUrl(selectedProfessional.profile_image) }}
                    style={{ width: 56, height: 56, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: '#032A24',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
                      {selectedProfessional?.name?.charAt(0) || 'L'}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700' }}>{selectedProfessional?.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <View style={{
                      backgroundColor: getTypeColor(selectedProfessional?.leader_type).bg,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.04)',
                    }}>
                      <Text style={{
                        color: getTypeColor(selectedProfessional?.leader_type).text,
                        fontSize: 10,
                        fontWeight: '500',
                      }}>
                        {getLeaderTypeLabel(selectedProfessional?.leader_type)}
                      </Text>
                    </View>
                    {selectedProfessional?.verified && (
                      <View style={{
                        backgroundColor: 'rgba(63, 175, 115, 0.06)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(63, 175, 115, 0.08)',
                      }}>
                        <Text style={{ color: '#3FAF73', fontSize: 10, fontWeight: '500' }}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Experience</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{selectedProfessional?.experience || 'N/A'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Languages</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {selectedProfessional?.languages?.join(', ') || 'N/A'}
                  </Text>
                </View>
                {selectedProfessional?.institution && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Institution</Text>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                      {selectedProfessional.institution}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Rating</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '600' }}>
                    ★ {selectedProfessional?.rating || 0} ({selectedProfessional?.reviews || 0} reviews)
                  </Text>
                </View>
                {selectedProfessional?.fee && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Fee</Text>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatCurrency(selectedProfessional.fee)}/hour</Text>
                  </View>
                )}
              </View>

              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>About</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                  {selectedProfessional?.bio || 'No bio available'}
                </Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Expertise</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {(selectedProfessional?.expertise || []).map((exp: string, i: number) => (
                    <View key={i} style={{
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>{exp}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowProfileModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Close</Text>
                </TouchableOpacity>
                {selectedProfessional?.available && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#032A24',
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setShowProfileModal(false);
                      handleBook(selectedProfessional);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Book Consultation</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#032A24',
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              margin: -24,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Booking Confirmed
              </Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: 'rgba(63, 175, 115, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(63, 175, 115, 0.12)',
                }}>
                  <CheckIcon color="#3FAF73" size={30} />
                </View>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>Consultation booked with</Text>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', marginTop: 2 }}>{selectedProfessional?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                  {bookingData.date} at {bookingData.time}
                </Text>
                {selectedProfessional?.fee > 0 && (
                  <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                    Fee: {formatCurrency(selectedProfessional.fee)}
                  </Text>
                )}
              </View>

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.04)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.06)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  You will receive a confirmation with details. The professional will contact you regarding your consultation.
                </Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.04)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 }}>
                  "And whoever is granted wisdom has indeed been granted great good." — Quran 2:269
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowSuccessModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowSuccessModal(false);
                    setShowConsultations(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>View My Consultations</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Toast */}
      {success ? (
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 20,
          left: 20,
          backgroundColor: '#032A24',
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#032A24',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CheckIcon color="#C9A44B" size={18} />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')} activeOpacity={0.7} style={{ padding: 4 }}>
            <CloseIcon color="rgba(255,255,255,0.5)" size={18} />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Kadhis;