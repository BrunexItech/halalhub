import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletService, zakatService, mpesaService, sadaqaService } from '../services/api';

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
  const [showTransactions, setShowTransactions] = useState(false);
  const [stats, setStats] = useState({
    monthlySpent: 0,
    monthlyReceived: 0,
    totalDonations: 0
  });

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
      // Fetch balance
      const balanceRes = await walletService.getBalance().catch(() => ({ data: { balance: 0 } }));
      setBalance(balanceRes.data.balance || 0);

      // Fetch zakat due
      const zakatRes = await zakatService.getZakatDue().catch(() => ({ data: { zakatDue: 0 } }));
      setZakatDue(zakatRes.data.zakatDue || 0);

      // Fetch Sadaqa total from history
      const sadaqaRes = await sadaqaService.getSummary().catch(() => ({ data: { summary: { totalAmount: 0 } } }));
      setTotalSadaqa(sadaqaRes.data.summary?.totalAmount || 0);

      // Fetch transactions using walletService
      const txRes = await walletService.getTransactions({ limit: 20 }).catch(() => ({ data: { transactions: [] } }));
      const txData = txRes.data.transactions || [];
      setTransactions(txData);

      // Calculate stats from real transactions
      const spent = txData.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const received = txData.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const donations = txData.filter(t => t.type === 'sadaqa' || t.type === 'zakat').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      setStats({
        monthlySpent: spent,
        monthlyReceived: received,
        totalDonations: donations
      });

      // Fetch active loans count from P2P stats
      try {
        const p2pStatsRes = await api.get('/p2p/stats');
        const sentCount = p2pStatsRes.data.stats?.sentCount || 0;
        const receivedCount = p2pStatsRes.data.stats?.receivedCount || 0;
        setActiveLoans(sentCount + receivedCount);
      } catch (p2pErr) {
        setActiveLoans(0);
      }

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

  const toggleTransactions = () => {
    setShowTransactions(!showTransactions);
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

  // SVG Icons
  const WalletIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const ZakatIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const HeartIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const LoanIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const SendIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );

  const ZakatActionIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const SadaqaActionIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const LoanActionIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const BillsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const ChevronDownIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );

  const ChevronUpIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
    </svg>
  );

  if (loading) {
    return (
      <div className="px-3 sm:px-4 md:px-5 lg:px-6 pt-4 sm:pt-5 md:pt-6 lg:pt-8 pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-3 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
          <p className="text-[#6B7280] mt-4 text-sm">Loading your dashboard...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-[rgba(11,52,43,0.1)] animate-pulse">
              <div className="h-3 bg-[#F3F4F6] rounded w-1/3 mb-3" />
              <div className="h-6 bg-[#F3F4F6] rounded w-2/3 mb-2" />
              <div className="h-3 bg-[#F3F4F6] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-5 lg:px-6 pt-4 sm:pt-5 md:pt-6 lg:pt-8 pb-8">
      
      {/* ===== ERROR STATE ===== */}
      {error && (
        <div className="mb-3 p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[#DC2626]">{error}</span>
          <button 
            className="px-3 py-1 bg-[#DC2626] text-white text-[10px] font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
            onClick={fetchDashboardData}
          >
            Retry
          </button>
        </div>
      )}

      {/* ===== HALALHUB CARD ===== */}
      <div className="mb-4 sm:mb-5">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#032A24] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/10 border border-[rgba(201,164,75,0.15)]">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A44B]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A44B]/30 to-transparent" />
          
          <div className="absolute right-4 top-4 w-10 h-7 rounded-lg bg-gradient-to-br from-[#C9A44B]/20 to-[#E1C16B]/20 border border-[rgba(201,164,75,0.2)] flex items-center justify-center">
            <div className="w-7 h-4 rounded bg-gradient-to-br from-[#C9A44B]/40 to-[#E1C16B]/40" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A44B] to-[#E1C16B] flex items-center justify-center shadow-lg shadow-[#C9A44B]/20">
                  <span className="text-[#032A24] text-xs font-bold">H</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#F7F6F1] tracking-tight">HalalHub</span>
                  <span className="block text-[6px] font-medium text-[#C9A44B] tracking-[0.15em] uppercase">Premium</span>
                </div>
              </div>
              <span className="text-[6px] sm:text-[7px] font-medium text-[#C9A44B] uppercase tracking-[0.15em] border border-[rgba(201,164,75,0.2)] px-1.5 py-0.5 rounded-full">
                Sharia-Compliant
              </span>
            </div>

            <div className="mb-4">
              <span className="text-[7px] text-[#B7C0BA]/50 block mb-0.5 uppercase tracking-wider">Card Number</span>
              <span className="text-sm sm:text-base font-mono font-bold text-[#F7F6F1] tracking-wider">
                {showCardNumber ? getFullCardNumber() : getMaskedCardNumber()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[7px] text-[#B7C0BA]/50 block uppercase tracking-wider">Cardholder</span>
                <span className="text-[9px] sm:text-[10px] font-semibold text-[#F7F6F1] uppercase tracking-wider">
                  {user?.fullName || 'HalalHub User'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[7px] text-[#B7C0BA]/50 block uppercase tracking-wider">Status</span>
                <span className="text-[8px] sm:text-[9px] font-semibold text-[#3FAF73]">● Active</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[rgba(201,164,75,0.12)]">
              <div className="flex items-center justify-between">
                <span className="text-[7px] text-[#B7C0BA]/50 uppercase tracking-wider">Available Balance</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-[#F7F6F1]">
                    {showBalance ? formatCurrency(balance) : '••••••'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBalanceVisibility(); }}
                    className="text-[#B7C0BA]/30 hover:text-[#B7C0BA] transition-colors"
                    aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                  >
                    {showBalance ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-1.5 text-[7px] sm:text-[8px] text-[#6B7280] text-center">
          Virtual card · Digital transactions only
        </div>
      </div>

      {/* ===== STATS GRID ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div 
          className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[rgba(11,52,43,0.12)] shadow-sm hover:shadow-md hover:border-[rgba(11,52,43,0.25)] transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/wallet')}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[8px] sm:text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider">Balance</div>
              <div className="text-sm sm:text-lg font-bold text-[#1F2937] mt-0.5">
                {showBalance ? formatCurrency(balance) : '••••••'}
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#0B342B]/5 flex items-center justify-center group-hover:bg-[#0B342B]/10 transition-colors">
              <WalletIcon />
            </div>
          </div>
          <div className="text-[8px] sm:text-[9px] text-[#3FAF73] mt-0.5">↑ Available</div>
        </div>

        <div 
          className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[rgba(11,52,43,0.12)] shadow-sm hover:shadow-md hover:border-[rgba(11,52,43,0.25)] transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/zakat')}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[8px] sm:text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider">Zakat Due</div>
              <div className="text-sm sm:text-lg font-bold text-[#1F2937] mt-0.5">
                {showBalance ? formatCurrency(zakatDue) : '••••••'}
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#C9A44B]/5 flex items-center justify-center group-hover:bg-[#C9A44B]/10 transition-colors">
              <ZakatIcon />
            </div>
          </div>
          <div className="text-[8px] sm:text-[9px] text-[#6B7280] mt-0.5">2.5% of assets</div>
        </div>

        <div 
          className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[rgba(11,52,43,0.12)] shadow-sm hover:shadow-md hover:border-[rgba(11,52,43,0.25)] transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/sadaqa')}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[8px] sm:text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider">Sadaqa Given</div>
              <div className="text-sm sm:text-lg font-bold text-[#1F2937] mt-0.5">
                {showBalance ? formatCurrency(totalSadaqa) : '••••••'}
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#3FAF73]/5 flex items-center justify-center group-hover:bg-[#3FAF73]/10 transition-colors">
              <HeartIcon />
            </div>
          </div>
          <div className="text-[8px] sm:text-[9px] text-[#3FAF73] mt-0.5">Barakah increasing</div>
        </div>

        <div 
          className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[rgba(11,52,43,0.12)] shadow-sm hover:shadow-md hover:border-[rgba(11,52,43,0.25)] transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/p2p')}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[8px] sm:text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider">Active Loans</div>
              <div className="text-sm sm:text-lg font-bold text-[#1F2937] mt-0.5">{activeLoans}</div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#1F2937]/5 flex items-center justify-center group-hover:bg-[#1F2937]/10 transition-colors">
              <LoanIcon />
            </div>
          </div>
          <div className="text-[8px] sm:text-[9px] text-[#6B7280] mt-0.5">0% interest · Riba-free</div>
        </div>
      </div>

      {/* ===== TOP UP WALLET ===== */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[rgba(11,52,43,0.12)] shadow-sm p-4 sm:p-5 mb-4 sm:mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">Top Up Wallet</h3>
            <span className="text-[7px] sm:text-[8px] font-medium text-[#3FAF73] bg-[#3FAF73]/10 px-2 py-0.5 rounded-full">M-Pesa</span>
          </div>
          <span className="text-[8px] sm:text-[9px] text-[#6B7280]">Instant</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[8px] sm:text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E5E7EB] rounded-lg text-[#1F2937] text-xs placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
              value={topUpPhone}
              onChange={(e) => setTopUpPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              disabled={topUpLoading || isPolling}
            />
            <span className="text-[7px] sm:text-[8px] text-[#6B7280] mt-0.5 block">Registered M-Pesa number</span>
          </div>

          <div>
            <label className="text-[8px] sm:text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">
              Amount (KES)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-[#FAFAF7] border border-[#E5E7EB] rounded-lg text-[#1F2937] text-xs placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Enter amount"
              min="10"
              disabled={topUpLoading || isPolling}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2.5">
          {quickAmounts.map((val) => (
            <button
              key={val}
              className={`px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-semibold transition-all duration-200 ${
                parseFloat(topUpAmount) === val 
                  ? 'bg-[#C9A44B] text-white shadow-sm shadow-[#C9A44B]/20' 
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
              }`}
              onClick={() => handleQuickAmount(val)}
              disabled={topUpLoading || isPolling}
            >
              KES {val.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button
            className="px-5 py-2 bg-[#0B342B] text-white font-semibold text-xs rounded-lg hover:bg-[#12342D] hover:shadow-lg hover:shadow-[#0B342B]/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleTopUp}
            disabled={topUpLoading || isPolling}
          >
            {topUpLoading ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon />
                Sending...
              </span>
            ) : isPolling ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon />
                Waiting...
              </span>
            ) : (
              'Pay via M-Pesa'
            )}
          </button>

          {isPolling && (
            <button
              className="text-xs text-[#DC2626] hover:text-[#B91C1C] transition-colors"
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
          <div className={`mt-2.5 p-2.5 rounded-lg text-xs ${
            topUpMessageType === 'success' ? 'bg-[#3FAF73]/10 text-[#3FAF73] border border-[#3FAF73]/20' :
            topUpMessageType === 'error' ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20' :
            'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
          }`}>
            {topUpMessage}
          </div>
        )}

        <div className="mt-2 text-[7px] sm:text-[8px] text-[#6B7280] text-center">
          Secured by M-Pesa · End-to-end encrypted
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="mb-4 sm:mb-5">
        <h3 className="text-xs sm:text-sm font-semibold text-[#1F2937] mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          <button 
            className="px-2 py-2.5 rounded-lg text-[9px] sm:text-[10px] font-semibold transition-all duration-200 bg-white border border-[rgba(11,52,43,0.12)] text-[#1F2937] hover:border-[rgba(11,52,43,0.3)] hover:shadow-md hover:bg-[#FAFAF7] transform hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center gap-1"
            onClick={() => navigate('/wallet')}
          >
            <SendIcon />
            <span>Send Money</span>
          </button>
          <button 
            className="px-2 py-2.5 rounded-lg text-[9px] sm:text-[10px] font-semibold transition-all duration-200 bg-white border border-[rgba(11,52,43,0.12)] text-[#1F2937] hover:border-[rgba(11,52,43,0.3)] hover:shadow-md hover:bg-[#FAFAF7] transform hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center gap-1"
            onClick={() => navigate('/zakat')}
          >
            <ZakatActionIcon />
            <span>Pay Zakat</span>
          </button>
          <button 
            className="px-2 py-2.5 rounded-lg text-[9px] sm:text-[10px] font-semibold transition-all duration-200 bg-white border border-[rgba(11,52,43,0.12)] text-[#1F2937] hover:border-[rgba(11,52,43,0.3)] hover:shadow-md hover:bg-[#FAFAF7] transform hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center gap-1"
            onClick={() => navigate('/sadaqa')}
          >
            <SadaqaActionIcon />
            <span>Give Sadaqa</span>
          </button>
          <button 
            className="px-2 py-2.5 rounded-lg text-[9px] sm:text-[10px] font-semibold transition-all duration-200 bg-white border border-[rgba(11,52,43,0.12)] text-[#1F2937] hover:border-[rgba(11,52,43,0.3)] hover:shadow-md hover:bg-[#FAFAF7] transform hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center gap-1"
            onClick={() => navigate('/p2p')}
          >
            <LoanActionIcon />
            <span>P2P Loan</span>
          </button>
          <button 
            className="px-2 py-2.5 rounded-lg text-[9px] sm:text-[10px] font-semibold transition-all duration-200 bg-white border border-[rgba(11,52,43,0.12)] text-[#1F2937] hover:border-[rgba(11,52,43,0.3)] hover:shadow-md hover:bg-[#FAFAF7] transform hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center gap-1"
            onClick={() => navigate('/utilities')}
          >
            <BillsIcon />
            <span>Pay Bills</span>
          </button>
        </div>
      </div>

      {/* ===== RECENT TRANSACTIONS - COLLAPSIBLE ===== */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[rgba(11,52,43,0.12)] shadow-sm overflow-hidden transition-all duration-300">
        {/* Transaction Header - Clickable to toggle */}
        <button
          onClick={toggleTransactions}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#FAFAF7] transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">Recent Transactions</h3>
            <span className="text-[10px] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
              {transactions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#6B7280]">
              {showTransactions ? 'Hide' : 'Show'}
            </span>
            <span className="text-[#6B7280] transition-transform duration-300">
              {showTransactions ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </span>
          </div>
        </button>

        {/* Transaction Content - Collapsible */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showTransactions ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl text-[#E5E7EB] mb-3">—</div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#1F2937]">No transactions yet</h4>
                <p className="text-[9px] sm:text-[10px] text-[#6B7280] mt-1">Start using HalalHub to see your activity</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  {transactions.map((tx, i) => {
                    // Determine transaction type from the data
                    const type = tx.type || 'payment';
                    const isCredit = tx.amount > 0;
                    const isDebit = tx.amount < 0;
                    const absAmount = Math.abs(tx.amount);
                    
                    return (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#FAFAF7] transition-colors border border-transparent hover:border-[rgba(11,52,43,0.08)]">
                        <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] sm:text-[10px] font-bold text-[#6B7280]">
                            {type === 'sadaqa' && 'S'}
                            {type === 'zakat' && 'Z'}
                            {type === 'deposit' && 'D'}
                            {type === 'withdrawal' && 'W'}
                            {type === 'repayment' && 'R'}
                            {type === 'utility' && 'U'}
                            {type === 'payment' && 'P'}
                            {type === 'transfer' && 'X'}
                            {type === 'order' && 'O'}
                            {type === 'booking' && 'B'}
                            {!type && '•'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-1.5">
                            <span className="font-semibold text-[#1F2937] text-xs sm:text-sm truncate">
                              {tx.title || tx.description || type.charAt(0).toUpperCase() + type.slice(1) || 'Transaction'}
                            </span>
                            <span className={`font-bold text-xs sm:text-sm whitespace-nowrap ${
                              isCredit ? 'text-[#3FAF73]' : 'text-[#DC2626]'
                            }`}>
                              {isCredit ? '+' : ''}{showBalance ? formatCurrency(absAmount) : '••••••'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[8px] sm:text-[9px] text-[#6B7280]">
                            <span>{tx.date || tx.createdat ? new Date(tx.createdat).toLocaleDateString() : 'Today'}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-[#F3F4F6] capitalize text-[7px] sm:text-[8px]">
                              {type}
                            </span>
                            {isCredit && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#3FAF73]/10 text-[#3FAF73] font-semibold text-[7px] sm:text-[8px]">
                                Incoming
                              </span>
                            )}
                            {isDebit && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] font-semibold text-[7px] sm:text-[8px]">
                                Outgoing
                              </span>
                            )}
                            {tx.status && tx.status !== 'completed' && tx.status !== 'success' && (
                              <span className={`px-1.5 py-0.5 rounded-full font-semibold text-[7px] sm:text-[8px] ${
                                tx.status === 'pending' ? 'bg-[#FEF3C7] text-[#D97706]' :
                                tx.status === 'failed' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                                'bg-[#F3F4F6] text-[#6B7280]'
                              }`}>
                                {tx.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F3F4F6]">
                  <div className="text-center">
                    <span className="text-[7px] sm:text-[8px] text-[#6B7280] block">Spent</span>
                    <span className="text-xs sm:text-sm font-bold text-[#DC2626]">
                      {showBalance ? formatCurrency(stats.monthlySpent) : '••••••'}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[7px] sm:text-[8px] text-[#6B7280] block">Received</span>
                    <span className="text-xs sm:text-sm font-bold text-[#3FAF73]">
                      {showBalance ? formatCurrency(stats.monthlyReceived) : '••••••'}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[7px] sm:text-[8px] text-[#6B7280] block">Donations</span>
                    <span className="text-xs sm:text-sm font-bold text-[#0B342B]">
                      {showBalance ? formatCurrency(stats.totalDonations) : '••••••'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <button 
                    className="text-[10px] font-semibold text-[#6B7280] hover:text-[#0B342B] transition-colors"
                    onClick={() => navigate('/wallet')}
                  >
                    View All Transactions →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;