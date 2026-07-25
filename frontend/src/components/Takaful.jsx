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
  const [modalData, setModalData] = useState(null);

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
      'active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'expired': 'bg-red-50 text-red-700 border-red-200',
      'rejected': 'bg-gray-50 text-gray-700 border-gray-200'
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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const WalletIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const ShieldIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const FileIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
            <p className="text-[#94A3B8] mt-4">Loading Takaful plans...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 border border-[#E8EEF4] animate-pulse">
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
        
        {/* ===== HERO SECTION ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl p-6 md:p-8 lg:p-10 mb-8 shadow-lg shadow-[#1769AA]/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full" />
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Takaful</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Tabarru' Model</span>
              </div>
              {myPolicy && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border border-white/20 ${getStatusBadge(myPolicy.status)} bg-white/10 backdrop-blur-sm`}>
                  {getStatusLabel(myPolicy.status)} · {myPolicy.planName}
                </span>
              )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Mutual Protection Through
                  <span className="block text-[#E8C96A]">Shared Responsibility</span>
                </h1>
                <p className="text-white/70 text-sm md:text-base mt-2 max-w-lg">
                  Join a community of participants contributing to a shared pool, supporting one another 
                  in times of need through the Islamic principle of Tabarru' (donation).
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                {!myPolicy ? (
                  <button 
                    className="px-6 py-3 bg-[#E8C96A] text-[#0a1628] font-bold rounded-xl hover:bg-[#d4b95a] transition-all duration-200 shadow-lg shadow-[#E8C96A]/20 hover:shadow-xl hover:shadow-[#E8C96A]/30"
                    onClick={() => document.querySelector('.plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Explore Plans
                  </button>
                ) : (
                  <button 
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/30 transition-all duration-200"
                    onClick={() => document.querySelector('.policy-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    View My Coverage
                  </button>
                )}
                <button 
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/10 hover:bg-white/20 transition-all duration-200"
                  onClick={() => document.querySelector('.pool-stats-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Community Pool
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <div className="text-2xl font-bold text-white">{poolStats.members.toLocaleString()}</div>
                <div className="text-xs text-white/50">Pool Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#E8C96A]">{formatCurrency(poolStats.balance)}</div>
                <div className="text-xs text-white/50">Pool Balance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-300">{poolStats.claimsPaid}%</div>
                <div className="text-xs text-white/50">Claims Paid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{myPolicy ? myPolicy.members : '0'}</div>
                <div className="text-xs text-white/50">Your Coverage</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={() => { setError(''); fetchAllData(); }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ===== SECTION LABEL ===== */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-[#1769AA] rounded-full" />
          <h2 className="text-base font-bold text-[#1A2A3A]">Takaful Plans</h2>
          <span className="text-xs text-[#94A3B8]">Choose your coverage</span>
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ===== LEFT COLUMN - PLANS ===== */}
          <div className="lg:col-span-2 space-y-6 plans-section">
            <div className="space-y-3">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`bg-white rounded-xl p-5 border-2 transition-all duration-300 cursor-pointer ${
                    selectedPlan?.id === plan.id 
                      ? 'border-[#1769AA] shadow-md shadow-[#1769AA]/10' 
                      : 'border-[#E8EEF4] hover:border-[#1769AA]/40 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#1A2A3A]">{plan.name}</h3>
                        <span className="text-xs font-medium text-[#5A6A7A] bg-[#F1F7FC] px-2 py-0.5 rounded">
                          {getPlanTypeLabel(plan.type)}
                        </span>
                      </div>
                      <p className="text-sm text-[#94A3B8] mt-1">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#1769AA]">{formatCurrency(plan.monthlyCost)}</div>
                      <div className="text-xs text-[#94A3B8]">per month</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {plan.benefits && plan.benefits.map((benefit, index) => (
                      <span key={index} className="text-xs text-[#1A2A3A] bg-[#F1F7FC] px-3 py-1 rounded-full">
                        {benefit}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[#F1F7FC]">
                    <div>
                      <span className="text-xs text-[#94A3B8]">Coverage up to</span>
                      <div className="text-sm font-bold text-[#1A2A3A]">{formatCurrency(plan.maxCoverage)}</div>
                    </div>
                    <button 
                      className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedPlan?.id === plan.id 
                          ? 'bg-[#1769AA] text-white hover:bg-[#2F80C0]' 
                          : 'bg-white text-[#5A6A7A] border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA]'
                      }`}
                      onClick={(e) => { e.stopPropagation(); handleEnroll(plan); }}
                    >
                      {selectedPlan?.id === plan.id ? 'Enroll Now' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== TABARRU' INFO ===== */}
            <div className="bg-[#F1F7FC] rounded-xl p-5 border border-[#E8EEF4]">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1769AA]/10 flex items-center justify-center flex-shrink-0">
                  <ShieldIcon />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A2A3A]">What is Tabarru'?</h4>
                  <p className="text-sm text-[#5A6A7A] mt-1 leading-relaxed">
                    Tabarru' means "donation" in Arabic. In Takaful, participants donate part of their contributions 
                    to a pool to help fellow members in need. This embodies the Islamic principle of mutual guarantee 
                    and cooperation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-6">
            
            {/* ===== MY POLICY ===== */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 policy-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1A2A3A]">My Takaful Status</h3>
                {myPolicy && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusBadge(myPolicy.status)}`}>
                    {getStatusLabel(myPolicy.status)}
                  </span>
                )}
              </div>

              {loadingPolicy ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
                </div>
              ) : myPolicy ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F1F7FC] rounded-lg p-3 text-center">
                      <div className="text-xs text-[#94A3B8]">Plan</div>
                      <div className="text-sm font-semibold text-[#1A2A3A]">{myPolicy.planName}</div>
                    </div>
                    <div className="bg-[#F1F7FC] rounded-lg p-3 text-center">
                      <div className="text-xs text-[#94A3B8]">Monthly</div>
                      <div className="text-sm font-semibold text-[#1769AA]">{formatCurrency(myPolicy.monthlyContribution)}</div>
                    </div>
                    <div className="bg-[#F1F7FC] rounded-lg p-3 text-center">
                      <div className="text-xs text-[#94A3B8]">Members</div>
                      <div className="text-sm font-semibold text-[#1A2A3A]">{myPolicy.members}</div>
                    </div>
                    <div className="bg-[#F1F7FC] rounded-lg p-3 text-center">
                      <div className="text-xs text-[#94A3B8]">Coverage</div>
                      <div className="text-sm font-semibold text-[#1A2A3A]">{formatCurrency(myPolicy.totalCoverage)}</div>
                    </div>
                  </div>

                  {/* Family Members */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Family Members</span>
                      <button 
                        className="text-xs font-semibold text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                        onClick={() => setShowAddMember(true)}
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {familyMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between text-sm border-b border-[#F1F7FC] pb-1.5">
                          <span className="font-medium text-[#1A2A3A]">{member.name}</span>
                          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                            <span>{member.relation}</span>
                            <span className="w-1 h-1 rounded-full bg-[#E2E8F0]" />
                            <span>{member.age} yrs</span>
                          </div>
                          <button 
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {familyMembers.length === 0 && (
                        <p className="text-xs text-[#94A3B8] text-center py-2">No family members added</p>
                      )}
                    </div>
                  </div>

                  {/* Contributions */}
                  {myPolicy.contributions && myPolicy.contributions.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-2">Recent Contributions</span>
                      <div className="space-y-1.5">
                        {myPolicy.contributions.map((contribution, index) => (
                          <div key={index} className="flex items-center justify-between text-sm border-b border-[#F1F7FC] pb-1.5">
                            <span className="text-[#94A3B8]">{formatDate(contribution.date)}</span>
                            <span className="font-semibold text-[#1A2A3A]">{formatCurrency(contribution.amount)}</span>
                            <span className="text-xs text-emerald-600">Paid</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    className="w-full py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                    onClick={() => setShowClaimForm(true)}
                  >
                    File a Claim
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl text-[#E8EEF4] mb-3">—</div>
                  <h4 className="text-sm font-semibold text-[#1A2A3A]">No Active Policy</h4>
                  <p className="text-sm text-[#94A3B8] mt-1">Enroll in a Takaful plan to get covered</p>
                </div>
              )}
            </div>

            {/* ===== POOL STATS ===== */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 pool-stats-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1A2A3A]">Pool Statistics</h3>
                <span className="text-xs font-semibold text-[#1769AA] bg-[#F1F7FC] px-2 py-0.5 rounded">Barakah</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#1A2A3A]">{poolStats.members.toLocaleString()}</div>
                  <div className="text-xs text-[#94A3B8]">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#1769AA]">{formatCurrency(poolStats.balance)}</div>
                  <div className="text-xs text-[#94A3B8]">Pool Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{poolStats.claimsPaid}%</div>
                  <div className="text-xs text-[#94A3B8]">Claims Paid</div>
                </div>
              </div>
            </div>

            {/* ===== RECENT CLAIMS ===== */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1A2A3A]">Recent Claims</h3>
                <button 
                  className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                  onClick={fetchClaims}
                >
                  Refresh
                </button>
              </div>

              {claims.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-2xl text-[#E8EEF4] mb-2">—</div>
                  <p className="text-sm text-[#94A3B8]">No claims submitted</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {claims.map((claim) => (
                    <div key={claim.id} className="flex items-center justify-between p-3 bg-[#F1F7FC] rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-[#1A2A3A]">{claim.type}</div>
                        <div className="text-xs text-[#94A3B8]">{formatDate(claim.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#1A2A3A]">{formatCurrency(claim.amount)}</div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(claim.status)}`}>
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
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Enrollment</h3>
                <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowConfirmModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#1A2A3A]">{selectedPlan.name}</div>
                  <div className="text-sm text-[#94A3B8]">{getPlanTypeLabel(selectedPlan.type)}</div>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Monthly Contribution</span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(selectedPlan.monthlyCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Annual Cost</span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(selectedPlan.annualCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Coverage Amount</span>
                    <span className="font-semibold text-[#1769AA]">{formatCurrency(selectedPlan.maxCoverage)}</span>
                  </div>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    This is a Tabarru' (donation) based Takaful. By enrolling, you agree to participate in 
                    mutual guarantee and cooperation for the benefit of all members.
                  </p>
                </div>
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
                  onClick={confirmEnrollment}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

        {/* ===== SUCCESS MODAL ===== */}
        {showSuccessModal && modalData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#F1F7FC] bg-[#1769AA] rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Enrollment Successful!</h3>
                  <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowSuccessModal(false)}>
                    <CloseIcon />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-emerald-200">
                  <CheckIcon />
                </div>
                
                <div>
                  <div className="text-sm text-[#94A3B8]">You're now covered under</div>
                  <div className="text-xl font-bold text-[#1A2A3A]">{modalData.planName}</div>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Monthly Contribution</span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(modalData.monthlyCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Coverage</span>
                    <span className="font-semibold text-[#1769AA]">{formatCurrency(modalData.coverage)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Transaction ID</span>
                    <span className="font-mono text-xs text-[#5A6A7A]">{modalData.transactionId}</span>
                  </div>
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                    "Cooperate in righteousness and piety, and do not cooperate in sin and aggression." — Quran 5:2
                  </p>
                </div>
              </div>
              
              <div className="p-6 border-t border-[#F1F7FC]">
                <button 
                  className="w-full px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                  onClick={() => setShowSuccessModal(false)}
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
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#1A2A3A]">Add Family Member</h3>
                <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowAddMember(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Full Name</label>
                  <input
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="text"
                    placeholder="Enter name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Relation</label>
                  <select
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Age</label>
                  <input
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="number"
                    placeholder="Enter age"
                    min="0"
                    max="120"
                    value={newMember.age}
                    onChange={(e) => setNewMember({...newMember, age: e.target.value})}
                  />
                </div>

                {error && <p className="text-sm text-[#DC2626]">{error}</p>}
              </div>
              
              <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
                <button 
                  className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                  onClick={() => setShowAddMember(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleAddMember}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#1A2A3A]">File a Claim</h3>
                <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowClaimForm(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Claim Type</label>
                  <select
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Amount (KES)</label>
                  <input
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    type="number"
                    placeholder="Enter amount"
                    min="100"
                    value={claimData.amount}
                    onChange={(e) => setClaimData({...claimData, amount: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Description</label>
                  <textarea
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 resize-y"
                    rows="3"
                    placeholder="Describe your claim..."
                    value={claimData.description}
                    onChange={(e) => setClaimData({...claimData, description: e.target.value})}
                  />
                </div>

                {error && <p className="text-sm text-[#DC2626]">{error}</p>}
              </div>
              
              <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
                <button 
                  className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                  onClick={() => setShowClaimForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleSubmitClaim}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="fixed top-6 right-6 z-50 bg-[#1769AA] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#1769AA]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-white/10">
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{success}</span>
            <button 
              className="text-white/60 hover:text-white transition ml-2"
              onClick={() => setSuccess('')}
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Takaful;