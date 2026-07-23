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
  const [professionalType, setProfessionalType] = useState('all'); // 'all', 'kadhi', 'scholar'
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [selectedExpertise, setSelectedExpertise] = useState('All');
  
  // Booking
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'in-person',
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
  
  // Counties
  const counties = ['All', 'Nairobi', 'Mombasa', 'Kisumu', 'Garissa', 'Nakuru', 'Eldoret', 'Malindi', 'Kakamega', 'Kitale'];
  const expertiseOptions = ['All', 'Family Law', 'Inheritance', 'Islamic Finance', 'Business', 'Marriage', 'Fatwa', 'Criminal Law', 'Zakat', 'Takaful', 'Wasiyyah', 'Faraid'];
  const consultationTopics = ['Family Matter', 'Inheritance', 'Marriage', 'Business', 'Finance', 'Zakat', 'Takaful', 'General Guidance', 'Other'];

  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchProfessionals();
    fetchBookings();
    // Set loading to false after data fetch
    setTimeout(() => setLoading(false), 500);
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
    }
  };

  const fetchProfessionals = async () => {
    setError('');
    try {
      const mockProfessionals = [
        {
          id: 1,
          name: 'Sheikh Abdul Rahman Al-Naqib',
          type: 'kadhi',
          county: 'Nairobi',
          expertise: ['Family Law', 'Inheritance', 'Marriage'],
          fee: 2000,
          rating: 4.9,
          reviews: 45,
          experience: '15 years',
          bio: 'Senior Kadhi with extensive experience in family law, inheritance disputes, and marriage matters. Provides mediation and legal guidance.',
          available: true,
          languages: ['English', 'Swahili', 'Arabic'],
          verified: true,
          verificationDate: '2024-01-15',
          institution: 'Kadhi Courts of Kenya',
          consultationTypes: ['in-person', 'video', 'phone']
        },
        {
          id: 2,
          name: 'Kadhi Mohammed Ali Hassan',
          type: 'kadhi',
          county: 'Mombasa',
          expertise: ['Inheritance', 'Business', 'Family Law'],
          fee: 1500,
          rating: 4.8,
          reviews: 32,
          experience: '12 years',
          bio: 'Specializes in business disputes, inheritance matters, and family mediation. Known for fair and balanced resolutions.',
          available: true,
          languages: ['English', 'Swahili'],
          verified: true,
          verificationDate: '2024-02-01',
          institution: 'Kadhi Courts of Kenya',
          consultationTypes: ['in-person', 'phone']
        },
        {
          id: 3,
          name: 'Sheikh Ibrahim Yusuf',
          type: 'scholar',
          county: 'Nairobi',
          expertise: ['Islamic Finance', 'Fatwa', 'Zakat', 'Takaful'],
          fee: 3000,
          rating: 5.0,
          reviews: 56,
          experience: '20 years',
          bio: 'Leading expert in Islamic finance, Fatwa issuance, and Zakat. PhD in Islamic Economics. Consultant for several Islamic financial institutions.',
          available: true,
          languages: ['English', 'Arabic'],
          verified: true,
          verificationDate: '2024-01-10',
          institution: 'Islamic University of Madinah',
          consultationTypes: ['video', 'phone', 'chat']
        },
        {
          id: 4,
          name: 'Sheikh Abdirahman Mohamed',
          type: 'scholar',
          county: 'Garissa',
          expertise: ['Marriage', 'Family Law', 'Wasiyyah'],
          fee: 800,
          rating: 4.7,
          reviews: 28,
          experience: '8 years',
          bio: 'Dedicated to resolving family matters with compassion and Islamic guidance. Specializes in marriage counseling and wasiyyah.',
          available: true,
          languages: ['English', 'Swahili', 'Somali'],
          verified: true,
          verificationDate: '2024-02-15',
          institution: 'Al-Azhar University',
          consultationTypes: ['in-person', 'phone', 'video']
        },
        {
          id: 5,
          name: 'Sheikh Fatima Noor',
          type: 'kadhi',
          county: 'Kisumu',
          expertise: ['Family Law', 'Inheritance', 'Marriage', 'Faraid'],
          fee: 1200,
          rating: 4.9,
          reviews: 39,
          experience: '10 years',
          bio: 'Pioneering female Kadhi specializing in women\'s rights, family law, and inheritance matters. Respected for her fair and empathetic approach.',
          available: false,
          languages: ['English', 'Swahili', 'Luo'],
          verified: true,
          verificationDate: '2024-03-01',
          institution: 'Kadhi Courts of Kenya',
          consultationTypes: ['in-person', 'phone']
        },
        {
          id: 6,
          name: 'Sheikh Hassan Juma',
          type: 'scholar',
          county: 'Nakuru',
          expertise: ['Islamic Finance', 'Takaful', 'Business'],
          fee: 1800,
          rating: 4.6,
          reviews: 23,
          experience: '14 years',
          bio: 'Islamic finance expert with extensive experience in Takaful and business-related Islamic guidance.',
          available: true,
          languages: ['English', 'Swahili'],
          verified: false,
          verificationDate: null,
          institution: 'University of Nairobi',
          consultationTypes: ['video', 'chat']
        }
      ];
      
      setProfessionals(mockProfessionals);
    } catch (err) {
      setError('Failed to load professionals. Please refresh.');
      console.error('Professionals error:', err);
    }
  };

  const fetchBookings = async () => {
    if (!isAuthenticated) return;
    setLoadingBookings(true);
    try {
      setBookings([
        { id: 1, professional: 'Sheikh Abdul Rahman Al-Naqib', date: '2024-04-15', time: '10:00 AM', status: 'confirmed', type: 'in-person' },
        { id: 2, professional: 'Sheikh Ibrahim Yusuf', date: '2024-04-10', time: '2:00 PM', status: 'completed', type: 'video' }
      ]);
    } catch (err) {
      console.error('Bookings error:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // ===== FILTERS =====
  const filteredProfessionals = professionals.filter(p => {
    const matchesType = professionalType === 'all' || p.type === professionalType;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCounty = selectedCounty === 'All' || p.county === selectedCounty;
    const matchesExpertise = selectedExpertise === 'All' || p.expertise.includes(selectedExpertise);
    return matchesType && matchesSearch && matchesCounty && matchesExpertise;
  });

  // ===== BOOKING =====
  const handleBook = (professional) => {
    if (!isAuthenticated) {
      setError('Please sign in to book a consultation.');
      return;
    }
    setSelectedProfessional(professional);
    setBookingData({
      ...bookingData,
      county: professional.county,
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowBookingModal(false);
      setShowSuccessModal(true);
      await fetchBookings();
      
      setSuccess('Consultation booked successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to book. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewProfile = (professional) => {
    setSelectedProfessional(professional);
    setShowProfileModal(true);
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
    return type === 'kadhi' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getStatusBadge = (status) => {
    const styles = {
      'confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'completed': 'bg-blue-50 text-blue-700 border-blue-200',
      'cancelled': 'bg-red-50 text-red-700 border-red-200',
      'pending': 'bg-amber-50 text-amber-700 border-amber-200'
    };
    const labels = {
      'confirmed': 'Confirmed',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'pending': 'Pending'
    };
    return { style: styles[status] || styles.pending, label: labels[status] || status };
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading...</p>
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
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Islamic Guidance</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Kadhis & Scholars</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Guidance Rooted in Knowledge
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Connect with verified Kadhis and Islamic Scholars for trusted guidance, consultation, and Islamic legal expertise.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
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
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Search</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                placeholder="Search by name or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Type</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={professionalType}
                onChange={(e) => setProfessionalType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="kadhi">Kadhi</option>
                <option value="scholar">Islamic Scholar</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">County</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
              >
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Expertise</label>
              <select
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
              >
                {expertiseOptions.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-[#F1F7FC] flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-[#94A3B8]">
              {filteredProfessionals.length} professional{filteredProfessionals.length !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>

        {/* ===== PROFESSIONALS GRID ===== */}
        {filteredProfessionals.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-12 text-center">
            <p className="text-sm text-[#94A3B8]">No professionals found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredProfessionals.map((professional) => (
              <div 
                key={professional.id} 
                className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {professional.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1A2A3A]">{professional.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(professional.type)}`}>
                            {getTypeLabel(professional.type)}
                          </span>
                          {professional.verified && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${professional.available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {professional.available ? 'Available' : 'Unavailable'}
                    </div>
                  </div>

                  <p className="text-sm text-[#94A3B8] mt-2">{professional.county}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {professional.expertise.slice(0, 3).map((exp, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                        {exp}
                      </span>
                    ))}
                    {professional.expertise.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#94A3B8]">
                        +{professional.expertise.length - 3}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#5A6A7A] mt-3 line-clamp-2">{professional.bio}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F1F7FC]">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#C9A84C]">★</span>
                      <span className="font-semibold text-[#1A2A3A]">{professional.rating}</span>
                      <span className="text-[#94A3B8]">({professional.reviews})</span>
                      <span className="text-[#94A3B8]">·</span>
                      <span className="text-[#94A3B8]">{professional.fee ? formatCurrency(professional.fee) + '/hr' : 'Contact'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 bg-[#F1F7FC] text-[#5A6A7A] text-xs font-semibold rounded-lg hover:bg-[#E8EEF4] transition-colors"
                        onClick={() => handleViewProfile(professional)}
                      >
                        Profile
                      </button>
                      <button
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                          professional.available 
                            ? 'bg-[#1769AA] text-white hover:bg-[#2F80C0]' 
                            : 'bg-[#F1F7FC] text-[#94A3B8] cursor-not-allowed'
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
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1A2A3A]">My Consultations</h3>
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
                <p className="text-sm text-[#94A3B8]">No consultations booked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const status = getStatusBadge(booking.status);
                  return (
                    <div key={booking.id} className="flex flex-wrap items-center justify-between p-4 bg-[#F1F7FC] rounded-lg">
                      <div>
                        <div className="font-semibold text-[#1A2A3A]">{booking.professional}</div>
                        <div className="text-sm text-[#94A3B8]">{booking.date} at {booking.time}</div>
                        <div className="text-sm text-[#94A3B8] capitalize">{booking.type}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${status.style}`}>
                          {status.label}
                        </span>
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Book Consultation</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowBookingModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <div className="font-bold text-[#1A2A3A]">{selectedProfessional.name}</div>
                <div className="text-sm text-[#94A3B8]">{getTypeLabel(selectedProfessional.type)} · {selectedProfessional.county}</div>
                <div className="text-sm font-semibold text-[#1769AA] mt-1">{selectedProfessional.fee ? formatCurrency(selectedProfessional.fee) + '/hr' : 'Fee upon consultation'}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Consultation Topic</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                  name="date"
                  value={bookingData.date}
                  onChange={handleBookingChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Time</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                  name="time"
                  value={bookingData.time}
                  onChange={handleBookingChange}
                >
                  <option value="">Select time</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">2:00 PM</option>
                  <option value="03:00 PM">3:00 PM</option>
                  <option value="04:00 PM">4:00 PM</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Consultation Type</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 resize-y"
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleBookingChange}
                  rows="2"
                  placeholder="Brief description of your consultation needs..."
                />
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
                  Your consultation information will be handled confidentially and only shared with the professional you are booking.
                </p>
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
                disabled={processing || !bookingData.date || !bookingData.time || !bookingData.topic}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Professional Profile</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowProfileModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {selectedProfessional.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-[#1A2A3A] text-lg">{selectedProfessional.name}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(selectedProfessional.type)}`}>
                      {getTypeLabel(selectedProfessional.type)}
                    </span>
                    {selectedProfessional.verified && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#94A3B8]">{selectedProfessional.county}</p>
                </div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Experience</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedProfessional.experience}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Languages</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedProfessional.languages?.join(', ')}</span>
                </div>
                {selectedProfessional.institution && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Institution</span>
                    <span className="font-semibold text-[#1A2A3A] text-right max-w-[60%]">{selectedProfessional.institution}</span>
                  </div>
                )}
                {selectedProfessional.verified && selectedProfessional.verificationDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Verified</span>
                    <span className="font-semibold text-[#1A2A3A]">{selectedProfessional.verificationDate}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Rating</span>
                  <span className="font-semibold text-[#C9A84C]">★ {selectedProfessional.rating} ({selectedProfessional.reviews} reviews)</span>
                </div>
                {selectedProfessional.fee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Fee</span>
                    <span className="font-semibold text-[#1769AA]">{formatCurrency(selectedProfessional.fee)}/hour</span>
                  </div>
                )}
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#1A2A3A] mb-2">About</h4>
                <p className="text-sm text-[#5A6A7A] leading-relaxed">{selectedProfessional.bio}</p>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#1A2A3A] mb-2">Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfessional.expertise.map((exp, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-white text-[#5A6A7A] border border-[#E8EEF4]">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA] transition-all duration-200"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
                {selectedProfessional.available && (
                  <button
                    className="flex-1 px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
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
                <div className="text-sm text-[#94A3B8]">Consultation booked with</div>
                <div className="text-xl font-bold text-[#1A2A3A]">{selectedProfessional?.name}</div>
                <div className="text-sm text-[#94A3B8] mt-1">{bookingData.date} at {bookingData.time}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] leading-relaxed">
                  You will receive a confirmation with details. The professional will contact you regarding your consultation.
                </p>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "And whoever is granted wisdom has indeed been granted great good." — Quran 2:269
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

export default Kadhis;