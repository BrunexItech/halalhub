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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { takafulService } from '../../api/client';

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

  const relations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];
  const claimTypes = ['Medical', 'Accidental Death', 'Total Disability', 'Partial Disability', 'Other'];

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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading Takaful plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                onPress={() => { setError(''); fetchAllData(); }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Hero Section */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16 }}>🛡️</Text>
                  <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Takaful
                  </Text>
                  <View style={{ width: 1, height: 12, backgroundColor: 'rgba(201, 164, 75, 0.2)' }} />
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '500' }}>Tabarru Model</Text>
                </View>
                <Text style={{ color: '#F7F6F1', fontSize: 18, fontWeight: '700' }}>Your Takaful Status</Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 13, marginTop: 2 }}>
                  Mutual protection through shared responsibility
                </Text>
              </View>
              {myPolicy ? (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                }}>
                  <Text style={{
                    color: getStatusBadge(myPolicy.status).text,
                    fontSize: 10,
                    fontWeight: '600',
                  }}>
                    {getStatusLabel(myPolicy.status)} · {myPolicy.planName}
                  </Text>
                </View>
              ) : (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                }}>
                  <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 10 }}>No active policy</Text>
                </View>
              )}
            </View>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(201, 164, 75, 0.12)',
            }}>
              {[
                { label: 'Pool Members', value: poolStats.members.toLocaleString() },
                { label: 'Pool Balance', value: formatCurrency(poolStats.balance), color: '#C9A44B' },
                { label: 'Claims Paid', value: `${poolStats.claimsPaid}%`, color: '#3FAF73' },
                { label: 'Your Coverage', value: myPolicy ? myPolicy.members : '0' },
              ].map((item, index) => (
                <View key={index} style={{ minWidth: 70 }}>
                  <Text style={{
                    color: item.color || '#F7F6F1',
                    fontSize: 18,
                    fontWeight: '700',
                  }}>
                    {item.value}
                  </Text>
                  <Text style={{ color: 'rgba(183, 192, 186, 0.6)', fontSize: 10 }}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(201, 164, 75, 0.12)',
            }}>
              {!myPolicy ? (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#C9A44B',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    shadowColor: '#C9A44B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={() => {
                    // Scroll to plans section
                  }}
                >
                  <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '700' }}>Explore Plans</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(201, 164, 75, 0.2)',
                  }}
                  onPress={() => {
                    // Scroll to policy section
                  }}
                >
                  <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '600' }}>View My Coverage</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                }}
                onPress={() => {
                  // Scroll to pool section
                }}
              >
                <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '600' }}>Community Pool</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Plans Section */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={{ width: 4, height: 20, backgroundColor: '#0B342B', borderRadius: 2 }} />
              <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Takaful Plans</Text>
              <Text style={{ color: '#6B7280', fontSize: 10 }}>Choose your coverage</Text>
            </View>

            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? '#0B342B' : 'rgba(11, 52, 43, 0.08)',
                    shadowColor: isSelected ? '#0B342B' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.1 : 0,
                    shadowRadius: 8,
                    elevation: isSelected ? 2 : 0,
                  }}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>{plan.name}</Text>
                        {myPolicy ? (
                          <View style={{
                            backgroundColor: 'rgba(63, 175, 115, 0.1)',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: 'rgba(63, 175, 115, 0.2)',
                          }}>
                            <Text style={{ color: '#3FAF73', fontSize: 9, fontWeight: '600' }}>✓ Enrolled</Text>
                          </View>
                        ) : null}
                        <View style={{
                          backgroundColor: plan.type === 'family' ? 'rgba(11, 52, 43, 0.1)' :
                                         plan.type === 'business' ? 'rgba(201, 164, 75, 0.1)' :
                                         'rgba(11, 52, 43, 0.05)',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                        }}>
                          <Text style={{
                            color: plan.type === 'family' ? '#0B342B' :
                                   plan.type === 'business' ? '#C9A44B' :
                                   '#0B342B',
                            fontSize: 10,
                            fontWeight: '500',
                          }}>
                            {getPlanTypeLabel(plan.type)}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{plan.description}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>{formatCurrency(plan.monthlyCost)}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 10 }}>per month</Text>
                    </View>
                  </View>

                  {plan.benefits && plan.benefits.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {plan.benefits.map((benefit: string, index: number) => (
                        <View key={index} style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(11, 52, 43, 0.06)',
                        }}>
                          <Text style={{ color: '#1F2937', fontSize: 10 }}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(11, 52, 43, 0.06)',
                  }}>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 10 }}>Coverage up to</Text>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '700' }}>{formatCurrency(plan.maxCoverage)}</Text>
                    </View>
                    {!myPolicy ? (
                      <TouchableOpacity
                        style={{
                          backgroundColor: isSelected ? '#0B342B' : '#FFFFFF',
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 8,
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: 'rgba(11, 52, 43, 0.12)',
                          shadowColor: isSelected ? '#0B342B' : 'transparent',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isSelected ? 0.2 : 0,
                          shadowRadius: 8,
                          elevation: isSelected ? 4 : 0,
                        }}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEnroll(plan);
                        }}
                      >
                        <Text style={{
                          color: isSelected ? '#F7F6F1' : '#6B7280',
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                          {isSelected ? 'Enroll Now' : 'Select Plan'}
                        </Text>
                      </TouchableOpacity>
                    ) : myPolicy && selectedPlan?.id === plan.id ? (
                      <View style={{
                        backgroundColor: 'rgba(63, 175, 115, 0.1)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(63, 175, 115, 0.2)',
                      }}>
                        <Text style={{ color: '#3FAF73', fontSize: 12, fontWeight: '600' }}>✓ Active</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Tabarru Info */}
            <View style={{
              backgroundColor: '#FAFAF7',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(11, 52, 43, 0.08)',
              marginTop: 6,
              flexDirection: 'row',
              gap: 10,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(11, 52, 43, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18 }}>🛡️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '700' }}>What is Tabarru?</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 18, marginTop: 2 }}>
                  Tabarru means "donation" in Arabic. In Takaful, participants donate part of their contributions
                  to a pool to help fellow members in need.
                </Text>
              </View>
            </View>
          </View>

          {/* My Policy */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(11, 52, 43, 0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>👤</Text>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>My Coverage</Text>
              </View>
              {myPolicy && (
                <View style={{
                  backgroundColor: getStatusBadge(myPolicy.status).bg,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.05)',
                }}>
                  <Text style={{
                    color: getStatusBadge(myPolicy.status).text,
                    fontSize: 10,
                    fontWeight: '600',
                  }}>
                    {getStatusLabel(myPolicy.status)}
                  </Text>
                </View>
              )}
            </View>

            {loadingPolicy ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#C9A44B" />
              </View>
            ) : myPolicy ? (
              <View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Plan', value: myPolicy.planName },
                    { label: 'Monthly', value: formatCurrency(myPolicy.monthlyContribution) },
                    { label: 'Members', value: myPolicy.members },
                    { label: 'Coverage', value: formatCurrency(myPolicy.totalCoverage) },
                  ].map((item, index) => (
                    <View key={index} style={{
                      flex: 1,
                      minWidth: 70,
                      backgroundColor: '#FAFAF7',
                      padding: 8,
                      borderRadius: 8,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(11, 52, 43, 0.06)',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 10 }}>{item.label}</Text>
                      <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Family Members */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      👤 Family Members
                    </Text>
                    <TouchableOpacity onPress={() => setShowAddMember(true)}>
                      <Text style={{ color: '#0B342B', fontSize: 10, fontWeight: '600' }}>+ Add Member</Text>
                    </TouchableOpacity>
                  </View>
                  {familyMembers.length === 0 ? (
                    <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', paddingVertical: 6 }}>
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
                        borderBottomColor: 'rgba(11, 52, 43, 0.06)',
                      }}>
                        <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }}>{member.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{
                            backgroundColor: '#FAFAF7',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 999,
                          }}>
                            <Text style={{ color: '#0B342B', fontSize: 10 }}>{member.relation}</Text>
                          </View>
                          <Text style={{ color: '#6B7280', fontSize: 10 }}>{member.age} yrs</Text>
                          <TouchableOpacity onPress={() => handleRemoveMember(member.id)}>
                            <Text style={{ color: '#DC2626', fontSize: 10 }}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* Monthly Payment Button */}
                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(11, 52, 43, 0.08)',
                  marginBottom: 10,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <View>
                      <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>Monthly Contribution</Text>
                      <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>{formatCurrency(myPolicy.monthlyContribution)}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 9 }}>
                        Due: {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#C9A44B',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        shadowColor: '#C9A44B',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                        opacity: processing ? 0.6 : 1,
                      }}
                      onPress={handlePayMonthly}
                      disabled={processing}
                    >
                      {processing ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ActivityIndicator size="small" color="#032A24" />
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>Processing...</Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                          Pay Now ({formatCurrency(myPolicy.monthlyContribution)})
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: '#6B7280', fontSize: 9, textAlign: 'center', marginTop: 6 }}>
                    Pay your monthly contribution to maintain your Takaful coverage
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={() => setShowClaimForm(true)}
                >
                  <Text style={{ color: '#F7F6F1', fontSize: 14, fontWeight: '600' }}>File a Claim</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(11, 52, 43, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(11, 52, 43, 0.08)',
                }}>
                  <Text style={{ fontSize: 24 }}>🛡️</Text>
                </View>
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '600', marginTop: 8 }}>No Active Policy</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Enroll in a Takaful plan to get covered</Text>
              </View>
            )}
          </View>

          {/* Pool Stats & Claims */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{
              flex: 1,
              minWidth: 150,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(11, 52, 43, 0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>💰</Text>
                  <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>Pool Statistics</Text>
                </View>
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.18)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600' }}>Barakah</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Members', value: poolStats.members.toLocaleString() },
                  { label: 'Balance', value: formatCurrency(poolStats.balance), color: '#0B342B' },
                  { label: 'Claims', value: `${poolStats.claimsPaid}%`, color: '#3FAF73' },
                ].map((item, index) => (
                  <View key={index} style={{
                    flex: 1,
                    minWidth: 60,
                    backgroundColor: '#FAFAF7',
                    padding: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.06)',
                  }}>
                    <Text style={{ color: item.color || '#1F2937', fontSize: 14, fontWeight: '700' }}>{item.value}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 10 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{
              flex: 1,
              minWidth: 150,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(11, 52, 43, 0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>📄</Text>
                  <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>Recent Claims</Text>
                </View>
                <TouchableOpacity onPress={fetchClaims}>
                  <Text style={{ color: '#6B7280', fontSize: 10 }}>Refresh</Text>
                </TouchableOpacity>
              </View>

              {claims.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ color: '#E5E7EB', fontSize: 24, marginBottom: 4 }}>—</Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>No claims submitted</Text>
                </View>
              ) : (
                claims.slice(0, 3).map((claim) => {
                  const badge = getStatusBadge(claim.status);
                  return (
                    <View key={claim.id} style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F4F5F1',
                    }}>
                      <View>
                        <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }}>{claim.type}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 10 }}>{formatDate(claim.date)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '700' }}>{formatCurrency(claim.amount)}</Text>
                        <View style={{
                          backgroundColor: badge.bg,
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(0,0,0,0.05)',
                        }}>
                          <Text style={{ color: badge.text, fontSize: 10, fontWeight: '500' }}>{getStatusLabel(claim.status)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Enrollment Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Confirm Enrollment</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: 'rgba(11, 52, 43, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 22 }}>🛡️</Text>
                </View>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginTop: 6 }}>{selectedPlan?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{selectedPlan ? getPlanTypeLabel(selectedPlan.type) : ''}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.06)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Monthly Contribution</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatCurrency(selectedPlan?.monthlyCost)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Annual Cost</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatCurrency(selectedPlan?.annualCost)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Coverage Amount</Text>
                  <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '700' }}>{formatCurrency(selectedPlan?.maxCoverage)}</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 8,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  This is a <Text style={{ fontWeight: '600', color: '#0B342B' }}>Tabarru</Text> (donation) based Takaful.
                  By enrolling, you agree to participate in mutual guarantee and cooperation.
                </Text>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: processing ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={confirmEnrollment}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Confirm Enrollment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Enrollment Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#0B342B',
              padding: 16,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              margin: -20,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#F7F6F1', fontSize: 18, fontWeight: '700' }}>Enrollment Successful!</Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(63, 175, 115, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(63, 175, 115, 0.2)',
                }}>
                  <Text style={{ color: '#3FAF73', fontSize: 28 }}>✓</Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>You're now covered under</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>{modalData?.planName}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.06)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Monthly Contribution</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatCurrency(modalData?.monthlyCost)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Coverage</Text>
                  <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '700' }}>{formatCurrency(modalData?.coverage)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Transaction ID</Text>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {modalData?.transactionId}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 8,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 }}>
                  "Cooperate in righteousness and piety" — Quran 5:2
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#0B342B',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Success Modal */}
      <Modal visible={showPaymentSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#3FAF73',
              padding: 16,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              margin: -20,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Payment Successful!</Text>
              <TouchableOpacity onPress={() => setShowPaymentSuccessModal(false)}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(63, 175, 115, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(63, 175, 115, 0.2)',
                }}>
                  <Text style={{ color: '#3FAF73', fontSize: 28 }}>✓</Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>Monthly contribution paid</Text>
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>{formatCurrency(paymentData?.amount)}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{paymentData?.date}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.06)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Contribution ID</Text>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {paymentData?.contributionId}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Amount</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatCurrency(paymentData?.amount)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>New Balance</Text>
                  <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '700' }}>{formatCurrency(paymentData?.newBalance)}</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 8,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 }}>
                  Your Takaful coverage remains active. Jazakallah Khair!
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#0B342B',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() => setShowPaymentSuccessModal(false)}
              >
                <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Family Member Modal */}
      <Modal visible={showAddMember} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>👤</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Add Family Member</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddMember(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Full Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.12)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newMember.name}
                  onChangeText={(text) => setNewMember({ ...newMember, name: text })}
                  placeholder="Enter name"
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Relation
                </Text>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: 'rgba(11, 52, 43, 0.12)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={newMember.relation}
                    onChangeText={(text) => setNewMember({ ...newMember, relation: text })}
                    placeholder="Select relation"
                    placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Age
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.12)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newMember.age}
                  onChangeText={(text) => setNewMember({ ...newMember, age: text })}
                  placeholder="Enter age"
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  keyboardType="numeric"
                />
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowAddMember(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: processing ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleAddMember}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Adding...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Add Member</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Claim Form Modal */}
      <Modal visible={showClaimForm} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>📄</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>File a Claim</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClaimForm(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Claim Type
                </Text>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: 'rgba(11, 52, 43, 0.12)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={claimData.type}
                    onChangeText={(text) => setClaimData({ ...claimData, type: text })}
                    placeholder="Select claim type"
                    placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Amount (KES)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.12)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={claimData.amount}
                  onChangeText={(text) => setClaimData({ ...claimData, amount: text })}
                  placeholder="Enter amount"
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.12)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  value={claimData.description}
                  onChangeText={(text) => setClaimData({ ...claimData, description: text })}
                  placeholder="Describe your claim..."
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  multiline
                />
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowClaimForm(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: processing ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleSubmitClaim}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Submit Claim</Text>
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
          top: 60,
          right: 16,
          left: 16,
          backgroundColor: '#0B342B',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#0B342B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#C9A44B', fontSize: 16 }}>✓</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Takaful;