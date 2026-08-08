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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, walletService, clientService, getImageUrl } from '../../api/client';

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

  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);

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
      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.log('Error fetching bookings:', err);
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
    setBookingData({
      ...bookingData,
      topic: '',
    });
    await fetchUserBalance();
    setShowBookingModal(true);
  };

  const handleBookingChange = (field: string, value: string) => {
    setBookingData({ ...bookingData, [field]: value });
    setError('');
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

    const balance = await fetchUserBalance();
    const fee = selectedProfessional?.fee || 0;

    if (balance < fee) {
      setError(`Insufficient balance. You have ${formatCurrency(balance)} but need ${formatCurrency(fee)}. Please top up your wallet.`);
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const response = await bookingService.createBooking({
        leaderId: selectedProfessional.id,
        bookingDate: bookingData.date,
        bookingTime: bookingData.time,
        type: 'video',
        topic: bookingData.topic,
        notes: bookingData.notes,
        userName: user?.fullName || 'Guest',
        userEmail: user?.email || '',
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
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading...</Text>
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
          {/* Hero Section */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Islamic Guidance
                </Text>
                <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>Religious Leaders</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Guidance Rooted in Knowledge</Text>
              <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 4, maxWidth: 400, lineHeight: 20 }}>
                Connect with verified religious leaders for trusted guidance and consultation.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>Verified Leaders</Text>
                </View>
              </View>
            </View>
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

          {/* Filters */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 140 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Search
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name or expertise..."
                />
              </View>
              <View style={{ flex: 0.7, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Type
                </Text>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={professionalType}
                    onChangeText={(text) => setProfessionalType(text)}
                    placeholder="All Types"
                  />
                </View>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 10,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: '#F4F5F1',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>
                {professionals.length} professional{professionals.length !== 1 ? 's' : ''} available
              </Text>
            </View>
          </View>

          {/* Professionals Grid */}
          {professionals.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E8EEF4',
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
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
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
                          backgroundColor: '#0B342B',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                            {professional.name?.charAt(0) || 'L'}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{professional.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          <View style={{
                            backgroundColor: typeColor.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.05)',
                          }}>
                            <Text style={{ color: typeColor.text, fontSize: 11, fontWeight: '500' }}>
                              {getLeaderTypeLabel(professional.leader_type)}
                            </Text>
                          </View>
                          {professional.verified && (
                            <View style={{
                              backgroundColor: '#D1FAE5',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: '#A7F3D0',
                            }}>
                              <Text style={{ color: '#3FAF73', fontSize: 11, fontWeight: '500' }}>Verified</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: professional.available ? '#D1FAE5' : '#FEE2E2',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: professional.available ? '#A7F3D0' : '#FCA5A5',
                    }}>
                      <Text style={{
                        color: professional.available ? '#3FAF73' : '#DC2626',
                        fontSize: 11,
                        fontWeight: '500',
                      }}>
                        {professional.available ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {(professional.expertise || []).slice(0, 3).map((exp: string, i: number) => (
                      <View key={i} style={{
                        backgroundColor: '#FAFAF7',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>{exp}</Text>
                      </View>
                    ))}
                    {(professional.expertise || []).length > 3 && (
                      <View style={{
                        backgroundColor: '#FAFAF7',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>+{(professional.expertise || []).length - 3}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }} numberOfLines={2}>
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
                    borderTopColor: '#F4F5F1',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: '#C9A44B', fontSize: 14 }}>★</Text>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{professional.rating || 0}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 14 }}>({professional.reviews || 0})</Text>
                      <Text style={{ color: '#6B7280', fontSize: 14 }}>·</Text>
                      <Text style={{ color: '#6B7280', fontSize: 14 }}>
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
                          borderColor: '#E8EEF4',
                        }}
                        onPress={() => handleViewProfile(professional)}
                      >
                        <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }}>Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: professional.available ? '#0B342B' : '#F4F5F1',
                          opacity: professional.available ? 1 : 0.6,
                          shadowColor: professional.available ? '#0B342B' : 'transparent',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: professional.available ? 0.2 : 0,
                          shadowRadius: 8,
                          elevation: professional.available ? 4 : 0,
                        }}
                        onPress={() => professional.available && handleBook(professional)}
                        disabled={!professional.available}
                      >
                        <Text style={{
                          color: professional.available ? '#FFFFFF' : '#6B7280',
                          fontSize: 13,
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

          {/* My Consultations */}
          {isAuthenticated && (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              marginTop: 16,
              borderWidth: 1,
              borderColor: '#E8EEF4',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: '#0B342B',
                }}
                onPress={handleViewConsultations}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>My Consultations</Text>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                  }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{bookings.length}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    {showConsultations ? 'Hide' : 'Show'}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>
                    {showConsultations ? '▲' : '▼'}
                  </Text>
                </View>
              </TouchableOpacity>

              {showConsultations && (
                <View style={{ padding: 16 }}>
                  {loadingBookings ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator size="small" color="#C9A44B" />
                    </View>
                  ) : latestBookings.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <Text style={{ color: '#6B7280', fontSize: 14 }}>No consultations booked</Text>
                      <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
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
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          marginBottom: 6,
                        }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                                {booking.leader_name || 'Leader'}
                              </Text>
                              <Text style={{ color: '#6B7280', fontSize: 13 }}>
                                {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
                              </Text>
                              <Text style={{ color: '#6B7280', fontSize: 13, textTransform: 'capitalize' }}>
                                {booking.type}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{
                                  backgroundColor: status.style.bg,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 999,
                                  borderWidth: 1,
                                  borderColor: 'rgba(0,0,0,0.05)',
                                }}>
                                  <Text style={{ color: status.style.text, fontSize: 11, fontWeight: '500' }}>{status.label}</Text>
                                </View>
                              </View>
                              {isVideo && booking.room_name && (
                                <Text style={{ color: '#0B342B', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                                  Room: {booking.room_name}
                                </Text>
                              )}
                            </View>
                            {canJoin && (
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#0B342B',
                                  paddingHorizontal: 12,
                                  paddingVertical: 6,
                                  borderRadius: 8,
                                }}
                                onPress={() => handleJoinMeeting(booking)}
                              >
                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Join Call</Text>
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
        </View>
      </ScrollView>

      {/* Booking Modal */}
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
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Book Consultation</Text>
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
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>{selectedProfessional?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>
                  {getLeaderTypeLabel(selectedProfessional?.leader_type)}
                </Text>
                <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                  {selectedProfessional?.fee ? formatCurrency(selectedProfessional.fee) + '/hr' : 'Fee upon consultation'}
                </Text>
              </View>

              {selectedProfessional?.fee > 0 && (
                <View style={{
                  backgroundColor: userBalance >= selectedProfessional.fee ? '#FAFAF7' : '#FEF2F2',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: userBalance >= selectedProfessional.fee ? '#E8EEF4' : '#FECACA',
                  marginBottom: 12,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Your Balance</Text>
                    <Text style={{
                      color: userBalance >= selectedProfessional.fee ? '#0B342B' : '#DC2626',
                      fontSize: 14,
                      fontWeight: '600',
                    }}>
                      {formatCurrency(userBalance)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Consultation Fee</Text>
                    <Text style={{ color: '#C9A44B', fontSize: 14, fontWeight: '600' }}>{formatCurrency(selectedProfessional.fee)}</Text>
                  </View>
                  {fetchingBalance && (
                    <View style={{ alignItems: 'center', marginTop: 6 }}>
                      <ActivityIndicator size="small" color="#C9A44B" />
                    </View>
                  )}
                  {userBalance < selectedProfessional.fee && !fetchingBalance && (
                    <View style={{
                      backgroundColor: '#FEF2F2',
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#FECACA',
                      marginTop: 8,
                    }}>
                      <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>
                        Insufficient balance. You need {formatCurrency(selectedProfessional.fee)} but have {formatCurrency(userBalance)}.
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#0B342B',
                          paddingVertical: 6,
                          borderRadius: 8,
                          alignItems: 'center',
                          marginTop: 6,
                        }}
                        onPress={() => {
                          setShowBookingModal(false);
                          navigation.navigate('Wallet' as never);
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Top Up Wallet</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Consultation Topic</Text>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={bookingData.topic}
                    onChangeText={(text) => handleBookingChange('topic', text)}
                    placeholder="Select a topic"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Date</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={bookingData.date}
                  onChangeText={(text) => handleBookingChange('date', text)}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Time</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={bookingData.time}
                  onChangeText={(text) => handleBookingChange('time', text)}
                  placeholder="HH:MM"
                />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Consultation Type</Text>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={bookingData.type}
                    onChangeText={(text) => handleBookingChange('type', text)}
                    placeholder="video"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Notes</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 50,
                    textAlignVertical: 'top',
                  }}
                  value={bookingData.notes}
                  onChangeText={(text) => handleBookingChange('notes', text)}
                  placeholder="Brief description of your consultation needs..."
                  multiline
                />
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                  Your consultation information will be handled confidentially and only shared with the professional you are booking.
                </Text>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowBookingModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
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
                        ? '#0B342B'
                        : '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity:
                      userBalance >= (selectedProfessional?.fee || 0) &&
                      bookingData.date &&
                      bookingData.time &&
                      bookingData.topic &&
                      !processing
                        ? 1
                        : 0.6,
                    shadowColor:
                      userBalance >= (selectedProfessional?.fee || 0) &&
                      bookingData.date &&
                      bookingData.time &&
                      bookingData.topic &&
                      !processing
                        ? '#0B342B'
                        : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity:
                      userBalance >= (selectedProfessional?.fee || 0) &&
                      bookingData.date &&
                      bookingData.time &&
                      bookingData.topic &&
                      !processing
                        ? 0.2
                        : 0,
                    shadowRadius: 8,
                    elevation:
                      userBalance >= (selectedProfessional?.fee || 0) &&
                      bookingData.date &&
                      bookingData.time &&
                      bookingData.topic &&
                      !processing
                        ? 4
                        : 0,
                  }}
                  onPress={confirmBooking}
                  disabled={
                    processing ||
                    !bookingData.date ||
                    !bookingData.time ||
                    !bookingData.topic ||
                    userBalance < (selectedProfessional?.fee || 0)
                  }
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Booking...</Text>
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
                      fontSize: 15,
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

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade">
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
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Professional Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
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
                    backgroundColor: '#0B342B',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
                      {selectedProfessional?.name?.charAt(0) || 'L'}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '700' }}>{selectedProfessional?.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <View style={{
                      backgroundColor: getTypeColor(selectedProfessional?.leader_type).bg,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.05)',
                    }}>
                      <Text style={{
                        color: getTypeColor(selectedProfessional?.leader_type).text,
                        fontSize: 11,
                        fontWeight: '500',
                      }}>
                        {getLeaderTypeLabel(selectedProfessional?.leader_type)}
                      </Text>
                    </View>
                    {selectedProfessional?.verified && (
                      <View style={{
                        backgroundColor: '#D1FAE5',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: '#A7F3D0',
                      }}>
                        <Text style={{ color: '#3FAF73', fontSize: 11, fontWeight: '500' }}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Experience</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedProfessional?.experience || 'N/A'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Languages</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {selectedProfessional?.languages?.join(', ') || 'N/A'}
                  </Text>
                </View>
                {selectedProfessional?.institution && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Institution</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                      {selectedProfessional.institution}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Rating</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 14, fontWeight: '600' }}>
                    ★ {selectedProfessional?.rating || 0} ({selectedProfessional?.reviews || 0} reviews)
                  </Text>
                </View>
                {selectedProfessional?.fee && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Fee</Text>
                    <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '600' }}>{formatCurrency(selectedProfessional.fee)}/hour</Text>
                  </View>
                )}
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>About</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                  {selectedProfessional?.bio || 'No bio available'}
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>Expertise</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {(selectedProfessional?.expertise || []).map((exp: string, i: number) => (
                    <View key={i} style={{
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{exp}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowProfileModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Close</Text>
                </TouchableOpacity>
                {selectedProfessional?.available && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#0B342B',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      shadowColor: '#0B342B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={() => {
                      setShowProfileModal(false);
                      handleBook(selectedProfessional);
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Book Consultation</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#0B342B',
              padding: 16,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              margin: -20,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Booking Confirmed</Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(11, 52, 43, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(11, 52, 43, 0.2)',
                }}>
                  <Text style={{ color: '#0B342B', fontSize: 32 }}>✓</Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>Consultation booked with</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 2 }}>{selectedProfessional?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
                  {bookingData.date} at {bookingData.time}
                </Text>
                {selectedProfessional?.fee > 0 && (
                  <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '600', marginTop: 4 }}>
                    Fee: {formatCurrency(selectedProfessional.fee)}
                  </Text>
                )}
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                  You will receive a confirmation with details. The professional will contact you regarding your consultation.
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 }}>
                  "And whoever is granted wisdom has indeed been granted great good." — Quran 2:269
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={() => {
                    setShowSuccessModal(false);
                    setShowConsultations(true);
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>View My Consultations</Text>
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
          top: 60,
          right: 16,
          left: 16,
          backgroundColor: '#0B342B',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#0B342B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#C9A44B', fontSize: 16 }}>✓</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Kadhis;