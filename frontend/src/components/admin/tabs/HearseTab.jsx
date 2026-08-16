import React from 'react';

const HearseTab = ({
  hearseStats,
  hearseSubTab,
  setHearseSubTab,
  hearseRequestFilter,
  setHearseRequestFilter,
  hearseProviderFilter,
  setHearseProviderFilter,
  filteredHearseRequests,
  filteredHearseProviders,
  hearseRequests,
  hearseProviders,
  loadingHearse,
  loading,
  formatDate,
  getStatusBadge,
  setAssignForm,
  setShowAssignModal,
  handleVerifyProvider
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1A2A3A]">{hearseStats.total}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Requests</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{hearseStats.pending}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{hearseStats.assigned}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Assigned</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{hearseStats.inProgress}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">In Progress</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{hearseStats.completed}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Completed</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm">
        <button
          onClick={() => setHearseSubTab('requests')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            hearseSubTab === 'requests' 
              ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
              : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
          }`}
        >
          Service Requests
          {hearseStats.pending > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {hearseStats.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setHearseSubTab('providers')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            hearseSubTab === 'providers' 
              ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
              : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
          }`}
        >
          Providers
          {hearseProviders.filter(p => p.verification_status === 'pending').length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {hearseProviders.filter(p => p.verification_status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Requests Tab */}
      {hearseSubTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
            <h4 className="text-sm font-semibold text-[#1A2A3A]">Service Requests</h4>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                value={hearseRequestFilter}
                onChange={(e) => setHearseRequestFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <span className="text-xs text-[#94A3B8]">{filteredHearseRequests.length} requests</span>
            </div>
          </div>

          {loadingHearse ? (
            <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
              <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              <span>Loading requests...</span>
            </div>
          ) : filteredHearseRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No requests found</p>
              <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Reference</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Service</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Pickup</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHearseRequests.map((req) => {
                    const statusBadge = getStatusBadge(req.status);
                    return (
                      <tr key={req.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2 font-mono text-xs text-[#94A3B8]">{req.reference || 'N/A'}</td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="font-medium text-[#1A2A3A]">{req.user_name || 'Unknown'}</div>
                            <div className="text-[#94A3B8]">{req.user_phone || ''}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-[#5A6A7A]">{req.service_type || 'N/A'}</td>
                        <td className="px-3 py-2 hidden md:table-cell text-xs text-[#94A3B8]">{req.pickup_location || 'N/A'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell text-xs text-[#94A3B8]">{formatDate(req.createdat)}</td>
                        <td className="px-3 py-2">
                          {req.status === 'pending' ? (
                            <button
                              className="px-3 py-1.5 bg-[#1769AA] text-white text-xs font-semibold rounded-lg hover:bg-[#2F80C0] transition"
                              onClick={() => {
                                setAssignForm({ requestId: req.id, providerId: '', notes: '' });
                                setShowAssignModal(true);
                              }}
                            >
                              Assign
                            </button>
                          ) : (
                            <span className="text-xs text-[#94A3B8]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Providers Tab */}
      {hearseSubTab === 'providers' && (
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
            <h4 className="text-sm font-semibold text-[#1A2A3A]">Hearse Providers</h4>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                value={hearseProviderFilter}
                onChange={(e) => setHearseProviderFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <span className="text-xs text-[#94A3B8]">{filteredHearseProviders.length} providers</span>
            </div>
          </div>

          {loadingHearse ? (
            <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
              <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              <span>Loading providers...</span>
            </div>
          ) : filteredHearseProviders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No providers found</p>
              <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Business</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Vehicle</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Service Area</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Verification</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Contact</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHearseProviders.map((provider) => {
                    const verificationBadge = provider.is_verified && provider.verification_status === 'approved' 
                      ? { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Verified' }
                      : provider.verification_status === 'pending'
                      ? { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' }
                      : { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' };
                    return (
                      <tr key={provider.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2">
                          <div>
                            <div className="font-semibold text-[#1A2A3A]">{provider.business_name || 'N/A'}</div>
                            <div className="text-xs text-[#94A3B8]">{provider.vendor_type || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="text-[#1A2A3A]">{provider.vehicle_type || 'N/A'}</div>
                            <div className="text-[#94A3B8]">{provider.vehicle_registration || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-xs text-[#94A3B8]">{provider.service_area || 'N/A'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${verificationBadge.bg} ${verificationBadge.text}`}>
                            {verificationBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <div className="text-xs">
                            <div className="text-[#1A2A3A]">{provider.phone || 'N/A'}</div>
                            <div className="text-[#94A3B8]">{provider.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            {provider.verification_status === 'pending' ? (
                              <>
                                <button
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded hover:bg-emerald-600 hover:text-white transition"
                                  onClick={() => handleVerifyProvider(provider.id, 'approved')}
                                  disabled={loading}
                                >
                                  Approve
                                </button>
                                <button
                                  className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded hover:bg-red-600 hover:text-white transition"
                                  onClick={() => handleVerifyProvider(provider.id, 'rejected')}
                                  disabled={loading}
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
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
      )}
    </div>
  );
};

export default HearseTab;