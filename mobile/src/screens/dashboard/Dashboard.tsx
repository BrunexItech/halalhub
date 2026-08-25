import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { walletService, zakatService, mpesaService, sadaqaService } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');

const Dashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const isLeader = user?.role === 'leader' || user?.role === 'imam' || user?.role === 'kadhi';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(0);
  const [zakatDue, setZakatDue] = useState(0);
  const [totalSadaqa, setTotalSadaqa] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showBalance, setShowBalance] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [stats, setStats] = useState({
    monthlySpent: 0,
    monthlyReceived: 0,
    totalDonations: 0,
  });
  const [notificationCount, setNotificationCount] = useState(0);

  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpPhone, setTopUpPhone] = useState('+254');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMessage, setTopUpMessage] = useState('');
  const [topUpMessageType, setTopUpMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  // Premium Header SVG Icons
  const NotificationIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </Svg>
  );

  // Card SVG Icons (Original)
  const EyeIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(183, 192, 186, 0.4)" strokeWidth="1.5">
      <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <Path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </Svg>
  );

  const EyeOffIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(183, 192, 186, 0.4)" strokeWidth="1.5">
      <Path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </Svg>
  );

  // Quick Actions (Original)
  const quickActions = [
    {
      id: 'pension',
      label: 'Itqaan Pension',
      color: '#D97706',
      bgColor: '#FEF3C7',
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5">
          <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          <Path d="M8 12h8" />
        </Svg>
      ),
      onPress: () => {
        navigation.navigate(isLeader ? 'LeaderDashboard' : 'Pension');
      },
    },
    {
      id: 'zakat',
      label: 'Pay Zakat',
      color: '#C9A44B',
      bgColor: '#FDFAF0',
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5">
          <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          <Circle cx="12" cy="12" r="2" />
        </Svg>
      ),
      route: 'Zakat',
    },
    {
      id: 'sadaqa',
      label: 'Give Sadaqa',
      color: '#3FAF73',
      bgColor: '#D1FAE5',
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3FAF73" strokeWidth="1.5">
          <Path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          <Path d="M12 7.636L10.682 6.318a4.5 4.5 0 00-6.364 0L4.318 6.318" />
        </Svg>
      ),
      route: 'Sadaqa',
    },
    {
      id: 'utilities',
      label: 'Pay Utilities',
      color: '#EA580C',
      bgColor: '#FFEDD5',
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="1.5">
          <Path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </Svg>
      ),
      route: 'Utilities',
    },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!checkoutId || !isPolling) return;
    const interval = setInterval(async () => {
      try {
        const res = await mpesaService.checkStatus(checkoutId);
        if (res.data.status === 'success') {
          setTopUpMessage('Payment successful. Wallet updated.');
          setTopUpMessageType('success');
          setIsPolling(false);
          setCheckoutId(null);
          await fetchDashboardData();
          clearInterval(interval);
        } else if (res.data.status === 'failed') {
          setTopUpMessage('Payment failed. Please try again.');
          setTopUpMessageType('error');
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

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const balanceRes = await walletService.getBalance().catch(() => ({ data: { balance: 0 } }));
      setBalance(balanceRes.data.balance || 0);

      const zakatRes = await zakatService.getZakatDue().catch(() => ({ data: { zakatDue: 0 } }));
      setZakatDue(zakatRes.data.zakatDue || 0);

      const sadaqaRes = await sadaqaService.getSummary().catch(() => ({ data: { summary: { totalAmount: 0 } } }));
      setTotalSadaqa(sadaqaRes.data.summary?.totalAmount || 0);

      const txRes = await walletService.getTransactions({ limit: 20 }).catch(() => ({ data: { transactions: [] } }));
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
      
      setTransactions(txData);

      const spent = txData.filter((t: any) => t.amount < 0).reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
      const received = txData.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0);
      const donations = txData.filter((t: any) => t.type === 'sadaqa' || t.type === 'zakat').reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
      
      setStats({ monthlySpent: spent, monthlyReceived: received, totalDonations: donations });
      setActiveLoans(0);
      setNotificationCount(0);
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const toggleBalanceVisibility = () => setShowBalance(!showBalance);
  const toggleCardNumber = () => setShowCardNumber(!showCardNumber);
  const toggleTransactions = () => setShowTransactions(!showTransactions);

  const getMaskedCardNumber = () => {
    const userId = user?.id || '00000000';
    const lastFour = userId.slice(-4) || '0000';
    return `•••• •••• •••• ${lastFour}`;
  };

  const getFullCardNumber = () => {
    const userId = user?.id || '00000000';
    const padded = userId.padStart(16, '0').slice(0, 16);
    return padded.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleTopUp = async () => {
    const cleanPhone = topUpPhone.replace(/\+/g, '').replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setTopUpMessage('Please enter a valid phone number');
      setTopUpMessageType('error');
      return;
    }
    if (!topUpAmount || parseFloat(topUpAmount) < 10) {
      setTopUpMessage('Enter amount (minimum 10 KES)');
      setTopUpMessageType('error');
      return;
    }

    setTopUpLoading(true);
    setTopUpMessage('Sending payment request to M-Pesa...');
    setTopUpMessageType('info');

    try {
      const res = await mpesaService.stkPush({
        phone: cleanPhone,
        amount: parseInt(topUpAmount),
      });
      if (res.data.success) {
        setTopUpMessage('Check your phone and enter M-Pesa PIN to complete payment.');
        setTopUpMessageType('info');
        setCheckoutId(res.data.checkoutId);
        setIsPolling(true);
      }
    } catch (err: any) {
      setTopUpMessage(err.response?.data?.error || 'Payment failed. Please try again.');
      setTopUpMessageType('error');
    }
    setTopUpLoading(false);
  };

  const handleQuickAmount = (val: number) => {
    setTopUpAmount(val.toString());
  };

  const renderTransactionIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      sadaqa: 'S',
      zakat: 'Z',
      deposit: 'D',
      withdrawal: 'W',
      repayment: 'R',
      utility: 'U',
      payment: 'P',
      transfer: 'X',
      order: 'O',
      booking: 'B',
    };
    return iconMap[type] || '•';
  };

  if (loading) {
  return <LoadingSpinner message="Loading your dashboard..." />;
}

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B342B" translucent={false} />
      
      {/* ===== HEADER WITH BACKGROUND CURVE ===== */}
      <View style={{
        backgroundColor: '#0B342B',
        paddingTop: 12,
        paddingBottom: 0,
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* Content layer - sits on top of the background */}
        <View style={{ 
          paddingHorizontal: 20,
          paddingBottom: 30,
          position: 'relative',
          zIndex: 2,
        }}>
          <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
            
            {/* Header Content - Name and Notification */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
            }}>
              <View>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.4)', 
                  fontSize: 11, 
                  fontWeight: '400',
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}>
                  Assalamu alaykum,
                </Text>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 20, 
                  fontWeight: '600',
                  letterSpacing: -0.3,
                }}>
                  {user?.fullName?.split(' ')[0] || 'Guest'}
                </Text>
              </View>

              <TouchableOpacity 
                style={{ 
                  width: 40, 
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.05)',
                  position: 'relative',
                }}
                onPress={() => navigation.navigate('Notifications' as never)}
                activeOpacity={0.7}
              >
                <NotificationIcon />
                {notificationCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#C9A44B',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: '#0B342B',
                  }}>
                    <Text style={{ color: '#0B342B', fontSize: 8, fontWeight: '700' }}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Gold Accent Line */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 16,
            }}>
              <View style={{
                height: 1.5,
                flex: 1,
                backgroundColor: 'rgba(201, 164, 75, 0.1)',
              }} />
              <View style={{
                width: 32,
                height: 1.5,
                backgroundColor: '#C9A44B',
                marginHorizontal: 8,
                borderRadius: 2,
              }} />
              <View style={{
                height: 1.5,
                flex: 1,
                backgroundColor: 'rgba(201, 164, 75, 0.1)',
              }} />
            </View>
          </View>
        </View>

        {/* SVG Curve Background - positioned behind content */}
        <View style={{
          position: 'absolute',
          bottom: -20,
          left: 0,
          right: 0,
          height: 70,
          zIndex: 0,
        }}>
          <Svg 
            width={screenWidth} 
            height={70} 
            viewBox={`0 0 ${screenWidth} 70`}
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
            }}
          >
            <Defs>
              <LinearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0B342B" stopOpacity="1" />
                <Stop offset="100%" stopColor="#0B342B" stopOpacity="0.95" />
              </LinearGradient>
            </Defs>
            {/* Main curved background */}
            <Path
              d={`
                M 0 0 
                L 0 40 
                Q ${screenWidth * 0.12} 10, ${screenWidth * 0.3} 35 
                Q ${screenWidth * 0.5} 68, ${screenWidth * 0.7} 35 
                Q ${screenWidth * 0.88} 10, ${screenWidth} 40 
                L ${screenWidth} 0 
                Z
              `}
              fill="url(#curveGradient)"
            />
            {/* Gold accent curve */}
            <Path
              d={`
                M 0 41 
                Q ${screenWidth * 0.12} 11, ${screenWidth * 0.3} 36 
                Q ${screenWidth * 0.5} 69, ${screenWidth * 0.7} 36 
                Q ${screenWidth * 0.88} 11, ${screenWidth} 41
              `}
              stroke="rgba(201, 164, 75, 0.15)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Shadow for depth */}
            <Path
              d={`
                M 0 43 
                Q ${screenWidth * 0.12} 13, ${screenWidth * 0.3} 38 
                Q ${screenWidth * 0.5} 71, ${screenWidth * 0.7} 38 
                Q ${screenWidth * 0.88} 13, ${screenWidth} 43
              `}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="4"
              fill="none"
            />
          </Svg>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ 
          paddingTop: 8, 
          paddingHorizontal: 16, 
          paddingBottom: 32,
          marginTop: 0,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          
          {/* Error State */}
          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Text style={{ color: '#DC2626', fontSize: 12 }}>{error}</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#DC2626',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
                onPress={fetchDashboardData}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ===== ORIGINAL ITQAAN CARD ===== */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            marginTop: 4,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 6,
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: -80, right: -80, width: 160, height: 160, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -60, left: -60, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Image source={require("../../../assets/itqaan_logo.png")} style={{ height: 28, width: 100 }} resizeMode="contain" />
              <View style={{
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.2)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 7, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Sharia-Compliant
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: 'rgba(183, 192, 186, 0.5)', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                Card Number
              </Text>
              <Text style={{ color: '#F7F6F1', fontSize: 14, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 }}>
                {showCardNumber ? getFullCardNumber() : getMaskedCardNumber()}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: 'rgba(183, 192, 186, 0.5)', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Cardholder
                </Text>
                <Text style={{ color: '#F7F6F1', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {user?.fullName || 'Itqaan User'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: 'rgba(183, 192, 186, 0.5)', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Status
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: '#3FAF73', marginRight: 4 }} />
                  <Text style={{ color: '#3FAF73', fontSize: 9, fontWeight: '600' }}>Active</Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(201, 164, 75, 0.12)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(183, 192, 186, 0.5)', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Available Balance
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#F7F6F1', fontSize: 16, fontWeight: '700' }}>
                    {showBalance ? formatCurrency(balance) : '••••••'}
                  </Text>
                  <TouchableOpacity onPress={toggleBalanceVisibility}>
                    {showBalance ? <EyeIcon /> : <EyeOffIcon />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <Text style={{ color: '#6B7280', fontSize: 7, textAlign: 'center', marginBottom: 12 }}>
            Virtual card · Digital transactions only
          </Text>

          {/* Quick Actions */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Quick Actions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={{
                    width: '23%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(11, 52, 43, 0.08)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                  onPress={action.onPress || (() => navigation.navigate(action.route as never))}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: action.bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {action.icon}
                  </View>
                  <Text style={{
                    color: '#1F2937',
                    fontSize: 9,
                    fontWeight: '500',
                    textAlign: 'center',
                    marginTop: 6,
                  }}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Top Up Wallet */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(11, 52, 43, 0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>Top Up Wallet</Text>
                <View style={{
                  backgroundColor: 'rgba(63, 175, 115, 0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  marginTop: 2,
                  alignSelf: 'flex-start',
                }}>
                  <Text style={{ color: '#3FAF73', fontSize: 8, fontWeight: '500' }}>M-Pesa</Text>
                </View>
              </View>
              <Text style={{ color: '#6B7280', fontSize: 9 }}>Instant</Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Phone Number
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: '#1F2937',
                  fontSize: 12,
                }}
                value={topUpPhone}
                onChangeText={setTopUpPhone}
                placeholder="+254 7XX XXX XXX"
                placeholderTextColor="rgba(107, 114, 128, 0.5)"
                editable={!topUpLoading && !isPolling}
              />
              <Text style={{ color: '#6B7280', fontSize: 8, marginTop: 2 }}>Registered M-Pesa number</Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Amount (KES)
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#FAFAF7',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: '#1F2937',
                  fontSize: 12,
                }}
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                placeholder="Enter amount"
                placeholderTextColor="rgba(107, 114, 128, 0.5)"
                keyboardType="numeric"
                editable={!topUpLoading && !isPolling}
              />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {quickAmounts.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: parseFloat(topUpAmount) === val ? '#C9A44B' : '#F3F4F6',
                  }}
                  onPress={() => handleQuickAmount(val)}
                  disabled={topUpLoading || isPolling}
                >
                  <Text style={{
                    color: parseFloat(topUpAmount) === val ? '#FFFFFF' : '#6B7280',
                    fontSize: 9,
                    fontWeight: '600',
                  }}>
                    KES {val.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#0B342B',
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 8,
                  opacity: (topUpLoading || isPolling) ? 0.6 : 1,
                }}
                onPress={handleTopUp}
                disabled={topUpLoading || isPolling}
              >
                {topUpLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Sending...</Text>
                  </View>
                ) : isPolling ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Waiting...</Text>
                  </View>
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Pay via M-Pesa</Text>
                )}
              </TouchableOpacity>

              {isPolling && (
                <TouchableOpacity
                  onPress={() => {
                    setIsPolling(false);
                    setCheckoutId(null);
                    setTopUpMessage('Payment cancelled');
                    setTopUpMessageType('info');
                  }}
                >
                  <Text style={{ color: '#DC2626', fontSize: 12 }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {topUpMessage ? (
              <View style={{
                marginTop: 8,
                padding: 8,
                borderRadius: 8,
                backgroundColor: topUpMessageType === 'success' ? 'rgba(63, 175, 115, 0.1)' :
                               topUpMessageType === 'error' ? 'rgba(220, 38, 38, 0.1)' :
                               '#F3F4F6',
                borderWidth: 1,
                borderColor: topUpMessageType === 'success' ? 'rgba(63, 175, 115, 0.2)' :
                           topUpMessageType === 'error' ? 'rgba(220, 38, 38, 0.2)' :
                           '#E5E7EB',
              }}>
                <Text style={{
                  color: topUpMessageType === 'success' ? '#3FAF73' :
                         topUpMessageType === 'error' ? '#DC2626' :
                         '#6B7280',
                  fontSize: 11,
                }}>
                  {topUpMessage}
                </Text>
              </View>
            ) : null}

            <Text style={{ color: '#6B7280', fontSize: 8, textAlign: 'center', marginTop: 8 }}>
              Secured by M-Pesa · End-to-end encrypted
            </Text>
          </View>

          {/* Recent Transactions */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(11, 52, 43, 0.08)',
            overflow: 'hidden',
            shadowColor: '#000',
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
                padding: 16,
              }}
              onPress={toggleTransactions}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Recent Transactions</Text>
                <View style={{
                  backgroundColor: '#F3F4F6',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 10 }}>{transactions.length}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#6B7280', fontSize: 10 }}>{showTransactions ? 'Hide' : 'Show'}</Text>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>{showTransactions ? '▲' : '▼'}</Text>
              </View>
            </TouchableOpacity>

            {showTransactions ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {transactions.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <Text style={{ color: '#E5E7EB', fontSize: 40, marginBottom: 8 }}>—</Text>
                    <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>No transactions yet</Text>
                    <Text style={{ color: '#6B7280', fontSize: 10, marginTop: 4 }}>Start using Itqaan to see your activity</Text>
                  </View>
                ) : (
                  <>
                    {transactions.map((tx, i) => {
                      const isCredit = tx.amount > 0;
                      const isDebit = tx.amount < 0;
                      const absAmount = Math.abs(tx.amount);
                      const type = tx.type || 'payment';

                      return (
                        <View key={i} style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 8,
                          borderBottomWidth: i < transactions.length - 1 ? 1 : 0,
                          borderBottomColor: '#F3F4F6',
                        }}>
                          <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: '#F3F4F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                          }}>
                            <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700' }}>
                              {renderTransactionIcon(type)}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600' }}>
                                {tx.title || tx.description || type.charAt(0).toUpperCase() + type.slice(1)}
                              </Text>
                              <Text style={{
                                color: isCredit ? '#3FAF73' : '#DC2626',
                                fontSize: 12,
                                fontWeight: '700',
                              }}>
                                {isCredit ? '+' : ''}{showBalance ? formatCurrency(absAmount) : '••••••'}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <Text style={{ color: '#6B7280', fontSize: 9 }}>
                                {tx.date || tx.createdat ? new Date(tx.createdat).toLocaleDateString() : 'Today'}
                              </Text>
                              <View style={{
                                backgroundColor: '#F3F4F6',
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                borderRadius: 999,
                              }}>
                                <Text style={{ color: '#6B7280', fontSize: 8, textTransform: 'capitalize' }}>
                                  {type}
                                </Text>
                              </View>
                              {isCredit ? (
                                <View style={{
                                  backgroundColor: 'rgba(63, 175, 115, 0.1)',
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                  borderRadius: 999,
                                }}>
                                  <Text style={{ color: '#3FAF73', fontSize: 8, fontWeight: '600' }}>Incoming</Text>
                                </View>
                              ) : null}
                              {isDebit ? (
                                <View style={{
                                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                  borderRadius: 999,
                                }}>
                                  <Text style={{ color: '#DC2626', fontSize: 8, fontWeight: '600' }}>Outgoing</Text>
                                </View>
                              ) : null}
                              {tx.status && tx.status !== 'completed' && tx.status !== 'success' ? (
                                <View style={{
                                  backgroundColor: tx.status === 'pending' ? 'rgba(217, 119, 6, 0.1)' :
                                                    tx.status === 'failed' ? 'rgba(220, 38, 38, 0.1)' :
                                                    '#F3F4F6',
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                  borderRadius: 999,
                                }}>
                                  <Text style={{
                                    color: tx.status === 'pending' ? '#D97706' :
                                           tx.status === 'failed' ? '#DC2626' :
                                           '#6B7280',
                                    fontSize: 8,
                                    fontWeight: '600',
                                    textTransform: 'capitalize',
                                  }}>
                                    {tx.status}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      );
                    })}

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: '#F3F4F6',
                    }}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#6B7280', fontSize: 8 }}>Spent</Text>
                        <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '700' }}>
                          {showBalance ? formatCurrency(stats.monthlySpent) : '••••••'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#6B7280', fontSize: 8 }}>Received</Text>
                        <Text style={{ color: '#3FAF73', fontSize: 13, fontWeight: '700' }}>
                          {showBalance ? formatCurrency(stats.monthlyReceived) : '••••••'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#6B7280', fontSize: 8 }}>Donations</Text>
                        <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '700' }}>
                          {showBalance ? formatCurrency(stats.totalDonations) : '••••••'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={{ alignItems: 'center', marginTop: 12 }}
                      onPress={() => navigation.navigate('Wallet' as never)}
                    >
                      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600' }}>
                        View All Transactions →
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;