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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { clientService } from '../../api/client';

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

    setSelectedProperty(property);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    setProcessing(true);
    setError('');
    try {
      const nights = calculateNights();
      const totalPrice = calculateTotal();

      const response = await clientService.createBooking({
        listing_id: selectedProperty.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: guests,
        rooms: rooms,
        special_requests: specialRequests,
      });

      const bookingRef = response.data.bookingId || `HS-${Date.now().toString().slice(-8)}`;

      setBookingData({
        bookingRef,
        propertyName: selectedProperty.title,
        propertyLocation: selectedProperty.location || selectedProperty.county,
        checkIn,
        checkOut,
        nights,
        guests,
        rooms,
        total: totalPrice,
        property: selectedProperty,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        agreementAccepted: termsAccepted,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        roomsLeft: response.data.rooms_left,
      });

      await fetchBookings();
      await fetchProperties();

      setShowBookingModal(false);
      setShowSuccessModal(true);

      setSuccess(`Booking confirmed for ${selectedProperty.title}!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
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
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading properties...</Text>
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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    HalalStay
                  </Text>
                  <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                  <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>
                    Halal-Friendly Accommodation
                  </Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>Find Your Perfect Halal Stay</Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 4, maxWidth: 400, lineHeight: 20 }}>
                  Discover accommodation that respects your values, privacy, and worship needs across Kenya.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {!isAuthenticated && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}
                    onPress={() => navigation.navigate('Auth' as never)}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>Sign In</Text>
                  </TouchableOpacity>
                )}
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

          {/* Search Section */}
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
                    paddingLeft: 36,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name or location..."
                />
              </View>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Location
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
                    value={selectedLocation}
                    onChangeText={(text) => setSelectedLocation(text)}
                    placeholder="All"
                  />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Property Type
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
                    value={selectedType}
                    onChangeText={(text) => setSelectedType(text)}
                    placeholder="All"
                  />
                </View>
              </View>
              <View style={{ flex: 0.7, minWidth: 80 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Guests
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
                  value={String(guests)}
                  onChangeText={(text) => setGuests(Math.max(1, parseInt(text) || 1))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1, minWidth: 120 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Check-in
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
                  value={checkIn}
                  onChangeText={setCheckIn}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1, minWidth: 120 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Check-out
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
                  value={checkOut}
                  onChangeText={setCheckOut}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 0.7, minWidth: 80 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Rooms
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
                  value={String(rooms)}
                  onChangeText={(text) => setRooms(Math.max(1, parseInt(text) || 1))}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Max Price
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={String(priceRange[1])}
                    onChangeText={(text) => setPriceRange([priceRange[0], parseInt(text) || 0])}
                    keyboardType="numeric"
                  />
                  <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '600' }}>{formatCurrency(priceRange[1])}</Text>
                </View>
              </View>
            </View>

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
              <Text style={{ color: '#6B7280', fontSize: 14 }}>{filteredProperties.length} properties found</Text>
              {checkIn && checkOut ? (
                <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '600' }}>
                  {calculateNights()} nights
                </Text>
              ) : null}
            </View>
          </View>

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E8EEF4',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>No properties found. Try adjusting your filters.</Text>
            </View>
          ) : (
            filteredProperties.map((property) => {
              const fullyBooked = isFullyBooked(property);
              const availableRooms = getAvailableRooms(property);
              const maxGuestsPerRoom = getMaxGuestsPerRoom(property);
              const isInWishlist = wishlist.includes(property.id);

              return (
                <View key={property.id} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                  opacity: fullyBooked ? 0.7 : 1,
                }}>
                  <Image
                    source={{ uri: property.images?.[0] || 'https://via.placeholder.com/400x300/0B342B/fff?text=HalalStay' }}
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{property.title}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 14 }}>{property.location || property.county}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>{formatCurrency(property.price_per_night)}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 12 }}>per night</Text>
                      </View>
                    </View>

                    <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }} numberOfLines={2}>
                      {property.description}
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {(property.amenities || []).slice(0, 3).map((amenity: string, i: number) => (
                        <View key={i} style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>{amenity}</Text>
                        </View>
                      ))}
                      {(property.amenities || []).length > 3 && (
                        <View style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>+{(property.amenities || []).length - 3}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>{property.max_guests} guests</Text>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>Max {maxGuestsPerRoom} guests/room</Text>
                      {property.min_stay > 1 && (
                        <Text style={{ color: '#D97706', fontSize: 13 }}>Min {property.min_stay} nights</Text>
                      )}
                    </View>

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: '#F4F5F1',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: '#C9A44B', fontSize: 14 }}>★</Text>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{property.rating || 'New'}</Text>
                        {property.total_reviews > 0 && (
                          <Text style={{ color: '#6B7280', fontSize: 14 }}>({property.total_reviews})</Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => toggleWishlist(property.id)}>
                          <Text style={{ fontSize: 20, color: isInWishlist ? '#DC2626' : '#6B7280' }}>
                            {isInWishlist ? '❤️' : '🤍'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: (fullyBooked || !property.is_active) ? '#F4F5F1' : '#0B342B',
                            opacity: (fullyBooked || !property.is_active) ? 0.6 : 1,
                            shadowColor: (fullyBooked || !property.is_active) ? 'transparent' : '#0B342B',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: (fullyBooked || !property.is_active) ? 0 : 0.2,
                            shadowRadius: 8,
                            elevation: (fullyBooked || !property.is_active) ? 0 : 4,
                          }}
                          onPress={() => handleBookNow(property)}
                          disabled={fullyBooked || !property.is_active}
                        >
                          <Text style={{
                            color: (fullyBooked || !property.is_active) ? '#6B7280' : '#FFFFFF',
                            fontSize: 13,
                            fontWeight: '600',
                          }}>
                            {fullyBooked ? 'Fully Booked' : property.is_active ? 'Book Now' : 'Unavailable'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* My Bookings */}
          {isAuthenticated && (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: '#E8EEF4',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>My Bookings</Text>
                <TouchableOpacity onPress={fetchBookings}>
                  <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>Refresh</Text>
                </TouchableOpacity>
              </View>

              {loadingBookings ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color="#C9A44B" />
                </View>
              ) : bookings.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>No bookings yet. Start your first HalalStay!</Text>
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
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        marginBottom: 6,
                      }}
                      onPress={() => viewBookingDetails(booking)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                            {booking.listing_title || 'Property'}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>
                            {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>{booking.guests} guests</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>
                            {formatCurrency(booking.total_price)}
                          </Text>
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
                          <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>
                            {booking.payment_status === 'completed' ? 'Paid' : 'Pending Payment'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
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
            maxWidth: 500,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Confirm Booking</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{selectedProperty?.title}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>{selectedProperty?.location || selectedProperty?.county}</Text>
                {selectedProperty?.available_rooms !== undefined && (
                  <Text style={{ color: selectedProperty.available_rooms <= 3 ? '#D97706' : '#3FAF73', fontSize: 14, marginTop: 2 }}>
                    {selectedProperty.available_rooms} room{selectedProperty.available_rooms > 1 ? 's' : ''} available
                    <Text style={{ color: '#6B7280', fontSize: 13 }}> (Max {selectedProperty.max_guests_per_room || 2} guests per room)</Text>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Check-in</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatDate(checkIn)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Check-out</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatDate(checkOut)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Nights</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{calculateNights()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Rooms</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{rooms}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Guests</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{guests}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Max Guests Allowed</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {rooms * (selectedProperty?.max_guests_per_room || 2)}
                  </Text>
                </View>
                {selectedProperty?.min_stay > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#D97706', fontSize: 14 }}>Minimum Stay</Text>
                    <Text style={{ color: '#D97706', fontSize: 14, fontWeight: '600' }}>
                      {selectedProperty.min_stay} night{selectedProperty.min_stay > 1 ? 's' : ''}
                    </Text>
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
                <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Guest Details
                </Text>
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Full Name</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={guestName}
                    onChangeText={setGuestName}
                    placeholder="Enter your full name"
                  />
                </View>
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Email</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={guestEmail}
                    onChangeText={setGuestEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Phone</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={guestPhone}
                    onChangeText={setGuestPhone}
                    placeholder="Enter your phone number"
                  />
                </View>
                <View>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Special Requests (Optional)</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: '#1F2937',
                      fontSize: 14,
                      minHeight: 50,
                      textAlignVertical: 'top',
                    }}
                    value={specialRequests}
                    onChangeText={setSpecialRequests}
                    placeholder="Any special requests?"
                    multiline
                  />
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
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Price per night</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatCurrency(selectedProperty?.price_per_night)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Rooms</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>× {rooms}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Nights</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>× {calculateNights()}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: '#E8EEF4',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>Total</Text>
                  <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>{formatCurrency(calculateTotal())}</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <TouchableOpacity
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: termsAccepted ? '#0B342B' : '#E8EEF4',
                      backgroundColor: termsAccepted ? '#0B342B' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    {termsAccepted && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </TouchableOpacity>
                  <View>
                    <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)}>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>
                        I agree to the Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openTermsModal}>
                      <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500', marginTop: 2 }}>
                        Read Full Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}

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
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: (processing || !termsAccepted || !guestName || !guestEmail || !guestPhone) ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={confirmBooking}
                  disabled={processing || !termsAccepted || !guestName || !guestEmail || !guestPhone}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Confirm Booking</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={showTermsModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
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
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>1. HalalStay Platform Terms</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    HalalStay is a platform for halal-friendly accommodation. By using this platform, you agree to:
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20, marginTop: 4 }}>
                    • Only book accommodation that aligns with Islamic values{'\n'}
                    • Respect the privacy and property of hosts and guests{'\n'}
                    • Provide accurate and truthful information{'\n'}
                    • Maintain Islamic etiquette in all interactions
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>2. Property Terms & Conditions</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    Each property has specific rules. Please review them carefully.
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>3. Cancellation & Refund Policy</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    Cancellations must be made by the vendor. Guests cannot cancel bookings directly.
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>4. Guest Responsibilities</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
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
                  <Text style={{ color: '#C9A44B', fontSize: 14, fontWeight: '600' }}>Scroll to the bottom to accept</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#F4F5F1',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: termsScrollComplete ? '#0B342B' : '#F4F5F1',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: termsScrollComplete ? 1 : 0.6,
                }}
                onPress={acceptTerms}
                disabled={!termsScrollComplete}
              >
                <Text style={{
                  color: termsScrollComplete ? '#FFFFFF' : '#6B7280',
                  fontSize: 15,
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
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Booking Confirmed!</Text>
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
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>Booking confirmed for</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 2 }}>{bookingData?.propertyName}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                  Ref: {bookingData?.bookingRef}
                </Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Check-in</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatDate(bookingData?.checkIn)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Check-out</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatDate(bookingData?.checkOut)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Rooms</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{bookingData?.rooms}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Guests</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{bookingData?.guests}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: '#E8EEF4',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>Total</Text>
                  <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>{formatCurrency(bookingData?.total)}</Text>
                </View>
                {bookingData?.roomsLeft !== undefined && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Rooms Left</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{bookingData.roomsLeft}</Text>
                  </View>
                )}
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 }}>
                  "The best provision is piety." — Quran 2:197
                </Text>
              </View>

              <TouchableOpacity
                style={{
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
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Booking Details Modal */}
      <Modal visible={showBookingDetailsModal} transparent animationType="fade">
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
              <TouchableOpacity onPress={() => setShowBookingDetailsModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{selectedBooking?.listing_title || 'Property'}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Ref: {selectedBooking?.id || 'N/A'}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>{selectedBooking?.listing_location || 'Location not specified'}</Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Check-in</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatDate(selectedBooking?.check_in)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Check-out</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatDate(selectedBooking?.check_out)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Guests</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedBooking?.guests}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: '#E8EEF4',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>Total</Text>
                  <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>{formatCurrency(selectedBooking?.total_price)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Status</Text>
                  <View style={{
                    backgroundColor: getStatusBadge(selectedBooking?.status).style.bg,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.05)',
                  }}>
                    <Text style={{
                      color: getStatusBadge(selectedBooking?.status).style.text,
                      fontSize: 12,
                      fontWeight: '500',
                    }}>
                      {getStatusBadge(selectedBooking?.status).label}
                    </Text>
                  </View>
                </View>
                {selectedBooking?.special_requests && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#E8EEF4',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Special Requests</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                      {selectedBooking.special_requests}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{
                backgroundColor: '#FEF3C7',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#FDE68A',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#D97706', fontSize: 14, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '600' }}>Note:</Text> Cancellations can only be processed by the property vendor. Please contact them directly if you need to cancel.
                </Text>
              </View>

              <TouchableOpacity
                style={{
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
                onPress={() => setShowBookingDetailsModal(false)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
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

export default HalalStay;