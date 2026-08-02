import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const HalalStay = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('halalhub_token');
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Properties
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [locations, setLocations] = useState(['All']);
  const [propertyTypes, setPropertyTypes] = useState(['All']);
  
  // Guest Details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Agreement
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrollComplete, setTermsScrollComplete] = useState(false);
  const termsContentRef = useRef(null);
  
  // Wishlist
  const [wishlist, setWishlist] = useState([]);
  
  // Bookings
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  // ===== DYNAMIC CALCULATION =====
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!selectedProperty) return 0;
    const nights = calculateNights();
    return selectedProperty.price_per_night * rooms * nights;
  };

  const getTotalPrice = () => {
    return calculateTotal();
  };

  const getNights = () => {
    return calculateNights();
  };

  const isFullyBooked = (property) => {
    return property.available_rooms !== undefined && property.available_rooms <= 0;
  };

  const getAvailableRooms = (property) => {
    return property.available_rooms !== undefined ? property.available_rooms : property.total_rooms || 1;
  };

  const getMaxGuestsPerRoom = (property) => {
    return property.max_guests_per_room || 2;
  };

  const getMaxAllowedGuests = (property) => {
    return rooms * getMaxGuestsPerRoom(property);
  };

  // ===== AUTHENTICATION =====
  useEffect(() => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
      setGuestName(userData.fullName || '');
      setGuestEmail(userData.email || '');
      setGuestPhone(userData.phone || '');
    }
  }, []);

  // ===== FETCH DATA =====
  useEffect(() => {
    fetchProperties();
    if (isAuthenticated) {
      fetchBookings();
      fetchWishlist();
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_BASE}/client/listings`, config);
      
      const propertyData = response.data.listings || [];
      setProperties(propertyData);
      
      const uniqueLocations = ['All', ...new Set(propertyData.map(p => p.county || p.location).filter(Boolean))];
      const uniqueTypes = ['All', ...new Set(propertyData.map(p => p.type).filter(Boolean))];
      setLocations(uniqueLocations);
      setPropertyTypes(uniqueTypes);
      
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/client/bookings`, config);
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Bookings error:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      setWishlist([]);
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotifications([]);
    } catch (err) {
      console.error('Notifications error:', err);
    }
  };

  // ===== FILTER FUNCTIONS =====
  const filteredProperties = properties.filter(p => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || p.county === selectedLocation || p.location === selectedLocation;
    const matchesType = selectedType === 'All' || p.type === selectedType;
    const matchesPrice = (p.price_per_night || 0) >= priceRange[0] && (p.price_per_night || 0) <= priceRange[1];
    return matchesSearch && matchesLocation && matchesType && matchesPrice && p.is_active !== false;
  });

  // ===== WISHLIST =====
  const toggleWishlist = (propertyId) => {
    if (!isAuthenticated) {
      setError('Please sign in to save properties to your wishlist.');
      return;
    }
    if (wishlist.includes(propertyId)) {
      setWishlist(wishlist.filter(id => id !== propertyId));
    } else {
      setWishlist([...wishlist, propertyId]);
      setSuccess('Added to wishlist!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // ===== TERMS & CONDITIONS =====
  const openTermsModal = () => {
    setTermsScrollComplete(false);
    setShowTermsModal(true);
  };

  const handleTermsScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom) {
      setTermsScrollComplete(true);
    }
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

  // ===== BOOKING =====
  const handleBookNow = (property) => {
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
      const nights = getNights();
      const totalPrice = getTotalPrice();
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE}/client/bookings`, {
        listing_id: selectedProperty.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: guests,
        rooms: rooms,
        special_requests: specialRequests
      }, config);
      
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
        roomsLeft: response.data.rooms_left
      });
      
      await fetchBookings();
      await fetchProperties();
      
      setShowBookingModal(false);
      setShowSuccessModal(true);
      
      setSuccess(`Booking confirmed for ${selectedProperty.title}!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
  };

  const markNotificationRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  // ===== RENDER FUNCTIONS =====
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'confirmed': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]',
      'pending': 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      'cancelled': 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
      'completed': 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]'
    };
    const labels = {
      'confirmed': 'Confirmed',
      'pending': 'Pending',
      'cancelled': 'Cancelled',
      'completed': 'Completed'
    };
    return { style: styles[status] || styles.confirmed, label: labels[status] || status };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-[#0B342B] mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 rounded-2xl p-8 md:p-12 shadow-lg shadow-[#0B342B]/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">HalalStay</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-[13px] font-medium text-[#C9A44B]/70">Halal-Friendly Accommodation</span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Find Your Perfect Halal Stay
              </h1>
              <p className="text-white/70 text-[15px] mt-3 max-w-lg leading-relaxed">
                Discover accommodation that respects your values, privacy, and worship needs across Kenya.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <button 
                  className="relative p-2.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-[#DC2626] text-white rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              )}
              {!isAuthenticated && (
                <button 
                  className="px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 text-[15px]"
                  onClick={() => navigate('/')}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== NOTIFICATIONS DROPDOWN ===== */}
      {showNotifications && isAuthenticated && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6">
          <div className="absolute right-0 mt-2 w-80 max-h-64 overflow-y-auto bg-white rounded-xl border border-[#E8EEF4] shadow-lg">
            <div className="p-3 border-b border-[#F4F5F1]">
              <span className="text-[15px] font-semibold text-[#1F2937]">Notifications</span>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-[14px] text-[#6B7280]">No notifications</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-3 border-b border-[#F4F5F1] cursor-pointer hover:bg-[#FAFAF7] transition-colors ${!n.read ? 'bg-[#FAFAF7]' : ''}`}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <p className="text-[14px] text-[#1F2937]">{n.message}</p>
                  <span className="text-[12px] text-[#6B7280]">Just now</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {error && (
          <div className="mb-6 p-4 bg-white border border-[#DC2626]/20 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <span className="text-[15px] text-[#DC2626]">{error}</span>
            <button 
              className="px-5 py-2 bg-[#DC2626] text-white text-[13px] font-medium rounded-xl hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ===== SEARCH SECTION ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Search</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2.5 pl-9 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Location</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white appearance-none"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Property Type</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white appearance-none"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Guests</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                value={guests}
                onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Check-in</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Check-out</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Number of Rooms</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                value={rooms}
                onChange={(e) => setRooms(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Max Price</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="flex-1 accent-[#0B342B] cursor-pointer"
                />
                <span className="text-[15px] font-semibold text-[#0B342B] min-w-[70px]">{formatCurrency(priceRange[1])}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#F4F5F1] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[15px] text-[#6B7280]">{filteredProperties.length} properties found</span>
            {checkIn && checkOut && (
              <span className="text-[15px] font-semibold text-[#0B342B]">
                {getNights()} nights
              </span>
            )}
          </div>
        </div>

        {/* ===== PROPERTIES GRID ===== */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-16 text-center">
            <p className="text-[15px] text-[#6B7280]">No properties found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {filteredProperties.map((property) => {
              const fullyBooked = isFullyBooked(property);
              const availableRooms = getAvailableRooms(property);
              const maxGuestsPerRoom = getMaxGuestsPerRoom(property);
              return (
                <div 
                  key={property.id} 
                  className={`bg-white rounded-xl border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group ${fullyBooked ? 'opacity-75' : ''}`}
                >
                  <div 
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${property.images?.[0] || 'https://via.placeholder.com/400x300/0B342B/fff?text=HalalStay'})` }}
                  >
                    <button
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                      onClick={() => toggleWishlist(property.id)}
                    >
                      <svg className={`w-5 h-5 ${wishlist.includes(property.id) ? 'fill-[#DC2626] text-[#DC2626]' : 'text-[#6B7280]'}`} fill={wishlist.includes(property.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                      <span className="text-[12px] font-medium px-2 py-1 rounded-full bg-[#D1FAE5] text-[#3FAF73] border border-[#A7F3D0]">
                        Halal-Friendly
                      </span>
                      {fullyBooked && (
                        <span className="text-[12px] font-medium px-2 py-1 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
                          Fully Booked
                        </span>
                      )}
                    </div>
                    {!fullyBooked && availableRooms <= 3 && (
                      <span className="absolute bottom-3 right-3 text-[12px] font-medium px-2 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                        {availableRooms} room{availableRooms > 1 ? 's' : ''} left
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-[#1F2937] group-hover:text-[#0B342B] transition-colors text-[15px]">{property.title}</h3>
                        <p className="text-[14px] text-[#6B7280] flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {property.location || property.county}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-[15px] font-semibold text-[#0B342B]">{formatCurrency(property.price_per_night)}</div>
                        <div className="text-[13px] text-[#6B7280]">per night</div>
                      </div>
                    </div>

                    <p className="text-[14px] text-[#6B7280] mt-2 line-clamp-2">{property.description}</p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {property.amenities?.slice(0, 3).map((amenity, i) => (
                        <span key={i} className="text-[12px] px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                          {amenity}
                        </span>
                      ))}
                      {(property.amenities?.length || 0) > 3 && (
                        <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                          +{(property.amenities?.length || 0) - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-[13px] text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {property.max_guests} guests
                      </span>
                      <span>Max {maxGuestsPerRoom} guests/room</span>
                      {property.min_stay > 1 && (
                        <span className="text-[#D97706]">Min {property.min_stay} nights</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-[#F4F5F1]">
                      <div className="flex items-center gap-1 text-[14px]">
                        <svg className="w-4 h-4 fill-current text-[#C9A44B]" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold text-[#1F2937]">{property.rating || 'New'}</span>
                        {property.total_reviews > 0 && (
                          <span className="text-[#6B7280]">({property.total_reviews})</span>
                        )}
                      </div>
                      <button
                        className={`px-4 py-1.5 text-[14px] font-medium rounded-xl transition-all duration-200 ${
                          fullyBooked || !property.is_active
                            ? 'bg-[#F4F5F1] text-[#6B7280] cursor-not-allowed'
                            : 'bg-[#0B342B] text-white hover:bg-[#032A24] shadow-sm'
                        }`}
                        onClick={() => handleBookNow(property)}
                        disabled={fullyBooked || !property.is_active}
                      >
                        {fullyBooked ? 'Fully Booked' : property.is_active ? 'Book Now' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== BOOKINGS SECTION ===== */}
        {isAuthenticated && (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h3 className="text-[17px] font-semibold text-[#1F2937]">My Bookings</h3>
              <button 
                className="text-[13px] text-[#0B342B] hover:text-[#032A24] transition-colors font-medium"
                onClick={fetchBookings}
              >
                Refresh
              </button>
            </div>

            {loadingBookings ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-8 h-8 border-3 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[15px] text-[#6B7280]">No bookings yet. Start your first HalalStay!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const status = getStatusBadge(booking.status);
                  return (
                    <div 
                      key={booking.id} 
                      className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FAFAF7] rounded-xl border border-[#E8EEF4] cursor-pointer hover:bg-[#F4F5F1] transition-colors"
                      onClick={() => viewBookingDetails(booking)}
                    >
                      <div>
                        <div className="font-semibold text-[15px] text-[#1F2937]">{booking.listing_title || 'Property'}</div>
                        <div className="text-[14px] text-[#6B7280] flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                        </div>
                        <div className="text-[14px] text-[#6B7280]">
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {booking.guests} guests
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#0B342B]">{formatCurrency(booking.total_price)}</div>
                        <span className={`text-[12px] px-2 py-0.5 rounded-full border font-medium ${status.style}`}>
                          {status.label}
                        </span>
                        <div className="text-[13px] text-[#6B7280] mt-1">
                          {booking.payment_status === 'completed' ? 'Paid' : 'Pending Payment'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== BOOKING MODAL ===== */}
      {showBookingModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Confirm Booking</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={() => setShowBookingModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <div className="font-semibold text-[17px] text-[#1F2937]">{selectedProperty.title}</div>
                <div className="text-[14px] text-[#6B7280] flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedProperty.location || selectedProperty.county}
                </div>
                {selectedProperty.available_rooms !== undefined && (
                  <div className="text-[14px] mt-1">
                    <span className={`font-semibold ${selectedProperty.available_rooms <= 3 ? 'text-[#D97706]' : 'text-[#3FAF73]'}`}>
                      {selectedProperty.available_rooms} room{selectedProperty.available_rooms > 1 ? 's' : ''} available
                    </span>
                    <span className="text-[#6B7280] text-[13px] ml-2">
                      (Max {selectedProperty.max_guests_per_room || 2} guests per room)
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Check-in</span>
                  <span className="font-semibold text-[#1F2937]">{formatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Check-out</span>
                  <span className="font-semibold text-[#1F2937]">{formatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Nights</span>
                  <span className="font-semibold text-[#1F2937]">{getNights()}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Rooms</span>
                  <span className="font-semibold text-[#1F2937]">{rooms}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Guests</span>
                  <span className="font-semibold text-[#1F2937]">{guests}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Max Guests Allowed</span>
                  <span className="font-semibold text-[#1F2937]">{rooms * getMaxGuestsPerRoom(selectedProperty)}</span>
                </div>
                {selectedProperty.min_stay > 1 && (
                  <div className="flex justify-between text-[15px] text-[#D97706]">
                    <span>Minimum Stay</span>
                    <span className="font-semibold">{selectedProperty.min_stay} night{selectedProperty.min_stay > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                <h4 className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wider">Guest Details</h4>
                <div>
                  <label className="text-[13px] text-[#6B7280] block">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] bg-white transition-all duration-200"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#6B7280] block">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] bg-white transition-all duration-200"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#6B7280] block">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] bg-white transition-all duration-200"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#6B7280] block">Special Requests (Optional)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] bg-white transition-all duration-200 resize-y"
                    rows="2"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests?"
                  />
                </div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Price per night</span>
                  <span className="font-semibold text-[#1F2937]">{formatCurrency(selectedProperty.price_per_night)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Rooms</span>
                  <span className="font-semibold text-[#1F2937]">× {rooms}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Nights</span>
                  <span className="font-semibold text-[#1F2937]">× {getNights()}</span>
                </div>
                <div className="flex justify-between text-[17px] font-semibold pt-2 border-t border-[#E8EEF4]">
                  <span className="text-[#1F2937]">Total</span>
                  <span className="text-[#0B342B]">{formatCurrency(getTotalPrice())}</span>
                </div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="termsAgreement"
                    className="mt-1 w-4 h-4 rounded border-[#E8EEF4] text-[#0B342B] focus:ring-[#0B342B]/20"
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted(!termsAccepted)}
                  />
                  <div>
                    <label htmlFor="termsAgreement" className="text-[15px] text-[#1F2937] font-medium cursor-pointer">
                      I agree to the Terms & Conditions
                    </label>
                    <button 
                      className="block text-[13px] text-[#0B342B] hover:text-[#032A24] transition-colors mt-1 font-medium"
                      onClick={openTermsModal}
                    >
                      Read Full Terms & Conditions
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className="text-[15px] text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                onClick={confirmBooking}
                disabled={processing || !termsAccepted || !guestName || !guestEmail || !guestPhone}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TERMS & CONDITIONS MODAL ===== */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Terms & Conditions</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={() => setShowTermsModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto" ref={termsContentRef} onScroll={handleTermsScroll}>
              <div className="space-y-4">
                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-2">1. HalalStay Platform Terms</h4>
                  <p className="text-[15px] text-[#6B7280] leading-relaxed">
                    HalalStay is a platform for halal-friendly accommodation. By using this platform, you agree to:
                  </p>
                  <ul className="text-[15px] text-[#6B7280] list-disc pl-5 mt-2 space-y-1">
                    <li>Only book accommodation that aligns with Islamic values</li>
                    <li>Respect the privacy and property of hosts and guests</li>
                    <li>Provide accurate and truthful information</li>
                    <li>Maintain Islamic etiquette in all interactions</li>
                  </ul>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-2">2. Property Terms & Conditions</h4>
                  <p className="text-[15px] text-[#6B7280] leading-relaxed">
                    Each property has specific rules. Please review them carefully.
                  </p>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-2">3. Cancellation & Refund Policy</h4>
                  <p className="text-[15px] text-[#6B7280] leading-relaxed">
                    Cancellations must be made by the vendor. Guests cannot cancel bookings directly.
                  </p>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-2">4. Guest Responsibilities</h4>
                  <ul className="text-[15px] text-[#6B7280] list-disc pl-5 space-y-1">
                    <li>Respect the property and its contents</li>
                    <li>Follow all property rules and guidelines</li>
                    <li>Provide accurate guest information</li>
                    <li>Respect other guests and residents</li>
                    <li>Maintain halal conduct at all times</li>
                    <li>No alcohol, pork, or prohibited activities</li>
                  </ul>
                </div>
              </div>

              {!termsScrollComplete && (
                <div className="text-center text-[15px] text-[#C9A44B] font-semibold animate-pulse">
                  Scroll to the bottom to accept
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowTermsModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`flex-[2] px-6 py-3 font-medium rounded-xl transition-all duration-200 ${
                  termsScrollComplete 
                    ? 'bg-[#0B342B] text-white hover:bg-[#032A24] shadow-md shadow-[#0B342B]/20' 
                    : 'bg-[#F4F5F1] text-[#6B7280] cursor-not-allowed'
                }`}
                onClick={acceptTerms}
                disabled={!termsScrollComplete}
              >
                {termsScrollComplete ? 'Accept Terms & Conditions' : 'Please read all terms'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccessModal && bookingData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] bg-[#0B342B] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-[22px] font-semibold text-white">Booking Confirmed!</h3>
                <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowSuccessModal(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto border-4 border-[#0B342B]/20">
                <svg className="w-10 h-10 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <div className="text-[15px] text-[#6B7280]">Booking confirmed for</div>
                <div className="text-[22px] font-bold text-[#1F2937]">{bookingData.propertyName}</div>
                <div className="text-[14px] font-mono text-[#6B7280] mt-1">Ref: {bookingData.bookingRef}</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 text-left space-y-2 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Check-in</span>
                  <span className="font-semibold text-[#1F2937]">{formatDate(bookingData.checkIn)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Check-out</span>
                  <span className="font-semibold text-[#1F2937]">{formatDate(bookingData.checkOut)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Rooms</span>
                  <span className="font-semibold text-[#1F2937]">{bookingData.rooms}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Guests</span>
                  <span className="font-semibold text-[#1F2937]">{bookingData.guests}</span>
                </div>
                <div className="flex justify-between text-[17px] font-semibold pt-2 border-t border-[#E8EEF4]">
                  <span className="text-[#1F2937]">Total</span>
                  <span className="text-[#0B342B]">{formatCurrency(bookingData.total)}</span>
                </div>
                {bookingData.roomsLeft !== undefined && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Rooms Left</span>
                    <span className="font-semibold text-[#1F2937]">{bookingData.roomsLeft}</span>
                  </div>
                )}
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] italic leading-relaxed">
                  "The best provision is piety." — Quran 2:197
                </p>
              </div>

              <button 
                className="w-full px-5 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
                onClick={() => setShowSuccessModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BOOKING DETAILS MODAL ===== */}
      {showBookingDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Booking Details</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={() => setShowBookingDetailsModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <div className="font-semibold text-[17px] text-[#1F2937]">{selectedBooking.listing_title || 'Property'}</div>
                <div className="text-[14px] text-[#6B7280]">Ref: {selectedBooking.id || 'N/A'}</div>
                <div className="text-[14px] text-[#6B7280] flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedBooking.listing_location || 'Location not specified'}
                </div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Check-in</span>
                  <span className="font-semibold text-[#1F2937]">{formatDate(selectedBooking.check_in)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Check-out</span>
                  <span className="font-semibold text-[#1F2937]">{formatDate(selectedBooking.check_out)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Guests</span>
                  <span className="font-semibold text-[#1F2937]">{selectedBooking.guests}</span>
                </div>
                <div className="flex justify-between text-[17px] font-semibold pt-2 border-t border-[#E8EEF4]">
                  <span className="text-[#1F2937]">Total</span>
                  <span className="text-[#0B342B]">{formatCurrency(selectedBooking.total_price)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Status</span>
                  <span className={`text-[12px] px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(selectedBooking.status).style}`}>
                    {getStatusBadge(selectedBooking.status).label}
                  </span>
                </div>
                {selectedBooking.special_requests && (
                  <div className="flex justify-between text-[15px] pt-2 border-t border-[#E8EEF4]">
                    <span className="text-[#6B7280]">Special Requests</span>
                    <span className="font-semibold text-[#1F2937] text-right max-w-[60%]">{selectedBooking.special_requests}</span>
                  </div>
                )}
              </div>

              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3 text-[15px] text-[#D97706]">
                <strong>Note:</strong> Cancellations can only be processed by the property vendor. Please contact them directly if you need to cancel.
              </div>

              <button 
                className="w-full px-5 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
                onClick={() => setShowBookingDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS TOAST ===== */}
      {success && (
        <div className="fixed top-6 right-6 z-50 bg-[#0B342B] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#0B342B]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-[#C9A44B]/20">
          <svg className="w-5 h-5 text-[#C9A44B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[15px] font-medium">{success}</span>
          <button 
            className="text-white/60 hover:text-white transition ml-2 flex-shrink-0"
            onClick={() => setSuccess('')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default HalalStay;