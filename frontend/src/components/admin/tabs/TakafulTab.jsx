import React from 'react';

const TakafulTab = ({
  takafulClaimStats,
  takafulClaims,
  takafulPlans,
  loadingTakaful,
  loading,
  takafulSubTab,
  setTakafulSubTab,
  formatCurrency,
  formatDate,
  getStatusBadge,
  approveTakafulClaim,
  rejectTakafulClaim,
  handleAddPlan,
  handleEditPlan,
  handleTogglePlanStatus,
  handleDeletePlan
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1A2A3A]">{takafulClaimStats.total}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Claims</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{takafulClaimStats.pending}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{takafulClaimStats.approved}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Approved</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{takafulClaimStats.rejected}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Rejected</div>
        </div>
        <div className="bg-[#1769AA]/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(takafulClaimStats.pendingAmount)}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending Amount</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(takafulClaimStats.approvedAmount)}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Approved Amount</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm">
        <button
          onClick={() => setTakafulSubTab('claims')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            takafulSubTab === 'claims' 
              ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
              : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
          }`}
        >
          Claims
          {takafulClaimStats.pending > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {takafulClaimStats.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setTakafulSubTab('plans')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            takafulSubTab === 'plans' 
              ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
              : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
          }`}
        >
          Plans
          {takafulPlans.length > 0 && (
            <span className="ml-2 bg-[#1769AA] text-white text-xs rounded-full px-2 py-0.5">
              {takafulPlans.length}
            </span>
          )}
        </button>
      </div>

      {/* Claims Tab */}
      {takafulSubTab === 'claims' && (
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Pending Takaful Claims</h3>
            <span className="text-sm text-[#94A3B8]">{takafulClaims.length} pending</span>
          </div>

          {loadingTakaful ? (
            <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
              <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          ) : takafulClaims.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No pending Takaful claims</p>
              <p className="text-sm text-[#94A3B8] mt-1">All claims have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Plan</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {takafulClaims.map((claim) => (
                    <tr key={claim.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                      <td className="px-3 py-3">
                        <div>
                          <div className="font-semibold text-[#1A2A3A]">{claim.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-[#94A3B8]">{claim.user?.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                          {claim.type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#1769AA]">{formatCurrency(claim.amount)}</td>
                      <td className="px-3 py-3 text-sm text-[#94A3B8]">{claim.policy?.planName || 'N/A'}</td>
                      <td className="px-3 py-3 text-xs text-[#94A3B8]">{formatDate(claim.submittedAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button 
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                            onClick={() => approveTakafulClaim(claim.id)}
                            disabled={loading}
                          >
                            Approve
                          </button>
                          <button 
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                            onClick={() => rejectTakafulClaim(claim.id)}
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
      )}

      {/* Plans Tab */}
      {takafulSubTab === 'plans' && (
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Takaful Plans</h3>
            <button
              className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-xl hover:bg-[#2F80C0] transition flex items-center gap-1"
              onClick={handleAddPlan}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Plan
            </button>
          </div>

          {loadingTakaful ? (
            <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
              <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          ) : takafulPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No Takaful plans created yet</p>
              <p className="text-sm text-[#94A3B8] mt-1">Click "Add Plan" to create one</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Monthly</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Annual</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Coverage</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {takafulPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                      <td className="px-3 py-3">
                        <div>
                          <div className="font-semibold text-[#1A2A3A]">{plan.name}</div>
                          {plan.description && (
                            <div className="text-xs text-[#94A3B8] line-clamp-1">{plan.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                          {plan.type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#1A2A3A]">{formatCurrency(plan.monthlyCost)}</td>
                      <td className="px-3 py-3 font-semibold text-[#1A2A3A]">{formatCurrency(plan.annualCost)}</td>
                      <td className="px-3 py-3 hidden md:table-cell text-sm text-[#94A3B8]">{formatCurrency(plan.maxCoverage)}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${plan.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                            onClick={() => handleEditPlan(plan)}
                          >
                            Edit
                          </button>
                          <button
                            className={`px-2 py-1 text-xs rounded hover:text-white transition ${
                              plan.isActive 
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-600' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600'
                            }`}
                            onClick={() => handleTogglePlanStatus(plan.id, plan.isActive)}
                            disabled={loading}
                          >
                            {plan.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded hover:bg-red-600 hover:text-white transition"
                            onClick={() => handleDeletePlan(plan.id)}
                            disabled={loading}
                          >
                            Delete
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
      )}
    </div>
  );
};

export default TakafulTab;