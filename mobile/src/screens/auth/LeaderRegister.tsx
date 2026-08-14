import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../api/client';
import countriesData from 'world-countries';

// Location API configuration
const LOCATION_API_BASE = 'https://kenyaareadata.vercel.app/api/areas';
const LOCATION_API_KEY = 'keyPub1569gsvndc123kg9sjhg';

// Cache
let cachedAreas: any = null;
let countiesCache: any[] = [];
let subCountiesCache: { [key: string]: any[] } = {};
let wardsCache: { [key: string]: any[] } = {};

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
    setIsOpen(false);
    setSearchTerm('');
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
              autoFocus
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.alpha2}
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 280 }}
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

const LeaderRegister = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const otpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Country selection state
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Location states
  const [counties, setCounties] = useState<any[]>([]);
  const [subCounties, setSubCounties] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  // Modal visibility states
  const [showCountyModal, setShowCountyModal] = useState(false);
  const [showSubCountyModal, setShowSubCountyModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [showLeaderTypeModal, setShowLeaderTypeModal] = useState(false);

  const LEADER_TYPES = [
    { id: 'islamic_scholar', label: 'Islamic Scholar' },
    { id: 'imam', label: 'Imam' },
    { id: 'adhan_caller', label: 'Adhan Caller' },
    { id: 'ustadh', label: 'Ustadh' },
    { id: 'ustadha', label: 'Ustadha' },
    { id: 'kadhi', label: 'Kadhi' },
  ];

  const CONSULTATION_TYPES = ['video', 'in-person', 'phone', 'chat'];

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    pin: '',
    leaderType: '',
    location: '',
    region: '',
    regionName: '',
    subCounty: '',
    subCountyName: '',
    ward: '',
    wardName: '',
    mosqueName: '',
    mosqueLocation: '',
    qualifications: '',
    yearsOfService: '',
    bio: '',
    institution: '',
    consultationFee: '',
    consultationTypes: [] as string[],
    termsAccepted: false,
  });

  // Set default country to Kenya
  useEffect(() => {
    const allCountries = processCountriesData();
    const kenya = allCountries.find(c => c.alpha2 === 'KE');
    if (kenya) {
      setSelectedCountry(kenya);
      setFormData(prev => ({
        ...prev,
        phone: kenya.dialCode
      }));
    } else if (allCountries.length > 0) {
      setSelectedCountry(allCountries[0]);
      setFormData(prev => ({
        ...prev,
        phone: allCountries[0].dialCode
      }));
    }
  }, []);

  // Update phone when country changes
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setFormData(prev => ({
      ...prev,
      phone: country.dialCode
    }));
  };

  // Get full phone number for backend
  const getFullPhoneNumber = () => {
    if (!selectedCountry) return formData.phone;
    const cleanPhone = formData.phone.replace(/\s/g, '');
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    return `${selectedCountry.dialCode}${cleanPhone}`;
  };

  // Validate phone has at least 6 digits after the country code
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

  useEffect(() => {
    fetchCounties();
  }, []);

  useEffect(() => {
    if (formData.regionName) {
      fetchSubCounties(formData.regionName);
      setFormData(prev => ({
        ...prev,
        subCounty: '',
        subCountyName: '',
        ward: '',
        wardName: '',
      }));
    }
  }, [formData.regionName]);

  useEffect(() => {
    if (formData.regionName && formData.subCountyName) {
      fetchWards(formData.regionName, formData.subCountyName);
      setFormData(prev => ({
        ...prev,
        ward: '',
        wardName: '',
      }));
    }
  }, [formData.regionName, formData.subCountyName]);

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (otpSent && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [otpSent]);

  // ================== LOCATION API FUNCTIONS ==================
  
  const getAreas = async () => {
    if (cachedAreas) return cachedAreas;

    try {
      const response = await fetch(`${LOCATION_API_BASE}?apiKey=${LOCATION_API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch Kenya area data');
      const data = await response.json();
      cachedAreas = data;
      return data;
    } catch (error) {
      console.error('Error fetching area data:', error);
      throw error;
    }
  };

  const fetchCounties = async () => {
    if (countiesCache.length > 0) {
      setCounties(countiesCache);
      return;
    }

    try {
      const areas = await getAreas();
      const countiesData = Object.keys(areas).map(name => ({
        id: name,
        name: name
      }));
      countiesCache = countiesData;
      setCounties(countiesData);
    } catch (error) {
      console.error('Error fetching counties:', error);
      setError('Failed to load counties. Please try again.');
    }
  };

  const fetchSubCounties = async (countyName: string) => {
    if (subCountiesCache[countyName]) {
      setSubCounties(subCountiesCache[countyName]);
      return;
    }

    try {
      const areas = await getAreas();
      const county = areas[countyName];
      if (!county) {
        throw new Error(`County "${countyName}" not found`);
      }
      const subCountiesData = Object.keys(county).map(name => ({
        id: name,
        name: name
      }));
      subCountiesCache[countyName] = subCountiesData;
      setSubCounties(subCountiesData);
    } catch (error) {
      console.error(`Error fetching sub-counties for ${countyName}:`, error);
      setSubCounties([]);
    }
  };

  const fetchWards = async (countyName: string, subCountyName: string) => {
    const cacheKey = `${countyName}|${subCountyName}`;
    if (wardsCache[cacheKey]) {
      setWards(wardsCache[cacheKey]);
      return;
    }

    try {
      const areas = await getAreas();
      const county = areas[countyName];
      if (!county) {
        throw new Error(`County "${countyName}" not found`);
      }
      const subCounty = county[subCountyName];
      if (!subCounty) {
        throw new Error(`Sub-county "${subCountyName}" not found in ${countyName}`);
      }
      const wardsData = subCounty.map((name: string) => ({
        id: name,
        name: name
      }));
      wardsCache[cacheKey] = wardsData;
      setWards(wardsData);
    } catch (error) {
      console.error(`Error fetching wards for ${countyName}/${subCountyName}:`, error);
      setWards([]);
    }
  };

  // ================== OTP FUNCTIONS ==================

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

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePhoneChange = (text: string) => {
    // Ensure the dial code stays at the beginning
    if (selectedCountry && !text.startsWith(selectedCountry.dialCode)) {
      setFormData({ ...formData, phone: selectedCountry.dialCode });
    } else {
      setFormData({ ...formData, phone: text });
    }
  };

  const toggleConsultationType = (type: string) => {
    const current = formData.consultationTypes || [];
    if (current.includes(type)) {
      setFormData({ ...formData, consultationTypes: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, consultationTypes: [...current, type] });
    }
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

  const handleSendOtp = async () => {
    const fullPhone = getFullPhoneNumber();
    
    if (!fullPhone || fullPhone.length < 8) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!isValidPhone(fullPhone)) {
      setError('Please enter a valid phone number (minimum 6 digits).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.sendRegistrationOtp({
        phone: fullPhone,
        email: formData.email,
      });

      const otp = response.data?.otp || response.data?.data?.otp;

      if (otp) {
        setOtpCode(otp);
        setOtpSent(true);
        setResendTimer(60);
        startOtpCountdown();
        setSuccess('Verification code sent');
        setTimeout(() => setSuccess(''), 3000);

        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0]?.focus();
          }
        }, 300);
      } else {
        setError('Failed to get OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    const fullPhone = getFullPhoneNumber();

    setLoading(true);
    setError('');
    try {
      const response = await authService.sendRegistrationOtp({
        phone: fullPhone,
        email: formData.email,
      });

      const otp = response.data?.otp || response.data?.data?.otp;

      if (otp) {
        setOtpCode(otp);
        setResendTimer(60);
        startOtpCountdown();
        setSuccess('Code resent');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setError('');
    setSuccess('');

    if (step === 1 && (!formData.fullName || !formData.leaderType || !formData.location || !formData.region || !formData.subCounty || !formData.ward)) {
      setError('Please fill in all required fields');
      return;
    }
    // Step 2 validation now checks the full phone number
    if (step === 2) {
      const fullPhone = getFullPhoneNumber();
      if (!fullPhone || fullPhone.length < 8) {
        setError('Please enter a valid phone number.');
        return;
      }
      if (!isValidPhone(fullPhone)) {
        setError('Please enter a valid phone number (minimum 6 digits).');
        return;
      }
      if (!formData.email) {
        setError('Please enter your email address.');
        return;
      }
    }
    if (step === 3 && (!formData.nationalId || !formData.pin || formData.pin.length < 4)) {
      setError('Please enter a valid National ID and PIN (min 4 digits)');
      return;
    }
    if (step === 4 && !formData.qualifications) {
      setError('Please enter your qualifications');
      return;
    }
    if (step === 5 && !formData.termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }
    setStep(step + 1);
    setError('');
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }

    const fullPhone = getFullPhoneNumber();

    setLoading(true);
    setError('');
    try {
      const verifyResponse = await authService.verifyRegistrationOtp({
        phone: fullPhone,
        otp: otpString,
      });

      if (!verifyResponse.data.success) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      await authService.registerLeader({
        fullName: formData.fullName,
        phone: fullPhone,
        email: formData.email,
        nationalId: formData.nationalId,
        pin: formData.pin,
        leaderType: formData.leaderType,
        location: formData.location,
        region: formData.regionName,
        subCounty: formData.subCountyName,
        ward: formData.wardName,
        mosqueName: formData.mosqueName || null,
        mosqueLocation: formData.mosqueLocation || null,
        qualifications: formData.qualifications.split(',').map(q => q.trim()),
        yearsOfService: parseInt(formData.yearsOfService) || 0,
        bio: formData.bio || null,
        institution: formData.institution || null,
        consultationFee: parseInt(formData.consultationFee) || 0,
        consultationTypes: formData.consultationTypes.length > 0 ? formData.consultationTypes : ['video'],
        availableForConsultation: formData.consultationTypes.length > 0,
        termsAccepted: formData.termsAccepted,
      });

      setStep(7);
      const leaderLabel = LEADER_TYPES.find(t => t.id === formData.leaderType)?.label || 'Leader';
      setSuccess(`${leaderLabel} application submitted successfully!`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  // ================== RENDER MODAL ==================

  const renderLocationModal = (
    visible: boolean,
    setVisible: (visible: boolean) => void,
    data: any[],
    title: string,
    onSelect: (item: any) => void,
    selectedName?: string
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: '#0B342B',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          maxHeight: '60%',
          borderWidth: 1,
          borderColor: 'rgba(201, 164, 75, 0.3)',
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(201, 164, 75, 0.2)',
          }}>
            <Text style={{ color: '#F7F6F1', fontSize: 18, fontWeight: '700' }}>
              {title}
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <View style={{
                backgroundColor: '#032A24',
                width: 32,
                height: 32,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.3)',
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 16, fontWeight: '700' }}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>

          {data.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>No options available</Text>
              <TouchableOpacity 
                style={{ marginTop: 12 }}
                onPress={() => {
                  setVisible(false);
                  fetchCounties();
                }}
              >
                <Text style={{ color: '#C9A44B', fontSize: 14 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(201, 164, 75, 0.1)',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={{ color: '#F7F6F1', fontSize: 15 }}>
                    {item.name || item.label}
                  </Text>
                  {selectedName === item.name && (
                    <Text style={{ color: '#C9A44B', fontSize: 16 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  // ================== RENDER STEP INDICATOR ==================

  const renderStepIndicator = () => {
    const current = step > 6 ? 6 : step;
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: i <= current ? '#C9A44B' : '#032A24',
              borderWidth: i > current ? 1 : 0,
              borderColor: 'rgba(201, 164, 75, 0.2)',
            }}>
              <Text style={{
                color: i <= current ? '#032A24' : '#6B7280',
                fontSize: 11,
                fontWeight: '700',
              }}>
                {i < current ? '✓' : i}
              </Text>
            </View>
            {i < 6 && (
              <View style={{
                width: 16,
                height: 2,
                backgroundColor: i < current ? '#C9A44B' : 'rgba(201, 164, 75, 0.2)',
              }} />
            )}
          </View>
        ))}
      </View>
    );
  };

  // ================== RENDER STEP ==================

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={{ marginTop: 4 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#F7F6F1', fontSize: 16, fontWeight: '700' }}>Leader Information</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Tell us about yourself</Text>
            </View>

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
                marginBottom: 12,
              }}
              placeholder="Full Name *"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              value={formData.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
            />

            <TouchableOpacity
              style={{
                backgroundColor: '#032A24',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.3)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onPress={() => setShowLeaderTypeModal(true)}
            >
              <Text style={{
                color: formData.leaderType ? '#F7F6F1' : '#6B7280',
                fontSize: 14,
              }}>
                {formData.leaderType ? LEADER_TYPES.find(t => t.id === formData.leaderType)?.label : 'Select Leader Type *'}
              </Text>
              <Text style={{ color: '#C9A44B', fontSize: 16 }}>▼</Text>
            </TouchableOpacity>

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
                marginBottom: 12,
              }}
              placeholder="Specific Location/Address *"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              value={formData.location}
              onChangeText={(text) => handleChange('location', text)}
            />

            <TouchableOpacity
              style={{
                backgroundColor: '#032A24',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.3)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onPress={() => setShowCountyModal(true)}
            >
              <Text style={{
                color: formData.regionName ? '#F7F6F1' : '#6B7280',
                fontSize: 14,
              }}>
                {formData.regionName || 'Select County *'}
              </Text>
              <Text style={{ color: '#C9A44B', fontSize: 16 }}>▼</Text>
            </TouchableOpacity>

            {formData.region && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.3)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => setShowSubCountyModal(true)}
              >
                <Text style={{
                  color: formData.subCountyName ? '#F7F6F1' : '#6B7280',
                  fontSize: 14,
                }}>
                  {formData.subCountyName || 'Select Sub-County *'}
                </Text>
                <Text style={{ color: '#C9A44B', fontSize: 16 }}>▼</Text>
              </TouchableOpacity>
            )}

            {formData.subCounty && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.3)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => setShowWardModal(true)}
              >
                <Text style={{
                  color: formData.wardName ? '#F7F6F1' : '#6B7280',
                  fontSize: 14,
                }}>
                  {formData.wardName || 'Select Ward *'}
                </Text>
                <Text style={{ color: '#C9A44B', fontSize: 16 }}>▼</Text>
              </TouchableOpacity>
            )}

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
                marginBottom: 12,
              }}
              placeholder="Mosque Name (Optional)"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              value={formData.mosqueName}
              onChangeText={(text) => handleChange('mosqueName', text)}
            />

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
              placeholder="Mosque Location (Optional)"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              value={formData.mosqueLocation}
              onChangeText={(text) => handleChange('mosqueLocation', text)}
            />
          </View>
        );

      case 2:
        return (
          <View style={{ marginTop: 4 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#F7F6F1', fontSize: 16, fontWeight: '700' }}>Contact Information</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>How can we reach you?</Text>
            </View>

            {/* Phone Input with Country Select */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 55 }}>
                <CountrySelect 
                  value={selectedCountry?.alpha2 || 'KE'}
                  onChange={handleCountryChange}
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
                  value={formData.phone}
                  onChangeText={handlePhoneChange}
                  placeholder="712345678"
                  placeholderTextColor="rgba(183, 192, 186, 0.5)"
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

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
              placeholder="Email Address *"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
            />
          </View>
        );

      case 3:
        return (
          <View style={{ marginTop: 4 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#F7F6F1', fontSize: 16, fontWeight: '700' }}>ID & Security</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Verify your identity</Text>
            </View>

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
                marginBottom: 12,
              }}
              placeholder="National ID *"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              keyboardType="numeric"
              value={formData.nationalId}
              onChangeText={(text) => handleChange('nationalId', text)}
            />

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
              placeholder="Create PIN *"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              secureTextEntry
              maxLength={6}
              keyboardType="numeric"
              value={formData.pin}
              onChangeText={(text) => handleChange('pin', text)}
            />
            <Text style={{ color: 'rgba(183, 192, 186, 0.6)', fontSize: 10, marginTop: 6 }}>
              PIN must be at least 4 digits
            </Text>
          </View>
        );

      case 4:
        return (
          <View style={{ marginTop: 4 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#F7F6F1', fontSize: 16, fontWeight: '700' }}>Qualifications & Consultation</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Tell us about your qualifications and services</Text>
            </View>

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
                marginBottom: 12,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Qualifications (e.g., Bachelors Islamic Studies, Masters Theology) *"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              multiline
              value={formData.qualifications}
              onChangeText={(text) => handleChange('qualifications', text)}
            />
            <Text style={{ color: 'rgba(183, 192, 186, 0.6)', fontSize: 10, marginBottom: 12 }}>
              Separate multiple qualifications with commas
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
                marginBottom: 12,
              }}
              placeholder="Years of Service"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              keyboardType="numeric"
              value={formData.yearsOfService}
              onChangeText={(text) => handleChange('yearsOfService', text)}
            />

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
                marginBottom: 12,
              }}
              placeholder="Institution (Optional)"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              value={formData.institution}
              onChangeText={(text) => handleChange('institution', text)}
            />

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
                marginBottom: 12,
              }}
              placeholder="Consultation Fee (KES) - Optional"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              keyboardType="numeric"
              value={formData.consultationFee}
              onChangeText={(text) => handleChange('consultationFee', text)}
            />

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', marginBottom: 8 }}>
                Consultation Types (Optional)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CONSULTATION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: formData.consultationTypes.includes(type) ? '#C9A44B' : '#032A24',
                      borderWidth: 1,
                      borderColor: formData.consultationTypes.includes(type) ? '#C9A44B' : 'rgba(201, 164, 75, 0.3)',
                    }}
                    onPress={() => toggleConsultationType(type)}
                  >
                    <Text style={{
                      color: formData.consultationTypes.includes(type) ? '#032A24' : '#6B7280',
                      fontSize: 11,
                      fontWeight: formData.consultationTypes.includes(type) ? '700' : '500',
                    }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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
                minHeight: 60,
                textAlignVertical: 'top',
              }}
              placeholder="Bio / About You (Optional)"
              placeholderTextColor="rgba(183, 192, 186, 0.5)"
              multiline
              value={formData.bio}
              onChangeText={(text) => handleChange('bio', text)}
            />
          </View>
        );

      case 5:
        return (
          <View style={{ marginTop: 4 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#F7F6F1', fontSize: 16, fontWeight: '700' }}>Terms & Conditions</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Please confirm the following to proceed</Text>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#032A24',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.3)',
              }}
              onPress={() => handleChange('termsAccepted', !formData.termsAccepted)}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: formData.termsAccepted ? '#C9A44B' : 'rgba(201, 164, 75, 0.3)',
                backgroundColor: formData.termsAccepted ? '#C9A44B' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                {formData.termsAccepted && (
                  <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '700' }}>✓</Text>
                )}
              </View>
              <Text style={{ color: '#F7F6F1', fontSize: 13, flex: 1 }}>
                I accept Itqaan's Terms & Conditions
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 6:
        return (
          <View style={{ marginTop: 4 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#F7F6F1', fontSize: 16, fontWeight: '700' }}>Verify Your Identity</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Enter the 6-digit code sent to your phone</Text>
            </View>

            {otpSent && (
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
                      {otpExpirySeconds > 0 ? `${otpExpirySeconds}s` : 'Expired'}
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
                {otpExpirySeconds === 0 && (
                  <Text style={{ color: '#DC2626', fontSize: 10, marginTop: 6 }}>OTP expired. Click "Resend Code" below.</Text>
                )}
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'rgba(183, 192, 186, 0.6)', fontSize: 10 }}>
                {otpSent ? 'Enter the code above' : 'Click "Send Code" to receive OTP'}
              </Text>
              <TouchableOpacity
                onPress={otpSent ? handleResendOtp : handleSendOtp}
                disabled={(otpSent && resendTimer > 0) || loading}
              >
                <Text style={{
                  color: (otpSent && resendTimer > 0) || loading ? 'rgba(201, 164, 75, 0.5)' : '#C9A44B',
                  fontSize: 10,
                  fontWeight: '700',
                }}>
                  {otpSent
                    ? (resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code')
                    : 'Send Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 7:
        const leaderLabel = LEADER_TYPES.find(t => t.id === formData.leaderType)?.label || 'Leader';
        return (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: '#032A24',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(63, 175, 115, 0.3)',
            }}>
              <Text style={{ color: '#3FAF73', fontSize: 32 }}>✓</Text>
            </View>
            <Text style={{ color: '#F7F6F1', fontSize: 20, fontWeight: '700' }}>Application Submitted</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
              Your {leaderLabel} application is under review.{'\n'}
              We'll notify you once approved.
            </Text>
            <View style={{
              backgroundColor: '#032A24',
              borderRadius: 12,
              padding: 12,
              width: '100%',
              marginTop: 16,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.3)',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Name:</Text>
                <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '500' }}>{formData.fullName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Type:</Text>
                <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '500' }}>{leaderLabel}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Location:</Text>
                <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '500' }}>{formData.location}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Email:</Text>
                <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '500' }}>{formData.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#C9A44B',
                paddingVertical: 10,
                paddingHorizontal: 24,
                borderRadius: 12,
                marginTop: 24,
              }}
              onPress={() => navigation.navigate('Auth' as never)}
            >
              <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Return to Login</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // ================== MAIN RENDER ==================

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#032A24' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Image
                source={require('../../../assets/itqaan_logo.png')}
                style={{ height: 48, width: 160 }}
                resizeMode="contain"
              />
            </View>

            <View style={{
              backgroundColor: '#0B342B',
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.3)',
            }}>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#F7F6F1', fontSize: 18, fontWeight: '700' }}>
                  {step > 6 ? 'Complete!' : `Step ${step} of 6`}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>
                  {step > 6 ? 'Your application is submitted' : 'Fill in your details to continue'}
                </Text>
              </View>

              {step <= 6 && renderStepIndicator()}

              {error ? (
                <View style={{
                  backgroundColor: '#032A24',
                  borderWidth: 1,
                  borderColor: 'rgba(220, 38, 38, 0.3)',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#DC2626', fontSize: 12 }}>{error}</Text>
                  <TouchableOpacity onPress={() => setError('')}>
                    <Text style={{ color: 'rgba(220, 38, 38, 0.6)', fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {success && step === 7 ? (
                <View style={{
                  backgroundColor: '#032A24',
                  borderWidth: 1,
                  borderColor: 'rgba(63, 175, 115, 0.3)',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}>
                  <Text style={{ color: '#3FAF73', fontSize: 12 }}>{success}</Text>
                </View>
              ) : null}

              {renderStep()}

              {step >= 1 && step <= 5 ? (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  {step > 1 ? (
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: '#032A24',
                        paddingVertical: 10,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                      onPress={handleBack}
                    >
                      <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 12 }}>Back</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={{
                      flex: step > 1 ? 2 : 1,
                      backgroundColor: '#C9A44B',
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                    onPress={handleNext}
                  >
                    <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>
                      {step === 5 ? 'Submit Application' : 'Continue'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {step === 6 ? (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#032A24',
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                    onPress={handleBack}
                  >
                    <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 12 }}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 2,
                      backgroundColor: '#C9A44B',
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      opacity: loading ? 0.6 : 1,
                    }}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color="#032A24" />
                        <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Submitting...</Text>
                      </View>
                    ) : (
                      <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Verify & Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(201, 164, 75, 0.2)', alignItems: 'center' }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>
                  Already have an account?{' '}
                  <Text
                    style={{ color: '#C9A44B', fontWeight: '600' }}
                    onPress={() => navigation.navigate('Auth' as never)}
                  >
                    Sign In
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* County Modal */}
      {renderLocationModal(
        showCountyModal,
        setShowCountyModal,
        counties,
        'Select County',
        (item) => {
          setFormData({
            ...formData,
            region: item.id,
            regionName: item.name,
            subCounty: '',
            subCountyName: '',
            ward: '',
            wardName: '',
          });
        },
        formData.regionName
      )}

      {/* Sub-County Modal */}
      {renderLocationModal(
        showSubCountyModal,
        setShowSubCountyModal,
        subCounties,
        'Select Sub-County',
        (item) => {
          setFormData({
            ...formData,
            subCounty: item.id,
            subCountyName: item.name,
            ward: '',
            wardName: '',
          });
        },
        formData.subCountyName
      )}

      {/* Ward Modal */}
      {renderLocationModal(
        showWardModal,
        setShowWardModal,
        wards,
        'Select Ward',
        (item) => {
          setFormData({
            ...formData,
            ward: item.id,
            wardName: item.name,
          });
        },
        formData.wardName
      )}

      {/* Leader Type Modal */}
      {renderLocationModal(
        showLeaderTypeModal,
        setShowLeaderTypeModal,
        LEADER_TYPES.map(t => ({ id: t.id, name: t.label })),
        'Select Leader Type',
        (item) => {
          setFormData({
            ...formData,
            leaderType: item.id,
          });
        },
        LEADER_TYPES.find(t => t.id === formData.leaderType)?.label
      )}
    </SafeAreaView>
  );
};

export default LeaderRegister;