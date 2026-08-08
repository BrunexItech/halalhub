import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { walletService, mpesaService, transactionService } from '../../api/client';

const Wallet = () => {
  const navigation = useNavigation();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('+254');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!checkoutId || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const res = await mpesaService.checkStatus(checkoutId);
        if (res.data.status === 'success') {
          setMessage('Payment successful. Wallet updated.');
          setMessageType('success');
          setIsPolling(false);
          setCheckoutId(null);
          await fetchBalance();
          await fetchTransactions();
          clearInterval(interval);
        } else if (res.data.status === 'failed') {
          setMessage('Payment failed. Please try again.');
          setMessageType('error');
          setIsPolling(false);
          setCheckoutId(null);
          clearInterval(interval);
        }
      } catch (err) {
        console.log('Status check error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutId, isPolling]);

  const fetchBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.log('Failed to fetch balance:', err);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const res = await transactionService.getRecent(50);
      const txData = res.data.transactions || [];

      const formattedTx = txData.map((tx: any) => {
        let title = tx.type || 'Transaction';
        let iconType = tx.type || 'default';

        switch (tx.type) {
          case 'topup':
            title = 'M-Pesa Top Up';
            iconType = 'topup';
            break;
          case 'utility':
            title = tx.description || 'Utility Payment';
            iconType = 'utility';
            break;
          case 'zakat':
            title = 'Zakat Payment';
            iconType = 'zakat';
            break;
          case 'sadaqa':
            title = 'Sadaqa Donation';
            iconType = 'sadaqa';
            break;
          case 'p2p':
            title = 'P2P Transfer';
            iconType = 'transfer';
            break;
          case 'repayment':
            title = 'Loan Repayment';
            iconType = 'repayment';
            break;
          case 'withdrawal':
            title = 'Withdrawal';
            iconType = 'withdrawal';
            break;
          default:
            title = tx.description || tx.type || 'Transaction';
            iconType = 'default';
        }

        const date = tx.createdat || tx.createdAt || tx.paid_at;
        const formattedDate = date ? new Date(date).toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : 'N/A';

        const time = date ? new Date(date).toLocaleTimeString('en-KE', {
          hour: '2-digit',
          minute: '2-digit',
        }) : '';

        return {
          id: tx.id,
          title,
          amount: tx.amount || 0,
          type: iconType,
          status: tx.status || 'completed',
          date: `${formattedDate}, ${time}`,
          reference: tx.reference || tx.transaction_ref,
        };
      });

      setTransactions(formattedTx);
      setTotalTransactions(formattedTx.length);
    } catch (err) {
      console.log('Failed to fetch transactions:', err);
      setTransactions([]);
    } finally {
      setLoadingTx(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBalance();
    fetchTransactions();
  };

  const handleTopup = async () => {
    const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setMessage('Please enter a valid phone number');
      setMessageType('error');
      return;
    }

    if (!amount || parseFloat(amount) < 10) {
      setMessage('Enter amount (minimum 10 KES)');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('Sending payment request to M-Pesa...');
    setMessageType('info');

    try {
      const res = await mpesaService.stkPush({
        phone: cleanPhone,
        amount: parseInt(amount),
      });

      if (res.data.success) {
        setMessage('Check your phone and enter M-Pesa PIN to complete payment.');
        setMessageType('info');
        setCheckoutId(res.data.checkoutId);
        setIsPolling(true);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Payment failed. Please try again.');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      topup: 'T',
      zakat: 'Z',
      sadaqa: 'S',
      repayment: 'R',
      utility: 'U',
      payment: 'P',
      transfer: 'X',
      withdrawal: 'W',
      default: '•',
    };
    return icons[type] || icons.default;
  };

  const getTransactionColors = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      topup: { bg: '#D1FAE5', text: '#3FAF73' },
      zakat: { bg: '#FEF3C7', text: '#D97706' },
      sadaqa: { bg: '#F3E8FF', text: '#9333EA' },
      repayment: { bg: '#DBEAFE', text: '#3B82F6' },
      utility: { bg: '#FFEDD5', text: '#EA580C' },
      payment: { bg: '#E0E7FF', text: '#4F46E5' },
      transfer: { bg: '#CFFAFE', text: '#0891B2' },
      withdrawal: { bg: '#FEE2E2', text: '#DC2626' },
      default: { bg: '#F4F5F1', text: '#6B7280' },
    };
    return colors[type] || colors.default;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      completed: { bg: '#D1FAE5', text: '#3FAF73' },
      pending: { bg: '#FEF3C7', text: '#D97706' },
      processing: { bg: '#DBEAFE', text: '#3B82F6' },
      failed: { bg: '#FEE2E2', text: '#DC2626' },
    };
    return colors[status] || colors.completed;
  };

  const getMessageStyles = () => {
    switch (messageType) {
      case 'success':
        return { bg: '#D1FAE5', text: '#3FAF73', border: '#A7F3D0' };
      case 'error':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
      default:
        return { bg: '#DBEAFE', text: '#3B82F6', border: '#BFDBFE' };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          {/* Page Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ color: '#1F2937', fontSize: 26, fontWeight: '700' }}>Wallet</Text>
              <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 2 }}>Manage your wallet securely</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                backgroundColor: '#FAFAF7',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#E8EEF4',
              }}>
                <Text style={{ color: '#0B342B', fontSize: 11, fontWeight: '500' }}>Sharia Compliant</Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                }}
                onPress={() => { fetchBalance(); fetchTransactions(); }}
              >
                <Text style={{ color: '#6B7280', fontSize: 16 }}>↻</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Card */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
            shadowColor: '#0B342B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 13, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Total Balance
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginTop: 4 }}>
                  {formatCurrency(balance)}
                </Text>
                <Text style={{ color: 'rgba(201, 164, 75, 0.4)', fontSize: 13, marginTop: 4 }}>
                  Sharia-Compliant · No Riba
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'rgba(201, 164, 75, 0.5)', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Status
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1FAE5', marginRight: 6 }} />
                  <Text style={{ color: '#D1FAE5', fontSize: 15, fontWeight: '600' }}>Active</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Add Money', action: () => {} },
              { label: 'Pay Zakat', action: () => navigation.navigate('Zakat' as never) },
              { label: 'Give Sadaqa', action: () => navigation.navigate('Sadaqa' as never) },
              { label: 'P2P Loan', action: () => navigation.navigate('P2P' as never) },
              { label: 'Pay Utilities', action: () => navigation.navigate('Utilities' as never) },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: index === 0 ? '#0B342B' : '#FFFFFF',
                  borderWidth: index === 0 ? 0 : 1,
                  borderColor: '#E8EEF4',
                  shadowColor: index === 0 ? '#0B342B' : 'transparent',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: index === 0 ? 0.2 : 0,
                  shadowRadius: 8,
                  elevation: index === 0 ? 4 : 0,
                }}
                onPress={item.action}
              >
                <Text style={{
                  color: index === 0 ? '#FFFFFF' : '#1F2937',
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Top Up Section */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600' }}>Add Money via M-Pesa</Text>
              <View style={{
                backgroundColor: '#D1FAE5',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
              }}>
                <Text style={{ color: '#3FAF73', fontSize: 13, fontWeight: '500' }}>Instant</Text>
              </View>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Phone Number</Text>
              <TextInput
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: '#1F2937',
                  fontSize: 15,
                }}
                value={phone}
                onChangeText={setPhone}
                placeholder="+2547XXXXXXXX"
                placeholderTextColor="#6B7280"
                editable={!loading && !isPolling}
              />
              <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>Registered M-Pesa number</Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Amount (KES)</Text>
              <TextInput
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: '#1F2937',
                  fontSize: 15,
                }}
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                editable={!loading && !isPolling}
              />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {quickAmounts.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: parseFloat(amount) === val ? '#0B342B' : '#FAFAF7',
                  }}
                  onPress={() => handleQuickAmount(val)}
                  disabled={loading || isPolling}
                >
                  <Text style={{
                    color: parseFloat(amount) === val ? '#FFFFFF' : '#6B7280',
                    fontSize: 13,
                    fontWeight: '500',
                  }}>
                    KES {val.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#0B342B',
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 8,
                  opacity: (loading || isPolling) ? 0.6 : 1,
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={handleTopup}
                disabled={loading || isPolling}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>Sending...</Text>
                  </View>
                ) : isPolling ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>Waiting for M-Pesa...</Text>
                  </View>
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>Pay via M-Pesa</Text>
                )}
              </TouchableOpacity>

              {isPolling && (
                <TouchableOpacity
                  onPress={() => {
                    setIsPolling(false);
                    setCheckoutId(null);
                    setMessage('Payment cancelled');
                    setMessageType('info');
                  }}
                >
                  <Text style={{ color: '#DC2626', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {message ? (
              <View style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 8,
                backgroundColor: getMessageStyles().bg,
                borderWidth: 1,
                borderColor: getMessageStyles().border,
              }}>
                <Text style={{ color: getMessageStyles().text, fontSize: 14 }}>{message}</Text>
              </View>
            ) : null}

            <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 10 }}>
              Secured by M-Pesa · End-to-end encrypted
            </Text>
          </View>

          {/* Transaction History */}
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
              <View>
                <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600' }}>Transaction History</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>{totalTransactions} transactions</Text>
              </View>
              <TouchableOpacity onPress={fetchTransactions}>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>↻</Text>
              </TouchableOpacity>
            </View>

            {loadingTx ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator size="large" color="#0B342B" />
                <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 8 }}>Loading transactions...</Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ color: '#E8EEF4', fontSize: 40, marginBottom: 8 }}>—</Text>
                <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600' }}>No transactions yet</Text>
                <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 4 }}>Your wallet activity will appear here</Text>
              </View>
            ) : (
              <>
                {transactions.slice(0, 10).map((tx, index) => {
                  const colors = getTransactionColors(tx.type);
                  const statusColors = getStatusBadge(tx.status);
                  return (
                    <View key={tx.id || index} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderBottomWidth: index < transactions.slice(0, 10).length - 1 ? 1 : 0,
                      borderBottomColor: '#F4F5F1',
                    }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: colors.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                          {getTransactionIcon(tx.type)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', flex: 1 }}>
                            {tx.title}
                          </Text>
                          <Text style={{
                            color: tx.amount > 0 ? '#3FAF73' : '#DC2626',
                            fontSize: 14,
                            fontWeight: '700',
                          }}>
                            {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text style={{ color: '#6B7280', fontSize: 12 }}>{tx.date}</Text>
                          {tx.reference ? (
                            <Text style={{ color: '#6B7280', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                              Ref: {tx.reference}
                            </Text>
                          ) : null}
                          <View style={{
                            backgroundColor: statusColors.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 999,
                          }}>
                            <Text style={{ color: statusColors.text, fontSize: 11, fontWeight: '500', textTransform: 'capitalize' }}>
                              {tx.status === 'completed' ? 'Complete' :
                               tx.status === 'pending' ? 'Pending' :
                               tx.status === 'processing' ? 'Processing' : 'Failed'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {totalTransactions > 10 ? (
                  <TouchableOpacity
                    style={{ alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F4F5F1', marginTop: 4 }}
                    onPress={() => navigation.navigate('WalletHistory' as never)}
                  >
                    <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '500' }}>
                      View All Transactions ({totalTransactions}) →
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Wallet;