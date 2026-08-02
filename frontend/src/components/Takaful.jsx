import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { takafulService } from '../services/api';

const Takaful = () => {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Plans
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // User's policy
  const [myPolicy, setMyPolicy] = useState(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  
  // Family members
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relation: '', age: '' });
  
  // Pool stats
  const [poolStats, setPoolStats] = useState({
    members: 0,
    balance: 0,
    claimsPaid: 0,
    surplus: 0
  });
  
  // Claims
  const [claims, setClaims] = useState([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimData, setClaimData] = useState({
    type: '',
    amount: '',
    description: '',
    date: ''
  });
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  // Relations for family members
  const relations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];

  // Claim types
  const claimTypes = ['Medical', 'Accidental Death', 'Total Disability', 'Partial Disability', 'Other'];

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchPlans(),
        fetchMyPolicy(),
        fetchPoolStats(),
        fetchClaims()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load Takaful data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await takafulService.getPlans();
      const planData = response.data.plans || [];
      setPlans(planData);
      if (planData.length > 0 && !selectedPlan) {
        setSelectedPlan(planData[0]);
      }
    } catch (err) {
      console.error('Plans error:', err);
      setPlans([]);
    }
  };

  const fetchMyPolicy = async () => {
    setLoadingPolicy(true);
    try {
      const response = await takafulService.getPolicy();
      const policy = response.data.policy;
      setMyPolicy(policy);
      if (policy) {
        setFamilyMembers(policy.familyMembers || []);
      } else {
        setFamilyMembers([]);
      }
    } catch (err) {
      console.error('Policy error:', err);
      setMyPolicy(null);
      setFamilyMembers([]);
    } finally {
      setLoadingPolicy(false);
    }
  };

  const fetchPoolStats = async () => {
    try {
      const response = await takafulService.getPoolStats();
      setPoolStats(response.data.stats || {
        members: 0,
        balance: 0,
        claimsPaid: 0,
        surplus: 0
      });
    } catch (err) {
      console.error('Pool stats error:', err);
    }
  };

  const fetchClaims = async () => {
    try {
      const response = await takafulService.getClaims();
      setClaims(response.data.claims || []);
    } catch (err) {
      console.error('Claims error:', err);
      setClaims([]);
    }
  };

  const handleEnroll = (plan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const confirmEnrollment = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await takafulService.enroll({
        plan_id: selectedPlan.id
      });

      setModalData({
        planName: response.data.planName || selectedPlan.name,
        monthlyCost: response.data.monthlyCost || selectedPlan.monthlyCost,
        coverage: response.data.coverage || selectedPlan.maxCoverage,
        transactionId: response.data.policyId || `TKF-${Date.now()}`
      });
      
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      
      await Promise.all([
        fetchMyPolicy(),
        fetchPoolStats()
      ]);
      
      setSuccess(`Enrolled in ${selectedPlan.name} successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Enrollment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // PAY MONTHLY CONTRIBUTION
  // ============================================================
  const handlePayMonthly = async () => {
    if (!myPolicy) {
      setError('No active policy found.');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const response = await takafulService.payMonthlyContribution({
        policyId: myPolicy.id,
        amount: myPolicy.monthlyContribution
      });

      setPaymentData({
        amount: response.data.amount,
        newBalance: response.data.newBalance,
        contributionId: response.data.contributionId,
        date: new Date().toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
      
      setShowPaymentSuccessModal(true);
      
      await Promise.all([
        fetchMyPolicy(),
        fetchPoolStats()
      ]);
      
      setSuccess(`Monthly contribution of ${formatCurrency(myPolicy.monthlyContribution)} paid successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.relation || !newMember.age) {
      setError('Please fill in all member details');
      return;
    }
    
    setProcessing(true);
    try {
      await takafulService.addFamilyMember({
        name: newMember.name,
        relation: newMember.relation,
        age: parseInt(newMember.age)
      });
      
      await fetchMyPolicy();
      setShowAddMember(false);
      setNewMember({ name: '', relation: '', age: '' });
      setSuccess('Family member added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add family member');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this family member?')) return;
    
    setProcessing(true);
    try {
      await takafulService.removeFamilyMember(memberId);
      await fetchMyPolicy();
      setSuccess('Family member removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove family member');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimData.type || !claimData.amount || !claimData.description) {
      setError('Please fill in all required fields');
      return;
    }
    
    setProcessing(true);
    try {
      await takafulService.submitClaim({
        type: claimData.type,
        amount: parseInt(claimData.amount),
        description: claimData.description
      });
      
      setShowClaimForm(false);
      setClaimData({ type: '', amount: '', description: '', date: '' });
      await fetchClaims();
      
      setSuccess('Claim submitted successfully! You will be contacted within 24 hours.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit claim. Please try again.');
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

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'bg-[#3FAF73]/10 text-[#3FAF73] border-[#3FAF73]/20',
      'approved': 'bg-[#3FAF73]/10 text-[#3FAF73] border-[#3FAF73]/20',
      'pending': 'bg-[#C9A44B]/10 text-[#C9A44B] border-[#C9A44B]/20',
      'expired': 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20',
      'rejected': 'bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20'
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Active',
      'approved': 'Approved',
      'pending': 'Pending',
      'expired': 'Expired',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  };

  const getPlanTypeLabel = (type) => {
    const labels = {
      'individual': 'Individual',
      'family': 'Family',
      'business': 'Business'
    };
    return labels[type] || type;
  };

  // SVG Icons
  const CloseIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-8 h-8 text-[#3FAF73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );

  const ShieldIcon = () => (
    <svg className="w-4 h-4 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-4 h-4 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const WalletIcon = () => (
    <svg className="w-4 h-4 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const FileIcon = () => (
    <svg className="w-4 h-4 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
            <p className="text-[#6B7280] mt-3 text-sm">Loading Takaful plans...</p>
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
              onClick={() => { setError(''); fetchAllData(); }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ===== HERO / OVERVIEW SECTION ===== */}
        <div className="bg-[#0B342B] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl shadow-[#0B342B]/20 border border-[rgba(201,164,75,0.15)] mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldIcon />
                <span className="text-[10px] font-semibold text-[#B7C0BA] uppercase tracking-wider">Takaful</span>
                <span className="w-px h-3 bg-[rgba(201,164,75,0.2)]" />
                <span className="text-[10px] font-medium text-[#C9A44B]">Tabarru' Model</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#F7F6F1]">Your Takaful Status</h2>
              <p className="text-xs text-[#B7C0BA] mt-0.5">Mutual protection through shared responsibility</p>
            </div>
            {myPolicy ? (
              <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-full border ${getStatusBadge(myPolicy.status)} bg-white/10 backdrop-blur-sm`}>
                {getStatusLabel(myPolicy.status)} · {myPolicy.planName}
              </span>
            ) : (
              <span className="text-[10px] text-[#B7C0BA] bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[rgba(201,164,75,0.15)]">
                No active policy
              </span>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[rgba(201,164,75,0.12)]">
            <div>
              <div className="text-lg sm:text-xl font-bold text-[#F7F6F1]">{poolStats.members.toLocaleString()}</div>
              <div className="text-[10px] text-[#B7C0BA]/60">Pool Members</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-[#C9A44B]">{formatCurrency(poolStats.balance)}</div>
              <div className="text-[10px] text-[#B7C0BA]/60">Pool Balance</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-[#3FAF73]">{poolStats.claimsPaid}%</div>
              <div className="text-[10px] text-[#B7C0BA]/60">Claims Paid</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-[#F7F6F1]">{myPolicy ? myPolicy.members : '0'}</div>
              <div className="text-[10px] text-[#B7C0BA]/60">Your Coverage</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[rgba(201,164,75,0.12)]">
            {!myPolicy ? (
              <button 
                className="px-4 py-1.5 bg-[#C9A44B] text-[#032A24] text-xs font-bold rounded-lg hover:bg-[#E1C16B] transition-all duration-200 shadow-lg shadow-[#C9A44B]/20"
                onClick={() => document.querySelector('.plans-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Plans
              </button>
            ) : (
              <button 
                className="px-4 py-1.5 bg-white/10 backdrop-blur-sm text-[#F7F6F1] text-xs font-semibold rounded-lg border border-[rgba(201,164,75,0.2)] hover:bg-white/20 transition-all duration-200"
                onClick={() => document.querySelector('.policy-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View My Coverage
              </button>
            )}
            <button 
              className="px-4 py-1.5 bg-white/10 backdrop-blur-sm text-[#F7F6F1] text-xs font-semibold rounded-lg border border-[rgba(201,164,75,0.2)] hover:bg-white/20 transition-all duration-200"
              onClick={() => document.querySelector('.pool-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Community Pool
            </button>
          </div>
        </div>

        {/* ===== TAKAFUL PLANS ===== */}
        <div className="plans-section mb-6">
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-1 h-5 bg-[#0B342B] rounded-full" />
            <h2 className="text-sm font-bold text-[#1F2937]">Takaful Plans</h2>
            <span className="text-[10px] text-[#6B7280]">Choose your coverage</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer ${
                  selectedPlan?.id === plan.id 
                    ? 'border-[#0B342B] shadow-md shadow-[#0B342B]/10' 
                    : 'border-[rgba(11,52,43,0.08)] hover:border-[#0B342B]/40 hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#1F2937]">{plan.name}</h3>
                      {myPolicy && (
                        <span className="text-[10px] font-semibold bg-[#3FAF73]/10 text-[#3FAF73] px-2.5 py-0.5 rounded-full border border-[#3FAF73]/20">
                          ✓ Enrolled
                        </span>
                      )}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        plan.type === 'family' ? 'bg-[#0B342B]/10 text-[#0B342B]' :
                        plan.type === 'business' ? 'bg-[#C9A44B]/10 text-[#C9A44B]' :
                        'bg-[#0B342B]/5 text-[#0B342B]'
                      }`}>
                        {getPlanTypeLabel(plan.type)}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#0B342B]">{formatCurrency(plan.monthlyCost)}</div>
                    <div className="text-[10px] text-[#6B7280]">per month</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {plan.benefits && plan.benefits.map((benefit, index) => (
                    <span key={index} className="text-[10px] text-[#1F2937] bg-[#FAFAF7] px-2.5 py-0.5 rounded-full border border-[rgba(11,52,43,0.06)]">
                      {benefit}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-[rgba(11,52,43,0.06)]">
                  <div>
                    <span className="text-[10px] text-[#6B7280]">Coverage up to</span>
                    <div className="text-sm font-bold text-[#1F2937]">{formatCurrency(plan.maxCoverage)}</div>
                  </div>
                  {!myPolicy && (
                    <button 
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        selectedPlan?.id === plan.id 
                          ? 'bg-[#0B342B] text-[#F7F6F1] hover:bg-[#12342D] shadow-md shadow-[#0B342B]/20' 
                          : 'bg-white text-[#6B7280] border border-[rgba(11,52,43,0.12)] hover:border-[#0B342B] hover:text-[#0B342B]'
                      }`}
                      onClick={(e) => { e.stopPropagation(); handleEnroll(plan); }}
                    >
                      {selectedPlan?.id === plan.id ? 'Enroll Now' : 'Select Plan'}
                    </button>
                  )}
                  {myPolicy && selectedPlan?.id === plan.id && (
                    <span className="text-xs font-semibold text-[#3FAF73] bg-[#3FAF73]/10 px-3 py-1 rounded-lg border border-[#3FAF73]/20">
                      ✓ Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tabarru' Info */}
          <div className="mt-3 bg-[#FAFAF7] rounded-xl p-4 border border-[rgba(11,52,43,0.08)]">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0B342B]/5 flex items-center justify-center flex-shrink-0">
                <ShieldIcon />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1F2937]">What is Tabarru'?</h4>
                <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                  Tabarru' means "donation" in Arabic. In Takaful, participants donate part of their contributions 
                  to a pool to help fellow members in need.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TWO COLUMN LAYOUT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* ===== LEFT COLUMN - MY POLICY ===== */}
          <div className="lg:col-span-2 policy-section">
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserIcon />
                  <h3 className="text-sm font-bold text-[#1F2937]">My Coverage</h3>
                </div>
                {myPolicy && (
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(myPolicy.status)}`}>
                    {getStatusLabel(myPolicy.status)}
                  </span>
                )}
              </div>

              {loadingPolicy ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
                </div>
              ) : myPolicy ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-center border border-[rgba(11,52,43,0.06)]">
                      <div className="text-[10px] text-[#6B7280]">Plan</div>
                      <div className="text-xs font-semibold text-[#1F2937] truncate">{myPolicy.planName}</div>
                    </div>
                    <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-center border border-[rgba(11,52,43,0.06)]">
                      <div className="text-[10px] text-[#6B7280]">Monthly</div>
                      <div className="text-xs font-semibold text-[#0B342B]">{formatCurrency(myPolicy.monthlyContribution)}</div>
                    </div>
                    <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-center border border-[rgba(11,52,43,0.06)]">
                      <div className="text-[10px] text-[#6B7280]">Members</div>
                      <div className="text-xs font-semibold text-[#1F2937]">{myPolicy.members}</div>
                    </div>
                    <div className="bg-[#FAFAF7] rounded-lg p-2.5 text-center border border-[rgba(11,52,43,0.06)]">
                      <div className="text-[10px] text-[#6B7280]">Coverage</div>
                      <div className="text-xs font-semibold text-[#1F2937]">{formatCurrency(myPolicy.totalCoverage)}</div>
                    </div>
                  </div>

                  {/* Family Members */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                        <UserIcon /> Family Members
                      </span>
                      <button 
                        className="text-[10px] font-semibold text-[#0B342B] hover:text-[#12342D] transition-colors"
                        onClick={() => setShowAddMember(true)}
                      >
                        + Add Member
                      </button>
                    </div>
                    <div className="space-y-1">
                      {familyMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between text-xs border-b border-[rgba(11,52,43,0.06)] py-1.5">
                          <span className="font-medium text-[#1F2937]">{member.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                            <span className="bg-[#FAFAF7] px-2 py-0.5 rounded-full text-[#0B342B]">{member.relation}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-[#E5E7EB]" />
                            <span>{member.age} yrs</span>
                          </div>
                          <button 
                            className="text-[10px] text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {familyMembers.length === 0 && (
                        <p className="text-[10px] text-[#6B7280] text-center py-2">No family members added</p>
                      )}
                    </div>
                  </div>

                  {/* Contributions */}
                  {myPolicy.contributions && myPolicy.contributions.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                        <WalletIcon /> Recent Contributions
                      </span>
                      <div className="space-y-1 mt-1.5">
                        {myPolicy.contributions.slice(0, 3).map((contribution, index) => (
                          <div key={index} className="flex items-center justify-between text-xs border-b border-[rgba(11,52,43,0.06)] py-1.5">
                            <span className="text-[10px] text-[#6B7280]">{formatDate(contribution.date)}</span>
                            <span className="font-semibold text-[#1F2937]">{formatCurrency(contribution.amount)}</span>
                            <span className="text-[10px] text-[#3FAF73] font-semibold">Paid</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ============================================================
                      MONTHLY PAYMENT BUTTON
                      ============================================================ */}
                  <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[rgba(11,52,43,0.08)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-[#1F2937]">Monthly Contribution</div>
                        <div className="text-sm font-bold text-[#0B342B]">{formatCurrency(myPolicy.monthlyContribution)}</div>
                        <div className="text-[9px] text-[#6B7280]">Due: {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</div>
                      </div>
                      <button 
                        className="px-5 py-2.5 bg-[#C9A44B] text-[#032A24] font-semibold text-sm rounded-lg hover:bg-[#E1C16B] transition-all duration-200 shadow-md shadow-[#C9A44B]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={handlePayMonthly}
                        disabled={processing}
                      >
                        {processing ? (
                          <span className="flex items-center gap-2">
                            <SpinnerIcon />
                            Processing...
                          </span>
                        ) : (
                          `Pay Now (${formatCurrency(myPolicy.monthlyContribution)})`
                        )}
                      </button>
                    </div>
                    <p className="text-[9px] text-[#6B7280] mt-2 text-center">
                      Pay your monthly contribution to maintain your Takaful coverage
                    </p>
                  </div>

                  <button 
                    className="w-full py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                    onClick={() => setShowClaimForm(true)}
                  >
                    File a Claim
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-[#0B342B]/5 flex items-center justify-center mx-auto mb-3 border-2 border-[rgba(11,52,43,0.08)]">
                    <ShieldIcon />
                  </div>
                  <h4 className="text-sm font-semibold text-[#1F2937]">No Active Policy</h4>
                  <p className="text-xs text-[#6B7280] mt-1">Enroll in a Takaful plan to get covered</p>
                </div>
              )}
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-4">
            
            {/* ===== POOL STATS ===== */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 pool-section">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <WalletIcon />
                  <h3 className="text-sm font-bold text-[#1F2937]">Pool Statistics</h3>
                </div>
                <span className="text-[10px] font-semibold text-[#C9A44B] bg-[#C9A44B]/10 px-2 py-0.5 rounded-full border border-[rgba(201,164,75,0.18)]">Barakah</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-sm font-bold text-[#1F2937]">{poolStats.members.toLocaleString()}</div>
                  <div className="text-[10px] text-[#6B7280]">Members</div>
                </div>
                <div className="text-center p-2 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-sm font-bold text-[#0B342B]">{formatCurrency(poolStats.balance)}</div>
                  <div className="text-[10px] text-[#6B7280]">Balance</div>
                </div>
                <div className="text-center p-2 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-sm font-bold text-[#3FAF73]">{poolStats.claimsPaid}%</div>
                  <div className="text-[10px] text-[#6B7280]">Claims</div>
                </div>
              </div>
            </div>

            {/* ===== RECENT CLAIMS ===== */}
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileIcon />
                  <h3 className="text-sm font-bold text-[#1F2937]">Recent Claims</h3>
                </div>
                <button 
                  className="text-[10px] text-[#6B7280] hover:text-[#0B342B] transition-colors"
                  onClick={fetchClaims}
                >
                  Refresh
                </button>
              </div>

              {claims.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-xl text-[#E5E7EB] mb-1.5">—</div>
                  <p className="text-xs text-[#6B7280]">No claims submitted</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {claims.slice(0, 3).map((claim) => (
                    <div key={claim.id} className="flex items-center justify-between p-2.5 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                      <div>
                        <div className="text-xs font-medium text-[#1F2937]">{claim.type}</div>
                        <div className="text-[10px] text-[#6B7280]">{formatDate(claim.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#1F2937]">{formatCurrency(claim.amount)}</div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${getStatusBadge(claim.status)}`}>
                          {getStatusLabel(claim.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== ENROLLMENT CONFIRMATION MODAL ===== */}
        {showConfirmModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(11,52,43,0.06)] flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
                <h3 className="text-sm font-bold text-[#1F2937]">Confirm Enrollment</h3>
                <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={() => setShowConfirmModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-[#0B342B]/5 flex items-center justify-center mx-auto">
                    <ShieldIcon />
                  </div>
                  <div className="text-sm font-bold text-[#1F2937] mt-2">{selectedPlan.name}</div>
                  <div className="text-xs text-[#6B7280]">{getPlanTypeLabel(selectedPlan.type)}</div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 space-y-1.5 border border-[rgba(11,52,43,0.06)]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Monthly Contribution</span>
                    <span className="font-semibold text-[#1F2937]">{formatCurrency(selectedPlan.monthlyCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Annual Cost</span>
                    <span className="font-semibold text-[#1F2937]">{formatCurrency(selectedPlan.annualCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Coverage Amount</span>
                    <span className="font-semibold text-[#0B342B]">{formatCurrency(selectedPlan.maxCoverage)}</span>
                  </div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 text-center border border-[rgba(11,52,43,0.06)]">
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    This is a <span className="font-semibold text-[#0B342B]">Tabarru'</span> (donation) based Takaful. By enrolling, you agree to participate in 
                    mutual guarantee and cooperation.
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[rgba(11,52,43,0.06)] flex gap-2.5">
                <button 
                  className="flex-1 px-4 py-2 bg-white text-[#6B7280] font-semibold text-sm rounded-lg border border-[rgba(11,52,43,0.12)] hover:bg-[#FAFAF7] transition-all duration-200"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] px-4 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                  onClick={confirmEnrollment}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon />
                      Processing...
                    </span>
                  ) : (
                    'Confirm Enrollment'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ENROLLMENT SUCCESS MODAL ===== */}
        {showSuccessModal && modalData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(11,52,43,0.06)] bg-[#0B342B] rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[#F7F6F1]">Enrollment Successful!</h3>
                  <button className="text-[#F7F6F1]/60 hover:text-[#F7F6F1] transition-colors" onClick={() => setShowSuccessModal(false)}>
                    <CloseIcon />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[#3FAF73]/10 flex items-center justify-center mx-auto border-4 border-[#3FAF73]/20">
                  <CheckIcon />
                </div>
                
                <div>
                  <div className="text-xs text-[#6B7280]">You're now covered under</div>
                  <div className="text-lg font-bold text-[#1F2937]">{modalData.planName}</div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 text-left space-y-1.5 border border-[rgba(11,52,43,0.06)]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Monthly Contribution</span>
                    <span className="font-semibold text-[#1F2937]">{formatCurrency(modalData.monthlyCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Coverage</span>
                    <span className="font-semibold text-[#0B342B]">{formatCurrency(modalData.coverage)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Transaction ID</span>
                    <span className="font-mono text-[10px] text-[#6B7280]">{modalData.transactionId}</span>
                  </div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 border border-[rgba(11,52,43,0.06)]">
                  <p className="text-xs text-[#6B7280] italic leading-relaxed">
                    "Cooperate in righteousness and piety" — Quran 5:2
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[rgba(11,52,43,0.06)]">
                <button 
                  className="w-full px-4 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MONTHLY PAYMENT SUCCESS MODAL ===== */}
        {showPaymentSuccessModal && paymentData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(11,52,43,0.06)] bg-[#3FAF73] rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Payment Successful!</h3>
                  <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowPaymentSuccessModal(false)}>
                    <CloseIcon />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[#3FAF73]/10 flex items-center justify-center mx-auto border-4 border-[#3FAF73]/20">
                  <CheckIcon />
                </div>
                
                <div>
                  <div className="text-xs text-[#6B7280]">Monthly contribution paid</div>
                  <div className="text-lg font-bold text-[#1F2937]">{formatCurrency(paymentData.amount)}</div>
                  <div className="text-[10px] text-[#6B7280]">{paymentData.date}</div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 text-left space-y-1.5 border border-[rgba(11,52,43,0.06)]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Contribution ID</span>
                    <span className="font-mono text-[10px] text-[#6B7280]">{paymentData.contributionId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Amount</span>
                    <span className="font-semibold text-[#1F2937]">{formatCurrency(paymentData.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">New Balance</span>
                    <span className="font-semibold text-[#0B342B]">{formatCurrency(paymentData.newBalance)}</span>
                  </div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 border border-[rgba(11,52,43,0.06)]">
                  <p className="text-xs text-[#6B7280] italic leading-relaxed">
                    Your Takaful coverage remains active. Jazakallah Khair!
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[rgba(11,52,43,0.06)]">
                <button 
                  className="w-full px-4 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20"
                  onClick={() => setShowPaymentSuccessModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ADD FAMILY MEMBER MODAL ===== */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(11,52,43,0.06)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserIcon />
                  <h3 className="text-sm font-bold text-[#1F2937]">Add Family Member</h3>
                </div>
                <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={() => setShowAddMember(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="text"
                    placeholder="Enter name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Relation</label>
                  <select
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    value={newMember.relation}
                    onChange={(e) => setNewMember({...newMember, relation: e.target.value})}
                  >
                    <option value="">Select relation</option>
                    {relations.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Age</label>
                  <input
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number"
                    placeholder="Enter age"
                    min="0"
                    max="120"
                    value={newMember.age}
                    onChange={(e) => setNewMember({...newMember, age: e.target.value})}
                  />
                </div>

                {error && <p className="text-xs text-[#DC2626]">{error}</p>}
              </div>
              
              <div className="p-4 border-t border-[rgba(11,52,43,0.06)] flex gap-2.5">
                <button 
                  className="flex-1 px-4 py-2 bg-white text-[#6B7280] font-semibold text-sm rounded-lg border border-[rgba(11,52,43,0.12)] hover:bg-[#FAFAF7] transition-all duration-200"
                  onClick={() => setShowAddMember(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] px-4 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                  onClick={handleAddMember}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon />
                      Adding...
                    </span>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== CLAIM FORM MODAL ===== */}
        {showClaimForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(11,52,43,0.06)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileIcon />
                  <h3 className="text-sm font-bold text-[#1F2937]">File a Claim</h3>
                </div>
                <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={() => setShowClaimForm(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Claim Type</label>
                  <select
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    value={claimData.type}
                    onChange={(e) => setClaimData({...claimData, type: e.target.value})}
                  >
                    <option value="">Select claim type</option>
                    {claimTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Amount (KES)</label>
                  <input
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
                    type="number"
                    placeholder="Enter amount"
                    min="100"
                    value={claimData.amount}
                    onChange={(e) => setClaimData({...claimData, amount: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200 resize-y"
                    rows="3"
                    placeholder="Describe your claim..."
                    value={claimData.description}
                    onChange={(e) => setClaimData({...claimData, description: e.target.value})}
                  />
                </div>

                {error && <p className="text-xs text-[#DC2626]">{error}</p>}
              </div>
              
              <div className="p-4 border-t border-[rgba(11,52,43,0.06)] flex gap-2.5">
                <button 
                  className="flex-1 px-4 py-2 bg-white text-[#6B7280] font-semibold text-sm rounded-lg border border-[rgba(11,52,43,0.12)] hover:bg-[#FAFAF7] transition-all duration-200"
                  onClick={() => setShowClaimForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] px-4 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                  onClick={handleSubmitClaim}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Claim'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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

export default Takaful;