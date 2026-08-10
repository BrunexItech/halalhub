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
  StatusBar,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { utilityService, walletService } from '../../api/client';

const { width: screenWidth } = Dimensions.get('window');

const Utilities = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [balance, setBalance] = useState(0);
  const [accountNumber, setAccountNumber] = useState('');
  const [utilities, setUtilities] = useState<any[]>([]);
  const [selectedUtility, setSelectedUtility] = useState<any>(null);
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savedServices, setSavedServices] = useState<any[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ nickname: '', accountNumber: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // Premium SVG Icons - Using proper SVG elements
  const BackIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );

  const WalletIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="M2 10h20" />
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

  const LightningIcon = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );

  const PlusIcon = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#032A24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 4v16M4 12h16" />
    </Svg>
  );

  const XIcon = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );

  const CloseModalIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBalance(),
        fetchUtilities(),
        fetchPaymentHistory(),
        fetchSavedServices(),
      ]);
    } catch (error) {
      console.log('Error fetching data:', error);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const fetchBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
      setAccountNumber(res.data.accountNumber || '');
    } catch (err) {
      console.log('Failed to fetch balance:', err);
    }
  };

  const fetchUtilities = async () => {
    try {
      const res = await utilityService.getUtilities();
      const utilitiesData = res.data.utilities || [];
      setUtilities(utilitiesData);
      if (utilitiesData.length > 0) {
        setSelectedUtility(utilitiesData[0]);
      }
    } catch (err) {
      console.log('Failed to load utilities:', err);
      setError('Failed to load utility providers. Please refresh.');
    }
  };

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await utilityService.getPaymentHistory();
      setPaymentHistory(res.data.history || []);
    } catch (err) {
      console.log('Failed to load payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSavedServices = async () => {
    try {
      const res = await utilityService.getSavedServices();
      setSavedServices(res.data.savedServices || []);
    } catch (err) {
      console.log('Failed to load saved services:', err);
    }
  };

  const handlePayment = () => {
    setValidationError('');

    if (!selectedUtility) {
      setValidationError('Please select a utility provider');
      return;
    }
    if (!accountNumberInput || accountNumberInput.length < 3) {
      setValidationError('Please enter a valid account number');
      return;
    }
    if (!amount || parseFloat(amount) < 10) {
      setValidationError('Please enter a valid amount (minimum KES 10)');
      return;
    }
    if (parseFloat(amount) > balance) {
      setValidationError(`Insufficient balance. Available: ${formatCurrency(balance)}`);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await utilityService.payBill({
        providerId: selectedUtility.id,
        accountNumber: accountNumberInput,
        amount: parseFloat(amount),
        paymentMethod: 'wallet',
      });

      if (response.data.success) {
        const data = response.data.data;
        setPaymentStatus({
          utility: selectedUtility.name,
          account: accountNumberInput,
          amount: parseFloat(amount),
          paybill: selectedUtility.paybill,
          date: new Date().toLocaleString(),
          ref: data.transactionRef,
          status: 'completed',
          receipt: data.receiptNumber,
          balance: data.balance,
          accountNumber: data.accountNumber,
        });

        setBalance(data.balance || 0);
        setShowConfirmModal(false);
        setShowReceiptModal(true);
        await fetchPaymentHistory();
        await fetchSavedServices();

        setSuccess(`Payment of KES ${parseFloat(amount).toLocaleString()} to ${selectedUtility.name} successful`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      console.log('Payment error:', err);
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const closeReceipt = () => {
    setShowReceiptModal(false);
    setPaymentStatus(null);
    setSelectedUtility(utilities[0] || null);
    setAccountNumberInput('');
    setAmount('');
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSavedServiceClick = (service: any) => {
    const utility = utilities.find((u) => u.id === service.provider_id);
    if (utility) {
      setSelectedUtility(utility);
      setAccountNumberInput(service.account_number);
    }
  };

  const handleAddService = async () => {
    if (!newService.nickname || !newService.accountNumber || !selectedUtility) {
      setValidationError('Please fill in all fields');
      return;
    }

    try {
      const response = await utilityService.addFavorite({
        providerId: selectedUtility.id,
        nickname: newService.nickname,
        accountNumber: newService.accountNumber,
      });

      if (response.data.success) {
        await fetchSavedServices();
        setShowAddService(false);
        setNewService({ nickname: '', accountNumber: '' });
        setSuccess('Service saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save service');
    }
  };

  const removeSavedService = async (id: string) => {
    try {
      await utilityService.removeFavorite(id);
      setSavedServices(savedServices.filter((s) => s.id !== id));
      setSuccess('Service removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove service');
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
      completed: { bg: 'rgba(63, 175, 115, 0.08)', text: '#3FAF73' },
      pending: { bg: 'rgba(217, 119, 6, 0.08)', text: '#D97706' },
      failed: { bg: 'rgba(220, 38, 38, 0.08)', text: '#DC2626' },
      processing: { bg: 'rgba(59, 130, 246, 0.08)', text: '#3B82F6' },
    };
    const labels: Record<string, string> = {
      completed: 'Completed',
      pending: 'Pending',
      failed: 'Failed',
      processing: 'Processing',
    };
    return { style: styles[status] || styles.completed, label: labels[status] || status };
  };

  const getUtilityIcon = (category: string) => {
    const icons: Record<string, string> = {
      electricity: '⚡',
      water: '💧',
      internet: '📶',
      tv: '📺',
      government: '🏛️',
    };
    return icons[category] || '⚡';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <StatusBar barStyle="light-content" backgroundColor="#032A24" translucent={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Loading utility providers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <StatusBar barStyle="light-content" backgroundColor="#032A24" translucent={false} />
      
      {/* ===== EMERALD HEADER ===== */}
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
            Utilities
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
              Pay Bills
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
                  <LightningIcon />
                  <Text style={{ color: '#C9A44B', fontSize: 8, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Utility Payments
                  </Text>
                </View>

                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                  Manage Your Utilities
                </Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 13, marginTop: 4, maxWidth: 400, lineHeight: 20 }}>
                  Pay electricity, water, internet, TV, and county rates from your wallet.
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.1)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <WalletIcon />
                  <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '600' }}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
                {accountNumber ? (
                  <Text style={{ color: 'rgba(183, 192, 186, 0.4)', fontSize: 9, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    Acc: {accountNumber}
                  </Text>
                ) : null}
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
            {/* Payment Form */}
            <View style={{ flex: 2, minWidth: 300, gap: 12 }}>
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
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Pay a Utility</Text>
                  <TouchableOpacity 
                    onPress={() => setShowAddService(!showAddService)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <PlusIcon />
                    <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>
                      {showAddService ? 'Cancel' : 'Save Service'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showAddService && (
                  <View style={{
                    backgroundColor: '#FAFAF7',
                    padding: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                    marginBottom: 12,
                  }}>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Save a Service</Text>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        Nickname
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          color: '#032A24',
                          fontSize: 13,
                        }}
                        value={newService.nickname}
                        onChangeText={(text) => setNewService({ ...newService, nickname: text })}
                        placeholder="e.g., Home Electricity"
                        placeholderTextColor="rgba(107, 114, 128, 0.4)"
                      />
                    </View>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        Account / Meter Number
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          color: '#032A24',
                          fontSize: 13,
                        }}
                        value={newService.accountNumber}
                        onChangeText={(text) => setNewService({ ...newService, accountNumber: text })}
                        placeholder="Enter account number"
                        placeholderTextColor="rgba(107, 114, 128, 0.4)"
                      />
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#032A24',
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                      onPress={handleAddService}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Save Service</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Select Utility
                  </Text>
                  <View style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}>
                    <TextInput
                      style={{ color: '#032A24', fontSize: 13, padding: 0 }}
                      value={selectedUtility?.name || ''}
                      onChangeText={(text) => {
                        const utility = utilities.find((u) => u.name === text);
                        setSelectedUtility(utility);
                        setValidationError('');
                      }}
                      placeholder="Choose a utility..."
                      placeholderTextColor="rgba(107, 114, 128, 0.4)"
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    {selectedUtility?.fields?.[0] || 'Account Number'}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#032A24',
                      fontSize: 13,
                    }}
                    value={accountNumberInput}
                    onChangeText={(text) => {
                      setAccountNumberInput(text);
                      setValidationError('');
                    }}
                    placeholder={`Enter ${selectedUtility?.fields?.[0]?.toLowerCase() || 'account number'}`}
                    placeholderTextColor="rgba(107, 114, 128, 0.4)"
                  />
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Amount (KES)
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {quickAmounts.map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: parseFloat(amount) === val ? '#032A24' : '#FAFAF7',
                          borderWidth: 1,
                          borderColor: parseFloat(amount) === val ? '#032A24' : 'rgba(3, 42, 36, 0.04)',
                        }}
                        onPress={() => handleQuickAmount(val)}
                        activeOpacity={0.7}
                      >
                        <Text style={{
                          color: parseFloat(amount) === val ? '#FFFFFF' : '#6B7280',
                          fontSize: 9,
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
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#032A24',
                      fontSize: 13,
                    }}
                    value={amount}
                    onChangeText={(text) => {
                      setAmount(text);
                      setValidationError('');
                    }}
                    placeholder="Enter custom amount"
                    placeholderTextColor="rgba(107, 114, 128, 0.4)"
                    keyboardType="numeric"
                  />
                </View>

                {validationError ? (
                  <View style={{
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 10,
                  }}>
                    <Text style={{ color: '#DC2626', fontSize: 12 }}>{validationError}</Text>
                  </View>
                ) : null}

                {selectedUtility && accountNumberInput && amount ? (
                  <View style={{
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                    marginBottom: 12,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Paybill</Text>
                      <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>{selectedUtility.paybill}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Account</Text>
                      <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>{accountNumberInput}</Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 4,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(3, 42, 36, 0.04)',
                      marginTop: 4,
                    }}>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>Total</Text>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>{formatCurrency(parseFloat(amount) || 0)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Wallet Balance</Text>
                      <Text style={{
                        color: parseFloat(amount) > balance ? '#DC2626' : '#3FAF73',
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                        {formatCurrency(balance)}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={{
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: (processing || !amount || parseFloat(amount) > balance) ? 0.6 : 1,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={handlePayment}
                  disabled={processing || !amount || parseFloat(amount) > balance}
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
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Pay from Wallet</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Utility Providers Grid */}
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
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600', marginBottom: 10 }}>All Utility Providers</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {utilities.map((utility) => {
                    const bgColor = utility.color || '#032A24';
                    const isSelected = selectedUtility?.id === utility.id;
                    return (
                      <TouchableOpacity
                        key={utility.id}
                        style={{
                          flex: 1,
                          minWidth: 70,
                          padding: 10,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: isSelected ? '#032A24' : 'rgba(3, 42, 36, 0.04)',
                          backgroundColor: isSelected ? 'rgba(3, 42, 36, 0.02)' : '#FFFFFF',
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          setSelectedUtility(utility);
                          setValidationError('');
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: bgColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>{getUtilityIcon(utility.category)}</Text>
                        </View>
                        <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '500', marginTop: 4 }} numberOfLines={1}>
                          {utility.name}
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 9, textTransform: 'capitalize' }}>
                          {utility.category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Sidebar */}
            <View style={{ flex: 1, minWidth: 180, gap: 12 }}>
              {/* Wallet Balance */}
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
                <Text style={{ color: '#6B7280', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Wallet Balance
                </Text>
                <Text style={{ color: '#032A24', fontSize: 22, fontWeight: '700' }}>{formatCurrency(balance)}</Text>
                {accountNumber ? (
                  <Text style={{ color: '#9CA3AF', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                    Acc: {accountNumber}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FAFAF7',
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                  }}
                  onPress={() => navigation.navigate('Wallet' as never)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>Top Up Wallet</Text>
                </TouchableOpacity>
              </View>

              {/* Saved Services */}
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
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Saved Services</Text>

                {savedServices.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No saved services</Text>
                    <TouchableOpacity onPress={() => setShowAddService(true)} activeOpacity={0.7}>
                      <Text style={{ color: '#032A24', fontSize: 11, fontWeight: '500', marginTop: 4 }}>+ Add a service</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  savedServices.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={{
                        backgroundColor: '#FAFAF7',
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.03)',
                        marginBottom: 6,
                      }}
                      onPress={() => handleSavedServiceClick(service)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>{service.nickname}</Text>
                          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>{service.utility_name || 'Unknown'}</Text>
                          <Text style={{ color: '#9CA3AF', fontSize: 9 }}>Account: {service.account_number}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeSavedService(service.id)} activeOpacity={0.7}>
                          <XIcon />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Recent Payments */}
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>Recent Payments</Text>
                  <TouchableOpacity onPress={fetchPaymentHistory} activeOpacity={0.7}>
                    <Text style={{ color: '#6B7280', fontSize: 11 }}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                {loadingHistory ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color="#C9A44B" />
                  </View>
                ) : paymentHistory.length === 0 ? (
                  <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
                    No payments yet
                  </Text>
                ) : (
                  paymentHistory.slice(0, 5).map((payment) => {
                    const status = getStatusBadge(payment.status);
                    return (
                      <View key={payment.id} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(3, 42, 36, 0.03)',
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }} numberOfLines={1}>
                            {payment.utility_name || 'Utility'}
                          </Text>
                          <Text style={{ color: '#9CA3AF', fontSize: 9 }}>{formatDate(payment.paid_at || payment.createdat)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>
                            {formatCurrency(payment.amount)}
                          </Text>
                          <View style={{
                            backgroundColor: status.style.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 8,
                          }}>
                            <Text style={{ color: status.style.text, fontSize: 8, fontWeight: '500' }}>{status.label}</Text>
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

      {/* ===== CONFIRMATION MODAL ===== */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700' }}>Confirm Payment</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} activeOpacity={0.7}>
                <CloseModalIcon />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '600' }}>{selectedUtility?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Paybill: {selectedUtility?.paybill}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Account</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{accountNumberInput}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>Amount</Text>
                  <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '700' }}>{formatCurrency(parseFloat(amount) || 0)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Wallet Balance After</Text>
                  <Text style={{ color: '#3FAF73', fontSize: 13, fontWeight: '600' }}>{formatCurrency(balance - parseFloat(amount))}</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.04)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#032A24', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  This payment will be deducted from your Itqaan wallet balance.
                </Text>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#FAFAF7',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
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
                    opacity: processing ? 0.6 : 1,
                  }}
                  onPress={confirmPayment}
                  disabled={processing}
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

      {/* ===== RECEIPT MODAL ===== */}
      <Modal visible={showReceiptModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
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
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Payment Successful</Text>
              <TouchableOpacity onPress={closeReceipt} activeOpacity={0.7}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(63, 175, 115, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(63, 175, 115, 0.15)',
                }}>
                  <CheckIcon />
                </View>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>Payment to</Text>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700' }}>{paymentStatus?.utility}</Text>
                <Text style={{ color: '#6B7280', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                  Ref: {paymentStatus?.ref}
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Account</Text>
                  <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>{paymentStatus?.account}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Paybill</Text>
                  <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>{paymentStatus?.paybill}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>Amount</Text>
                  <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '700' }}>{formatCurrency(paymentStatus?.amount)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Date</Text>
                  <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>{paymentStatus?.date}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Payment Method</Text>
                  <Text style={{ color: '#3FAF73', fontSize: 12, fontWeight: '600' }}>Wallet</Text>
                </View>
                {paymentStatus?.receipt ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>Receipt</Text>
                    <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600' }}>{paymentStatus.receipt}</Text>
                  </View>
                ) : null}
              </View>

              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.04)',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#032A24', fontSize: 12, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 }}>
                  "Allah has permitted trade and forbidden usury." — Quran 2:275
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
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                  }}
                  onPress={closeReceipt}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Download Receipt</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Utilities;