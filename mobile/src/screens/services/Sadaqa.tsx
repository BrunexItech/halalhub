import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sadaqaService, walletService } from '../../api/client';
import PinModal from '../../components/common/PinModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// Professional SVG Icons using react-native-svg
const HeartIcon = ({ color = '#032A24', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" 
      fill={color} 
      opacity="0.15" 
      stroke={color} 
      strokeWidth="1.5"
    />
  </Svg>
);

const WalletIcon = ({ color = '#FFFFFF', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
    <Path d="M16 13C16 12.4477 16.4477 12 17 12H20C20.5523 12 21 12.4477 21 13V15C21 15.5523 20.5523 16 20 16H17C16.4477 16 16 15.5523 16 15V13Z" fill={color} opacity="0.1" stroke={color} strokeWidth="1.5"/>
    <Circle cx="18" cy="14" r="0.5" fill={color}/>
  </Svg>
);

const SearchIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const DonorsIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.5"/>
    <Path d="M4 18V17C4 14.7909 5.79086 13 8 13H10C12.2091 13 14 14.7909 14 17V18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="17" cy="9" r="2" stroke={color} strokeWidth="1.5"/>
    <Path d="M15 17V16C15 14.8954 15.8954 14 17 14H18C19.1046 14 20 14.8954 20 16V17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const SuccessIcon = ({ color = '#3FAF73', size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.5" opacity="0.2"/>
    <Circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.5" opacity="0.1"/>
    <Path d="M7 12L10 15L17 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const BackIcon = ({ color = '#032A24', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SadaqaIcon = ({ color = '#C9A44B', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
      stroke={color} 
      strokeWidth="1.5"
      opacity="0.2"
    />
    <Path 
      d="M12 16V12M12 8H12.01M8 12H16" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const Sadaqa = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [balance, setBalance] = useState(0);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [donationHistory, setDonationHistory] = useState<any[]>([]);
  const [impactStats, setImpactStats] = useState({
    totalRaised: 0,
    totalDonations: 0,
    uniqueDonors: 0,
    campaignsSupported: 0,
  });
  const [summary, setSummary] = useState({
    totalDonations: 0,
    totalAmount: 0,
    uniqueCampaigns: 0,
    categoriesSupported: 0,
  });

  const [recentDonationsExpanded, setRecentDonationsExpanded] = useState(false);

  // ===== PIN MODAL STATE =====
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  const categories = [
    { id: 'all', label: 'All Causes' },
    { id: 'orphan', label: 'Orphan Care' },
    { id: 'masjid', label: 'Mosque Projects' },
    { id: 'water', label: 'Water & Food' },
    { id: 'education', label: 'Education' },
    { id: 'medical', label: 'Medical Support' },
    { id: 'emergency', label: 'Emergency Relief' },
    { id: 'imam', label: 'Imam Support' },
    { id: 'community', label: 'Community Development' },
  ];

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [dedication, setDedication] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  useEffect(() => {
    fetchBalance();
    fetchCampaigns();
    fetchDonationHistory();
    fetchSummary();
    fetchImpactStats();
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [filterCategory]);

  const fetchBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.log('Failed to fetch balance:', err);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterCategory !== 'all') params.category = filterCategory;

      const res = await sadaqaService.getCampaigns(params);
      if (res.data.success) {
        setCampaigns(res.data.campaigns || []);
        if (res.data.campaigns && res.data.campaigns.length > 0 && !selectedCampaign) {
          setSelectedCampaign(res.data.campaigns[0]);
        }
        if (selectedCampaign) {
          const stillExists = res.data.campaigns.find((c: any) => c.id === selectedCampaign.id);
          if (!stillExists && res.data.campaigns.length > 0) {
            setSelectedCampaign(res.data.campaigns[0]);
          }
        }
      }
    } catch (err) {
      console.log('Failed to fetch campaigns:', err);
      setError('Failed to load causes. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDonationHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await sadaqaService.getHistory();
      if (res.data.success) {
        setDonationHistory(res.data.history || []);
      }
    } catch (err) {
      console.log('Failed to fetch donation history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await sadaqaService.getSummary();
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.log('Failed to fetch summary:', err);
    }
  };

  const fetchImpactStats = async () => {
    try {
      const res = await sadaqaService.getImpactStats();
      if (res.data.success) {
        setImpactStats(res.data.impact);
      }
    } catch (err) {
      console.log('Failed to fetch impact stats:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBalance();
    fetchCampaigns();
    fetchDonationHistory();
    fetchSummary();
    fetchImpactStats();
  };

  // ===== HANDLE DONATION WITH PIN =====
  const handleDonate = () => {
    if (!selectedCampaign) {
      setError('Please select a cause');
      return;
    }
    if (!amount || parseFloat(amount) < 10) {
      setError('Please enter a valid amount (minimum KES 10)');
      return;
    }
    if (parseFloat(amount) > balance) {
      setError(`Insufficient balance. Available: KES ${balance.toLocaleString()}`);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmDonation = () => {
    setShowConfirmModal(false);
    setShowPinModal(true);
    setPinError('');
  };

  const handlePinVerify = async (pin: string) => {
    setPinLoading(true);
    setPinError('');

    try {
      const response = await sadaqaService.donate({
        campaignId: selectedCampaign.id,
        amount: parseFloat(amount),
        dedication: dedication,
        isAnonymous: isAnonymous,
        donorName: isAnonymous ? 'Anonymous' : '',
        pin: pin,
      });

      if (response.data.success) {
        const data = response.data.data;
        setReceiptData({
          id: data.reference,
          amount: data.amount,
          cause: data.campaign,
          organization: data.organization,
          date: data.paidAt,
          status: 'completed',
        });

        setShowPinModal(false);
        setShowReceiptModal(true);
        setAmount('');
        setDedication('');
        setIsAnonymous(false);

        await fetchBalance();
        await fetchCampaigns();
        await fetchDonationHistory();
        await fetchSummary();
        await fetchImpactStats();

        setSuccess(`Sadaqa of KES ${parseFloat(amount).toLocaleString()} sent successfully`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setPinError(err.response?.data?.error || 'Invalid PIN. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinError('');
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const toggleRecentDonations = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRecentDonationsExpanded(!recentDonationsExpanded);
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
    const styles: Record<string, { bg: string; text: string }> = {
      completed: { bg: '#D1FAE5', text: '#3FAF73' },
      pending: { bg: '#FEF3C7', text: '#D97706' },
      failed: { bg: '#FEE2E2', text: '#DC2626' },
    };
    return styles[status] || styles.completed;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Completed',
      pending: 'Pending',
      failed: 'Failed',
    };
    return labels[status] || status;
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.location && campaign.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || campaign.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading causes..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ 
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#032A24" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* ===== PREMIUM HEADER ===== */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.2)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 6,
          }}>
            <View style={{
              position: 'absolute',
              top: 0,
              left: 40,
              right: 40,
              height: 2,
              backgroundColor: '#C9A44B',
              opacity: 0.3,
            }} />
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={{
                  padding: 6,
                  marginRight: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                }}
              >
                <BackIcon color="#C9A44B" size={22} />
              </TouchableOpacity>
              
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <SadaqaIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Sadaqah Jariyah
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Give with purpose
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Support verified causes · Lasting impact
                </Text>
              </View>

              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.1)',
              }}>
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#C9A44B',
                  opacity: 0.5,
                }} />
              </View>
            </View>
          </View>

          {/* Balance Card */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.12)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(201, 164, 75, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                }}>
                  <WalletIcon color="#C9A44B" size={22} />
                </View>
                <View>
                  <Text style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: 11, 
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 2,
                  }}>
                    Available Balance
                  </Text>
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 24, 
                    fontWeight: '700',
                    letterSpacing: -0.3,
                  }}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
              </View>
              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.12)',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.15)',
              }}>
                <Text style={{ 
                  color: '#C9A44B', 
                  fontSize: 9, 
                  fontWeight: '600',
                  letterSpacing: 0.5,
                }}>
                  Sadaqah Jariyah
                </Text>
              </View>
            </View>
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>
                {error}
              </Text>
              <TouchableOpacity
                style={{ 
                  backgroundColor: '#DC2626', 
                  paddingHorizontal: 12, 
                  paddingVertical: 5, 
                  borderRadius: 6,
                }}
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            {/* Main Content */}
            <View style={{ flex: 2, minWidth: 300, gap: 20 }}>
              {/* Search & Filter */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: '#6B7280', 
                      fontSize: 10, 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 6,
                    }}>
                      Search
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <View style={{ position: 'absolute', left: 12, top: 11, zIndex: 1 }}>
                        <SearchIcon color="#9CA3AF" size={16} />
                      </View>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.08)',
                          borderRadius: 10,
                          paddingHorizontal: 36,
                          paddingVertical: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholder="Search causes..."
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: '#6B7280', 
                      fontSize: 10, 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 6,
                    }}>
                      Category
                    </Text>
                    <View style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.08)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                    }}>
                      <TextInput
                        style={{ 
                          color: '#1F2937', 
                          fontSize: 14, 
                          padding: 0,
                        }}
                        value={filterCategory}
                        onChangeText={(text) => setFilterCategory(text)}
                        placeholder="all"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Causes Grid */}
              {filteredCampaigns.length === 0 ? (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 48,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                }}>
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 14,
                  }}>
                    No causes found. Try adjusting your search.
                  </Text>
                </View>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const pct = Math.round((campaign.raised / campaign.target) * 100);
                  const isSelected = selectedCampaign?.id === campaign.id;
                  return (
                    <TouchableOpacity
                      key={campaign.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16,
                        padding: 18,
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#C9A44B' : 'rgba(3, 42, 36, 0.06)',
                        shadowColor: isSelected ? '#C9A44B' : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isSelected ? 0.08 : 0,
                        shadowRadius: 12,
                        elevation: isSelected ? 3 : 0,
                      }}
                      onPress={() => setSelectedCampaign(campaign)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Text style={{ 
                              color: '#032A24', 
                              fontSize: 16, 
                              fontWeight: '600',
                              letterSpacing: -0.2,
                            }}>
                              {campaign.name}
                            </Text>
                            <View style={{
                              backgroundColor: 'rgba(63, 175, 115, 0.08)',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: 'rgba(63, 175, 115, 0.12)',
                            }}>
                              <Text style={{ 
                                color: '#3FAF73', 
                                fontSize: 9, 
                                fontWeight: '500',
                              }}>
                                Verified
                              </Text>
                            </View>
                          </View>
                          <Text style={{ 
                            color: '#6B7280', 
                            fontSize: 13,
                            marginBottom: 1,
                          }}>
                            {campaign.organization}
                          </Text>
                          {campaign.location && (
                            <Text style={{ 
                              color: '#9CA3AF', 
                              fontSize: 12,
                            }}>
                              {campaign.location}
                            </Text>
                          )}
                        </View>
                        <View style={{
                          backgroundColor: 'rgba(3, 42, 36, 0.04)',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}>
                          <Text style={{ 
                            color: '#6B7280', 
                            fontSize: 10, 
                            fontWeight: '500',
                          }}>
                            {categories.find(c => c.id === campaign.category)?.label || campaign.category}
                          </Text>
                        </View>
                      </View>

                      {campaign.description && (
                        <Text style={{ 
                          color: '#6B7280', 
                          fontSize: 13,
                          marginTop: 6,
                          lineHeight: 20,
                        }} numberOfLines={2}>
                          {campaign.description}
                        </Text>
                      )}

                      <View style={{ marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ 
                            color: '#6B7280', 
                            fontSize: 12,
                          }}>
                            Raised
                          </Text>
                          <Text style={{ 
                            color: '#032A24', 
                            fontSize: 12, 
                            fontWeight: '600',
                          }}>
                            {formatCurrency(campaign.raised)}
                          </Text>
                        </View>
                        <View style={{
                          height: 4,
                          backgroundColor: '#F3F4F6',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}>
                          <View style={{
                            height: '100%',
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: '#032A24',
                            borderRadius: 2,
                          }} />
                        </View>
                        <View style={{ 
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          marginTop: 4,
                        }}>
                          <Text style={{ 
                            color: '#9CA3AF', 
                            fontSize: 11,
                          }}>
                            Target: {formatCurrency(campaign.target)}
                          </Text>
                          <Text style={{ 
                            color: '#032A24', 
                            fontSize: 11, 
                            fontWeight: '500',
                          }}>
                            {pct}%
                          </Text>
                        </View>
                      </View>

                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 12,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <DonorsIcon color="#9CA3AF" size={14} />
                          <Text style={{ 
                            color: '#9CA3AF', 
                            fontSize: 12,
                          }}>
                            {campaign.donor_count || 0} donors
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={{
                            backgroundColor: '#C9A44B',
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                            borderRadius: 12,
                          }}>
                            <Text style={{ 
                              color: '#032A24', 
                              fontSize: 10, 
                              fontWeight: '600',
                            }}>
                              Selected
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Sidebar */}
            <View style={{ flex: 1, minWidth: 240, gap: 20 }}>
              {/* Donation Form */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 12,
                elevation: 2,
              }}>
                <Text style={{ 
                  color: '#032A24', 
                  fontSize: 18, 
                  fontWeight: '600',
                  letterSpacing: -0.3,
                  marginBottom: 16,
                }}>
                  Make a donation
                </Text>

                {selectedCampaign ? (
                  <View style={{
                    backgroundColor: 'rgba(3, 42, 36, 0.02)',
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                    marginBottom: 16,
                  }}>
                    <Text style={{ 
                      color: '#032A24', 
                      fontSize: 14, 
                      fontWeight: '600',
                      marginBottom: 2,
                    }}>
                      {selectedCampaign.name}
                    </Text>
                    <Text style={{ 
                      color: '#6B7280', 
                      fontSize: 12,
                    }}>
                      {selectedCampaign.organization}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 14,
                    marginBottom: 16,
                  }}>
                    Select a cause to support
                  </Text>
                )}

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 11, 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}>
                    Amount (KES)
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {quickAmounts.map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                          backgroundColor: parseFloat(amount) === val ? '#032A24' : '#F3F4F6',
                          borderWidth: 1,
                          borderColor: parseFloat(amount) === val ? '#032A24' : 'transparent',
                        }}
                        onPress={() => handleQuickAmount(val)}
                      >
                        <Text style={{
                          color: parseFloat(amount) === val ? '#FFFFFF' : '#6B7280',
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
                      borderColor: 'rgba(3, 42, 36, 0.08)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter custom amount"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 11, 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 6,
                  }}>
                    Dedication (Optional)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.08)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={dedication}
                    onChangeText={setDedication}
                    placeholder="e.g., In memory of..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                  }}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: isAnonymous ? '#032A24' : 'rgba(3, 42, 36, 0.15)',
                    backgroundColor: isAnonymous ? '#032A24' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isAnonymous && <CheckIcon color="#FFFFFF" size={12} />}
                  </View>
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 13,
                  }}>
                    Donate anonymously
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#032A24',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: (!selectedCampaign || !amount || processing) ? 0.5 : 1,
                  }}
                  onPress={handleDonate}
                  disabled={!selectedCampaign || !amount || processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ 
                        color: '#FFFFFF', 
                        fontSize: 15, 
                        fontWeight: '600',
                      }}>
                        Processing...
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ 
                      color: '#FFFFFF', 
                      fontSize: 15, 
                      fontWeight: '600',
                      letterSpacing: 0.3,
                    }}>
                      Give Sadaqah
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={{ 
                  color: '#9CA3AF', 
                  fontSize: 10,
                  textAlign: 'center', 
                  marginTop: 10,
                }}>
                  100% reaches beneficiaries · No platform fee
                </Text>
              </View>

              {/* Impact Stats */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
              }}>
                <Text style={{ 
                  color: '#032A24', 
                  fontSize: 16, 
                  fontWeight: '600',
                  letterSpacing: -0.2,
                  marginBottom: 14,
                }}>
                  Your Impact
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Total Given', value: formatCurrency(summary.totalAmount || 0) },
                    { label: 'Donations', value: summary.totalDonations || 0 },
                    { label: 'Categories', value: summary.categoriesSupported || 0, color: '#C9A44B' },
                    { label: 'Causes', value: summary.uniqueCampaigns || 0 },
                  ].map((item, index) => (
                    <View key={index} style={{
                      flex: 1,
                      minWidth: 60,
                      backgroundColor: '#FAFAF7',
                      borderRadius: 10,
                      padding: 10,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{
                        color: item.color || '#032A24',
                        fontSize: 16,
                        fontWeight: '700',
                        letterSpacing: -0.3,
                      }}>
                        {item.value}
                      </Text>
                      <Text style={{ 
                        color: '#6B7280', 
                        fontSize: 10,
                        marginTop: 2,
                      }}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recent Donations - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={toggleRecentDonations}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 20,
                  }}
                >
                  <Text style={{ 
                    color: '#032A24', 
                    fontSize: 16, 
                    fontWeight: '600',
                    letterSpacing: -0.2,
                  }}>
                    Recent Donations
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {donationHistory.length > 0 && (
                      <Text style={{ 
                        color: '#6B7280', 
                        fontSize: 11,
                      }}>
                        {donationHistory.length}
                      </Text>
                    )}
                    {recentDonationsExpanded ? (
                      <ChevronUpIcon color="#6B7280" size={18} />
                    ) : (
                      <ChevronDownIcon color="#6B7280" size={18} />
                    )}
                  </View>
                </TouchableOpacity>

                {recentDonationsExpanded && (
                  <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    {loadingHistory ? (
                      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <ActivityIndicator size="small" color="#032A24" />
                      </View>
                    ) : donationHistory.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ 
                          color: '#9CA3AF', 
                          fontSize: 13,
                        }}>
                          No donations yet
                        </Text>
                      </View>
                    ) : (
                      donationHistory.slice(0, 5).map((donation, index) => {
                        const badge = getStatusBadge(donation.status);
                        return (
                          <View 
                            key={donation.id} 
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingVertical: 10,
                              borderBottomWidth: index < donationHistory.slice(0, 5).length - 1 ? 1 : 0,
                              borderBottomColor: '#F3F4F6',
                            }}
                          >
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text style={{ 
                                color: '#1F2937', 
                                fontSize: 13, 
                                fontWeight: '500',
                              }} numberOfLines={1}>
                                {donation.campaign_name || 'Donation'}
                              </Text>
                              <Text style={{ 
                                color: '#9CA3AF', 
                                fontSize: 11,
                              }}>
                                {formatDate(donation.paid_at || donation.createdat)}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ 
                                color: '#032A24', 
                                fontSize: 14, 
                                fontWeight: '700',
                              }}>
                                {formatCurrency(donation.amount)}
                              </Text>
                              <View style={{
                                backgroundColor: badge.bg,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 10,
                                marginTop: 2,
                              }}>
                                <Text style={{ 
                                  color: badge.text, 
                                  fontSize: 9, 
                                  fontWeight: '500',
                                }}>
                                  {getStatusLabel(donation.status)}
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
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 20,
            }}>
              <Text style={{ 
                color: '#032A24', 
                fontSize: 20, 
                fontWeight: '700',
                letterSpacing: -0.3,
              }}>
                Confirm Sadaqah
              </Text>
              <TouchableOpacity 
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
                style={{ padding: 4 }}
              >
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 16,
              }}>
                <Text style={{ 
                  color: '#6B7280', 
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}>
                  Amount
                </Text>
                <Text style={{ 
                  color: '#032A24', 
                  fontSize: 28, 
                  fontWeight: '700',
                  letterSpacing: -0.5,
                }}>
                  {formatCurrency(parseFloat(amount) || 0)}
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 16,
              }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    Cause
                  </Text>
                  <Text style={{ 
                    color: '#032A24', 
                    fontSize: 12, 
                    fontWeight: '600',
                  }}>
                    {selectedCampaign?.name}
                  </Text>
                </View>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    Organization
                  </Text>
                  <Text style={{ 
                    color: '#032A24', 
                    fontSize: 12, 
                    fontWeight: '600',
                  }}>
                    {selectedCampaign?.organization}
                  </Text>
                </View>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    Type
                  </Text>
                  <Text style={{ 
                    color: '#032A24', 
                    fontSize: 12, 
                    fontWeight: '600',
                  }}>
                    Sadaqah Jariyah
                  </Text>
                </View>
                {dedication && (
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    paddingVertical: 4,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(3, 42, 36, 0.04)',
                    marginTop: 4,
                    paddingTop: 8,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>
                      Dedication
                    </Text>
                    <Text style={{ 
                      color: '#032A24', 
                      fontSize: 12, 
                      fontWeight: '600',
                    }}>
                      {dedication}
                    </Text>
                  </View>
                )}
                {isAnonymous && (
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    paddingVertical: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>
                      Anonymous
                    </Text>
                    <Text style={{ 
                      color: '#032A24', 
                      fontSize: 12, 
                      fontWeight: '600',
                    }}>
                      Yes
                    </Text>
                  </View>
                )}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 4,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  marginTop: 4,
                  paddingTop: 8,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    Balance After
                  </Text>
                  <Text style={{ 
                    color: '#032A24', 
                    fontSize: 12, 
                    fontWeight: '600',
                  }}>
                    {formatCurrency(balance - parseFloat(amount))}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.04)',
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.08)',
                marginBottom: 20,
              }}>
                <Text style={{ 
                  color: '#032A24', 
                  fontSize: 13,
                  textAlign: 'center', 
                  lineHeight: 20,
                }}>
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </Text>
              </View>

              {error ? (
                <Text style={{ 
                  color: '#DC2626', 
                  fontSize: 12,
                  marginBottom: 12,
                }}>
                  {error}
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowConfirmModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 15, 
                    fontWeight: '500',
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#032A24',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: processing ? 0.5 : 1,
                  }}
                  onPress={confirmDonation}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ 
                        color: '#FFFFFF', 
                        fontSize: 15, 
                        fontWeight: '600',
                      }}>
                        Processing...
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ 
                      color: '#FFFFFF', 
                      fontSize: 15, 
                      fontWeight: '600',
                    }}>
                      Confirm Donation
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={showReceiptModal} transparent animationType="fade">
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
        }}>
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
              padding: 20,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              margin: -24,
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 20, 
                fontWeight: '700',
                letterSpacing: -0.3,
              }}>
                Donation Successful
              </Text>
              <TouchableOpacity 
                onPress={() => setShowReceiptModal(false)}
                activeOpacity={0.7}
                style={{ padding: 4 }}
              >
                <CloseIcon color="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(63, 175, 115, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(63, 175, 115, 0.15)',
                  marginBottom: 10,
                }}>
                  <SuccessIcon color="#3FAF73" size={32} />
                </View>
                <Text style={{ 
                  color: '#6B7280', 
                  fontSize: 13,
                  marginBottom: 2,
                }}>
                  You donated to
                </Text>
                <Text style={{ 
                  color: '#032A24', 
                  fontSize: 20, 
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}>
                  {receiptData?.cause}
                </Text>
                <Text style={{ 
                  color: '#032A24', 
                  fontSize: 28, 
                  fontWeight: '700',
                  letterSpacing: -0.5,
                  marginTop: 4,
                }}>
                  {formatCurrency(receiptData?.amount || 0)}
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 16,
              }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    Reference
                  </Text>
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 11,
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }}>
                    {receiptData?.id}
                  </Text>
                </View>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    Date
                  </Text>
                  <Text style={{ 
                    color: '#032A24', 
                    fontSize: 12, 
                    fontWeight: '600',
                  }}>
                    {formatDate(receiptData?.date)}
                  </Text>
                </View>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    Type
                  </Text>
                  <Text style={{ 
                    color: '#032A24', 
                    fontSize: 12, 
                    fontWeight: '600',
                  }}>
                    Sadaqah Jariyah
                  </Text>
                </View>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    Organization
                  </Text>
                  <Text style={{ 
                    color: '#032A24', 
                    fontSize: 12, 
                    fontWeight: '600',
                  }}>
                    {receiptData?.organization || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.04)',
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.08)',
                marginBottom: 20,
              }}>
                <Text style={{ 
                  color: '#6B7280', 
                  fontSize: 12,
                  textAlign: 'center', 
                  lineHeight: 18,
                  fontStyle: 'italic',
                }}>
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowReceiptModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 15, 
                    fontWeight: '500',
                  }}>
                    Close
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#032A24',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowReceiptModal(false);
                    navigation.navigate('Sadaqa' as never);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 15, 
                    fontWeight: '600',
                  }}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <PinModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerify}
        loading={pinLoading}
        error={pinError}
        title="Confirm Donation"
        subtitle="Enter your 4-digit PIN to confirm this Sadaqah donation"
        amount={parseFloat(amount) || 0}
        recipient={selectedCampaign?.name}
        transactionType="sadaqah"
      />

      {/* Success Toast */}
      {success ? (
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 20,
          left: 20,
          backgroundColor: '#032A24',
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#032A24',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CheckIcon color="#C9A44B" size={18} />
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 14, 
              fontWeight: '500',
              flex: 1,
            }}>
              {success}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => setSuccess('')}
            activeOpacity={0.7}
            style={{ padding: 4 }}
          >
            <CloseIcon color="rgba(255,255,255,0.5)" size={18} />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Sadaqa;