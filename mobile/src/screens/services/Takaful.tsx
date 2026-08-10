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

// Professional SVG Icons
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

const Takaful = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [myPolicy, setMyPolicy] = useState<any>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relation: '', age: '' });
  const [poolStats, setPoolStats] = useState({
    members: 0,
    balance: 0,
    claimsPaid: 0,
    surplus: 0,
  });
  const [claims, setClaims] = useState<any[]>([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimData, setClaimData] = useState({
    type: '',
    amount: '',
    description: '',
    date: '',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // State for collapsible claims
  const [claimsExpanded, setClaimsExpanded] = useState(false);

  const relations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];
  const claimTypes = ['Medical', 'Accidental Death', 'Total Disability', 'Partial Disability', 'Other'];

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
        fetchMyPolicy(),
        fetchPoolStats(),
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
      setPlans(planData);
      if (planData.length > 0 && !selectedPlan) {
        setSelectedPlan(planData[0]);
      }
    } catch (err) {
      console.log('Plans error:', err);
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
      console.log('Policy error:', err);
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
        surplus: 0,
      });
    } catch (err) {
      console.log('Pool stats error:', err);
    }
  };

  const fetchClaims = async () => {
    try {
      const response = await takafulService.getClaims();
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

  const handleEnroll = (plan: any) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const confirmEnrollment = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await takafulService.enroll({
        plan_id: selectedPlan.id,
      });

      setModalData({
        planName: response.data.planName || selectedPlan.name,
        monthlyCost: response.data.monthlyCost || selectedPlan.monthlyCost,
        coverage: response.data.coverage || selectedPlan.maxCoverage,
        transactionId: response.data.policyId || `TKF-${Date.now()}`,
      });

      setShowConfirmModal(false);
      setShowSuccessModal(true);

      await Promise.all([
        fetchMyPolicy(),
        fetchPoolStats(),
      ]);

      setSuccess(`Enrolled in ${selectedPlan.name} successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Enrollment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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
        amount: myPolicy.monthlyContribution,
      });

      setPaymentData({
        amount: response.data.amount,
        newBalance: response.data.newBalance,
        contributionId: response.data.contributionId,
        date: new Date().toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      setShowPaymentSuccessModal(true);

      await Promise.all([
        fetchMyPolicy(),
        fetchPoolStats(),
      ]);

      setSuccess(`Monthly contribution of ${formatCurrency(myPolicy.monthlyContribution)} paid successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
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
        age: parseInt(newMember.age),
      });

      await fetchMyPolicy();
      setShowAddMember(false);
      setNewMember({ name: '', relation: '', age: '' });
      setSuccess('Family member added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add family member');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    Alert.alert('Remove Member', 'Are you sure you want to remove this family member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            await takafulService.removeFamilyMember(memberId);
            await fetchMyPolicy();
            setSuccess('Family member removed successfully!');
            setTimeout(() => setSuccess(''), 3000);
          } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to remove family member');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
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
        description: claimData.description,
      });

      setShowClaimForm(false);
      setClaimData({ type: '', amount: '', description: '', date: '' });
      await fetchClaims();

      setSuccess('Claim submitted successfully! You will be contacted within 24 hours.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit claim. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

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

  // Responsive sizing
  const isSmallDevice = width < 380;
  const cardPadding = isSmallDevice ? 14 : 18;
  const headerFontSize = isSmallDevice ? 16 : 18;
  const titleFontSize = isSmallDevice ? 20 : 22;

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
          {/* Premium Navigation Header - Emerald with Gold Border */}
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
              style={{
                padding: 6,
                marginRight: 10,
                borderRadius: 8,
              }}
            >
              <BackIcon color="#C9A44B" size={22} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: headerFontSize,
                fontWeight: '600',
                letterSpacing: -0.2,
              }}>
                Takaful
              </Text>
              <Text style={{
                color: 'rgba(201, 164, 75, 0.7)',
                fontSize: 10,
                letterSpacing: 0.3,
              }}>
                Tabarru Model · Mutual Protection
              </Text>
            </View>

            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#C9A44B',
              opacity: 0.6,
            }} />
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
              <Text style={{ color: '#DC2626', fontSize: 13, flex: 1, marginRight: 10 }}>
                {error}
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                onPress={() => { setError(''); fetchAllData(); }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Hero Section - Emerald with Gold Border */}
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
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: titleFontSize,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginBottom: 2,
                }}>
                  Your Takaful Status
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  lineHeight: 18,
                }}>
                  Mutual protection through shared responsibility
                </Text>
              </View>
              {myPolicy ? (
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                }}>
                  <Text style={{
                    color: getStatusBadge(myPolicy.status).text,
                    fontSize: 9,
                    fontWeight: '600',
                  }}>
                    {getStatusLabel(myPolicy.status)}
                  </Text>
                </View>
              ) : (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.06)',
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>No policy</Text>
                </View>
              )}
            </View>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: 'rgba(201, 164, 75, 0.08)',
            }}>
              {[
                { label: 'Pool Members', value: poolStats.members.toLocaleString() },
                { label: 'Pool Balance', value: formatCurrency(poolStats.balance), color: '#C9A44B' },
                { label: 'Claims Paid', value: `${poolStats.claimsPaid}%`, color: '#3FAF73' },
                { label: 'Your Coverage', value: myPolicy ? myPolicy.members : '0' },
              ].map((item, index) => (
                <View key={index} style={{ minWidth: 50, flex: 1 }}>
                  <Text style={{
                    color: item.color || '#FFFFFF',
                    fontSize: isSmallDevice ? 14 : 16,
                    fontWeight: '700',
                    letterSpacing: -0.2,
                  }}>
                    {item.value}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8 }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Plans Section */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={{ width: 3, height: 18, backgroundColor: '#C9A44B', borderRadius: 2 }} />
              <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 16 : 17, fontWeight: '700', letterSpacing: -0.2 }}>
                Takaful Plans
              </Text>
              <Text style={{ color: '#8B8A86', fontSize: 10 }}>Choose coverage</Text>
            </View>

            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: cardPadding,
                    marginBottom: 10,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#C9A44B' : 'rgba(3, 42, 36, 0.06)',
                    shadowColor: isSelected ? '#C9A44B' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.08 : 0,
                    shadowRadius: 12,
                    elevation: isSelected ? 2 : 0,
                  }}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 14 : 15, fontWeight: '600', letterSpacing: -0.2 }}>
                          {plan.name}
                        </Text>
                        {myPolicy && (
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
                        <View style={{
                          backgroundColor: plan.type === 'family' ? 'rgba(3, 42, 36, 0.06)' :
                                         plan.type === 'business' ? 'rgba(201, 164, 75, 0.08)' :
                                         'rgba(3, 42, 36, 0.04)',
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 6,
                        }}>
                          <Text style={{
                            color: plan.type === 'family' ? '#032A24' :
                                   plan.type === 'business' ? '#C9A44B' :
                                   '#032A24',
                            fontSize: 8,
                            fontWeight: '500',
                          }}>
                            {getPlanTypeLabel(plan.type)}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                        {plan.description}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 13 : 14, fontWeight: '700' }}>
                        {formatCurrency(plan.monthlyCost)}
                      </Text>
                      <Text style={{ color: '#8B8A86', fontSize: 8 }}>per month</Text>
                    </View>
                  </View>

                  {plan.benefits && plan.benefits.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {plan.benefits.slice(0, 3).map((benefit: string, index: number) => (
                        <View key={index} style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 8 }}>{benefit}</Text>
                        </View>
                      ))}
                      {plan.benefits.length > 3 && (
                        <View style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 8 }}>+{plan.benefits.length - 3}</Text>
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
                        {formatCurrency(plan.maxCoverage)}
                      </Text>
                    </View>
                    {!myPolicy ? (
                      <TouchableOpacity
                        style={{
                          backgroundColor: isSelected ? '#032A24' : '#FFFFFF',
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 8,
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: 'rgba(3, 42, 36, 0.1)',
                        }}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEnroll(plan);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{
                          color: isSelected ? '#FFFFFF' : '#6B7280',
                          fontSize: 11,
                          fontWeight: '600',
                        }}>
                          {isSelected ? 'Enroll' : 'Select'}
                        </Text>
                      </TouchableOpacity>
                    ) : myPolicy && selectedPlan?.id === plan.id ? (
                      <View style={{
                        backgroundColor: 'rgba(63, 175, 115, 0.06)',
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(63, 175, 115, 0.1)',
                      }}>
                        <Text style={{ color: '#3FAF73', fontSize: 10, fontWeight: '600' }}>Active</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Tabarru Info */}
            <View style={{
              backgroundColor: 'rgba(201, 164, 75, 0.04)',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.08)',
              marginTop: 4,
              flexDirection: 'row',
              gap: 10,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
              }}>
                <ShieldIcon color="#C9A44B" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>What is Tabarru?</Text>
                <Text style={{ color: '#6B7280', fontSize: 11, lineHeight: 16, marginTop: 1 }}>
                  Participants donate part of their contributions to a pool to help fellow members in need.
                </Text>
              </View>
            </View>
          </View>

          {/* My Policy Section */}
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
                  My Coverage
                </Text>
              </View>
              {myPolicy && (
                <View style={{
                  backgroundColor: getStatusBadge(myPolicy.status).bg,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={{
                    color: getStatusBadge(myPolicy.status).text,
                    fontSize: 9,
                    fontWeight: '600',
                  }}>
                    {getStatusLabel(myPolicy.status)}
                  </Text>
                </View>
              )}
            </View>

            {loadingPolicy ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#032A24" />
              </View>
            ) : myPolicy ? (
              <View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Plan', value: myPolicy.planName },
                    { label: 'Monthly', value: formatCurrency(myPolicy.monthlyContribution) },
                    { label: 'Members', value: myPolicy.members },
                    { label: 'Coverage', value: formatCurrency(myPolicy.totalCoverage) },
                  ].map((item, index) => (
                    <View key={index} style={{
                      flex: 1,
                      minWidth: 50,
                      backgroundColor: '#FAFAF7',
                      padding: 8,
                      borderRadius: 8,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#8B8A86', fontSize: 8 }}>{item.label}</Text>
                      <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Family Members */}
                <View style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 }}>
                      Family Members
                    </Text>
                    <TouchableOpacity onPress={() => setShowAddMember(true)} activeOpacity={0.7}>
                      <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600' }}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                  {familyMembers.length === 0 ? (
                    <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', paddingVertical: 6 }}>
                      No family members added
                    </Text>
                  ) : (
                    familyMembers.map((member) => (
                      <View key={member.id} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 6,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>{member.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{
                            backgroundColor: '#FAFAF7',
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: 'rgba(3, 42, 36, 0.04)',
                          }}>
                            <Text style={{ color: '#6B7280', fontSize: 8 }}>{member.relation}</Text>
                          </View>
                          <Text style={{ color: '#9CA3AF', fontSize: 9 }}>{member.age}y</Text>
                          <TouchableOpacity onPress={() => handleRemoveMember(member.id)} activeOpacity={0.7}>
                            <Text style={{ color: '#DC2626', fontSize: 9 }}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* Monthly Payment */}
                <View style={{
                  backgroundColor: 'rgba(3, 42, 36, 0.02)',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500' }}>Monthly Contribution</Text>
                      <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 15 : 16, fontWeight: '700', letterSpacing: -0.2 }}>
                        {formatCurrency(myPolicy.monthlyContribution)}
                      </Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 8 }}>
                        Due: {new Date().toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#C9A44B',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 8,
                        opacity: processing ? 0.5 : 1,
                      }}
                      onPress={handlePayMonthly}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      {processing ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ActivityIndicator size="small" color="#032A24" />
                          <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>Processing</Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>Pay Now</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowClaimForm(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>File a Claim</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(3, 42, 36, 0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                }}>
                  <ShieldIcon color="#032A24" size={20} />
                </View>
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600', marginTop: 8 }}>
                  No Active Policy
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 1 }}>
                  Enroll in a Takaful plan to get covered
                </Text>
              </View>
            )}
          </View>

          {/* Pool Stats */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            padding: cardPadding,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <WalletIcon color="#032A24" size={18} />
                <Text style={{ color: '#032A24', fontSize: isSmallDevice ? 15 : 16, fontWeight: '700', letterSpacing: -0.2 }}>
                  Pool Statistics
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 8, fontWeight: '600' }}>Barakah</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: 'Total Members', value: poolStats.members.toLocaleString() },
                { label: 'Pool Balance', value: formatCurrency(poolStats.balance), color: '#C9A44B' },
                { label: 'Claims Paid', value: `${poolStats.claimsPaid}%`, color: '#3FAF73' },
                { label: 'Surplus', value: formatCurrency(poolStats.surplus), color: '#032A24' },
              ].map((item, index) => (
                <View key={index} style={{
                  flex: 1,
                  minWidth: 70,
                  backgroundColor: '#FAFAF7',
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <Text style={{
                    color: item.color || '#032A24',
                    fontSize: isSmallDevice ? 14 : 16,
                    fontWeight: '700',
                    letterSpacing: -0.2,
                  }}>
                    {item.value}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 8, marginTop: 2 }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Claims - Collapsible */}
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
                  Recent Claims
                </Text>
                {claims.length > 0 && (
                  <View style={{
                    backgroundColor: 'rgba(3, 42, 36, 0.06)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500' }}>
                      {claims.length}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8B8A86', fontSize: 9 }}>
                  {claimsExpanded ? 'Hide' : 'Show'}
                </Text>
                {claimsExpanded ? (
                  <ChevronUpIcon color="#6B7280" size={18} />
                ) : (
                  <ChevronDownIcon color="#6B7280" size={18} />
                )}
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
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }}>{claim.type}</Text>
                          <Text style={{ color: '#9CA3AF', fontSize: 9 }}>{formatDate(claim.date)}</Text>
                          <Text style={{ color: '#6B7280', fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                            {claim.description || 'No description'}
                          </Text>
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

      {/* Modals - Same as before */}
      {/* Enrollment Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
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
                Confirm Enrollment
              </Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
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
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{selectedPlan ? getPlanTypeLabel(selectedPlan.type) : ''}</Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Monthly Contribution</Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>
                    {formatCurrency(selectedPlan?.monthlyCost)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Coverage Amount</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 11, fontWeight: '700' }}>
                    {formatCurrency(selectedPlan?.maxCoverage)}
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
                  This is a <Text style={{ fontWeight: '600', color: '#032A24' }}>Tabarru</Text> based Takaful.
                  You agree to mutual guarantee and cooperation.
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
                  onPress={() => setShowConfirmModal(false)}
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
                  onPress={confirmEnrollment}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Enrollment Success Modal */}
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
                Enrollment Successful!
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
                  backgroundColor: 'rgba(63, 175, 115, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(63, 175, 115, 0.12)',
                }}>
                  <CheckIcon color="#3FAF73" size={26} />
                </View>
                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 6 }}>You're now covered under</Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Monthly Contribution</Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>
                    {formatCurrency(modalData?.monthlyCost)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Coverage</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 11, fontWeight: '700' }}>
                    {formatCurrency(modalData?.coverage)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Transaction ID</Text>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {modalData?.transactionId}
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

      {/* Payment Success Modal */}
      <Modal visible={showPaymentSuccessModal} transparent animationType="fade">
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
              backgroundColor: '#3FAF73',
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
                Payment Successful!
              </Text>
              <TouchableOpacity onPress={() => setShowPaymentSuccessModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(63, 175, 115, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(63, 175, 115, 0.12)',
                }}>
                  <CheckIcon color="#3FAF73" size={26} />
                </View>
                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 6 }}>Monthly contribution paid</Text>
                <Text style={{ color: '#032A24', fontSize: 20, fontWeight: '700', letterSpacing: -0.5 }}>
                  {formatCurrency(paymentData?.amount)}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 11 }}>{paymentData?.date}</Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Contribution ID</Text>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {paymentData?.contributionId}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Amount</Text>
                  <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>
                    {formatCurrency(paymentData?.amount)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>New Balance</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 11, fontWeight: '700' }}>
                    {formatCurrency(paymentData?.newBalance)}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.04)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 11, textAlign: 'center', fontStyle: 'italic', lineHeight: 16 }}>
                  Your Takaful coverage remains active. Jazakallah Khair!
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowPaymentSuccessModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Family Member Modal */}
      <Modal visible={showAddMember} transparent animationType="fade">
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
                <UserIcon color="#032A24" size={18} />
                <Text style={{ color: '#032A24', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>
                  Add Family Member
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddMember(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Full Name
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
                  value={newMember.name}
                  onChangeText={(text) => setNewMember({ ...newMember, name: text })}
                  placeholder="Enter name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Relation
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
                    value={newMember.relation}
                    onChangeText={(text) => setNewMember({ ...newMember, relation: text })}
                    placeholder="Select relation"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Age
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
                  value={newMember.age}
                  onChangeText={(text) => setNewMember({ ...newMember, age: text })}
                  placeholder="Enter age"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
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
                  onPress={() => setShowAddMember(false)}
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
                  onPress={handleAddMember}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Adding...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Add Member</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Claim Form Modal */}
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
                    value={claimData.type}
                    onChangeText={(text) => setClaimData({ ...claimData, type: text })}
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