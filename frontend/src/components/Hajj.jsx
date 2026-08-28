import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PinModal from './PinModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Hajj = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Packages
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [loadingPackages, setLoadingPackages] = useState(false);
  
  // Booking form
  const [bookingData, setBookingData] = useState({
    package_id: '',
    pilgrims: 1,
    pilgrim_names: [],
    passport_numbers: [],
    contact_phone: '',
    contact_email: '',
    special_requests: '',
    fullName: '',
    email: '',
    phone: ''
  });
  
  // Modal state
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrollComplete, setTermsScrollComplete] = useState(false);
  const termsContentRef = useRef(null);
  
  // ===== PIN MODAL STATE =====
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pendingBookingData, setPendingBookingData] = useState(null);
  
  // ===== HELPER FUNCTIONS =====
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

  const getTierColor = (tier) => {
    const colors = {
      'Economy': '#6B5C3E',
      'Standard': '#0B342B',
      'Premium': '#C9A44B',
      'Umrah': '#0B342B'
    };
    return colors[tier] || '#6B5C3E';
  };

  const getTypeLabel = (type) => {
    return type === 'hajj' ? 'Hajj' : 'Umrah';
  };

  // ===== AUTH CHECK =====
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
      setBookingData({
        ...bookingData,
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        contact_phone: userData.phone || '',
        contact_email: userData.email || ''
      });
    }
  };

  // ===== FETCH PACKAGES =====
  useEffect(() => {
    fetchPackages();
  }, [filterType]);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    setError('');
    try {
      const config = {};
      const params = {};
      
      if (filterType !== 'all') {
        params.type = filterType;
      }
      
      const response = await axios.get(`${API_BASE}/hajj/packages`, { ...config, params });
      
      if (response.data.success) {
        setPackages(response.data.packages || []);
      } else {
        setError('Failed to load packages');
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err.response?.data?.error || 'Failed to load packages. Please refresh.');
    } finally {
      setLoadingPackages(false);
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
  const handleEnquire = (pkg) => {
    setSelectedPackage(pkg);
    setShowPackageModal(true);
  };

  const handleBookNow = (pkg) => {
    if (!isAuthenticated) {
      setError('Please sign in to book a package.');
      return;
    }
    setSelectedPackage(pkg);
    setTermsAccepted(false);
    setBookingData({
      ...bookingData,
      package_id: pkg.id,
      pilgrims: 1,
      pilgrim_names: [],
      passport_numbers: [],
      contact_phone: user?.phone || '',
      contact_email: user?.email || '',
      special_requests: ''
    });
    setShowBookingModal(true);
  };

  const handleBookingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingData({ 
      ...bookingData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    setError('');
  };

  const handlePilgrimNameChange = (index, value) => {
    const newNames = [...(bookingData.pilgrim_names || [])];
    newNames[index] = value;
    setBookingData({ ...bookingData, pilgrim_names: newNames });
  };

  const handlePassportChange = (index, value) => {
    const newPassports = [...(bookingData.passport_numbers || [])];
    newPassports[index] = value;
    setBookingData({ ...bookingData, passport_numbers: newPassports });
  };

  // ===== UPDATED: confirmBooking now shows PIN modal =====
  const confirmBooking = () => {
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions.');
      return;
    }
    if (!bookingData.contact_phone || !bookingData.contact_email) {
      setError('Please fill in all required contact details.');
      return;
    }
    if (bookingData.pilgrims < 1) {
      setError('At least 1 pilgrim is required.');
      return;
    }
    
    // Store booking data and show PIN modal
    setPendingBookingData({
      package_id: selectedPackage.id,
      packageName: selectedPackage.name,
      packagePrice: selectedPackage.price,
      pilgrims: bookingData.pilgrims,
      pilgrim_names: bookingData.pilgrim_names || [],
      passport_numbers: bookingData.passport_numbers || [],
      contact_phone: bookingData.contact_phone,
      contact_email: bookingData.contact_email,
      special_requests: bookingData.special_requests,
      totalAmount: selectedPackage.price * (bookingData.pilgrims || 1)
    });
    setShowBookingModal(false);
    setShowPinModal(true);
    setPinError('');
  };

  // ===== PIN VERIFICATION =====
  const handlePinVerify = async (pin) => {
    setPinLoading(true);
    setPinError('');
    try {
      const token = localStorage.getItem('halalhub_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(`${API_BASE}/client/hajj/book`, {
        package_id: pendingBookingData.package_id,
        pilgrims: pendingBookingData.pilgrims,
        pilgrim_names: pendingBookingData.pilgrim_names || [],
        passport_numbers: pendingBookingData.passport_numbers || [],
        contact_phone: pendingBookingData.contact_phone,
        contact_email: pendingBookingData.contact_email,
        special_requests: pendingBookingData.special_requests,
        pin: pin
      }, config);
      
      if (response.data.success) {
        setShowPinModal(false);
        setPendingBookingData(null);
        setShowSuccessModal(true);
        setSuccess('Booking request submitted successfully!');
        
        // Update package slots
        await fetchPackages();
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setPinError(response.data.error || 'Failed to submit booking');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setPinError(err.response?.data?.error || 'Failed to submit booking. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinError('');
    setPendingBookingData(null);
  };

  // ===== RENDER =====
  if (loadingPackages && packages.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading packages...</p>
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
                <span className="text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">Hajj & Umrah</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-[13px] font-medium text-[#C9A44B]/70">Pilgrimage Packages</span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Your Journey of a Lifetime
              </h1>
              <p className="text-white/70 text-[15px] mt-3 max-w-lg leading-relaxed">
                Discover and book Hajj and Umrah packages with trusted operators. 
                All packages include visa assistance, accommodation, and spiritual guidance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#C9A44B] bg-white/10 px-4 py-2 rounded-xl border border-[#C9A44B]/20">
                Trusted Operators
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* ===== ERROR ===== */}
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

        {/* ===== FILTERS ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-5 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                filterType === 'all' ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1]'
              }`}
              onClick={() => setFilterType('all')}
            >
              All Packages
            </button>
            <button
              className={`px-5 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                filterType === 'hajj' ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1]'
              }`}
              onClick={() => setFilterType('hajj')}
            >
              Hajj
            </button>
            <button
              className={`px-5 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                filterType === 'umrah' ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1]'
              }`}
              onClick={() => setFilterType('umrah')}
            >
              Umrah
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ===== LEFT COLUMN - PACKAGES ===== */}
          <div className="lg:col-span-2 space-y-5">
            {packages.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-16 text-center">
                <p className="text-[15px] text-[#6B7280]">No packages found for this category.</p>
              </div>
            ) : (
              packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-[17px] font-semibold text-[#1F2937]">{pkg.name}</h3>
                        <span className={`text-[13px] font-semibold px-3 py-1 rounded-full`} 
                          style={{ backgroundColor: getTierColor(pkg.type) + '15', color: getTierColor(pkg.type) }}>
                          {getTypeLabel(pkg.type)}
                        </span>
                        {pkg.is_featured && (
                          <span className="text-[13px] px-3 py-1 rounded-full bg-[#C9A44B] text-white font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] text-[#6B7280]">{pkg.vendor_name || 'Trusted Operator'} · {pkg.duration_days} days</p>
                      <p className="text-[15px] text-[#6B7280] mt-3 leading-relaxed">{pkg.description}</p>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {(pkg.includes || []).slice(0, 5).map((feature, i) => (
                          <span key={i} className="text-[13px] px-3 py-1 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                            {feature}
                          </span>
                        ))}
                        {(pkg.includes || []).length > 5 && (
                          <span className="text-[13px] px-3 py-1 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                            +{(pkg.includes || []).length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <div className="text-[28px] font-bold text-[#0B342B]">{formatCurrency(pkg.price)}</div>
                      <div className="text-[14px] text-[#6B7280]">per person</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-5 border-t border-[#F4F5F1]">
                    <div className="flex items-center gap-4 text-[14px]">
                      <span className="text-[#C9A44B]">★</span>
                      <span className="font-semibold text-[#1F2937]">{pkg.vendor_rating || 'New'}</span>
                      <span className="text-[#6B7280]">({pkg.total_bookings || 0} bookings)</span>
                      <span className="text-[#6B7280]">·</span>
                      <span className="text-[#6B7280]">{pkg.available_slots || 0} slots left</span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        className="px-5 py-2 bg-[#FAFAF7] text-[#1F2937] text-[15px] font-medium rounded-xl hover:bg-[#F4F5F1] transition-colors border border-[#E8EEF4]"
                        onClick={() => handleEnquire(pkg)}
                      >
                        Enquire
                      </button>
                      <button 
                        className={`px-6 py-2 text-[15px] font-medium rounded-xl transition-all duration-200 ${
                          pkg.is_active && pkg.available_slots > 0
                            ? 'bg-[#0B342B] text-white hover:bg-[#032A24] shadow-md shadow-[#0B342B]/20' 
                            : 'bg-[#F4F5F1] text-[#6B7280] cursor-not-allowed'
                        }`}
                        onClick={() => pkg.is_active && pkg.available_slots > 0 && handleBookNow(pkg)}
                        disabled={!pkg.is_active || pkg.available_slots <= 0}
                      >
                        {pkg.is_active && pkg.available_slots > 0 ? 'Book Now' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ===== RIGHT COLUMN - SIDEBAR ===== */}
          <div className="space-y-6">
            
            {/* Quick Enquiry */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Quick Enquiry</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Journey Type</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                    name="journeyType" 
                    value={bookingData.journeyType || 'hajj'} 
                    onChange={handleBookingChange}
                  >
                    <option value="hajj">Hajj 1447 AH (2026)</option>
                    <option value="umrah">Umrah — Any time</option>
                    <option value="ramadan-umrah">Ramadan Umrah</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Departure City</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                    name="departureCity" 
                    value={bookingData.departureCity || 'Nairobi'} 
                    onChange={handleBookingChange}
                  >
                    <option value="Nairobi">Nairobi (JKIA)</option>
                    <option value="Mombasa">Mombasa (MBA)</option>
                    <option value="Kisumu">Kisumu (KIS)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Adults</label>
                    <input 
                      className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                      type="number" 
                      name="adults" 
                      value={bookingData.adults || 2} 
                      onChange={handleBookingChange} 
                      min="1" 
                      max="10" 
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Children</label>
                    <input 
                      className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                      type="number" 
                      name="children" 
                      value={bookingData.children || 0} 
                      onChange={handleBookingChange} 
                      min="0" 
                      max="10" 
                    />
                  </div>
                </div>
                <button 
                  className="w-full py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                  onClick={() => setSuccess('Enquiry sent! We will contact you soon.')}
                >
                  Send Enquiry
                </button>
              </div>
            </div>

            {/* Important Info */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Important Information</h3>
              <ul className="space-y-3 text-[15px] text-[#6B7280]">
                <li className="flex items-start gap-3">
                  <span className="text-[#0B342B] font-semibold mt-0.5">✓</span>
                  <span>All packages include visa assistance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0B342B] font-semibold mt-0.5">✓</span>
                  <span>Accommodation in Makkah & Madinah</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0B342B] font-semibold mt-0.5">✓</span>
                  <span>Group transport between cities</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0B342B] font-semibold mt-0.5">✓</span>
                  <span>Spiritual guidance and support</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0B342B] font-semibold mt-0.5">✓</span>
                  <span>24/7 emergency contact</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PACKAGE DETAIL MODAL ===== */}
      {showPackageModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">{selectedPackage.name}</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]" onClick={() => setShowPackageModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Operator</span>
                  <span className="font-semibold text-[#1F2937]">{selectedPackage.vendor_name || 'Trusted Operator'}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Duration</span>
                  <span className="font-semibold text-[#1F2937]">{selectedPackage.duration_days} days</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Type</span>
                  <span className="font-semibold" style={{ color: getTierColor(selectedPackage.type) }}>{getTypeLabel(selectedPackage.type)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Price</span>
                  <span className="font-bold text-[#0B342B] text-[20px]">{formatCurrency(selectedPackage.price)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Available Slots</span>
                  <span className="font-semibold text-[#1F2937]">{selectedPackage.available_slots || 0}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Total Bookings</span>
                  <span className="font-semibold text-[#1F2937]">{selectedPackage.total_bookings || 0}</span>
                </div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] leading-relaxed">{selectedPackage.description}</p>
              </div>

              <div>
                <p className="text-[13px] font-medium text-[#6B7280] mb-2">Included:</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedPackage.includes || []).map((feature, i) => (
                    <span key={i} className="text-[13px] px-3 py-1 rounded-full bg-[#FAFAF7] text-[#1F2937] border border-[#E8EEF4]">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>

              {selectedPackage.excludes && selectedPackage.excludes.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-[#6B7280] mb-2">Excludes:</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedPackage.excludes || []).map((item, i) => (
                      <span key={i} className="text-[13px] px-3 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20">
                        ✗ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className={`text-[15px] font-semibold ${selectedPackage.is_active && selectedPackage.available_slots > 0 ? 'text-[#0B342B]' : 'text-[#DC2626]'}`}>
                {selectedPackage.is_active && selectedPackage.available_slots > 0 ? '✓ Available' : '✗ Currently Unavailable'}
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowPackageModal(false)}
              >
                Close
              </button>
              {selectedPackage.is_active && selectedPackage.available_slots > 0 && (
                <button 
                  className="flex-[2] px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                  onClick={() => {
                    setShowPackageModal(false);
                    handleBookNow(selectedPackage);
                  }}
                >
                  Book Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== BOOKING MODAL ===== */}
      {showBookingModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Book {selectedPackage.name}</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]" onClick={() => setShowBookingModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Package</span>
                  <span className="font-semibold text-[#1F2937]">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Price</span>
                  <span className="font-bold text-[#0B342B]">{formatCurrency(selectedPackage.price)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Duration</span>
                  <span className="font-semibold text-[#1F2937]">{selectedPackage.duration_days} days</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Available Slots</span>
                  <span className="font-semibold text-[#1F2937]">{selectedPackage.available_slots || 0}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wider">Pilgrim Details</h4>
                
                <div>
                  <label className="text-[14px] text-[#6B7280] block mb-1.5">Number of Pilgrims *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                    name="pilgrims"
                    value={bookingData.pilgrims}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setBookingData({ 
                        ...bookingData, 
                        pilgrims: val,
                        pilgrim_names: Array(val).fill(''),
                        passport_numbers: Array(val).fill('')
                      });
                    }}
                    min="1"
                    max={selectedPackage.available_slots || 50}
                  />
                  <p className="text-[13px] text-[#6B7280] mt-1">Max {selectedPackage.available_slots || 50} slots available</p>
                </div>

                {Array.from({ length: bookingData.pilgrims || 1 }).map((_, index) => (
                  <div key={index} className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                    <p className="text-[13px] font-semibold text-[#6B7280]">Pilgrim {index + 1}</p>
                    <div>
                      <label className="text-[12px] text-[#6B7280] block mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        value={(bookingData.pilgrim_names || [])[index] || ''}
                        onChange={(e) => handlePilgrimNameChange(index, e.target.value)}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] text-[#6B7280] block mb-1">Passport Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        value={(bookingData.passport_numbers || [])[index] || ''}
                        onChange={(e) => handlePassportChange(index, e.target.value)}
                        placeholder="Enter passport number"
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="text-[14px] text-[#6B7280] block mb-1.5">Contact Phone *</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                    name="contact_phone"
                    value={bookingData.contact_phone}
                    onChange={handleBookingChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="text-[14px] text-[#6B7280] block mb-1.5">Contact Email *</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                    name="contact_email"
                    value={bookingData.contact_email}
                    onChange={handleBookingChange}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="text-[14px] text-[#6B7280] block mb-1.5">Special Requests</label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white resize-y"
                    name="special_requests"
                    value={bookingData.special_requests}
                    onChange={handleBookingChange}
                    rows="3"
                    placeholder="Any special requirements..."
                  />
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <div className="flex justify-between text-[17px] font-semibold pt-3 border-t border-[#E8EEF4]">
                    <span className="text-[#1F2937]">Total</span>
                    <span className="text-[#0B342B]">{formatCurrency(selectedPackage.price * (bookingData.pilgrims || 1))}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="termsAgreement"
                    className="mt-1 w-5 h-5 rounded border-[#E8EEF4] text-[#0B342B] focus:ring-[#0B342B]/20"
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
            
            <div className="p-6 border-t border-[#F4F5F1] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                onClick={confirmBooking}
                disabled={processing || !termsAccepted || !bookingData.contact_phone || !bookingData.contact_email || bookingData.pilgrims < 1}
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
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Terms & Conditions</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]" onClick={() => setShowTermsModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto" ref={termsContentRef} onScroll={handleTermsScroll}>
              <div className="space-y-5">
                <div className="bg-[#FAFAF7] rounded-xl p-5 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-3">1. Booking Terms</h4>
                  <p className="text-[15px] text-[#6B7280] leading-relaxed">
                    By booking a Hajj or Umrah package through HalalHub, you agree to the following terms and conditions. 
                    All bookings are subject to availability and confirmation by the service provider.
                  </p>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-5 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-3">2. Payment & Cancellation</h4>
                  <ul className="text-[15px] text-[#6B7280] list-disc pl-6 space-y-2">
                    <li>A non-refundable deposit is required to confirm your booking</li>
                    <li>Full payment must be completed before the final deadline</li>
                    <li>Cancellation policies vary by package and provider</li>
                    <li>Refunds are subject to the provider's cancellation policy</li>
                  </ul>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-5 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-3">3. Travel Requirements</h4>
                  <ul className="text-[15px] text-[#6B7280] list-disc pl-6 space-y-2">
                    <li>A valid passport with at least 6 months validity is required</li>
                    <li>Visa processing times vary by country and season</li>
                    <li>Health requirements and vaccinations may apply</li>
                    <li>Travel insurance is recommended for all pilgrims</li>
                  </ul>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-5 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-3">4. Pilgrim Responsibilities</h4>
                  <ul className="text-[15px] text-[#6B7280] list-disc pl-6 space-y-2">
                    <li>All pilgrims must follow the guidance of their group leader</li>
                    <li>Respect the sanctity of the holy sites at all times</li>
                    <li>Follow all Saudi Arabian laws and regulations</li>
                    <li>Maintain appropriate Islamic conduct throughout the journey</li>
                  </ul>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-5 border border-[#E8EEF4]">
                  <h4 className="font-bold text-[17px] text-[#1F2937] mb-3">5. Liability</h4>
                  <p className="text-[15px] text-[#6B7280] leading-relaxed">
                    HalalHub acts as a platform connecting pilgrims with verified service providers. 
                    We are not responsible for the acts or omissions of third-party providers. 
                    All services are provided by the listed operators.
                  </p>
                </div>
              </div>

              {!termsScrollComplete && (
                <div className="text-center text-[15px] text-[#C9A44B] font-semibold animate-pulse">
                  Scroll to the bottom to accept
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex gap-3">
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
      {showSuccessModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] bg-[#0B342B] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-[22px] font-semibold text-white">Booking Submitted!</h3>
                <button className="text-white/60 hover:text-white transition-colors text-[24px]" onClick={() => setShowSuccessModal(false)}>
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5 text-center">
              <div className="w-20 h-20 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto border-4 border-[#0B342B]/20">
                <svg className="w-10 h-10 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <div className="text-[15px] text-[#6B7280]">Your booking request for</div>
                <div className="text-[22px] font-bold text-[#1F2937] mt-1">{selectedPackage.name}</div>
                <div className="text-[15px] text-[#6B7280] mt-2">has been submitted successfully!</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Pilgrims</span>
                  <span className="font-semibold text-[#1F2937]">{bookingData.pilgrims}</span>
                </div>
                <div className="flex justify-between text-[17px] font-semibold pt-3 border-t border-[#E8EEF4]">
                  <span className="text-[#1F2937]">Total</span>
                  <span className="text-[#0B342B]">{formatCurrency(selectedPackage.price * (bookingData.pilgrims || 1))}</span>
                </div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] leading-relaxed">
                  Our team will contact you within 24 hours to confirm your booking and provide further details.
                </p>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] italic leading-relaxed">
                  "And proclaim to the people the Hajj [pilgrimage]; they will come to you on foot and on every lean camel..." — Quran 22:27
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1]">
              <button 
                className="w-full px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                onClick={() => setShowSuccessModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PIN MODAL ===== */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerify}
        loading={pinLoading}
        error={pinError}
        title="Confirm Hajj/Umrah Booking"
        subtitle="Enter your 4-digit PIN to confirm your pilgrimage booking"
        amount={pendingBookingData?.totalAmount || 0}
        recipient={pendingBookingData?.packageName || 'Package'}
        transactionType={selectedPackage?.type === 'hajj' ? 'hajj' : 'umrah'}
      />

      {/* ===== SUCCESS TOAST ===== */}
      {success && (
        <div className="fixed top-6 right-6 z-50 bg-[#0B342B] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#0B342B]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-[#C9A44B]/20">
          <svg className="w-5 h-5 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[15px] font-medium">{success}</span>
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

export default Hajj;