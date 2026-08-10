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
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { leaderService, walletService } from '../../api/client';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// ===== PROFESSIONAL SVG ICONS =====
const BackIcon = ({ color = '#032A24', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const DashboardIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const WalletIcon = ({ color = '#FFFFFF', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
    <Path d="M16 13C16 12.4477 16.4477 12 17 12H20C20.5523 12 21 12.4477 21 13V15C21 15.5523 20.5523 16 20 16H17C16.4477 16 16 15.5523 16 15V13Z" fill={color} opacity="0.1" stroke={color} strokeWidth="1.5"/>
    <Circle cx="18" cy="14" r="0.5" fill={color}/>
  </Svg>
);

const UsersIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M23 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const HeartIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const AwardIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="6" stroke={color} strokeWidth="1.5"/>
    <Path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShareIcon = ({ color = '#C9A44B', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 2v12m0 0l3-3m-3 3l-3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShieldIcon = ({ color = '#C9A44B', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

const PlusIcon = ({ color = '#C9A44B', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 8V16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

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

  const [contributionsExpanded, setContributionsExpanded] = useState(false);

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  useEffect(() => {
    fetchData();
  }, []);

  const toggleContributions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setContributionsExpanded(!contributionsExpanded);
  };

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
          <ActivityIndicator size="large" color="#032A24" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 36,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#032A24" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* ===== PREMIUM HEADER WITH AURA ===== */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 18,
            paddingHorizontal: 20,
            paddingTop: 30,
            paddingBottom: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.12)',
            shadowColor: '#C9A44B',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06,
            shadowRadius: 24,
            elevation: 6,
            overflow: 'hidden',
          }}>
            {/* Aura Glow Effect */}
            <View style={{
              position: 'absolute',
              top: -80,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(201, 164, 75, 0.04)',
            }} />
            <View style={{
              position: 'absolute',
              bottom: -60,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(201, 164, 75, 0.03)',
            }} />
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: '#C9A44B',
              opacity: 0.15,
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={{
                  padding: 8,
                  marginRight: 14,
                  borderRadius: 12,
                  backgroundColor: 'rgba(201, 164, 75, 0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.06)',
                }}
              >
                <BackIcon color="#C9A44B" size={20} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <View style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: '#C9A44B',
                    opacity: 0.6,
                  }} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 11,
                    fontWeight: '500',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                  }}>
                    Dashboard
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 22,
                  fontWeight: '700',
                  letterSpacing: -0.4,
                  marginBottom: 1,
                }}>
                  Leader Dashboard
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                }}>
                  Manage your pension and supporters
                </Text>
              </View>

              {/* Premium Icon Badge */}
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(201, 164, 75, 0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
              }}>
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#C9A44B',
                  opacity: 0.3,
                }} />
              </View>
            </View>
          </View>

          {/* ===== SUCCESS/ERROR TOASTS ===== */}
          {success ? (
            <View style={{
              backgroundColor: 'rgba(63, 175, 115, 0.04)',
              borderWidth: 1,
              borderColor: 'rgba(63, 175, 115, 0.08)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#3FAF73', fontSize: 13, flex: 1 }}>{success}</Text>
              <TouchableOpacity onPress={() => setSuccess('')} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={16} />
              </TouchableOpacity>
            </View>
          ) : null}

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ===== PROFILE HERO SECTION ===== */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.1)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -60, right: -60, width: 140, height: 140, backgroundColor: 'rgba(201, 164, 75, 0.03)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -40, left: -40, width: 100, height: 100, backgroundColor: 'rgba(201, 164, 75, 0.03)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 20, fontWeight: '700', letterSpacing: -0.5 }}>
                    {getInitials()}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                    {getDisplayName()}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={{ color: '#C9A44B', fontSize: 13 }}>
                      {getLeaderTypeLabel(leaderType)}
                    </Text>
                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                    <Text style={{ color: 'rgba(201, 164, 75, 0.5)', fontSize: 13 }}>
                      {profile?.years_of_service || 0} years
                    </Text>
                    {profile?.is_verified && (
                      <View style={{
                        backgroundColor: 'rgba(63, 175, 115, 0.12)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(63, 175, 115, 0.15)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <CheckIcon color="#3FAF73" size={10} />
                        <Text style={{ color: '#3FAF73', fontSize: 10, fontWeight: '500' }}>Verified</Text>
                      </View>
                    )}
                    <View style={{
                      backgroundColor: isPublic ? 'rgba(63, 175, 115, 0.08)' : 'rgba(255,255,255,0.05)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isPublic ? 'rgba(63, 175, 115, 0.12)' : 'rgba(255,255,255,0.06)',
                    }}>
                      <Text style={{
                        color: isPublic ? '#3FAF73' : 'rgba(255,255,255,0.3)',
                        fontSize: 10,
                        fontWeight: '500',
                      }}>
                        {isPublic ? 'Public' : 'Private'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: isPublic
                    ? 'rgba(63, 175, 115, 0.12)'
                    : profile?.status === 'approved'
                      ? '#C9A44B'
                      : 'rgba(255,255,255,0.05)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
                onPress={handleShareLink}
                disabled={processing || isPublic || profile?.status !== 'approved'}
                activeOpacity={0.7}
              >
                {isPublic ? (
                  <CheckIcon color="#3FAF73" size={12} />
                ) : (
                  <ShareIcon color={profile?.status === 'approved' ? '#032A24' : 'rgba(255,255,255,0.3)'} size={12} />
                )}
                <Text style={{
                  color: isPublic ? '#3FAF73' : profile?.status === 'approved' ? '#032A24' : 'rgba(255,255,255,0.3)',
                  fontSize: 12,
                  fontWeight: '600',
                }}>
                  {isPublic ? 'Profile is Public' : processing ? 'Processing...' : 'Share Support Link'}
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
              borderTopColor: 'rgba(201, 164, 75, 0.06)',
            }}>
              {[
                { label: 'Total Pension', value: formatCurrency(pensionData.totalAmount), color: '#C9A44B' },
                { label: 'Supporters', value: pensionData.totalSupporters, color: '#FFFFFF' },
                { label: 'Transactions', value: pensionData.totalTransactions, color: '#FFFFFF' },
                { label: 'Wallet Balance', value: formatCurrency(walletBalance), color: '#3FAF73' },
              ].map((item, index) => (
                <View key={index} style={{ flex: 1, minWidth: 60 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: item.color, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 }}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ===== QUICK ACTIONS ===== */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {[
              { 
                label: 'Add to Pension', 
                action: () => setShowContributeModal(true), 
                icon: <PlusIcon color="#C9A44B" size={14} />, 
                color: '#032A24',
                textColor: '#FFFFFF',
              },
              { 
                label: 'Request Withdrawal', 
                action: () => setShowWithdrawModal(true), 
                icon: <WalletIcon color="#032A24" size={14} />, 
                color: '#FFFFFF',
                textColor: '#032A24',
              },
              { 
                label: `Supporters (${supporters.length})`, 
                action: () => setShowSupportersModal(true), 
                icon: <UsersIcon color="#032A24" size={14} />, 
                color: '#FFFFFF',
                textColor: '#032A24',
              },
              { 
                label: 'Refresh', 
                action: fetchData, 
                icon: null, 
                color: '#FFFFFF',
                textColor: '#032A24',
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  flex: 1,
                  minWidth: 70,
                  backgroundColor: item.color,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  borderWidth: item.color === '#FFFFFF' ? 1 : 0,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: item.color === '#032A24' ? '#032A24' : 'transparent',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: item.color === '#032A24' ? 0.08 : 0,
                  shadowRadius: 12,
                  elevation: item.color === '#032A24' ? 2 : 0,
                }}
                onPress={item.action}
                activeOpacity={0.7}
              >
                {item.icon && <View style={{ marginBottom: 2 }}>{item.icon}</View>}
                <Text style={{
                  color: item.textColor,
                  fontSize: 11,
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ===== COLLAPSIBLE CONTRIBUTION HISTORY ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
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
              onPress={toggleContributions}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 3,
                  height: 16,
                  backgroundColor: '#C9A44B',
                  borderRadius: 2,
                }} />
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
                  Recent Contributions
                </Text>
                <Text style={{ color: '#8B8A86', fontSize: 12 }}>
                  {contributions.length} entries
                </Text>
              </View>
              {contributionsExpanded ? (
                <ChevronUpIcon color="#6B7280" size={18} />
              ) : (
                <ChevronDownIcon color="#6B7280" size={18} />
              )}
            </TouchableOpacity>

            {contributionsExpanded && (
              <View style={{ paddingBottom: 16 }}>
                {contributions.length === 0 ? (
                  <View style={{ padding: 32, alignItems: 'center' }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No contributions yet</Text>
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
                        borderBottomColor: 'rgba(3, 42, 36, 0.03)',
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : 'rgba(3, 42, 36, 0.01)',
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }}>
                            {contrib.is_self_contribution ? 'Self' : (contrib.supporter_name || 'Anonymous')}
                          </Text>
                          <Text style={{ color: '#8B8A86', fontSize: 11 }}>
                            {formatDate(contrib.contribution_date)}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>
                            {formatCurrency(contrib.amount)}
                          </Text>
                          <View style={{
                            backgroundColor: badge.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.04)',
                          }}>
                            <Text style={{ color: badge.text, fontSize: 9, fontWeight: '500', textTransform: 'capitalize' }}>
                              {contrib.status || 'pending'}
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

          {/* ===== FOOTER ===== */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Leader Pension Program
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== MODALS (Preserved with premium styling) ===== */}
      {/* Contribute Modal */}
      <Modal visible={showContributeModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Add to Pension
              </Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Available Balance</Text>
                <Text style={{ color: '#032A24', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                  {formatCurrency(walletBalance)}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 }}>
                  Amount
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {quickAmounts.map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                        backgroundColor: parseFloat(contributeAmount) === val ? '#032A24' : '#FAFAF7',
                        borderWidth: 1,
                        borderColor: parseFloat(contributeAmount) === val ? '#032A24' : 'transparent',
                      }}
                      onPress={() => setContributeAmount(val.toString())}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        color: parseFloat(contributeAmount) === val ? '#FFFFFF' : '#6B7280',
                        fontSize: 11,
                        fontWeight: '600',
                      }}>
                        {formatCurrency(val)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={contributeAmount}
                  onChangeText={setContributeAmount}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowContributeModal(false)}
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
                    opacity: (processing || !contributeAmount) ? 0.5 : 1,
                  }}
                  onPress={handleSelfContribute}
                  disabled={processing || !contributeAmount}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Contribute</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Request Withdrawal
              </Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: 'rgba(217, 119, 6, 0.04)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(217, 119, 6, 0.08)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#D97706', fontSize: 12, textAlign: 'center' }}>Admin approval required</Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Available</Text>
                <Text style={{ color: '#032A24', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                  {formatCurrency(pensionData.totalAmount)}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Amount
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={withdrawData.amount}
                  onChangeText={(text) => setWithdrawData({ ...withdrawData, amount: text })}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <Text style={{ color: '#6B7280', fontSize: 10, marginTop: 2 }}>Minimum: KES 100</Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Notes
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 50,
                    textAlignVertical: 'top',
                  }}
                  value={withdrawData.notes}
                  onChangeText={(text) => setWithdrawData({ ...withdrawData, notes: text })}
                  placeholder="Optional notes"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowWithdrawModal(false)}
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
                    opacity: (processing || !withdrawData.amount) ? 0.5 : 1,
                  }}
                  onPress={handleWithdrawRequest}
                  disabled={processing || !withdrawData.amount}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Supporters Modal */}
      <Modal visible={showSupportersModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Supporters
              </Text>
              <TouchableOpacity onPress={() => setShowSupportersModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {supporters.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No supporters yet</Text>
                </View>
              ) : (
                supporters.map((supporter) => (
                  <View key={supporter.id} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                    marginBottom: 8,
                  }}>
                    <View>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }}>
                        {supporter.supporter_name || 'Anonymous'}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>{supporter.supporter_phone || ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>
                        {formatCurrency(supporter.amount)}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 10, textTransform: 'capitalize' }}>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#032A24',
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              margin: -24,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Profile Status
              </Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: isPublic ? 'rgba(63, 175, 115, 0.08)' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: isPublic ? 'rgba(63, 175, 115, 0.15)' : '#E5E7EB',
                }}>
                  {isPublic ? (
                    <ShieldIcon color="#3FAF73" size={28} />
                  ) : (
                    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24, color: '#6B7280' }}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', marginTop: 8, letterSpacing: -0.3 }}>
                  {isPublic ? 'Profile is Public' : 'Profile is Private'}
                </Text>
                <Text style={{
                  color: isPublic ? '#3FAF73' : '#6B7280',
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: 4,
                  lineHeight: 20,
                }}>
                  {isPublic
                    ? 'Your profile is visible. People can find and support you.'
                    : 'Your profile is private. People cannot find or support you.'}
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowShareModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LeaderDashboard;