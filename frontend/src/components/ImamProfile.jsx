import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pensionService } from '../services/api';

const ImamProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imam, setImam] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionType, setContributionType] = useState('one-time');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const quickAmounts = [100, 500, 1000, 2500, 5000];

  useEffect(() => {
    fetchImamProfile();
  }, [id]);

  const fetchImamProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pensionService.getImamProfile(id);
      setImam(response.data.imam);
    } catch (err) {
      console.error('Error fetching imam profile:', err);
      setError('Failed to load imam profile. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = () => {
    if (!contributionAmount || parseFloat(contributionAmount) < 10) {
      setError('Minimum amount is KES 10');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmContribution = async () => {
    setProcessing(true);
    setError('');
    try {
      await pensionService.contribute({
        imam_id: imam.imam_id,
        amount: parseFloat(contributionAmount),
        frequency: contributionType
      });
      
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      setContributionAmount('');
      await fetchImamProfile();
      setSuccess('Contribution successful!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Contribution failed. Please try again.');
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

  const LocationIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const CheckBadgeIcon = () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!imam) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-[#FECACA] shadow-sm p-8 text-center max-w-md">
          <p className="text-sm text-[#94A3B8]">Imam not found</p>
          <button 
            className="mt-4 px-6 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
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
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Imam Profile</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Step 3 of 3</span>
              </div>
              <div className="flex items-center gap-4">
                {imam.profile_image ? (
                  <img src={imam.profile_image} alt={imam.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border border-white/10">
                    {imam.name?.charAt(0) || 'I'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{imam.name}</h1>
                    {imam.verified && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/20">
                        <CheckBadgeIcon /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">{imam.title || 'Imam'} · {imam.mosque_name || 'No mosque assigned'}</p>
                  <p className="text-white/50 text-sm">{imam.years_of_service || 0} years of service</p>
                </div>
              </div>
            </div>
            <button 
              className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT - SINGLE COLUMN ===== */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600"><CloseIcon /></button>
          </div>
        )}

        <div className="space-y-6">
          
          {/* Biography Section */}
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
            <h2 className="text-base font-bold text-[#1A2A3A] mb-3">Biography</h2>
            <p className="text-sm text-[#5A6A7A] leading-relaxed">{imam.bio || 'No biography available.'}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#F1F7FC]">
              <div>
                <div className="text-xs text-[#94A3B8]">Years of Service</div>
                <div className="text-sm font-semibold text-[#1A2A3A]">{imam.years_of_service || 0} yrs</div>
              </div>
              <div>
                <div className="text-xs text-[#94A3B8]">Total Raised</div>
                <div className="text-sm font-semibold text-[#1769AA]">{formatCurrency(imam.total_contributions || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-[#94A3B8]">Supporters</div>
                <div className="text-sm font-semibold text-[#1A2A3A]">{imam.total_supporters || 0}</div>
              </div>
              <div>
                <div className="text-xs text-[#94A3B8]">Qualifications</div>
                <div className="text-sm font-semibold text-[#1A2A3A]">{imam.qualifications?.length || 0}</div>
              </div>
            </div>
            {imam.qualifications && imam.qualifications.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-[#94A3B8] mb-1">Qualifications</div>
                <div className="flex flex-wrap gap-1.5">
                  {imam.qualifications.map((q, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">{q}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contribution Section */}
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
            <h2 className="text-base font-bold text-[#1A2A3A] mb-3">Support This Imam</h2>
            <p className="text-sm text-[#94A3B8] mb-4">Contribute to their long-term welfare</p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-2">Contribution Type</label>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                <button
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    contributionType === 'one-time' ? 'bg-[#1769AA] text-white' : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                  }`}
                  onClick={() => setContributionType('one-time')}
                >
                  One-Time
                </button>
                <button
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    contributionType === 'recurring' ? 'bg-[#1769AA] text-white' : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                  }`}
                  onClick={() => setContributionType('recurring')}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-2">Amount (KES)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickAmounts.map((val) => (
                  <button
                    key={val}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      parseFloat(contributionAmount) === val ? 'bg-[#1769AA] text-white' : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
                    }`}
                    onClick={() => setContributionAmount(val.toString())}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                className="w-full max-w-sm px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                placeholder="Enter custom amount"
                min="10"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
              {error && <p className="text-sm text-[#DC2626] mt-2">{error}</p>}
            </div>

            <button
              className="w-full max-w-sm mt-4 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20"
              onClick={handleContribute}
            >
              Support Imam
            </button>

            <p className="text-[10px] text-[#94A3B8] text-center mt-4">Wakala Model · 0% Riba · Transparent</p>
          </div>
        </div>
      </div>

      {/* ===== CONFIRMATION MODAL ===== */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Contribution</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowConfirmModal(false)}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-sm text-[#94A3B8]">You are contributing to</div>
                <div className="text-lg font-bold text-[#1A2A3A]">{imam.name}</div>
                <div className="text-sm text-[#94A3B8]">{imam.mosque_name || 'No mosque assigned'}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Amount</span>
                  <span className="font-semibold text-[#1769AA]">{formatCurrency(parseFloat(contributionAmount) || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Type</span>
                  <span className="font-semibold text-[#1A2A3A] capitalize">{contributionType}</span>
                </div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <p className="text-sm text-[#5A6A7A] leading-relaxed">
                  This contribution supports the long-term welfare of Imam {imam.name}. 
                  May Allah accept your generous contribution.
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
                onClick={confirmContribution}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Contribution'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] bg-[#1769AA] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Contribution Successful!</h3>
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
                <div className="text-sm text-[#94A3B8]">You contributed to</div>
                <div className="text-xl font-bold text-[#1A2A3A]">{imam.name}</div>
                <div className="text-lg font-bold text-[#1769AA]">{formatCurrency(parseFloat(contributionAmount) || 0)}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC]">
              <button 
                className="w-full px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                onClick={() => {
                  setShowSuccessModal(false);
                  fetchImamProfile();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImamProfile;