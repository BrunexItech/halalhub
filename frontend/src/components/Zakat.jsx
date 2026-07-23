import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zakatService, paymentService } from '../services/api';

const Zakat = () => {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Zakat calculation fields
  const [cash, setCash] = useState(500000);
  const [gold, setGold] = useState(150000);
  const [silver, setSilver] = useState(20000);
  const [business, setBusiness] = useState(80000);
  const [invest, setInvest] = useState(50000);
  const [liab, setLiab] = useState(100000);
  
  // Zakat history
  const [zakatHistory, setZakatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Nisab threshold
  const NISAB_THRESHOLD = 71400;
  
  // Preset scenarios
  const presets = [
    { label: 'Salaried Professional', values: { cash: 300000, gold: 50000, silver: 10000, business: 0, invest: 20000, liab: 50000 } },
    { label: 'Small Business Owner', values: { cash: 150000, gold: 80000, silver: 15000, business: 300000, invest: 30000, liab: 120000 } },
    { label: 'Investor', values: { cash: 600000, gold: 200000, silver: 30000, business: 0, invest: 500000, liab: 150000 } },
    { label: 'Retiree', values: { cash: 800000, gold: 100000, silver: 20000, business: 0, invest: 100000, liab: 50000 } }
  ];

  // Verified Zakat Recipients (Only used in modal)
  const recipients = [
    { 
      id: 'supkem', 
      label: 'SUPKEM National Fund', 
      category: 'mosque',
      description: 'Nationwide Zakat distribution through verified mosques and institutions.',
      location: 'National',
      verified: true
    },
    { 
      id: 'waqf', 
      label: 'Waqf Commission Kenya', 
      category: 'institution',
      description: 'Government-backed Waqf and Zakat distribution commission.',
      location: 'National',
      verified: true
    },
    { 
      id: 'orphan', 
      label: 'Orphan Support Program', 
      category: 'orphan',
      description: 'Supporting verified orphan welfare organizations across Kenya.',
      location: 'Nairobi, Mombasa, Kisumu',
      verified: true
    },
    { 
      id: 'needy', 
      label: 'Needy Families Fund', 
      category: 'needy',
      description: 'Providing essential support to verified poor and needy families.',
      location: 'Nationwide',
      verified: true
    },
    { 
      id: 'debt', 
      label: 'Debt Relief Initiative', 
      category: 'debt',
      description: 'Assisting eligible individuals with qualifying debt relief.',
      location: 'Nationwide',
      verified: true
    },
    { 
      id: 'emergency', 
      label: 'Emergency Relief Fund', 
      category: 'emergency',
      description: 'Urgent humanitarian assistance for food, shelter, and medical needs.',
      location: 'Nationwide',
      verified: true
    }
  ];

  // Categories (Only used in modal)
  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'mosque', label: 'Mosques & Institutions' },
    { id: 'orphan', label: 'Orphan Support' },
    { id: 'needy', label: 'Needy Families' },
    { id: 'debt', label: 'Debt Relief' },
    { id: 'emergency', label: 'Emergency Relief' }
  ];

  // Fetch zakat history on mount
  useEffect(() => {
    fetchZakatHistory();
  }, []);

  const fetchZakatHistory = async () => {
    setLoadingHistory(true);
    try {
      setZakatHistory([
        { date: '2024-04-01', amount: 3125, recipient: 'SUPKEM National Fund', status: 'completed' },
        { date: '2024-01-15', amount: 2800, recipient: 'Local Mosque Fund', status: 'completed' },
        { date: '2023-10-20', amount: 4500, recipient: 'Waqf Commission Kenya', status: 'completed' }
      ]);
    } catch (err) {
      console.error('Failed to fetch zakat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Calculations
  const totalAssets = cash + gold + silver + business + invest;
  const totalLiabilities = liab;
  const netAssets = totalAssets - totalLiabilities;
  const isNisabExceeded = netAssets >= NISAB_THRESHOLD;
  const zakatDue = isNisabExceeded ? Math.round(netAssets * 0.025) : 0;

  // Handlers
  const handleFieldChange = (setter) => (e) => {
    const value = parseFloat(e.target.value) || 0;
    setter(value);
  };

  const applyPreset = (preset) => {
    setCash(preset.values.cash);
    setGold(preset.values.gold);
    setSilver(preset.values.silver);
    setBusiness(preset.values.business);
    setInvest(preset.values.invest);
    setLiab(preset.values.liab);
  };

  const handlePayZakat = () => {
    if (zakatDue <= 0) {
      setError('No Zakat due. Please check your calculations.');
      return;
    }
    // Reset selection when opening modal
    setSelectedRecipient('');
    setSelectedCategory('all');
    setShowConfirmModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedRecipient) {
      setError('Please select a recipient for your Zakat.');
      return;
    }
    
    setProcessing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(`Zakat of KES ${zakatDue.toLocaleString()} paid successfully!`);
      setShowConfirmModal(false);
      await fetchZakatHistory();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
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

  const getStatusBadge = (status) => {
    const styles = {
      'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'failed': 'bg-red-50 text-red-700 border-red-200'
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
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Zakat</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Third Pillar of Islam</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Calculate and Pay Your Zakat
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Fulfill your Zakat obligation with confidence. Calculate accurately and 
                distribute through verified institutions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                1446 AH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* ===== ERROR ===== */}
        {error && !showConfirmModal && (
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
          
          {/* ===== LEFT COLUMN - CALCULATOR ===== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Calculator Card */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#1A2A3A]">Zakat Calculator</h2>
                <span className="text-xs font-semibold text-[#1769AA] bg-[#F1F7FC] px-3 py-1 rounded-full">1446 AH</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-medium text-[#94A3B8] self-center">Quick presets:</span>
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    className="px-3 py-1 text-xs font-medium text-[#5A6A7A] bg-[#F1F7FC] rounded-full hover:bg-[#E8EEF4] transition-colors"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Cash & Savings</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="number" 
                    value={cash} 
                    onChange={handleFieldChange(setCash)}
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Gold Value</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="number" 
                    value={gold} 
                    onChange={handleFieldChange(setGold)}
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Silver Value</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="number" 
                    value={silver} 
                    onChange={handleFieldChange(setSilver)}
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Business Assets</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="number" 
                    value={business} 
                    onChange={handleFieldChange(setBusiness)}
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Investments</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="number" 
                    value={invest} 
                    onChange={handleFieldChange(setInvest)}
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Liabilities</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="number" 
                    value={liab} 
                    onChange={handleFieldChange(setLiab)}
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              {/* Result */}
              <div className="mt-6 p-5 bg-[#F1F7FC] rounded-xl border border-[#E8EEF4]">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Total Assets</span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(totalAssets)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Total Liabilities</span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(totalLiabilities)}</span>
                  </div>
                  <div className="border-t border-[#E2E8F0] pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-[#1A2A3A]">Net Zakatable Assets</span>
                    <span className="font-bold text-[#1769AA]">{formatCurrency(netAssets)}</span>
                  </div>
                  <div className="border-t border-[#E2E8F0] pt-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-[#94A3B8]">Zakat Due (2.5%)</div>
                      <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(zakatDue)}</div>
                    </div>
                    <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${isNisabExceeded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {isNisabExceeded ? 'Nisab Exceeded' : 'Below Nisab'}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className="w-full mt-4 py-3 bg-[#1769AA] text-white font-bold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handlePayZakat}
                disabled={zakatDue <= 0 || processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Pay Zakat (${formatCurrency(zakatDue)})`
                )}
              </button>
            </div>
          </div>

          {/* ===== RIGHT COLUMN - RECENT PAYMENTS ===== */}
          <div className="space-y-6">
            
            {/* Recent Payments */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1A2A3A]">Recent Payments</h3>
                <button 
                  className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                  onClick={fetchZakatHistory}
                >
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
                </div>
              ) : zakatHistory.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#94A3B8]">No Zakat payments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {zakatHistory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#F1F7FC] rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-[#1A2A3A]">{item.recipient}</div>
                        <div className="text-xs text-[#94A3B8]">{item.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#1769AA]">{formatCurrency(item.amount)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
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
      </div>

      {/* ===== CONFIRMATION MODAL WITH RECIPIENT SELECTION ===== */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Zakat Payment</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowConfirmModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Amount */}
              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <div className="text-xs text-[#94A3B8]">Amount</div>
                <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(zakatDue)}</div>
              </div>

              {/* Calculation Summary */}
              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Net Assets</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatCurrency(netAssets)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Zakat Rate</span>
                  <span className="font-semibold text-[#1A2A3A]">2.5%</span>
                </div>
              </div>

              {/* Recipient Selection */}
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-2">
                  Select Recipient Category
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        selectedCategory === cat.id 
                          ? 'bg-[#1769AA] text-white' 
                          : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                      }`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-2">
                  Select Recipient
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredRecipients.map((recipient) => (
                    <div 
                      key={recipient.id}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        selectedRecipient === recipient.id 
                          ? 'border-[#1769AA] bg-[#F1F7FC]' 
                          : 'border-[#E8EEF4] hover:border-[#1769AA]/40'
                      }`}
                      onClick={() => setSelectedRecipient(recipient.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#1A2A3A] text-sm">{recipient.label}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">{recipient.description}</p>
                          <p className="text-xs text-[#94A3B8] mt-1">{recipient.location}</p>
                        </div>
                        {selectedRecipient === recipient.id && (
                          <span className="text-[#1769AA] text-sm font-bold">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {error && <p className="text-sm text-[#DC2626] mt-2">{error}</p>}
              </div>

              {/* Quranic Verse */}
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-sm text-emerald-700 leading-relaxed">
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
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

export default Zakat;