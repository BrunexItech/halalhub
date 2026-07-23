import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const HalalStay = () => {
  const navigate = useNavigate();
  
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
  const [agreementVersion, setAgreementVersion] = useState('v1.0');
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
      const mockProperties = [
        {
          id: 1,
          name: 'Al-Firdaus Apartment',
          location: 'Nairobi',
          type: 'Apartment',
          price: 4500,
          rating: 4.8,
          reviews: 234,
          amenities: ['WiFi', 'Kitchen', 'Parking', 'Halal Food'],
          description: 'Luxury apartment with halal kitchen facilities',
          available: true,
          host: 'Ahmed Mohammed',
          bedrooms: 2,
          bathrooms: 2,
          maxGuests: 4,
          halalFeatures: ['Qibla direction', 'Prayer mat available', 'Nearby mosque'],
          checkInTime: '2:00 PM',
          checkOutTime: '11:00 AM',
          cancellationPolicy: 'Free cancellation up to 7 days before check-in. 50% refund up to 3 days before.'
        },
        {
          id: 2,
          name: 'Zam-Zam Guest House',
          location: 'Mombasa',
          type: 'Guest House',
          price: 2800,
          rating: 4.6,
          reviews: 189,
          amenities: ['WiFi', 'Breakfast', 'Airport Transfer'],
          description: 'Cozy guest house near the beach with halal meals',
          available: true,
          host: 'Fatima Hassan',
          bedrooms: 1,
          bathrooms: 1,
          maxGuests: 2,
          halalFeatures: ['Halal breakfast', 'Alcohol-free', 'Family-friendly'],
          checkInTime: '1:00 PM',
          checkOutTime: '10:00 AM',
          cancellationPolicy: 'Free cancellation up to 3 days before check-in.'
        },
        {
          id: 3,
          name: 'Madinah Suites',
          location: 'Nairobi',
          type: 'Serviced Suite',
          price: 7200,
          rating: 4.9,
          reviews: 312,
          amenities: ['WiFi', 'Kitchen', 'Gym', 'Pool', 'Halal Food'],
          description: 'Premium suites with 5-star amenities and halal dining',
          available: true,
          host: 'Abdullah Omar',
          bedrooms: 3,
          bathrooms: 2,
          maxGuests: 6,
          halalFeatures: ['Qibla direction', 'Prayer area', 'Halal restaurant'],
          checkInTime: '3:00 PM',
          checkOutTime: '12:00 PM',
          cancellationPolicy: 'Free cancellation up to 14 days before check-in.'
        },
        {
          id: 4,
          name: 'Kakamega Halal Lodge',
          location: 'Kakamega',
          type: 'Lodge',
          price: 3200,
          rating: 4.5,
          reviews: 156,
          amenities: ['WiFi', 'Fireplace', 'Nature Trails'],
          description: 'Rustic lodge in the heart of Kakamega Forest',
          available: true,
          host: 'Khadija Osman',
          bedrooms: 2,
          bathrooms: 1,
          maxGuests: 4,
          halalFeatures: ['Privacy', 'Halal meals available', 'Peaceful environment'],
          checkInTime: '2:00 PM',
          checkOutTime: '10:30 AM',
          cancellationPolicy: 'Free cancellation up to 5 days before check-in.'
        },
        {
          id: 5,
          name: 'Diani Beach Resort',
          location: 'Mombasa',
          type: 'Resort',
          price: 8500,
          rating: 4.9,
          reviews: 423,
          amenities: ['WiFi', 'Pool', 'Spa', 'Halal Food', 'Beach Access'],
          description: 'Luxury beachfront resort with halal dining and spa',
          available: true,
          host: 'Rashid Juma',
          bedrooms: 4,
          bathrooms: 3,
          maxGuests: 8,
          halalFeatures: ['Halal dining', 'Prayer area', 'Alcohol-free', 'Qibla direction'],
          checkInTime: '2:00 PM',
          checkOutTime: '11:00 AM',
          cancellationPolicy: 'Free cancellation up to 14 days before check-in.'
        }
      ];
      
      setProperties(mockProperties);
      
      const uniqueLocations = ['All', ...new Set(mockProperties.map(p => p.location))];
      const uniqueTypes = ['All', ...new Set(mockProperties.map(p => p.type))];
      setLocations(uniqueLocations);
      setPropertyTypes(uniqueTypes);
      
    } catch (err) {
      setError('Failed to load properties. Please refresh.');
      console.error('Properties error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      setBookings([
        { 
          id: 1, 
          property: 'Al-Firdaus Apartment', 
          checkIn: '2024-05-15', 
          checkOut: '2024-05-18', 
          guests: 2, 
          total: 13500, 
          status: 'confirmed',
          bookingRef: 'HS-20240515-001',
          agreementAccepted: true,
          agreementVersion: 'v1.0'
        },
        { 
          id: 2, 
          property: 'Diani Beach Resort', 
          checkIn: '2024-06-01', 
          checkOut: '2024-06-05', 
          guests: 4, 
          total: 34000, 
          status: 'confirmed',
          bookingRef: 'HS-20240601-002',
          agreementAccepted: true,
          agreementVersion: 'v1.0'
        }
      ]);
    } catch (err) {
      console.error('Bookings error:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      setWishlist([1, 3, 5]);
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotifications([
        { id: 1, message: 'Welcome to HalalStay! Book your first halal-friendly stay today.', type: 'info', read: false },
        { id: 2, message: 'Diani Beach Resort is now available for booking.', type: 'info', read: false }
      ]);
    } catch (err) {
      console.error('Notifications error:', err);
    }
  };

  // ===== FILTER FUNCTIONS =====
  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || p.location === selectedLocation;
    const matchesType = selectedType === 'All' || p.type === selectedType;
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    return matchesSearch && matchesLocation && matchesType && matchesPrice && p.available;
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
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates.');
      return;
    }
    if (!guestName || !guestEmail || !guestPhone) {
      setError('Please fill in all guest details.');
      return;
    }
    setSelectedProperty(property);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    setProcessing(true);
    setError('');
    try {
      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
      const subtotal = selectedProperty.price * guests * nights;
      const tax = subtotal * 0.16;
      const total = subtotal + tax;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const bookingRef = `HS-${Date.now().toString().slice(-8)}`;
      
      setBookingData({
        bookingRef,
        propertyName: selectedProperty.name,
        propertyLocation: selectedProperty.location,
        checkIn,
        checkOut,
        nights,
        guests,
        subtotal,
        tax,
        total,
        property: selectedProperty,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        agreementAccepted: termsAccepted,
        agreementVersion,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
      
      // Create booking
      const newBooking = {
        id: Date.now(),
        property: selectedProperty.name,
        checkIn,
        checkOut,
        guests,
        total,
        status: 'confirmed',
        bookingRef,
        agreementAccepted: true,
        agreementVersion
      };
      setBookings([newBooking, ...bookings]);
      
      // Create notification
      const newNotification = {
        id: Date.now(),
        message: `Booking confirmed for ${selectedProperty.name}. Reference: ${bookingRef}`,
        type: 'success',
        read: false
      };
      setNotifications([newNotification, ...notifications]);
      
      setShowBookingModal(false);
      setShowSuccessModal(true);
      
      setSuccess(`Booking confirmed for ${selectedProperty.name}!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
  };

  const cancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.filter(b => b.id !== bookingId));
      setSuccess('Booking cancelled successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }
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
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'cancelled': 'bg-red-50 text-red-700 border-red-200',
      'completed': 'bg-blue-50 text-blue-700 border-blue-200'
    };
    const labels = {
      'confirmed': 'Confirmed',
      'pending': 'Pending',
      'cancelled': 'Cancelled',
      'completed': 'Completed'
    };
    return { style: styles[status] || styles.confirmed, label: labels[status] || status };
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 p-8 md:p-12 shadow-lg shadow-[#1769AA]/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">HalalStay</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Halal-Friendly Accommodation</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Find Your Perfect Halal Stay
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Discover accommodation that respects your values, privacy, and worship needs across Kenya.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <button 
                  className="relative p-2 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <span className="text-white/70 text-sm">🔔</span>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-[#DC2626] text-white rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              )}
              {!isAuthenticated && (
                <button 
                  className="px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
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
        <div className="absolute right-4 md:right-8 mt-2 w-80 max-h-64 overflow-y-auto bg-white rounded-xl border border-[#E8EEF4] shadow-lg z-20">
          <div className="p-3 border-b border-[#F1F7FC]">
            <span className="text-sm font-bold text-[#1A2A3A]">Notifications</span>
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-[#94A3B8]">No notifications</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-3 border-b border-[#F1F7FC] cursor-pointer hover:bg-[#F8FAFC] transition-colors ${!n.read ? 'bg-[#F1F7FC]' : ''}`}
                onClick={() => markNotificationRead(n.id)}
              >
                <p className="text-sm text-[#1A2A3A]">{n.message}</p>
                <span className="text-xs text-[#94A3B8]">Just now</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* ===== ERROR ===== */}
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

        {/* ===== SEARCH SECTION ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Search</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Location</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Property Type</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Guests</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={guests}
                onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Check-in</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Check-out</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Max Price: {formatCurrency(priceRange[1])}</label>
              <input
                type="range"
                min="0"
                max="15000"
                step="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-[#1769AA] cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#F1F7FC] flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-[#94A3B8]">{filteredProperties.length} properties found</span>
            {checkIn && checkOut && (
              <span className="text-sm font-semibold text-[#1769AA]">
                {Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))} nights
              </span>
            )}
          </div>
        </div>

        {/* ===== PROPERTIES GRID ===== */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-12 text-center">
            <p className="text-sm text-[#94A3B8]">No properties found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredProperties.map((property) => (
              <div 
                key={property.id} 
                className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-[#1769AA]/10 to-[#2F80C0]/10 flex items-center justify-center relative">
                  <span className="text-6xl opacity-30">🏠</span>
                  <button
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={() => toggleWishlist(property.id)}
                  >
                    <span className={`text-lg ${wishlist.includes(property.id) ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>
                      {wishlist.includes(property.id) ? '♥' : '♡'}
                    </span>
                  </button>
                  <span className="absolute bottom-3 left-3 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Halal-Friendly
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#1A2A3A]">{property.name}</h3>
                      <p className="text-sm text-[#94A3B8]">{property.location}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#1769AA]">{formatCurrency(property.price)}</div>
                      <div className="text-xs text-[#94A3B8]">per night</div>
                    </div>
                  </div>

                  <p className="text-sm text-[#94A3B8] mt-2 line-clamp-2">{property.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {property.halalFeatures.slice(0, 3).map((feature, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                        {feature}
                      </span>
                    ))}
                    {property.halalFeatures.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#94A3B8]">
                        +{property.halalFeatures.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F1F7FC]">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#C9A84C]">★</span>
                      <span className="font-semibold text-[#1A2A3A]">{property.rating}</span>
                      <span className="text-[#94A3B8]">({property.reviews})</span>
                    </div>
                    <button
                      className="px-4 py-1.5 bg-[#1769AA] text-white text-sm font-semibold rounded-lg hover:bg-[#2F80C0] transition-all duration-200"
                      onClick={() => handleBookNow(property)}
                      disabled={!property.available}
                    >
                      {property.available ? 'Book Now' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== BOOKINGS SECTION ===== */}
        {isAuthenticated && (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1A2A3A]">My Bookings</h3>
              <button 
                className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                onClick={fetchBookings}
              >
                Refresh
              </button>
            </div>

            {loadingBookings ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-[#94A3B8]">No bookings yet. Start your first HalalStay!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const status = getStatusBadge(booking.status);
                  return (
                    <div 
                      key={booking.id} 
                      className="flex flex-wrap items-center justify-between p-4 bg-[#F1F7FC] rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                      onClick={() => viewBookingDetails(booking)}
                    >
                      <div>
                        <div className="font-semibold text-[#1A2A3A]">{booking.property}</div>
                        <div className="text-sm text-[#94A3B8]">
                          {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                        </div>
                        <div className="text-sm text-[#94A3B8]">{booking.guests} guests</div>
                        {booking.agreementAccepted && (
                          <span className="text-xs text-emerald-600">✓ Terms accepted</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#1769AA]">{formatCurrency(booking.total)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${status.style}`}>
                          {status.label}
                        </span>
                        <button
                          className="block text-xs text-[#DC2626] hover:text-[#B91C1C] transition-colors mt-1"
                          onClick={(e) => { e.stopPropagation(); cancelBooking(booking.id); }}
                        >
                          Cancel
                        </button>
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
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Booking</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowBookingModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Property Info */}
              <div>
                <div className="font-bold text-[#1A2A3A]">{selectedProperty.name}</div>
                <div className="text-sm text-[#94A3B8]">{selectedProperty.location}</div>
              </div>

              {/* Stay Details */}
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Check-in</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Check-out</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Nights</span>
                  <span className="font-semibold text-[#1A2A3A]">
                    {Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Guests</span>
                  <span className="font-semibold text-[#1A2A3A]">{guests}</span>
                </div>
              </div>

              {/* Guest Details */}
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Guest Details</h4>
                <div>
                  <label className="text-xs text-[#94A3B8] block">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] block">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] block">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] block">Special Requests (Optional)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] resize-y"
                    rows="2"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests?"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Subtotal</span>
                  <span className="font-semibold text-[#1A2A3A]">
                    {formatCurrency(selectedProperty.price * guests * Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Tax (16%)</span>
                  <span className="font-semibold text-[#1A2A3A]">
                    {formatCurrency(selectedProperty.price * guests * Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) * 0.16)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#1A2A3A]">Total</span>
                  <span className="text-[#1769AA]">
                    {formatCurrency(selectedProperty.price * guests * Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) * 1.16)}
                  </span>
                </div>
              </div>

              {/* Terms & Agreement */}
              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="termsAgreement"
                    className="mt-1 w-4 h-4 rounded border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30"
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted(!termsAccepted)}
                  />
                  <div>
                    <label htmlFor="termsAgreement" className="text-sm text-[#1A2A3A] font-medium cursor-pointer">
                      I agree to the Terms & Conditions
                    </label>
                    <button 
                      className="block text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors mt-1"
                      onClick={openTermsModal}
                    >
                      Read Full Terms & Conditions
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmBooking}
                disabled={processing || !termsAccepted || !guestName || !guestEmail || !guestPhone}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Terms & Conditions</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowTermsModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto" ref={termsContentRef} onScroll={handleTermsScroll}>
              <div className="space-y-4">
                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">1. HalalStay Platform Terms</h4>
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    HalalStay is a platform for halal-friendly accommodation. By using this platform, you agree to:
                  </p>
                  <ul className="text-sm text-[#5A6A7A] list-disc pl-5 mt-2 space-y-1">
                    <li>Only book accommodation that aligns with Islamic values</li>
                    <li>Respect the privacy and property of hosts and guests</li>
                    <li>Provide accurate and truthful information</li>
                    <li>Maintain Islamic etiquette in all interactions</li>
                  </ul>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">2. Property Terms & Conditions</h4>
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    Each property has specific rules. For {selectedProperty?.name}:
                  </p>
                  <ul className="text-sm text-[#5A6A7A] list-disc pl-5 mt-2 space-y-1">
                    <li>Check-in: {selectedProperty?.checkInTime}</li>
                    <li>Check-out: {selectedProperty?.checkOutTime}</li>
                    <li>Maximum guests: {selectedProperty?.maxGuests}</li>
                    {selectedProperty?.halalFeatures?.map((feature, i) => (
                      <li key={i}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">3. Cancellation & Refund Policy</h4>
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    {selectedProperty?.cancellationPolicy || 'Standard cancellation policy applies.'}
                  </p>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">4. Guest Responsibilities</h4>
                  <ul className="text-sm text-[#5A6A7A] list-disc pl-5 space-y-1">
                    <li>Respect the property and its contents</li>
                    <li>Follow all property rules and guidelines</li>
                    <li>Provide accurate guest information</li>
                    <li>Respect other guests and residents</li>
                    <li>Maintain halal conduct at all times</li>
                    <li>No alcohol, pork, or prohibited activities</li>
                  </ul>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">5. Privacy & Data Protection</h4>
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    Your personal data is protected under applicable privacy laws. We only collect data necessary for booking and communication.
                  </p>
                </div>
              </div>

              {!termsScrollComplete && (
                <div className="text-center text-sm text-[#C9A84C] font-semibold animate-pulse">
                  ↓ Scroll to the bottom to accept
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowTermsModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`flex-[2] px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${
                  termsScrollComplete 
                    ? 'bg-[#1769AA] text-white hover:bg-[#2F80C0]' 
                    : 'bg-[#F1F7FC] text-[#94A3B8] cursor-not-allowed'
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] bg-[#1769AA] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Booking Confirmed!</h3>
                <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowSuccessModal(false)}>
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-emerald-200">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <div className="text-sm text-[#94A3B8]">Booking confirmed for</div>
                <div className="text-xl font-bold text-[#1A2A3A]">{bookingData.propertyName}</div>
                <div className="text-sm font-mono text-[#94A3B8] mt-1">Ref: {bookingData.bookingRef}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Check-in</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(bookingData.checkIn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Check-out</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(bookingData.checkOut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Guests</span>
                  <span className="font-semibold text-[#1A2A3A]">{bookingData.guests}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#1A2A3A] font-semibold">Total</span>
                  <span className="text-[#1769AA] font-bold">{formatCurrency(bookingData.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Agreement</span>
                  <span className="text-emerald-600 font-semibold">✓ Accepted</span>
                </div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "The best provision is piety." — Quran 2:197
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  className="flex-1 px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== BOOKING DETAILS MODAL ===== */}
      {showBookingDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Booking Details</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowBookingDetailsModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <div className="font-bold text-[#1A2A3A]">{selectedBooking.property}</div>
                <div className="text-sm text-[#94A3B8]">Ref: {selectedBooking.bookingRef || 'N/A'}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Check-in</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(selectedBooking.checkIn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Check-out</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(selectedBooking.checkOut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Guests</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedBooking.guests}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#1A2A3A] font-semibold">Total</span>
                  <span className="text-[#1769AA] font-bold">{formatCurrency(selectedBooking.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(selectedBooking.status).style}`}>
                    {getStatusBadge(selectedBooking.status).label}
                  </span>
                </div>
                {selectedBooking.agreementAccepted && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Agreement</span>
                    <span className="text-emerald-600 font-semibold">✓ Accepted</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  className="flex-1 px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                  onClick={() => setShowBookingDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS TOAST ===== */}
      {success && (
        <div className="fixed top-6 right-6 z-50 bg-[#1769AA] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#1769AA]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-white/10">
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{success}</span>
          <button 
            className="text-white/60 hover:text-white transition ml-2"
            onClick={() => setSuccess('')}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default HalalStay;