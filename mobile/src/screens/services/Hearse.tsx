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
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { hearseService } from '../../api/client';
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

const HearseIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="8" width="20" height="10" rx="1" stroke={color} strokeWidth="1.5"/>
    <Circle cx="7" cy="18" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="17" cy="18" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M2 12H4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M20 12H22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 8L10 4H14L16 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShroudIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H20V20H4V4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M8 8H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 12H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 16H12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const LocationIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const PhoneIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ClockIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 6V12L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
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

const UserIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M5.5 20C5.5 16.6863 8.18629 14 11.5 14H12.5C15.8137 14 18.5 16.6863 18.5 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const MosqueIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3L3 9L5 9V19H19V9L21 9L12 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M8 13H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M10 17H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const StarIcon = ({ color = '#C9A44B', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const Hearse = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [requestData, setRequestData] = useState({
    serviceType: '',
    pickupLocation: '',
    destination: '',
    mosqueLocation: '',
    cemeteryLocation: '',
    contactPerson: '',
    contactPhone: '',
    scheduledDate: '',
    scheduledTime: '',
    urgency: 'standard',
    specialRequests: '',
    shroudType: 'adult_male',
    shroudQuantity: 1,
  });

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [formExpanded, setFormExpanded] = useState(false);
  const [requestsExpanded, setRequestsExpanded] = useState(false);

  const services = [
    {
      id: 'hearse_transport',
      name: 'Islamic Hearse Transport',
      description: 'Dignified transport of the deceased from pickup location to mosque and cemetery.',
      price: 0,
      fields: ['pickupLocation', 'destination', 'mosqueLocation', 'cemeteryLocation'],
      icon: '🚐',
    },
    {
      id: 'shroud',
      name: 'Shroud / Kafan Services',
      description: 'Complete shroud (kafan) set for male, female, or child.',
      price: 0,
      fields: ['shroudType', 'shroudQuantity'],
      icon: '🧕',
    },
    {
      id: 'complete_service',
      name: 'Complete Funeral Service',
      description: 'Full funeral assistance including hearse, shroud, and burial coordination.',
      price: 0,
      fields: ['pickupLocation', 'destination', 'mosqueLocation', 'cemeteryLocation', 'shroudType', 'shroudQuantity'],
      icon: '🕌',
    },
  ];

  const shroudTypes = [
    { id: 'adult_male', label: 'Adult Male' },
    { id: 'adult_female', label: 'Adult Female' },
    { id: 'child', label: 'Child' },
  ];

  useEffect(() => {
    fetchMyRequests();
    setLoading(false);
  }, []);

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    setError('');
    try {
      const response = await hearseService.getRequests();
      if (response.data.success) {
        setMyRequests(response.data.requests || []);
      }
    } catch (err) {
      console.log('Requests error:', err);
      setError('Failed to load your requests. Please refresh.');
      setMyRequests([]);
    } finally {
      setLoadingRequests(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyRequests();
  };

  const toggleServices = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setServicesExpanded(!servicesExpanded);
  };

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFormExpanded(!formExpanded);
  };

  const toggleRequests = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRequestsExpanded(!requestsExpanded);
  };

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setRequestData({
      ...requestData,
      serviceType: service.id,
    });
    setError('');
    setFormExpanded(true);
  };

  const handleRequestChange = (field: string, value: string | number) => {
    setRequestData({ ...requestData, [field]: value });
    setError('');
  };

  const handleRequestSubmit = () => {
    if (!selectedService) {
      setError('Please select a service.');
      return;
    }

    const requiredFields = selectedService.fields;
    for (const field of requiredFields) {
      if (!requestData[field as keyof typeof requestData]) {
        setError('Please fill in all required fields.');
        return;
      }
    }

    if (selectedService.id === 'hearse_transport' || selectedService.id === 'complete_service') {
      if (!requestData.pickupLocation) {
        setError('Please provide a pickup location.');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const confirmRequest = async () => {
    setProcessing(true);
    setError('');
    try {
      const payload = {
        serviceType: requestData.serviceType,
        pickupLocation: requestData.pickupLocation,
        destinationLocation: requestData.destination || '',
        mosqueLocation: requestData.mosqueLocation || '',
        cemeteryLocation: requestData.cemeteryLocation || '',
        shroudType: requestData.shroudType || '',
        shroudQuantity: parseInt(String(requestData.shroudQuantity)) || 1,
        contactPerson: requestData.contactPerson || user?.fullName || '',
        contactPhone: requestData.contactPhone || user?.phone || '',
        scheduledDate: requestData.scheduledDate || '',
        scheduledTime: requestData.scheduledTime || '',
        urgency: requestData.urgency || 'standard',
        specialRequests: requestData.specialRequests || '',
      };

      const response = await hearseService.createRequest(payload);

      if (response.data.success) {
        const data = response.data.data;
        setRequestId(data.reference || 'HR-' + Date.now());
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        await fetchMyRequests();
        setSuccess('Service request submitted successfully.');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FAFAF7', text: '#6B7280' },
      assigned: { bg: '#FEF3C7', text: '#D97706' },
      in_progress: { bg: '#FEF3C7', text: '#D97706' },
      completed: { bg: '#D1FAE5', text: '#3FAF73' },
      cancelled: { bg: '#FEE2E2', text: '#DC2626' },
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return { style: styles[status] || styles.pending, label: labels[status] || status };
  };

  const getServiceLabel = (type: string) => {
    const labels: Record<string, string> = {
      hearse_transport: 'Hearse Transport',
      shroud: 'Shroud / Kafan',
      complete_service: 'Complete Funeral Service',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Loading services...</Text>
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
                  <HearseIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Islamic Services
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Hearse & Shroud Services
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Dignified · Respectful · 24/7 Support
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

          {/* ===== COLLAPSIBLE SERVICES ===== */}
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
            marginBottom: 16,
            overflow: 'hidden',
          }}>
            <TouchableOpacity
              onPress={toggleServices}
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
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                  Available Services
                </Text>
                <Text style={{ color: '#8B8A86', fontSize: 10 }}>Select a service</Text>
              </View>
              {servicesExpanded ? (
                <ChevronUpIcon color="#6B7280" size={18} />
              ) : (
                <ChevronDownIcon color="#6B7280" size={18} />
              )}
            </TouchableOpacity>

            {servicesExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={{
                        backgroundColor: isSelected ? 'rgba(3, 42, 36, 0.02)' : '#FAFAF7',
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 8,
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#C9A44B' : 'rgba(3, 42, 36, 0.04)',
                      }}
                      onPress={() => handleServiceSelect(service)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              backgroundColor: 'rgba(201, 164, 75, 0.06)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: 'rgba(201, 164, 75, 0.06)',
                            }}>
                              <Text style={{ fontSize: 18 }}>{service.icon}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>
                                {service.name}
                              </Text>
                              <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }}>
                                {service.description}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {isSelected && (
                          <View style={{
                            backgroundColor: '#C9A44B',
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '600' }}>Selected</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ===== COLLAPSIBLE REQUEST FORM ===== */}
          {selectedService && (
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
              marginBottom: 16,
              overflow: 'hidden',
            }}>
              <TouchableOpacity
                onPress={toggleForm}
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
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                    Service Details
                  </Text>
                  <Text style={{ color: '#8B8A86', fontSize: 10 }}>Fill in the details</Text>
                </View>
                {formExpanded ? (
                  <ChevronUpIcon color="#6B7280" size={18} />
                ) : (
                  <ChevronDownIcon color="#6B7280" size={18} />
                )}
              </TouchableOpacity>

              {formExpanded && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  {(selectedService.id === 'hearse_transport' || selectedService.id === 'complete_service') && (
                    <>
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Pickup Location *
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                          <LocationIcon color="#9CA3AF" size={14} />
                          <TextInput
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              color: '#1F2937',
                              fontSize: 14,
                            }}
                            value={requestData.pickupLocation}
                            onChangeText={(text) => handleRequestChange('pickupLocation', text)}
                            placeholder="Enter pickup location"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Destination Location
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                          <LocationIcon color="#9CA3AF" size={14} />
                          <TextInput
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              color: '#1F2937',
                              fontSize: 14,
                            }}
                            value={requestData.destination}
                            onChangeText={(text) => handleRequestChange('destination', text)}
                            placeholder="Enter destination location"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Mosque Location
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                          <MosqueIcon color="#9CA3AF" size={14} />
                          <TextInput
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              color: '#1F2937',
                              fontSize: 14,
                            }}
                            value={requestData.mosqueLocation}
                            onChangeText={(text) => handleRequestChange('mosqueLocation', text)}
                            placeholder="Enter mosque location"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Cemetery Location
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                          <LocationIcon color="#9CA3AF" size={14} />
                          <TextInput
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              color: '#1F2937',
                              fontSize: 14,
                            }}
                            value={requestData.cemeteryLocation}
                            onChangeText={(text) => handleRequestChange('cemeteryLocation', text)}
                            placeholder="Enter cemetery location"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                    </>
                  )}

                  {(selectedService.id === 'shroud' || selectedService.id === 'complete_service') && (
                    <>
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Shroud Type *
                        </Text>
                        <View style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }}>
                          <TextInput
                            style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                            value={requestData.shroudType}
                            onChangeText={(text) => handleRequestChange('shroudType', text)}
                            placeholder="adult_male"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Quantity *
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
                          value={String(requestData.shroudQuantity)}
                          onChangeText={(text) => handleRequestChange('shroudQuantity', parseInt(text) || 1)}
                          keyboardType="numeric"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Contact Person *
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                        <UserIcon color="#9CA3AF" size={14} />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            color: '#1F2937',
                            fontSize: 14,
                          }}
                          value={requestData.contactPerson}
                          onChangeText={(text) => handleRequestChange('contactPerson', text)}
                          placeholder="Enter contact person"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Contact Phone *
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                        <PhoneIcon color="#9CA3AF" size={14} />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            color: '#1F2937',
                            fontSize: 14,
                          }}
                          value={requestData.contactPhone}
                          onChangeText={(text) => handleRequestChange('contactPhone', text)}
                          placeholder="Enter phone number"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Scheduled Date
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                        <ClockIcon color="#9CA3AF" size={14} />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            color: '#1F2937',
                            fontSize: 14,
                          }}
                          value={requestData.scheduledDate}
                          onChangeText={(text) => handleRequestChange('scheduledDate', text)}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Scheduled Time
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                        <ClockIcon color="#9CA3AF" size={14} />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            color: '#1F2937',
                            fontSize: 14,
                          }}
                          value={requestData.scheduledTime}
                          onChangeText={(text) => handleRequestChange('scheduledTime', text)}
                          placeholder="HH:MM"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Urgency
                    </Text>
                    <View style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                    }}>
                      <TextInput
                        style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                        value={requestData.urgency}
                        onChangeText={(text) => handleRequestChange('urgency', text)}
                        placeholder="standard"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Special Requests
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
                        minHeight: 60,
                        textAlignVertical: 'top',
                      }}
                      value={requestData.specialRequests}
                      onChangeText={(text) => handleRequestChange('specialRequests', text)}
                      placeholder="Any special requirements or instructions..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#032A24',
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                    onPress={handleRequestSubmit}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Submit Request</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Emergency Contact */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
            elevation: 1,
          }}>
            <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', marginBottom: 10 }}>
              Emergency Contact
            </Text>
            <View style={{
              backgroundColor: 'rgba(220, 38, 38, 0.04)',
              borderWidth: 2,
              borderColor: 'rgba(220, 38, 38, 0.1)',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 }}>
                24/7 Support Hotline
              </Text>
              <Text style={{ color: '#DC2626', fontSize: 26, fontWeight: '700', marginTop: 2 }}>
                0800 720 720
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
                Available 24 hours a day, 7 days a week
              </Text>
            </View>
          </View>

          {/* Islamic Guidance */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
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
            <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 10, fontStyle: 'italic' }}>
              "Every soul shall taste death." — Quran 3:185
            </Text>
            <View style={{
              backgroundColor: 'rgba(201, 164, 75, 0.04)',
              padding: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.06)',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#032A24', fontSize: 20, textAlign: 'center' }}>إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</Text>
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>Inna lillahi wa inna ilayhi raji'un</Text>
              <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>"To Allah we belong and to Him we shall return"</Text>
            </View>
          </View>

          {/* ===== COLLAPSIBLE MY REQUESTS ===== */}
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
              onPress={toggleRequests}
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
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                  My Requests
                </Text>
                {myRequests.length > 0 && (
                  <View style={{
                    backgroundColor: 'rgba(3, 42, 36, 0.06)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500' }}>
                      {myRequests.length}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={fetchMyRequests} activeOpacity={0.7}>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>Refresh</Text>
                </TouchableOpacity>
                {requestsExpanded ? (
                  <ChevronUpIcon color="#6B7280" size={18} />
                ) : (
                  <ChevronDownIcon color="#6B7280" size={18} />
                )}
              </View>
            </TouchableOpacity>

            {requestsExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {loadingRequests ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color="#032A24" />
                  </View>
                ) : myRequests.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No requests yet</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                      Submit a request to get started
                    </Text>
                  </View>
                ) : (
                  myRequests.slice(0, 5).map((request) => {
                    const status = getStatusBadge(request.status);
                    return (
                      <View key={request.id} style={{
                        backgroundColor: '#FAFAF7',
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                        marginBottom: 8,
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                              {getServiceLabel(request.service_type)}
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 11 }}>{formatDate(request.scheduled_date || request.createdat)}</Text>
                            <Text style={{ color: '#9CA3AF', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                              {request.reference}
                            </Text>
                          </View>
                          <View style={{
                            backgroundColor: status.style.bg,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.04)',
                          }}>
                            <Text style={{ color: status.style.text, fontSize: 10, fontWeight: '500' }}>{status.label}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Islamic Funeral Services
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
                Confirm Request
              </Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '600' }}>{selectedService?.name}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                {requestData.pickupLocation && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Pickup</Text>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{requestData.pickupLocation}</Text>
                  </View>
                )}
                {requestData.destination && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Destination</Text>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{requestData.destination}</Text>
                  </View>
                )}
                {requestData.contactPerson && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Contact</Text>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{requestData.contactPerson}</Text>
                  </View>
                )}
                {requestData.shroudType && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Shroud Type</Text>
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                      {shroudTypes.find((t) => t.id === requestData.shroudType)?.label || requestData.shroudType}
                    </Text>
                  </View>
                )}
                {requestData.urgency && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Urgency</Text>
                    <Text style={{
                      color: requestData.urgency === 'urgent' ? '#DC2626' : '#032A24',
                      fontSize: 13,
                      fontWeight: '600',
                    }}>
                      {requestData.urgency === 'urgent' ? 'Urgent' : 'Standard'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.04)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.06)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  A service provider will contact you shortly to confirm the details and coordinate the service.
                </Text>
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
                  onPress={confirmRequest}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Confirm Request</Text>
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
                Request Submitted
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
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>Your request has been submitted</Text>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', marginTop: 2 }}>
                  Reference: {requestId}
                </Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(63, 175, 115, 0.04)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.06)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  A service provider will contact you within 10 minutes to confirm the details.
                </Text>
              </View>

              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.04)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.06)',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 }}>
                  "Every soul shall taste death." — Quran 3:185
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Done</Text>
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

export default Hearse;