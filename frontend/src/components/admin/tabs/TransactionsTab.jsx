import React from 'react';

const TransactionsTab = ({
  loadingTransactions,
  txStats,
  txSearchQuery,
  setTxSearchQuery,
  txTypeFilter,
  setTxTypeFilter,
  txStatusFilter,
  setTxStatusFilter,
  txDateFrom,
  setTxDateFrom,
  txDateTo,
  setTxDateTo,
  filteredTransactions,
  formatDate,
  formatCurrency,
  getStatusBadge
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
        <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Transactions</h3>
        <span className="text-sm text-[#94A3B8]">{filteredTransactions.length} transactions</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <div className="bg-[#F1F7FC] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-[#1A2A3A]">{txStats.total}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-emerald-600">{txStats.completed}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Completed</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-amber-600">{txStats.pending}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-red-600">{txStats.failed}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Failed</div>
        </div>
        <div className="bg-[#1769AA]/10 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-[#1769AA]">{formatCurrency(txStats.totalAmount)}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Volume</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
        <input
          type="text"
          className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
          placeholder="Search by ID or user..."
          value={txSearchQuery}
          onChange={(e) => setTxSearchQuery(e.target.value)}
        />
        <select
          className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
          value={txTypeFilter}
          onChange={(e) => setTxTypeFilter(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="payment">Payment</option>
          <option value="refund">Refund</option>
          <option value="transfer">Transfer</option>
          <option value="zakat">Zakat</option>
          <option value="sadaqa">Sadaqa</option>
          <option value="pension">Pension</option>
          <option value="order">Order</option>
          <option value="booking">Booking</option>
          <option value="utility">Utility</option>
          <option value="consultation">Consultation</option>
        </select>
        <select
          className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
          value={txStatusFilter}
          onChange={(e) => setTxStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
          value={txDateFrom}
          onChange={(e) => setTxDateFrom(e.target.value)}
          placeholder="From"
        />
        <input
          type="date"
          className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
          value={txDateTo}
          onChange={(e) => setTxDateTo(e.target.value)}
          placeholder="To"
        />
      </div>

      {loadingTransactions ? (
        <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
          <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
          <span>Loading transactions...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#1A2A3A] font-semibold">No transactions found</p>
          <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1A2A3A]">
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Ref</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const statusBadge = getStatusBadge(tx.status);
                return (
                  <tr key={tx.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                    <td className="px-3 py-3 font-mono text-[10px] text-[#94A3B8]">{tx.id?.slice(0, 12) || 'N/A'}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs">
                        <div className="font-medium text-[#1A2A3A]">{tx.user_name || tx.user_id || 'Unknown'}</div>
                        <div className="text-[#94A3B8]">{tx.phone || ''}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-medium text-[#5A6A7A]">
                        {tx.type || 'unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#1A2A3A]">{formatCurrency(tx.amount || 0)}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs text-[#94A3B8]">{formatDate(tx.created_at || tx.createdAt || tx.date)}</td>
                    <td className="px-3 py-3 hidden lg:table-cell text-xs text-[#94A3B8] font-mono">{tx.reference || tx.checkout_request_id || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;