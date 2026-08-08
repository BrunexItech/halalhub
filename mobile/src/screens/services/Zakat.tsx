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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { zakatService, walletService } from '../../api/client';

const Zakat = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [balance, setBalance] = useState(0);
  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [business, setBusiness] = useState('');
  const [investments, setInvestments] = useState('');
  const [receivables, setReceivables] = useState('');
  const [liabilities, setLiabilities] = useState('');
  const [nisabType, setNisabType] = useState('silver');

  const [calculation, setCalculation] = useState({
    totalAssets: 0,
    liabilities: 0,
    netAssets: 0,
    nisabThreshold: 0,
    zakatDue: 0,
    isObligatory: false,
  });

  const [zakatHistory, setZakatHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalAmount: 0,
    uniqueRecipients: 0,
  });

  const [recipients, setRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notes, setNotes] = useState('');

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'mosque', label: 'Mosques & Institutions' },
    { id: 'orphan', label: 'Orphan Support' },
    { id: 'needy', label: 'Needy Families' },
    { id: 'debt', label: 'Debt Relief' },
    { id: 'emergency', label: 'Emergency Relief' },
    { id: 'education', label: 'Education' },
    { id: 'health', label: 'Health & Medical' },
  ];

  const presets = [
    { label: 'Salaried Professional', values: { cash: 300000, gold: 50000, silver: 10000, business: 0, investments: 20000, receivables: 0, liabilities: 50000 } },
    { label: 'Small Business Owner', values: { cash: 150000, gold: 80000, silver: 15000, business: 300000, investments: 30000, receivables: 50000, liabilities: 120000 } },
    { label: 'Investor', values: { cash: 600000, gold: 200000, silver: 30000, business: 0, investments: 500000, receivables: 0, liabilities: 150000 } },
    { label: 'Retiree', values: { cash: 800000, gold: 100000, silver: 20000, business: 0, investments: 100000, receivables: 0, liabilities: 50000 } },
  ];

  useEffect(() => {
    fetchBalance();
    fetchRecipients();
    fetchZakatHistory();
    fetchSummary();
  }, []);

  useEffect(() => {
    calculateZakat();
  }, [cash, gold, silver, business, investments, receivables, liabilities, nisabType]);

  const fetchBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.log('Failed to fetch balance:', err);
    }
  };

  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const res = await zakatService.getRecipients();
      if (res.data.success) {
        setRecipients(res.data.recipients || []);
      }
    } catch (err) {
      console.log('Failed to fetch recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchZakatHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await zakatService.getHistory();
      if (res.data.success) {
        setZakatHistory(res.data.history || []);
      }
    } catch (err) {
      console.log('Failed to fetch zakat history:', err);
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await zakatService.getSummary();
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.log('Failed to fetch summary:', err);
    }
  };

  const calculateZakat = async () => {
    try {
      const res = await zakatService.calculate({
        cash: parseFloat(cash) || 0,
        gold: parseFloat(gold) || 0,
        silver: parseFloat(silver) || 0,
        business: parseFloat(business) || 0,
        investments: parseFloat(investments) || 0,
        receivables: parseFloat(receivables) || 0,
        liabilities: parseFloat(liabilities) || 0,
        nisabType: nisabType,
      });

      if (res.data.success) {
        setCalculation(res.data.data);
      }
    } catch (err) {
      console.log('Calculation error:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBalance();
    fetchRecipients();
    fetchZakatHistory();
    fetchSummary();
  };

  const handleFieldChange = (setter: any) => (text: string) => {
    setter(text === '' ? '' : text);
  };

  const applyPreset = (preset: any) => {
    setCash(String(preset.values.cash));
    setGold(String(preset.values.gold));
    setSilver(String(preset.values.silver));
    setBusiness(String(preset.values.business));
    setInvestments(String(preset.values.investments));
    setReceivables(String(preset.values.receivables || 0));
    setLiabilities(String(preset.values.liabilities));
  };

  const handlePayZakat = () => {
    if (calculation.zakatDue <= 0) {
      setError('No Zakat due. Please check your calculations.');
      return;
    }
    if (balance < calculation.zakatDue) {
      setError(`Insufficient balance. Available: KES ${balance.toLocaleString()}`);
      return;
    }
    setSelectedRecipient('');
    setSelectedCategory('all');
    setNotes('');
    setShowConfirmModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedRecipient) {
      setError('Please select a recipient for your Zakat.');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const response = await zakatService.payZakat({
        amount: calculation.zakatDue,
        recipientId: selectedRecipient,
        category: selectedCategory !== 'all' ? selectedCategory : 'general',
        notes: notes,
      });

      if (response.data.success) {
        setSuccess(`Zakat of KES ${calculation.zakatDue.toLocaleString()} paid successfully!`);
        setShowConfirmModal(false);
        await fetchBalance();
        await fetchZakatHistory();
        await fetchSummary();
        await fetchRecipients();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
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

  const totalAssets = (parseFloat(cash) || 0) + (parseFloat(gold) || 0) + (parseFloat(silver) || 0) +
    (parseFloat(business) || 0) + (parseFloat(investments) || 0) + (parseFloat(receivables) || 0);
  const totalLiabilities = parseFloat(liabilities) || 0;

  const filteredRecipients = selectedCategory === 'all'
    ? recipients
    : recipients.filter((r) => r.category === selectedCategory);

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Zakat
                  </Text>
                  <View style={{ width: 1, height: 12, backgroundColor: 'rgba(201, 164, 75, 0.2)' }} />
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '500' }}>Third Pillar of Islam</Text>
                </View>
                <Text style={{ color: '#F7F6F1', fontSize: 22, fontWeight: '700' }}>Calculate & Pay Your Zakat</Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 4, maxWidth: 400 }}>
                  Fulfill your Zakat obligation with confidence. Calculate accurately and distribute through verified institutions.
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
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600' }}>1446 AH</Text>
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
            {/* Calculator */}
            <View style={{ flex: 2, minWidth: 300 }}>
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.08)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Zakat Calculator</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{
                      backgroundColor: 'rgba(11, 52, 43, 0.1)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}>
                      <Text style={{ color: '#0B342B', fontSize: 10, fontWeight: '600' }}>1446 AH</Text>
                    </View>
                    <View style={{
                      borderWidth: 1,
                      borderColor: 'rgba(11, 52, 43, 0.12)',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: '#FFFFFF',
                    }}>
                      <TextInput
                        style={{ color: '#1F2937', fontSize: 10, padding: 0 }}
                        value={nisabType}
                        onChangeText={(text) => setNisabType(text)}
                        placeholder="silver"
                      />
                    </View>
                  </View>
                </View>

                {/* Presets */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500', alignSelf: 'center' }}>Quick presets:</Text>
                  {presets.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        backgroundColor: '#F3F4F6',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}
                      onPress={() => applyPreset(preset)}
                    >
                      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500' }}>{preset.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Form Fields */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    { label: 'Cash & Savings', value: cash, setter: setCash, key: 'cash' },
                    { label: 'Gold Value', value: gold, setter: setGold, key: 'gold' },
                    { label: 'Silver Value', value: silver, setter: setSilver, key: 'silver' },
                    { label: 'Business Assets', value: business, setter: setBusiness, key: 'business' },
                    { label: 'Investments', value: investments, setter: setInvestments, key: 'investments' },
                    { label: 'Receivables', value: receivables, setter: setReceivables, key: 'receivables' },
                    { label: 'Liabilities', value: liabilities, setter: setLiabilities, key: 'liabilities' },
                  ].map((field) => (
                    <View key={field.key} style={{ flex: 1, minWidth: 140 }}>
                      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        {field.label}
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
                        value={field.value}
                        onChangeText={handleFieldChange(field.setter)}
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>

                {/* Result */}
                <View style={{
                  marginTop: 14,
                  padding: 14,
                  backgroundColor: '#FAFAF7',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(11, 52, 43, 0.06)',
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>Total Assets</Text>
                    <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatCurrency(totalAssets)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>Total Liabilities</Text>
                    <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatCurrency(totalLiabilities)}</Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(11, 52, 43, 0.08)', paddingTop: 6, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>Net Zakatable Assets</Text>
                      <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '700' }}>{formatCurrency(calculation.netAssets || 0)}</Text>
                    </View>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(11, 52, 43, 0.08)', paddingTop: 8, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 10 }}>Zakat Due (2.5%)</Text>
                      <Text style={{ color: '#0B342B', fontSize: 20, fontWeight: '700' }}>{formatCurrency(calculation.zakatDue || 0)}</Text>
                    </View>
                    <View style={{
                      backgroundColor: calculation.isObligatory ? 'rgba(63, 175, 115, 0.1)' : 'rgba(201, 164, 75, 0.1)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: calculation.isObligatory ? 'rgba(63, 175, 115, 0.2)' : 'rgba(201, 164, 75, 0.2)',
                    }}>
                      <Text style={{
                        color: calculation.isObligatory ? '#3FAF73' : '#C9A44B',
                        fontSize: 10,
                        fontWeight: '600',
                      }}>
                        {calculation.isObligatory ? 'Nisab Exceeded' : 'Below Nisab'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#0B342B',
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginTop: 14,
                    alignItems: 'center',
                    opacity: calculation.zakatDue <= 0 || processing ? 0.6 : 1,
                  }}
                  onPress={handlePayZakat}
                  disabled={calculation.zakatDue <= 0 || processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>
                      Pay Zakat ({formatCurrency(calculation.zakatDue || 0)})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sidebar */}
            <View style={{ flex: 1, minWidth: 200, gap: 12 }}>
              {/* Summary Card */}
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
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700', marginBottom: 10 }}>Your Zakat Summary</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Total Payments', value: summary.totalPayments || 0 },
                    { label: 'Total Given', value: formatCurrency(summary.totalAmount || 0) },
                    { label: 'Recipients', value: summary.uniqueRecipients || 0 },
                    { label: 'Wallet Balance', value: formatCurrency(balance), color: '#3FAF73' },
                  ].map((item, index) => (
                    <View key={index} style={{
                      flex: 1,
                      minWidth: 80,
                      backgroundColor: '#FAFAF7',
                      borderRadius: 8,
                      padding: 10,
                      alignItems: 'center',
                    }}>
                      <Text style={{
                        color: item.color || '#0B342B',
                        fontSize: 16,
                        fontWeight: '700',
                      }}>
                        {item.value}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 10 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recent Payments */}
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
                  <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>Recent Payments</Text>
                  <TouchableOpacity onPress={fetchZakatHistory}>
                    <Text style={{ color: '#6B7280', fontSize: 10 }}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                {loadingHistory ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color="#C9A44B" />
                  </View>
                ) : zakatHistory.length === 0 ? (
                  <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
                    No Zakat payments yet
                  </Text>
                ) : (
                  zakatHistory.slice(0, 5).map((item) => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <View key={item.id} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F4F5F1',
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '500' }} numberOfLines={1}>
                            {item.recipient_name || 'Zakat'}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 10 }}>{formatDate(item.paid_at || item.createdat)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '700' }}>{formatCurrency(item.amount)}</Text>
                          <View style={{
                            backgroundColor: badge.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.05)',
                          }}>
                            <Text style={{ color: badge.text, fontSize: 10, fontWeight: '500' }}>{getStatusLabel(item.status)}</Text>
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
            maxWidth: 500,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Confirm Zakat Payment</Text>
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
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 10 }}>Amount</Text>
                <Text style={{ color: '#0B342B', fontSize: 24, fontWeight: '700' }}>{formatCurrency(calculation.zakatDue || 0)}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Wallet Balance</Text>
                  <Text style={{
                    color: balance >= calculation.zakatDue ? '#3FAF73' : '#DC2626',
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Balance After</Text>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>{formatCurrency(balance - calculation.zakatDue)}</Text>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Select Recipient Category
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: selectedCategory === cat.id ? '#0B342B' : '#F3F4F6',
                      }}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={{
                        color: selectedCategory === cat.id ? '#F7F6F1' : '#6B7280',
                        fontSize: 10,
                        fontWeight: selectedCategory === cat.id ? '600' : '500',
                      }}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Select Recipient Organization
                </Text>

                {loadingRecipients ? (
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <ActivityIndicator size="small" color="#C9A44B" />
                  </View>
                ) : filteredRecipients.length === 0 ? (
                  <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
                    No recipients available in this category
                  </Text>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <TouchableOpacity
                      key={recipient.id}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: selectedRecipient === recipient.id ? '#0B342B' : 'rgba(11, 52, 43, 0.08)',
                        backgroundColor: selectedRecipient === recipient.id ? '#FAFAF7' : 'transparent',
                        marginBottom: 6,
                      }}
                      onPress={() => setSelectedRecipient(recipient.id)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>{recipient.name}</Text>
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
                          <Text style={{ color: '#6B7280', fontSize: 11 }} numberOfLines={1}>
                            {recipient.description || 'Organization'}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>{recipient.location || 'N/A'}</Text>
                        </View>
                        {selectedRecipient === recipient.id && (
                          <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Notes (Optional)
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
                    minHeight: 50,
                    textAlignVertical: 'top',
                  }}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes..."
                  multiline
                />
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.05)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.1)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#0B342B', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
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
                    opacity: processing || !selectedRecipient ? 0.6 : 1,
                  }}
                  onPress={confirmPayment}
                  disabled={processing || !selectedRecipient}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '600' }}>Confirm Payment</Text>
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

export default Zakat;