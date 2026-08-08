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
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { leaderService, walletService } from '../../api/client';

const LeaderDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pensionData, setPensionData] = useState({
    totalAmount: 0,
    totalSupporters: 0,
    totalTransactions: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [leaderType, setLeaderType] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [contributions, setContributions] = useState<any[]>([]);
  const [supporters, setSupporters] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSupportersModal, setShowSupportersModal] = useState(false);

  const [contributeAmount, setContributeAmount] = useState('');
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    notes: '',
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
        walletService.getBalance(),
      ]);

      const pension = pensionRes.data.pension || {};
      setPensionData({
        totalAmount: pension.total_amount || 0,
        totalSupporters: pension.total_supporters || 0,
        totalTransactions: pension.total_transactions || 0,
      });

      setProfile(profileRes.data.leader || null);
      setLeaderType(profileRes.data.leader?.leader_type || '');
      setShareLink(profileRes.data.leader?.share_link || '');
      setIsPublic(profileRes.data.leader?.is_public || false);
      setContributions(contribRes.data.contributions || []);
      setSupporters(supportersRes.data.supporters || []);
      setWalletBalance(walletRes.data.balance || 0);
    } catch (err) {
      console.log('Error fetching data:', err);
      setError('Failed to load pension data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSelfContribute = async () => {
    if (!contributeAmount || parseFloat(contributeAmount) < 10) {
      setError('Minimum contribution is KES 10');
      return;
    }

    if (parseFloat(contributeAmount) > walletBalance) {
      setError(`Insufficient wallet balance. Available: KES ${walletBalance.toLocaleString()}`);
      return;
    }

    setProcessing(true);
    try {
      await leaderService.selfContribute({
        amount: parseFloat(contributeAmount),
      });

      setSuccess(`Successfully contributed KES ${parseFloat(contributeAmount).toLocaleString()}`);
      setShowContributeModal(false);
      setContributeAmount('');
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to contribute');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdrawRequest = async () => {
    if (!withdrawData.amount || parseFloat(withdrawData.amount) < 100) {
      setError('Minimum withdrawal request is KES 100');
      return;
    }

    if (parseFloat(withdrawData.amount) > pensionData.totalAmount) {
      setError(`Insufficient pension balance. Available: KES ${pensionData.totalAmount.toLocaleString()}`);
      return;
    }

    setProcessing(true);
    try {
      await leaderService.requestWithdrawal({
        amount: parseFloat(withdrawData.amount),
        notes: withdrawData.notes,
      });

      setSuccess('Withdrawal request submitted. Awaiting admin approval.');
      setShowWithdrawModal(false);
      setWithdrawData({ amount: '', notes: '' });
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit withdrawal request');
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
        setProcessing(false);
        return;
      }

      const response = await leaderService.shareLink();
      setShareLink(response.data.share_link);
      setIsPublic(response.data.is_public);
      setSuccess('Your profile is now public. People can find and support you.');
      setTimeout(() => setSuccess(''), 4000);
      setShowShareModal(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to share profile');
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
    const displayName = user?.fullName || profile?.name || 'LD';
    return displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = () => {
    return user?.fullName || profile?.name || 'Religious Leader';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FEF3C7', text: '#D97706' },
      approved: { bg: '#D1FAE5', text: '#3FAF73' },
      rejected: { bg: '#FEE2E2', text: '#DC2626' },
      completed: { bg: '#D1FAE5', text: '#3FAF73' },
    };
    return styles[status] || { bg: '#F3F4F6', text: '#6B7280' };
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading...</Text>
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
        <View style={{ maxWidth: 700, width: '100%', alignSelf: 'center' }}>
          {/* Toast Notifications - Success */}
          {success ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderLeftWidth: 4,
              borderLeftColor: '#3FAF73',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#3FAF73', fontSize: 13, fontWeight: '500' }}>Success</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{success}</Text>
              </View>
              <TouchableOpacity onPress={() => setSuccess('')}>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {error ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderLeftWidth: 4,
              borderLeftColor: '#DC2626',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '500' }}>Error</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{error}</Text>
              </View>
              <TouchableOpacity onPress={() => setError('')}>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Hero Section */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.1)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(201, 164, 75, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 18, fontWeight: '700' }}>
                    {getInitials()}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>
                    {getDisplayName()}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={{ color: '#C9A44B', fontSize: 14 }}>
                      {getLeaderTypeLabel(leaderType)}
                    </Text>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(201, 164, 75, 0.4)' }} />
                    <Text style={{ color: 'rgba(201, 164, 75, 0.7)', fontSize: 14 }}>
                      {profile?.years_of_service || 0} years
                    </Text>
                    {profile?.is_verified && (
                      <View style={{
                        backgroundColor: 'rgba(63, 175, 115, 0.2)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(63, 175, 115, 0.3)',
                      }}>
                        <Text style={{ color: '#D1FAE5', fontSize: 11, fontWeight: '500' }}>Verified</Text>
                      </View>
                    )}
                    <View style={{
                      backgroundColor: isPublic ? 'rgba(63, 175, 115, 0.2)' : 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: isPublic ? 'rgba(63, 175, 115, 0.3)' : 'rgba(255,255,255,0.1)',
                    }}>
                      <Text style={{
                        color: isPublic ? '#D1FAE5' : '#B7C0BA',
                        fontSize: 11,
                        fontWeight: '500',
                      }}>
                        {isPublic ? 'Public' : 'Private'}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: profile?.status === 'approved' ? 'rgba(63, 175, 115, 0.2)' : 'rgba(254, 243, 199, 0.2)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: profile?.status === 'approved' ? 'rgba(63, 175, 115, 0.3)' : 'rgba(254, 243, 199, 0.3)',
                    }}>
                      <Text style={{
                        color: profile?.status === 'approved' ? '#D1FAE5' : '#FCD34D',
                        fontSize: 11,
                        fontWeight: '500',
                      }}>
                        {profile?.status || 'pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: isPublic
                    ? 'rgba(63, 175, 115, 0.2)'
                    : profile?.status === 'approved'
                      ? '#C9A44B'
                      : '#6B7280',
                  opacity: isPublic ? 1 : profile?.status === 'approved' ? 1 : 0.5,
                }}
                onPress={handleShareLink}
                disabled={processing || isPublic || profile?.status !== 'approved'}
              >
                <Text style={{
                  color: isPublic ? '#D1FAE5' : profile?.status === 'approved' ? '#032A24' : '#FFFFFF',
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                  {isPublic ? '✓ Profile is Public' : processing ? 'Processing...' : 'Share Support Link'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 16,
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(201, 164, 75, 0.1)',
            }}>
              {[
                { label: 'Total Pension', value: formatCurrency(pensionData.totalAmount) },
                { label: 'Supporters', value: pensionData.totalSupporters },
                { label: 'Transactions', value: pensionData.totalTransactions },
                { label: 'Wallet Balance', value: formatCurrency(walletBalance) },
              ].map((item, index) => (
                <View key={index} style={{ flex: 1, minWidth: 60 }}>
                  <Text style={{ color: 'rgba(201, 164, 75, 0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Add to Pension', action: () => setShowContributeModal(true) },
              { label: 'Request Withdrawal', action: () => setShowWithdrawModal(true) },
              { label: `View Supporters (${supporters.length})`, action: () => setShowSupportersModal(true) },
              { label: 'Refresh', action: fetchData },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  flex: 1,
                  minWidth: 80,
                  backgroundColor: index === 0 ? '#0B342B' : '#FFFFFF',
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  borderWidth: index === 0 ? 0 : 1,
                  borderColor: '#E8EEF4',
                  shadowColor: index === 0 ? '#0B342B' : 'transparent',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: index === 0 ? 0.1 : 0,
                  shadowRadius: 8,
                  elevation: index === 0 ? 2 : 0,
                  alignItems: 'center',
                }}
                onPress={item.action}
              >
                <Text style={{
                  color: index === 0 ? '#FFFFFF' : '#1F2937',
                  fontSize: 13,
                  fontWeight: '500',
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contribution History */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F4F5F1',
            }}>
              <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Recent Contributions</Text>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>{contributions.length} entries</Text>
            </View>

            {contributions.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>No contributions yet</Text>
              </View>
            ) : (
              contributions.map((contrib, index) => {
                const badge = getStatusBadge(contrib.status);
                return (
                  <View key={contrib.id} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderBottomWidth: index < contributions.length - 1 ? 1 : 0,
                    borderBottomColor: '#F4F5F1',
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAF7',
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>
                        {contrib.is_self_contribution ? 'Self' : (contrib.supporter_name || 'Anonymous')}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>
                        {formatDate(contrib.contribution_date)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>
                        {formatCurrency(contrib.amount)}
                      </Text>
                      <View style={{
                        backgroundColor: badge.bg,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.05)',
                      }}>
                        <Text style={{ color: badge.text, fontSize: 11, fontWeight: '500', textTransform: 'capitalize' }}>
                          {contrib.status || 'pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Contribute Modal */}
      <Modal visible={showContributeModal} transparent animationType="fade">
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
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Add to Pension</Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Available Balance</Text>
                <Text style={{ color: '#0B342B', fontSize: 20, fontWeight: '700' }}>{formatCurrency(walletBalance)}</Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>Amount</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {quickAmounts.map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: parseFloat(contributeAmount) === val ? '#0B342B' : '#FAFAF7',
                      }}
                      onPress={() => setContributeAmount(val.toString())}
                    >
                      <Text style={{
                        color: parseFloat(contributeAmount) === val ? '#FFFFFF' : '#6B7280',
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
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={contributeAmount}
                  onChangeText={setContributeAmount}
                  placeholder="Enter amount"
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowContributeModal(false)}
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
                    opacity: (processing || !contributeAmount) ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleSelfContribute}
                  disabled={processing || !contributeAmount}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Contribute</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="fade">
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
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: '#FEF3C7',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#FDE68A',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#D97706', fontSize: 13, textAlign: 'center' }}>Admin approval required</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Available</Text>
                <Text style={{ color: '#0B342B', fontSize: 20, fontWeight: '700' }}>{formatCurrency(pensionData.totalAmount)}</Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Amount</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={withdrawData.amount}
                  onChangeText={(text) => setWithdrawData({ ...withdrawData, amount: text })}
                  placeholder="Enter amount"
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  keyboardType="numeric"
                />
                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>Minimum: KES 100</Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Notes</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 50,
                    textAlignVertical: 'top',
                  }}
                  value={withdrawData.notes}
                  onChangeText={(text) => setWithdrawData({ ...withdrawData, notes: text })}
                  placeholder="Optional notes"
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  multiline
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowWithdrawModal(false)}
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
                    opacity: (processing || !withdrawData.amount) ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleWithdrawRequest}
                  disabled={processing || !withdrawData.amount}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Supporters Modal */}
      <Modal visible={showSupportersModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Supporters</Text>
              <TouchableOpacity onPress={() => setShowSupportersModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {supporters.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>No supporters yet</Text>
                </View>
              ) : (
                supporters.map((supporter) => (
                  <View key={supporter.id} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    marginBottom: 6,
                  }}>
                    <View>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>
                        {supporter.supporter_name || 'Anonymous'}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>{supporter.supporter_phone || ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>
                        {formatCurrency(supporter.amount)}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 12, textTransform: 'capitalize' }}>
                        {supporter.frequency || 'once'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="fade">
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
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Profile Status</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: isPublic ? 'rgba(63, 175, 115, 0.1)' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: isPublic ? 'rgba(63, 175, 115, 0.2)' : '#E5E7EB',
                }}>
                  <Text style={{ color: isPublic ? '#3FAF73' : '#6B7280', fontSize: 28 }}>
                    {isPublic ? '✓' : '🔒'}
                  </Text>
                </View>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 8 }}>
                  {isPublic ? 'Profile is Public' : 'Profile is Private'}
                </Text>
                <Text style={{
                  color: isPublic ? '#3FAF73' : '#6B7280',
                  fontSize: 14,
                  textAlign: 'center',
                  marginTop: 4,
                }}>
                  {isPublic
                    ? 'Your profile is visible. People can find and support you.'
                    : 'Your profile is private. People cannot find or support you.'}
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
                onPress={() => setShowShareModal(false)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LeaderDashboard;