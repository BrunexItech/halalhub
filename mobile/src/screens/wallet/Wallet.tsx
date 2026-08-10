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
  const [showTransactions, setShowTransactions] = useState(false);

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
          setMessage('Payment successful. Your wallet has been updated.');
          setMessageType('success');
          setIsPolling(false);
          setCheckoutId(null);

          await fetchBalance();
          await fetchTransactions();

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
        return {
          bg: '#E7F5EE',
          text: '#22856C',
          border: '#B8DEC9',
        };

      case 'error':
        return {
          bg: '#FBEAEA',
          text: '#B74747',
          border: '#E8B7B7',
        };

      default:
        return {
          bg: '#EAF0EE',
          text: '#35627A',
          border: '#C7D8D2',
        };
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#FAFAF7',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C9A44B"
          />
        }
      >
        <View
          style={{
            maxWidth: 600,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          {/* Header */}
          <View
            style={{
              marginBottom: 22,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E5E9E5',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  color: '#0B342B',
                  fontSize: 22,
                  fontWeight: '400',
                  marginTop: -2,
                }}
              >
                ‹
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#0B342B',
                  fontSize: 23,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}
              >
                Wallet
              </Text>

              <Text
                style={{
                  color: '#6B756F',
                  fontSize: 13,
                  marginTop: 3,
                  lineHeight: 19,
                }}
              >
                Manage your Itqaan wallet securely
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                fetchBalance();
                fetchTransactions();
              }}
              activeOpacity={0.75}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E5E9E5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#0B342B',
                  fontSize: 18,
                  fontWeight: '500',
                }}
              >
                ↻
              </Text>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View
            style={{
              backgroundColor: '#0B342B',
              borderRadius: 22,
              padding: 22,
              marginBottom: 18,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#134F40',
              shadowColor: '#0B342B',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.14,
              shadowRadius: 18,
              elevation: 6,
            }}
          >
            <View
              style={{
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: 85,
                right: -80,
                top: -85,
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
              }}
            />

            <View
              style={{
                position: 'absolute',
                width: 100,
                height: 100,
                borderRadius: 50,
                left: -50,
                bottom: -50,
                backgroundColor: 'rgba(201, 164, 75, 0.06)',
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: '#C9A44B',
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Available Balance
                </Text>

                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 31,
                    fontWeight: '700',
                    marginTop: 7,
                    letterSpacing: -0.5,
                  }}
                >
                  {formatCurrency(balance)}
                </Text>

                <Text
                  style={{
                    color: 'rgba(255,255,255,0.62)',
                    fontSize: 12,
                    marginTop: 7,
                  }}
                >
                  Secure and Sharia-compliant
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 13,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginLeft: 12,
                }}
              >
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.52)',
                    fontSize: 9,
                    fontWeight: '600',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  Status
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#8FD3AE',
                      marginRight: 6,
                    }}
                  />

                  <Text
                    style={{
                      color: '#D9F1E3',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    Active
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.08)',
                marginTop: 20,
                marginBottom: 14,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                }}
              >
                Itqaan Digital Wallet
              </Text>

              <Text
                style={{
                  color: 'rgba(201,164,75,0.75)',
                  fontSize: 11,
                  fontWeight: '500',
                }}
              >
                No Riba
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                color: '#0B342B',
                fontSize: 15,
                fontWeight: '600',
                marginBottom: 10,
              }}
            >
              Quick actions
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {[
                {
                  label: 'Add Money',
                  action: () => {},
                },
                {
                  label: 'Pay Zakat',
                  action: () => navigation.navigate('Zakat' as never),
                },
                {
                  label: 'Give Sadaqa',
                  action: () => navigation.navigate('Sadaqa' as never),
                },
                {
                  label: 'P2P Loan',
                  action: () => navigation.navigate('P2P' as never),
                },
                {
                  label: 'Pay Utilities',
                  action: () => navigation.navigate('Utilities' as never),
                },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.action}
                  activeOpacity={0.78}
                  style={{
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor:
                      index === 0 ? '#0B342B' : '#FFFFFF',
                    borderWidth: index === 0 ? 0 : 1,
                    borderColor: '#E4E9E5',
                    shadowColor:
                      index === 0 ? '#0B342B' : '#000000',
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: index === 0 ? 0.12 : 0.025,
                    shadowRadius: 7,
                    elevation: index === 0 ? 3 : 1,
                  }}
                >
                  <Text
                    style={{
                      color:
                        index === 0 ? '#FFFFFF' : '#26332F',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Add Money */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 18,
              marginBottom: 18,
              borderWidth: 1,
              borderColor: '#E5E9E5',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.035,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: '#0B342B',
                    fontSize: 17,
                    fontWeight: '650',
                  }}
                >
                  Add money
                </Text>

                <Text
                  style={{
                    color: '#747D78',
                    fontSize: 12,
                    marginTop: 4,
                    lineHeight: 17,
                  }}
                >
                  Fund your Itqaan wallet securely through M-Pesa.
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: '#E7F5EE',
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 999,
                  marginLeft: 10,
                }}
              >
                <Text
                  style={{
                    color: '#22856C',
                    fontSize: 10,
                    fontWeight: '600',
                  }}
                >
                  M-Pesa
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View style={{ marginBottom: 13 }}>
              <Text
                style={{
                  color: '#36433E',
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 7,
                }}
              >
                Phone number
              </Text>

              <TextInput
                style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: '#DDE4DF',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                  color: '#17221E',
                  fontSize: 14,
                }}
                value={phone}
                onChangeText={setPhone}
                placeholder="+2547XXXXXXXX"
                placeholderTextColor="#9AA39E"
                editable={!loading && !isPolling}
              />

              <Text
                style={{
                  color: '#8A938E',
                  fontSize: 11,
                  marginTop: 5,
                }}
              >
                Use your registered M-Pesa number.
              </Text>
            </View>

            {/* Amount */}
            <View style={{ marginBottom: 13 }}>
              <Text
                style={{
                  color: '#36433E',
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 7,
                }}
              >
                Amount
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: '#DDE4DF',
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: '#6E7973',
                    fontSize: 13,
                    fontWeight: '600',
                    paddingLeft: 14,
                  }}
                >
                  KES
                </Text>

                <TextInput
                  style={{
                    flex: 1,
                    paddingHorizontal: 10,
                    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
                    color: '#17221E',
                    fontSize: 14,
                  }}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  placeholderTextColor="#9AA39E"
                  keyboardType="numeric"
                  editable={!loading && !isPolling}
                />
              </View>
            </View>

            {/* Quick Amounts */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 7,
                marginBottom: 16,
              }}
            >
              {quickAmounts.map((val) => {
                const selected = parseFloat(amount) === val;

                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => handleQuickAmount(val)}
                    disabled={loading || isPolling}
                    activeOpacity={0.75}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: selected
                        ? '#0B342B'
                        : '#F5F6F2',
                      borderWidth: selected ? 0 : 1,
                      borderColor: '#E4E8E3',
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? '#FFFFFF' : '#66716C',
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      KES {val.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment Action */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={handleTopup}
                disabled={loading || isPolling}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: '#0B342B',
                  minHeight: 46,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loading || isPolling ? 0.65 : 1,
                  shadowColor: '#0B342B',
                  shadowOffset: {
                    width: 0,
                    height: 5,
                  },
                  shadowOpacity: 0.16,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                {loading ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: '600',
                        marginLeft: 8,
                      }}
                    >
                      Processing...
                    </Text>
                  </View>
                ) : isPolling ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: '600',
                        marginLeft: 8,
                      }}
                    >
                      Awaiting confirmation...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
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
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      color: '#B74747',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Message */}
            {message ? (
              <View
                style={{
                  marginTop: 13,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 11,
                  backgroundColor: getMessageStyles().bg,
                  borderWidth: 1,
                  borderColor: getMessageStyles().border,
                }}
              >
                <Text
                  style={{
                    color: getMessageStyles().text,
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                >
                  {message}
                </Text>
              </View>
            ) : null}

            <Text
              style={{
                color: '#8A938E',
                fontSize: 10,
                textAlign: 'center',
                marginTop: 13,
              }}
            >
              Secure M-Pesa payment processing
            </Text>
          </View>

          {/* Transaction History Toggle */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: '#E5E9E5',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 1,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowTransactions((prev) => !prev)}
              activeOpacity={0.75}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: '#0B342B',
                    fontSize: 15,
                    fontWeight: '650',
                  }}
                >
                  Transaction history
                </Text>

                <Text
                  style={{
                    color: '#7B8580',
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  {totalTransactions > 0
                    ? `${totalTransactions} recorded transactions`
                    : 'Review your wallet activity'}
                </Text>
              </View>

              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: '#F5F6F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E5E9E5',
                }}
              >
                <Text
                  style={{
                    color: '#0B342B',
                    fontSize: 17,
                    fontWeight: '500',
                  }}
                >
                  {showTransactions ? '⌃' : '⌄'}
                </Text>
              </View>
            </TouchableOpacity>

            {showTransactions && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: '#EEF1ED',
                  paddingHorizontal: 18,
                  paddingBottom: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 14,
                    paddingBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: '#7A847F',
                      fontSize: 11,
                    }}
                  >
                    Recent activity
                  </Text>

                  <TouchableOpacity
                    onPress={fetchTransactions}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: '#0B342B',
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      Refresh
                    </Text>
                  </TouchableOpacity>
                </View>

                {loadingTx ? (
                  <View
                    style={{
                      alignItems: 'center',
                      paddingVertical: 28,
                    }}
                  >
                    <ActivityIndicator
                      size="small"
                      color="#0B342B"
                    />

                    <Text
                      style={{
                        color: '#7B8580',
                        fontSize: 12,
                        marginTop: 9,
                      }}
                    >
                      Loading transaction history...
                    </Text>
                  </View>
                ) : transactions.length === 0 ? (
                  <View
                    style={{
                      alignItems: 'center',
                      paddingVertical: 30,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: '#F4F5F1',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: '#9AA39E',
                          fontSize: 20,
                        }}
                      >
                        —
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: '#27342F',
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      No transactions yet
                    </Text>

                    <Text
                      style={{
                        color: '#7B8580',
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      Your wallet activity will appear here.
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
                              index <
                              transactions.slice(0, 10).length - 1
                                ? 1
                                : 0,
                            borderBottomColor: '#F0F2EE',
                          }}
                        >
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              backgroundColor: colors.bg,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 13,
                                fontWeight: '700',
                              }}
                            >
                              {getTransactionIcon(tx.type)}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                              }}
                            >
                              <Text
                                style={{
                                  color: '#26332F',
                                  fontSize: 12,
                                  fontWeight: '600',
                                  flex: 1,
                                  marginRight: 8,
                                }}
                              >
                                {tx.title}
                              </Text>

                              <Text
                                style={{
                                  color:
                                    tx.amount > 0
                                      ? '#22856C'
                                      : '#B74747',
                                  fontSize: 12,
                                  fontWeight: '700',
                                }}
                              >
                                {tx.amount > 0 ? '+' : '-'}
                                {formatCurrency(
                                  Math.abs(tx.amount),
                                )}
                              </Text>
                            </View>

                            <View
                              style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                marginTop: 5,
                                gap: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#858E89',
                                  fontSize: 10,
                                }}
                              >
                                {tx.date}
                              </Text>

                              {tx.reference ? (
                                <Text
                                  style={{
                                    color: '#858E89',
                                    fontSize: 9,
                                    fontFamily:
                                      Platform.OS === 'ios'
                                        ? 'Courier'
                                        : 'monospace',
                                  }}
                                >
                                  Ref: {tx.reference}
                                </Text>
                              ) : null}

                              <View
                                style={{
                                  backgroundColor:
                                    statusColors.bg,
                                  paddingHorizontal: 7,
                                  paddingVertical: 2,
                                  borderRadius: 999,
                                }}
                              >
                                <Text
                                  style={{
                                    color: statusColors.text,
                                    fontSize: 9,
                                    fontWeight: '600',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {tx.status === 'completed'
                                    ? 'Complete'
                                    : tx.status === 'pending'
                                    ? 'Pending'
                                    : tx.status === 'processing'
                                    ? 'Processing'
                                    : 'Failed'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}

                    {totalTransactions > 10 ? (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate(
                            'WalletHistory' as never,
                          )
                        }
                        activeOpacity={0.7}
                        style={{
                          alignItems: 'center',
                          paddingTop: 14,
                          marginTop: 4,
                          borderTopWidth: 1,
                          borderTopColor: '#F0F2EE',
                        }}
                      >
                        <Text
                          style={{
                            color: '#0B342B',
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          View all transactions
                        </Text>

                        <Text
                          style={{
                            color: '#8A938E',
                            fontSize: 10,
                            marginTop: 3,
                          }}
                        >
                          {totalTransactions} transactions
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                )}
              </View>
            )}
          </View>

          {/* Footer */}
          <View
            style={{
              alignItems: 'center',
              paddingTop: 20,
              paddingBottom: 8,
            }}
          >
            <Text
              style={{
                color: '#A0A7A3',
                fontSize: 10,
                letterSpacing: 0.3,
              }}
            >
              Itqaan · Secure Islamic Financial Services
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Wallet;