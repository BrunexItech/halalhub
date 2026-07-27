import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { utilityService, walletService } from '../services/api';

const Utilities = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Wallet
  const [balance, setBalance] = useState(0);
  
  // Utilities
  const [utilities, setUtilities] = useState([]);
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
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
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const fetchUtilities = async () => {
    try {
      const res = await utilityService.getUtilities();
      const utilitiesData = res.data.utilities || [];
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
      const res = await utilityService.getPaymentHistory();
      setPaymentHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSavedServices = async () => {
    try {
      const res = await utilityService.getSavedServices();
      setSavedServices(res.data.savedServices || []);
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
    if (!accountNumber || accountNumber.length < 3) {
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
      const response = await utilityService.payBill({
        providerId: selectedUtility.id,
        accountNumber: accountNumber,
        amount: parseFloat(amount),
        paymentMethod: 'wallet'
      });

      if (response.data.success) {
        const data = response.data.data;
        setPaymentStatus({
          utility: selectedUtility.name,
          account: accountNumber,
          amount: parseFloat(amount),
          paybill: selectedUtility.paybill,
          date: new Date().toLocaleString(),
          ref: data.transactionRef,
          status: 'completed',
          receipt: data.receiptNumber,
          balance: data.balance
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
    setAccountNumber('');
    setAmount('');
  };

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
  };

  const handleSavedServiceClick = (service) => {
    const utility = utilities.find(u => u.id === service.provider_id);
    if (utility) {
      setSelectedUtility(utility);
      setAccountNumber(service.account_number);
    }
  };

  const handleAddService = async () => {
    if (!newService.nickname || !newService.accountNumber || !selectedUtility) {
      setValidationError('Please fill in all fields');
      return;
    }

    try {
      const response = await utilityService.addFavorite({
        providerId: selectedUtility.id,
        nickname: newService.nickname,
        accountNumber: newService.accountNumber
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
      await utilityService.removeFavorite(id);
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
      'completed': 'bg-green-50 text-green-700 border-green-200',
      'pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'failed': 'bg-red-50 text-red-700 border-red-200',
      'processing': 'bg-blue-50 text-blue-700 border-blue-200'
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

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading utility providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 p-6 md:p-8 lg:p-12 shadow-lg shadow-[#1769AA]/20">
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-36 md:w-48 h-36 md:h-48 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Utilities</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Pay Your Bills</span>
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
                Manage Your Utility Payments
              </h1>
              <p className="text-white/70 text-sm mt-1 md:mt-2 max-w-lg">
                Pay electricity, water, internet, TV, and county rates from your wallet.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10 whitespace-nowrap">
                Balance: {formatCurrency(balance)}
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
          
          {/* ===== LEFT COLUMN - PAYMENT FORM ===== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Payment Form */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-[#1A2A3A]">Pay a Utility</h2>
                <button 
                  className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                  onClick={() => setShowAddService(!showAddService)}
                >
                  {showAddService ? 'Cancel' : '+ Save Service'}
                </button>
              </div>

              {/* Add Service Form */}
              {showAddService && (
                <div className="mb-4 p-4 bg-[#F1F7FC] rounded-xl border border-[#E8EEF4]">
                  <h4 className="text-sm font-bold text-[#1A2A3A] mb-3">Save a Service</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                        Nickname
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                        placeholder="e.g., Home Electricity"
                        value={newService.nickname}
                        onChange={(e) => setNewService({...newService, nickname: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                        Account / Meter Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                        placeholder="Enter account number"
                        value={newService.accountNumber}
                        onChange={(e) => setNewService({...newService, accountNumber: e.target.value})}
                      />
                    </div>
                    <button
                      className="w-full py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                      onClick={handleAddService}
                    >
                      Save Service
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                    Select Utility
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                    {selectedUtility?.fields?.[0] || 'Account Number'}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    placeholder={`Enter ${selectedUtility?.fields?.[0]?.toLowerCase() || 'account number'}`}
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setValidationError('');
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                    Amount (KES)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickAmounts.map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                          parseFloat(amount) === val 
                            ? 'bg-[#1769AA] text-white' 
                            : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                        }`}
                        onClick={() => handleQuickAmount(val)}
                      >
                        {formatCurrency(val)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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

                {selectedUtility && accountNumber && amount && (
                  <div className="p-4 bg-[#F1F7FC] rounded-xl border border-[#E8EEF4]">
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-[#94A3B8]">Paybill</span>
                      <span className="font-semibold text-[#1A2A3A]">{selectedUtility.paybill}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-[#94A3B8]">Account</span>
                      <span className="font-semibold text-[#1A2A3A]">{accountNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-t border-[#E2E8F0] mt-1 pt-2">
                      <span className="font-semibold text-[#1A2A3A]">Total</span>
                      <span className="font-bold text-[#1769AA]">{formatCurrency(parseFloat(amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-t border-[#E2E8F0] mt-1 pt-2">
                      <span className="text-[#94A3B8]">Wallet Balance</span>
                      <span className={`font-semibold ${parseFloat(amount) > balance ? 'text-[#DC2626]' : 'text-green-600'}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={processing || !amount || parseFloat(amount) > balance}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Pay from Wallet'
                  )}
                </button>
              </form>
            </div>

            {/* Utility Providers Grid */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">All Utility Providers</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {utilities.map((utility) => (
                  <div 
                    key={utility.id}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedUtility?.id === utility.id 
                        ? 'border-[#1769AA] bg-[#F1F7FC]' 
                        : 'border-[#E8EEF4] hover:border-[#1769AA]/40'
                    }`}
                    onClick={() => {
                      setSelectedUtility(utility);
                      setValidationError('');
                    }}
                  >
                    <div className="text-center">
                      <div 
                        className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: utility.color || '#1769AA' }}
                      >
                        {utility.name.charAt(0)}
                      </div>
                      <div className="text-xs font-medium text-[#1A2A3A] mt-2 truncate">{utility.name}</div>
                      <div className="text-[10px] text-[#94A3B8] truncate capitalize">{utility.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-6">
            
            {/* Wallet Balance Card */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-2">Wallet Balance</h3>
              <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(balance)}</div>
              <p className="text-xs text-[#94A3B8] mt-1">Available for utility payments</p>
              <button 
                className="mt-3 w-full py-2 bg-[#F1F7FC] text-[#1769AA] font-semibold rounded-xl hover:bg-[#E8EEF4] transition-all duration-200 text-sm"
                onClick={() => navigate('/wallet')}
              >
                Top Up Wallet
              </button>
            </div>

            {/* Saved Services */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Saved Services</h3>
              
              {savedServices.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#94A3B8]">No saved services</p>
                  <button 
                    className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors mt-1"
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
                      className="p-3 bg-[#F1F7FC] rounded-lg border border-[#E8EEF4] cursor-pointer hover:border-[#1769AA] transition-all duration-200"
                      onClick={() => handleSavedServiceClick(service)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[#1A2A3A] text-sm">{service.nickname}</div>
                          <div className="text-xs text-[#94A3B8]">{service.utility_name || 'Unknown'}</div>
                          <div className="text-xs text-[#94A3B8]">Account: {service.account_number}</div>
                        </div>
                        <button
                          className="text-[#94A3B8] hover:text-[#DC2626] transition-colors text-sm p-1"
                          onClick={(e) => { e.stopPropagation(); removeSavedService(service.id); }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1A2A3A]">Recent Payments</h3>
                <button 
                  className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                  onClick={fetchPaymentHistory}
                >
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#94A3B8]">No payments yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentHistory.slice(0, 5).map((payment) => {
                    const status = getStatusBadge(payment.status);
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-[#F1F7FC] rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#1A2A3A] text-sm truncate">
                            {payment.utility_name || 'Utility'}
                          </div>
                          <div className="text-xs text-[#94A3B8]">{formatDate(payment.paid_at || payment.createdat)}</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="font-bold text-[#1769AA] text-sm">{formatCurrency(payment.amount)}</div>
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
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Payment</h3>
              <button 
                className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors text-xl"
                onClick={() => setShowConfirmModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="font-bold text-[#1A2A3A]">{selectedUtility.name}</div>
                <div className="text-sm text-[#94A3B8]">Paybill: {selectedUtility.paybill}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Account</span>
                  <span className="font-semibold text-[#1A2A3A]">{accountNumber}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#1A2A3A] font-semibold">Amount</span>
                  <span className="text-[#1769AA] font-bold">{formatCurrency(parseFloat(amount) || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Wallet Balance After</span>
                  <span className="font-semibold text-green-600">{formatCurrency(balance - parseFloat(amount))}</span>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-sm text-green-700 leading-relaxed">
                  This payment will be deducted from your HalalHub wallet balance.
                </p>
              </div>

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmPayment}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <div className="p-6 border-b border-[#F1F7FC] bg-[#1769AA] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Payment Successful</h3>
                <button 
                  className="text-white/60 hover:text-white transition-colors text-xl"
                  onClick={closeReceipt}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto border-4 border-green-200">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <div className="text-sm text-[#94A3B8]">Payment to</div>
                <div className="text-xl font-bold text-[#1A2A3A]">{paymentStatus.utility}</div>
                <div className="text-sm font-mono text-[#94A3B8] mt-1">Ref: {paymentStatus.ref}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Account</span>
                  <span className="font-semibold text-[#1A2A3A]">{paymentStatus.account}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Paybill</span>
                  <span className="font-semibold text-[#1A2A3A]">{paymentStatus.paybill}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#1A2A3A] font-semibold">Amount</span>
                  <span className="text-[#1769AA] font-bold">{formatCurrency(paymentStatus.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Date</span>
                  <span className="font-semibold text-[#1A2A3A]">{paymentStatus.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Payment Method</span>
                  <span className="font-semibold text-green-600">Wallet</span>
                </div>
                {paymentStatus.receipt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Receipt</span>
                    <span className="font-semibold text-[#1A2A3A]">{paymentStatus.receipt}</span>
                  </div>
                )}
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "Allah has permitted trade and forbidden usury." — Quran 2:275
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={closeReceipt}
              >
                Close
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
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
        <div className="fixed top-6 right-6 z-50 bg-[#1769AA] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#1769AA]/30 flex items-center gap-3 max-w-sm border border-white/10 animate-slideDown">
          <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{success}</span>
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

export default Utilities;