import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BankAdmin = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Accounts
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  
  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [txStats, setTxStats] = useState({
    totalTransactions: 0,
    totalDeposits: 0,
    totalTransfers: 0,
    totalWithdrawals: 0,
    totalFeesCollected: 0
  });
  
  // Filters
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txStatusFilter, setTxStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  // Deposit Modal
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAccount, setDepositAccount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReference, setDepositReference] = useState('');
  
  // Modals
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // ===== FETCH DATA =====
  useEffect(() => {
    if (token) {
      fetchBankData();
    } else {
      navigate('/admin');
    }
  }, [token]);

  const fetchBankData = async () => {
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [accountsRes, txRes] = await Promise.all([
        axios.get(`${API_BASE}/bank/admin/accounts?limit=200`, config),
        axios.get(`${API_BASE}/bank/admin/transactions?limit=200`, config)
      ]);
      
      if (accountsRes.data.success) {
        setAccounts(accountsRes.data.accounts || []);
        setTotalBalance(accountsRes.data.totalBalance || 0);
        setTotalAccounts(accountsRes.data.totalAccounts || 0);
      }
      
      if (txRes.data.success) {
        setTransactions(txRes.data.transactions || []);
        setTxStats(txRes.data.stats || {});
      }
      
    } catch (err) {
      console.error('Error fetching bank data:', err);
      setError('Failed to load bank data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // ===== DEPOSIT FUNCTION =====
  const handleDeposit = async () => {
    if (!depositAccount || !depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid account number and amount');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE}/bank/deposit`, {
        accountNumber: depositAccount,
        amount: parseFloat(depositAmount),
        reference: depositReference || `ADMIN-DEP-${Date.now()}`
      }, config);
      
      if (response.data.success) {
        setSuccess(`KES ${depositAmount} deposited successfully to account ${depositAccount}`);
        setShowDepositModal(false);
        setDepositAccount('');
        setDepositAmount('');
        setDepositReference('');
        await fetchBankData();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data.error || 'Deposit failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process deposit');
    } finally {
      setProcessing(false);
    }
  };

  // ===== FILTER FUNCTIONS =====
  const filteredTransactions = transactions.filter(tx => {
    const matchesType = txTypeFilter === 'all' || tx.type === txTypeFilter;
    const matchesStatus = txStatusFilter === 'all' || tx.status === txStatusFilter;
    const matchesSearch = 
      (tx.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.from_account || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.to_account || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.from_user || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.to_user || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // ===== HELPERS =====
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadge = (type) => {
    const types = {
      'deposit': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Deposit' },
      'transfer': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Transfer' },
      'withdrawal': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Withdrawal' },
      'fee': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Fee' }
    };
    return types[type] || { bg: 'bg-gray-50', text: 'text-gray-500', label: type || 'Unknown' };
  };

  const getStatusBadge = (status) => {
    const statuses = {
      'completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
      'pending': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
      'failed': { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' }
    };
    return statuses[status] || { bg: 'bg-gray-50', text: 'text-gray-500', label: status || 'Unknown' };
  };

  const viewAccount = (account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);
  };

  const viewTransaction = (tx) => {
    setSelectedTransaction(tx);
    setShowTxModal(true);
  };

  const openDepositModal = (accountNumber = '') => {
    setDepositAccount(accountNumber);
    setDepositAmount('');
    setDepositReference('');
    setShowDepositModal(true);
  };

  // SVG Icons
  const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const AccountsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const TransactionIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const DepositIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading bank data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">Bank Admin</h1>
              <span className="text-xs font-semibold bg-[#1769AA]/10 text-[#1769AA] px-2 py-1 rounded-full">Sandbox</span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-0.5">Monitor virtual accounts, transactions, and fees</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition flex items-center gap-2"
              onClick={() => openDepositModal()}
            >
              <DepositIcon /> Deposit
            </button>
            <button 
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition text-sm flex items-center gap-2"
              onClick={fetchBankData}
            >
              <RefreshIcon /> Refresh
            </button>
            <button 
              className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-semibold"
              onClick={() => navigate('/admin')}
            >
              Back to Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center text-sm text-red-600">
            <span>{error}</span>
            <button onClick={() => { setError(''); }} className="text-red-400 hover:text-red-600"><CloseIcon /></button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-sm text-emerald-600">
            <span>{success}</span>
            <button onClick={() => { setSuccess(''); }} className="text-emerald-400 hover:text-emerald-600"><CloseIcon /></button>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-[#1A2A3A]"><AccountsIcon /></div>
            <div className="text-2xl font-heading font-bold text-[#1A2A3A]">{totalAccounts}</div>
            <div className="text-xs text-[#94A3B8]">Total Accounts</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-emerald-600"><MoneyIcon /></div>
            <div className="text-2xl font-heading font-bold text-emerald-600">{formatCurrency(totalBalance)}</div>
            <div className="text-xs text-[#94A3B8]">Total Balance</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-blue-600"><TransactionIcon /></div>
            <div className="text-2xl font-heading font-bold text-blue-600">{txStats.totalTransactions || 0}</div>
            <div className="text-xs text-[#94A3B8]">Transactions</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-emerald-600"><MoneyIcon /></div>
            <div className="text-2xl font-heading font-bold text-emerald-600">{formatCurrency(txStats.totalDeposits || 0)}</div>
            <div className="text-xs text-[#94A3B8]">Total Deposits</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-purple-600"><MoneyIcon /></div>
            <div className="text-2xl font-heading font-bold text-purple-600">{formatCurrency(txStats.totalFeesCollected || 0)}</div>
            <div className="text-xs text-[#94A3B8]">Fees Collected</div>
          </div>
        </div>

        {/* ACCOUNTS SECTION */}
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Virtual Accounts</h3>
            <span className="text-sm text-[#94A3B8]">{accounts.length} accounts</span>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No virtual accounts created yet</p>
              <p className="text-sm text-[#94A3B8] mt-1">Accounts will appear when users register</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Account</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Currency</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Balance</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                      <td className="px-3 py-2 font-mono text-xs text-[#94A3B8]">{account.account_number}</td>
                      <td className="px-3 py-2">
                        <div>
                          <div className="font-semibold text-[#1A2A3A]">{account.user_name || 'Unknown'}</div>
                          <div className="text-xs text-[#94A3B8]">{account.user_phone || ''}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-xs text-[#94A3B8]">{account.currency || 'KES'}</td>
                      <td className="px-3 py-2 font-bold text-[#1769AA]">{formatCurrency(account.balance)}</td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${account.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                            onClick={() => viewAccount(account)}
                          >
                            View
                          </button>
                          <button
                            className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded hover:bg-emerald-600 hover:text-white transition"
                            onClick={() => openDepositModal(account.account_number)}
                          >
                            Deposit
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

        {/* TRANSACTIONS SECTION */}
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Transactions</h3>
            <span className="text-sm text-[#94A3B8]">{filteredTransactions.length} transactions</span>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <input
              type="text"
              className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
              placeholder="Search by reference or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
              value={txTypeFilter}
              onChange={(e) => setTxTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="transfer">Transfers</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="fee">Fees</option>
            </select>
            <select
              className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
              value={txStatusFilter}
              onChange={(e) => setTxStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No transactions found</p>
              <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Reference</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">From</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">To</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Fee</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const typeBadge = getTypeBadge(tx.type);
                    const statusBadge = getStatusBadge(tx.status);
                    const isFee = tx.type === 'fee';
                    return (
                      <tr key={tx.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2 font-mono text-xs text-[#94A3B8]">{tx.reference || 'N/A'}</td>
                        <td className="px-3 py-2 text-xs text-[#94A3B8]">{tx.from_account || tx.from_user || '—'}</td>
                        <td className="px-3 py-2 hidden md:table-cell text-xs text-[#94A3B8]">{tx.to_account || tx.to_user || '—'}</td>
                        <td className="px-3 py-2 font-bold text-[#1769AA]">{formatCurrency(tx.amount)}</td>
                        <td className={`px-3 py-2 text-xs font-semibold ${isFee ? 'text-purple-600' : 'text-[#94A3B8]'}`}>
                          {tx.fee > 0 ? formatCurrency(tx.fee) : '—'}
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeBadge.bg} ${typeBadge.text}`}>
                            {typeBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                            onClick={() => viewTransaction(tx)}
                          >
                            View
                          </button>
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

      {/* ===== DEPOSIT MODAL ===== */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDepositModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Manual Deposit</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowDepositModal(false)}><CloseIcon /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                This will manually credit a user's virtual account. Use this for testing or when users deposit via bank transfer.
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Account Number *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition font-mono"
                  value={depositAccount}
                  onChange={(e) => setDepositAccount(e.target.value)}
                  placeholder="HH-XXXXXXXXXX"
                />
                <p className="text-xs text-[#94A3B8] mt-1">Enter the account number from the accounts list above</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Amount (KES) *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Reference (Optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={depositReference}
                  onChange={(e) => setDepositReference(e.target.value)}
                  placeholder="e.g., Bank Transfer - John Doe"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowDepositModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:opacity-60"
                  onClick={handleDeposit}
                  disabled={processing || !depositAccount || !depositAmount}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Process Deposit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACCOUNT DETAIL MODAL ===== */}
      {showAccountModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAccountModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Account Details</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAccountModal(false)}><CloseIcon /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Account Number</span>
                  <span className="font-mono font-semibold text-[#1A2A3A]">{selectedAccount.account_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">User</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedAccount.user_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Phone</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedAccount.user_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Email</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedAccount.user_email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Currency</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedAccount.currency || 'KES'}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#94A3B8]">Balance</span>
                  <span className="font-bold text-[#1769AA] text-lg">{formatCurrency(selectedAccount.balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Status</span>
                  <span className={`font-semibold ${selectedAccount.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                    {selectedAccount.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Created</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(selectedAccount.createdat)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition"
                  onClick={() => setShowAccountModal(false)}
                >
                  Close
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                  onClick={() => {
                    setShowAccountModal(false);
                    openDepositModal(selectedAccount.account_number);
                  }}
                >
                  Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRANSACTION DETAIL MODAL ===== */}
      {showTxModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTxModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Transaction Details</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowTxModal(false)}><CloseIcon /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Reference</span>
                  <span className="font-mono font-semibold text-[#1A2A3A]">{selectedTransaction.reference || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Type</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTypeBadge(selectedTransaction.type).bg} ${getTypeBadge(selectedTransaction.type).text}`}>
                    {getTypeBadge(selectedTransaction.type).label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(selectedTransaction.status).bg} ${getStatusBadge(selectedTransaction.status).text}`}>
                    {getStatusBadge(selectedTransaction.status).label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">From</span>
                  <span className="font-semibold text-[#1A2A3A]">
                    {selectedTransaction.from_user || selectedTransaction.from_account || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">To</span>
                  <span className="font-semibold text-[#1A2A3A]">
                    {selectedTransaction.to_user || selectedTransaction.to_account || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#94A3B8]">Amount</span>
                  <span className="font-bold text-[#1769AA] text-lg">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
                {selectedTransaction.fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Fee</span>
                    <span className="font-semibold text-purple-600">{formatCurrency(selectedTransaction.fee)}</span>
                  </div>
                )}
                {selectedTransaction.description && (
                  <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[#94A3B8]">Description</span>
                    <span className="font-semibold text-[#1A2A3A] text-right max-w-[60%]">{selectedTransaction.description}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">External Reference</span>
                  <span className="font-mono text-xs text-[#94A3B8]">{selectedTransaction.external_reference || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Date</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(selectedTransaction.createdat)}</span>
                </div>
              </div>
              <button
                className="w-full px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition"
                onClick={() => setShowTxModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAdmin;