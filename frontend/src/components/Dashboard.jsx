import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletService, zakatService, transactionService, mpesaService } from '../services/api';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(0);
  const [zakatDue, setZakatDue] = useState(0);
  const [totalSadaqa, setTotalSadaqa] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [stats, setStats] = useState({
    monthlySpent: 0,
    monthlyReceived: 0,
    totalDonations: 0
  });

  // Top Up State
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpPhone, setTopUpPhone] = useState('+254');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMessage, setTopUpMessage] = useState('');
  const [topUpMessageType, setTopUpMessageType] = useState('info');
  const [checkoutId, setCheckoutId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  const quickActions = [
    { label: 'Send Money', path: '/wallet' },
    { label: 'Pay Zakat', path: '/zakat' },
    { label: 'Give Sadaqa', path: '/sadaqa' },
    { label: 'P2P Loan', path: '/p2p' },
    { label: 'Pay Bills', path: '/utilities' }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // M-Pesa Polling
  useEffect(() => {
    if (!checkoutId || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const res = await mpesaService.checkStatus(checkoutId);
        if (res.data.status === 'success') {
          setTopUpMessage('Payment successful. Wallet updated.');
          setTopUpMessageType('success');
          setIsPolling(false);
          setCheckoutId(null);
          await fetchDashboardData();
          clearInterval(interval);
        } else if (res.data.status === 'failed') {
          setTopUpMessage('Payment failed. Please try again.');
          setTopUpMessageType('error');
          setIsPolling(false);
          setCheckoutId(null);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutId, isPolling]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [balanceRes, zakatRes, transactionsRes] = await Promise.all([
        walletService.getBalance().catch(() => ({ data: { balance: 0 } })),
        zakatService.getZakatDue().catch(() => ({ data: { zakatDue: 0 } })),
        transactionService.getRecent(5).catch(() => ({ data: [] }))
      ]);

      setBalance(balanceRes.data.balance || 0);
      setZakatDue(zakatRes.data.zakatDue || 0);
      
      const txData = transactionsRes.data || [];
      setTransactions(txData);

      const spent = txData.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const received = txData.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const donations = txData.filter(t => t.type === 'sadaqa' || t.type === 'zakat').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      setStats({
        monthlySpent: spent,
        monthlyReceived: received,
        totalDonations: donations
      });

      setActiveLoans(2);
      setTotalSadaqa(8400);

    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
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

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  const toggleCardNumber = () => {
    setShowCardNumber(!showCardNumber);
  };

  const handleTopUp = async () => {
    let cleanPhone = topUpPhone.replace(/\+/g, '').replace(/\s/g, '');
    
    if (!cleanPhone || cleanPhone.length < 10) {
      setTopUpMessage('Please enter a valid phone number');
      setTopUpMessageType('error');
      return;
    }
    
    if (!topUpAmount || parseFloat(topUpAmount) < 10) {
      setTopUpMessage('Enter amount (minimum 10 KES)');
      setTopUpMessageType('error');
      return;
    }

    setTopUpLoading(true);
    setTopUpMessage('Sending payment request to M-Pesa...');
    setTopUpMessageType('info');

    try {
      const res = await mpesaService.stkPush({
        phone: cleanPhone,
        amount: parseInt(topUpAmount)
      });

      if (res.data.success) {
        setTopUpMessage('Check your phone and enter M-Pesa PIN to complete payment.');
        setTopUpMessageType('info');
        setCheckoutId(res.data.checkoutId);
        setIsPolling(true);
      }
    } catch (err) {
      setTopUpMessage(err.response?.data?.error || 'Payment failed. Please try again.');
      setTopUpMessageType('error');
    }
    setTopUpLoading(false);
  };

  const handleQuickAmount = (val) => {
    setTopUpAmount(val.toString());
  };

  const getMaskedCardNumber = () => {
    const userId = user?.id || '00000000';
    const lastFour = userId.slice(-4) || '0000';
    return `•••• •••• •••• ${lastFour}`;
  };

  const getFullCardNumber = () => {
    const userId = user?.id || '00000000';
    const padded = userId.padStart(16, '0').slice(0, 16);
    return padded.replace(/(.{4})/g, '$1 ').trim();
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
            <p className="text-[#94A3B8] mt-4">Loading your dashboard...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-[#E8EEF4] animate-pulse">
                <div className="h-8 bg-[#F1F7FC] rounded-lg w-1/3 mb-3" />
                <div className="h-6 bg-[#F1F7FC] rounded-lg w-2/3 mb-2" />
                <div className="h-4 bg-[#F1F7FC] rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* ===== HERO / WELCOME SECTION ===== */}
        <div className="bg-[#1769AA] rounded-xl md:rounded-2xl p-6 md:p-8 mb-6 md:mb-8 shadow-lg shadow-[#1769AA]/15">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/20 backdrop-blur-sm border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg md:text-2xl font-bold text-white">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                    Welcome back, {user?.fullName?.split(' ')[0] || 'User'}
                  </h1>
                  <p className="text-sm text-white/70">Secure · Sharia-Compliant</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
                  Sharia Compliant
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/10">
                  Halal Certified
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div 
                className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 cursor-pointer hover:bg-white/20 transition-all duration-300 min-w-[160px]"
                onClick={() => navigate('/wallet')}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Balance</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBalanceVisibility(); }}
                    className="text-white/40 hover:text-white/70 transition-colors"
                    aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                  >
                    {showBalance ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-xl md:text-2xl font-bold text-white text-center mt-1">
                  {showBalance ? formatCurrency(balance) : '••••••'}
                </div>
                <div className="text-[10px] text-white/40 text-center">↑ 8.4% this month</div>
              </div>
              <button 
                className="p-2.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 text-white/60 hover:text-white"
                onClick={fetchDashboardData}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ===== ERROR STATE ===== */}
        {error && (
          <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={fetchDashboardData}
            >
              Retry
            </button>
          </div>
        )}

        {/* ===== DIGITAL WALLET CARD ===== */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1A2A3A]">Digital Wallet</h2>
            <button
              onClick={toggleCardNumber}
              className="text-xs font-medium text-[#1769AA] hover:text-[#2F80C0] transition-colors"
            >
              {showCardNumber ? 'Hide' : 'Show'} card number
            </button>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-xl p-5 md:p-6 shadow-lg shadow-[#1769AA]/20">
            {/* Card decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full" />
            
            <div className="relative z-10">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 rounded bg-white/20 backdrop-blur-sm border border-white/10" />
                  <span className="text-xs font-semibold text-white/70 tracking-wider">HALALHUB</span>
                </div>
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Sharia-Compliant</span>
              </div>

              {/* Card Number */}
              <div className="mb-6">
                <span className="text-xs text-white/50 block mb-1">Card Number</span>
                <span className="text-lg md:text-xl font-mono font-bold text-white tracking-wider">
                  {showCardNumber ? getFullCardNumber() : getMaskedCardNumber()}
                </span>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/50 block">Cardholder Name</span>
                  <span className="text-sm font-semibold text-white uppercase tracking-wider">
                    {user?.fullName || 'HalalHub User'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/50 block">Status</span>
                  <span className="text-xs font-semibold text-emerald-300">Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-[#94A3B8] text-center">
            Virtual card · Digital transactions only
          </div>
        </div>

        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div 
            className="bg-white rounded-xl p-4 border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition-all duration-200 cursor-pointer"
            onClick={() => navigate('/wallet')}
          >
            <div className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Balance</div>
            <div className="text-xl font-bold text-[#1A2A3A] mt-1">
              {showBalance ? formatCurrency(balance) : '••••••'}
            </div>
            <div className="text-xs text-emerald-600 mt-0.5">↑ 8.4%</div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition-all duration-200 cursor-pointer relative"
            onClick={() => navigate('/zakat')}
          >
            <div className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Zakat Due</div>
            <div className="text-xl font-bold text-[#1769AA] mt-1">
              {showBalance ? formatCurrency(zakatDue) : '••••••'}
            </div>
            <div className="text-xs text-[#94A3B8] mt-0.5">2.5% of assets</div>
            <button 
              className="absolute right-3 bottom-3 text-[#1769AA] text-xs font-semibold opacity-0 hover:opacity-100 transition-all duration-200"
              onClick={(e) => { e.stopPropagation(); navigate('/zakat'); }}
            >
              Pay →
            </button>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition-all duration-200 cursor-pointer"
            onClick={() => navigate('/sadaqa')}
          >
            <div className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Sadaqa Given</div>
            <div className="text-xl font-bold text-[#1A2A3A] mt-1">
              {showBalance ? formatCurrency(totalSadaqa) : '••••••'}
            </div>
            <div className="text-xs text-emerald-600 mt-0.5">Barakah increasing</div>
          </div>

          <div 
            className="bg-white rounded-xl p-4 border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition-all duration-200 cursor-pointer"
            onClick={() => navigate('/p2p')}
          >
            <div className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Active Loans</div>
            <div className="text-xl font-bold text-[#1A2A3A] mt-1">{activeLoans}</div>
            <div className="text-xs text-[#94A3B8] mt-0.5">0% interest · Riba-free</div>
          </div>
        </div>

        {/* ===== TOP UP WALLET ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1A2A3A]">Top Up Wallet</h3>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">M-Pesa</span>
            </div>
            <span className="text-xs text-[#94A3B8]">Instant</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={topUpPhone}
                onChange={(e) => setTopUpPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                disabled={topUpLoading || isPolling}
              />
              <span className="text-[10px] text-[#94A3B8] mt-1 block">Registered M-Pesa number</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                Amount (KES)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Enter amount"
                min="10"
                disabled={topUpLoading || isPolling}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {quickAmounts.map((val) => (
              <button
                key={val}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  parseFloat(topUpAmount) === val 
                    ? 'bg-[#1769AA] text-white' 
                    : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                }`}
                onClick={() => handleQuickAmount(val)}
                disabled={topUpLoading || isPolling}
              >
                KES {val.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <button
              className="w-full md:w-auto px-8 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleTopUp}
              disabled={topUpLoading || isPolling}
            >
              {topUpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : isPolling ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Waiting for M-Pesa...
                </span>
              ) : (
                'Pay via M-Pesa'
              )}
            </button>

            {isPolling && (
              <button
                className="ml-3 text-sm text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                onClick={() => {
                  setIsPolling(false);
                  setCheckoutId(null);
                  setTopUpMessage('Payment cancelled');
                  setTopUpMessageType('info');
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {topUpMessage && (
            <div className={`mt-3 p-3 rounded-xl text-sm ${
              topUpMessageType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              topUpMessageType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {topUpMessage}
            </div>
          )}

          <div className="mt-3 text-[10px] text-[#94A3B8] text-center">
            Secured by M-Pesa · End-to-end encrypted
          </div>
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#1A2A3A] mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button 
                key={action.label}
                className="px-4 md:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex-1 min-w-[100px] max-w-[160px] bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30"
                onClick={() => navigate(action.path)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== RECENT TRANSACTIONS ===== */}
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[#E8EEF4] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-[#1A2A3A]">Recent Transactions</h3>
            <button 
              className="text-sm font-semibold text-[#1769AA] hover:text-[#2F80C0] transition-colors"
              onClick={() => navigate('/wallet')}
            >
              View All →
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-[#E8EEF4] mb-3">—</div>
              <h4 className="text-base font-semibold text-[#1A2A3A]">No transactions yet</h4>
              <p className="text-sm text-[#94A3B8] mt-1">Start using HalalHub to see your activity</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#F1F7FC] flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#1769AA]">
                        {tx.type === 'sadaqa' && 'S'}
                        {tx.type === 'zakat' && 'Z'}
                        {tx.type === 'topup' && 'T'}
                        {tx.type === 'repayment' && 'R'}
                        {tx.type === 'utility' && 'U'}
                        {tx.type === 'payment' && 'P'}
                        {tx.type === 'transfer' && 'X'}
                        {!tx.type && '•'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="font-semibold text-[#1A2A3A] text-sm truncate">
                          {tx.title || 'Transaction'}
                        </span>
                        <span className={`font-bold text-sm whitespace-nowrap ${
                          tx.amount > 0 ? 'text-emerald-600' : 'text-[#DC2626]'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{showBalance ? formatCurrency(tx.amount) : '••••••'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
                        <span>{tx.date || 'Today'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#F1F7FC] capitalize text-[10px]">
                          {tx.type || 'payment'}
                        </span>
                        {tx.amount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-[10px]">
                            Incoming
                          </span>
                        )}
                        {tx.amount < 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#DC2626] font-semibold text-[10px]">
                            Outgoing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#F1F7FC]">
                <div className="text-center">
                  <span className="text-xs text-[#94A3B8] block">Spent</span>
                  <span className="text-sm font-bold text-[#DC2626]">
                    {showBalance ? formatCurrency(stats.monthlySpent) : '••••••'}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-[#94A3B8] block">Received</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {showBalance ? formatCurrency(stats.monthlyReceived) : '••••••'}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-[#94A3B8] block">Donations</span>
                  <span className="text-sm font-bold text-[#1769AA]">
                    {showBalance ? formatCurrency(stats.totalDonations) : '••••••'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;