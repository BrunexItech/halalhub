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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { utilityService, walletService } from '../../api/client';

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
      completed: { bg: '#D1FAE5', text: '#3FAF73' },
      pending: { bg: '#FEF3C7', text: '#D97706' },
      failed: { bg: '#FEE2E2', text: '#DC2626' },
      processing: { bg: '#DBEAFE', text: '#3B82F6' },
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading utility providers...</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Utilities
                  </Text>
                  <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                  <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>Pay Your Bills</Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>Manage Your Utility Payments</Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 4, maxWidth: 400, lineHeight: 20 }}>
                  Pay electricity, water, internet, TV, and county rates from your wallet.
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>Balance: {formatCurrency(balance)}</Text>
                </View>
                {accountNumber ? (
                  <Text style={{ color: 'rgba(183, 192, 186, 0.5)', fontSize: 10, marginTop: 4 }}>
                    Acc: {accountNumber}
                  </Text>
                ) : null}
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
            {/* Payment Form */}
            <View style={{ flex: 2, minWidth: 300, gap: 12 }}>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Pay a Utility</Text>
                  <TouchableOpacity onPress={() => setShowAddService(!showAddService)}>
                    <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>
                      {showAddService ? 'Cancel' : '+ Save Service'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showAddService && (
                  <View style={{
                    backgroundColor: '#FAFAF7',
                    padding: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.06)',
                    marginBottom: 12,
                  }}>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Save a Service</Text>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        Nickname
                      </Text>
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
                        value={newService.nickname}
                        onChangeText={(text) => setNewService({ ...newService, nickname: text })}
                        placeholder="e.g., Home Electricity"
                      />
                    </View>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        Account / Meter Number
                      </Text>
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
                        value={newService.accountNumber}
                        onChangeText={(text) => setNewService({ ...newService, accountNumber: text })}
                        placeholder="Enter account number"
                      />
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#0B342B',
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                      onPress={handleAddService}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Save Service</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Select Utility
                  </Text>
                  <View style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}>
                    <TextInput
                      style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                      value={selectedUtility?.name || ''}
                      onChangeText={(text) => {
                        const utility = utilities.find((u) => u.name === text);
                        setSelectedUtility(utility);
                        setValidationError('');
                      }}
                      placeholder="Choose a utility..."
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    {selectedUtility?.fields?.[0] || 'Account Number'}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={accountNumberInput}
                    onChangeText={(text) => {
                      setAccountNumberInput(text);
                      setValidationError('');
                    }}
                    placeholder={`Enter ${selectedUtility?.fields?.[0]?.toLowerCase() || 'account number'}`}
                  />
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
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
                          backgroundColor: parseFloat(amount) === val ? '#0B342B' : '#F3F4F6',
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
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={amount}
                    onChangeText={(text) => {
                      setAmount(text);
                      setValidationError('');
                    }}
                    placeholder="Enter custom amount"
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
                    <Text style={{ color: '#DC2626', fontSize: 13 }}>{validationError}</Text>
                  </View>
                ) : null}

                {selectedUtility && accountNumberInput && amount ? (
                  <View style={{
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.06)',
                    marginBottom: 12,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>Paybill</Text>
                      <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>{selectedUtility.paybill}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>Account</Text>
                      <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>{accountNumberInput}</Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 4,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(11, 52, 43, 0.08)',
                      marginTop: 4,
                    }}>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Total</Text>
                      <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>{formatCurrency(parseFloat(amount) || 0)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>Wallet Balance</Text>
                      <Text style={{
                        color: parseFloat(amount) > balance ? '#DC2626' : '#3FAF73',
                        fontSize: 13,
                        fontWeight: '600',
                      }}>
                        {formatCurrency(balance)}
                      </Text>
                    </View>
                    {accountNumber ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>Account</Text>
                        <Text style={{ color: '#6B7280', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                          {accountNumber}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <TouchableOpacity
                  style={{
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: (processing || !amount || parseFloat(amount) > balance) ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handlePayment}
                  disabled={processing || !amount || parseFloat(amount) > balance}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Pay from Wallet</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Utility Providers Grid */}
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
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700', marginBottom: 10 }}>All Utility Providers</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {utilities.map((utility) => {
                    const bgColor = utility.color || '#0B342B';
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
                          borderColor: isSelected ? '#0B342B' : 'rgba(11, 52, 43, 0.08)',
                          backgroundColor: isSelected ? '#FAFAF7' : '#FFFFFF',
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          setSelectedUtility(utility);
                          setValidationError('');
                        }}
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
                        <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '500', marginTop: 4 }} numberOfLines={1}>
                          {utility.name}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 10, textTransform: 'capitalize' }}>
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
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16 }}>💰</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '700' }}>Wallet Balance</Text>
                </View>
                <Text style={{ color: '#0B342B', fontSize: 24, fontWeight: '700' }}>{formatCurrency(balance)}</Text>
                {accountNumber ? (
                  <Text style={{ color: '#6B7280', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                    Acc: {accountNumber}
                  </Text>
                ) : null}
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>Available for utility payments</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FAFAF7',
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}
                  onPress={() => navigation.navigate('Wallet' as never)}
                >
                  <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '600' }}>Top Up Wallet</Text>
                </TouchableOpacity>
              </View>

              {/* Saved Services */}
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
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700', marginBottom: 10 }}>Saved Services</Text>

                {savedServices.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>No saved services</Text>
                    <TouchableOpacity onPress={() => setShowAddService(true)}>
                      <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '500', marginTop: 4 }}>+ Add a service</Text>
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
                        borderColor: 'rgba(11, 52, 43, 0.06)',
                        marginBottom: 6,
                      }}
                      onPress={() => handleSavedServiceClick(service)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }}>{service.nickname}</Text>
                          <Text style={{ color: '#6B7280', fontSize: 12 }}>{service.utility_name || 'Unknown'}</Text>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>Account: {service.account_number}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeSavedService(service.id)}>
                          <Text style={{ color: '#6B7280', fontSize: 14 }}>✕</Text>
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
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>Recent Payments</Text>
                  <TouchableOpacity onPress={fetchPaymentHistory}>
                    <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '500' }}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                {loadingHistory ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color="#C9A44B" />
                  </View>
                ) : paymentHistory.length === 0 ? (
                  <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
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
                        borderBottomColor: '#F4F5F1',
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                            {payment.utility_name || 'Utility'}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>{formatDate(payment.paid_at || payment.createdat)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '600' }}>
                            {formatCurrency(payment.amount)}
                          </Text>
                          <View style={{
                            backgroundColor: status.style.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.05)',
                          }}>
                            <Text style={{ color: status.style.text, fontSize: 10, fontWeight: '500' }}>{status.label}</Text>
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
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Confirm Payment</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{selectedUtility?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Paybill: {selectedUtility?.paybill}</Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Account</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{accountNumberInput}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: '#E8EEF4',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Amount</Text>
                  <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>{formatCurrency(parseFloat(amount) || 0)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Wallet Balance After</Text>
                  <Text style={{ color: '#3FAF73', fontSize: 14, fontWeight: '600' }}>{formatCurrency(balance - parseFloat(amount))}</Text>
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
                <Text style={{ color: '#0B342B', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                  This payment will be deducted from your Itqaan wallet balance.
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
                  onPress={confirmPayment}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Confirm Payment</Text>
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
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Payment Successful</Text>
              <TouchableOpacity onPress={closeReceipt}>
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
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>Payment to</Text>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>{paymentStatus?.utility}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                  Ref: {paymentStatus?.ref}
                </Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Account</Text>
                  <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>{paymentStatus?.account}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Paybill</Text>
                  <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>{paymentStatus?.paybill}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: '#E8EEF4',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Amount</Text>
                  <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>{formatCurrency(paymentStatus?.amount)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Date</Text>
                  <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>{paymentStatus?.date}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Payment Method</Text>
                  <Text style={{ color: '#3FAF73', fontSize: 13, fontWeight: '600' }}>Wallet</Text>
                </View>
                {paymentStatus?.receipt ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Receipt</Text>
                    <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>{paymentStatus.receipt}</Text>
                  </View>
                ) : null}
                {paymentStatus?.accountNumber ? (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#E8EEF4',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Virtual Account</Text>
                    <Text style={{ color: '#6B7280', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                      {paymentStatus.accountNumber}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 }}>
                  "Allah has permitted trade and forbidden usury." — Quran 2:275
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
                  onPress={closeReceipt}
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
                    // Download receipt - placeholder
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Download Receipt</Text>
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

export default Utilities;