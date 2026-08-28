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
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import countriesData from 'world-countries';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Defs, ClipPath } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ============================================================
// Process countries data
// ============================================================
const processCountriesData = () => {
  try {
    return countriesData.map((country) => {
      let dialCode = '';
      if (country.idd) {
        const root = country.idd.root || '';
        const suffixes = country.idd.suffixes || [];
        dialCode = root + (suffixes.length > 0 ? suffixes[0] : '');
      }
      return {
        name: country.name?.common || country.name || '',
        alpha2: country.cca2 || '',
        dialCode: dialCode,
        flag: country.flag || '🏳️',
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error processing countries data:', error);
    return [];
  }
};

// ============================================================
// Premium Eye Icons with Brand Colors
// ============================================================
const EyeIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5C6 5 2 12 2 12C2 12 6 19 12 19C18 19 22 12 22 12C22 12 18 5 12 5Z"
      stroke="#C9A44B"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="#C9A44B"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeOffIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5C6 5 2 12 2 12C2 12 6 19 12 19C18 19 22 12 22 12C22 12 18 5 12 5Z"
      stroke="#6B7280"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="#6B7280"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 3L21 21"
      stroke="#6B7280"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============================================================
// CountrySelect Component
// ============================================================
const CountrySelect = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const allCountries = React.useMemo(() => processCountriesData(), []);
  const selectedCountry = allCountries.find(c => c.alpha2 === value) || allCountries[0];
  
  const filteredCountries = allCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.alpha2.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  const handleSelect = (country) => {
    onChange(country);
    setSearchTerm('');
    // Close modal after a small delay to ensure parent state updates
    setTimeout(() => {
      setIsOpen(false);
    }, 50);
  };

  if (allCountries.length === 0) {
    return (
      <View style={{
        backgroundColor: '#032A24',
        borderWidth: 1,
        borderColor: 'rgba(201, 164, 75, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{ color: '#6B7280', fontSize: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={{
          backgroundColor: '#032A24',
          borderWidth: 1,
          borderColor: 'rgba(201, 164, 75, 0.3)',
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 10,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onPress={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Text style={{ fontSize: 22 }}>{selectedCountry?.flag || '🏳️'}</Text>
        <Text style={{ color: '#6B7280', fontSize: 10, marginLeft: 4 }}>
          {isOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
          keyboardShouldPersistTaps="always"
        >
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 16,
            width: '100%',
            maxWidth: 400,
            maxHeight: 400,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.3)',
          }}>
            <TextInput
              style={{
                backgroundColor: '#032A24',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.3)',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: '#F7F6F1',
                fontSize: 14,
                marginBottom: 12,
              }}
              placeholder="Search country..."
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.alpha2}
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 280 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(201, 164, 75, 0.08)',
                  }}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{item.flag}</Text>
                  <Text style={{ color: '#F7F6F1', fontSize: 14, flex: 1 }}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text style={{ color: '#6B7280', textAlign: 'center', padding: 20 }}>No countries found</Text>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ============================================================
// PIN Popup Component with Logo
// ============================================================
const PinPopup = ({ visible, onClose, onVerify, loading, error }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (visible && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setPin(['', '', '', '']);
    }
  }, [visible]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(0, 1);
    setPin(newPin);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.nativeEvent.key === 'Enter') {
      const pinString = pin.join('');
      if (pinString.length === 4) {
        onVerify(pinString);
      }
    }
  };

  const handleSubmit = () => {
    const pinString = pin.join('');
    if (pinString.length === 4) {
      onVerify(pinString);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{
          backgroundColor: '#0B342B',
          borderRadius: 28,
          padding: 24,
          width: '100%',
          maxWidth: 360,
          borderWidth: 1,
          borderColor: 'rgba(201, 164, 75, 0.3)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 12,
        }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={require('../../../assets/itqaan_logo.png')}
              style={{ height: 48, width: 160 }}
              resizeMode="contain"
            />
          </View>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: '#032A24',
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 28 }}>🔒</Text>
            </View>
            <Text style={{ color: '#F7F6F1', fontSize: 20, fontWeight: '700' }}>
              Enter Your PIN
            </Text>
            <Text style={{ color: '#B7C0BA', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
              Enter your 4-digit transaction PIN to continue
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            {pin.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                value={digit}
                onChangeText={(text) => handleChange(index, text)}
                onKeyPress={(e) => handleKeyDown(index, e)}
                style={{
                  width: 52,
                  height: 56,
                  backgroundColor: '#032A24',
                  borderWidth: 1,
                  borderColor: digit ? '#C9A44B' : 'rgba(201, 164, 75, 0.3)',
                  borderRadius: 14,
                  textAlign: 'center',
                  color: '#F7F6F1',
                  fontSize: 22,
                  fontWeight: '700',
                }}
                keyboardType="numeric"
                maxLength={1}
                secureTextEntry
              />
            ))}
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#032A24',
              borderWidth: 1,
              borderColor: 'rgba(220, 38, 38, 0.3)',
              borderRadius: 10,
              padding: 10,
              marginBottom: 12,
            }}>
              <Text style={{ color: '#DC2626', fontSize: 12, textAlign: 'center' }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#032A24',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.2)',
              }}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={{ color: '#B7C0BA', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 2,
                backgroundColor: '#C9A44B',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                opacity: (loading || pin.join('').length < 4) ? 0.6 : 1,
              }}
              onPress={handleSubmit}
              disabled={loading || pin.join('').length < 4}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#032A24" />
                  <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Verifying...</Text>
                </View>
              ) : (
                <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Verify PIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================================
// AuthScreen Component - 2-Step Login
// ============================================================
const AuthScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // PIN Popup state
  const [showPinPopup, setShowPinPopup] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  // Set default country to Kenya
  useEffect(() => {
    const allCountries = processCountriesData();
    const kenya = allCountries.find(c => c.alpha2 === 'KE');
    if (kenya) {
      setSelectedCountry(kenya);
    } else if (allCountries.length > 0) {
      setSelectedCountry(allCountries[0]);
    }
  }, []);

  // Auto-populate phone with dial code when country changes
  useEffect(() => {
    if (selectedCountry) {
      const dialCode = selectedCountry.dialCode;
      if (!phone.startsWith(dialCode)) {
        setPhone(dialCode);
      }
    }
  }, [selectedCountry]);

  const getFullPhoneNumber = () => {
    if (!selectedCountry) return phone;
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    return `${selectedCountry.dialCode}${cleanPhone}`;
  };

  const isValidPhone = (phoneStr) => {
    const clean = phoneStr.replace(/\s/g, '');
    let local = clean;
    if (selectedCountry && clean.startsWith(selectedCountry.dialCode)) {
      local = clean.substring(selectedCountry.dialCode.length);
    } else if (clean.startsWith('+')) {
      local = clean.replace(/^\+?\d+/, '');
    }
    const digits = local.replace(/[^0-9]/g, '');
    return digits.length >= 6;
  };

  // Step 1: Validate Phone + Password, then show PIN popup
  const handlePasswordSubmit = async () => {
    setError('');
    setLoading(true);

    if (!selectedCountry) {
      setError('Please select your country.');
      setLoading(false);
      return;
    }

    const cleanPhone = phone.replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      setError('Please enter a valid phone number (minimum 6 digits).');
      setLoading(false);
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    const fullPhone = getFullPhoneNumber();

    try {
      const response = await authService.validatePassword({
        phone: fullPhone,
        password: password,
      });

      setTempUserData({
        phone: fullPhone,
        userData: response.data.user,
      });
      setShowPinPopup(true);
      setPinError('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid password. Please try again.');
      setLoading(false);
    }
  };

  // Step 2: Verify PIN and complete login
  const handlePinVerify = async (pin) => {
    setPinLoading(true);
    setPinError('');

    try {
      const response = await authService.verifyPin({
        phone: tempUserData.phone,
        pin: pin,
      });

      const userData = response.data.user;

      if (userData.role === 'vendor' && userData.vendorStatus === 'pending') {
        setPinError('Your vendor application is pending admin approval.');
        setPinLoading(false);
        return;
      }

      if (userData.role === 'vendor' && userData.vendorStatus === 'rejected') {
        setPinError('Your vendor application has been rejected.');
        setPinLoading(false);
        return;
      }

      if (userData.role === 'leader' && userData.leaderStatus === 'pending') {
        setPinError('Your religious leader application is pending admin approval.');
        setPinLoading(false);
        return;
      }

      if (userData.role === 'leader' && userData.leaderStatus === 'rejected') {
        setPinError('Your religious leader application has been rejected.');
        setPinLoading(false);
        return;
      }

      setShowPinPopup(false);
      setPinLoading(false);
      await login(userData, response.data.token);
    } catch (err) {
      setPinError(err.response?.data?.error || 'Invalid PIN. Please try again.');
      setPinLoading(false);
    }
  };

  const handlePinPopupClose = () => {
    setShowPinPopup(false);
    setPinError('');
    setTempUserData(null);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#032A24' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="always"
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

              {/* Phone Input with Country Select */}
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
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={{ width: 55 }}>
                    <CountrySelect 
                      value={selectedCountry?.alpha2 || 'KE'}
                      onChange={setSelectedCountry}
                      disabled={loading}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={{
                        backgroundColor: '#032A24',
                        borderWidth: 1,
                        borderColor: 'rgba(201, 164, 75, 0.3)',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#F7F6F1',
                        fontSize: 14,
                        height: 44,
                      }}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="712345678"
                      placeholderTextColor="rgba(183, 192, 186, 0.5)"
                      keyboardType="phone-pad"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 10, 
                  fontWeight: '700', 
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}>
                  Password
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
                      height: 44,
                      paddingRight: 48,
                    }}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(183, 192, 186, 0.5)"
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 12, top: 10 }}
                    onPress={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#C9A44B',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 8,
                  opacity: loading ? 0.6 : 1,
                  height: 48,
                }}
                onPress={handlePasswordSubmit}
                disabled={loading}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#032A24" />
                    <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Verifying...</Text>
                  </View>
                ) : (
                  <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Continue</Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity
                style={{ marginTop: 12, alignItems: 'center' }}
                onPress={() => navigation.navigate('ForgotPassword' as never)}
              >
                <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 11 }}>
                  Forgot Password?
                </Text>
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

      {/* PIN Popup */}
      <PinPopup
        visible={showPinPopup}
        onClose={handlePinPopupClose}
        onVerify={handlePinVerify}
        loading={pinLoading}
        error={pinError}
      />
    </SafeAreaView>
  );
};

export default AuthScreen;