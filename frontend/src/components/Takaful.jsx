// frontend/src/components/Takaful.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { takafulService } from '../services/api';

// ========================================
// PROFESSIONAL SVG ICONS WITH BRAND COLORS
// ========================================

// 1. Motor Takaful - Car
const CarIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8M8 12h8M4 8h16M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2M4 8v8a2 2 0 002 2h12a2 2 0 002-2V8" />
    <circle cx="6" cy="16" r="2" />
    <circle cx="18" cy="16" r="2" />
  </svg>
);

// 2. Afya Takaful - Medical Cross
const MedicalIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v6m-3-3h6m-6 0a9 9 0 1118 0 9 9 0 01-18 0z" />
  </svg>
);

// 3. Fire & Property - Flame
const FireIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
  </svg>
);

// 4. Domestic Package - House
const HouseIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
  </svg>
);

// 5. Professional Indemnity - Shield
const ShieldIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// 6. Marine & Transit - Ship
const ShipIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 18v-6a9 9 0 0118 0v6M3 18h18M3 18a2 2 0 002 2h14a2 2 0 002-2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l4-3 4 3 4-3 4 3" />
  </svg>
);

// 7. Engineering - Gears
const GearsIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// 8. WIBA - Hard Hat
const HardHatIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 15l3-3h14l3 3M3 15v3a2 2 0 002 2h14a2 2 0 002-2v-3M6 12V8a2 2 0 012-2h8a2 2 0 012 2v4" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// 9. Dada Takaful - Women
const WomenIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v3m0 0v3m0-3h-2m2 0h2" />
  </svg>
);

// 10. Public Liability - People
const PeopleIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// 11. Fidelity Guarantee - Lock
const LockIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// 12. Bid & Performance Bonds - Document
const DocumentIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// 13. Contractors All Risks - Construction
const ConstructionIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// 14. Travel Takaful - Suitcase/Globe
const TravelIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// 15. Personal Accident - First Aid
const FirstAidIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ========================================
// SHARED UI ICONS
// ========================================

const CloseIcon = () => (
  <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
  </svg>
);

const CheckBadgeIcon = () => (
  <svg className="w-5 h-5 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-5 h-5 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

// ========================================
// ICON MAPPER
// ========================================

const getPlanIcon = (planName) => {
  const iconMap = {
    'Motor Takaful': CarIcon,
    'Afya Takaful': MedicalIcon,
    'Fire & Property Takaful': FireIcon,
    'Domestic Package': HouseIcon,
    'Professional Indemnity': ShieldIcon,
    'Marine & Transit Takaful': ShipIcon,
    'Engineering Takaful': GearsIcon,
    "WIBA & Employer's Liability": HardHatIcon,
    'Dada Takaful': WomenIcon,
    'Public Liability': PeopleIcon,
    'Fidelity Guarantee': LockIcon,
    'Bid & Performance Bonds': DocumentIcon,
    'Contractors All Risks': ConstructionIcon,
    'Travel Takaful': TravelIcon,
    'Personal Accident': FirstAidIcon,
  };
  return iconMap[planName] || DocumentIcon;
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

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

// ========================================
// MAIN COMPONENT
// ========================================

const Takaful = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCoverage, setSelectedCoverage] = useState('');
  const [sumAssured, setSumAssured] = useState(1000000);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  
  const [myPolicies, setMyPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  
  const [claims, setClaims] = useState([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimData, setClaimData] = useState({
    claim_type: '',
    amount: '',
    description: ''
  });
  
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [modalData, setModalData] = useState(null);

  const hasActivePolicyForPlan = (planId) => {
    return myPolicies.some(p => p.plan_id === planId && p.status === 'active');
  };

  const hasAnyActivePolicy = () => {
    return myPolicies.some(p => p.status === 'active');
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchPlans(),
        fetchMyPolicies(),
        fetchClaims()
      ]);
    } catch (err) {
      console.error('Error fetching Takaful data:', err);
      setError('Failed to load Takaful data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await takafulService.getPlans();
      const planData = response.data.plans || [];
      
      const order = [
        'Motor Takaful',
        'Afya Takaful',
        'Fire & Property Takaful',
        'Domestic Package',
        'Travel Takaful',
        'Personal Accident',
        'Professional Indemnity',
        'Marine & Transit Takaful',
        'Engineering Takaful',
        "WIBA & Employer's Liability",
        'Dada Takaful',
        'Public Liability',
        'Fidelity Guarantee',
        'Bid & Performance Bonds',
        'Contractors All Risks'
      ];
      
      const sortedPlans = [...planData].sort((a, b) => {
        const indexA = order.indexOf(a.name);
        const indexB = order.indexOf(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      
      setPlans(sortedPlans);
      if (sortedPlans.length > 0) {
        setSelectedPlan(sortedPlans[0]);
        if (sortedPlans[0].coverage_options && sortedPlans[0].coverage_options.length > 0) {
          setSelectedCoverage(sortedPlans[0].coverage_options[0]);
        }
        setExpandedPlanId(sortedPlans[0].id);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setPlans([]);
    }
  };

  const fetchMyPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const response = await takafulService.getMyPolicies();
      setMyPolicies(response.data.policies || []);
    } catch (err) {
      console.error('Error fetching policies:', err);
      setMyPolicies([]);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const response = await takafulService.getUserClaims();
      setClaims(response.data.claims || []);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setClaims([]);
    }
  };

  const handlePlanSelect = (plan) => {
    if (hasActivePolicyForPlan(plan.id)) return;
    
    setSelectedPlan(plan);
    if (plan.coverage_options && plan.coverage_options.length > 0) {
      setSelectedCoverage(plan.coverage_options[0]);
    }
    setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
    setError('');
  };

  const handleCoverageSelect = (coverage) => {
    setSelectedCoverage(coverage);
    setError('');
  };

  const handleGetQuote = () => {
    if (!selectedPlan || !selectedCoverage) {
      setError('Please select a plan and coverage option.');
      return;
    }

    if (hasActivePolicyForPlan(selectedPlan.id)) {
      setError('You are already enrolled in this plan.');
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      const basePremium = selectedPlan.monthly_premium || 2500;
      
      const coverageMultiplier = {
        'Comprehensive': 1.3,
        'Third Party Fire & Theft': 1.0,
        'Third Party Only': 0.7,
        'Inpatient': 1.2,
        'Outpatient': 0.8,
        'Maternity': 0.9,
        'Dental': 0.5,
        'Optical': 0.4,
        'Fire': 1.0,
        'Lightning': 1.0,
        'Explosion': 1.1,
        'Earthquake': 1.2,
        'Flood': 1.1,
        'Buildings': 1.0,
        'Household Contents': 0.8,
        'Personal Possessions': 0.6,
        'Liability': 0.5,
        'Negligence': 1.0,
        'Malpractice': 1.2,
        'Breach of Duty': 1.0,
        'Sea': 1.2,
        'Air': 1.1,
        'Rail': 1.0,
        'Road': 0.9,
        'Contractors All Risks': 1.3,
        'Erection All Risks': 1.2,
        'Machinery Breakdown': 1.1,
        'Electronic Equipment': 1.0,
        'Work Injury Benefits': 1.0,
        "Employer's Liability": 0.8,
        'Fraud': 1.0,
        'Theft': 0.9,
        'Forgery': 0.8,
        'Bid Bond': 0.8,
        'Performance Bond': 1.0,
        'Advance Payment Bond': 0.9,
        'Retention Bond': 0.8,
        'Contract Works': 1.2,
        'Materials': 1.0,
        'Third-party Liability': 0.9,
        'Emergency Medical': 1.3,
        'Medical Evacuation': 1.2,
        'Trip Disruption': 0.8,
        'Baggage': 0.6,
        'Hajj & Umrah': 1.1,
        'Accidental Injury': 1.0,
        'Disability': 1.2,
        'Accidental Death': 1.1
      };
      
      const multiplier = coverageMultiplier[selectedCoverage] || 1.0;
      const sumAssuredMultiplier = Math.max(1, sumAssured / 1000000);
      
      let finalPremium = Math.round(basePremium * multiplier * sumAssuredMultiplier);
      
      if (billingCycle === 'yearly') {
        finalPremium = Math.round(finalPremium * 12 * 0.9);
      }
      
      setQuoteData({
        premium: finalPremium,
        sum_assured: sumAssured,
        coverage: selectedCoverage,
        billing_cycle: billingCycle,
        monthly_equivalent: billingCycle === 'yearly' ? Math.round(finalPremium / 12) : finalPremium
      });
      
      setShowQuoteModal(true);
    } catch (err) {
      setError('Failed to calculate quote. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // TODO: Replace with real API when Takaful Kenya API is available
  // Current: Mock purchase with simulated delay
  // Future: const response = await takafulService.purchasePolicy({...})
  // ============================================================
  const handlePurchase = async () => {
    if (!selectedPlan || !selectedCoverage || !quoteData) {
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      // MOCK PURCHASE - Replace with real API call when available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setModalData({
        planName: selectedPlan.name,
        coverage: selectedCoverage,
        premium: quoteData.premium,
        billingCycle: billingCycle,
        policyNumber: 'TKF-' + Date.now().toString(36).toUpperCase(),
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      setShowQuoteModal(false);
      setShowSuccessModal(true);

      await fetchMyPolicies();

      setSuccess('Policy purchased successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Purchase failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimData.claim_type || !claimData.amount || !claimData.description) {
      setError('Please fill in all required fields.');
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      const activePolicy = myPolicies.find(p => p.status === 'active');
      if (!activePolicy) {
        setError('No active policy found. Please purchase a policy first.');
        setProcessing(false);
        return;
      }

      // MOCK CLAIM SUBMISSION - Replace with real API call when available
      await new Promise(resolve => setTimeout(resolve, 1000));

      setShowClaimForm(false);
      setClaimData({ claim_type: '', amount: '', description: '' });
      await fetchClaims();

      setSuccess('Claim submitted successfully! You will be contacted within 24 hours.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to submit claim.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'bg-[#032A24]/10 text-[#032A24] border-[#032A24]/20',
      'pending': 'bg-[#C9A44B]/10 text-[#C9A44B] border-[#C9A44B]/20',
      'expired': 'bg-red-50 text-red-700 border-red-200',
      'cancelled': 'bg-gray-50 text-gray-700 border-gray-200',
      'approved': 'bg-[#032A24]/10 text-[#032A24] border-[#032A24]/20',
      'rejected': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Active',
      'pending': 'Pending',
      'expired': 'Expired',
      'cancelled': 'Cancelled',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
            <p className="text-[#6B7280] mt-4 text-sm">Loading Takaful plans...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 border border-[rgba(3,42,36,0.08)] animate-pulse">
                <div className="h-12 w-12 bg-[#F3F4F6] rounded-lg mb-4" />
                <div className="h-4 bg-[#F3F4F6] rounded w-1/3 mb-3" />
                <div className="h-6 bg-[#F3F4F6] rounded w-2/3 mb-2" />
                <div className="h-4 bg-[#F3F4F6] rounded w-full mb-2" />
                <div className="h-4 bg-[#F3F4F6] rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-red-600">{error}</span>
            <button 
              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
              onClick={() => { setError(''); fetchAllData(); }}
            >
              Retry
            </button>
          </div>
        )}

        {/* HERO SECTION */}
        <div className="bg-[#032A24] rounded-2xl p-6 md:p-8 lg:p-10 shadow-xl mb-8 border border-[#C9A44B]/20">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheckIcon />
                <span className="text-xs font-semibold text-[#C9A44B] uppercase tracking-wider">Takaful</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-xs font-medium text-[#C9A44B]/80">Shariah-Compliant</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Protect What Matters Most</h2>
              <p className="text-sm text-[#B7C0BA] mt-1 max-w-xl">Ethical, transparent, and community-driven protection for you and your family.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="text-xs font-semibold text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                {plans.length} Products Available
              </span>
              {hasAnyActivePolicy() && (
                <span className="text-xs font-semibold text-[#C9A44B] bg-[#C9A44B]/10 px-4 py-2 rounded-full border border-[#C9A44B]/20">
                  ✓ Active Policy
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PLANS SECTION */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-[#032A24] rounded-full" />
            <h2 className="text-lg font-bold text-[#032A24]">Takaful Plans</h2>
            <span className="text-xs text-[#6B7280]">Click to expand</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id;
              const isEnrolled = hasActivePolicyForPlan(plan.id);
              const PlanIcon = getPlanIcon(plan.name);
              
              return (
                <div 
                  key={plan.id} 
                  className={`bg-white rounded-xl border-2 transition-all duration-300 ${
                    isExpanded 
                      ? 'border-[#032A24] shadow-lg shadow-[#032A24]/10' 
                      : 'border-[rgba(3,42,36,0.08)] hover:border-[#032A24]/40 hover:shadow-md'
                  } ${isEnrolled ? 'border-[#C9A44B]/50 bg-[#FAFAF7]' : ''}`}
                >
                  <div 
                    className={`p-5 ${isEnrolled ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (!isEnrolled) {
                        handlePlanSelect(plan);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isEnrolled ? 'bg-[#C9A44B]/10' : 'bg-[#032A24]/5'}`}>
                          <PlanIcon />
                        </div>
                        <div>
                          <h3 className={`font-bold ${isEnrolled ? 'text-[#6B7280]' : 'text-[#032A24]'}`}>{plan.name}</h3>
                          <span className="text-xs text-[#6B7280]">{plan.category}</span>
                        </div>
                      </div>
                      {isEnrolled && (
                        <span className="text-xs font-semibold text-[#C9A44B] bg-[#C9A44B]/10 px-2.5 py-1 rounded-full border border-[#C9A44B]/20 flex items-center gap-1">
                          <CheckBadgeIcon />
                          Enrolled
                        </span>
                      )}
                      {isExpanded && !isEnrolled && (
                        <span className="text-xs font-semibold text-[#032A24] bg-[#032A24]/5 px-2.5 py-1 rounded-full border border-[#032A24]/10">
                          Expanded
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#6B7280] mt-3 line-clamp-2">{plan.description}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plan.coverage_options && plan.coverage_options.slice(0, 3).map((option, idx) => (
                        <span key={idx} className="text-xs text-[#032A24] bg-[#FAFAF7] px-2.5 py-1 rounded-full border border-[rgba(3,42,36,0.06)]">
                          {option}
                        </span>
                      ))}
                      {plan.coverage_options && plan.coverage_options.length > 3 && (
                        <span className="text-xs text-[#6B7280]">+{plan.coverage_options.length - 3} more</span>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[rgba(3,42,36,0.06)] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#6B7280]">From</span>
                        <div className="text-sm font-bold text-[#032A24]">
                          {billingCycle === 'monthly' 
                            ? formatCurrency(plan.monthly_premium) + '/mo'
                            : formatCurrency(plan.annual_premium || plan.monthly_premium * 12 * 0.9) + '/yr'
                          }
                        </div>
                      </div>
                      {!isEnrolled ? (
                        <span className="text-xs text-[#6B7280] flex items-center gap-1">
                          {isExpanded ? (
                            <>Collapse <ChevronDownIcon /></>
                          ) : (
                            <>Expand <ChevronRightIcon /></>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-[#C9A44B] font-medium">✓ Covered</span>
                      )}
                    </div>
                  </div>

                  {isExpanded && !isEnrolled && (
                    <div className="px-5 pb-5 pt-0 border-t border-[rgba(3,42,36,0.06)]">
                      <div className="bg-[#FAFAF7] rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Billing</span>
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-[rgba(3,42,36,0.08)]">
                            <button
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                                billingCycle === 'monthly' 
                                  ? 'bg-[#032A24] text-white shadow-sm' 
                                  : 'text-[#6B7280] hover:text-[#032A24]'
                              }`}
                              onClick={() => setBillingCycle('monthly')}
                            >
                              Monthly
                            </button>
                            <button
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                                billingCycle === 'yearly' 
                                  ? 'bg-[#032A24] text-white shadow-sm' 
                                  : 'text-[#6B7280] hover:text-[#032A24]'
                              }`}
                              onClick={() => setBillingCycle('yearly')}
                            >
                              Yearly <span className="text-[#C9A44B] text-[10px]">(Save 10%)</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-2">Coverage Options</span>
                          <div className="grid grid-cols-2 gap-2">
                            {plan.coverage_options && plan.coverage_options.map((option) => (
                              <button
                                key={option}
                                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                                  selectedCoverage === option
                                    ? 'border-[#032A24] bg-[#032A24]/5 text-[#032A24]'
                                    : 'border-[rgba(3,42,36,0.08)] text-[#6B7280] hover:border-[#032A24]/40'
                                }`}
                                onClick={() => handleCoverageSelect(option)}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-[#6B7280] font-medium">Sum Assured</label>
                            <input
                              type="number"
                              className="w-32 px-3 py-1.5 border border-[rgba(3,42,36,0.12)] rounded-lg text-sm text-[#032A24] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B]"
                              value={sumAssured}
                              onChange={(e) => setSumAssured(parseInt(e.target.value) || 0)}
                              min="100000"
                              step="100000"
                            />
                          </div>
                          <button
                            className="px-6 py-2.5 bg-[#C9A44B] text-[#032A24] font-semibold text-sm rounded-lg hover:bg-[#E1C16B] transition-colors shadow-md shadow-[#C9A44B]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={handleGetQuote}
                            disabled={processing || !selectedCoverage}
                          >
                            {processing ? (
                              <span className="flex items-center gap-2">
                                <SpinnerIcon />
                                Processing...
                              </span>
                            ) : (
                              'Get a Quote'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isEnrolled && (
                    <div className="px-5 pb-5">
                      <div className="bg-[#C9A44B]/5 rounded-lg p-3 border border-[#C9A44B]/20 text-center">
                        <p className="text-xs text-[#032A24] font-medium">
                          ✓ You are already enrolled in this plan
                        </p>
                        <button 
                          className="mt-2 text-xs text-[#C9A44B] font-semibold hover:underline"
                          onClick={() => navigate('/takaful/policies')}
                        >
                          View My Policy →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CLAIMS SECTION */}
        <div className="bg-white rounded-xl border border-[rgba(3,42,36,0.08)] shadow-sm p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <FileIcon />
              <h3 className="text-sm font-bold text-[#032A24]">My Claims</h3>
            </div>
            <button 
              className="px-4 py-2 bg-[#C9A44B] text-[#032A24] text-xs font-semibold rounded-lg hover:bg-[#E1C16B] transition-colors shadow-md shadow-[#C9A44B]/20 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setShowClaimForm(true)}
              disabled={!hasAnyActivePolicy()}
            >
              {hasAnyActivePolicy() ? 'File a Claim' : 'No Active Policy'}
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[#6B7280]">No claims submitted</p>
            </div>
          ) : (
            <div className="space-y-2">
              {claims.slice(0, 5).map((claim) => (
                <div key={claim.id} className="flex flex-wrap items-center justify-between p-3 bg-[#FAFAF7] rounded-lg border border-[rgba(3,42,36,0.06)]">
                  <div>
                    <div className="text-sm font-medium text-[#032A24]">{claim.claim_type}</div>
                    <div className="text-xs text-[#6B7280]">{formatDate(claim.submitted_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#032A24]">{formatCurrency(claim.amount)}</div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(claim.status)}`}>
                      {getStatusLabel(claim.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== QUOTE MODAL ===== */}
        {showQuoteModal && quoteData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(3,42,36,0.06)] flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
                <h3 className="text-sm font-bold text-[#032A24]">Quote Summary</h3>
                <button className="text-[#6B7280] hover:text-[#032A24] transition-colors" onClick={() => setShowQuoteModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-[#032A24]/5 flex items-center justify-center mx-auto">
                    <ShieldCheckIcon />
                  </div>
                  <div className="text-lg font-bold text-[#032A24] mt-2">{selectedPlan?.name}</div>
                  <div className="text-sm text-[#6B7280]">{selectedCoverage}</div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-4 space-y-2 border border-[rgba(3,42,36,0.06)]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">
                      {billingCycle === 'yearly' ? 'Annual Premium' : 'Monthly Premium'}
                    </span>
                    <span className="font-bold text-[#032A24]">{formatCurrency(quoteData.premium)}</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">Monthly Equivalent</span>
                      <span className="font-bold text-[#032A24]">{formatCurrency(quoteData.monthly_equivalent)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Sum Assured</span>
                    <span className="font-bold text-[#032A24]">{formatCurrency(sumAssured)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Coverage</span>
                    <span className="font-bold text-[#032A24]">{selectedCoverage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Billing</span>
                    <span className="font-bold text-[#032A24] capitalize">{billingCycle}</span>
                  </div>
                </div>

                <div className="bg-[#C9A44B]/10 rounded-lg p-3 border border-[#C9A44B]/20">
                  <p className="text-xs text-[#032A24] text-center leading-relaxed">
                    This is a Tabarru (donation) based Takaful. By purchasing, you agree to participate in mutual guarantee and cooperation.
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[rgba(3,42,36,0.06)] flex gap-3">
                <button 
                  className="flex-1 px-4 py-2 bg-white text-[#6B7280] font-semibold text-sm rounded-lg border border-[rgba(3,42,36,0.12)] hover:bg-[#FAFAF7] transition-colors"
                  onClick={() => setShowQuoteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] px-4 py-2 bg-[#C9A44B] text-[#032A24] font-semibold text-sm rounded-lg hover:bg-[#E1C16B] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#C9A44B]/20"
                  onClick={handlePurchase}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon />
                      Processing...
                    </span>
                  ) : (
                    'Purchase Policy'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== SUCCESS MODAL ===== */}
        {showSuccessModal && modalData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(3,42,36,0.06)] bg-[#032A24] rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Policy Purchased!</h3>
                  <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowSuccessModal(false)}>
                    <CloseIcon />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-[#C9A44B]/10 flex items-center justify-center mx-auto border-4 border-[#C9A44B]/20">
                  <CheckIcon />
                </div>
                
                <div>
                  <div className="text-sm text-[#6B7280]">You are now covered under</div>
                  <div className="text-xl font-bold text-[#032A24]">{modalData.planName}</div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-4 text-left space-y-2 border border-[rgba(3,42,36,0.06)]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Coverage</span>
                    <span className="font-semibold text-[#032A24]">{modalData.coverage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Premium</span>
                    <span className="font-semibold text-[#C9A44B]">{formatCurrency(modalData.premium)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Policy #</span>
                    <span className="font-mono text-xs text-[#6B7280]">{modalData.policyNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Expires</span>
                    <span className="font-semibold text-[#032A24]">{formatDate(modalData.expiryDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Billing</span>
                    <span className="font-semibold text-[#032A24] capitalize">{modalData.billingCycle}</span>
                  </div>
                </div>

                <div className="bg-[#FAFAF7] rounded-lg p-3 border border-[rgba(3,42,36,0.06)]">
                  <p className="text-xs text-[#6B7280] italic leading-relaxed">
                    "Cooperate in righteousness and piety" — Quran 5:2
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[rgba(3,42,36,0.06)]">
                <button 
                  className="w-full px-4 py-2 bg-[#C9A44B] text-[#032A24] font-semibold text-sm rounded-lg hover:bg-[#E1C16B] transition-colors shadow-md shadow-[#C9A44B]/20"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== CLAIM FORM MODAL ===== */}
        {showClaimForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 border-b border-[rgba(3,42,36,0.06)] flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
                <div className="flex items-center gap-2">
                  <FileIcon />
                  <h3 className="text-sm font-bold text-[#032A24]">File a Claim</h3>
                </div>
                <button className="text-[#6B7280] hover:text-[#032A24] transition-colors" onClick={() => setShowClaimForm(false)}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Claim Type</label>
                  <select
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(3,42,36,0.12)] rounded-lg text-sm text-[#032A24] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-colors"
                    value={claimData.claim_type}
                    onChange={(e) => setClaimData({...claimData, claim_type: e.target.value})}
                  >
                    <option value="">Select claim type</option>
                    <option value="Medical">Medical</option>
                    <option value="Accidental Death">Accidental Death</option>
                    <option value="Total Disability">Total Disability</option>
                    <option value="Partial Disability">Partial Disability</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Amount (KES)</label>
                  <input
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(3,42,36,0.12)] rounded-lg text-sm text-[#032A24] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-colors"
                    type="number"
                    placeholder="Enter amount"
                    min="100"
                    value={claimData.amount}
                    onChange={(e) => setClaimData({...claimData, amount: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 bg-[#FAFAF7] border border-[rgba(3,42,36,0.12)] rounded-lg text-sm text-[#032A24] focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-colors resize-y"
                    rows="3"
                    placeholder="Describe your claim..."
                    value={claimData.description}
                    onChange={(e) => setClaimData({...claimData, description: e.target.value})}
                  />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
              
              <div className="p-4 border-t border-[rgba(3,42,36,0.06)] flex gap-3">
                <button 
                  className="flex-1 px-4 py-2 bg-white text-[#6B7280] font-semibold text-sm rounded-lg border border-[rgba(3,42,36,0.12)] hover:bg-[#FAFAF7] transition-colors"
                  onClick={() => setShowClaimForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] px-4 py-2 bg-[#C9A44B] text-[#032A24] font-semibold text-sm rounded-lg hover:bg-[#E1C16B] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#C9A44B]/20"
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
          <div className="fixed top-4 right-4 z-50 bg-[#032A24] text-white px-5 py-3.5 rounded-xl shadow-2xl shadow-[#032A24]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-[#C9A44B]/20">
            <CheckBadgeIcon />
            <span className="text-sm font-medium">{success}</span>
            <button 
              className="text-white/60 hover:text-white transition-colors ml-1 flex-shrink-0"
              onClick={() => setSuccess('')}
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>

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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Takaful;