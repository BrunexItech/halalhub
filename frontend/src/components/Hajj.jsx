import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
  
  // Booking form
  const [bookingData, setBookingData] = useState({
    journeyType: 'hajj',
    departureCity: 'Nairobi',
    adults: 2,
    children: 0,
    roomType: 'standard',
    specialRequests: '',
    fullName: '',
    email: '',
    phone: '',
    passportNumber: ''
  });
  
  // Modal state
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrollComplete, setTermsScrollComplete] = useState(false);
  const termsContentRef = useRef(null);
  
  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchPackages();
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
        phone: userData.phone || ''
      });
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    setError('');
    try {
      const mockPackages = [
        {
          id: 1,
          name: 'Economy Hajj 1447 AH',
          operator: 'Al-Mabrur Travel',
          price: 185000,
          duration: '21 days',
          tier: 'Economy',
          type: 'hajj',
          description: 'Complete Hajj package with shared accommodation and group transport.',
          features: ['Shared Room', 'Group Transport', 'Basic Meals', 'Visa Assistance'],
          available: true,
          groupSize: '30-35 pilgrims',
          rating: 4.5,
          reviews: 45,
          accommodation: '3-star hotel, shared room',
          transport: 'Group buses',
          meals: 'Breakfast & Dinner'
        },
        {
          id: 2,
          name: 'Standard Hajj Package',
          operator: 'Rahma Hajj Safaris',
          price: 285000,
          duration: '28 days',
          tier: 'Standard',
          type: 'hajj',
          description: 'Comfortable Hajj experience with premium accommodation and guided tours.',
          features: ['Private Room', 'Premium Transport', 'Full Board Meals', 'Visa Assistance', 'Guided Tours'],
          available: true,
          groupSize: '20-25 pilgrims',
          rating: 4.8,
          reviews: 67,
          accommodation: '4-star hotel, private room',
          transport: 'Private minibus',
          meals: 'Full board'
        },
        {
          id: 3,
          name: 'Premium Hajj Experience',
          operator: 'Al-Safwa Luxury Tours',
          price: 450000,
          duration: '21 days',
          tier: 'Premium',
          type: 'hajj',
          description: 'Luxury Hajj experience with 5-star accommodation and personalized service.',
          features: ['5-Star Hotel', 'Private Transport', 'Gourmet Meals', 'Visa Assistance', 'Personal Guide', 'Special Access'],
          available: true,
          groupSize: '10-15 pilgrims',
          rating: 4.9,
          reviews: 34,
          accommodation: '5-star hotel, suite',
          transport: 'Private luxury vehicle',
          meals: 'Gourmet meals'
        },
        {
          id: 4,
          name: 'Ramadan Umrah Package',
          operator: 'Barakah Umrah Kenya',
          price: 120000,
          duration: '14 days',
          tier: 'Umrah',
          type: 'umrah',
          description: 'Special Umrah package during the blessed month of Ramadan.',
          features: ['Shared Room', 'Group Transport', 'Suhoor & Iftar', 'Visa Assistance', 'Spiritual Guidance'],
          available: true,
          groupSize: '25-30 pilgrims',
          rating: 4.7,
          reviews: 89,
          accommodation: '3-star hotel, shared room',
          transport: 'Group buses',
          meals: 'Suhoor & Iftar'
        },
        {
          id: 5,
          name: 'VIP Umrah Package',
          operator: 'Makkah Elite Tours',
          price: 250000,
          duration: '10 days',
          tier: 'Umrah',
          type: 'umrah',
          description: 'VIP Umrah experience with luxury accommodation and premium services.',
          features: ['5-Star Hotel', 'Private Transport', 'Personal Guide', 'Visa Assistance', 'Special Access'],
          available: false,
          groupSize: '8-10 pilgrims',
          rating: 4.9,
          reviews: 23,
          accommodation: '5-star hotel, suite',
          transport: 'Private luxury vehicle',
          meals: 'Full board'
        }
      ];
      
      setPackages(mockPackages);
    } catch (err) {
      setError('Failed to load packages. Please refresh.');
      console.error('Packages error:', err);
    } finally {
      setLoading(false);
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
    setShowBookingModal(true);
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
    setError('');
  };

  const confirmBooking = async () => {
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions.');
      return;
    }
    if (!bookingData.fullName || !bookingData.email || !bookingData.phone) {
      setError('Please fill in all required pilgrim details.');
      return;
    }
    
    setProcessing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowBookingModal(false);
      setShowSuccessModal(true);
      setSuccess('Booking request submitted successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to submit booking. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPackages = filterType === 'all' 
    ? packages 
    : packages.filter(p => p.type === filterType);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTierColor = (tier) => {
    const colors = {
      'Economy': '#6B5C3E',
      'Standard': '#1769AA',
      'Premium': '#C9A84C',
      'Umrah': '#16A34A'
    };
    return colors[tier] || '#6B5C3E';
  };

  const getTypeLabel = (type) => {
    return type === 'hajj' ? 'Hajj' : 'Umrah';
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading packages...</p>
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
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Hajj & Umrah</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Pilgrimage Packages</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Your Journey of a Lifetime
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Discover and book Hajj and Umrah packages with trusted operators. 
                All packages include visa assistance, accommodation, and spiritual guidance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
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

        {/* ===== FILTERS ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filterType === 'all' ? 'bg-[#1769AA] text-white' : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
              }`}
              onClick={() => setFilterType('all')}
            >
              All Packages
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filterType === 'hajj' ? 'bg-[#1769AA] text-white' : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
              }`}
              onClick={() => setFilterType('hajj')}
            >
              Hajj
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filterType === 'umrah' ? 'bg-[#1769AA] text-white' : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
              }`}
              onClick={() => setFilterType('umrah')}
            >
              Umrah
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ===== LEFT COLUMN - PACKAGES ===== */}
          <div className="lg:col-span-2 space-y-4">
            {filteredPackages.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-12 text-center">
                <p className="text-sm text-[#94A3B8]">No packages found for this category.</p>
              </div>
            ) : (
              filteredPackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1A2A3A]">{pkg.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full`} 
                          style={{ backgroundColor: getTierColor(pkg.tier) + '20', color: getTierColor(pkg.tier) }}>
                          {pkg.tier}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                          {getTypeLabel(pkg.type)}
                        </span>
                      </div>
                      <p className="text-sm text-[#94A3B8]">{pkg.operator} · {pkg.duration}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#1769AA]">{formatCurrency(pkg.price)}</div>
                      <div className="text-xs text-[#94A3B8]">per person</div>
                    </div>
                  </div>

                  <p className="text-sm text-[#5A6A7A] mt-2">{pkg.description}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {pkg.features.slice(0, 4).map((feature, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                        {feature}
                      </span>
                    ))}
                    {pkg.features.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#94A3B8]">
                        +{pkg.features.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[#F1F7FC]">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-[#C9A84C]">★</span>
                      <span className="font-semibold text-[#1A2A3A]">{pkg.rating}</span>
                      <span className="text-[#94A3B8]">({pkg.reviews} reviews)</span>
                      <span className="text-[#94A3B8]">·</span>
                      <span className="text-[#94A3B8]">{pkg.groupSize}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="px-4 py-1.5 bg-[#F1F7FC] text-[#5A6A7A] text-sm font-semibold rounded-lg hover:bg-[#E8EEF4] transition-colors"
                        onClick={() => handleEnquire(pkg)}
                      >
                        Enquire
                      </button>
                      <button 
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          pkg.available 
                            ? 'bg-[#1769AA] text-white hover:bg-[#2F80C0]' 
                            : 'bg-[#F1F7FC] text-[#94A3B8] cursor-not-allowed'
                        }`}
                        onClick={() => pkg.available && handleBookNow(pkg)}
                        disabled={!pkg.available}
                      >
                        {pkg.available ? 'Book Now' : 'Unavailable'}
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
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Quick Enquiry</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Journey Type</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="journeyType" 
                    value={bookingData.journeyType} 
                    onChange={handleBookingChange}
                  >
                    <option value="hajj">Hajj 1447 AH (2026)</option>
                    <option value="umrah">Umrah — Any time</option>
                    <option value="ramadan-umrah">Ramadan Umrah</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Departure City</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="departureCity" 
                    value={bookingData.departureCity} 
                    onChange={handleBookingChange}
                  >
                    <option value="Nairobi">Nairobi (JKIA)</option>
                    <option value="Mombasa">Mombasa (MBA)</option>
                    <option value="Kisumu">Kisumu (KIS)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Adults</label>
                    <input 
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                      type="number" 
                      name="adults" 
                      value={bookingData.adults} 
                      onChange={handleBookingChange} 
                      min="1" 
                      max="10" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Children</label>
                    <input 
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                      type="number" 
                      name="children" 
                      value={bookingData.children} 
                      onChange={handleBookingChange} 
                      min="0" 
                      max="10" 
                    />
                  </div>
                </div>
                <button 
                  className="w-full py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                  onClick={() => alert('Enquiry sent! We will contact you soon.')}
                >
                  Send Enquiry
                </button>
              </div>
            </div>

            {/* Important Info */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Important Information</h3>
              <ul className="space-y-2 text-sm text-[#5A6A7A]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>All packages include visa assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Accommodation in Makkah & Madinah</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Group transport between cities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Spiritual guidance and support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">{selectedPackage.name}</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowPackageModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Operator</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedPackage.operator}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Duration</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedPackage.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Tier</span>
                  <span className="font-semibold" style={{ color: getTierColor(selectedPackage.tier) }}>{selectedPackage.tier}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Price</span>
                  <span className="font-bold text-[#1769AA]">{formatCurrency(selectedPackage.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Group Size</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedPackage.groupSize}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Accommodation</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedPackage.accommodation}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Transport</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedPackage.transport}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Meals</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedPackage.meals}</span>
                </div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A]">{selectedPackage.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedPackage.features.map((feature, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                    ✓ {feature}
                  </span>
                ))}
              </div>

              <div className={`text-sm font-semibold ${selectedPackage.available ? 'text-emerald-600' : 'text-[#DC2626]'}`}>
                {selectedPackage.available ? 'Available' : 'Currently Unavailable'}
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowPackageModal(false)}
              >
                Close
              </button>
              {selectedPackage.available && (
                <button 
                  className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Book {selectedPackage.name}</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowBookingModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Package</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Price</span>
                  <span className="font-bold text-[#1769AA]">{formatCurrency(selectedPackage.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Duration</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedPackage.duration}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Pilgrim Details</h4>
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Full Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="fullName"
                    value={bookingData.fullName}
                    onChange={handleBookingChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Email *</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="email"
                    value={bookingData.email}
                    onChange={handleBookingChange}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Phone *</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="phone"
                    value={bookingData.phone}
                    onChange={handleBookingChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Passport Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="passportNumber"
                    value={bookingData.passportNumber}
                    onChange={handleBookingChange}
                    placeholder="Enter your passport number"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Special Requests</label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 resize-y"
                    name="specialRequests"
                    value={bookingData.specialRequests}
                    onChange={handleBookingChange}
                    rows="2"
                    placeholder="Any special requirements..."
                  />
                </div>
              </div>

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
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmBooking}
                disabled={processing || !termsAccepted || !bookingData.fullName || !bookingData.email || !bookingData.phone}
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
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Terms & Conditions</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowTermsModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto" ref={termsContentRef} onScroll={handleTermsScroll}>
              <div className="space-y-4">
                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">1. Booking Terms</h4>
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    By booking a Hajj or Umrah package through HalalHub, you agree to the following terms and conditions. 
                    All bookings are subject to availability and confirmation by the service provider.
                  </p>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">2. Payment & Cancellation</h4>
                  <ul className="text-sm text-[#5A6A7A] list-disc pl-5 space-y-1">
                    <li>A non-refundable deposit is required to confirm your booking</li>
                    <li>Full payment must be completed before the final deadline</li>
                    <li>Cancellation policies vary by package and provider</li>
                    <li>Refunds are subject to the provider's cancellation policy</li>
                  </ul>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">3. Travel Requirements</h4>
                  <ul className="text-sm text-[#5A6A7A] list-disc pl-5 space-y-1">
                    <li>A valid passport with at least 6 months validity is required</li>
                    <li>Visa processing times vary by country and season</li>
                    <li>Health requirements and vaccinations may apply</li>
                    <li>Travel insurance is recommended for all pilgrims</li>
                  </ul>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">4. Pilgrim Responsibilities</h4>
                  <ul className="text-sm text-[#5A6A7A] list-disc pl-5 space-y-1">
                    <li>All pilgrims must follow the guidance of their group leader</li>
                    <li>Respect the sanctity of the holy sites at all times</li>
                    <li>Follow all Saudi Arabian laws and regulations</li>
                    <li>Maintain appropriate Islamic conduct throughout the journey</li>
                  </ul>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="font-bold text-[#1A2A3A] mb-2">5. Liability</h4>
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    HalalHub acts as a platform connecting pilgrims with verified service providers. 
                    We are not responsible for the acts or omissions of third-party providers. 
                    All services are provided by the listed operators.
                  </p>
                </div>
              </div>

              {!termsScrollComplete && (
                <div className="text-center text-sm text-[#C9A84C] font-semibold animate-pulse">
                  ↓ Scroll to the bottom to accept
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
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
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] bg-[#1769AA] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Booking Submitted!</h3>
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
                <div className="text-sm text-[#94A3B8]">Your booking request for</div>
                <div className="text-xl font-bold text-[#1A2A3A]">{selectedPackage?.name}</div>
                <div className="text-sm text-[#94A3B8] mt-1">has been submitted successfully!</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] leading-relaxed">
                  Our team will contact you within 24 hours to confirm your booking and provide further details.
                </p>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "And proclaim to the people the Hajj [pilgrimage]; they will come to you on foot and on every lean camel..." — Quran 22:27
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC]">
              <button 
                className="w-full px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                onClick={() => setShowSuccessModal(false)}
              >
                Done
              </button>
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

export default Hajj;