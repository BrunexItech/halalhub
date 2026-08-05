import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderService, walletService } from '../services/api';

const LeaderDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const loggedInUser = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
  
  const [pensionData, setPensionData] = useState({
    totalAmount: 0,
    totalSupporters: 0,
    totalTransactions: 0
  });
  const [profile, setProfile] = useState(null);
  const [leaderType, setLeaderType] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [supporters, setSupporters] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSupportersModal, setShowSupportersModal] = useState(false);
  
  const [contributeAmount, setContributeAmount] = useState('');
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    notes: ''
  });

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pensionRes, profileRes, contribRes, supportersRes, walletRes] = await Promise.all([
        leaderService.getPension(),
        leaderService.getProfile(),
        leaderService.getPensionHistory({ limit: 10 }),
        leaderService.getSupporters(),
        walletService.getBalance()
      ]);
      
      const pension = pensionRes.data.pension || {};
      setPensionData({
        totalAmount: pension.total_amount || 0,
        totalSupporters: pension.total_supporters || 0,
        totalTransactions: pension.total_transactions || 0
      });
      
      setProfile(profileRes.data.leader || null);
      setLeaderType(profileRes.data.leader?.leader_type || '');
      setShareLink(profileRes.data.leader?.share_link || '');
      setIsPublic(profileRes.data.leader?.is_public || false);
      setContributions(contribRes.data.contributions || []);
      setSupporters(supportersRes.data.supporters || []);
      setWalletBalance(walletRes.data.balance || 0);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load pension data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfContribute = async () => {
    if (!contributeAmount || parseFloat(contributeAmount) < 10) {
      setError('Minimum contribution is KES 10');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (parseFloat(contributeAmount) > walletBalance) {
      setError(`Insufficient wallet balance. Available: KES ${walletBalance.toLocaleString()}`);
      setTimeout(() => setError(''), 4000);
      return;
    }

    setProcessing(true);
    try {
      await leaderService.selfContribute({
        amount: parseFloat(contributeAmount)
      });
      
      setSuccess(`Successfully contributed KES ${parseFloat(contributeAmount).toLocaleString()}`);
      setShowContributeModal(false);
      setContributeAmount('');
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to contribute');
      setTimeout(() => setError(''), 4000);
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdrawRequest = async () => {
    if (!withdrawData.amount || parseFloat(withdrawData.amount) < 100) {
      setError('Minimum withdrawal request is KES 100');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (parseFloat(withdrawData.amount) > pensionData.totalAmount) {
      setError(`Insufficient pension balance. Available: KES ${pensionData.totalAmount.toLocaleString()}`);
      setTimeout(() => setError(''), 4000);
      return;
    }

    setProcessing(true);
    try {
      await leaderService.requestWithdrawal({
        amount: parseFloat(withdrawData.amount),
        notes: withdrawData.notes
      });
      
      setSuccess('Withdrawal request submitted. Awaiting admin approval.');
      setShowWithdrawModal(false);
      setWithdrawData({ amount: '', notes: '' });
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit withdrawal request');
      setTimeout(() => setError(''), 4000);
    } finally {
      setProcessing(false);
    }
  };

  const handleShareLink = async () => {
    if (isPublic) {
      setShowShareModal(true);
      return;
    }

    setProcessing(true);
    try {
      if (profile?.status !== 'approved') {
        setError('Your profile must be approved by admin first.');
        setTimeout(() => setError(''), 4000);
        setProcessing(false);
        return;
      }

      const response = await leaderService.shareLink();
      setShareLink(response.data.share_link);
      setIsPublic(response.data.is_public);
      setSuccess('Your profile is now public. People can find and support you.');
      setTimeout(() => setSuccess(''), 4000);
      setShowShareModal(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share profile');
      setTimeout(() => setError(''), 4000);
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

  const getLeaderTypeLabel = (type) => {
    const labels = {
      'islamic_scholar': 'Islamic Scholar',
      'imam': 'Imam',
      'adhan_caller': 'Adhan Caller',
      'ustadh': 'Ustadh',
      'ustadha': 'Ustadha',
      'kadhi': 'Kadhi'
    };
    return labels[type] || type;
  };

  const getInitials = () => {
    const displayName = loggedInUser?.fullName || profile?.name || 'LD';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayName = () => {
    return loggedInUser?.fullName || profile?.name || 'Religious Leader';
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'rejected': 'bg-red-50 text-red-700 border-red-200',
      'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return styles[status] || 'bg-gray-50 text-gray-500 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      
      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full bg-white rounded-xl shadow-lg border-l-4 border-red-500 p-4 animate-slideDown">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-sm font-medium">Error</span>
            <p className="text-sm text-[#6B7280] flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-[#6B7280] hover:text-[#1F2937]">✕</button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full bg-white rounded-xl shadow-lg border-l-4 border-emerald-500 p-4 animate-slideDown">
          <div className="flex items-start gap-3">
            <span className="text-emerald-500 text-sm font-medium">Success</span>
            <p className="text-sm text-[#6B7280] flex-1">{success}</p>
            <button onClick={() => setSuccess('')} className="text-[#6B7280] hover:text-[#1F2937]">✕</button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#032A24] via-[#0B342B] to-[#032A24] mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 rounded-2xl p-6 md:p-8 shadow-lg shadow-[#0B342B]/10 border border-[#C9A44B]/10">
        <div className="absolute top-0 right-0 w-56 h-56 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#C9A44B]/10 flex items-center justify-center text-[#C9A44B] text-xl font-bold border border-[#C9A44B]/20">
                {getInitials()}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#FFFFFF]">
                  {getDisplayName()}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-[#C9A44B]">{getLeaderTypeLabel(leaderType)}</span>
                  <span className="w-1 h-1 rounded-full bg-[#C9A44B]/40" />
                  <span className="text-sm text-[#C9A44B]/70">{profile?.years_of_service || 0} years</span>
                  {profile?.is_verified && (
                    <span className="text-xs font-medium text-[#D1FAE5] bg-[#3FAF73]/20 px-2 py-0.5 rounded-full border border-[#3FAF73]/30">Verified</span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    isPublic 
                      ? 'text-[#D1FAE5] bg-[#3FAF73]/20 border-[#3FAF73]/30' 
                      : 'text-[#B7C0BA] bg-white/10 border-white/10'
                  }`}>
                    {isPublic ? 'Public' : 'Private'}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    profile?.status === 'approved' 
                      ? 'text-[#D1FAE5] bg-[#3FAF73]/20 border-[#3FAF73]/30' 
                      : 'text-[#FCD34D] bg-[#FEF3C7]/20 border-[#FDE68A]/30'
                  }`}>
                    {profile?.status || 'pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Slim CTA Button - Updates after sharing */}
            <button
              className={`px-5 py-1.5 text-sm font-medium rounded-lg transition ${
                isPublic
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : profile?.status === 'approved'
                    ? 'bg-[#C9A44B] text-[#032A24] hover:bg-[#E1C16B] shadow-sm shadow-[#C9A44B]/20'
                    : 'bg-[#6B7280] text-white cursor-not-allowed opacity-50'
              }`}
              onClick={handleShareLink}
              disabled={processing || isPublic || profile?.status !== 'approved'}
            >
              {isPublic ? '✓ Profile is Public' : processing ? 'Processing...' : 'Share Support Link'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#C9A44B]/10">
            <div>
              <p className="text-xs text-[#C9A44B]/50 uppercase tracking-wider">Total Pension</p>
              <p className="text-xl font-bold text-[#FFFFFF]">{formatCurrency(pensionData.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-[#C9A44B]/50 uppercase tracking-wider">Supporters</p>
              <p className="text-xl font-bold text-[#FFFFFF]">{pensionData.totalSupporters}</p>
            </div>
            <div>
              <p className="text-xs text-[#C9A44B]/50 uppercase tracking-wider">Transactions</p>
              <p className="text-xl font-bold text-[#FFFFFF]">{pensionData.totalTransactions}</p>
            </div>
            <div>
              <p className="text-xs text-[#C9A44B]/50 uppercase tracking-wider">Wallet Balance</p>
              <p className="text-xl font-bold text-[#FFFFFF]">{formatCurrency(walletBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        
        {/* Quick Actions - Slim, No Icons, Brand Colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            className="bg-[#0B342B] text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-[#032A24] transition shadow-sm"
            onClick={() => setShowContributeModal(true)}
          >
            Add to Pension
          </button>

          <button
            className="bg-white text-[#1F2937] text-sm font-medium py-2 px-4 rounded-lg border border-[#E8EEF4] hover:border-[#C9A44B] hover:shadow-sm transition"
            onClick={() => setShowWithdrawModal(true)}
          >
            Request Withdrawal
          </button>

          <button
            className="bg-white text-[#1F2937] text-sm font-medium py-2 px-4 rounded-lg border border-[#E8EEF4] hover:border-[#C9A44B] hover:shadow-sm transition"
            onClick={() => setShowSupportersModal(true)}
          >
            View Supporters
            <span className="ml-1.5 text-xs text-[#6B7280]">({supporters.length})</span>
          </button>

          <button
            className="bg-white text-[#1F2937] text-sm font-medium py-2 px-4 rounded-lg border border-[#E8EEF4] hover:border-[#C9A44B] hover:shadow-sm transition"
            onClick={fetchData}
          >
            Refresh
          </button>
        </div>

        {/* Contribution History */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F4F5F1] flex justify-between items-center">
            <h2 className="text-sm font-semibold text-[#1F2937]">Recent Contributions</h2>
            <span className="text-sm text-[#6B7280]">{contributions.length} entries</span>
          </div>
          
          {contributions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#6B7280]">No contributions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAFAF7] border-b border-[#F4F5F1]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase hidden md:table-cell">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F5F1]">
                  {contributions.map((contrib) => (
                    <tr key={contrib.id} className="hover:bg-[#FAFAF7] transition">
                      <td className="px-4 py-3 font-medium text-[#1F2937]">
                        {contrib.is_self_contribution ? 'Self' : (contrib.supporter_name || 'Anonymous')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0B342B]">{formatCurrency(contrib.amount)}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-[#6B7280] capitalize">{contrib.payment_method || 'wallet'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(contrib.status)}`}>
                          {contrib.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-[#6B7280]">{formatDate(contrib.contribution_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contribution Modal */}
        {showContributeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
                <h2 className="text-lg font-bold text-[#1F2937]">Add to Pension</h2>
                <button className="text-[#6B7280] hover:text-[#1F2937] transition" onClick={() => setShowContributeModal(false)}>✕</button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <p className="text-sm text-[#6B7280]">Available Balance</p>
                  <p className="text-lg font-bold text-[#0B342B]">{formatCurrency(walletBalance)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#1F2937] block mb-2">Amount</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickAmounts.map((val) => (
                      <button
                        key={val}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                          parseFloat(contributeAmount) === val 
                            ? 'bg-[#0B342B] text-white' 
                            : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#E8EEF4]'
                        }`}
                        onClick={() => setContributeAmount(val.toString())}
                      >
                        {formatCurrency(val)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="10"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 px-5 py-2.5 bg-[#FAFAF7] text-[#6B7280] font-medium rounded-xl hover:bg-[#E8EEF4] transition"
                    onClick={() => setShowContributeModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-[2] px-5 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition disabled:opacity-60"
                    onClick={handleSelfContribute}
                    disabled={processing || !contributeAmount}
                  >
                    {processing ? 'Processing...' : 'Contribute'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
                <h2 className="text-lg font-bold text-[#1F2937]">Request Withdrawal</h2>
                <button className="text-[#6B7280] hover:text-[#1F2937] transition" onClick={() => setShowWithdrawModal(false)}>✕</button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-sm text-amber-700">Admin approval required</p>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <p className="text-sm text-[#6B7280]">Available</p>
                  <p className="text-lg font-bold text-[#0B342B]">{formatCurrency(pensionData.totalAmount)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#1F2937] block mb-2">Amount</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                    placeholder="Enter amount"
                    min="100"
                  />
                  <p className="text-xs text-[#6B7280] mt-1">Minimum: KES 100</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#1F2937] block mb-2">Notes</label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y"
                    rows="2"
                    value={withdrawData.notes}
                    onChange={(e) => setWithdrawData({ ...withdrawData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 px-5 py-2.5 bg-[#FAFAF7] text-[#6B7280] font-medium rounded-xl hover:bg-[#E8EEF4] transition"
                    onClick={() => setShowWithdrawModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-[2] px-5 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition disabled:opacity-60"
                    onClick={handleWithdrawRequest}
                    disabled={processing || !withdrawData.amount}
                  >
                    {processing ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supporters Modal */}
        {showSupportersModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-lg font-bold text-[#1F2937]">Supporters</h2>
                <button className="text-[#6B7280] hover:text-[#1F2937] transition" onClick={() => setShowSupportersModal(false)}>✕</button>
              </div>
              
              <div className="p-6">
                {supporters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#6B7280]">No supporters yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supporters.map((supporter) => (
                      <div key={supporter.id} className="flex items-center justify-between p-4 bg-[#FAFAF7] rounded-xl border border-[#E8EEF4] hover:bg-[#F4F5F1] transition">
                        <div>
                          <p className="font-medium text-[#1F2937]">{supporter.supporter_name || 'Anonymous'}</p>
                          <p className="text-sm text-[#6B7280]">{supporter.supporter_phone || ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#0B342B]">{formatCurrency(supporter.amount)}</p>
                          <p className="text-sm text-[#6B7280] capitalize">{supporter.frequency || 'once'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Link Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#F4F5F1] bg-[#0B342B] rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white">Profile Status</h2>
                  <button className="text-white/60 hover:text-white transition" onClick={() => setShowShareModal(false)}>✕</button>
                </div>
              </div>
              
              <div className="p-6 space-y-4 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                  isPublic ? 'bg-emerald-100' : 'bg-gray-100'
                }`}>
                  {isPublic ? (
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#1F2937]">
                    {isPublic ? 'Profile is Public' : 'Profile is Private'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isPublic ? 'text-emerald-600' : 'text-[#6B7280]'
                  }`}>
                    {isPublic 
                      ? 'Your profile is visible. People can find and support you.' 
                      : 'Your profile is private. People cannot find or support you.'}
                  </p>
                </div>

                <button
                  className="w-full py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition"
                  onClick={() => setShowShareModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LeaderDashboard;