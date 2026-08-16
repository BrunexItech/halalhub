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
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { walletService, mpesaService } from '../../api/client';

const { width: screenWidth } = Dimensions.get('window');

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
  const [showTransactions, setShowTransactions] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  // Premium SVG Icons
  const EyeIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.8">
      <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <Path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </Svg>
  );

  const EyeOffIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8">
      <Path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </Svg>
  );

  const BackIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="2">
      <Path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );

  const RefreshIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="2">
      <Path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 9a9 9 0 0116-4M20 15a9 9 0 01-16 4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );

  const ChevronDownIcon = ({ color = '#6B7280' }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );

  const ChevronUpIcon = ({ color = '#6B7280' }) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );

  const WalletIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.8">
      <Path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </Svg>
  );

  const MpesaIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16v16H4V4z" stroke="#22856C" strokeWidth="1.5" rx="2" />
      <Path d="M8 8l8 8M16 8l-8 8" stroke="#22856C" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!checkoutId || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const res = await mpesaService.checkStatus(checkoutId);

        if (res.data.status === 'success') {
          setMessage('Payment successful. Your wallet has been updated.');
          setMessageType('success');
          setIsPolling(false);
          setCheckoutId(null);
          await fetchAllData();
          clearInterval(interval);
        } else if (res.data.status === 'failed') {
          setMessage('Payment could not be completed. Please try again.');
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

  const fetchAllData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions({ limit: 50 }),
      ]);

      setBalance(balanceRes.data.balance || 0);

      let txData = txRes.data.transactions || [];
      
      // Filter out fee transactions
      txData = txData.filter((tx: any) => {
        const type = tx.type || '';
        const description = tx.description || '';
        const title = tx.title || '';
        // Skip if type is 'fee' or if description/title contains 'fee'
        return type.toLowerCase() !== 'fee' && 
               !description.toLowerCase().includes('fee') && 
               !title.toLowerCase().includes('fee');
      });
      
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
        const formattedDate = date
          ? new Date(date).toLocaleDateString('en-KE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'N/A';

        const time = date
          ? new Date(date).toLocaleTimeString('en-KE', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

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
      console.log('Failed to fetch data:', err);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      setLoadingTx(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleTopup = async () => {
    const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setMessage('Please enter a valid phone number.');
      setMessageType('error');
      return;
    }

    if (!amount || parseFloat(amount) < 10) {
      setMessage('Enter an amount of at least KES 10.');
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
        setMessage('Check your phone and enter your M-Pesa PIN to complete payment.');
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

  const formatCurrency = (value: number) => {
    return `KES ${value?.toLocaleString() || 0}`;
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      topup: '+',
      zakat: 'Z',
      sadaqa: 'S',
      repayment: 'R',
      utility: 'U',
      payment: 'P',
      transfer: 'T',
      withdrawal: 'W',
      default: '•',
    };
    return icons[type] || icons.default;
  };

  const getTransactionColors = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      topup: { bg: '#E7F5EE', text: '#22856C' },
      zakat: { bg: '#F9F1D8', text: '#C9A44B' },
      sadaqa: { bg: '#F2EAF8', text: '#7B4A9E' },
      repayment: { bg: '#E8F0F7', text: '#35627A' },
      utility: { bg: '#FCEFE5', text: '#B65E25' },
      payment: { bg: '#E9EDF7', text: '#435B8D' },
      transfer: { bg: '#E6F3F3', text: '#257B7A' },
      withdrawal: { bg: '#FBEAEA', text: '#B74747' },
      default: { bg: '#F3F4F0', text: '#66716D' },
    };
    return colors[type] || colors.default;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      completed: { bg: '#E7F5EE', text: '#22856C' },
      pending: { bg: '#F9F1D8', text: '#A37D23' },
      processing: { bg: '#E8F0F7', text: '#35627A' },
      failed: { bg: '#FBEAEA', text: '#B74747' },
    };
    return colors[status] || colors.completed;
  };

  const getMessageStyles = () => {
    switch (messageType) {
      case 'success':
        return { bg: '#E7F5EE', text: '#22856C', border: '#B8DEC9' };
      case 'error':
        return { bg: '#FBEAEA', text: '#B74747', border: '#E8B7B7' };
      default:
        return { bg: '#EAF0EE', text: '#35627A', border: '#C7D8D2' };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF7" translucent={false} />

      {/* Premium Header with Gold Accent */}
      <View style={{
        backgroundColor: '#FAFAF7',
        paddingTop: 12,
        paddingBottom: 0,
        borderBottomWidth: 0,
      }}>
        <View style={{
          paddingHorizontal: 20,
          paddingBottom: 16,
          maxWidth: 600,
          width: '100%',
          alignSelf: 'center',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E8EAE7',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <BackIcon />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <WalletIcon />
                <Text style={{
                  color: '#0B342B',
                  fontSize: 22,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}>
                  Wallet
                </Text>
              </View>
              <Text style={{
                color: '#7B8580',
                fontSize: 13,
                marginTop: 2,
                fontWeight: '400',
              }}>
                Manage your Itqaan wallet securely
              </Text>
            </View>

            <TouchableOpacity
              onPress={onRefresh}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E8EAE7',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <RefreshIcon />
            </TouchableOpacity>
          </View>

          {/* Gold Accent Line */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 14,
          }}>
            <View style={{
              height: 1.5,
              flex: 1,
              backgroundColor: 'rgba(201, 164, 75, 0.15)',
            }} />
            <View style={{
              width: 28,
              height: 1.5,
              backgroundColor: '#C9A44B',
              marginHorizontal: 8,
              borderRadius: 2,
            }} />
            <View style={{
              height: 1.5,
              flex: 1,
              backgroundColor: 'rgba(201, 164, 75, 0.15)',
            }} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C9A44B"
            colors={['#C9A44B']}
          />
        }
      >
        <View style={{
          maxWidth: 600,
          width: '100%',
          alignSelf: 'center',
        }}>

          {/* Premium Balance Card */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.12)',
            shadowColor: '#0B342B',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 28,
            elevation: 8,
          }}>
            {/* Aura Glow Effects */}
            <View style={{
              position: 'absolute',
              top: -100,
              right: -80,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(201, 164, 75, 0.04)',
            }} />
            <View style={{
              position: 'absolute',
              bottom: -60,
              left: -60,
              width: 150,
              height: 150,
              borderRadius: 75,
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

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: 'rgba(201, 164, 75, 0.6)',
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                }}>
                  Available Balance
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 34,
                    fontWeight: '700',
                    letterSpacing: -0.5,
                  }}>
                    {showBalance ? formatCurrency(balance) : '••••••'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowBalance(!showBalance)}
                    style={{ marginLeft: 12 }}
                  >
                    {showBalance ? <EyeIcon /> : <EyeOffIcon />}
                  </TouchableOpacity>
                </View>

                <Text style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 12,
                  marginTop: 4,
                  fontWeight: '400',
                }}>
                  Sharia-compliant · No Riba
                </Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
                paddingHorizontal: 14,
                paddingVertical: 10,
                alignItems: 'center',
              }}>
                <Text style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 8,
                  fontWeight: '600',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}>
                  Status
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: '#4ADE80',
                    marginRight: 6,
                  }} />
                  <Text style={{
                    color: '#D9F1E3',
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    Active
                  </Text>
                </View>
              </View>
            </View>

            <View style={{
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.06)',
              marginTop: 18,
              marginBottom: 14,
            }} />

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 10,
                  fontWeight: '500',
                }}>
                  Digital Wallet
                </Text>
                <View style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(201, 164, 75, 0.3)',
                }} />
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.06)',
                }}>
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 8,
                    fontWeight: '500',
                    letterSpacing: 0.5,
                  }}>
                    Halal
                  </Text>
                </View>
              </View>
              <Text style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: 10,
                fontWeight: '400',
                letterSpacing: 0.5,
              }}>
                {balance > 0 ? 'Funded' : 'Ready'}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ marginBottom: 18 }}>
            <Text style={{
              color: '#0B342B',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: 12,
              letterSpacing: -0.2,
            }}>
              Quick Actions
            </Text>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}>
              {[
                { label: 'Add Money', action: () => {}, icon: '+' },
                { label: 'Pay Zakat', action: () => navigation.navigate('Zakat' as never), icon: 'Z' },
                { label: 'Give Sadaqa', action: () => navigation.navigate('Sadaqa' as never), icon: 'S' },
                { label: 'Pay Utilities', action: () => navigation.navigate('Utilities' as never), icon: 'U' },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.action}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    minWidth: 70,
                    backgroundColor: index === 0 ? '#0B342B' : '#FFFFFF',
                    paddingVertical: 12,
                    paddingHorizontal: 6,
                    borderRadius: 14,
                    borderWidth: index === 0 ? 0 : 1,
                    borderColor: '#E8EAE7',
                    alignItems: 'center',
                    shadowColor: index === 0 ? '#0B342B' : '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: index === 0 ? 0.12 : 0.02,
                    shadowRadius: 8,
                    elevation: index === 0 ? 3 : 0,
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: index === 0 ? 'rgba(255,255,255,0.08)' : '#FAFAF7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }}>
                    <Text style={{
                      color: index === 0 ? '#C9A44B' : '#0B342B',
                      fontSize: 14,
                      fontWeight: '600',
                    }}>
                      {item.icon}
                    </Text>
                  </View>
                  <Text style={{
                    color: index === 0 ? '#FFFFFF' : '#36433E',
                    fontSize: 10,
                    fontWeight: '500',
                    textAlign: 'center',
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Add Money Card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#E8EAE7',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.04,
            shadowRadius: 16,
            elevation: 2,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 16,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#0B342B',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}>
                  Add Money
                </Text>
                <Text style={{
                  color: '#7B8580',
                  fontSize: 12,
                  marginTop: 4,
                  lineHeight: 18,
                }}>
                  Fund your wallet securely through M-Pesa
                </Text>
              </View>
              <View style={{
                backgroundColor: '#E7F5EE',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(34, 133, 108, 0.15)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}>
                <MpesaIcon />
                <Text style={{
                  color: '#22856C',
                  fontSize: 10,
                  fontWeight: '600',
                }}>
                  M-Pesa
                </Text>
              </View>
            </View>

            {/* Phone Input */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{
                color: '#36433E',
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 6,
              }}>
                Phone Number
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FAFAF7',
                borderWidth: 1,
                borderColor: '#E4E8E3',
                borderRadius: 14,
                paddingHorizontal: 14,
              }}>
                <Text style={{
                  color: '#6B7970',
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                  +254
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
                    paddingHorizontal: 8,
                    color: '#1A2A22',
                    fontSize: 14,
                    fontWeight: '400',
                  }}
                  value={phone.replace('+254', '')}
                  onChangeText={(text) => setPhone('+254' + text.replace(/\D/g, ''))}
                  placeholder="7XX XXX XXX"
                  placeholderTextColor="#AAB2AB"
                  keyboardType="phone-pad"
                  editable={!loading && !isPolling}
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{
                color: '#36433E',
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 6,
              }}>
                Amount
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FAFAF7',
                borderWidth: 1,
                borderColor: '#E4E8E3',
                borderRadius: 14,
                paddingHorizontal: 14,
              }}>
                <Text style={{
                  color: '#6B7970',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  KES
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
                    paddingHorizontal: 8,
                    color: '#1A2A22',
                    fontSize: 14,
                    fontWeight: '400',
                  }}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  placeholderTextColor="#AAB2AB"
                  keyboardType="numeric"
                  editable={!loading && !isPolling}
                />
              </View>
            </View>

            {/* Quick Amounts */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
            }}>
              {quickAmounts.map((val) => {
                const selected = parseFloat(amount) === val;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => handleQuickAmount(val)}
                    disabled={loading || isPolling}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: selected ? '#0B342B' : '#F5F6F2',
                      borderWidth: selected ? 0 : 1,
                      borderColor: '#E4E8E3',
                    }}
                  >
                    <Text style={{
                      color: selected ? '#FFFFFF' : '#66716C',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      KES {val.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment Button */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleTopup}
                disabled={loading || isPolling}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: '#0B342B',
                  minHeight: 50,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loading || isPolling ? 0.6 : 1,
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.16,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                      Processing...
                    </Text>
                  </View>
                ) : isPolling ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                      Awaiting confirmation...
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                    Continue with M-Pesa
                  </Text>
                )}
              </TouchableOpacity>

              {isPolling && (
                <TouchableOpacity
                  onPress={() => {
                    setIsPolling(false);
                    setCheckoutId(null);
                    setMessage('Payment request cancelled.');
                    setMessageType('info');
                  }}
                  activeOpacity={0.7}
                  style={{ paddingHorizontal: 14, paddingVertical: 10 }}
                >
                  <Text style={{ color: '#B74747', fontSize: 12, fontWeight: '600' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Message */}
            {message ? (
              <View style={{
                marginTop: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: getMessageStyles().bg,
                borderWidth: 1,
                borderColor: getMessageStyles().border,
              }}>
                <Text style={{
                  color: getMessageStyles().text,
                  fontSize: 12,
                  lineHeight: 18,
                  fontWeight: '400',
                }}>
                  {message}
                </Text>
              </View>
            ) : null}

            <Text style={{
              color: '#A0A7A3',
              fontSize: 10,
              textAlign: 'center',
              marginTop: 14,
              fontWeight: '400',
            }}>
              Secured by M-Pesa · End-to-end encrypted
            </Text>
          </View>

          {/* Transaction History */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E8EAE7',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.03,
            shadowRadius: 12,
            elevation: 1,
          }}>
            <TouchableOpacity
              onPress={() => setShowTransactions(!showTransactions)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#0B342B',
                  fontSize: 15,
                  fontWeight: '600',
                  letterSpacing: -0.2,
                }}>
                  Transaction History
                </Text>
                <Text style={{
                  color: '#7B8580',
                  fontSize: 11,
                  marginTop: 2,
                  fontWeight: '400',
                }}>
                  {totalTransactions > 0
                    ? `${totalTransactions} recorded transactions`
                    : 'Your wallet activity will appear here'}
                </Text>
              </View>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#F5F6F2',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E8EAE7',
              }}>
                {showTransactions ? (
                  <ChevronUpIcon color="#0B342B" />
                ) : (
                  <ChevronDownIcon color="#0B342B" />
                )}
              </View>
            </TouchableOpacity>

            {showTransactions && (
              <View style={{
                borderTopWidth: 1,
                borderTopColor: '#EEF1ED',
                paddingHorizontal: 18,
                paddingBottom: 16,
              }}>
                {loadingTx ? (
                  <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <ActivityIndicator size="small" color="#0B342B" />
                    <Text style={{ color: '#7B8580', fontSize: 12, marginTop: 10 }}>
                      Loading transactions...
                    </Text>
                  </View>
                ) : transactions.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                    <View style={{
                      width: 50,
                      height: 50,
                      borderRadius: 16,
                      backgroundColor: '#F4F5F1',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}>
                      <Text style={{ color: '#AAB2AB', fontSize: 22, fontWeight: '300' }}>—</Text>
                    </View>
                    <Text style={{
                      color: '#27342F',
                      fontSize: 15,
                      fontWeight: '600',
                    }}>
                      No transactions yet
                    </Text>
                    <Text style={{
                      color: '#7B8580',
                      fontSize: 12,
                      marginTop: 4,
                    }}>
                      Start using Itqaan to see your activity
                    </Text>
                  </View>
                ) : (
                  <>
                    {transactions.slice(0, 10).map((tx, index) => {
                      const colors = getTransactionColors(tx.type);
                      const statusColors = getStatusBadge(tx.status);

                      return (
                        <View
                          key={tx.id || index}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            borderBottomWidth:
                              index < transactions.slice(0, 10).length - 1 ? 1 : 0,
                            borderBottomColor: '#F0F2EE',
                          }}
                        >
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: colors.bg,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 14,
                          }}>
                            <Text style={{
                              color: colors.text,
                              fontSize: 14,
                              fontWeight: '700',
                            }}>
                              {getTransactionIcon(tx.type)}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}>
                              <Text style={{
                                color: '#26332F',
                                fontSize: 13,
                                fontWeight: '600',
                                flex: 1,
                                marginRight: 8,
                              }}>
                                {tx.title}
                              </Text>
                              <Text style={{
                                color: tx.amount > 0 ? '#22856C' : '#B74747',
                                fontSize: 13,
                                fontWeight: '700',
                              }}>
                                {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                              </Text>
                            </View>

                            <View style={{
                              flexDirection: 'row',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              marginTop: 4,
                              gap: 6,
                            }}>
                              <Text style={{
                                color: '#858E89',
                                fontSize: 10,
                              }}>
                                {tx.date}
                              </Text>
                              {tx.reference ? (
                                <Text style={{
                                  color: '#858E89',
                                  fontSize: 9,
                                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                }}>
                                  Ref: {tx.reference}
                                </Text>
                              ) : null}
                              <View style={{
                                backgroundColor: statusColors.bg,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 10,
                              }}>
                                <Text style={{
                                  color: statusColors.text,
                                  fontSize: 9,
                                  fontWeight: '600',
                                  textTransform: 'capitalize',
                                }}>
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
                        onPress={() => navigation.navigate('WalletHistory' as never)}
                        activeOpacity={0.7}
                        style={{
                          alignItems: 'center',
                          paddingTop: 14,
                          marginTop: 4,
                          borderTopWidth: 1,
                          borderTopColor: '#F0F2EE',
                        }}
                      >
                        <Text style={{
                          color: '#0B342B',
                          fontSize: 13,
                          fontWeight: '600',
                        }}>
                          View All Transactions
                        </Text>
                        <Text style={{
                          color: '#8A938E',
                          fontSize: 10,
                          marginTop: 2,
                        }}>
                          {totalTransactions} transactions
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                )}
              </View>
            )}
          </View>

          {/* Premium Footer */}
          <View style={{
            alignItems: 'center',
            paddingTop: 28,
            paddingBottom: 8,
          }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.15)',
              fontSize: 9,
              letterSpacing: 1.5,
              fontWeight: '500',
              textTransform: 'uppercase',
            }}>
              Itqaan · Secure Islamic Financial Services
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Wallet;