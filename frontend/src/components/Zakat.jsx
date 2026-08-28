import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zakatService, walletService } from '../services/api';
import PinModal from './PinModal';

const Zakat = () => {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Wallet balance
  const [balance, setBalance] = useState(0);
  
  // Zakat calculation fields - ALL EMPTY BY DEFAULT
  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [business, setBusiness] = useState('');
  const [investments, setInvestments] = useState('');
  const [receivables, setReceivables] = useState('');
  const [liabilities, setLiabilities] = useState('');
  const [nisabType, setNisabType] = useState('silver');
  
  // Calculation results
  const [calculation, setCalculation] = useState({
    totalAssets: 0,
    liabilities: 0,
    netAssets: 0,
    nisabThreshold: 0,
    zakatDue: 0,
    isObligatory: false
  });
  
  // Zakat history
  const [zakatHistory, setZakatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalAmount: 0,
    uniqueRecipients: 0
  });
  
  // Recipients
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notes, setNotes] = useState('');
  
  // ===== PIN MODAL STATE =====
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pendingZakatData, setPendingZakatData] = useState(null);
  
  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'mosque', label: 'Mosques & Institutions' },
    { id: 'orphan', label: 'Orphan Support' },
    { id: 'needy', label: 'Needy Families' },
    { id: 'debt', label: 'Debt Relief' },
    { id: 'emergency', label: 'Emergency Relief' },
    { id: 'education', label: 'Education' },
    { id: 'health', label: 'Health & Medical' }
  ];

  // Preset scenarios
  const presets = [
    { label: 'Salaried Professional', values: { cash: 300000, gold: 50000, silver: 10000, business: 0, investments: 20000, receivables: 0, liabilities: 50000 } },
    { label: 'Small Business Owner', values: { cash: 150000, gold: 80000, silver: 15000, business: 300000, investments: 30000, receivables: 50000, liabilities: 120000 } },
    { label: 'Investor', values: { cash: 600000, gold: 200000, silver: 30000, business: 0, investments: 500000, receivables: 0, liabilities: 150000 } },
    { label: 'Retiree', values: { cash: 800000, gold: 100000, silver: 20000, business: 0, investments: 100000, receivables: 0, liabilities: 50000 } }
  ];

  // Fetch data on mount
  useEffect(() => {
    fetchBalance();
    fetchRecipients();
    fetchZakatHistory();
    fetchSummary();
  }, []);

  // Calculate Zakat when fields change
  useEffect(() => {
    calculateZakat();
  }, [cash, gold, silver, business, investments, receivables, liabilities, nisabType]);

  const fetchBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const res = await zakatService.getRecipients();
      if (res.data.success) {
        setRecipients(res.data.recipients || []);
      }
    } catch (err) {
      console.error('Failed to fetch recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchZakatHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await zakatService.getHistory();
      if (res.data.success) {
        setZakatHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch zakat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await zakatService.getSummary();
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const calculateZakat = async () => {
    try {
      const res = await zakatService.calculate({
        cash: parseFloat(cash) || 0,
        gold: parseFloat(gold) || 0,
        silver: parseFloat(silver) || 0,
        business: parseFloat(business) || 0,
        investments: parseFloat(investments) || 0,
        receivables: parseFloat(receivables) || 0,
        liabilities: parseFloat(liabilities) || 0,
        nisabType: nisabType
      });

      if (res.data.success) {
        setCalculation(res.data.data);
      }
    } catch (err) {
      console.error('Calculation error:', err);
    }
  };

  const handleFieldChange = (setter) => (e) => {
    const value = e.target.value;
    setter(value === '' ? '' : parseFloat(value));
  };

  const handleFieldFocus = (e) => {
    e.target.select();
  };

  const applyPreset = (preset) => {
    setCash(preset.values.cash);
    setGold(preset.values.gold);
    setSilver(preset.values.silver);
    setBusiness(preset.values.business);
    setInvestments(preset.values.investments);
    setReceivables(preset.values.receivables || 0);
    setLiabilities(preset.values.liabilities);
  };

  // ===== UPDATED: handlePayZakat now shows PIN modal =====
  const handlePayZakat = () => {
    if (calculation.zakatDue <= 0) {
      setError('No Zakat due. Please check your calculations.');
      return;
    }
    if (balance < calculation.zakatDue) {
      setError(`Insufficient balance. Available: KES ${balance.toLocaleString()}`);
      return;
    }
    
    // Show recipient selection modal first
    setSelectedRecipient('');
    setSelectedCategory('all');
    setNotes('');
    setShowConfirmModal(true);
  };

  // ===== UPDATED: confirmPayment now shows PIN modal =====
  const confirmPayment = () => {
    if (!selectedRecipient) {
      setError('Please select a recipient for your Zakat.');
      return;
    }
    
    // Store zakat data and show PIN modal
    setPendingZakatData({
      amount: calculation.zakatDue,
      recipientId: selectedRecipient,
      category: selectedCategory !== 'all' ? selectedCategory : 'general',
      notes: notes
    });
    setShowConfirmModal(false);
    setShowPinModal(true);
    setPinError('');
  };

  // ===== PIN VERIFICATION =====
  const handlePinVerify = async (pin) => {
    setPinLoading(true);
    setPinError('');
    try {
      const response = await zakatService.payZakat({
        ...pendingZakatData,
        pin: pin
      });

      if (response.data.success) {
        setSuccess(`Zakat of KES ${pendingZakatData.amount.toLocaleString()} paid successfully!`);
        setShowPinModal(false);
        setPendingZakatData(null);
        await fetchBalance();
        await fetchZakatHistory();
        await fetchSummary();
        await fetchRecipients();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setPinError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinError('');
    setPendingZakatData(null);
  };

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
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'completed': 'bg-[#3FAF73]/10 text-[#3FAF73] border-[#3FAF73]/20',
      'pending': 'bg-[#C9A44B]/10 text-[#C9A44B] border-[#C9A44B]/20',
      'failed': 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
    };
    return styles[status] || styles.completed;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed'
    };
    return labels[status] || status;
  };

  const filteredRecipients = selectedCategory === 'all' 
    ? recipients 
    : recipients.filter(r => r.category === selectedCategory);

  const totalAssets = (parseFloat(cash) || 0) + (parseFloat(gold) || 0) + (parseFloat(silver) || 0) + 
                       (parseFloat(business) || 0) + (parseFloat(investments) || 0) + (parseFloat(receivables) || 0);
  const totalLiabilities = parseFloat(liabilities) || 0;
  const netAssets = totalAssets - totalLiabilities;

  // SVG Icons
  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-2 sm:p-4 md:p-5 lg:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* ===== HERO SECTION ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#032A24] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl shadow-black/10 border border-[rgba(201,164,75,0.15)] mb-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold text-[#B7C0BA] uppercase tracking-wider">Zakat</span>
                <span className="w-px h-3 bg-[rgba(201,164,75,0.2)]" />
                <span className="text-[10px] font-medium text-[#C9A44B]">Third Pillar of Islam</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F7F6F1] leading-tight">
                Calculate & Pay Your Zakat
              </h1>
              <p className="text-[#B7C0BA] text-sm mt-1 max-w-lg">
                Fulfill your Zakat obligation with confidence. Calculate accurately and 
                distribute through verified institutions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-[#C9A44B] bg-white/10 px-3 py-1.5 rounded-full border border-[rgba(201,164,75,0.15)]">
                1446 AH
              </span>
              <span className="text-[10px] font-semibold text-[#F7F6F1] bg-white/10 px-3 py-1.5 rounded-full border border-[rgba(201,164,75,0.15)]">
                Balance: {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* ===== ERROR ===== */}
        {error && !showConfirmModal && !showPinModal && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#DC2626]">{error}</span>
            <button 
              className="px-3 py-1 bg-[#DC2626] text-white text-[10px] font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          
          {/* ===== LEFT COLUMN - CALCULATOR ===== */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            
            {/* Calculator Card */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-bold text-[#1F2937]">Zakat Calculator</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-[#0B342B] bg-[#0B342B]/10 px-2.5 py-0.5 rounded-full">1446 AH</span>
                  <select
                    className="text-[10px] border border-[rgba(11,52,43,0.12)] rounded-lg px-2 py-1 bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30"
                    value={nisabType}
                    onChange={(e) => setNisabType(e.target.value)}
                  >
                    <option value="silver">Silver Nisab</option>
                    <option value="gold">Gold Nisab</option>
                  </select>
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[10px] font-medium text-[#6B7280] self-center">Quick presets:</span>
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    className="px-2.5 py-0.5 text-[10px] font-medium text-[#6B7280] bg-[#F3F4F6] rounded-full hover:bg-[#E5E7EB] transition-colors"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Form Fields - EMPTY BY DEFAULT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Cash & Savings</label>
                  <input 
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number" 
                    value={cash === 0 ? '' : cash}
                    onChange={handleFieldChange(setCash)}
                    onFocus={handleFieldFocus}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Gold Value</label>
                  <input 
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number" 
                    value={gold === 0 ? '' : gold}
                    onChange={handleFieldChange(setGold)}
                    onFocus={handleFieldFocus}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Silver Value</label>
                  <input 
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number" 
                    value={silver === 0 ? '' : silver}
                    onChange={handleFieldChange(setSilver)}
                    onFocus={handleFieldFocus}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Business Assets</label>
                  <input 
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number" 
                    value={business === 0 ? '' : business}
                    onChange={handleFieldChange(setBusiness)}
                    onFocus={handleFieldFocus}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Investments</label>
                  <input 
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number" 
                    value={investments === 0 ? '' : investments}
                    onChange={handleFieldChange(setInvestments)}
                    onFocus={handleFieldFocus}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Receivables</label>
                  <input 
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number" 
                    value={receivables === 0 ? '' : receivables}
                    onChange={handleFieldChange(setReceivables)}
                    onFocus={handleFieldFocus}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Liabilities</label>
                  <input 
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number" 
                    value={liabilities === 0 ? '' : liabilities}
                    onChange={handleFieldChange(setLiabilities)}
                    onFocus={handleFieldFocus}
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              {/* Result */}
              <div className="mt-4 p-4 bg-[#FAFAF7] rounded-xl border border-[rgba(11,52,43,0.06)]">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Total Assets</span>
                    <span className="font-semibold text-[#1F2937]">{formatCurrency(totalAssets)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Total Liabilities</span>
                    <span className="font-semibold text-[#1F2937]">{formatCurrency(totalLiabilities)}</span>
                  </div>
                  <div className="border-t border-[rgba(11,52,43,0.08)] pt-1.5 flex justify-between text-xs">
                    <span className="font-semibold text-[#1F2937]">Net Zakatable Assets</span>
                    <span className="font-bold text-[#0B342B]">{formatCurrency(calculation.netAssets || 0)}</span>
                  </div>
                  <div className="border-t border-[rgba(11,52,43,0.08)] pt-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-[#6B7280]">Zakat Due (2.5%)</div>
                      <div className="text-xl font-bold text-[#0B342B]">{formatCurrency(calculation.zakatDue || 0)}</div>
                    </div>
                    <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${calculation.isObligatory ? 'bg-[#3FAF73]/10 text-[#3FAF73] border-[#3FAF73]/20' : 'bg-[#C9A44B]/10 text-[#C9A44B] border-[#C9A44B]/20'}`}>
                      {calculation.isObligatory ? 'Nisab Exceeded' : 'Below Nisab'}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className="w-full mt-4 py-2.5 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.98]"
                onClick={handlePayZakat}
                disabled={calculation.zakatDue <= 0 || processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    Processing...
                  </span>
                ) : (
                  `Pay Zakat (${formatCurrency(calculation.zakatDue || 0)})`
                )}
              </button>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-4 sm:space-y-5">
            
            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4">
              <h3 className="text-sm font-bold text-[#1F2937] mb-3">Your Zakat Summary</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-[#0B342B]">{summary.totalPayments || 0}</div>
                  <div className="text-[10px] text-[#6B7280]">Total Payments</div>
                </div>
                <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-[#0B342B]">{formatCurrency(summary.totalAmount || 0)}</div>
                  <div className="text-[10px] text-[#6B7280]">Total Given</div>
                </div>
                <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-[#0B342B]">{summary.uniqueRecipients || 0}</div>
                  <div className="text-[10px] text-[#6B7280]">Recipients</div>
                </div>
                <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-[#3FAF73]">{formatCurrency(balance)}</div>
                  <div className="text-[10px] text-[#6B7280]">Wallet Balance</div>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1F2937]">Recent Payments</h3>
                <button 
                  className="text-[10px] text-[#6B7280] hover:text-[#0B342B] transition-colors"
                  onClick={fetchZakatHistory}
                >
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
                </div>
              ) : zakatHistory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-[#6B7280]">No Zakat payments yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {zakatHistory.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 bg-[#FAFAF7] rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#1F2937] truncate">{item.recipient_name || 'Zakat'}</div>
                        <div className="text-[10px] text-[#6B7280]">{formatDate(item.paid_at || item.createdat)}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs font-bold text-[#0B342B]">{formatCurrency(item.amount)}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== CONFIRMATION MODAL (Recipient Selection) ===== */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(11,52,43,0.06)] flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
                <h3 className="text-sm font-bold text-[#1F2937]">Select Zakat Recipient</h3>
                <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={() => setShowConfirmModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                {/* Amount */}
                <div className="bg-[#FAFAF7] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-[#6B7280]">Amount</div>
                  <div className="text-xl font-bold text-[#0B342B]">{formatCurrency(calculation.zakatDue || 0)}</div>
                </div>

                {/* Wallet Balance */}
                <div className="bg-[#FAFAF7] rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Wallet Balance</span>
                    <span className={`font-semibold ${balance >= calculation.zakatDue ? 'text-[#3FAF73]' : 'text-[#DC2626]'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Balance After</span>
                    <span className="font-semibold text-[#1F2937]">{formatCurrency(balance - calculation.zakatDue)}</span>
                  </div>
                </div>

                {/* Recipient Selection */}
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                    Select Recipient Category
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full transition-colors ${
                          selectedCategory === cat.id 
                            ? 'bg-[#0B342B] text-[#F7F6F1]' 
                            : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                        }`}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                    Select Recipient Organization
                  </label>
                  {loadingRecipients ? (
                    <div className="flex items-center justify-center py-3">
                      <div className="w-5 h-5 border-2 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="text-center py-3">
                      <p className="text-xs text-[#6B7280]">No recipients available in this category</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {filteredRecipients.map((recipient) => (
                        <div 
                          key={recipient.id}
                          className={`p-2.5 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                            selectedRecipient === recipient.id 
                              ? 'border-[#0B342B] bg-[#FAFAF7]' 
                              : 'border-[rgba(11,52,43,0.08)] hover:border-[rgba(11,52,43,0.2)]'
                          }`}
                          onClick={() => setSelectedRecipient(recipient.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-semibold text-[#1F2937] text-xs">{recipient.name}</h4>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#3FAF73]/10 text-[#3FAF73] border border-[#3FAF73]/20">Verified</span>
                              </div>
                              <p className="text-[10px] text-[#6B7280] mt-0.5">{recipient.description || 'Organization'}</p>
                              <p className="text-[10px] text-[#6B7280]">{recipient.location || 'N/A'}</p>
                            </div>
                            {selectedRecipient === recipient.id && (
                              <span className="text-[#0B342B] text-sm font-bold">✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Notes (Optional)</label>
                  <textarea
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200 resize-y"
                    rows="2"
                    placeholder="Add any notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Quranic Verse */}
                <div className="bg-[#3FAF73]/5 rounded-lg p-3 text-center border border-[#3FAF73]/10">
                  <p className="text-xs text-[#0B342B] leading-relaxed">
                    "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[rgba(11,52,43,0.06)] flex flex-col sm:flex-row gap-2.5 sticky bottom-0 bg-white rounded-b-xl">
                <button 
                  className="flex-1 px-4 py-2 bg-white text-[#6B7280] font-semibold text-sm rounded-lg border border-[rgba(11,52,43,0.12)] hover:bg-[#FAFAF7] transition-all duration-200"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] px-4 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.98]"
                  onClick={confirmPayment}
                  disabled={processing || !selectedRecipient}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon />
                      Processing...
                    </span>
                  ) : (
                    'Confirm & Pay'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== PIN MODAL ===== */}
        <PinModal
          isOpen={showPinModal}
          onClose={handlePinModalClose}
          onVerify={handlePinVerify}
          loading={pinLoading}
          error={pinError}
          title="Confirm Zakat Payment"
          subtitle="Enter your 4-digit PIN to confirm your Zakat payment"
          amount={pendingZakatData?.amount || 0}
          recipient="Zakat Recipient"
          transactionType="zakat"
        />

        {/* ===== SUCCESS TOAST ===== */}
        {success && (
          <div className="fixed top-4 right-4 z-50 bg-[#0B342B] text-[#F7F6F1] px-4 py-3 rounded-xl shadow-2xl shadow-[#0B342B]/30 flex items-center gap-2.5 animate-slideDown max-w-xs border border-[rgba(201,164,75,0.18)]">
            <CheckIcon />
            <span className="text-xs font-medium">{success}</span>
            <button 
              className="text-[#F7F6F1]/60 hover:text-[#F7F6F1] transition ml-1"
              onClick={() => setSuccess('')}
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>

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

        /* Remove number input spinners */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default Zakat;