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
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { zakatService, walletService } from '../../api/client';
import PinModal from '../../components/common/PinModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');

// ===== SVG ICONS =====
const BackIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const ShieldIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="M9 12l2 2 4-4" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3FAF73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <Path d="M22 4L12 14.01l-3-3" />
  </Svg>
);

const CloseIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

const SendIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
);

const CloseModalIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

const ChevronDownIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const ChevronUpIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 15l-6-6-6 6" />
  </Svg>
);

const Zakat = () => {
  const navigation = useNavigation();

  // ===== LOADING STATE =====
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const [showRecentPayments, setShowRecentPayments] = useState(false);

  // ===== PIN MODAL STATE =====
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

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
    fetchAllData();
  }, []);

  useEffect(() => {
    calculateZakat();
  }, [cash, gold, silver, business, investments, receivables, liabilities, nisabType]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRecipients(),
        fetchZakatHistory(),
        fetchSummary(),
      ]);
    } catch (error) {
      console.log('Error fetching data:', error);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
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
    fetchAllData();
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

  // ===== HANDLE PAY ZAKAT WITH PIN =====
  const handlePayZakat = () => {
    if (calculation.zakatDue <= 0) {
      setError('No Zakat due. Please check your calculations.');
      return;
    }
    setSelectedRecipient('');
    setSelectedCategory('all');
    setNotes('');
    setShowConfirmModal(true);
  };

  const confirmPayment = () => {
    if (!selectedRecipient) {
      setError('Please select a recipient for your Zakat.');
      return;
    }
    setShowConfirmModal(false);
    setShowPinModal(true);
    setPinError('');
  };

  const handlePinVerify = async (pin: string) => {
    setPinLoading(true);
    setPinError('');

    try {
      const response = await zakatService.payZakat({
        amount: calculation.zakatDue,
        recipientId: selectedRecipient,
        category: selectedCategory !== 'all' ? selectedCategory : 'general',
        notes: notes,
        pin: pin,
      });

      if (response.data.success) {
        setSuccess(`Zakat of KES ${calculation.zakatDue.toLocaleString()} paid successfully!`);
        setShowPinModal(false);
        await fetchAllData();
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
      completed: { bg: 'rgba(63, 175, 115, 0.08)', text: '#3FAF73' },
      pending: { bg: 'rgba(217, 119, 6, 0.08)', text: '#D97706' },
      failed: { bg: 'rgba(220, 38, 38, 0.08)', text: '#DC2626' },
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

  // ===== LOADING STATE =====
  if (loading) {
    return <LoadingSpinner message="Loading Zakat data..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <StatusBar barStyle="light-content" backgroundColor="#032A24" translucent={false} />
      
      {/* ===== HEADER ===== */}
      <View style={{
        backgroundColor: '#032A24',
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(201, 164, 75, 0.08)',
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          maxWidth: 600, 
          width: '100%', 
          alignSelf: 'center',
        }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={{ padding: 4, marginRight: 12 }}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={{ 
            color: '#FFFFFF', 
            fontSize: 16, 
            fontWeight: '600',
            letterSpacing: -0.2,
          }}>
            Zakat
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
          }}>
            <Text style={{ color: '#C9A44B', fontSize: 7, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' }}>
              Third Pillar
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ 
          paddingTop: 0, 
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center', paddingHorizontal: 16 }}>
          
          {/* ===== HERO CARD ===== */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginTop: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: -80, right: -80, width: 160, height: 160, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -60, left: -60, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(201, 164, 75, 0.1)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                  marginBottom: 8,
                  gap: 6,
                }}>
                  <ShieldIcon />
                  <Text style={{ color: '#C9A44B', fontSize: 8, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Third Pillar of Islam
                  </Text>
                </View>

                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                  Calculate & Pay Your Zakat
                </Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 13, marginTop: 4, maxWidth: 400, lineHeight: 20 }}>
                  Fulfill your Zakat obligation with confidence. Calculate accurately and distribute through verified institutions.
                </Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.1)',
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '500' }}>1446 AH</Text>
              </View>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 12, flex: 1 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8 }}
                onPress={() => setError('')}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Success */}
          {success ? (
            <View style={{
              backgroundColor: '#0B342B',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.15)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <CheckIcon />
                <Text style={{ color: '#F7F6F1', fontSize: 13, fontWeight: '500', flex: 1 }}>{success}</Text>
              </View>
              <TouchableOpacity onPress={() => setSuccess('')}>
                <CloseIcon />
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
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Zakat Calculator</Text>
                  <View style={{
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.08)',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: '#FAFAF7',
                  }}>
                    <TextInput
                      style={{ color: '#032A24', fontSize: 10, padding: 0, minWidth: 50 }}
                      value={nisabType}
                      onChangeText={(text) => setNisabType(text)}
                      placeholder="silver"
                      placeholderTextColor="rgba(107, 114, 128, 0.5)"
                    />
                  </View>
                </View>

                {/* Presets */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500', alignSelf: 'center' }}>Quick presets:</Text>
                  {presets.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        backgroundColor: '#FAFAF7',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                      }}
                      onPress={() => applyPreset(preset)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500' }}>{preset.label}</Text>
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
                      <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        {field.label}
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          color: '#032A24',
                          fontSize: 13,
                        }}
                        value={field.value}
                        onChangeText={handleFieldChange(field.setter)}
                        placeholder="0"
                        placeholderTextColor="rgba(107, 114, 128, 0.4)"
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
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11 }}>Total Assets</Text>
                    <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>{formatCurrency(totalAssets)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11 }}>Total Liabilities</Text>
                    <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>{formatCurrency(totalLiabilities)}</Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(3, 42, 36, 0.06)', paddingTop: 6, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '600' }}>Net Zakatable Assets</Text>
                      <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '700' }}>{formatCurrency(calculation.netAssets || 0)}</Text>
                    </View>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(3, 42, 36, 0.06)', paddingTop: 8, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Zakat Due (2.5%)</Text>
                      <Text style={{ color: '#032A24', fontSize: 20, fontWeight: '700' }}>{formatCurrency(calculation.zakatDue || 0)}</Text>
                    </View>
                    <View style={{
                      backgroundColor: calculation.isObligatory ? 'rgba(63, 175, 115, 0.08)' : 'rgba(201, 164, 75, 0.08)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: calculation.isObligatory ? 'rgba(63, 175, 115, 0.1)' : 'rgba(201, 164, 75, 0.1)',
                    }}>
                      <Text style={{
                        color: calculation.isObligatory ? '#3FAF73' : '#C9A44B',
                        fontSize: 9,
                        fontWeight: '600',
                      }}>
                        {calculation.isObligatory ? 'Nisab Exceeded' : 'Below Nisab'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#032A24',
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginTop: 14,
                    alignItems: 'center',
                    opacity: calculation.zakatDue <= 0 || processing ? 0.6 : 1,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={handlePayZakat}
                  disabled={calculation.zakatDue <= 0 || processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </>
                  ) : (
                    <>
                      <SendIcon />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                        Pay Zakat ({formatCurrency(calculation.zakatDue || 0)})
                      </Text>
                    </>
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
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Your Zakat Summary</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Total Payments', value: summary.totalPayments || 0 },
                    { label: 'Total Given', value: formatCurrency(summary.totalAmount || 0) },
                    { label: 'Recipients', value: summary.uniqueRecipients || 0 },
                  ].map((item, index) => (
                    <View key={index} style={{
                      flex: 1,
                      minWidth: 70,
                      backgroundColor: '#FAFAF7',
                      borderRadius: 8,
                      padding: 10,
                      alignItems: 'center',
                    }}>
                      <Text style={{
                        color: '#032A24',
                        fontSize: 15,
                        fontWeight: '700',
                      }}>
                        {item.value}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 9 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recent Payments - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onPress={() => setShowRecentPayments(!showRecentPayments)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>Recent Payments</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10 }}>
                      {showRecentPayments ? 'Hide' : 'Show'}
                    </Text>
                    {showRecentPayments ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </View>
                </TouchableOpacity>

                {showRecentPayments && (
                  <View style={{ marginTop: 10 }}>
                    {loadingHistory ? (
                      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <ActivityIndicator size="small" color="#C9A44B" />
                      </View>
                    ) : zakatHistory.length === 0 ? (
                      <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
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
                            borderBottomColor: 'rgba(3, 42, 36, 0.03)',
                          }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '500' }} numberOfLines={1}>
                                {item.recipient_name || 'Zakat'}
                              </Text>
                              <Text style={{ color: '#9CA3AF', fontSize: 9 }}>{formatDate(item.paid_at || item.createdat)}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '700' }}>{formatCurrency(item.amount)}</Text>
                              <View style={{
                                backgroundColor: badge.bg,
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                borderRadius: 8,
                              }}>
                                <Text style={{ color: badge.text, fontSize: 8, fontWeight: '500' }}>{getStatusLabel(item.status)}</Text>
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

      {/* ===== CONFIRMATION MODAL ===== */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90%',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700' }}>Confirm Zakat Payment</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} activeOpacity={0.7}>
                <CloseModalIcon />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.04)',
                borderRadius: 10,
                padding: 14,
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</Text>
                <Text style={{ color: '#032A24', fontSize: 24, fontWeight: '700' }}>{formatCurrency(calculation.zakatDue || 0)}</Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
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
                        backgroundColor: selectedCategory === cat.id ? '#032A24' : '#FAFAF7',
                        borderWidth: 1,
                        borderColor: selectedCategory === cat.id ? '#032A24' : 'rgba(3, 42, 36, 0.06)',
                      }}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        color: selectedCategory === cat.id ? '#FFFFFF' : '#6B7280',
                        fontSize: 9,
                        fontWeight: selectedCategory === cat.id ? '600' : '500',
                      }}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Select Recipient Organization
                </Text>

                {loadingRecipients ? (
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <ActivityIndicator size="small" color="#C9A44B" />
                  </View>
                ) : filteredRecipients.length === 0 ? (
                  <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
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
                        borderColor: selectedRecipient === recipient.id ? '#032A24' : 'rgba(3, 42, 36, 0.06)',
                        backgroundColor: selectedRecipient === recipient.id ? 'rgba(3, 42, 36, 0.02)' : 'transparent',
                        marginBottom: 6,
                      }}
                      onPress={() => setSelectedRecipient(recipient.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>{recipient.name}</Text>
                            <View style={{
                              backgroundColor: 'rgba(63, 175, 115, 0.06)',
                              paddingHorizontal: 4,
                              paddingVertical: 1,
                              borderRadius: 4,
                            }}>
                              <Text style={{ color: '#3FAF73', fontSize: 8, fontWeight: '500' }}>Verified</Text>
                            </View>
                          </View>
                          <Text style={{ color: '#6B7280', fontSize: 10 }} numberOfLines={1}>
                            {recipient.description || 'Organization'}
                          </Text>
                          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>{recipient.location || 'N/A'}</Text>
                        </View>
                        {selectedRecipient === recipient.id && (
                          <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700' }}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Notes (Optional)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#032A24',
                    fontSize: 13,
                    minHeight: 50,
                    textAlignVertical: 'top',
                  }}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes..."
                  placeholderTextColor="rgba(107, 114, 128, 0.4)"
                  multiline
                />
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.04)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#032A24', fontSize: 11, textAlign: 'center', lineHeight: 18 }}>
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#FAFAF7',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
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
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: processing || !selectedRecipient ? 0.6 : 1,
                  }}
                  onPress={confirmPayment}
                  disabled={processing || !selectedRecipient}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Confirm Payment</Text>
                  )}
                </TouchableOpacity>
              </View>
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
        title="Confirm Zakat Payment"
        subtitle="Enter your 4-digit PIN to confirm this Zakat payment"
        amount={calculation.zakatDue || 0}
        recipient={selectedRecipient ? recipients.find(r => r.id === selectedRecipient)?.name : ''}
        transactionType="zakat"
      />
    </SafeAreaView>
  );
};

export default Zakat;