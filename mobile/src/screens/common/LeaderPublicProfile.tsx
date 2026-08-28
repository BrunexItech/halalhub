import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PinModal from '../../components/common/PinModal';
import { pensionService } from '../../api/client';


const LeaderPublicProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const id = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [leader, setLeader] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [successAmount, setSuccessAmount] = useState(0);
  const [contributionType, setContributionType] = useState('one-time');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ===== PIN MODAL STATE =====
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pendingContribution, setPendingContribution] = useState<any>(null);

  const quickAmounts = [100, 500, 1000, 2500, 5000];

  useEffect(() => {
    if (id) {
      fetchLeaderProfile();
    } else {
      setError('Leader ID not found');
      setLoading(false);
    }
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderProfile();
  };

  const fetchLeaderProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pensionService.getLeader(id);
      setLeader(response.data.leader);
    } catch (err) {
      console.log('Error fetching leader profile:', err);
      setError('Failed to load leader profile. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleContribute = () => {
    if (!contributionAmount || parseFloat(contributionAmount) < 10) {
      setError('Minimum amount is KES 10');
      return;
    }
    setShowConfirmModal(true);
  };

  // ===== PIN VERIFICATION =====
  const handlePinVerify = async (pin: string) => {
    setPinLoading(true);
    setPinError('');

    try {
      const response = await pensionService.contribute({
        leader_id: leader.leader_id,
        amount: parseFloat(contributionAmount),
        frequency: contributionType,
        pin: pin,
      });

      const paidAmount = parseFloat(contributionAmount) || 0;
      setSuccessAmount(paidAmount);

      setShowPinModal(false);
      setShowConfirmModal(false);
      setShowSuccessModal(true);

      await fetchLeaderProfile();

      setSuccess(`Contribution of ${formatCurrency(paidAmount)} successful!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setPinError(err.response?.data?.error || 'Contribution failed. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinError('');
    setPendingContribution(null);
  };

  const confirmContribution = () => {
    setShowConfirmModal(false);
    setShowPinModal(true);
    setPinError('');
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setContributionAmount('');
    setSuccessAmount(0);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const getLeaderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      islamic_scholar: 'Islamic Scholar',
      imam: 'Imam',
      adhan_caller: 'Adhan Caller',
      ustadh: 'Ustadh',
      ustadha: 'Ustadha',
      kadhi: 'Kadhi',
    };
    return labels[type] || type;
  };

  const getInitials = () => {
    if (leader?.name) {
      return leader.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'LD';
  };

  if (loading) {
  return <LoadingSpinner message="Loading profile..." />;
}
  if (!leader) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '600' }}>⚠️</Text>
            <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 8 }}>Leader not found</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#0B342B',
                paddingVertical: 10,
                paddingHorizontal: 24,
                borderRadius: 12,
                marginTop: 16,
                shadowColor: '#0B342B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
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
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          {/* Hero Section */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Leader Profile
                  </Text>
                  <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                  <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>Support a Leader</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {leader.profile_image ? (
                    <Image
                      source={{ uri: leader.profile_image }}
                      style={{ width: 64, height: 64, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>{getInitials()}</Text>
                    </View>
                  )}
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>{leader.name}</Text>
                      {leader.verified && (
                        <View style={{
                          backgroundColor: 'rgba(63, 175, 115, 0.2)',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(63, 175, 115, 0.2)',
                        }}>
                          <Text style={{ color: '#D1FAE5', fontSize: 11, fontWeight: '500' }}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                      {leader.title || getLeaderTypeLabel(leader.leader_type)}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                      {leader.years_of_service || 0} years of service
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' }}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>

          {success ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(63, 175, 115, 0.2)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#3FAF73', fontSize: 14 }}>{success}</Text>
              <TouchableOpacity onPress={() => setSuccess('')}>
                <Text style={{ color: 'rgba(63, 175, 115, 0.6)', fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Biography */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Biography</Text>
            <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
              {leader.bio || 'No biography available.'}
            </Text>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#F4F5F1',
            }}>
              {[
                { label: 'Years of Service', value: `${leader.years_of_service || 0} yrs` },
                { label: 'Leader Type', value: getLeaderTypeLabel(leader.leader_type) },
                { label: 'Location', value: leader.location || 'N/A' },
                { label: 'Supporters', value: leader.total_supporters || 0 },
              ].map((item, index) => (
                <View key={index} style={{ flex: 1, minWidth: 70 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>{item.label}</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{item.value}</Text>
                </View>
              ))}
            </View>

            {leader.qualifications && leader.qualifications.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>Qualifications</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {leader.qualifications.map((q: string, i: number) => (
                    <View key={i} style={{
                      backgroundColor: '#FAFAF7',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{q}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {leader.mosque_name && (
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F4F5F1' }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Mosque</Text>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                  {leader.mosque_name} {leader.mosque_location ? `(${leader.mosque_location})` : ''}
                </Text>
              </View>
            )}

            {leader.institution && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Institution</Text>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{leader.institution}</Text>
              </View>
            )}
          </View>

          {/* Contribution Section */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Support This Leader</Text>
            <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 12 }}>Contribute to their long-term welfare</Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>Contribution Type</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['one-time', 'recurring'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: contributionType === type ? '#0B342B' : '#FAFAF7',
                      alignItems: 'center',
                      shadowColor: contributionType === type ? '#0B342B' : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: contributionType === type ? 0.2 : 0,
                      shadowRadius: 8,
                      elevation: contributionType === type ? 4 : 0,
                    }}
                    onPress={() => setContributionType(type)}
                  >
                    <Text style={{
                      color: contributionType === type ? '#FFFFFF' : '#6B7280',
                      fontSize: 14,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}>
                      {type === 'one-time' ? 'One-Time' : 'Monthly'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>Amount (KES)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {quickAmounts.map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: parseFloat(contributionAmount) === val ? '#0B342B' : '#FAFAF7',
                    }}
                    onPress={() => setContributionAmount(val.toString())}
                  >
                    <Text style={{
                      color: parseFloat(contributionAmount) === val ? '#FFFFFF' : '#6B7280',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {formatCurrency(val)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: '#1F2937',
                  fontSize: 15,
                  maxWidth: 200,
                }}
                value={contributionAmount}
                onChangeText={(text) => {
                  setContributionAmount(text);
                  if (error) setError('');
                }}
                placeholder="Enter custom amount"
                placeholderTextColor="rgba(107, 114, 128, 0.5)"
                keyboardType="numeric"
              />
              {error ? <Text style={{ color: '#DC2626', fontSize: 13, marginTop: 6 }}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#0B342B',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                marginTop: 14,
                maxWidth: 200,
                shadowColor: '#0B342B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={handleContribute}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Support Leader</Text>
            </TouchableOpacity>

            <Text style={{ color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 12 }}>
              Wakala Model · 0% Riba · Transparent
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
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
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Confirm Contribution</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>You are contributing to</Text>
                <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '700', marginTop: 2 }}>{leader?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>{getLeaderTypeLabel(leader?.leader_type)}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Amount</Text>
                  <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '600' }}>
                    {formatCurrency(parseFloat(contributionAmount) || 0)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Type</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>
                    {contributionType}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                  This contribution supports the long-term welfare of {leader?.name}.
                  May Allah accept your generous contribution.
                </Text>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}

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
                  onPress={confirmContribution}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Confirm Contribution</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
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
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Contribution Successful!</Text>
              <TouchableOpacity onPress={closeSuccessModal}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(11, 52, 43, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(11, 52, 43, 0.2)',
                }}>
                  <Text style={{ color: '#0B342B', fontSize: 32 }}>✓</Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>You contributed to</Text>
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700', marginTop: 2 }}>{leader?.name}</Text>
                <Text style={{ color: '#0B342B', fontSize: 20, fontWeight: '700', marginTop: 2 }}>
                  {formatCurrency(successAmount)}
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 }}>
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
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
                onPress={closeSuccessModal}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== PIN MODAL ===== */}
      <PinModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerify}
        loading={pinLoading}
        error={pinError}
        title="Confirm Contribution"
        subtitle="Enter your 4-digit PIN to confirm this contribution"
        amount={parseFloat(contributionAmount) || 0}
        recipient={leader?.name}
        transactionType="pension"
      />
    </SafeAreaView>
  );
};

export default LeaderPublicProfile;