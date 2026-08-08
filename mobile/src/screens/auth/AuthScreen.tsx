import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const AuthScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const otpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // SVG Eye Icons
  const EyeIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(183, 192, 186, 0.6)" strokeWidth="1.5">
      <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <Path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </Svg>
  );

  const EyeOffIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(183, 192, 186, 0.6)" strokeWidth="1.5">
      <Path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </Svg>
  );

  useEffect(() => {
    if (otpSent && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [otpSent]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
      }
    };
  }, []);

  const startOtpCountdown = () => {
    setOtpExpirySeconds(30);
    
    if (otpTimerRef.current) {
      clearInterval(otpTimerRef.current);
    }
    
    otpTimerRef.current = setInterval(() => {
      setOtpExpirySeconds((prev) => {
        if (prev <= 1) {
          if (otpTimerRef.current) {
            clearInterval(otpTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      if (!otpSent) {
        const response = await authService.loginStep1(phone);
        setOtpSent(true);
        setResendTimer(60);
        setLoading(false);
        
        const receivedOtp = response.data?.otp || response.data?.code || '123456';
        setOtpCode(receivedOtp);
        startOtpCountdown();
        return;
      }

      const otpString = otp.join('');
      if (otpString.length < 6) {
        setError('Please enter all 6 digits');
        setLoading(false);
        return;
      }

      const response = await authService.loginStep2({ phone, pin, otp: otpString });
      const userData = response.data.user;
      
      if (userData.role === 'vendor' && userData.vendorStatus === 'pending') {
        setError('Your vendor application is pending admin approval.');
        setLoading(false);
        return;
      }

      if (userData.role === 'vendor' && userData.vendorStatus === 'rejected') {
        setError('Your vendor application has been rejected.');
        setLoading(false);
        return;
      }

      if (userData.role === 'leader' && userData.leaderStatus === 'pending') {
        setError('Your religious leader application is pending admin approval.');
        setLoading(false);
        return;
      }

      if (userData.role === 'leader' && userData.leaderStatus === 'rejected') {
        setError('Your religious leader application has been rejected.');
        setLoading(false);
        return;
      }
      
      await login(userData, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      const response = await authService.loginStep1(phone);
      setResendTimer(60);
      const receivedOtp = response.data?.otp || response.data?.code || '123456';
      setOtpCode(receivedOtp);
      startOtpCountdown();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend');
    }
    setLoading(false);
  };

  const togglePinVisibility = () => {
    setShowPin(!showPin);
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#032A24' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center' }}>
            {/* Card */}
            <View style={{
              backgroundColor: '#0B342B',
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.3)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
              overflow: 'hidden',
            }}>
              {/* Logo */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Image 
                  source={require('../../../assets/itqaan_logo.png')} 
                  style={{ height: 64, width: 200 }}
                  resizeMode="contain"
                />
              </View>

              {/* Tabs */}
              <View style={{ 
                flexDirection: 'row', 
                backgroundColor: '#032A24', 
                borderRadius: 12, 
                padding: 4, 
                marginBottom: 24 
              }}>
                <View style={{ 
                  flex: 1, 
                  paddingVertical: 10, 
                  borderRadius: 8, 
                  backgroundColor: '#C9A44B',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '700' }}>Sign In</Text>
                </View>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => navigation.navigate('RegisterRole' as never)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600' }}>Register</Text>
                </TouchableOpacity>
              </View>

              {/* Error/Success Messages */}
              {error ? (
                <View style={{ 
                  backgroundColor: '#032A24', 
                  borderWidth: 1, 
                  borderColor: 'rgba(201, 164, 75, 0.3)', 
                  borderRadius: 12, 
                  padding: 12, 
                  marginBottom: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#F7F6F1', fontSize: 12 }}>{error}</Text>
                  <TouchableOpacity onPress={() => setError('')}>
                    <Text style={{ color: 'rgba(183, 192, 186, 0.6)', fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {success ? (
                <View style={{ 
                  backgroundColor: '#032A24', 
                  borderWidth: 1, 
                  borderColor: 'rgba(63, 175, 115, 0.3)', 
                  borderRadius: 12, 
                  padding: 12, 
                  marginBottom: 16,
                }}>
                  <Text style={{ color: '#3FAF73', fontSize: 12 }}>{success}</Text>
                </View>
              ) : null}

              {/* Phone Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 10, 
                  fontWeight: '700', 
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}>
                  Phone Number
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#032A24',
                    borderWidth: 1,
                    borderColor: 'rgba(201, 164, 75, 0.3)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    color: '#F7F6F1',
                    fontSize: 14,
                  }}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+254 7XX XXX XXX"
                  placeholderTextColor="rgba(183, 192, 186, 0.5)"
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              {/* PIN Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 10, 
                  fontWeight: '700', 
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}>
                  PIN
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={{
                      backgroundColor: '#032A24',
                      borderWidth: 1,
                      borderColor: 'rgba(201, 164, 75, 0.3)',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      color: '#F7F6F1',
                      fontSize: 14,
                      paddingRight: 48,
                    }}
                    value={pin}
                    onChangeText={setPin}
                    placeholder="••••••"
                    placeholderTextColor="rgba(183, 192, 186, 0.5)"
                    secureTextEntry={!showPin}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 12, top: 10 }}
                    onPress={togglePinVisibility}
                  >
                    {showPin ? <EyeIcon /> : <EyeOffIcon />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* OTP Section */}
              {otpSent ? (
                <View style={{ marginTop: 8, marginBottom: 16 }}>
                  <View style={{
                    backgroundColor: '#032A24',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(201, 164, 75, 0.3)',
                    marginBottom: 12,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#C9A44B', fontSize: 16 }}>🔒</Text>
                        <View>
                          <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '500' }}>Your OTP Code</Text>
                          <Text style={{ 
                            color: '#E1C16B', 
                            fontSize: 18, 
                            fontWeight: '700', 
                            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                            letterSpacing: 2,
                            marginTop: 2,
                          }}>
                            {otpCode || '••••••'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ 
                          fontSize: 12, 
                          fontWeight: '700',
                          color: otpExpirySeconds <= 10 ? '#DC2626' : '#C9A44B',
                        }}>
                          {otpExpirySeconds > 0 ? formatTime(otpExpirySeconds) : 'Expired'}
                        </Text>
                        <View style={{
                          width: 64,
                          height: 4,
                          backgroundColor: '#032A24',
                          borderRadius: 999,
                          marginTop: 4,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: 'rgba(201, 164, 75, 0.3)',
                        }}>
                          <View style={{
                            height: '100%',
                            width: `${(otpExpirySeconds / 30) * 100}%`,
                            backgroundColor: otpExpirySeconds <= 10 ? '#DC2626' : '#E1C16B',
                            borderRadius: 999,
                          }} />
                        </View>
                      </View>
                    </View>
                    {otpExpirySeconds === 0 ? (
                      <Text style={{ color: '#DC2626', fontSize: 10, marginTop: 6 }}>OTP expired. Click "Resend Code" below.</Text>
                    ) : null}
                  </View>

                  <View>
                    <Text style={{ 
                      color: '#FFFFFF', 
                      fontSize: 10, 
                      fontWeight: '700', 
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}>
                      Enter Verification Code
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(el) => inputRefs.current[index] = el}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(index, text)}
                          onKeyPress={(e) => handleOtpKeyDown(index, e)}
                          style={{
                            width: 40,
                            height: 48,
                            backgroundColor: '#032A24',
                            borderWidth: 1,
                            borderColor: 'rgba(201, 164, 75, 0.3)',
                            borderRadius: 12,
                            textAlign: 'center',
                            color: '#F7F6F1',
                            fontSize: 16,
                            fontWeight: '700',
                          }}
                          keyboardType="numeric"
                          maxLength={1}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ color: 'rgba(183, 192, 186, 0.6)', fontSize: 10 }}>Enter the 6-digit code above</Text>
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={resendTimer > 0 || loading}
                    >
                      <Text style={{ 
                        color: resendTimer > 0 || loading ? 'rgba(201, 164, 75, 0.5)' : '#C9A44B', 
                        fontSize: 10, 
                        fontWeight: '700',
                      }}>
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Login Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#C9A44B',
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 8,
                  opacity: loading ? 0.6 : 1,
                }}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#032A24" />
                    <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>
                    {otpSent ? 'Verify & Sign In' : 'Send Verification Code'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(201, 164, 75, 0.2)', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(201, 164, 75, 0.4)', fontSize: 9, letterSpacing: 1 }}>
                  Secure · Encrypted · No Riba
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;