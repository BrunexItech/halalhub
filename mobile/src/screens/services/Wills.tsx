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
  Alert,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { willService, pdfService } from '../../api/client';
import * as FileSystem from 'expo-file-system';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// ===== PROFESSIONAL SVG ICONS =====
const BackIcon = ({ color = '#032A24', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const WillIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H20V20H4V4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M8 8H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 12H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 16H12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M18 8L20 10L18 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const UserIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M5.5 20C5.5 16.6863 8.18629 14 11.5 14H12.5C15.8137 14 18.5 16.6863 18.5 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ShieldIcon = ({ color = '#C9A44B', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const DocumentIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H20V20H4V4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M8 8H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 12H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 16H12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const PeopleIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M23 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronDownIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronUpIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PlusIcon = ({ color = '#C9A44B', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 8V16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const MinusIcon = ({ color = '#DC2626', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const DownloadIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M7 10L12 15L17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const Wills = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [willData, setWillData] = useState({
    fullName: '',
    idNumber: '',
    executorName: '',
    executorPhone: '',
    executorEmail: '',
    assets: '',
    bequests: [{ name: '', relation: '', amount: 0 }],
    witnesses: [
      { name: '', idNumber: '', phone: '' },
      { name: '', idNumber: '', phone: '' },
    ],
    specialInstructions: '',
    dateCreated: new Date().toISOString().split('T')[0],
  });

  const [heirs, setHeirs] = useState([
    { relation: 'Wife', name: '', share: '1/8', shareDecimal: 0.125 },
    { relation: 'Son', name: '', share: 'Asabah', shareDecimal: 0.5 },
    { relation: 'Daughter', name: '', share: 'Asabah / 2', shareDecimal: 0.25 },
  ]);

  const [willsHistory, setWillsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [estateValue, setEstateValue] = useState(5000000);
  const [inheritanceResult, setInheritanceResult] = useState<any>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Collapsible sections
  const [personalExpanded, setPersonalExpanded] = useState(true);
  const [executorExpanded, setExecutorExpanded] = useState(true);
  const [assetsExpanded, setAssetsExpanded] = useState(true);
  const [bequestsExpanded, setBequestsExpanded] = useState(true);
  const [witnessesExpanded, setWitnessesExpanded] = useState(true);
  const [instructionsExpanded, setInstructionsExpanded] = useState(true);
  const [calculatorExpanded, setCalculatorExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  useEffect(() => {
    fetchWillsHistory();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      setWillData((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        executorName: user.fullName || '',
      }));
    }
  }, [user]);

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    switch(section) {
      case 'personal': setPersonalExpanded(!personalExpanded); break;
      case 'executor': setExecutorExpanded(!executorExpanded); break;
      case 'assets': setAssetsExpanded(!assetsExpanded); break;
      case 'bequests': setBequestsExpanded(!bequestsExpanded); break;
      case 'witnesses': setWitnessesExpanded(!witnessesExpanded); break;
      case 'instructions': setInstructionsExpanded(!instructionsExpanded); break;
      case 'calculator': setCalculatorExpanded(!calculatorExpanded); break;
      case 'history': setHistoryExpanded(!historyExpanded); break;
    }
  };

  const fetchWillsHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await willService.getWills();
      if (res.data.success) {
        setWillsHistory(res.data.wills || []);
      }
    } catch (err) {
      console.log('History error:', err);
      setWillsHistory([]);
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWillsHistory();
  };

  const fetchWillById = async (id: string) => {
    try {
      const res = await willService.getWillById(id);
      if (res.data.success) {
        const will = res.data.will;
        setWillData({
          fullName: will.fullName || '',
          idNumber: will.idNumber || '',
          executorName: will.executorName || '',
          executorPhone: will.executorPhone || '',
          executorEmail: will.executorEmail || '',
          assets: will.assets || '',
          bequests: will.bequests || [{ name: '', relation: '', amount: 0 }],
          witnesses: will.witnesses || [
            { name: '', idNumber: '', phone: '' },
            { name: '', idNumber: '', phone: '' },
          ],
          specialInstructions: will.specialInstructions || '',
          dateCreated: will.createdAt ? will.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        });
        if (will.heirs && will.heirs.length > 0) {
          setHeirs(will.heirs);
        }
        setSuccess('Will loaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to load will');
      setTimeout(() => setError(''), 3000);
    }
  };

  const addHeir = () => {
    setHeirs([...heirs, { relation: '', name: '', share: '', shareDecimal: 0 }]);
  };

  const removeHeir = (index: number) => {
    if (heirs.length <= 1) {
      setError('You must have at least one heir');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setHeirs(heirs.filter((_, i) => i !== index));
  };

  const updateHeir = (index: number, field: string, value: string) => {
    const updated = [...heirs];
    updated[index] = { ...updated[index], [field]: value };
    setHeirs(updated);
  };

  const addBequest = () => {
    setWillData({
      ...willData,
      bequests: [...willData.bequests, { name: '', relation: '', amount: 0 }],
    });
  };

  const removeBequest = (index: number) => {
    if (willData.bequests.length <= 1) {
      setError('You must have at least one bequest');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const updated = [...willData.bequests];
    updated.splice(index, 1);
    setWillData({ ...willData, bequests: updated });
  };

  const updateBequest = (index: number, field: string, value: string | number) => {
    const updated = [...willData.bequests];
    updated[index] = { ...updated[index], [field]: value };
    setWillData({ ...willData, bequests: updated });
  };

  const updateWitness = (index: number, field: string, value: string) => {
    const updated = [...willData.witnesses];
    updated[index] = { ...updated[index], [field]: value };
    setWillData({ ...willData, witnesses: updated });
  };

  const handleWillChange = (field: string, value: string) => {
    setWillData({ ...willData, [field]: value });
    setError('');
  };

  const saveWill = () => {
    if (!willData.fullName) {
      setError('Please enter your full name');
      return;
    }
    if (!willData.executorName) {
      setError('Please enter the executor name');
      return;
    }
    if (!willData.assets) {
      setError('Please list your assets');
      return;
    }
    if (willData.witnesses.some((w) => !w.name)) {
      setError('Please enter all witness names');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSaveWill = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await willService.createWill({
        fullName: willData.fullName,
        idNumber: willData.idNumber,
        executorName: willData.executorName,
        executorPhone: willData.executorPhone,
        executorEmail: willData.executorEmail,
        assets: willData.assets,
        bequests: willData.bequests.filter((b) => b.name),
        heirs: heirs.filter((h) => h.relation || h.name),
        witnesses: willData.witnesses,
        specialInstructions: willData.specialInstructions,
        status: 'draft',
      });

      if (response.data.success) {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        await fetchWillsHistory();
        setSuccess('Will created and encrypted successfully');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save will. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const calculateInheritance = async () => {
    setProcessing(true);
    try {
      const response = await willService.calculateInheritance({
        estate: estateValue,
        heirs: heirs,
      });
      if (response.data.success) {
        setInheritanceResult(response.data.data);
        setSuccess('Inheritance calculated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to calculate inheritance');
    } finally {
      setProcessing(false);
    }
  };

  const generatePDF = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await pdfService.generateWill({
        fullName: willData.fullName,
        idNumber: willData.idNumber,
        executorName: willData.executorName,
        executorPhone: willData.executorPhone,
        executorEmail: willData.executorEmail,
        assets: willData.assets,
        bequests: willData.bequests,
        heirs: heirs,
        witnesses: willData.witnesses,
        specialInstructions: willData.specialInstructions,
      });

      const pdfData = response.data;
      const fileUri = FileSystem.documentDirectory + 'will_' + Date.now() + '.pdf';
      
      await FileSystem.writeAsStringAsync(fileUri, pdfData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Open the PDF directly
      await Linking.openURL(fileUri);
      
      setSuccess('PDF downloaded and opened successfully');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('PDF Error:', err);
      setError(err.response?.data?.error || 'Failed to generate PDF. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#032A24" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#032A24" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* ===== PREMIUM HEADER ===== */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <View style={{
              position: 'absolute',
              top: 0,
              left: 40,
              right: 40,
              height: 2,
              backgroundColor: '#C9A44B',
              opacity: 0.3,
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={{
                  padding: 6,
                  marginRight: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                }}
              >
                <BackIcon color="#C9A44B" size={22} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <WillIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Digital Wasiyyah
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Create Your Islamic Will
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Sharia-compliant · Encrypted · Professional
                </Text>
              </View>

              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.1)',
              }}>
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#C9A44B',
                  opacity: 0.5,
                }} />
              </View>
            </View>
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {/* Form - Left */}
            <View style={{ flex: 2, minWidth: 300, gap: 12 }}>
              {/* Personal Information - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleSection('personal')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <UserIcon color="#032A24" size={14} />
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                      Personal Information
                    </Text>
                  </View>
                  {personalExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </TouchableOpacity>

                {personalExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Full Legal Name *
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={willData.fullName}
                        onChangeText={(text) => handleWillChange('fullName', text)}
                        placeholder="As per National ID"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        ID Number
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={willData.idNumber}
                        onChangeText={(text) => handleWillChange('idNumber', text)}
                        placeholder="National ID / Passport"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Executor - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleSection('executor')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <ShieldIcon color="#032A24" size={14} />
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                      Executor (Wasi)
                    </Text>
                  </View>
                  {executorExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </TouchableOpacity>

                {executorExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Executor Name *
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={willData.executorName}
                        onChangeText={(text) => handleWillChange('executorName', text)}
                        placeholder="Name of trusted executor"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Phone
                        </Text>
                        <TextInput
                          style={{
                            backgroundColor: '#FAFAF7',
                            borderWidth: 1,
                            borderColor: 'rgba(3, 42, 36, 0.06)',
                            borderRadius: 10,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            color: '#1F2937',
                            fontSize: 14,
                          }}
                          value={willData.executorPhone}
                          onChangeText={(text) => handleWillChange('executorPhone', text)}
                          placeholder="+2547XXXXXXXX"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Email
                        </Text>
                        <TextInput
                          style={{
                            backgroundColor: '#FAFAF7',
                            borderWidth: 1,
                            borderColor: 'rgba(3, 42, 36, 0.06)',
                            borderRadius: 10,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            color: '#1F2937',
                            fontSize: 14,
                          }}
                          value={willData.executorEmail}
                          onChangeText={(text) => handleWillChange('executorEmail', text)}
                          placeholder="executor@email.com"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Assets - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleSection('assets')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <DocumentIcon color="#032A24" size={14} />
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                      Assets
                    </Text>
                  </View>
                  {assetsExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </TouchableOpacity>

                {assetsExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      List Your Assets *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FAFAF7',
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.06)',
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        color: '#1F2937',
                        fontSize: 14,
                        minHeight: 80,
                        textAlignVertical: 'top',
                      }}
                      value={willData.assets}
                      onChangeText={(text) => handleWillChange('assets', text)}
                      placeholder="Bank accounts, property, business interests, vehicles, investments, digital assets, personal valuables..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                  </View>
                )}
              </View>

              {/* Bequests - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleSection('bequests')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <PeopleIcon color="#032A24" size={14} />
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                      Bequests
                    </Text>
                    <Text style={{ color: '#8B8A86', fontSize: 10 }}>Max 1/3 of estate</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={addBequest} activeOpacity={0.7}>
                      <PlusIcon color="#C9A44B" size={16} />
                    </TouchableOpacity>
                    {bequestsExpanded ? (
                      <ChevronUpIcon color="#6B7280" size={18} />
                    ) : (
                      <ChevronDownIcon color="#6B7280" size={18} />
                    )}
                  </View>
                </TouchableOpacity>

                {bequestsExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    {willData.bequests.map((bequest, index) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: '#FAFAF7',
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                        marginBottom: 8,
                      }}>
                        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 70,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              color: '#1F2937',
                              fontSize: 13,
                            }}
                            value={bequest.name}
                            onChangeText={(text) => updateBequest(index, 'name', text)}
                            placeholder="Name"
                            placeholderTextColor="#9CA3AF"
                          />
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 70,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              color: '#1F2937',
                              fontSize: 13,
                            }}
                            value={bequest.relation}
                            onChangeText={(text) => updateBequest(index, 'relation', text)}
                            placeholder="Relation"
                            placeholderTextColor="#9CA3AF"
                          />
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 70,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              color: '#1F2937',
                              fontSize: 13,
                            }}
                            value={String(bequest.amount)}
                            onChangeText={(text) => updateBequest(index, 'amount', parseFloat(text) || 0)}
                            placeholder="Amount"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                          />
                        </View>
                        <TouchableOpacity onPress={() => removeBequest(index)} activeOpacity={0.7}>
                          <MinusIcon color="#DC2626" size={16} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Witnesses - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleSection('witnesses')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <PeopleIcon color="#032A24" size={14} />
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                      Witnesses
                    </Text>
                    <Text style={{ color: '#8B8A86', fontSize: 10 }}>2 required</Text>
                  </View>
                  {witnessesExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </TouchableOpacity>

                {witnessesExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    {willData.witnesses.map((witness, index) => (
                      <View key={index} style={{
                        backgroundColor: '#FAFAF7',
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                        marginBottom: 10,
                      }}>
                        <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                          Witness {index + 1}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 70,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              color: '#1F2937',
                              fontSize: 13,
                            }}
                            value={witness.name}
                            onChangeText={(text) => updateWitness(index, 'name', text)}
                            placeholder="Full Name *"
                            placeholderTextColor="#9CA3AF"
                          />
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 60,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              color: '#1F2937',
                              fontSize: 13,
                            }}
                            value={witness.idNumber}
                            onChangeText={(text) => updateWitness(index, 'idNumber', text)}
                            placeholder="ID Number"
                            placeholderTextColor="#9CA3AF"
                          />
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 60,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              color: '#1F2937',
                              fontSize: 13,
                            }}
                            value={witness.phone}
                            onChangeText={(text) => updateWitness(index, 'phone', text)}
                            placeholder="Phone"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Special Instructions - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleSection('instructions')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <DocumentIcon color="#032A24" size={14} />
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                      Special Instructions
                    </Text>
                  </View>
                  {instructionsExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </TouchableOpacity>

                {instructionsExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <TextInput
                      style={{
                        backgroundColor: '#FAFAF7',
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.06)',
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        color: '#1F2937',
                        fontSize: 14,
                        minHeight: 60,
                        textAlignVertical: 'top',
                      }}
                      value={willData.specialInstructions}
                      onChangeText={(text) => handleWillChange('specialInstructions', text)}
                      placeholder="Any special instructions or wishes..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#032A24',
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={saveWill}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                    {processing ? 'Saving...' : 'Save & Encrypt Will'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                  }}
                  onPress={generatePDF}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#6B7280" />
                  ) : (
                    <>
                      <DownloadIcon color="#6B7280" size={16} />
                      <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500', marginTop: 2 }}>
                        Download PDF
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sidebar - Right */}
            <View style={{ flex: 1, minWidth: 200, gap: 12 }}>
              {/* Islamic Guidance */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
              }}>
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', marginBottom: 10 }}>
                  Islamic Guidance
                </Text>
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.04)',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.06)',
                  marginBottom: 8,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    "And whoever leaves behind a will, it shall be carried out after any debts." — Quran 2:180
                  </Text>
                </View>
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.04)',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.06)',
                  marginBottom: 8,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    "Verily, Allah has given to each person their rightful share." — Hadith
                  </Text>
                </View>
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.04)',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.06)',
                }}>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>What is a Wasiyyah?</Text>
                  <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 18 }}>
                    A Wasiyyah (Islamic will) allows you to allocate up to 1/3 of your estate
                    to non-heirs, while the remaining 2/3 is distributed according to
                    Faraidh (Islamic inheritance law).
                  </Text>
                </View>
              </View>

              {/* Faraidh Calculator - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleSection('calculator')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <DocumentIcon color="#032A24" size={14} />
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                      Faraidh Calculator
                    </Text>
                  </View>
                  {calculatorExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </TouchableOpacity>

                {calculatorExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Estate Value (KES)
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={String(estateValue)}
                        onChangeText={(text) => setEstateValue(parseFloat(text) || 0)}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }}>Heirs</Text>
                      <TouchableOpacity onPress={addHeir} activeOpacity={0.7}>
                        <PlusIcon color="#C9A44B" size={14} />
                      </TouchableOpacity>
                    </View>

                    {heirs.map((heir, index) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#FAFAF7',
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                        marginBottom: 6,
                      }}>
                        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 50,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 6,
                              paddingHorizontal: 6,
                              paddingVertical: 4,
                              color: '#1F2937',
                              fontSize: 12,
                            }}
                            value={heir.relation}
                            onChangeText={(text) => updateHeir(index, 'relation', text)}
                            placeholder="Relation"
                            placeholderTextColor="#9CA3AF"
                          />
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 50,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 6,
                              paddingHorizontal: 6,
                              paddingVertical: 4,
                              color: '#1F2937',
                              fontSize: 12,
                            }}
                            value={heir.name}
                            onChangeText={(text) => updateHeir(index, 'name', text)}
                            placeholder="Name"
                            placeholderTextColor="#9CA3AF"
                          />
                          <TextInput
                            style={{
                              flex: 1,
                              minWidth: 40,
                              backgroundColor: '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(3, 42, 36, 0.06)',
                              borderRadius: 6,
                              paddingHorizontal: 6,
                              paddingVertical: 4,
                              color: '#1F2937',
                              fontSize: 12,
                            }}
                            value={heir.share}
                            onChangeText={(text) => updateHeir(index, 'share', text)}
                            placeholder="Share"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                        <TouchableOpacity onPress={() => removeHeir(index)} activeOpacity={0.7}>
                          <MinusIcon color="#DC2626" size={14} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={{
                        backgroundColor: '#032A24',
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        marginTop: 8,
                        opacity: processing ? 0.5 : 1,
                      }}
                      onPress={calculateInheritance}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                        {processing ? 'Calculating...' : 'Calculate Inheritance'}
                      </Text>
                    </TouchableOpacity>

                    {inheritanceResult && (
                      <View style={{
                        backgroundColor: 'rgba(201, 164, 75, 0.04)',
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(201, 164, 75, 0.06)',
                        marginTop: 10,
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>Distribution</Text>
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                            Total: {formatCurrency(inheritanceResult.estate)}
                          </Text>
                        </View>
                        {inheritanceResult.distribution.map((item: any, index: number) => (
                          <View key={index} style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 4,
                            borderBottomWidth: index < inheritanceResult.distribution.length - 1 ? 1 : 0,
                            borderBottomColor: 'rgba(3, 42, 36, 0.04)',
                          }}>
                            <Text style={{ color: '#6B7280', fontSize: 12 }}>
                              {item.relation}: {item.name}
                            </Text>
                            <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>
                              {item.share} — {formatCurrency(item.amount)}
                            </Text>
                          </View>
                        ))}
                        {inheritanceResult.remaining > 0 && (
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingTop: 6,
                            marginTop: 4,
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(3, 42, 36, 0.04)',
                          }}>
                            <Text style={{ color: '#6B7280', fontSize: 12 }}>Remaining (Asabah)</Text>
                            <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>
                              {formatCurrency(inheritanceResult.remaining)}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Previous Wills - Collapsible */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.06)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={() => toggleSection('history')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <DocumentIcon color="#032A24" size={14} />
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                      Previous Wills
                    </Text>
                    {willsHistory.length > 0 && (
                      <View style={{
                        backgroundColor: 'rgba(3, 42, 36, 0.06)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500' }}>
                          {willsHistory.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={fetchWillsHistory} activeOpacity={0.7}>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>Refresh</Text>
                    </TouchableOpacity>
                    {historyExpanded ? (
                      <ChevronUpIcon color="#6B7280" size={18} />
                    ) : (
                      <ChevronDownIcon color="#6B7280" size={18} />
                    )}
                  </View>
                </TouchableOpacity>

                {historyExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    {loadingHistory ? (
                      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <ActivityIndicator size="small" color="#032A24" />
                      </View>
                    ) : willsHistory.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No previous wills</Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>Create your first will</Text>
                      </View>
                    ) : (
                      willsHistory.slice(0, 5).map((will) => (
                        <TouchableOpacity
                          key={will.id}
                          style={{
                            backgroundColor: '#FAFAF7',
                            padding: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(3, 42, 36, 0.04)',
                            marginBottom: 6,
                          }}
                          onPress={() => fetchWillById(will.id)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                              <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }}>
                                {will.fullName || will.version}
                              </Text>
                              <Text style={{ color: '#6B7280', fontSize: 11 }}>{formatDate(will.date)}</Text>
                              {will.reference && (
                                <Text style={{ color: '#9CA3AF', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                                  Ref: {will.reference}
                                </Text>
                              )}
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <View style={{
                                backgroundColor: will.status === 'active' ? '#D1FAE5' :
                                              will.status === 'completed' ? '#DBEAFE' :
                                              '#FEF3C7',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 8,
                              }}>
                                <Text style={{
                                  color: will.status === 'active' ? '#3FAF73' :
                                         will.status === 'completed' ? '#3B82F6' :
                                         '#D97706',
                                  fontSize: 9,
                                  fontWeight: '500',
                                }}>
                                  {will.status === 'active' ? 'Active' :
                                   will.status === 'completed' ? 'Completed' : 'Draft'}
                                </Text>
                              </View>
                              <Text style={{ color: '#9CA3AF', fontSize: 10 }}>v{will.version || '1'}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Digital Wasiyyah Services
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Confirm Will
              </Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <WillIcon color="#C9A44B" size={32} />
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', marginTop: 6 }}>Save Your Islamic Will</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Your will will be encrypted and stored securely.</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Executor</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{willData.executorName}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Bequests</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {willData.bequests.filter((b) => b.name).length}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Heirs</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {heirs.filter((h) => h.relation || h.name).length}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Witnesses</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {willData.witnesses.filter((w) => w.name).length}/2
                  </Text>
                </View>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
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
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: processing ? 0.5 : 1,
                  }}
                  onPress={confirmSaveWill}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Saving...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Save Will</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#032A24',
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              margin: -24,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Will Saved
              </Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: 'rgba(63, 175, 115, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(63, 175, 115, 0.12)',
                }}>
                  <CheckIcon color="#3FAF73" size={30} />
                </View>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>Your Islamic Will has been created</Text>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', marginTop: 2 }}>Successfully Saved</Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.04)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  Your will is encrypted and stored securely. Share the downloaded file with your lawyer and executor.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginBottom: 10,
                }}
                onPress={generatePDF}
                activeOpacity={0.7}
              >
                {processing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Generating...</Text>
                  </View>
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Download PDF</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Toast */}
      {success ? (
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 20,
          left: 20,
          backgroundColor: '#032A24',
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#032A24',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CheckIcon color="#C9A44B" size={18} />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')} activeOpacity={0.7} style={{ padding: 4 }}>
            <CloseIcon color="rgba(255,255,255,0.5)" size={18} />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Wills;