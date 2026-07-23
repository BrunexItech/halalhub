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
    fetchBalance();
    fetchUtilities();
    fetchPaymentHistory();
    fetchSavedServices();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch balance');
    }
  };

  const fetchUtilities = async () => {
    setLoading(true);
    setError('');
    try {
      const mockUtilities = [
        { 
          id: 'kplc', 
          name: 'Kenya Power', 
          paybill: '888880', 
          color: '#E31E24', 
          description: 'Prepaid & postpaid electricity bills',
          category: 'electricity',
          fields: ['Meter Number', 'Account Number'],
          serviceType: 'prepaid'
        },
        { 
          id: 'nairobi-water', 
          name: 'Nairobi Water', 
          paybill: '444400', 
          color: '#2196F3', 
          description: 'Water & sewerage services',
          category: 'water',
          fields: ['Account Number'],
          serviceType: 'bill'
        },
        { 
          id: 'safaricom-fibre', 
          name: 'Safaricom Fibre', 
          paybill: '333200', 
          color: '#4CAF50', 
          description: 'High-speed fibre internet',
          category: 'internet',
          fields: ['Account Number'],
          serviceType: 'subscription'
        },
        { 
          id: 'dstv', 
          name: 'DStv', 
          paybill: '321000', 
          color: '#9C27B0', 
          description: 'Satellite TV subscriptions',
          category: 'tv',
          fields: ['Subscriber Number'],
          serviceType: 'subscription'
        },
        { 
          id: 'gotv', 
          name: 'GOtv', 
          paybill: '321100', 
          color: '#FF5722', 
          description: 'Digital TV subscriptions',
          category: 'tv',
          fields: ['Subscriber Number'],
          serviceType: 'subscription'
        },
        { 
          id: 'zuku', 
          name: 'Zuku Fibre', 
          paybill: '333300', 
          color: '#E91E63', 
          description: 'Fibre internet & TV',
          category: 'internet',
          fields: ['Account Number'],
          serviceType: 'subscription'
        },
        { 
          id: 'county-rates', 
          name: 'County Rates', 
          paybill: '222111', 
          color: '#FF9800', 
          description: 'Land rates & property taxes',
          category: 'government',
          fields: ['Account Number'],
          serviceType: 'bill'
        }
      ];
      
      setUtilities(mockUtilities);
      if (mockUtilities.length > 0) {
        setSelectedUtility(mockUtilities[0]);
      }
    } catch (err) {
      setError('Failed to load utilities. Please refresh.');
      console.error('Utilities error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true);
    try {
      setPaymentHistory([
        { id: 1, utility: 'Kenya Power', amount: 1500, date: '2024-04-01', status: 'completed', ref: 'UTIL-2024-001' },
        { id: 2, utility: 'Nairobi Water', amount: 800, date: '2024-03-25', status: 'completed', ref: 'UTIL-2024-002' },
        { id: 3, utility: 'Safaricom Fibre', amount: 2500, date: '2024-03-20', status: 'completed', ref: 'UTIL-2024-003' },
        { id: 4, utility: 'DStv', amount: 1200, date: '2024-03-15', status: 'pending', ref: 'UTIL-2024-004' }
      ]);
    } catch (err) {
      console.error('History error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSavedServices = async () => {
    try {
      setSavedServices([
        { id: 1, utilityId: 'kplc', nickname: 'Home Electricity', accountNumber: '12345678' },
        { id: 2, utilityId: 'nairobi-water', nickname: 'Apartment Water', accountNumber: '87654321' }
      ]);
    } catch (err) {
      console.error('Saved services error:', err);
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
      // Deduct from wallet
      // Replace with actual API call
      // await walletService.deduct(parseInt(amount));
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update balance
      setBalance(balance - parseInt(amount));
      
      setPaymentStatus({
        utility: selectedUtility?.name || 'Utility',
        account: accountNumber,
        amount: parseInt(amount),
        paybill: selectedUtility?.paybill || '',
        date: new Date().toLocaleString(),
        ref: 'UTIL' + Date.now().toString().slice(-8),
        status: 'completed'
      });
      
      setShowConfirmModal(false);
      setShowReceiptModal(true);
      await fetchPaymentHistory();
      
      setSuccess(`Payment of KES ${parseInt(amount).toLocaleString()} to ${selectedUtility?.name} successful!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
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
    const utility = utilities.find(u => u.id === service.utilityId);
    if (utility) {
      setSelectedUtility(utility);
      setAccountNumber(service.accountNumber);
    }
  };

  const handleAddService = () => {
    if (!newService.nickname || !newService.accountNumber || !selectedUtility) {
      setValidationError('Please fill in all fields');
      return;
    }
    const newSaved = {
      id: Date.now(),
      utilityId: selectedUtility.id,
      nickname: newService.nickname,
      accountNumber: newService.accountNumber
    };
    setSavedServices([...savedServices, newSaved]);
    setShowAddService(false);
    setNewService({ nickname: '', accountNumber: '' });
    setSuccess('Service added successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const removeSavedService = (id) => {
    setSavedServices(savedServices.filter(s => s.id !== id));
    setSuccess('Service removed');
    setTimeout(() => setSuccess(''), 3000);
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
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'failed': 'bg-red-50 text-red-700 border-red-200'
    };
    const labels = {
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed'
    };
    return { style: styles[status] || styles.completed, label: labels[status] || status };
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 p-8 md:p-12 shadow-lg shadow-[#1769AA]/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Utilities</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Pay Your Bills</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Manage Your Utility Payments
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Pay electricity, water, internet, TV, and county rates from your wallet.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                Wallet Balance: {formatCurrency(balance)}
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
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
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
                      <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Nickname</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                        placeholder="e.g., Home Electricity"
                        value={newService.nickname}
                        onChange={(e) => setNewService({...newService, nickname: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Account / Meter Number</label>
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
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Select Utility</label>
                  <select
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Amount (KES)</label>
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
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    placeholder="Enter custom amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setValidationError('');
                    }}
                    min="10"
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
                      <span className={`font-semibold ${parseFloat(amount) > balance ? 'text-[#DC2626]' : 'text-emerald-600'}`}>
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
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">All Utility Providers</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        style={{ backgroundColor: utility.color }}
                      >
                        {utility.name.charAt(0)}
                      </div>
                      <div className="text-xs font-medium text-[#1A2A3A] mt-2 truncate">{utility.name}</div>
                      <div className="text-[10px] text-[#94A3B8] truncate">{utility.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-6">
            
            {/* Wallet Balance Card */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-2">Wallet Balance</h3>
              <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(balance)}</div>
              <p className="text-xs text-[#94A3B8] mt-1">Available for utility payments</p>
              <button 
                className="mt-3 w-full py-2 bg-[#F1F7FC] text-[#1769AA] font-semibold rounded-xl hover:bg-[#E8EEF4] transition-all duration-200 text-sm"
                onClick={() => navigate('/wallet')}
              >
                Top Up Wallet →
              </button>
            </div>

            {/* Saved Services */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
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
                  {savedServices.map((service) => {
                    const utility = utilities.find(u => u.id === service.utilityId);
                    return (
                      <div 
                        key={service.id}
                        className="p-3 bg-[#F1F7FC] rounded-lg border border-[#E8EEF4] cursor-pointer hover:border-[#1769AA] transition-all duration-200"
                        onClick={() => handleSavedServiceClick(service)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-[#1A2A3A] text-sm">{service.nickname}</div>
                            <div className="text-xs text-[#94A3B8]">{utility?.name || 'Unknown'}</div>
                            <div className="text-xs text-[#94A3B8]">Account: ••••{service.accountNumber.slice(-4)}</div>
                          </div>
                          <button
                            className="text-[#94A3B8] hover:text-[#DC2626] transition-colors text-sm"
                            onClick={(e) => { e.stopPropagation(); removeSavedService(service.id); }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
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
                  {paymentHistory.map((payment) => {
                    const status = getStatusBadge(payment.status);
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-[#F1F7FC] rounded-lg">
                        <div>
                          <div className="font-medium text-[#1A2A3A] text-sm">{payment.utility}</div>
                          <div className="text-xs text-[#94A3B8]">{formatDate(payment.date)}</div>
                        </div>
                        <div className="text-right">
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
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowConfirmModal(false)}>
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
                  <span className="text-[#94A3B8]">Wallet Balance</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(balance - parseFloat(amount))}</span>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-sm text-emerald-700 leading-relaxed">
                  This payment will be deducted from your HalalHub wallet balance.
                </p>
              </div>

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
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
                <h3 className="text-lg font-bold text-white">Payment Successful!</h3>
                <button className="text-white/60 hover:text-white transition-colors" onClick={closeReceipt}>
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-emerald-200">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <span className="font-semibold text-emerald-600">Wallet</span>
                </div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "Allah has permitted trade and forbidden usury." — Quran 2:275
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={closeReceipt}
              >
                Close
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                onClick={() => alert('Receipt download feature coming soon!')}
              >
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS TOAST ===== */}
      {success && (
        <div className="fixed top-6 right-6 z-50 bg-[#1769AA] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#1769AA]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-white/10">
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{success}</span>
          <button 
            className="text-white/60 hover:text-white transition ml-2"
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