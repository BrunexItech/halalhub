import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HearseProviderDashboard = ({ user }) => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0
  });
  
  // Requests
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Profile
  const [profile, setProfile] = useState({
    businessName: '',
    phone: '',
    email: '',
    serviceArea: '',
    isVerified: false,
    status: 'pending'
  });

  // ===== FETCH DATA =====
  useEffect(() => {
    fetchProfile();
    fetchRequests();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
      setProfile({
        businessName: userData.fullName || userData.business_name || 'Hearse Provider',
        phone: userData.phone || '',
        email: userData.email || '',
        serviceArea: userData.region || 'Nairobi',
        isVerified: false,
        status: 'pending'
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Mock data - replace with real API call
      const mockRequests = [
        { 
          id: 'HR-2024-001', 
          serviceType: 'hearse_transport', 
          status: 'pending', 
          date: '2024-04-15', 
          time: '10:00 AM',
          pickupLocation: 'Nairobi, Jamhuri Estate',
          destination: 'Langata Cemetery',
          contactPerson: 'Ahmed Hassan',
          contactPhone: '+254712345678',
          urgency: 'urgent'
        },
        { 
          id: 'HR-2024-002', 
          serviceType: 'shroud', 
          status: 'in_progress', 
          date: '2024-04-14', 
          time: '02:00 PM',
          pickupLocation: 'Nairobi CBD',
          destination: 'N/A',
          contactPerson: 'Fatima Noor',
          contactPhone: '+254798765432',
          urgency: 'standard'
        },
        { 
          id: 'HR-2024-003', 
          serviceType: 'complete_service', 
          status: 'completed', 
          date: '2024-04-12', 
          time: '08:00 AM',
          pickupLocation: 'Kisumu, Milimani',
          destination: 'Kisumu Cemetery',
          contactPerson: 'Omar Ibrahim',
          contactPhone: '+254723456789',
          urgency: 'standard'
        },
        { 
          id: 'HR-2024-004', 
          serviceType: 'hearse_transport', 
          status: 'pending', 
          date: '2024-04-16', 
          time: '11:30 AM',
          pickupLocation: 'Mombasa, Nyali',
          destination: 'Kikambala Cemetery',
          contactPerson: 'Aisha Mohamed',
          contactPhone: '+254734567890',
          urgency: 'standard'
        }
      ];
      
      setRequests(mockRequests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - replace with real API call
      setStats({
        totalRequests: 4,
        pendingRequests: 2,
        inProgressRequests: 1,
        completedRequests: 1
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // ===== REQUEST ACTIONS =====
  const handleAcceptRequest = async (requestId) => {
    setLoading(true);
    setError('');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'in_progress' } : req
      ));
      
      setSuccess('Request accepted successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      await fetchStats();
    } catch (err) {
      setError('Failed to accept request');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    setLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'completed' } : req
      ));
      
      setSuccess('Request marked as completed');
      setTimeout(() => setSuccess(''), 3000);
      
      await fetchStats();
    } catch (err) {
      setError('Failed to complete request');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleContactClient = (phone) => {
    window.open(`tel:${phone}`, '_blank');
  };

  // ===== FILTERS =====
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  // ===== HELPERS =====
  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      'in_progress': 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]',
      'completed': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]',
      'cancelled': 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
    };
    const labels = {
      'pending': 'Pending',
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
  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* ===== HEADER ===== */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[26px] md:text-[30px] font-semibold text-[#1F2937]">Hearse Provider Dashboard</h1>
            <p className="text-[15px] text-[#6B7280] mt-0.5">
              Manage funeral service requests and client communications
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[13px] font-medium text-[#0B342B] bg-white px-3 py-1.5 rounded-full border border-[#E8EEF4]">
              {profile.businessName}
            </span>
            <span className={`text-[13px] font-medium px-3 py-1.5 rounded-full border ${
              profile.isVerified ? 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]' : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
            }`}>
              {profile.isVerified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>

        {/* ===== ERROR / SUCCESS ===== */}
        {error && (
          <div className="mb-4 p-4 bg-white border border-[#DC2626]/20 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <span className="text-[15px] text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-[13px] font-medium rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-white border border-[#3FAF73]/20 rounded-xl text-[15px] text-[#3FAF73] shadow-sm">
            {success}
          </div>
        )}

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-[14px] font-medium text-[#6B7280]">Total Requests</div>
            <div className="text-[28px] font-bold text-[#1F2937]">{stats.totalRequests}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-[14px] font-medium text-[#6B7280]">Pending</div>
            <div className="text-[28px] font-bold text-[#D97706]">{stats.pendingRequests}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-[14px] font-medium text-[#6B7280]">In Progress</div>
            <div className="text-[28px] font-bold text-[#3B82F6]">{stats.inProgressRequests}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-5">
            <div className="text-[14px] font-medium text-[#6B7280]">Completed</div>
            <div className="text-[28px] font-bold text-[#3FAF73]">{stats.completedRequests}</div>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] font-medium text-[#6B7280]">Filter:</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                    filter === status
                      ? 'bg-[#0B342B] text-white shadow-sm'
                      : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1]'
                  }`}
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'All' : 
                   status === 'in_progress' ? 'In Progress' : 
                   status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="ml-auto text-[13px] text-[#0B342B] hover:text-[#032A24] transition-colors font-medium"
              onClick={() => { fetchRequests(); fetchStats(); }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ===== REQUESTS LIST ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-[#F4F5F1]">
            <h2 className="text-[17px] font-semibold text-[#1F2937]">Service Requests</h2>
            <p className="text-[15px] text-[#6B7280]">{filteredRequests.length} request(s) found</p>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[15px] text-[#6B7280]">No requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="bg-[#FAFAF7]">
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Service</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-[#6B7280] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F5F1]">
                  {filteredRequests.map((request) => {
                    const status = getStatusBadge(request.status);
                    return (
                      <tr key={request.id} className="hover:bg-[#FAFAF7] transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-[13px] text-[#6B7280]">{request.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[#1F2937]">{getServiceLabel(request.serviceType)}</span>
                          {request.urgency === 'urgent' && (
                            <span className="ml-1 text-[12px] px-1.5 py-0.5 bg-[#FEE2E2] text-[#DC2626] rounded-full font-medium">Urgent</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-[#1F2937]">{request.contactPerson}</div>
                            <div className="text-[13px] text-[#6B7280]">{request.contactPhone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-[#1F2937]">{formatDate(request.date)}</div>
                            <div className="text-[13px] text-[#6B7280]">{request.time}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[13px] px-2 py-0.5 rounded-full border font-medium ${status.style}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="px-3 py-1 bg-[#FAFAF7] text-[#1F2937] text-[13px] font-medium rounded-lg hover:bg-[#F4F5F1] transition-colors border border-[#E8EEF4]"
                              onClick={() => handleViewRequest(request)}
                            >
                              View
                            </button>
                            {request.status === 'pending' && (
                              <button
                                className="px-3 py-1 bg-[#3FAF73] text-white text-[13px] font-medium rounded-lg hover:bg-[#2D8F5E] transition-colors shadow-sm"
                                onClick={() => handleAcceptRequest(request.id)}
                                disabled={loading}
                              >
                                Accept
                              </button>
                            )}
                            {request.status === 'in_progress' && (
                              <button
                                className="px-3 py-1 bg-[#3B82F6] text-white text-[13px] font-medium rounded-lg hover:bg-[#2563EB] transition-colors shadow-sm"
                                onClick={() => handleCompleteRequest(request.id)}
                                disabled={loading}
                              >
                                Complete
                              </button>
                            )}
                            <button
                              className="px-3 py-1 bg-[#0B342B] text-white text-[13px] font-medium rounded-lg hover:bg-[#032A24] transition-colors shadow-sm"
                              onClick={() => handleContactClient(request.contactPhone)}
                            >
                              Call
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== PROFILE CARD ===== */}
        <div className="mt-6 bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6">
          <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Provider Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wider">Business Name</p>
              <p className="text-[15px] font-semibold text-[#1F2937]">{profile.businessName}</p>
            </div>
            <div>
              <p className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wider">Phone</p>
              <p className="text-[15px] font-semibold text-[#1F2937]">{profile.phone}</p>
            </div>
            <div>
              <p className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wider">Email</p>
              <p className="text-[15px] font-semibold text-[#1F2937]">{profile.email}</p>
            </div>
            <div>
              <p className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wider">Service Area</p>
              <p className="text-[15px] font-semibold text-[#1F2937]">{profile.serviceArea}</p>
            </div>
          </div>
        </div>

        {/* ===== ISLAMIC GUIDANCE ===== */}
        <div className="mt-4 text-center">
          <p className="text-[13px] text-[#6B7280] tracking-wider">
            Serving the community with dignity and respect
          </p>
          <p className="text-[13px] text-[#6B7280] mt-1 italic">
            "Every soul shall taste death." — Quran 3:185
          </p>
        </div>
      </div>

      {/* ===== REQUEST DETAILS MODAL ===== */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Request Details</h3>
              <button 
                className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]"
                onClick={() => setShowRequestModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-3 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Request ID</span>
                  <span className="font-mono text-[13px] text-[#1F2937]">{selectedRequest.id}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Service Type</span>
                  <span className="font-semibold text-[#1F2937]">{getServiceLabel(selectedRequest.serviceType)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Status</span>
                  <span className={`text-[13px] px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(selectedRequest.status).style}`}>
                    {getStatusBadge(selectedRequest.status).label}
                  </span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Date</span>
                  <span className="font-semibold text-[#1F2937]">{formatDate(selectedRequest.date)}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Time</span>
                  <span className="font-semibold text-[#1F2937]">{selectedRequest.time}</span>
                </div>
                {selectedRequest.pickupLocation && (
                  <div className="flex justify-between text-[15px] border-t border-[#E8EEF4] pt-2">
                    <span className="text-[#6B7280]">Pickup Location</span>
                    <span className="font-semibold text-[#1F2937] text-right max-w-[60%]">{selectedRequest.pickupLocation}</span>
                  </div>
                )}
                {selectedRequest.destination && (
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Destination</span>
                    <span className="font-semibold text-[#1F2937] text-right max-w-[60%]">{selectedRequest.destination}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] border-t border-[#E8EEF4] pt-2">
                  <span className="text-[#6B7280]">Client</span>
                  <span className="font-semibold text-[#1F2937]">{selectedRequest.contactPerson}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Phone</span>
                  <span className="font-semibold text-[#1F2937]">{selectedRequest.contactPhone}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Urgency</span>
                  <span className={`font-semibold ${selectedRequest.urgency === 'urgent' ? 'text-[#DC2626]' : 'text-[#1F2937]'}`}>
                    {selectedRequest.urgency === 'urgent' ? 'Urgent' : 'Standard'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                {selectedRequest.status === 'pending' && (
                  <button
                    className="flex-1 px-4 py-2.5 bg-[#3FAF73] text-white font-medium rounded-xl hover:bg-[#2D8F5E] transition-colors shadow-sm text-[15px]"
                    onClick={() => {
                      handleAcceptRequest(selectedRequest.id);
                      setShowRequestModal(false);
                    }}
                    disabled={loading}
                  >
                    Accept Request
                  </button>
                )}
                {selectedRequest.status === 'in_progress' && (
                  <button
                    className="flex-1 px-4 py-2.5 bg-[#3B82F6] text-white font-medium rounded-xl hover:bg-[#2563EB] transition-colors shadow-sm text-[15px]"
                    onClick={() => {
                      handleCompleteRequest(selectedRequest.id);
                      setShowRequestModal(false);
                    }}
                    disabled={loading}
                  >
                    Mark Complete
                  </button>
                )}
                <button
                  className="flex-1 px-4 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-colors shadow-sm text-[15px]"
                  onClick={() => handleContactClient(selectedRequest.contactPhone)}
                >
                  Call Client
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-colors text-[15px]"
                  onClick={() => setShowRequestModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HearseProviderDashboard;