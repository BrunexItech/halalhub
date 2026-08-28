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
  Image,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PinModal from '../../components/common/PinModal';
import { clientService } from '../../api/client';
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

const HomeIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12L5 10.5M5 10.5L12 3L19 10.5M5 10.5V19C5 19.5523 5.44772 20 6 20H10M19 10.5L21 12M19 10.5V19C19 19.5523 18.5523 20 18 20H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M10 14H14V20H10V14Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SearchIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const LocationIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const UserIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M5.5 20C5.5 16.6863 8.18629 14 11.5 14H12.5C15.8137 14 18.5 16.6863 18.5 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
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

const BedIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 15V9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9V15M4 15V19M4 15H20M20 15V19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 11H10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M14 11H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const StarIcon = ({ color = '#C9A44B', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronDownIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronUpIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const HeartIcon = ({ color = '#6B7280', size = 18, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" 
      fill={filled ? '#DC2626' : 'none'} 
      stroke={filled ? '#DC2626' : color} 
      strokeWidth="1.5"
    />
  </Svg>
);

const HalalStay = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [locations, setLocations] = useState<string[]>(['All']);
  const [propertyTypes, setPropertyTypes] = useState<string[]>(['All']);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrollComplete, setTermsScrollComplete] = useState(false);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  
  // Collapsible sections
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [bookingsExpanded, setBookingsExpanded] = useState(false);

  // ===== PIN MODAL STATE =====
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pendingBooking, setPendingBooking] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setGuestName(user.fullName || '');
      setGuestEmail(user.email || '');
      setGuestPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    fetchProperties();
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded(!filtersExpanded);
  };

  const toggleBookings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBookingsExpanded(!bookingsExpanded);
  };

  const fetchProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await clientService.getListings({ limit: 100 });
      const propertyData = response.data.listings || [];
      setProperties(propertyData);

      const uniqueLocations = ['All', ...new Set(propertyData.map((p: any) => p.county || p.location).filter(Boolean))];
      const uniqueTypes = ['All', ...new Set(propertyData.map((p: any) => p.type).filter(Boolean))];
      setLocations(uniqueLocations);
      setPropertyTypes(uniqueTypes);
    } catch (err) {
      console.log('Error fetching properties:', err);
      setError('Failed to load properties. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await clientService.getBookings();
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.log('Bookings error:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!selectedProperty) return 0;
    const nights = calculateNights();
    return selectedProperty.price_per_night * rooms * nights;
  };

  const isFullyBooked = (property: any) => {
    return property.available_rooms !== undefined && property.available_rooms <= 0;
  };

  const getAvailableRooms = (property: any) => {
    return property.available_rooms !== undefined ? property.available_rooms : property.total_rooms || 1;
  };

  const getMaxGuestsPerRoom = (property: any) => {
    return property.max_guests_per_room || 2;
  };

  const toggleWishlist = (propertyId: string) => {
    if (!isAuthenticated) {
      setError('Please sign in to save properties to your wishlist.');
      return;
    }
    if (wishlist.includes(propertyId)) {
      setWishlist(wishlist.filter((id) => id !== propertyId));
    } else {
      setWishlist([...wishlist, propertyId]);
      setSuccess('Added to wishlist!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openTermsModal = () => {
    setTermsScrollComplete(false);
    setShowTermsModal(true);
  };

  const acceptTerms = () => {
    if (!termsScrollComplete) {
      setError('Please scroll to the bottom to read all terms.');
      return;
    }
    setTermsAccepted(true);
    setShowTermsModal(false);
    setError('');
  };

  const handleBookNow = (property: any) => {
    if (!isAuthenticated) {
      setError('Please sign in to book a stay.');
      return;
    }

    if (isFullyBooked(property)) {
      setError('This property is fully booked for the selected dates.');
      return;
    }

    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates.');
      return;
    }

    const nights = calculateNights();
    if (property.min_stay && nights < property.min_stay) {
      setError(`Minimum stay is ${property.min_stay} night(s).`);
      return;
    }

    if (!guestName || !guestEmail || !guestPhone) {
      setError('Please fill in all guest details.');
      return;
    }

    const maxGuestsPerRoom = getMaxGuestsPerRoom(property);
    const maxAllowedGuests = rooms * maxGuestsPerRoom;

    if (guests > maxAllowedGuests) {
      setError(`Maximum ${maxGuestsPerRoom} guests per room. You booked ${rooms} room(s), so maximum ${maxAllowedGuests} guests allowed.`);
      return;
    }

    // Store booking data and show PIN modal instead of directly confirming
    setPendingBooking({
      listing_id: property.id,
      check_in: checkIn,
      check_out: checkOut,
      guests: guests,
      rooms: rooms,
      special_requests: specialRequests,
      property: property,
    });
    setSelectedProperty(property);
    setShowPinModal(true);
    setPinError('');
  };

  // ===== PIN VERIFICATION =====
  const handlePinVerify = async (pin: string) => {
    setPinLoading(true);
    setPinError('');

    try {
      const nights = calculateNights();
      const totalPrice = calculateTotal();

      const response = await clientService.createBooking({
        ...pendingBooking,
        pin: pin,
      });

      const bookingRef = response.data.bookingId || `HS-${Date.now().toString().slice(-8)}`;

      setBookingData({
        bookingRef,
        propertyName: selectedProperty.title,
        propertyLocation: selectedProperty.location || selectedProperty.county,
        checkIn: pendingBooking.check_in,
        checkOut: pendingBooking.check_out,
        nights,
        guests: pendingBooking.guests,
        rooms: pendingBooking.rooms,
        total: totalPrice,
        property: selectedProperty,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests: pendingBooking.special_requests,
        agreementAccepted: termsAccepted,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        roomsLeft: response.data.rooms_left,
      });

      setShowPinModal(false);
      setShowBookingModal(false);
      setShowSuccessModal(true);

      await fetchBookings();
      await fetchProperties();

      setSuccess(`Booking confirmed for ${selectedProperty.title}!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setPinError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinError('');
    setPendingBooking(null);
  };

  const viewBookingDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      confirmed: { bg: '#D1FAE5', text: '#3FAF73' },
      pending: { bg: '#FEF3C7', text: '#D97706' },
      cancelled: { bg: '#FEE2E2', text: '#DC2626' },
      completed: { bg: '#DBEAFE', text: '#3B82F6' },
    };
    const labels: Record<string, string> = {
      confirmed: 'Confirmed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };
    return { style: styles[status] || styles.confirmed, label: labels[status] || status };
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || p.county === selectedLocation || p.location === selectedLocation;
    const matchesType = selectedType === 'All' || p.type === selectedType;
    const matchesPrice = (p.price_per_night || 0) >= priceRange[0] && (p.price_per_night || 0) <= priceRange[1];
    return matchesSearch && matchesLocation && matchesType && matchesPrice && p.is_active !== false;
  });

  if (loading) {
  return <LoadingSpinner message="Loading properties..." />;
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
            marginBottom: 24,
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
                  <HomeIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    HalalStay
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Find Your Perfect Halal Stay
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Halal-friendly · Private · Values-respecting
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
              marginBottom: 16,
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

          {/* ===== COLLAPSIBLE SEARCH/FILTERS ===== */}
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
                <SearchIcon color="#032A24" size={16} />
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                  Search & Filters
                </Text>
                <Text style={{ color: '#8B8A86', fontSize: 10 }}>
                  {filteredProperties.length} properties
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
                        placeholder="Search by name or location..."
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1, minWidth: 90 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Location
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
                        value={selectedLocation}
                        onChangeText={(text) => setSelectedLocation(text)}
                        placeholder="All"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1, minWidth: 90 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Property Type
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
                        value={selectedType}
                        onChangeText={(text) => setSelectedType(text)}
                        placeholder="All"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 0.6, minWidth: 70 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Guests
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
                      }}
                      value={String(guests)}
                      onChangeText={(text) => setGuests(Math.max(1, parseInt(text) || 1))}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1, minWidth: 110 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Check-in
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                      <CalendarIcon color="#9CA3AF" size={14} />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={checkIn}
                        onChangeText={setCheckIn}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1, minWidth: 110 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Check-out
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                      <CalendarIcon color="#9CA3AF" size={14} />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={checkOut}
                        onChangeText={setCheckOut}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 0.6, minWidth: 70 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Rooms
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                      <BedIcon color="#9CA3AF" size={14} />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={String(rooms)}
                        onChangeText={(text) => setRooms(Math.max(1, parseInt(text) || 1))}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1, minWidth: 90 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Max Price
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TextInput
                        style={{
                          flex: 1,
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={String(priceRange[1])}
                        onChangeText={(text) => setPriceRange([priceRange[0], parseInt(text) || 0])}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                      <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>{formatCurrency(priceRange[1])}</Text>
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
                    <Text style={{ fontWeight: '600', color: '#032A24' }}>{filteredProperties.length}</Text> properties found
                  </Text>
                  {checkIn && checkOut && (
                    <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '600' }}>
                      {calculateNights()} nights
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* ===== PREMIUM PROPERTY CARDS ===== */}
          {filteredProperties.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 48,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>No properties found. Try adjusting your filters.</Text>
            </View>
          ) : (
            filteredProperties.map((property) => {
              const fullyBooked = isFullyBooked(property);
              const availableRooms = getAvailableRooms(property);
              const maxGuestsPerRoom = getMaxGuestsPerRoom(property);
              const isInWishlist = wishlist.includes(property.id);
              const pct = property.total_rooms ? Math.round(((property.total_rooms - availableRooms) / property.total_rooms) * 100) : 0;

              return (
                <View key={property.id} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                  overflow: 'hidden',
                  shadowColor: '#032A24',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                  elevation: 2,
                  opacity: fullyBooked ? 0.7 : 1,
                }}>
                  <Image
                    source={{ uri: property.images?.[0] || 'https://via.placeholder.com/400x300/032A24/C9A44B?text=HalalStay' }}
                    style={{ width: '100%', height: 200 }}
                    resizeMode="cover"
                  />
                  
                  {/* Wishlist Button */}
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                    onPress={() => toggleWishlist(property.id)}
                    activeOpacity={0.7}
                  >
                    <HeartIcon color="#6B7280" size={16} filled={isInWishlist} />
                  </TouchableOpacity>

                  {/* Availability Badge */}
                  {fullyBooked && (
                    <View style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      backgroundColor: 'rgba(220, 38, 38, 0.9)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Fully Booked</Text>
                    </View>
                  )}

                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 }}>
                          {property.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <LocationIcon color="#6B7280" size={12} />
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>{property.location || property.county}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                          {formatCurrency(property.price_per_night)}
                        </Text>
                        <Text style={{ color: '#8B8A86', fontSize: 11 }}>per night</Text>
                      </View>
                    </View>

                    <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 6, lineHeight: 20 }} numberOfLines={2}>
                      {property.description}
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                      {(property.amenities || []).slice(0, 4).map((amenity: string, i: number) => (
                        <View key={i} style={{
                          backgroundColor: 'rgba(3, 42, 36, 0.03)',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 10 }}>{amenity}</Text>
                        </View>
                      ))}
                      {(property.amenities || []).length > 4 && (
                        <View style={{
                          backgroundColor: 'rgba(3, 42, 36, 0.03)',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 10 }}>+{(property.amenities || []).length - 4}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <BedIcon color="#6B7280" size={12} />
                        <Text style={{ color: '#6B7280', fontSize: 12 }}>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <UserIcon color="#6B7280" size={12} />
                        <Text style={{ color: '#6B7280', fontSize: 12 }}>{property.max_guests} guests</Text>
                      </View>
                      {property.min_stay > 1 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <CalendarIcon color="#D97706" size={12} />
                          <Text style={{ color: '#D97706', fontSize: 12 }}>Min {property.min_stay} nights</Text>
                        </View>
                      )}
                    </View>

                    {/* Availability Bar */}
                    {!fullyBooked && property.total_rooms && (
                      <View style={{ marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                          <Text style={{ color: '#6B7280', fontSize: 10 }}>
                            {availableRooms} rooms available
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 10 }}>
                            {pct}% booked
                          </Text>
                        </View>
                        <View style={{
                          height: 3,
                          backgroundColor: '#F3F4F6',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}>
                          <View style={{
                            height: '100%',
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: '#032A24',
                            borderRadius: 2,
                          }} />
                        </View>
                      </View>
                    )}

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <StarIcon color="#C9A44B" size={12} />
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{property.rating || 'New'}</Text>
                        {property.total_reviews > 0 && (
                          <Text style={{ color: '#8B8A86', fontSize: 12 }}>({property.total_reviews})</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 18,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: (fullyBooked || !property.is_active) ? '#F3F4F6' : '#032A24',
                          opacity: (fullyBooked || !property.is_active) ? 0.6 : 1,
                        }}
                        onPress={() => handleBookNow(property)}
                        disabled={fullyBooked || !property.is_active}
                        activeOpacity={0.7}
                      >
                        <Text style={{
                          color: (fullyBooked || !property.is_active) ? '#6B7280' : '#FFFFFF',
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                          {fullyBooked ? 'Fully Booked' : property.is_active ? 'Book Now' : 'Unavailable'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* ===== COLLAPSIBLE MY BOOKINGS ===== */}
          {isAuthenticated && (
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
              marginTop: 16,
              overflow: 'hidden',
            }}>
              <TouchableOpacity
                onPress={toggleBookings}
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
                  <HomeIcon color="#032A24" size={16} />
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                    My Bookings
                  </Text>
                  {bookings.length > 0 && (
                    <View style={{
                      backgroundColor: 'rgba(3, 42, 36, 0.06)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500' }}>
                        {bookings.length}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity onPress={fetchBookings} activeOpacity={0.7}>
                    <Text style={{ color: '#6B7280', fontSize: 11 }}>Refresh</Text>
                  </TouchableOpacity>
                  {bookingsExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </View>
              </TouchableOpacity>

              {bookingsExpanded && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  {loadingBookings ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator size="small" color="#032A24" />
                    </View>
                  ) : bookings.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No bookings yet.</Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>Start your first HalalStay!</Text>
                    </View>
                  ) : (
                    bookings.slice(0, 5).map((booking) => {
                      const status = getStatusBadge(booking.status);
                      return (
                        <TouchableOpacity
                          key={booking.id}
                          style={{
                            backgroundColor: '#FAFAF7',
                            padding: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(3, 42, 36, 0.04)',
                            marginBottom: 8,
                          }}
                          onPress={() => viewBookingDetails(booking)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                                {booking.listing_title || 'Property'}
                              </Text>
                              <Text style={{ color: '#6B7280', fontSize: 11 }}>
                                {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                              </Text>
                              <Text style={{ color: '#6B7280', fontSize: 11 }}>{booking.guests} guests</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>
                                {formatCurrency(booking.total_price)}
                              </Text>
                              <View style={{
                                backgroundColor: status.style.bg,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}>
                                <Text style={{ color: status.style.text, fontSize: 9, fontWeight: '500' }}>{status.label}</Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · HalalStay Services
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modals preserved with premium styling */}
      {/* Booking Modal */}
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
                Confirm Booking
              </Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700' }}>{selectedProperty?.title}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{selectedProperty?.location || selectedProperty?.county}</Text>
                {selectedProperty?.available_rooms !== undefined && (
                  <Text style={{ color: selectedProperty.available_rooms <= 3 ? '#D97706' : '#3FAF73', fontSize: 13, marginTop: 2 }}>
                    {selectedProperty.available_rooms} room{selectedProperty.available_rooms > 1 ? 's' : ''} available
                    <Text style={{ color: '#6B7280', fontSize: 12 }}> (Max {selectedProperty.max_guests_per_room || 2} guests/room)</Text>
                  </Text>
                )}
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Check-in</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatDate(checkIn)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Check-out</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatDate(checkOut)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Nights</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{calculateNights()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Rooms</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{rooms}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Guests</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{guests}</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 }}>
                  Guest Details
                </Text>
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', marginBottom: 2 }}>Full Name</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: '#1F2937',
                      fontSize: 13,
                    }}
                    value={guestName}
                    onChangeText={setGuestName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', marginBottom: 2 }}>Email</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: '#1F2937',
                      fontSize: 13,
                    }}
                    value={guestEmail}
                    onChangeText={setGuestEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', marginBottom: 2 }}>Phone</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: '#1F2937',
                      fontSize: 13,
                    }}
                    value={guestPhone}
                    onChangeText={setGuestPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', marginBottom: 2 }}>Special Requests</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: '#1F2937',
                      fontSize: 13,
                      minHeight: 50,
                      textAlignVertical: 'top',
                    }}
                    value={specialRequests}
                    onChangeText={setSpecialRequests}
                    placeholder="Any special requests?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
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
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Price per night</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatCurrency(selectedProperty?.price_per_night)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Rooms</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>× {rooms}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Nights</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>× {calculateNights()}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Total</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 15, fontWeight: '700' }}>{formatCurrency(calculateTotal())}</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <TouchableOpacity
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: termsAccepted ? '#032A24' : 'rgba(3, 42, 36, 0.12)',
                      backgroundColor: termsAccepted ? '#032A24' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    {termsAccepted && <CheckIcon color="#FFFFFF" size={12} />}
                  </TouchableOpacity>
                  <View>
                    <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)}>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }}>
                        I agree to the Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openTermsModal}>
                      <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                        Read Full Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

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
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: (processing || !termsAccepted || !guestName || !guestEmail || !guestPhone) ? 0.5 : 1,
                  }}
                  onPress={() => {
                    // This now triggers the PIN modal flow
                    handleBookNow(selectedProperty);
                    setShowBookingModal(false);
                  }}
                  disabled={processing || !termsAccepted || !guestName || !guestEmail || !guestPhone}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Confirm Booking</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={showTermsModal} transparent animationType="fade">
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
                Terms & Conditions
              </Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 10;
                if (isAtBottom) {
                  setTermsScrollComplete(true);
                }
              }}
              scrollEventThrottle={16}
            >
              <View style={{ marginBottom: 12 }}>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>1. HalalStay Platform Terms</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    HalalStay is a platform for halal-friendly accommodation. By using this platform, you agree to:
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20, marginTop: 4 }}>
                    • Only book accommodation that aligns with Islamic values{'\n'}
                    • Respect the privacy and property of hosts and guests{'\n'}
                    • Provide accurate and truthful information{'\n'}
                    • Maintain Islamic etiquette in all interactions
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>2. Property Terms</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    Each property has specific rules. Please review them carefully.
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>3. Cancellation Policy</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    Cancellations must be made by the vendor. Guests cannot cancel bookings directly.
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>4. Guest Responsibilities</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    • Respect the property and its contents{'\n'}
                    • Follow all property rules and guidelines{'\n'}
                    • Provide accurate guest information{'\n'}
                    • Respect other guests and residents{'\n'}
                    • Maintain halal conduct at all times{'\n'}
                    • No alcohol, pork, or prohibited activities
                  </Text>
                </View>
              </View>

              {!termsScrollComplete && (
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '600' }}>Scroll to the bottom to accept</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowTermsModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: termsScrollComplete ? '#032A24' : '#F3F4F6',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  opacity: termsScrollComplete ? 1 : 0.6,
                }}
                onPress={acceptTerms}
                disabled={!termsScrollComplete}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: termsScrollComplete ? '#FFFFFF' : '#6B7280',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  {termsScrollComplete ? 'Accept Terms' : 'Please read all terms'}
                </Text>
              </TouchableOpacity>
            </View>
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
                Booking Confirmed!
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
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>Booking confirmed for</Text>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', marginTop: 2 }}>{bookingData?.propertyName}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                  Ref: {bookingData?.bookingRef}
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Check-in</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatDate(bookingData?.checkIn)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Check-out</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatDate(bookingData?.checkOut)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Rooms</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{bookingData?.rooms}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Guests</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{bookingData?.guests}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Total</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 15, fontWeight: '700' }}>{formatCurrency(bookingData?.total)}</Text>
                </View>
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
                  "The best provision is piety." — Quran 2:197
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Booking Details Modal */}
      <Modal visible={showBookingDetailsModal} transparent animationType="fade">
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
              <TouchableOpacity onPress={() => setShowBookingDetailsModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700' }}>{selectedBooking?.listing_title || 'Property'}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Ref: {selectedBooking?.id || 'N/A'}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{selectedBooking?.listing_location || 'Location not specified'}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Check-in</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatDate(selectedBooking?.check_in)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Check-out</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatDate(selectedBooking?.check_out)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Guests</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{selectedBooking?.guests}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Total</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 15, fontWeight: '700' }}>{formatCurrency(selectedBooking?.total_price)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Status</Text>
                  <View style={{
                    backgroundColor: getStatusBadge(selectedBooking?.status).style.bg,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                    <Text style={{
                      color: getStatusBadge(selectedBooking?.status).style.text,
                      fontSize: 11,
                      fontWeight: '500',
                    }}>
                      {getStatusBadge(selectedBooking?.status).label}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(217, 119, 6, 0.04)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(217, 119, 6, 0.08)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#D97706', fontSize: 13, lineHeight: 20 }}>
                  <Text style={{ fontWeight: '600' }}>Note:</Text> Cancellations can only be processed by the property vendor. Please contact them directly if you need to cancel.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowBookingDetailsModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== PIN MODAL ===== */}
      <PinModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerify}
        loading={pinLoading}
        error={pinError}
        title="Confirm Booking"
        subtitle="Enter your 4-digit PIN to confirm this HalalStay booking"
        amount={calculateTotal() || 0}
        recipient={selectedProperty?.title || 'Property'}
        transactionType="booking"
      />

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

export default HalalStay;