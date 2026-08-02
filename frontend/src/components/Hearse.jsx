import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hearseService } from '../services/api';

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
    setError('');
    try {
      const response = await hearseService.getRequests();
      if (response.data.success) {
        setMyRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error('Requests error:', err);
      setError('Failed to load your requests. Please refresh.');
      setMyRequests([]);
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
      price: 0,
      fields: ['pickupLocation', 'destination', 'mosqueLocation', 'cemeteryLocation']
    },
    {
      id: 'shroud',
      name: 'Shroud / Kafan Services',
      description: 'Complete shroud (kafan) set for male, female, or child.',
      price: 0,
      fields: ['shroudType', 'shroudQuantity']
    },
    {
      id: 'complete_service',
      name: 'Complete Funeral Service',
      description: 'Full funeral assistance including hearse, shroud, and burial coordination.',
      price: 0,
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
      if (!requestData.pickupLocation) {
        setError('Please provide a pickup location.');
        return;
      }
    }
    
    setShowConfirmModal(true);
  };

  const confirmRequest = async () => {
    setProcessing(true);
    setError('');
    try {
      const payload = {
        serviceType: requestData.serviceType,
        pickupLocation: requestData.pickupLocation,
        destinationLocation: requestData.destination || '',
        mosqueLocation: requestData.mosqueLocation || '',
        cemeteryLocation: requestData.cemeteryLocation || '',
        shroudType: requestData.shroudType || '',
        shroudQuantity: parseInt(requestData.shroudQuantity) || 1,
        contactPerson: requestData.contactPerson || user?.fullName || '',
        contactPhone: requestData.contactPhone || user?.phone || '',
        scheduledDate: requestData.scheduledDate || '',
        scheduledTime: requestData.scheduledTime || '',
        urgency: requestData.urgency || 'standard',
        specialRequests: requestData.specialRequests || ''
      };

      const response = await hearseService.createRequest(payload);

      if (response.data.success) {
        const data = response.data.data;
        setRequestId(data.reference || 'HR-' + Date.now());
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        await fetchMyRequests();
        setSuccess('Service request submitted successfully.');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-[#FAFAF7] text-[#6B7280] border-[#E8EEF4]',
      'assigned': 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      'in_progress': 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      'completed': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]',
      'cancelled': 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
    };
    const labels = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return { style: styles[status] || styles.pending, label: labels[status] || status };
  };

  const getServiceLabel = (type) => {
    const labels = {
      'hearse_transport': 'Hearse Transport',
      'shroud': 'Shroud / Kafan',
      'complete_service': 'Complete Funeral Service'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading services...</p>
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
                <span className="text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">Islamic Services</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-[13px] font-medium text-[#C9A44B]/70">24/7 Support</span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Hearse & Shroud Services
              </h1>
              <p className="text-white/70 text-[15px] mt-3 max-w-lg leading-relaxed">
                Dignified and respectful funeral assistance. Available 24/7 to support you during difficult times.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#C9A44B] bg-white/10 px-4 py-2 rounded-xl border border-[#C9A44B]/20">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ===== LEFT COLUMN - SERVICES ===== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service Selection */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h2 className="text-[17px] font-semibold text-[#1F2937] mb-5">Select a Service</h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <div 
                    key={service.id}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedService?.id === service.id 
                        ? 'border-[#0B342B] bg-[#FAFAF7] shadow-md' 
                        : 'border-[#E8EEF4] hover:border-[#0B342B]/30'
                    }`}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FAFAF7] flex items-center justify-center text-[#0B342B] font-bold text-[17px] flex-shrink-0 border border-[#E8EEF4]">
                          {service.id === 'hearse_transport' ? 'H' : service.id === 'shroud' ? 'S' : 'C'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1F2937] text-[15px]">{service.name}</h3>
                          <p className="text-[14px] text-[#6B7280] mt-1">{service.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[15px] font-semibold text-[#0B342B]">Free Service</div>
                        {selectedService?.id === service.id && (
                          <span className="text-[13px] text-[#0B342B] font-medium">✓ Selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Form */}
            {selectedService && (
              <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 animate-fadeIn">
                <h3 className="text-[17px] font-semibold text-[#1F2937] mb-5">Service Details</h3>
                <div className="space-y-5">
                  
                  {/* Common fields */}
                  {(selectedService.id === 'hearse_transport' || selectedService.id === 'complete_service') && (
                    <>
                      <div>
                        <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Pickup Location *</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                          name="pickupLocation"
                          value={requestData.pickupLocation}
                          onChange={handleRequestChange}
                          placeholder="Enter pickup location"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Destination Location</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                          name="destination"
                          value={requestData.destination}
                          onChange={handleRequestChange}
                          placeholder="Enter destination location"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Mosque Location (Optional)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                          name="mosqueLocation"
                          value={requestData.mosqueLocation}
                          onChange={handleRequestChange}
                          placeholder="Enter mosque location"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Cemetery Location (Optional)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
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
                        <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Shroud Type *</label>
                        <select
                          className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
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
                        <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Quantity *</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Contact Person *</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        name="contactPerson"
                        value={requestData.contactPerson}
                        onChange={handleRequestChange}
                        placeholder="Enter contact person"
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Contact Phone *</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        name="contactPhone"
                        value={requestData.contactPhone}
                        onChange={handleRequestChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Scheduled Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        name="scheduledDate"
                        value={requestData.scheduledDate}
                        onChange={handleRequestChange}
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Scheduled Time</label>
                      <input
                        type="time"
                        className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        name="scheduledTime"
                        value={requestData.scheduledTime}
                        onChange={handleRequestChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Urgency</label>
                    <select
                      className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                      name="urgency"
                      value={requestData.urgency}
                      onChange={handleRequestChange}
                    >
                      <option value="standard">Standard</option>
                      <option value="urgent">Urgent (Priority Response)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Special Requests</label>
                    <textarea
                      className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white resize-y"
                      name="specialRequests"
                      value={requestData.specialRequests}
                      onChange={handleRequestChange}
                      rows="3"
                      placeholder="Any special requirements or instructions..."
                    />
                  </div>

                  <button
                    className="w-full py-3.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
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
              <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Emergency Contact</h3>
              <div className="bg-[#FEF2F2] border-2 border-[#DC2626]/20 rounded-xl p-5 text-center">
                <div className="text-[14px] text-[#DC2626] font-medium">24/7 Support Hotline</div>
                <div className="text-[28px] font-bold text-[#DC2626] mt-2">0800 720 720</div>
                <p className="text-[13px] text-[#6B7280] mt-2">Available 24 hours a day, 7 days a week</p>
              </div>
            </div>

            {/* Islamic Guidance */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Islamic Guidance</h3>
              <div className="space-y-4">
                <p className="text-[15px] text-[#6B7280] leading-relaxed">
                  "Every soul shall taste death." — Quran 3:185
                </p>
                <div className="bg-[#FAFAF7] rounded-xl p-5 text-center border border-[#E8EEF4]">
                  <p className="text-[20px] font-arabic text-[#1F2937] leading-relaxed">إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</p>
                  <p className="text-[14px] text-[#6B7280] mt-2">Inna lillahi wa inna ilayhi raji'un</p>
                  <p className="text-[13px] text-[#6B7280]">"To Allah we belong and to Him we shall return"</p>
                </div>
              </div>
            </div>

            {/* My Requests */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[17px] font-semibold text-[#1F2937]">My Requests</h3>
                <button 
                  className="text-[13px] text-[#0B342B] hover:text-[#032A24] transition-colors font-medium"
                  onClick={fetchMyRequests}
                >
                  Refresh
                </button>
              </div>

              {loadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin" />
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[15px] text-[#6B7280]">No requests yet</p>
                  <p className="text-[13px] text-[#6B7280] mt-1">Submit a request to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {myRequests.map((request) => {
                    const status = getStatusBadge(request.status);
                    return (
                      <div key={request.id} className="p-4 bg-[#FAFAF7] rounded-xl border border-[#E8EEF4] hover:bg-[#F4F5F1] transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#1F2937] text-[15px] truncate">
                              {getServiceLabel(request.service_type)}
                            </div>
                            <div className="text-[13px] text-[#6B7280] mt-0.5">
                              {formatDate(request.scheduled_date || request.createdat)}
                            </div>
                            <div className="text-[12px] text-[#6B7280] font-mono">
                              {request.reference}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-[12px] px-3 py-1 rounded-full border ${status.style} font-medium`}>
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Confirm Request</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]" onClick={() => setShowConfirmModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className="font-semibold text-[17px] text-[#1F2937]">{selectedService.name}</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                {requestData.pickupLocation && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Pickup</span>
                    <span className="font-semibold text-[#1F2937]">{requestData.pickupLocation}</span>
                  </div>
                )}
                {requestData.destination && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Destination</span>
                    <span className="font-semibold text-[#1F2937]">{requestData.destination}</span>
                  </div>
                )}
                {requestData.contactPerson && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Contact</span>
                    <span className="font-semibold text-[#1F2937]">{requestData.contactPerson}</span>
                  </div>
                )}
                {requestData.shroudType && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Shroud Type</span>
                    <span className="font-semibold text-[#1F2937]">{shroudTypes.find(t => t.id === requestData.shroudType)?.label}</span>
                  </div>
                )}
                {requestData.urgency && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Urgency</span>
                    <span className={`font-semibold ${requestData.urgency === 'urgent' ? 'text-[#DC2626]' : 'text-[#1F2937]'}`}>
                      {requestData.urgency === 'urgent' ? 'Urgent' : 'Standard'}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 text-center border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] leading-relaxed">
                  A service provider will contact you shortly to confirm the details and coordinate the service.
                </p>
              </div>

              {error && <p className="text-[15px] text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                onClick={confirmRequest}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] bg-[#0B342B] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-[22px] font-semibold text-white">Request Submitted</h3>
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
                <div className="text-[15px] text-[#6B7280]">Your request has been submitted</div>
                <div className="text-[22px] font-bold text-[#1F2937] mt-1">Reference: {requestId}</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] leading-relaxed">
                  A service provider will contact you within 10 minutes to confirm the details.
                </p>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] italic leading-relaxed">
                  "Every soul shall taste death." — Quran 3:185
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

export default Hearse;