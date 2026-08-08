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
  Platform,
  Modal,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sadaqaService, walletService } from '../../api/client';

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

  const confirmDonation = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await sadaqaService.donate({
        campaignId: selectedCampaign.id,
        amount: parseFloat(amount),
        dedication: dedication,
        isAnonymous: isAnonymous,
        donorName: isAnonymous ? 'Anonymous' : '',
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

        setShowConfirmModal(false);
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
      setError(err.response?.data?.error || 'Donation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
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
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading causes...</Text>
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
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16 }}>❤️</Text>
                  <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Sadaqa
                  </Text>
                  <View style={{ width: 1, height: 12, backgroundColor: 'rgba(201, 164, 75, 0.2)' }} />
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '500' }}>Voluntary Charity</Text>
                </View>
                <Text style={{ color: '#F7F6F1', fontSize: 22, fontWeight: '700' }}>Give Voluntary Charity</Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 4, maxWidth: 400 }}>
                  Support meaningful causes through verified organizations. Every contribution makes a difference.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600' }}>Sadaqah Jariyah</Text>
                </View>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                }}>
                  <Text style={{ color: '#F7F6F1', fontSize: 10, fontWeight: '600' }}>Balance: {formatCurrency(balance)}</Text>
                </View>
              </View>
            </View>
          </View>

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
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {/* Causes */}
            <View style={{ flex: 2, minWidth: 300, gap: 12 }}>
              {/* Search & Filter */}
              <View style={{
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
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      Search
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
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      placeholder="Search causes..."
                      placeholderTextColor="rgba(107, 114, 128, 0.5)"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      Category
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
                        value={filterCategory}
                        onChangeText={(text) => setFilterCategory(text)}
                        placeholder="all"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Causes Grid */}
              {filteredCampaigns.length === 0 ? (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 32,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(11, 52, 43, 0.08)',
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>No causes found. Try adjusting your search.</Text>
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
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 2,
                        borderColor: isSelected ? '#0B342B' : 'rgba(11, 52, 43, 0.08)',
                        shadowColor: isSelected ? '#0B342B' : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isSelected ? 0.1 : 0,
                        shadowRadius: 8,
                        elevation: isSelected ? 2 : 0,
                      }}
                      onPress={() => setSelectedCampaign(campaign)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '700' }}>{campaign.name}</Text>
                            <View style={{
                              backgroundColor: 'rgba(63, 175, 115, 0.1)',
                              paddingHorizontal: 6,
                              paddingVertical: 1,
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: 'rgba(63, 175, 115, 0.2)',
                            }}>
                              <Text style={{ color: '#3FAF73', fontSize: 9, fontWeight: '500' }}>Verified</Text>
                            </View>
                          </View>
                          <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{campaign.organization}</Text>
                          {campaign.location && (
                            <Text style={{ color: '#6B7280', fontSize: 12 }}>{campaign.location}</Text>
                          )}
                        </View>
                        <View style={{
                          backgroundColor: '#F3F4F6',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500' }}>
                            {categories.find(c => c.id === campaign.category)?.label || campaign.category}
                          </Text>
                        </View>
                      </View>

                      {campaign.description && (
                        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                          {campaign.description}
                        </Text>
                      )}

                      <View style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>Raised</Text>
                          <Text style={{ color: '#1F2937', fontSize: 11, fontWeight: '600' }}>{formatCurrency(campaign.raised)}</Text>
                        </View>
                        <View style={{
                          height: 4,
                          backgroundColor: '#F3F4F6',
                          borderRadius: 999,
                          marginTop: 4,
                          overflow: 'hidden',
                        }}>
                          <View style={{
                            height: '100%',
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: '#0B342B',
                            borderRadius: 999,
                          }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>Target: {formatCurrency(campaign.target)}</Text>
                          <Text style={{ color: '#0B342B', fontSize: 11, fontWeight: '500' }}>{pct}%</Text>
                        </View>
                      </View>

                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 8,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(11, 52, 43, 0.06)',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>{campaign.donor_count || 0} donors</Text>
                        {isSelected && (
                          <Text style={{ color: '#0B342B', fontSize: 11, fontWeight: '600' }}>Selected</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Sidebar */}
            <View style={{ flex: 1, minWidth: 200, gap: 12 }}>
              {/* Donation Form */}
              <View style={{
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
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Give Sadaqa</Text>

                {selectedCampaign ? (
                  <View style={{
                    backgroundColor: '#FAFAF7',
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.06)',
                    marginBottom: 10,
                  }}>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedCampaign.name}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>{selectedCampaign.organization}</Text>
                  </View>
                ) : (
                  <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 10 }}>Select a cause to support</Text>
                )}

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    Amount (KES)
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {quickAmounts.map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: parseFloat(amount) === val ? '#0B342B' : '#F3F4F6',
                        }}
                        onPress={() => handleQuickAmount(val)}
                      >
                        <Text style={{
                          color: parseFloat(amount) === val ? '#F7F6F1' : '#6B7280',
                          fontSize: 10,
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
                      borderColor: 'rgba(11, 52, 43, 0.12)',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter custom amount"
                    placeholderTextColor="rgba(107, 114, 128, 0.5)"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Dedication (Optional)
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
                    value={dedication}
                    onChangeText={setDedication}
                    placeholder="e.g., In memory of..."
                    placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  />
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                >
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: isAnonymous ? '#0B342B' : 'rgba(11, 52, 43, 0.12)',
                    backgroundColor: isAnonymous ? '#0B342B' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isAnonymous && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Donate anonymously</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: (!selectedCampaign || !amount || processing) ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleDonate}
                  disabled={!selectedCampaign || !amount || processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Give Sadaqa</Text>
                  )}
                </TouchableOpacity>

                <Text style={{ color: '#6B7280', fontSize: 9, textAlign: 'center', marginTop: 8 }}>
                  100% reaches beneficiaries · No platform fee
                </Text>
              </View>

              {/* Impact Stats */}
              <View style={{
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
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700', marginBottom: 10 }}>Your Impact</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Total Given', value: formatCurrency(summary.totalAmount || 0) },
                    { label: 'Donations', value: summary.totalDonations || 0 },
                    { label: 'Categories', value: summary.categoriesSupported || 0, color: '#3FAF73' },
                    { label: 'Causes', value: summary.uniqueCampaigns || 0 },
                  ].map((item, index) => (
                    <View key={index} style={{
                      flex: 1,
                      minWidth: 70,
                      backgroundColor: '#FAFAF7',
                      borderRadius: 8,
                      padding: 8,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(11, 52, 43, 0.06)',
                    }}>
                      <Text style={{
                        color: item.color || '#0B342B',
                        fontSize: 15,
                        fontWeight: '700',
                      }}>
                        {item.value}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 10 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recent Donations */}
              <View style={{
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
                  <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>Recent Donations</Text>
                  <TouchableOpacity onPress={fetchDonationHistory}>
                    <Text style={{ color: '#6B7280', fontSize: 10 }}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                {loadingHistory ? (
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <ActivityIndicator size="small" color="#C9A44B" />
                  </View>
                ) : donationHistory.length === 0 ? (
                  <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
                    No donations yet
                  </Text>
                ) : (
                  donationHistory.slice(0, 5).map((donation) => {
                    const badge = getStatusBadge(donation.status);
                    return (
                      <View key={donation.id} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F4F5F1',
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '500' }} numberOfLines={1}>
                            {donation.campaign_name || 'Donation'}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 10 }}>{formatDate(donation.paid_at || donation.createdat)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '700' }}>{formatCurrency(donation.amount)}</Text>
                          <View style={{
                            backgroundColor: badge.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.05)',
                          }}>
                            <Text style={{ color: badge.text, fontSize: 10, fontWeight: '500' }}>{getStatusLabel(donation.status)}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
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
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Confirm Sadaqa</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.06)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 10 }}>Amount</Text>
                <Text style={{ color: '#0B342B', fontSize: 22, fontWeight: '700' }}>{formatCurrency(parseFloat(amount) || 0)}</Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Cause</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{selectedCampaign?.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Organization</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{selectedCampaign?.organization}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Type</Text>
                  <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '600' }}>Sadaqah Jariyah</Text>
                </View>
                {dedication && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(11, 52, 43, 0.06)' }}>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>Dedication</Text>
                    <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{dedication}</Text>
                  </View>
                )}
                {isAnonymous && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>Anonymous</Text>
                    <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>Yes</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(11, 52, 43, 0.06)' }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Balance After</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatCurrency(balance - parseFloat(amount))}</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.05)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.1)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#0B342B', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
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
                  onPress={confirmDonation}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Confirm Donation</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={showReceiptModal} transparent animationType="fade">
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
              <Text style={{ color: '#F7F6F1', fontSize: 18, fontWeight: '700' }}>Donation Successful</Text>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
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
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>You donated to</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>{receiptData?.cause}</Text>
                <Text style={{ color: '#0B342B', fontSize: 24, fontWeight: '700' }}>{formatCurrency(receiptData?.amount || 0)}</Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Reference</Text>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {receiptData?.id}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Date</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatDate(receiptData?.date)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Type</Text>
                  <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '600' }}>Sadaqah Jariyah</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Organization</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{receiptData?.organization || 'N/A'}</Text>
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
                <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 18, fontStyle: 'italic' }}>
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </Text>
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
                  onPress={() => setShowReceiptModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
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
                  onPress={() => {
                    setShowReceiptModal(false);
                    navigation.navigate('Sadaqa' as never);
                  }}
                >
                  <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Done</Text>
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

export default Sadaqa;