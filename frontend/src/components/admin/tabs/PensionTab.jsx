import React from 'react';

const PensionTab = ({
  pensionStats,
  pensionFilter,
  setPensionFilter,
  filteredPensionWithdrawals,
  loadingPension,
  loading,
  formatCurrency,
  formatDate,
  getStatusBadge,
  approvePensionWithdrawal,
  rejectPensionWithdrawal
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1A2A3A]">{pensionStats.total}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{pensionStats.pending}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{pensionStats.approved}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Approved</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{pensionStats.rejected}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Rejected</div>
        </div>
        <div className="bg-[#1769AA]/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(pensionStats.pendingAmount)}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending Amount</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(pensionStats.approvedAmount)}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Approved Amount</div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
          <h3 className="text-lg font-heading font-bold text-[#1A2A3A] flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Pension Withdrawal Requests
          </h3>
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
              value={pensionFilter}
              onChange={(e) => setPensionFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <span className="text-sm text-[#94A3B8]">{filteredPensionWithdrawals.length} requests</span>
          </div>
        </div>

        {loadingPension ? (
          <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
            <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : filteredPensionWithdrawals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#1A2A3A] font-semibold">No withdrawal requests found</p>
            <p className="text-sm text-[#94A3B8] mt-1">All requests have been processed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#1A2A3A]">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Leader</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Bank Account</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Requested</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPensionWithdrawals.map((withdrawal) => {
                  const statusBadge = getStatusBadge(withdrawal.status);
                  return (
                    <tr key={withdrawal.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                      <td className="px-3 py-3">
                        <div>
                          <div className="font-semibold text-[#1A2A3A]">{withdrawal.leader_name || 'Unknown'}</div>
                          <div className="text-xs text-[#94A3B8]">{withdrawal.leader_phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          {withdrawal.leader_type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#1769AA]">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="text-xs">
                          <div className="text-[#1A2A3A]">{withdrawal.bank_account || 'N/A'}</div>
                          <div className="text-[#94A3B8]">{withdrawal.bank_name || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell text-xs text-[#94A3B8]">
                        {formatDate(withdrawal.requested_at)}
                      </td>
                      <td className="px-3 py-3">
                        {withdrawal.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button 
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                              onClick={() => approvePensionWithdrawal(withdrawal.id)}
                              disabled={loading}
                            >
                              Approve
                            </button>
                            <button 
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                              onClick={() => rejectPensionWithdrawal(withdrawal.id)}
                              disabled={loading}
                            >
                              Reject
                            </button>
                          </div>
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
    </div>
  );
};

export default PensionTab;