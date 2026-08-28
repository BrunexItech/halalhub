import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sadaqaService, walletService } from '../services/api';
import PinModal from './PinModal';

const Sadaqa = () => {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Wallet balance
  const [balance, setBalance] = useState(0);
  
  // Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [amount, setAmount] = useState('');
  
  // History
  const [donationHistory, setDonationHistory] = useState([]);
  
  // Impact stats
  const [impactStats, setImpactStats] = useState({
    totalRaised: 0,
    totalDonations: 0,
    uniqueDonors: 0,
    campaignsSupported: 0
  });
  
  // Summary
  const [summary, setSummary] = useState({
    totalDonations: 0,
    totalAmount: 0,
    uniqueCampaigns: 0,
    categoriesSupported: 0
  });
  
  // Categories
  const [categories, setCategories] = useState([
    { id: 'all', label: 'All Causes' },
    { id: 'orphan', label: 'Orphan Care' },
    { id: 'masjid', label: 'Mosque Projects' },
    { id: 'water', label: 'Water & Food' },
    { id: 'education', label: 'Education' },
    { id: 'medical', label: 'Medical Support' },
    { id: 'emergency', label: 'Emergency Relief' },
    { id: 'imam', label: 'Imam Support' },
    { id: 'community', label: 'Community Development' }
  ]);
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [dedication, setDedication] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Quick amounts
  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  // ===== PIN MODAL STATE =====
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pendingDonationData, setPendingDonationData] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchBalance();
    fetchCampaigns();
    fetchDonationHistory();
    fetchSummary();
    fetchImpactStats();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterCategory !== 'all') params.category = filterCategory;
      
      const res = await sadaqaService.getCampaigns(params);
      if (res.data.success) {
        setCampaigns(res.data.campaigns || []);
        if (res.data.campaigns && res.data.campaigns.length > 0) {
          setSelectedCampaign(res.data.campaigns[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load causes. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await sadaqaService.getHistory();
      if (res.data.success) {
        setDonationHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch donation history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await sadaqaService.getSummary();
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const fetchImpactStats = async () => {
    try {
      const res = await sadaqaService.getImpactStats();
      if (res.data.success) {
        setImpactStats(res.data.impact);
      }
    } catch (err) {
      console.error('Failed to fetch impact stats:', err);
    }
  };

  // ===== UPDATED: handleDonate now shows PIN modal =====
  const handleDonate = () => {
    if (!selectedCampaign) {
      setError('Please select a cause');
      return;
    }
    if (!amount || parseFloat(amount) < 10) {
      setError('Please enter a valid amount (minimum KES 10)');
      return;
    }
    if (parseFloat(amount) > balance) {
      setError(`Insufficient balance. Available: KES ${balance.toLocaleString()}`);
      return;
    }
    
    // Store donation data and show PIN modal
    setPendingDonationData({
      campaignId: selectedCampaign.id,
      amount: parseFloat(amount),
      dedication: dedication,
      isAnonymous: isAnonymous,
      campaignName: selectedCampaign.name,
      organization: selectedCampaign.organization
    });
    setShowPinModal(true);
    setPinError('');
  };

  // ===== PIN VERIFICATION =====
  const handlePinVerify = async (pin) => {
    setPinLoading(true);
    setPinError('');
    try {
      const response = await sadaqaService.donate({
        ...pendingDonationData,
        pin: pin
      });

      if (response.data.success) {
        const data = response.data.data;
        setReceiptData({
          id: data.reference,
          amount: data.amount,
          cause: data.campaign,
          organization: data.organization,
          date: data.paidAt,
          status: 'completed'
        });
        
        setShowPinModal(false);
        setShowReceiptModal(true);
        setAmount('');
        setDedication('');
        setIsAnonymous(false);
        setPendingDonationData(null);
        
        await fetchBalance();
        await fetchCampaigns();
        await fetchDonationHistory();
        await fetchSummary();
        await fetchImpactStats();
        
        setSuccess(`Sadaqa of KES ${parseFloat(amount).toLocaleString()} sent successfully`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setPinError(err.response?.data?.error || 'Donation failed. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinError('');
    setPendingDonationData(null);
  };

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
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

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          campaign.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (campaign.location && campaign.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || campaign.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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

  const HeartIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const WalletIcon = () => (
    <svg className="w-4 h-4 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] px-3 sm:px-4 md:px-5 lg:px-6 pt-1 sm:pt-4 md:pt-5 lg:pt-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-3 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
            <p className="text-[#6B7280] mt-3 text-sm">Loading causes...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 border border-[rgba(11,52,43,0.08)] animate-pulse">
                <div className="h-4 bg-[#F3F4F6] rounded w-1/3 mb-3" />
                <div className="h-3 bg-[#F3F4F6] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[#F3F4F6] rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] px-3 sm:px-4 md:px-5 lg:px-6 pt-1 sm:pt-4 md:pt-5 lg:pt-6 pb-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ===== ERROR ===== */}
        {error && (
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

        {/* ===== HERO SECTION ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#032A24] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl shadow-black/10 border border-[rgba(201,164,75,0.15)] mb-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <HeartIcon />
                <span className="text-[10px] font-semibold text-[#B7C0BA] uppercase tracking-wider">Sadaqa</span>
                <span className="w-px h-3 bg-[rgba(201,164,75,0.2)]" />
                <span className="text-[10px] font-medium text-[#C9A44B]">Voluntary Charity</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F7F6F1] leading-tight">
                Give Voluntary Charity
              </h1>
              <p className="text-[#B7C0BA] text-sm mt-1 max-w-lg">
                Support meaningful causes through verified organizations. Every contribution makes a difference.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-[#C9A44B] bg-white/10 px-3 py-1.5 rounded-full border border-[rgba(201,164,75,0.15)]">
                Sadaqah Jariyah
              </span>
              <span className="text-[10px] font-semibold text-[#F7F6F1] bg-white/10 px-3 py-1.5 rounded-full border border-[rgba(201,164,75,0.15)]">
                Balance: {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          
          {/* ===== LEFT COLUMN - CAUSES ===== */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            
            {/* Search & Filter */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Search</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    placeholder="Search causes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Causes Grid */}
            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-8 text-center">
                <p className="text-sm text-[#6B7280]">No causes found. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCampaigns.map((campaign) => {
                  const pct = Math.round((campaign.raised / campaign.target) * 100);
                  const isSelected = selectedCampaign?.id === campaign.id;
                  return (
                    <div 
                      key={campaign.id} 
                      className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'border-[#0B342B] shadow-md shadow-[#0B342B]/10' 
                          : 'border-[rgba(11,52,43,0.08)] hover:border-[#0B342B]/40 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-[#1F2937] text-sm">{campaign.name}</h3>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#3FAF73]/10 text-[#3FAF73] border border-[#3FAF73]/20">Verified</span>
                          </div>
                          <p className="text-xs text-[#6B7280] mt-0.5">{campaign.organization}</p>
                          {campaign.location && (
                            <p className="text-xs text-[#6B7280]">{campaign.location}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280]">
                          {categories.find(c => c.id === campaign.category)?.label || campaign.category}
                        </span>
                      </div>

                      {campaign.description && (
                        <p className="text-xs text-[#6B7280] line-clamp-2">{campaign.description}</p>
                      )}

                      <div className="mt-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">Raised</span>
                          <span className="font-semibold text-[#1F2937]">{formatCurrency(campaign.raised)}</span>
                        </div>
                        <div className="h-1.5 bg-[#F3F4F6] rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-[#0B342B] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-0.5">
                          <span className="text-[#6B7280]">Target: {formatCurrency(campaign.target)}</span>
                          <span className="font-medium text-[#0B342B]">{pct}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[rgba(11,52,43,0.06)]">
                        <span className="text-xs text-[#6B7280]">{campaign.donor_count || 0} donors</span>
                        {isSelected && (
                          <span className="text-xs font-semibold text-[#0B342B]">Selected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-4 sm:space-y-5">
            
            {/* Donation Form */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5 sticky top-6">
              <h3 className="text-sm font-bold text-[#1F2937] mb-3">Give Sadaqa</h3>
              
              {selectedCampaign ? (
                <div className="mb-3 p-2.5 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-sm font-semibold text-[#1F2937]">{selectedCampaign.name}</div>
                  <div className="text-xs text-[#6B7280]">{selectedCampaign.organization}</div>
                </div>
              ) : (
                <p className="text-sm text-[#6B7280] mb-3">Select a cause to support</p>
              )}

              <div className="mb-3">
                <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1.5">Amount (KES)</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 ${
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
                  className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                  placeholder="Enter custom amount"
                  min="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Dedication (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                  placeholder="e.g., In memory of..."
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[rgba(11,52,43,0.12)] text-[#0B342B] focus:ring-[#C9A44B]/30"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <span className="text-xs text-[#6B7280]">Donate anonymously</span>
                </label>
              </div>

              <button
                className="w-full py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleDonate}
                disabled={!selectedCampaign || !amount || processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    Processing...
                  </span>
                ) : (
                  'Give Sadaqa'
                )}
              </button>

              <p className="text-[9px] text-[#6B7280] text-center mt-2.5">
                100% reaches beneficiaries · No platform fee
              </p>
            </div>

            {/* Impact Stats */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5">
              <h3 className="text-sm font-bold text-[#1F2937] mb-3">Your Impact</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="text-center p-2.5 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-base font-bold text-[#0B342B]">{formatCurrency(summary.totalAmount || 0)}</div>
                  <div className="text-[10px] text-[#6B7280]">Total Given</div>
                </div>
                <div className="text-center p-2.5 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-base font-bold text-[#0B342B]">{summary.totalDonations || 0}</div>
                  <div className="text-[10px] text-[#6B7280]">Donations</div>
                </div>
                <div className="text-center p-2.5 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-base font-bold text-[#3FAF73]">{summary.categoriesSupported || 0}</div>
                  <div className="text-[10px] text-[#6B7280]">Categories</div>
                </div>
                <div className="text-center p-2.5 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-base font-bold text-[#0B342B]">{summary.uniqueCampaigns || 0}</div>
                  <div className="text-[10px] text-[#6B7280]">Causes</div>
                </div>
              </div>
            </div>

            {/* Recent Donations */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1F2937]">Recent Donations</h3>
                <button 
                  className="text-[10px] text-[#6B7280] hover:text-[#0B342B] transition-colors"
                  onClick={fetchDonationHistory}
                >
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
                </div>
              ) : donationHistory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-[#6B7280]">No donations yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {donationHistory.slice(0, 5).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-2.5 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#1F2937] truncate">{donation.campaign_name || 'Donation'}</div>
                        <div className="text-[10px] text-[#6B7280]">{formatDate(donation.paid_at || donation.createdat)}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs font-bold text-[#0B342B]">{formatCurrency(donation.amount)}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusBadge(donation.status)}`}>
                          {getStatusLabel(donation.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== CONFIRMATION MODAL (now replaced by PIN modal) ===== */}
        {/* The confirmation modal is removed since PIN modal handles this now */}

        {/* ===== RECEIPT MODAL ===== */}
        {showReceiptModal && receiptData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(11,52,43,0.06)] bg-[#0B342B] rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[#F7F6F1]">Donation Successful</h3>
                  <button className="text-[#F7F6F1]/60 hover:text-[#F7F6F1] transition-colors" onClick={() => setShowReceiptModal(false)}>
                    <CloseIcon />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-3 text-center">
                <div className="w-14 h-14 rounded-full bg-[#3FAF73]/10 flex items-center justify-center mx-auto border-4 border-[#3FAF73]/20">
                  <CheckIcon />
                </div>
                
                <div>
                  <div className="text-xs text-[#6B7280]">You donated to</div>
                  <div className="text-lg font-bold text-[#1F2937]">{receiptData.cause}</div>
                  <div className="text-xl font-bold text-[#0B342B]">{formatCurrency(receiptData.amount)}</div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 text-left space-y-1.5 border border-[rgba(11,52,43,0.06)]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Reference</span>
                    <span className="font-mono text-[10px] text-[#6B7280]">{receiptData.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Date</span>
                    <span className="font-semibold text-[#1F2937]">{formatDate(receiptData.date)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Type</span>
                    <span className="font-semibold text-[#0B342B]">Sadaqah Jariyah</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Organization</span>
                    <span className="font-semibold text-[#1F2937]">{receiptData.organization || 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 border border-[rgba(11,52,43,0.06)]">
                  <p className="text-xs text-[#6B7280] italic leading-relaxed">
                    "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[rgba(11,52,43,0.06)] flex flex-col sm:flex-row gap-2.5">
                <button 
                  className="flex-1 px-4 py-2 bg-white text-[#6B7280] font-semibold text-sm rounded-lg border border-[rgba(11,52,43,0.12)] hover:bg-[#FAFAF7] transition-all duration-200"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Close
                </button>
                <button 
                  className="flex-[2] px-4 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                  onClick={() => {
                    setShowReceiptModal(false);
                    navigate('/sadaqa');
                  }}
                >
                  Done
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
          title="Confirm Sadaqa Donation"
          subtitle="Enter your 4-digit PIN to confirm this charitable donation"
          amount={pendingDonationData?.amount || 0}
          recipient={pendingDonationData?.campaignName || 'Cause'}
          transactionType="sadaqa"
        />

        {/* ===== SUCCESS TOAST ===== */}
        {success && (
          <div className="fixed top-4 right-4 z-50 bg-[#0B342B] text-[#F7F6F1] px-4 py-3 rounded-xl shadow-2xl shadow-[#0B342B]/30 flex items-center gap-2.5 animate-slideDown max-w-xs border border-[rgba(201,164,75,0.18)]">
            <svg className="w-4 h-4 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
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
      `}</style>
    </div>
  );
};

export default Sadaqa;