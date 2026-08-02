import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Utilities = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Wallet (Virtual Account)
  const [balance, setBalance] = useState(0);
  const [accountNumber, setAccountNumber] = useState('');
  
  // Utilities
  const [utilities, setUtilities] = useState([]);
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Payment history
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Saved services
  const [savedServices, setSavedServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ nickname: '', accountNumber: '' });
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  // Quick amounts
  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // ===== FETCH DATA =====
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBalance(),
        fetchUtilities(),
        fetchPaymentHistory(),
        fetchSavedServices()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('halalhub_token');
      const response = await axios.get(`${API_BASE}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setBalance(response.data.balance || 0);
        setAccountNumber(response.data.accountNumber || '');
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      // If virtual account doesn't exist, try to create one
      if (err.response?.status === 404) {
        try {
          const token = localStorage.getItem('halalhub_token');
          await axios.post(`${API_BASE}/bank/accounts`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Retry fetching balance
          const retryResponse = await axios.get(`${API_BASE}/wallet/balance`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (retryResponse.data.success) {
            setBalance(retryResponse.data.balance || 0);
            setAccountNumber(retryResponse.data.accountNumber || '');
          }
        } catch (createErr) {
          console.error('Failed to create virtual account:', createErr);
        }
      }
    }
  };

  const fetchUtilities = async () => {
    try {
      const response = await axios.get(`${API_BASE}/utilities`);
      const utilitiesData = response.data.utilities || [];
      setUtilities(utilitiesData);
      if (utilitiesData.length > 0) {
        setSelectedUtility(utilitiesData[0]);
      }
    } catch (err) {
      console.error('Failed to load utilities:', err);
      setError('Failed to load utility providers. Please refresh.');
    }
  };

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('halalhub_token');
      const response = await axios.get(`${API_BASE}/utilities/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentHistory(response.data.history || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSavedServices = async () => {
    try {
      const token = localStorage.getItem('halalhub_token');
      const response = await axios.get(`${API_BASE}/utilities/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedServices(response.data.savedServices || []);
    } catch (err) {
      console.error('Failed to load saved services:', err);
    }
  };

  const handlePayment = (e) => {
    e.preventDefault();
    setValidationError('');
    
    if (!selectedUtility) {
      setValidationError('Please select a utility provider');
      return;
    }
    if (!accountNumberInput || accountNumberInput.length < 3) {
      setValidationError('Please enter a valid account number');
      return;
    }
    if (!amount || parseFloat(amount) < 10) {
      setValidationError('Please enter a valid amount (minimum KES 10)');
      return;
    }
    if (parseFloat(amount) > balance) {
      setValidationError(`Insufficient balance. Available: ${formatCurrency(balance)}`);
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      const token = localStorage.getItem('halalhub_token');
      const response = await axios.post(`${API_BASE}/utilities/pay`, {
        providerId: selectedUtility.id,
        accountNumber: accountNumberInput,
        amount: parseFloat(amount),
        paymentMethod: 'wallet'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        setPaymentStatus({
          utility: selectedUtility.name,
          account: accountNumberInput,
          amount: parseFloat(amount),
          paybill: selectedUtility.paybill,
          date: new Date().toLocaleString(),
          ref: data.transactionRef,
          status: 'completed',
          receipt: data.receiptNumber,
          balance: data.balance,
          accountNumber: data.accountNumber
        });
        
        setBalance(data.balance || 0);
        setShowConfirmModal(false);
        setShowReceiptModal(true);
        await fetchPaymentHistory();
        await fetchSavedServices();
        
        setSuccess(`Payment of KES ${parseFloat(amount).toLocaleString()} to ${selectedUtility.name} successful`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const closeReceipt = () => {
    setShowReceiptModal(false);
    setPaymentStatus(null);
    setSelectedUtility(utilities[0] || null);
    setAccountNumberInput('');
    setAmount('');
  };

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
  };

  const handleSavedServiceClick = (service) => {
    const utility = utilities.find(u => u.id === service.provider_id);
    if (utility) {
      setSelectedUtility(utility);
      setAccountNumberInput(service.account_number);
    }
  };

  const handleAddService = async () => {
    if (!newService.nickname || !newService.accountNumber || !selectedUtility) {
      setValidationError('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('halalhub_token');
      const response = await axios.post(`${API_BASE}/utilities/saved`, {
        providerId: selectedUtility.id,
        nickname: newService.nickname,
        accountNumber: newService.accountNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await fetchSavedServices();
        setShowAddService(false);
        setNewService({ nickname: '', accountNumber: '' });
        setSuccess('Service saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save service');
    }
  };

  const removeSavedService = async (id) => {
    try {
      const token = localStorage.getItem('halalhub_token');
      await axios.delete(`${API_BASE}/utilities/saved/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedServices(savedServices.filter(s => s.id !== id));
      setSuccess('Service removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove service');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'completed': 'bg-[#3FAF73]/10 text-[#3FAF73] border-[#3FAF73]/20',
      'pending': 'bg-[#C9A44B]/10 text-[#C9A44B] border-[#C9A44B]/20',
      'failed': 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20',
      'processing': 'bg-[#0B342B]/10 text-[#0B342B] border-[#0B342B]/20'
    };
    const labels = {
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed',
      'processing': 'Processing'
    };
    return { 
      style: styles[status] || styles.completed, 
      label: labels[status] || status 
    };
  };

  // SVG Icons
  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-8 h-8 text-[#3FAF73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );

  const WalletIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const BoltIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  const WaterIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const WifiIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  );

  const TvIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const BuildingIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  const getUtilityIcon = (category) => {
    switch(category) {
      case 'electricity': return <BoltIcon />;
      case 'water': return <WaterIcon />;
      case 'internet': return <WifiIcon />;
      case 'tv': return <TvIcon />;
      case 'government': return <BuildingIcon />;
      default: return <BoltIcon />;
    }
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4">Loading utility providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#032A24] rounded-2xl mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 p-6 md:p-8 lg:p-12 shadow-xl shadow-black/10 border border-[rgba(201,164,75,0.15)]">
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-36 md:w-48 h-36 md:h-48 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-[#B7C0BA] uppercase tracking-wider">Utilities</span>
                <span className="w-px h-4 bg-[rgba(201,164,75,0.2)]" />
                <span className="text-xs font-medium text-[#C9A44B]">Pay Your Bills</span>
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#F7F6F1] leading-tight">
                Manage Your Utility Payments
              </h1>
              <p className="text-[#B7C0BA] text-sm mt-1 md:mt-2 max-w-lg">
                Pay electricity, water, internet, TV, and county rates from your wallet.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-[#C9A44B] bg-white/10 px-3 py-1.5 rounded-full border border-[rgba(201,164,75,0.15)] whitespace-nowrap">
                Balance: {formatCurrency(balance)}
              </span>
              {accountNumber && (
                <span className="text-[10px] text-[#B7C0BA] bg-white/5 px-2 py-0.5 rounded-full">
                  Acc: {accountNumber}
                </span>
              )}
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
          
          {/* ===== LEFT COLUMN - PAYMENT FORM ===== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Payment Form */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-[#1F2937]">Pay a Utility</h2>
                <button 
                  className="text-xs text-[#0B342B] hover:text-[#12342D] transition-colors font-medium"
                  onClick={() => setShowAddService(!showAddService)}
                >
                  {showAddService ? 'Cancel' : '+ Save Service'}
                </button>
              </div>

              {/* Add Service Form */}
              {showAddService && (
                <div className="mb-4 p-4 bg-[#FAFAF7] rounded-xl border border-[rgba(11,52,43,0.06)]">
                  <h4 className="text-sm font-bold text-[#1F2937] mb-3">Save a Service</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                        Nickname
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-[rgba(11,52,43,0.12)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                        placeholder="e.g., Home Electricity"
                        value={newService.nickname}
                        onChange={(e) => setNewService({...newService, nickname: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                        Account / Meter Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-[rgba(11,52,43,0.12)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                        placeholder="Enter account number"
                        value={newService.accountNumber}
                        onChange={(e) => setNewService({...newService, accountNumber: e.target.value})}
                      />
                    </div>
                    <button
                      className="w-full py-2.5 bg-[#0B342B] text-[#F7F6F1] font-semibold rounded-xl hover:bg-[#12342D] transition-all duration-200"
                      onClick={handleAddService}
                    >
                      Save Service
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                    Select Utility
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-xl text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200 appearance-none"
                    value={selectedUtility?.id || ''}
                    onChange={(e) => {
                      const utility = utilities.find(u => u.id === e.target.value);
                      setSelectedUtility(utility);
                      setValidationError('');
                    }}
                    required
                  >
                    <option value="">Choose a utility...</option>
                    {utilities.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                    {selectedUtility?.fields?.[0] || 'Account Number'}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-xl text-[#1F2937] text-sm placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    placeholder={`Enter ${selectedUtility?.fields?.[0]?.toLowerCase() || 'account number'}`}
                    value={accountNumberInput}
                    onChange={(e) => {
                      setAccountNumberInput(e.target.value);
                      setValidationError('');
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                    Amount (KES)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickAmounts.map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                          parseFloat(amount) === val 
                            ? 'bg-[#0B342B] text-[#F7F6F1]' 
                            : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                        }`}
                        onClick={() => handleQuickAmount(val)}
                      >
                        {formatCurrency(val)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-xl text-[#1F2937] text-sm placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    placeholder="Enter custom amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setValidationError('');
                    }}
                    min="10"
                    step="1"
                    required
                  />
                </div>

                {validationError && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm text-[#DC2626]">
                    {validationError}
                  </div>
                )}

                {selectedUtility && accountNumberInput && amount && (
                  <div className="p-4 bg-[#FAFAF7] rounded-xl border border-[rgba(11,52,43,0.06)]">
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-[#6B7280]">Paybill</span>
                      <span className="font-semibold text-[#1F2937]">{selectedUtility.paybill}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-[#6B7280]">Account</span>
                      <span className="font-semibold text-[#1F2937]">{accountNumberInput}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-t border-[rgba(11,52,43,0.08)] mt-1 pt-2">
                      <span className="font-semibold text-[#1F2937]">Total</span>
                      <span className="font-bold text-[#0B342B]">{formatCurrency(parseFloat(amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-t border-[rgba(11,52,43,0.08)] mt-1 pt-2">
                      <span className="text-[#6B7280]">Wallet Balance</span>
                      <span className={`font-semibold ${parseFloat(amount) > balance ? 'text-[#DC2626]' : 'text-[#3FAF73]'}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                    {accountNumber && (
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-[#6B7280]">Account</span>
                        <span className="font-mono text-xs text-[#94A3B8]">{accountNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#0B342B] text-[#F7F6F1] font-semibold rounded-xl hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={processing || !amount || parseFloat(amount) > balance}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon />
                      Processing...
                    </span>
                  ) : (
                    'Pay from Wallet'
                  )}
                </button>
              </form>
            </div>

            {/* Utility Providers Grid */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 md:p-6">
              <h3 className="text-sm font-bold text-[#1F2937] mb-3">All Utility Providers</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {utilities.map((utility) => {
                  const bgColor = utility.color || '#0B342B';
                  return (
                    <div 
                      key={utility.id}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedUtility?.id === utility.id 
                          ? 'border-[#0B342B] bg-[#FAFAF7] shadow-sm' 
                          : 'border-[rgba(11,52,43,0.08)] hover:border-[rgba(11,52,43,0.25)] hover:shadow-sm'
                      }`}
                      onClick={() => {
                        setSelectedUtility(utility);
                        setValidationError('');
                      }}
                    >
                      <div className="text-center">
                        <div 
                          className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: bgColor }}
                        >
                          {getUtilityIcon(utility.category)}
                        </div>
                        <div className="text-xs font-medium text-[#1F2937] mt-2 truncate">{utility.name}</div>
                        <div className="text-[10px] text-[#6B7280] truncate capitalize">{utility.category}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-6">
            
            {/* Wallet Balance Card */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-2 mb-1">
                <WalletIcon />
                <h3 className="text-sm font-bold text-[#1F2937]">Wallet Balance</h3>
              </div>
              <div className="text-2xl font-bold text-[#0B342B]">{formatCurrency(balance)}</div>
              {accountNumber && (
                <p className="text-[10px] text-[#6B7280] mt-0.5 font-mono">Acc: {accountNumber}</p>
              )}
              <p className="text-xs text-[#6B7280] mt-1">Available for utility payments</p>
              <button 
                className="mt-3 w-full py-2 bg-[#FAFAF7] text-[#0B342B] font-semibold rounded-xl hover:bg-[#F3F4F6] transition-all duration-200 text-sm"
                onClick={() => navigate('/wallet')}
              >
                Top Up Wallet
              </button>
            </div>

            {/* Saved Services */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 md:p-6">
              <h3 className="text-sm font-bold text-[#1F2937] mb-3">Saved Services</h3>
              
              {savedServices.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#6B7280]">No saved services</p>
                  <button 
                    className="text-xs text-[#0B342B] hover:text-[#12342D] transition-colors mt-1"
                    onClick={() => setShowAddService(true)}
                  >
                    + Add a service
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedServices.map((service) => (
                    <div 
                      key={service.id}
                      className="p-3 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)] cursor-pointer hover:border-[#0B342B] transition-all duration-200"
                      onClick={() => handleSavedServiceClick(service)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[#1F2937] text-sm">{service.nickname}</div>
                          <div className="text-xs text-[#6B7280]">{service.utility_name || 'Unknown'}</div>
                          <div className="text-xs text-[#6B7280]">Account: {service.account_number}</div>
                        </div>
                        <button
                          className="text-[#6B7280] hover:text-[#DC2626] transition-colors text-sm p-1"
                          onClick={(e) => { e.stopPropagation(); removeSavedService(service.id); }}
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1F2937]">Recent Payments</h3>
                <button 
                  className="text-xs text-[#0B342B] hover:text-[#12342D] transition-colors"
                  onClick={fetchPaymentHistory}
                >
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#6B7280]">No payments yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentHistory.slice(0, 5).map((payment) => {
                    const status = getStatusBadge(payment.status);
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#1F2937] text-sm truncate">
                            {payment.utility_name || 'Utility'}
                          </div>
                          <div className="text-xs text-[#6B7280]">{formatDate(payment.paid_at || payment.createdat)}</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="font-bold text-[#0B342B] text-sm">{formatCurrency(payment.amount)}</div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.style}`}>
                            {status.label}
                          </span>
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
      {showConfirmModal && selectedUtility && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[rgba(11,52,43,0.06)] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1F2937]">Confirm Payment</h3>
              <button 
                className="text-[#6B7280] hover:text-[#1F2937] transition-colors"
                onClick={() => setShowConfirmModal(false)}
              >
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="font-bold text-[#1F2937]">{selectedUtility.name}</div>
                <div className="text-sm text-[#6B7280]">Paybill: {selectedUtility.paybill}</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 border border-[rgba(11,52,43,0.06)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Account</span>
                  <span className="font-semibold text-[#1F2937]">{accountNumberInput}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[rgba(11,52,43,0.08)]">
                  <span className="text-[#1F2937] font-semibold">Amount</span>
                  <span className="text-[#0B342B] font-bold">{formatCurrency(parseFloat(amount) || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Wallet Balance After</span>
                  <span className="font-semibold text-[#3FAF73]">{formatCurrency(balance - parseFloat(amount))}</span>
                </div>
              </div>

              <div className="bg-[#3FAF73]/5 rounded-xl p-4 text-center border border-[#3FAF73]/10">
                <p className="text-sm text-[#0B342B] leading-relaxed">
                  This payment will be deducted from your HalalHub wallet balance.
                </p>
              </div>

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[rgba(11,52,43,0.06)] flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-semibold rounded-xl border border-[rgba(11,52,43,0.12)] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#0B342B] text-[#F7F6F1] font-semibold rounded-xl hover:bg-[#12342D] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                onClick={confirmPayment}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    Processing...
                  </span>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RECEIPT MODAL ===== */}
      {showReceiptModal && paymentStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[rgba(11,52,43,0.06)] bg-[#0B342B] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#F7F6F1]">Payment Successful</h3>
                <button 
                  className="text-[#F7F6F1]/60 hover:text-[#F7F6F1] transition-colors"
                  onClick={closeReceipt}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#3FAF73]/10 flex items-center justify-center mx-auto border-4 border-[#3FAF73]/20">
                <CheckIcon />
              </div>
              
              <div>
                <div className="text-sm text-[#6B7280]">Payment to</div>
                <div className="text-xl font-bold text-[#1F2937]">{paymentStatus.utility}</div>
                <div className="text-sm font-mono text-[#6B7280] mt-1">Ref: {paymentStatus.ref}</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 text-left space-y-2 border border-[rgba(11,52,43,0.06)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Account</span>
                  <span className="font-semibold text-[#1F2937]">{paymentStatus.account}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Paybill</span>
                  <span className="font-semibold text-[#1F2937]">{paymentStatus.paybill}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[rgba(11,52,43,0.08)]">
                  <span className="text-[#1F2937] font-semibold">Amount</span>
                  <span className="text-[#0B342B] font-bold">{formatCurrency(paymentStatus.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Date</span>
                  <span className="font-semibold text-[#1F2937]">{paymentStatus.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Payment Method</span>
                  <span className="font-semibold text-[#3FAF73]">Wallet</span>
                </div>
                {paymentStatus.receipt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Receipt</span>
                    <span className="font-semibold text-[#1F2937]">{paymentStatus.receipt}</span>
                  </div>
                )}
                {paymentStatus.accountNumber && (
                  <div className="flex justify-between text-sm border-t border-[rgba(11,52,43,0.08)] pt-2">
                    <span className="text-[#6B7280]">Virtual Account</span>
                    <span className="font-mono text-xs text-[#94A3B8]">{paymentStatus.accountNumber}</span>
                  </div>
                )}
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[rgba(11,52,43,0.06)]">
                <p className="text-sm text-[#6B7280] italic leading-relaxed">
                  "Allah has permitted trade and forbidden usury." — Quran 2:275
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[rgba(11,52,43,0.06)] flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-semibold rounded-xl border border-[rgba(11,52,43,0.12)] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={closeReceipt}
              >
                Close
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#0B342B] text-[#F7F6F1] font-semibold rounded-xl hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                onClick={() => alert('Receipt download feature coming soon')}
              >
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS TOAST ===== */}
      {success && (
        <div className="fixed top-6 right-6 z-50 bg-[#0B342B] text-[#F7F6F1] px-6 py-4 rounded-2xl shadow-2xl shadow-[#0B342B]/30 flex items-center gap-3 max-w-sm border border-[rgba(201,164,75,0.18)] animate-slideDown">
          <svg className="w-5 h-5 text-[#C9A44B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{success}</span>
          <button 
            className="text-[#F7F6F1]/60 hover:text-[#F7F6F1] transition ml-2 flex-shrink-0"
            onClick={() => setSuccess('')}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* ===== CSS ANIMATIONS ===== */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Utilities;