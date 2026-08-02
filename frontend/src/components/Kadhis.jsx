import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { kadhiService, bookingService } from '../services/api';

const Kadhis = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Professionals
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [professionalType, setProfessionalType] = useState('all');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [selectedExpertise, setSelectedExpertise] = useState('All');
  const [counties, setCounties] = useState(['All']);
  const [expertiseOptions, setExpertiseOptions] = useState(['All', 'Family Law', 'Inheritance', 'Islamic Finance', 'Business', 'Marriage', 'Fatwa', 'Criminal Law', 'Zakat', 'Takaful', 'Wasiyyah', 'Faraid']);
  
  // Booking
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'video',
    notes: '',
    topic: '',
    county: ''
  });
  
  // Bookings history
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // Modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const consultationTopics = ['Family Matter', 'Inheritance', 'Marriage', 'Business', 'Finance', 'Zakat', 'Takaful', 'General Guidance', 'Other'];

  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchCounties();
    fetchProfessionals();
    fetchBookings();
  }, []);

  // Auto-refresh bookings every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchBookings();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
    }
  };

  const fetchCounties = async () => {
    try {
      const res = await kadhiService.getCounties();
      if (res.data.success) {
        setCounties(['All', ...res.data.counties]);
      }
    } catch (err) {
      console.error('Error fetching counties:', err);
    }
  };

  const fetchProfessionals = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (professionalType !== 'all') params.type = professionalType;
      if (selectedCounty !== 'All') params.county = selectedCounty;
      if (selectedExpertise !== 'All') params.expertise = selectedExpertise;
      if (searchQuery) params.search = searchQuery;
      
      const res = await kadhiService.getKadhis(params);
      if (res.data.success) {
        setProfessionals(res.data.kadhis || []);
      }
    } catch (err) {
      console.error('Error fetching professionals:', err);
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
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // ===== FILTERS =====
  useEffect(() => {
    if (!loading) {
      fetchProfessionals();
    }
  }, [professionalType, selectedCounty, selectedExpertise, searchQuery]);

  // ===== BOOKING =====
  const handleBook = (professional) => {
    if (!isAuthenticated) {
      setError('Please sign in to book a consultation.');
      return;
    }
    setSelectedProfessional(professional);
    setBookingData({
      ...bookingData,
      county: professional.county || '',
      topic: ''
    });
    setShowBookingModal(true);
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
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
    
    setProcessing(true);
    setError('');
    try {
      const response = await bookingService.createBooking({
        kadhiId: selectedProfessional.id,
        bookingDate: bookingData.date,
        bookingTime: bookingData.time,
        type: bookingData.type,
        topic: bookingData.topic,
        notes: bookingData.notes,
        userName: user?.fullName || 'Guest',
        userEmail: user?.email || ''
      });

      if (response.data.success) {
        setShowBookingModal(false);
        setShowSuccessModal(true);
        // Immediately refresh bookings
        await fetchBookings();
        // Also refresh professionals to update availability if needed
        await fetchProfessionals();
        setSuccess('Consultation booked successfully');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewProfile = (professional) => {
    setSelectedProfessional(professional);
    setShowProfileModal(true);
  };

  const handleJoinMeeting = (booking) => {
    if (booking.room_name) {
      navigate(`/video-call/${booking.id}`);
    } else {
      setError('No video call available for this booking');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewConsultations = () => {
    setShowSuccessModal(false);
    const section = document.querySelector('.my-consultations-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ===== HELPERS =====
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTypeLabel = (type) => {
    return type === 'kadhi' ? 'Kadhi' : 'Islamic Scholar';
  };

  const getTypeColor = (type) => {
    return type === 'kadhi' ? 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]' : 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]';
  };

  const getStatusBadge = (status) => {
    const styles = {
      'confirmed': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]',
      'completed': 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]',
      'cancelled': 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
      'pending': 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
    };
    const labels = {
      'confirmed': 'Confirmed',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'pending': 'Pending'
    };
    return { style: styles[status] || styles.pending, label: labels[status] || status };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const isVideoBooking = (booking) => {
    return booking.type === 'video' && booking.room_name;
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading...</p>
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
                <span className="text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">Islamic Guidance</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-[13px] font-medium text-[#C9A44B]/70">Kadhis & Scholars</span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Guidance Rooted in Knowledge
              </h1>
              <p className="text-white/70 text-[15px] mt-3 max-w-lg leading-relaxed">
                Connect with verified Kadhis and Islamic Scholars for trusted guidance, consultation, and Islamic legal expertise.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#C9A44B] bg-white/10 px-4 py-2 rounded-xl border border-[#C9A44B]/20">
                Verified Professionals
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
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Search</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                placeholder="Search by name or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Type</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                value={professionalType}
                onChange={(e) => setProfessionalType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="kadhi">Kadhi</option>
                <option value="scholar">Islamic Scholar</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">County</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
              >
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Expertise</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
              >
                {expertiseOptions.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#F4F5F1] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[15px] text-[#6B7280]">
              {professionals.length} professional{professionals.length !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>

        {/* ===== PROFESSIONALS GRID ===== */}
        {professionals.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-16 text-center">
            <p className="text-[15px] text-[#6B7280]">No professionals found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {professionals.map((professional) => (
              <div 
                key={professional.id} 
                className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#0B342B] flex items-center justify-center text-white font-bold text-[18px] flex-shrink-0">
                        {professional.name?.charAt(0) || 'K'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-[#1F2937]">{professional.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[12px] px-2 py-0.5 rounded-full border ${getTypeColor(professional.type)}`}>
                            {getTypeLabel(professional.type)}
                          </span>
                          {professional.verified && (
                            <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#3FAF73] border border-[#A7F3D0]">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${professional.available ? 'bg-[#D1FAE5] text-[#3FAF73] border border-[#A7F3D0]' : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'}`}>
                      {professional.available ? 'Available' : 'Unavailable'}
                    </div>
                  </div>

                  <p className="text-[14px] text-[#6B7280] mt-2">{professional.county || 'Location not specified'}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(professional.expertise || []).slice(0, 3).map((exp, i) => (
                      <span key={i} className="text-[12px] px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                        {exp}
                      </span>
                    ))}
                    {(professional.expertise || []).length > 3 && (
                      <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                        +{(professional.expertise || []).length - 3}
                      </span>
                    )}
                  </div>

                  <p className="text-[14px] text-[#6B7280] mt-3 line-clamp-2">{professional.bio || 'No bio available'}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-[#F4F5F1]">
                    <div className="flex items-center gap-2 text-[14px]">
                      <span className="text-[#C9A44B]">★</span>
                      <span className="font-semibold text-[#1F2937]">{professional.rating || 0}</span>
                      <span className="text-[#6B7280]">({professional.reviews || 0})</span>
                      <span className="text-[#6B7280]">·</span>
                      <span className="text-[#6B7280]">{professional.fee ? formatCurrency(professional.fee) + '/hr' : 'Contact'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 bg-[#FAFAF7] text-[#1F2937] text-[13px] font-medium rounded-xl hover:bg-[#F4F5F1] transition-colors border border-[#E8EEF4]"
                        onClick={() => handleViewProfile(professional)}
                      >
                        Profile
                      </button>
                      <button
                        className={`px-4 py-1.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                          professional.available 
                            ? 'bg-[#0B342B] text-white hover:bg-[#032A24] shadow-sm' 
                            : 'bg-[#F4F5F1] text-[#6B7280] cursor-not-allowed'
                        }`}
                        onClick={() => professional.available && handleBook(professional)}
                        disabled={!professional.available}
                      >
                        {professional.available ? 'Book' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== MY CONSULTATIONS ===== */}
        {isAuthenticated && (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 my-consultations-section">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h3 className="text-[17px] font-semibold text-[#1F2937]">My Consultations</h3>
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
                <p className="text-[15px] text-[#6B7280]">No consultations booked</p>
                <p className="text-[13px] text-[#6B7280] mt-1">Book a consultation with a Kadhi or Scholar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const status = getStatusBadge(booking.status);
                  const isVideo = isVideoBooking(booking);
                  const canJoin = isVideo && booking.status === 'confirmed';
                  
                  return (
                    <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FAFAF7] rounded-xl border border-[#E8EEF4] hover:bg-[#F4F5F1] transition-colors">
                      <div className="flex-1 min-w-[150px]">
                        <div className="font-semibold text-[15px] text-[#1F2937]">{booking.kadhi_name || 'Kadhi'}</div>
                        <div className="text-[14px] text-[#6B7280]">{formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}</div>
                        <div className="text-[14px] text-[#6B7280] capitalize">{booking.type}</div>
                        <div className="text-[13px] text-[#6B7280]">Status: {status.label}</div>
                        {isVideo && booking.room_name && (
                          <div className="text-[12px] text-[#0B342B] font-mono mt-0.5">Room: {booking.room_name}</div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[12px] px-2 py-0.5 rounded-full border font-medium ${status.style}`}>
                          {status.label}
                        </span>
                        {canJoin && (
                          <button
                            className="px-4 py-1.5 bg-[#0B342B] text-white text-[13px] font-medium rounded-xl hover:bg-[#032A24] transition-colors shadow-sm"
                            onClick={() => handleJoinMeeting(booking)}
                          >
                            Join Call
                          </button>
                        )}
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
      {showBookingModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Book Consultation</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]" onClick={() => setShowBookingModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-[#FAFAF7] rounded-xl p-4 text-center border border-[#E8EEF4]">
                <div className="font-semibold text-[17px] text-[#1F2937]">{selectedProfessional.name}</div>
                <div className="text-[14px] text-[#6B7280]">{getTypeLabel(selectedProfessional.type)} · {selectedProfessional.county || 'Location not specified'}</div>
                <div className="text-[14px] font-semibold text-[#0B342B] mt-1">{selectedProfessional.fee ? formatCurrency(selectedProfessional.fee) + '/hr' : 'Fee upon consultation'}</div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Consultation Topic</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                  name="topic"
                  value={bookingData.topic}
                  onChange={handleBookingChange}
                >
                  <option value="">Select a topic</option>
                  {consultationTopics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                  name="date"
                  value={bookingData.date}
                  onChange={handleBookingChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Time</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                  name="time"
                  value={bookingData.time}
                  onChange={handleBookingChange}
                >
                  <option value="">Select time</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                </select>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Consultation Type</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                  name="type"
                  value={bookingData.type}
                  onChange={handleBookingChange}
                >
                  <option value="in-person">In-Person</option>
                  <option value="phone">Phone Call</option>
                  <option value="video">Video Call</option>
                  <option value="chat">Chat</option>
                </select>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white resize-y"
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleBookingChange}
                  rows="2"
                  placeholder="Brief description of your consultation needs..."
                />
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[13px] text-[#6B7280] text-center leading-relaxed">
                  Your consultation information will be handled confidentially and only shared with the professional you are booking.
                </p>
              </div>

              {error && <p className="text-[15px] text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                onClick={confirmBooking}
                disabled={processing || !bookingData.date || !bookingData.time || !bookingData.topic}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Booking...
                  </span>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PROFILE MODAL ===== */}
      {showProfileModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Professional Profile</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]" onClick={() => setShowProfileModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0B342B] flex items-center justify-center text-white font-bold text-[24px] flex-shrink-0">
                  {selectedProfessional.name?.charAt(0) || 'K'}
                </div>
                <div>
                  <div className="font-bold text-[18px] text-[#1F2937]">{selectedProfessional.name}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[12px] px-2 py-0.5 rounded-full border ${getTypeColor(selectedProfessional.type)}`}>
                      {getTypeLabel(selectedProfessional.type)}
                    </span>
                    {selectedProfessional.verified && (
                      <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#3FAF73] border border-[#A7F3D0]">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-[#6B7280]">{selectedProfessional.county || 'Location not specified'}</p>
                </div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Experience</span>
                  <span className="font-semibold text-[#1F2937]">{selectedProfessional.experience || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Languages</span>
                  <span className="font-semibold text-[#1F2937]">{selectedProfessional.languages?.join(', ') || 'N/A'}</span>
                </div>
                {selectedProfessional.institution && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Institution</span>
                    <span className="font-semibold text-[#1F2937] text-right max-w-[60%]">{selectedProfessional.institution}</span>
                  </div>
                )}
                {selectedProfessional.verified && selectedProfessional.verification_date && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Verified</span>
                    <span className="font-semibold text-[#1F2937]">{selectedProfessional.verification_date}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Rating</span>
                  <span className="font-semibold text-[#C9A44B]">★ {selectedProfessional.rating || 0} ({selectedProfessional.reviews || 0} reviews)</span>
                </div>
                {selectedProfessional.fee && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Fee</span>
                    <span className="font-semibold text-[#0B342B]">{formatCurrency(selectedProfessional.fee)}/hour</span>
                  </div>
                )}
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <h4 className="text-[14px] font-semibold text-[#1F2937] mb-2">About</h4>
                <p className="text-[14px] text-[#6B7280] leading-relaxed">{selectedProfessional.bio || 'No bio available'}</p>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <h4 className="text-[14px] font-semibold text-[#1F2937] mb-2">Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedProfessional.expertise || []).map((exp, i) => (
                    <span key={i} className="text-[13px] px-3 py-1 rounded-full bg-white text-[#6B7280] border border-[#E8EEF4]">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 px-5 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:border-[#0B342B] hover:text-[#0B342B] transition-all duration-200 text-[15px]"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
                {selectedProfessional.available && (
                  <button
                    className="flex-1 px-5 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
                    onClick={() => {
                      setShowProfileModal(false);
                      handleBook(selectedProfessional);
                    }}
                  >
                    Book Consultation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] bg-[#0B342B] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-[22px] font-semibold text-white">Booking Confirmed</h3>
                <button className="text-white/60 hover:text-white transition-colors text-[24px]" onClick={() => setShowSuccessModal(false)}>
                  ✕
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
                <div className="text-[15px] text-[#6B7280]">Consultation booked with</div>
                <div className="text-[22px] font-bold text-[#1F2937]">{selectedProfessional?.name}</div>
                <div className="text-[15px] text-[#6B7280] mt-1">{bookingData.date} at {bookingData.time}</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] leading-relaxed">
                  You will receive a confirmation with details. The professional will contact you regarding your consultation.
                </p>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] italic leading-relaxed">
                  "And whoever is granted wisdom has indeed been granted great good." — Quran 2:269
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowSuccessModal(false)}
              >
                Done
              </button>
              <button 
                className="flex-1 px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                onClick={handleViewConsultations}
              >
                View My Consultations
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
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default Kadhis;