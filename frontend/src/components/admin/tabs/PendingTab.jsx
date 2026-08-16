import React from 'react';

const PendingTab = ({
  pendingVendors,
  pendingLeaders,
  loadingPending,
  loading,
  filterLeaderType,
  setFilterLeaderType,
  approveVendor,
  rejectVendor,
  approveLeader,
  rejectLeader,
  formatDate,
  getLeaderTypeLabel,
  LEADER_TYPES
}) => {
  return (
    <div className="space-y-6">
      {/* Pending Vendors */}
      <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
          <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Pending Vendor Applications</h3>
          <span className="text-sm text-[#94A3B8]">{pendingVendors.length} pending</span>
        </div>

        {loadingPending ? (
          <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
            <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : pendingVendors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#1A2A3A] font-semibold">No pending vendor applications</p>
            <p className="text-sm text-[#94A3B8] mt-1">All vendors have been reviewed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#1A2A3A]">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Business</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Location</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Submitted</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                    <td className="px-3 py-3">
                      <div>
                        <div className="font-semibold text-[#1A2A3A]">{vendor.business_name || vendor.fullname}</div>
                        <div className="text-xs text-[#94A3B8]">KRA: {vendor.kra_pin || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs">
                        <div className="text-[#1A2A3A]">{vendor.email || 'N/A'}</div>
                        <div className="text-[#94A3B8]">{vendor.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#94A3B8]">{vendor.region || vendor.sub_county || 'N/A'}</td>
                    <td className="px-3 py-3 text-xs text-[#94A3B8]">{formatDate(vendor.createdat)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                          onClick={() => approveVendor(vendor)}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button 
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                          onClick={() => rejectVendor(vendor)}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Leaders */}
      <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
          <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Pending Leader Applications</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#94A3B8]">{pendingLeaders.length} pending</span>
            <select
              className="px-2 py-1 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
              value={filterLeaderType}
              onChange={(e) => setFilterLeaderType(e.target.value)}
            >
              <option value="All">All Types</option>
              {LEADER_TYPES.map((type) => (
                <option key={type} value={type}>{getLeaderTypeLabel(type)}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingPending ? (
          <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
            <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : pendingLeaders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#1A2A3A] font-semibold">No pending leader applications</p>
            <p className="text-sm text-[#94A3B8] mt-1">All applicants have been reviewed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#1A2A3A]">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Location</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Submitted</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaders.map((leader) => (
                  <tr key={leader.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                    <td className="px-3 py-3">
                      <div>
                        <div className="font-semibold text-[#1A2A3A]">{leader.fullname}</div>
                        <div className="text-xs text-[#94A3B8]">{leader.title || 'Religious Leader'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700">
                        {getLeaderTypeLabel(leader.leader_type)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#94A3B8]">{leader.location || 'N/A'}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs">
                        <div className="text-[#1A2A3A]">{leader.email || 'N/A'}</div>
                        <div className="text-[#94A3B8]">{leader.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#94A3B8]">{formatDate(leader.createdat)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                          onClick={() => approveLeader(leader)}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button 
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                          onClick={() => rejectLeader(leader)}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingTab;