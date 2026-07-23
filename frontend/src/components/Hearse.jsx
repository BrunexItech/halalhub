import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Hearse = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Service selection
  const [selectedService, setSelectedService] = useState(null);
  const [requestData, setRequestData] = useState({
    serviceType: '',
    pickupLocation: '',
    destination: '',
    mosqueLocation: '',
    cemeteryLocation: '',
    contactPerson: '',
    contactPhone: '',
    scheduledDate: '',
    scheduledTime: '',
    urgency: 'standard',
    specialRequests: '',
    shroudType: 'adult_male',
    shroudQuantity: 1
  });
  
  // My requests
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requestId, setRequestId] = useState('');
  
  // Counties
  const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Garissa', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Kakamega'];

  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchMyRequests();
    // Set loading to false after initial data fetch
    setLoading(false);
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
    }
  };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      // Mock data
      setMyRequests([
        { 
          id: 'HR-2024-001', 
          serviceType: 'hearse_transport', 
          status: 'confirmed', 
          date: '2024-04-15', 
          amount: 5000,
          pickupLocation: 'Nairobi, Jamhuri Estate',
          destination: 'Langata Cemetery'
        },
        { 
          id: 'HR-2024-002', 
          serviceType: 'shroud', 
          status: 'completed', 
          date: '2024-04-10', 
          amount: 2500,
          pickupLocation: 'Nairobi CBD'
        }
      ]);
    } catch (err) {
      console.error('Requests error:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // ===== SERVICE SELECTION =====
  const services = [
    {
      id: 'hearse_transport',
      name: 'Islamic Hearse Transport',
      description: 'Dignified transport of the deceased from pickup location to mosque and cemetery.',
      icon: '🚗',
      price: 5000,
      fields: ['pickupLocation', 'destination', 'mosqueLocation', 'cemeteryLocation']
    },
    {
      id: 'shroud',
      name: 'Shroud / Kafan Services',
      description: 'Complete shroud (kafan) set for male, female, or child.',
      icon: '🧵',
      price: 2500,
      fields: ['shroudType', 'shroudQuantity']
    },
    {
      id: 'complete_service',
      name: 'Complete Funeral Service',
      description: 'Full funeral assistance including hearse, shroud, and burial coordination.',
      icon: '🕋',
      price: 8500,
      fields: ['pickupLocation', 'destination', 'mosqueLocation', 'cemeteryLocation', 'shroudType', 'shroudQuantity']
    }
  ];

  const shroudTypes = [
    { id: 'adult_male', label: 'Adult Male' },
    { id: 'adult_female', label: 'Adult Female' },
    { id: 'child', label: 'Child' }
  ];

  // ===== HANDLERS =====
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setRequestData({
      ...requestData,
      serviceType: service.id
    });
    setError('');
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestData({ ...requestData, [name]: value });
    setError('');
  };

  const handleRequestSubmit = () => {
    if (!selectedService) {
      setError('Please select a service.');
      return;
    }
    
    const requiredFields = selectedService.fields;
    for (const field of requiredFields) {
      if (!requestData[field]) {
        setError('Please fill in all required fields.');
        return;
      }
    }
    
    if (selectedService.id === 'hearse_transport' || selectedService.id === 'complete_service') {
      if (!requestData.pickupLocation || !requestData.destination) {
        setError('Please provide pickup and destination locations.');
        return;
      }
    }
    
    setShowConfirmModal(true);
  };

  const confirmRequest = async () => {
    setProcessing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newRequestId = 'HR' + Date.now().toString().slice(-8);
      setRequestId(newRequestId);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      
      // Add to my requests
      const newRequest = {
        id: newRequestId,
        serviceType: selectedService.id,
        status: 'submitted',
        date: new Date().toISOString().split('T')[0],
        amount: selectedService.price,
        pickupLocation: requestData.pickupLocation || 'N/A',
        destination: requestData.destination || 'N/A'
      };
      setMyRequests([newRequest, ...myRequests]);
      
      setSuccess('Service request submitted successfully.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'submitted': 'bg-blue-50 text-blue-700 border-blue-200',
      'confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'in_progress': 'bg-amber-50 text-amber-700 border-amber-200',
      'completed': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    const labels = {
      'submitted': 'Submitted',
      'confirmed': 'Confirmed',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return { style: styles[status] || styles.submitted, label: labels[status] || status };
  };

  const getServiceLabel = (type) => {
    const labels = {
      'hearse_transport': 'Hearse Transport',
      'shroud': 'Shroud / Kafan',
      'complete_service': 'Complete Funeral Service'
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading services...</p>
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
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Islamic Services</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">24/7 Support</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Islamic Funeral Services
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Dignified and respectful funeral assistance. Available 24/7 to support you during difficult times.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                24/7 Support Available
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ===== LEFT COLUMN - SERVICES ===== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service Selection */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1A2A3A] mb-4">Select a Service</h2>
              <div className="space-y-3">
                {services.map((service) => (
                  <div 
                    key={service.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedService?.id === service.id 
                        ? 'border-[#1769AA] bg-[#F1F7FC]' 
                        : 'border-[#E8EEF4] hover:border-[#1769AA]/40'
                    }`}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{service.icon}</span>
                        <div>
                          <h3 className="font-semibold text-[#1A2A3A]">{service.name}</h3>
                          <p className="text-sm text-[#94A3B8]">{service.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#1769AA]">{formatCurrency(service.price)}</div>
                        {selectedService?.id === service.id && (
                          <span className="text-xs text-emerald-600">Selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Form */}
            {selectedService && (
              <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
                <h3 className="text-sm font-bold text-[#1A2A3A] mb-4">Service Details</h3>
                <div className="space-y-4">
                  
                  {/* Common fields */}
                  {(selectedService.id === 'hearse_transport' || selectedService.id === 'complete_service') && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Pickup Location</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                          name="pickupLocation"
                          value={requestData.pickupLocation}
                          onChange={handleRequestChange}
                          placeholder="Enter pickup location"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Mosque Location (Optional)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                          name="mosqueLocation"
                          value={requestData.mosqueLocation}
                          onChange={handleRequestChange}
                          placeholder="Enter mosque location"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Cemetery Location</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                          name="cemeteryLocation"
                          value={requestData.cemeteryLocation}
                          onChange={handleRequestChange}
                          placeholder="Enter cemetery location"
                        />
                      </div>
                    </>
                  )}

                  {/* Shroud fields */}
                  {(selectedService.id === 'shroud' || selectedService.id === 'complete_service') && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Shroud Type</label>
                        <select
                          className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                          name="shroudType"
                          value={requestData.shroudType}
                          onChange={handleRequestChange}
                        >
                          {shroudTypes.map((type) => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Quantity</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                          name="shroudQuantity"
                          value={requestData.shroudQuantity}
                          onChange={handleRequestChange}
                          min="1"
                          max="10"
                        />
                      </div>
                    </>
                  )}

                  {/* Contact Info */}
                  <div>
                    <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Contact Person</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                      name="contactPerson"
                      value={requestData.contactPerson}
                      onChange={handleRequestChange}
                      placeholder="Enter contact person"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Contact Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                      name="contactPhone"
                      value={requestData.contactPhone}
                      onChange={handleRequestChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                        name="scheduledDate"
                        value={requestData.scheduledDate}
                        onChange={handleRequestChange}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Time</label>
                      <input
                        type="time"
                        className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                        name="scheduledTime"
                        value={requestData.scheduledTime}
                        onChange={handleRequestChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Urgency</label>
                    <select
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                      name="urgency"
                      value={requestData.urgency}
                      onChange={handleRequestChange}
                    >
                      <option value="standard">Standard</option>
                      <option value="urgent">Urgent (Priority Response)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Special Requests</label>
                    <textarea
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 resize-y"
                      name="specialRequests"
                      value={requestData.specialRequests}
                      onChange={handleRequestChange}
                      rows="2"
                      placeholder="Any special requirements or instructions..."
                    />
                  </div>

                  <button
                    className="w-full py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20"
                    onClick={handleRequestSubmit}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-6">
            
            {/* Emergency Contact */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Emergency Contact</h3>
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-center">
                <div className="text-sm text-[#DC2626] font-semibold">24/7 Support Hotline</div>
                <div className="text-2xl font-bold text-[#DC2626] mt-1">0800 720 720</div>
                <p className="text-xs text-[#94A3B8] mt-2">Available 24 hours a day, 7 days a week</p>
              </div>
            </div>

            {/* Islamic Guidance */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Islamic Guidance</h3>
              <div className="space-y-3">
                <p className="text-sm text-[#5A6A7A] leading-relaxed">
                  "Every soul shall taste death." — Quran 3:185
                </p>
                <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                  <p className="text-lg font-arabic text-[#1A2A3A]">إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Inna lillahi wa inna ilayhi raji'un</p>
                  <p className="text-xs text-[#94A3B8]">"To Allah we belong and to Him we shall return"</p>
                </div>
              </div>
            </div>

            {/* My Requests */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1A2A3A]">My Requests</h3>
                <button 
                  className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                  onClick={fetchMyRequests}
                >
                  Refresh
                </button>
              </div>

              {loadingRequests ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#94A3B8]">No requests yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myRequests.map((request) => {
                    const status = getStatusBadge(request.status);
                    return (
                      <div key={request.id} className="p-3 bg-[#F1F7FC] rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-[#1A2A3A] text-sm">{getServiceLabel(request.serviceType)}</div>
                            <div className="text-xs text-[#94A3B8]">{request.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#1769AA]">{formatCurrency(request.amount)}</div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.style}`}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONFIRMATION MODAL ===== */}
      {showConfirmModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Request</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowConfirmModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-2xl">{selectedService.icon}</div>
                <div className="font-bold text-[#1A2A3A]">{selectedService.name}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                {requestData.pickupLocation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Pickup</span>
                    <span className="font-semibold text-[#1A2A3A]">{requestData.pickupLocation}</span>
                  </div>
                )}
                {requestData.destination && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Destination</span>
                    <span className="font-semibold text-[#1A2A3A]">{requestData.destination}</span>
                  </div>
                )}
                {requestData.contactPerson && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Contact</span>
                    <span className="font-semibold text-[#1A2A3A]">{requestData.contactPerson}</span>
                  </div>
                )}
                {requestData.shroudType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Shroud Type</span>
                    <span className="font-semibold text-[#1A2A3A]">{shroudTypes.find(t => t.id === requestData.shroudType)?.label}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#1A2A3A] font-semibold">Total</span>
                  <span className="text-[#1769AA] font-bold">{formatCurrency(selectedService.price)}</span>
                </div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <p className="text-sm text-[#5A6A7A] leading-relaxed">
                  A service provider will contact you shortly to confirm the details and coordinate the service.
                </p>
              </div>

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmRequest}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Request'
                )}
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
                <h3 className="text-lg font-bold text-white">Request Submitted</h3>
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
                <div className="text-sm text-[#94A3B8]">Your request has been submitted</div>
                <div className="text-xl font-bold text-[#1A2A3A]">Reference: {requestId}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] leading-relaxed">
                  A service provider will contact you within 10 minutes to confirm the details.
                </p>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "Every soul shall taste death." — Quran 3:185
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

export default Hearse;