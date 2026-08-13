import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { takafulService } from '../../api/client';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// ========================================
// SVG ICONS - Brand Colors (#032A24 + #C9A44B)
// ========================================

const BackIcon = ({ color = '#032A24', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShieldIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3L5 7V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V7L12 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CarIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 16h8M8 12h8M4 8h16M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2M4 8v8a2 2 0 002 2h12a2 2 0 002-2V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="6" cy="16" r="2" stroke={color} strokeWidth="1.5"/>
    <Circle cx="18" cy="16" r="2" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const MedicalIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 9v6m-3-3h6m-6 0a9 9 0 1118 0 9 9 0 01-18 0z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const FireIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const HouseIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const HardHatIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 15l3-3h14l3 3M3 15v3a2 2 0 002 2h14a2 2 0 002-2v-3M6 12V8a2 2 0 012-2h8a2 2 0 012 2v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const WomenIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 14v3m0 0v3m0-3h-2m2 0h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PeopleIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LockIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const DocumentIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ConstructionIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TravelIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const FirstAidIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShipIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 18v-6a9 9 0 0118 0v6M3 18h18M3 18a2 2 0 002 2h14a2 2 0 002-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M5 12l4-3 4 3 4-3 4 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const GearsIcon = ({ color = '#C9A44B', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const WalletIcon = ({ color = '#032A24', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
    <Path d="M16 13C16 12.4477 16.4477 12 17 12H20C20.5523 12 21 12.4477 21 13V15C21 15.5523 20.5523 16 20 16H17C16.4477 16 16 15.5523 16 15V13Z" fill={color} opacity="0.1" stroke={color} strokeWidth="1.5"/>
    <Circle cx="18" cy="14" r="0.5" fill={color}/>
  </Svg>
);

const UserIcon = ({ color = '#032A24', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M5.5 20C5.5 16.6863 8.18629 14 11.5 14H12.5C15.8137 14 18.5 16.6863 18.5 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ClaimIcon = ({ color = '#032A24', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M12 8V13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="12" cy="16" r="1" fill={color} opacity="0.5"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronDownIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronUpIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ========================================
// ICON MAPPER
// ========================================

const getPlanIcon = (planName: string, color = '#C9A44B', size = 22) => {
  const iconMap: Record<string, any> = {
    'Motor Takaful': CarIcon,
    'Afya Takaful': MedicalIcon,
    'Fire & Property Takaful': FireIcon,
    'Domestic Package': HouseIcon,
    "WIBA & Employer's Liability": HardHatIcon,
    'Dada Takaful': WomenIcon,
    'Public Liability': PeopleIcon,
    'Fidelity Guarantee': LockIcon,
    'Bid & Performance Bonds': DocumentIcon,
    'Contractors All Risks': ConstructionIcon,
    'Travel Takaful': TravelIcon,
    'Personal Accident': FirstAidIcon,
    'Marine & Transit Takaful': ShipIcon,
    'Engineering Takaful': GearsIcon,
    'Professional Indemnity': ShieldIcon,
  };
  const IconComponent = iconMap[planName] || ShieldIcon;
  return <IconComponent color={color} size={size} />;
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

const formatCurrency = (amount: number) => `KES ${amount?.toLocaleString() || 0}`;

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusBadge = (status: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#D1FAE5', text: '#3FAF73' },
    approved: { bg: '#D1FAE5', text: '#3FAF73' },
    pending: { bg: '#FEF3C7', text: '#D97706' },
    expired: { bg: '#FEE2E2', text: '#DC2626' },
    rejected: { bg: '#F3F4F6', text: '#6B7280' },
  };
  return colors[status] || colors.pending;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Active',
    approved: 'Approved',
    pending: 'Pending',
    expired: 'Expired',
    rejected: 'Rejected',
  };
  return labels[status] || status;
};

const getPlanTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    individual: 'Individual',
    family: 'Family',
    business: 'Business',
  };
  return labels[type] || type;
};

// ========================================
// MAIN COMPONENT
// ========================================

const Takaful = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedCoverage, setSelectedCoverage] = useState('');
  const [sumAssured, setSumAssured] = useState(1000000);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const [myPolicies, setMyPolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const [claims, setClaims] = useState<any[]>([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimData, setClaimData] = useState({ claim_type: '', amount: '', description: '' });

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [modalData, setModalData] = useState<any>(null);

  const [claimsExpanded, setClaimsExpanded] = useState(false);

  const relations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];
  const claimTypes = ['Medical', 'Accidental Death', 'Total Disability', 'Partial Disability', 'Other'];

  const isSmallDevice = width < 380;
  const cardPadding = isSmallDevice ? 14 : 18;
  const headerFontSize = isSmallDevice ? 16 : 18;
  const titleFontSize = isSmallDevice ? 20 : 22;

  const hasActivePolicyForPlan = (planId: string) => {
    return myPolicies.some(p => p.plan_id === planId && p.status === 'active');
  };

  const hasAnyActivePolicy = () => {
    return myPolicies.some(p => p.status === 'active');
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleClaims = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setClaimsExpanded(!claimsExpanded);
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchPlans(),
        fetchMyPolicies(),
        fetchClaims(),
      ]);
    } catch (err) {
      console.log('Error fetching data:', err);
      setError('Failed to load Takaful data. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      console.log('Plans error:', err);
      setPlans([]);
    }
  };

  const fetchMyPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const response = await takafulService.getMyPolicies();
      setMyPolicies(response.data.policies || []);
    } catch (err) {
      console.log('Policies error:', err);
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
      console.log('Claims error:', err);
      setClaims([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handlePlanSelect = (plan: any) => {
    if (hasActivePolicyForPlan(plan.id)) return;
    
    setSelectedPlan(plan);
    if (plan.coverage_options && plan.coverage_options.length > 0) {
      setSelectedCoverage(plan.coverage_options[0]);
    }
    setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
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
      
      const coverageMultiplier: Record<string, number> = {
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
    if (!selectedPlan || !selectedCoverage || !quoteData) return;

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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#032A24" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Loading Takaful plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#032A24" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#032A24',
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: '#C9A44B',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 3,
          }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={{ padding: 6, marginRight: 10, borderRadius: 8 }}
            >
              <BackIcon color="#C9A44B" size={22} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: headerFontSize, fontWeight: '600', letterSpacing: -0.2 }}>
                Takaful
              </Text>
              <Text style={{ color: 'rgba(201, 164, 75, 0.7)', fontSize: 10, letterSpacing: 0.3 }}>
                Shariah-Compliant · Mutual Protection
              </Text>
            </View>
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13, flex: 1, marginRight: 10 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                onPress={() => { setError(''); fetchAllData(); }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Hero Section */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 16,
            padding: cardPadding,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.2)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <ShieldIcon color="#C9A44B" size={16} />
                  <Text style={{ color: '#C9A44B', fontSize: 9, fontWeight: '600', letterSpacing: 0.5 }}>
                    Takaful · Tabarru
                  </Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: titleFontSize, fontWeight: '700', letterSpacing: -0.3, marginBottom: 2 }}>
                  Islamic Protection
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 }}>
                  Ethical, transparent, and community-driven
                </Text>
              </View>
              {hasAnyActivePolicy() && (
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 9, fontWeight: '600' }}>✓ Active</Text>
                </View>
              )}
            </View>
          </View>

          {/* Plans Section */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={{ width: 3, height: 18, backgroundColor: '#C9A44B', borderRadius: 2 }} />
              <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 16 : 17, fontWeight: '700', letterSpacing: -0.2 }}>
                Takaful Plans
              </Text>
              <Text style={{ color: '#8B8A86', fontSize: 10 }}>Click to expand</Text>
            </View>

            {plans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id;
              const isEnrolled = hasActivePolicyForPlan(plan.id);
              
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: cardPadding,
                    marginBottom: 10,
                    borderWidth: 1.5,
                    borderColor: isEnrolled ? '#C9A44B' : (isExpanded ? '#032A24' : 'rgba(3, 42, 36, 0.06)'),
                    shadowColor: isExpanded ? '#032A24' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isExpanded ? 0.08 : 0,
                    shadowRadius: 12,
                    elevation: isExpanded ? 2 : 0,
                  }}
                  onPress={() => {
                    if (!isEnrolled) handlePlanSelect(plan);
                  }}
                  activeOpacity={isEnrolled ? 1 : 0.7}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <View style={{ marginRight: 4 }}>
                          {getPlanIcon(plan.name, '#C9A44B', 20)}
                        </View>
                        <Text style={{ color: isEnrolled ? '#6B7280' : '#032A24', fontSize: isSmallDevice ? 14 : 15, fontWeight: '600', letterSpacing: -0.2 }}>
                          {plan.name}
                        </Text>
                        {isEnrolled && (
                          <View style={{
                            backgroundColor: 'rgba(63, 175, 115, 0.08)',
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(63, 175, 115, 0.1)',
                          }}>
                            <Text style={{ color: '#3FAF73', fontSize: 8, fontWeight: '600' }}>Enrolled</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                        {plan.description}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 13 : 14, fontWeight: '700' }}>
                        {formatCurrency(plan.monthly_premium || plan.monthlyCost)}
                      </Text>
                      <Text style={{ color: '#8B8A86', fontSize: 8 }}>per month</Text>
                    </View>
                  </View>

                  {plan.coverage_options && plan.coverage_options.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {plan.coverage_options.slice(0, 3).map((option: string, index: number) => (
                        <View key={index} style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 8 }}>{option}</Text>
                        </View>
                      ))}
                      {plan.coverage_options.length > 3 && (
                        <View style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 8 }}>+{plan.coverage_options.length - 3}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  }}>
                    <View>
                      <Text style={{ color: '#8B8A86', fontSize: 8 }}>Coverage up to</Text>
                      <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '700' }}>
                        {formatCurrency(plan.maxCoverage || plan.max_coverage)}
                      </Text>
                    </View>
                    {isEnrolled ? (
                      <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600' }}>✓ Covered</Text>
                    ) : (
                      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500' }}>
                        {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                      </Text>
                    )}
                  </View>

                  {/* Expanded Content */}
                  {isExpanded && !isEnrolled && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(3, 42, 36, 0.06)' }}>
                      <View style={{ backgroundColor: '#FAFAF7', borderRadius: 10, padding: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 }}>
                            Billing
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 6,
                                backgroundColor: billingCycle === 'monthly' ? '#032A24' : 'transparent',
                              }}
                              onPress={() => setBillingCycle('monthly')}
                            >
                              <Text style={{ color: billingCycle === 'monthly' ? '#FFFFFF' : '#6B7280', fontSize: 10, fontWeight: '600' }}>
                                Monthly
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 6,
                                backgroundColor: billingCycle === 'yearly' ? '#032A24' : 'transparent',
                              }}
                              onPress={() => setBillingCycle('yearly')}
                            >
                              <Text style={{ color: billingCycle === 'yearly' ? '#FFFFFF' : '#6B7280', fontSize: 10, fontWeight: '600' }}>
                                Yearly <Text style={{ color: '#C9A44B' }}>(Save 10%)</Text>
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 }}>
                          Coverage Options
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {plan.coverage_options && plan.coverage_options.map((option: string) => (
                            <TouchableOpacity
                              key={option}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: selectedCoverage === option ? '#032A24' : 'rgba(3, 42, 36, 0.08)',
                                backgroundColor: selectedCoverage === option ? 'rgba(3, 42, 36, 0.05)' : 'transparent',
                              }}
                              onPress={() => setSelectedCoverage(option)}
                            >
                              <Text style={{ color: selectedCoverage === option ? '#032A24' : '#6B7280', fontSize: 10 }}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <View style={{ flex: 1, minWidth: 100 }}>
                            <Text style={{ color: '#6B7280', fontSize: 9 }}>Sum Assured</Text>
                            <TextInput
                              style={{
                                backgroundColor: '#FFFFFF',
                                borderWidth: 1,
                                borderColor: 'rgba(3, 42, 36, 0.08)',
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                fontSize: 12,
                                color: '#032A24',
                              }}
                              value={String(sumAssured)}
                              onChangeText={(text) => setSumAssured(parseInt(text) || 0)}
                              keyboardType="numeric"
                            />
                          </View>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#C9A44B',
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 8,
                              opacity: processing ? 0.5 : 1,
                            }}
                            onPress={handleGetQuote}
                            disabled={processing}
                          >
                            {processing ? (
                              <ActivityIndicator size="small" color="#032A24" />
                            ) : (
                              <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>Get Quote</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* My Policies Section */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            padding: cardPadding,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <UserIcon color="#032A24" size={16} />
                <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 15 : 16, fontWeight: '700', letterSpacing: -0.2 }}>
                  My Policies
                </Text>
              </View>
              <Text style={{ color: '#6B7280', fontSize: 10 }}>{myPolicies.length} total</Text>
            </View>

            {loadingPolicies ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#032A24" />
              </View>
            ) : myPolicies.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No policies yet</Text>
                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>Select a plan above to get started</Text>
              </View>
            ) : (
              myPolicies.map((policy) => (
                <View key={policy.id} style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <View>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{policy.plan_name}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 10 }}>{policy.coverage_option} · {formatCurrency(policy.premium)}/mo</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 9 }}>{formatDate(policy.start_date)} — {formatDate(policy.expiry_date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{
                      backgroundColor: getStatusBadge(policy.status).bg,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                      <Text style={{ color: getStatusBadge(policy.status).text, fontSize: 9, fontWeight: '500' }}>
                        {getStatusLabel(policy.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Claims Section */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
            elevation: 1,
            overflow: 'hidden',
          }}>
            <TouchableOpacity
              onPress={toggleClaims}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: cardPadding,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ClaimIcon color="#032A24" size={18} />
                <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 15 : 16, fontWeight: '700', letterSpacing: -0.2 }}>
                  My Claims
                </Text>
                {claims.length > 0 && (
                  <View style={{
                    backgroundColor: 'rgba(3, 42, 36, 0.06)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500' }}>{claims.length}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: hasAnyActivePolicy() ? '#C9A44B' : '#D1D5DB',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                  onPress={() => setShowClaimForm(true)}
                  disabled={!hasAnyActivePolicy()}
                >
                  <Text style={{ color: hasAnyActivePolicy() ? '#032A24' : '#FFFFFF', fontSize: 9, fontWeight: '600' }}>
                    {hasAnyActivePolicy() ? 'File Claim' : 'No Policy'}
                  </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#8B8A86', fontSize: 9, marginRight: 4 }}>
                    {claimsExpanded ? 'Hide' : 'Show'}
                  </Text>
                  {claimsExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {claimsExpanded && (
              <View style={{ paddingHorizontal: cardPadding, paddingBottom: cardPadding }}>
                {claims.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <Text style={{ color: '#E5E7EB', fontSize: 24 }}>—</Text>
                    <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>No claims submitted</Text>
                  </View>
                ) : (
                  claims.slice(0, 5).map((claim, index) => {
                    const badge = getStatusBadge(claim.status);
                    return (
                      <View 
                        key={claim.id} 
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 10,
                          borderBottomWidth: index < claims.slice(0, 5).length - 1 ? 1 : 0,
                          borderBottomColor: '#F3F4F6',
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }}>{claim.claim_type}</Text>
                          <Text style={{ color: '#9CA3AF', fontSize: 9 }}>{formatDate(claim.submitted_at)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                          <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '700' }}>
                            {formatCurrency(claim.amount)}
                          </Text>
                          <View style={{
                            backgroundColor: badge.bg,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            marginTop: 2,
                          }}>
                            <Text style={{ color: badge.text, fontSize: 9, fontWeight: '500' }}>
                              {getStatusLabel(claim.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Mutual Protection · Shared Responsibility
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== QUOTE MODAL ===== */}
      <Modal visible={showQuoteModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            padding: 22,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Quote Summary
              </Text>
              <TouchableOpacity onPress={() => setShowQuoteModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.08)',
                }}>
                  <ShieldIcon color="#C9A44B" size={20} />
                </View>
                <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700', marginTop: 4 }}>{selectedPlan?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{selectedCoverage}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>
                    {billingCycle === 'yearly' ? 'Annual Premium' : 'Monthly Premium'}
                  </Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>
                    {formatCurrency(quoteData?.premium)}
                  </Text>
                </View>
                {billingCycle === 'yearly' && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11 }}>Monthly Equivalent</Text>
                    <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>
                      {formatCurrency(quoteData?.monthly_equivalent)}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Sum Assured</Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>
                    {formatCurrency(sumAssured)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Billing</Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                    {billingCycle}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.04)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
                  Tabarru based Takaful. By purchasing, you agree to mutual guarantee.
                </Text>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowQuoteModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: processing ? 0.5 : 1,
                  }}
                  onPress={handlePurchase}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Purchase Policy</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== SUCCESS MODAL ===== */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            padding: 22,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#032A24',
              padding: 16,
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              margin: -22,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>
                Policy Purchased!
              </Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(201, 164, 75, 0.12)',
                }}>
                  <CheckIcon color="#C9A44B" size={26} />
                </View>
                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 6 }}>You are now covered under</Text>
                <Text style={{ color: '#032A24', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>
                  {modalData?.planName}
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Coverage</Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>{modalData?.coverage}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Premium</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 11, fontWeight: '700' }}>
                    {formatCurrency(modalData?.premium)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Policy #</Text>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {modalData?.policyNumber}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Expires</Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>
                    {formatDate(modalData?.expiryDate)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Billing</Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                    {modalData?.billingCycle}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.04)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 11, textAlign: 'center', fontStyle: 'italic', lineHeight: 16 }}>
                  "Cooperate in righteousness and piety" — Quran 5:2
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== CLAIM FORM MODAL ===== */}
      <Modal visible={showClaimForm} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            padding: 22,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ClaimIcon color="#032A24" size={18} />
                <Text style={{ color: '#032A24', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>
                  File a Claim
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowClaimForm(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Claim Type
                </Text>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.08)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 13, padding: 0 }}
                    value={claimData.claim_type}
                    onChangeText={(text) => setClaimData({ ...claimData, claim_type: text })}
                    placeholder="Select claim type"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Amount (KES)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.08)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 13,
                  }}
                  value={claimData.amount}
                  onChangeText={(text) => setClaimData({ ...claimData, amount: text })}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.08)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 13,
                    minHeight: 70,
                    textAlignVertical: 'top',
                  }}
                  value={claimData.description}
                  onChangeText={(text) => setClaimData({ ...claimData, description: text })}
                  placeholder="Describe your claim..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowClaimForm(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: processing ? 0.5 : 1,
                  }}
                  onPress={handleSubmitClaim}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Submit Claim</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Toast */}
      {success ? (
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 16,
          left: 16,
          backgroundColor: '#032A24',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#032A24',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CheckIcon color="#C9A44B" size={16} />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')} activeOpacity={0.7} style={{ padding: 4 }}>
            <CloseIcon color="rgba(255,255,255,0.5)" size={16} />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Takaful;