import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sadaqaService, paymentService } from '../services/api';

const Sadaqa = () => {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Causes
  const [causes, setCauses] = useState([]);
  const [selectedCause, setSelectedCause] = useState(null);
  const [amount, setAmount] = useState('');
  
  // History
  const [donationHistory, setDonationHistory] = useState([]);
  
  // Impact stats
  const [impactStats, setImpactStats] = useState({
    totalGiven: 0,
    totalDonations: 0,
    livesImpacted: 0,
    causesSupported: 0
  });
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Quick amounts
  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  // Categories
  const categories = [
    { id: 'all', label: 'All Causes' },
    { id: 'orphan', label: 'Orphan Care' },
    { id: 'masjid', label: 'Mosque Projects' },
    { id: 'water', label: 'Water & Food' },
    { id: 'education', label: 'Education' },
    { id: 'medical', label: 'Medical Support' },
    { id: 'emergency', label: 'Emergency Relief' },
    { id: 'imam', label: 'Imam Support' }
  ];

  // Fetch data on mount
  useEffect(() => {
    fetchCauses();
    fetchDonationHistory();
    fetchImpactStats();
  }, []);

  const fetchCauses = async () => {
    setLoading(true);
    setError('');
    try {
      // Mock data - replace with real API
      const mockCauses = [
        { 
          id: 1, 
          name: 'Orphan Care Program', 
          org: 'Islamic Relief Kenya', 
          target: 500000, 
          raised: 342000, 
          category: 'orphan',
          description: 'Support 50 orphans with food, education, and healthcare for one year.',
          location: 'Garissa, Kenya',
          donors: 142,
          verified: true
        },
        { 
          id: 2, 
          name: 'Mosque Construction Fund', 
          org: 'Westlands Muslim Community', 
          target: 2000000, 
          raised: 1450000, 
          category: 'masjid',
          description: 'Complete the construction of a new mosque to serve 500+ worshippers.',
          location: 'Westlands, Nairobi',
          donors: 320,
          verified: true
        },
        { 
          id: 3, 
          name: 'Water Well Project', 
          org: 'Muslim Aid Kenya', 
          target: 800000, 
          raised: 620000, 
          category: 'water',
          description: 'Provide clean water access to 300 households in Turkana region.',
          location: 'Turkana, Kenya',
          donors: 98,
          verified: true
        },
        { 
          id: 4, 
          name: 'Medical Assistance Fund', 
          org: 'Al-Shifa Medical Trust', 
          target: 300000, 
          raised: 85000, 
          category: 'medical',
          description: 'Support free medical services for low-income families.',
          location: 'Eastleigh, Nairobi',
          donors: 45,
          verified: true
        },
        { 
          id: 5, 
          name: 'Food Distribution Program', 
          org: 'Muslim Relief Association', 
          target: 600000, 
          raised: 210000, 
          category: 'water',
          description: 'Provide food packages to 200 families affected by drought.',
          location: 'Wajir, Kenya',
          donors: 67,
          verified: true
        },
        { 
          id: 6, 
          name: 'Islamic Education Center', 
          org: 'Mombasa Islamic Center', 
          target: 250000, 
          raised: 120000, 
          category: 'education',
          description: 'Build classrooms and provide resources for 80 Quran students.',
          location: 'Mombasa, Kenya',
          donors: 56,
          verified: true
        },
        { 
          id: 7, 
          name: 'Emergency Relief Fund', 
          org: 'Kenya Muslim Emergency Response', 
          target: 400000, 
          raised: 95000, 
          category: 'emergency',
          description: 'Urgent humanitarian assistance for displaced families.',
          location: 'Nationwide',
          donors: 34,
          verified: true
        },
        { 
          id: 8, 
          name: 'Imam Support Program', 
          org: 'National Imam Welfare Fund', 
          target: 350000, 
          raised: 78000, 
          category: 'imam',
          description: 'Supporting Imams through community-powered retirement.',
          location: 'Nationwide',
          donors: 28,
          verified: true
        }
      ];
      
      setCauses(mockCauses);
      if (mockCauses.length > 0) {
        setSelectedCause(mockCauses[0]);
      }
    } catch (err) {
      setError('Failed to load causes. Please refresh.');
      console.error('Causes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationHistory = async () => {
    setLoadingHistory(true);
    try {
      setDonationHistory([
        { id: 1, date: '2024-04-01', amount: 500, cause: 'Orphan Care Program', status: 'completed', receiptId: 'SAD-2024-001' },
        { id: 2, date: '2024-03-15', amount: 1000, cause: 'Water Well Project', status: 'completed', receiptId: 'SAD-2024-002' },
        { id: 3, date: '2024-02-20', amount: 250, cause: 'Mosque Construction Fund', status: 'completed', receiptId: 'SAD-2024-003' },
        { id: 4, date: '2024-01-10', amount: 500, cause: 'Orphan Care Program', status: 'completed', receiptId: 'SAD-2024-004' }
      ]);
    } catch (err) {
      console.error('History error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchImpactStats = async () => {
    try {
      setImpactStats({
        totalGiven: 8400,
        totalDonations: 14,
        livesImpacted: 6,
        causesSupported: 4
      });
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const handleDonate = () => {
    if (!selectedCause) {
      setError('Please select a cause');
      return;
    }
    if (!amount || parseFloat(amount) < 10) {
      setError('Please enter a valid amount (minimum KES 10)');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmDonation = async () => {
    setProcessing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const receipt = {
        id: `SAD-${Date.now()}`,
        amount: parseFloat(amount),
        cause: selectedCause.name,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      setReceiptData(receipt);
      setShowConfirmModal(false);
      setShowReceiptModal(true);
      setAmount('');
      await fetchCauses();
      await fetchDonationHistory();
      await fetchImpactStats();
      
      setSuccess(`Sadaqa of KES ${parseFloat(amount).toLocaleString()} sent successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Donation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
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

  // Filter causes
  const filteredCauses = causes.filter(cause => {
    const matchesSearch = cause.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cause.org.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cause.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || cause.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading causes...</p>
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
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Sadaqa</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Voluntary Charity</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Give Voluntary Charity
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Support meaningful causes through verified organizations. Every contribution makes a difference.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                Sadaqah Jariyah
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
          
          {/* ===== LEFT COLUMN - CAUSES ===== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search & Filter */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Search</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    placeholder="Search causes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Category</label>
                  <select
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
            {filteredCauses.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-12 text-center">
                <p className="text-sm text-[#94A3B8]">No causes found. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCauses.map((cause) => {
                  const pct = Math.round((cause.raised / cause.target) * 100);
                  const isSelected = selectedCause?.id === cause.id;
                  return (
                    <div 
                      key={cause.id} 
                      className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-[#1769AA] shadow-md shadow-[#1769AA]/10' 
                          : 'border-[#E8EEF4] hover:border-[#1769AA]/40 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedCause(cause)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[#1A2A3A] text-sm">{cause.name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">{cause.org}</p>
                          <p className="text-xs text-[#94A3B8]">{cause.location}</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                          {categories.find(c => c.id === cause.category)?.label || cause.category}
                        </span>
                      </div>

                      <p className="text-xs text-[#5A6A7A] line-clamp-2">{cause.description}</p>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#94A3B8]">Raised</span>
                          <span className="font-semibold text-[#1A2A3A]">{formatCurrency(cause.raised)}</span>
                        </div>
                        <div className="h-1.5 bg-[#F1F7FC] rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-[#1769AA] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-[#94A3B8]">Target: {formatCurrency(cause.target)}</span>
                          <span className="font-medium text-[#1769AA]">{pct}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F7FC]">
                        <span className="text-xs text-[#94A3B8]">{cause.donors} donors</span>
                        {isSelected && (
                          <span className="text-xs font-semibold text-[#1769AA]">Selected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-6">
            
            {/* Donation Form */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 sticky top-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Give Sadaqa</h3>
              
              {selectedCause ? (
                <div className="mb-4 p-3 bg-[#F1F7FC] rounded-lg">
                  <div className="text-sm font-semibold text-[#1A2A3A]">{selectedCause.name}</div>
                  <div className="text-xs text-[#94A3B8]">{selectedCause.org}</div>
                </div>
              ) : (
                <p className="text-sm text-[#94A3B8] mb-4">Select a cause to support</p>
              )}

              <div className="mb-4">
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-2">Amount (KES)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
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
                  min="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <button
                className="w-full py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleDonate}
                disabled={!selectedCause || !amount || processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Give Sadaqa'
                )}
              </button>

              <p className="text-[10px] text-[#94A3B8] text-center mt-3">
                100% reaches beneficiaries · No platform fee
              </p>
            </div>

            {/* Impact Stats */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Your Impact</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-[#F1F7FC] rounded-lg">
                  <div className="text-lg font-bold text-[#1769AA]">{formatCurrency(impactStats.totalGiven)}</div>
                  <div className="text-xs text-[#94A3B8]">Total Given</div>
                </div>
                <div className="text-center p-3 bg-[#F1F7FC] rounded-lg">
                  <div className="text-lg font-bold text-[#1769AA]">{impactStats.totalDonations}</div>
                  <div className="text-xs text-[#94A3B8]">Donations</div>
                </div>
                <div className="text-center p-3 bg-[#F1F7FC] rounded-lg">
                  <div className="text-lg font-bold text-emerald-600">{impactStats.livesImpacted}</div>
                  <div className="text-xs text-[#94A3B8]">Lives Impacted</div>
                </div>
                <div className="text-center p-3 bg-[#F1F7FC] rounded-lg">
                  <div className="text-lg font-bold text-[#1769AA]">{impactStats.causesSupported}</div>
                  <div className="text-xs text-[#94A3B8]">Causes Supported</div>
                </div>
              </div>
            </div>

            {/* Recent Donations */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1A2A3A]">Recent Donations</h3>
                <button 
                  className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                  onClick={fetchDonationHistory}
                >
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
                </div>
              ) : donationHistory.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#94A3B8]">No donations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {donationHistory.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 bg-[#F1F7FC] rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-[#1A2A3A]">{donation.cause}</div>
                        <div className="text-xs text-[#94A3B8]">{formatDate(donation.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#1769AA]">{formatCurrency(donation.amount)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(donation.status)}`}>
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
      </div>

      {/* ===== CONFIRMATION MODAL ===== */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Sadaqa</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowConfirmModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <div className="text-xs text-[#94A3B8]">Amount</div>
                <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(parseFloat(amount) || 0)}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Cause</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedCause?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Organization</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedCause?.org}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Type</span>
                  <span className="font-semibold text-[#1A2A3A]">Sadaqah Jariyah</span>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-sm text-emerald-700 leading-relaxed">
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
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
                onClick={confirmDonation}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Donation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RECEIPT MODAL ===== */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] bg-[#1769AA] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Donation Successful!</h3>
                <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowReceiptModal(false)}>
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
                <div className="text-sm text-[#94A3B8]">You donated to</div>
                <div className="text-lg font-bold text-[#1A2A3A]">{receiptData.cause}</div>
                <div className="text-xl font-bold text-[#1769AA]">{formatCurrency(receiptData.amount)}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Reference</span>
                  <span className="font-mono text-xs text-[#5A6A7A]">{receiptData.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Date</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(receiptData.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Type</span>
                  <span className="font-semibold text-[#1A2A3A]">Sadaqah Jariyah</span>
                </div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => {
                  alert('Receipt download will be available in the full version.');
                }}
              >
                Download
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                onClick={() => setShowReceiptModal(false)}
              >
                Done
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

export default Sadaqa;