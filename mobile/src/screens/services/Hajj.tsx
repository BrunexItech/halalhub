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
  Alert,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { hajjService } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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

const KaabaIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="6" width="16" height="12" rx="1" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 6V18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M4 9H20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M4 15H20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="12" cy="12" r="1" fill={color} opacity="0.5"/>
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

const StarIcon = ({ color = '#C9A44B', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const ClockIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 6V12L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const UsersIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.5"/>
    <Path d="M4 18V17C4 14.7909 5.79086 13 8 13H10C12.2091 13 14 14.7909 14 17V18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="17" cy="9" r="2" stroke={color} strokeWidth="1.5"/>
    <Path d="M15 17V16C15 14.8954 15.8954 14 17 14H18C19.1046 14 20 14.8954 20 16V17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const PlaneIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9L9 12L12 3L15 12L21 9L12 21L12 15L9 15L9 21L3 9Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const Hajj = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');

  const [bookingData, setBookingData] = useState({
    package_id: '',
    pilgrims: 1,
    pilgrim_names: [] as string[],
    passport_numbers: [] as string[],
    contact_phone: '',
    contact_email: '',
    special_requests: '',
    journeyType: 'hajj',
    departureCity: 'Nairobi',
    adults: 2,
    children: 0,
  });

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrollComplete, setTermsScrollComplete] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [quickEnquiryExpanded, setQuickEnquiryExpanded] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, [filterType]);

  useEffect(() => {
    if (user) {
      setBookingData((prev) => ({
        ...prev,
        contact_phone: user.phone || '',
        contact_email: user.email || '',
      }));
    }
  }, [user]);

  const fetchPackages = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterType !== 'all') {
        params.type = filterType;
      }
      const response = await hajjService.getPackages(params);
      if (response.data.success) {
        setPackages(response.data.packages || []);
      } else {
        setError('Failed to load packages');
      }
    } catch (err: any) {
      console.log('Error fetching packages:', err);
      setError(err.response?.data?.error || 'Failed to load packages. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackages();
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

  const getTypeLabel = (type: string) => {
    return type === 'hajj' ? 'Hajj' : 'Umrah';
  };

  const getTierColor = (type: string) => {
    const colors: Record<string, string> = {
      Economy: '#6B5C3E',
      Standard: '#0B342B',
      Premium: '#C9A44B',
      Umrah: '#0B342B',
      hajj: '#0B342B',
      umrah: '#C9A44B',
    };
    return colors[type] || '#6B5C3E';
  };

  const getTierBgColor = (type: string) => {
    const colors: Record<string, string> = {
      hajj: 'rgba(11, 52, 43, 0.08)',
      umrah: 'rgba(201, 164, 75, 0.08)',
    };
    return colors[type] || 'rgba(11, 52, 43, 0.08)';
  };

  const toggleFilter = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilterExpanded(!filterExpanded);
  };

  const toggleQuickEnquiry = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuickEnquiryExpanded(!quickEnquiryExpanded);
  };

  const handleEnquire = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowPackageModal(true);
  };

  const handleBookNow = (pkg: any) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to book a package.');
      return;
    }
    setSelectedPackage(pkg);
    setTermsAccepted(false);
    setTermsScrollComplete(false);
    setBookingData({
      package_id: pkg.id,
      pilgrims: 1,
      pilgrim_names: [],
      passport_numbers: [],
      contact_phone: user?.phone || '',
      contact_email: user?.email || '',
      special_requests: '',
      journeyType: 'hajj',
      departureCity: 'Nairobi',
      adults: 2,
      children: 0,
    });
    setShowBookingModal(true);
  };

  const handlePilgrimNameChange = (index: number, value: string) => {
    const newNames = [...(bookingData.pilgrim_names || [])];
    newNames[index] = value;
    setBookingData({ ...bookingData, pilgrim_names: newNames });
  };

  const handlePassportChange = (index: number, value: string) => {
    const newPassports = [...(bookingData.passport_numbers || [])];
    newPassports[index] = value;
    setBookingData({ ...bookingData, passport_numbers: newPassports });
  };

  const confirmBooking = async () => {
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions.');
      return;
    }
    if (!bookingData.contact_phone || !bookingData.contact_email) {
      setError('Please fill in all required contact details.');
      return;
    }
    if (bookingData.pilgrims < 1) {
      setError('At least 1 pilgrim is required.');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const response = await hajjService.bookPackage({
        package_id: selectedPackage.id,
        pilgrims: bookingData.pilgrims,
        pilgrim_names: bookingData.pilgrim_names || [],
        passport_numbers: bookingData.passport_numbers || [],
        contact_phone: bookingData.contact_phone,
        contact_email: bookingData.contact_email,
        special_requests: bookingData.special_requests,
      });

      if (response.data.success) {
        setShowBookingModal(false);
        setShowSuccessModal(true);
        setSuccess('Booking request submitted successfully!');
        await fetchPackages();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data.error || 'Failed to submit booking');
      }
    } catch (err: any) {
      console.log('Booking error:', err);
      setError(err.response?.data?.error || 'Failed to submit booking. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const openTermsModal = () => {
    setTermsScrollComplete(false);
    setShowTermsModal(true);
  };

  const acceptTerms = () => {
    if (!termsScrollComplete) {
      setError('Please scroll to the bottom to read all terms.');
      return;
    }
    setTermsAccepted(true);
    setShowTermsModal(false);
    setError('');
  };

  if (loading) {
  return <LoadingSpinner message="Loading packages..." />;
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
                  <KaabaIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Hajj & Umrah
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Your Journey of a Lifetime
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Trusted packages · Spiritual guidance
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

          {/* ===== COLLAPSIBLE FILTERS ===== */}
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
              onPress={toggleFilter}
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
                  Filter Packages
                </Text>
                <Text style={{ color: '#8B8A86', fontSize: 10 }}>
                  {filterType === 'all' ? 'All' : getTypeLabel(filterType)}
                </Text>
              </View>
              {filterExpanded ? (
                <ChevronUpIcon color="#6B7280" size={18} />
              ) : (
                <ChevronDownIcon color="#6B7280" size={18} />
              )}
            </TouchableOpacity>

            {filterExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { id: 'all', label: 'All Packages' },
                    { id: 'hajj', label: 'Hajj' },
                    { id: 'umrah', label: 'Umrah' },
                  ].map((filter) => (
                    <TouchableOpacity
                      key={filter.id}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: filterType === filter.id ? '#032A24' : '#F3F4F6',
                      }}
                      onPress={() => setFilterType(filter.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        color: filterType === filter.id ? '#FFFFFF' : '#6B7280',
                        fontSize: 13,
                        fontWeight: filterType === filter.id ? '600' : '500',
                      }}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ===== PREMIUM PACKAGE CARDS ===== */}
          {packages.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 48,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>No packages found for this category.</Text>
            </View>
          ) : (
            packages.map((pkg) => {
              const pct = Math.round((pkg.booked_slots / pkg.total_slots) * 100);
              const isSelected = selectedPackage?.id === pkg.id;
              
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 18,
                    padding: 20,
                    marginBottom: 14,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#C9A44B' : 'rgba(3, 42, 36, 0.06)',
                    shadowColor: isSelected ? '#C9A44B' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.08 : 0,
                    shadowRadius: 12,
                    elevation: isSelected ? 3 : 0,
                  }}
                  onPress={() => setSelectedPackage(pkg)}
                  activeOpacity={0.7}
                >
                  {/* Premium Header Badge */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <View style={{
                        backgroundColor: getTierBgColor(pkg.type),
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(201, 164, 75, 0.1)',
                      }}>
                        <Text style={{
                          color: getTierColor(pkg.type),
                          fontSize: 10,
                          fontWeight: '600',
                          letterSpacing: 0.5,
                        }}>
                          {getTypeLabel(pkg.type)}
                        </Text>
                      </View>
                      {pkg.is_featured && (
                        <View style={{
                          backgroundColor: '#C9A44B',
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                            FEATURED
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Rating */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <StarIcon color="#C9A44B" size={12} />
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                        {pkg.vendor_rating || 'New'}
                      </Text>
                    </View>
                  </View>

                  {/* Package Name & Vendor */}
                  <Text style={{
                    color: '#032A24',
                    fontSize: 18,
                    fontWeight: '700',
                    letterSpacing: -0.3,
                    marginBottom: 2,
                  }}>
                    {pkg.name}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>{pkg.vendor_name || 'Trusted Operator'}</Text>
                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB' }} />
                    <ClockIcon color="#6B7280" size={12} />
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>{pkg.duration_days} days</Text>
                  </View>

                  {/* Description */}
                  <Text style={{
                    color: '#6B7280',
                    fontSize: 13,
                    lineHeight: 20,
                    marginBottom: 14,
                  }} numberOfLines={2}>
                    {pkg.description}
                  </Text>

                  {/* Features */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {(pkg.includes || []).slice(0, 4).map((feature: string, i: number) => (
                      <View key={i} style={{
                        backgroundColor: 'rgba(3, 42, 36, 0.03)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '400' }}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                    {(pkg.includes || []).length > 4 && (
                      <View style={{
                        backgroundColor: 'rgba(3, 42, 36, 0.03)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500' }}>
                          +{pkg.includes.length - 4} more
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Progress Bar */}
                  <View style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <UsersIcon color="#6B7280" size={12} />
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>
                          {pkg.booked_slots || 0} booked
                        </Text>
                      </View>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>
                        {pkg.available_slots || 0} slots left
                      </Text>
                    </View>
                    <View style={{
                      height: 4,
                      backgroundColor: '#F3F4F6',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}>
                      <View style={{
                        height: '100%',
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: '#032A24',
                        borderRadius: 2,
                      }} />
                    </View>
                  </View>

                  {/* Price & Actions */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  }}>
                    <View>
                      <Text style={{ color: '#8B8A86', fontSize: 10 }}>Price per person</Text>
                      <Text style={{ color: '#032A24', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                        {formatCurrency(pkg.price)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          backgroundColor: '#FAFAF7',
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                        }}
                        onPress={() => handleEnquire(pkg)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500' }}>Enquire</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 18,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: (pkg.is_active && pkg.available_slots > 0) ? '#032A24' : '#F3F4F6',
                          opacity: (pkg.is_active && pkg.available_slots > 0) ? 1 : 0.6,
                        }}
                        onPress={() => (pkg.is_active && pkg.available_slots > 0) && handleBookNow(pkg)}
                        disabled={!pkg.is_active || pkg.available_slots <= 0}
                        activeOpacity={0.7}
                      >
                        <Text style={{
                          color: (pkg.is_active && pkg.available_slots > 0) ? '#FFFFFF' : '#6B7280',
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                          {pkg.is_active && pkg.available_slots > 0 ? 'Book Now' : 'Unavailable'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* ===== COLLAPSIBLE QUICK ENQUIRY ===== */}
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
            marginTop: 16,
            overflow: 'hidden',
          }}>
            <TouchableOpacity
              onPress={toggleQuickEnquiry}
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
                  Quick Enquiry
                </Text>
                <Text style={{ color: '#8B8A86', fontSize: 10 }}>Get in touch</Text>
              </View>
              {quickEnquiryExpanded ? (
                <ChevronUpIcon color="#6B7280" size={18} />
              ) : (
                <ChevronDownIcon color="#6B7280" size={18} />
              )}
            </TouchableOpacity>

            {quickEnquiryExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                    Journey Type
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
                    value={bookingData.journeyType || 'hajj'}
                    onChangeText={(text) => setBookingData({ ...bookingData, journeyType: text })}
                    placeholder="hajj"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                    Departure City
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
                    value={bookingData.departureCity || 'Nairobi'}
                    onChangeText={(text) => setBookingData({ ...bookingData, departureCity: text })}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Adults
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
                      value={String(bookingData.adults || 2)}
                      onChangeText={(text) => setBookingData({ ...bookingData, adults: parseInt(text) || 2 })}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Children
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
                      value={String(bookingData.children || 0)}
                      onChangeText={(text) => setBookingData({ ...bookingData, children: parseInt(text) || 0 })}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setSuccess('Enquiry sent! We will contact you soon.');
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Send Enquiry</Text>
                </TouchableOpacity>
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
              Itqaan · Hajj & Umrah Services
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== MODALS (Preserved with premium styling) ===== */}
      {/* Package Detail Modal */}
      <Modal visible={showPackageModal} transparent animationType="fade">
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
                {selectedPackage?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowPackageModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Operator</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{selectedPackage?.vendor_name || 'Trusted Operator'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Duration</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{selectedPackage?.duration_days} days</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Type</Text>
                  <Text style={{ color: getTierColor(selectedPackage?.type), fontSize: 13, fontWeight: '600' }}>
                    {getTypeLabel(selectedPackage?.type)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Price</Text>
                  <Text style={{ color: '#032A24', fontSize: 17, fontWeight: '700' }}>
                    {formatCurrency(selectedPackage?.price)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Available Slots</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{selectedPackage?.available_slots || 0}</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>{selectedPackage?.description}</Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Included:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {(selectedPackage?.includes || []).map((feature: string, i: number) => (
                    <View key={i} style={{
                      backgroundColor: '#FAFAF7',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#032A24', fontSize: 11 }}>✓ {feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: (selectedPackage?.is_active && selectedPackage?.available_slots > 0) ? '#3FAF73' : '#DC2626',
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                  {(selectedPackage?.is_active && selectedPackage?.available_slots > 0) ? '✓ Available' : '✗ Currently Unavailable'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowPackageModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Close</Text>
                </TouchableOpacity>
                {(selectedPackage?.is_active && selectedPackage?.available_slots > 0) && (
                  <TouchableOpacity
                    style={{
                      flex: 2,
                      backgroundColor: '#032A24',
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setShowPackageModal(false);
                      handleBookNow(selectedPackage);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Book Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Booking Modal - Preserved with premium styling */}
      <Modal visible={showBookingModal} transparent animationType="fade">
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
                Book {selectedPackage?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Package</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{selectedPackage?.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Price</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>{formatCurrency(selectedPackage?.price)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Duration</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{selectedPackage?.duration_days} days</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Available Slots</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{selectedPackage?.available_slots || 0}</Text>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Pilgrim Details
                </Text>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', marginBottom: 4 }}>Number of Pilgrims *</Text>
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
                    value={String(bookingData.pilgrims)}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 1;
                      setBookingData({
                        ...bookingData,
                        pilgrims: val,
                        pilgrim_names: Array(val).fill(''),
                        passport_numbers: Array(val).fill(''),
                      });
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                    Max {selectedPackage?.available_slots || 50} slots available
                  </Text>
                </View>

                {Array.from({ length: bookingData.pilgrims || 1 }).map((_, index) => (
                  <View key={index} style={{
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                    marginBottom: 8,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
                      Pilgrim {index + 1}
                    </Text>
                    <View style={{ marginBottom: 6 }}>
                      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500', marginBottom: 2 }}>Full Name</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 13,
                        }}
                        value={(bookingData.pilgrim_names || [])[index] || ''}
                        onChangeText={(text) => handlePilgrimNameChange(index, text)}
                        placeholder="Enter full name"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '500', marginBottom: 2 }}>Passport Number</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 13,
                        }}
                        value={(bookingData.passport_numbers || [])[index] || ''}
                        onChangeText={(text) => handlePassportChange(index, text)}
                        placeholder="Enter passport number"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                ))}

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', marginBottom: 4 }}>Contact Phone *</Text>
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
                    value={bookingData.contact_phone}
                    onChangeText={(text) => setBookingData({ ...bookingData, contact_phone: text })}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', marginBottom: 4 }}>Contact Email *</Text>
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
                    value={bookingData.contact_email}
                    onChangeText={(text) => setBookingData({ ...bookingData, contact_email: text })}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', marginBottom: 4 }}>Special Requests</Text>
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
                    value={bookingData.special_requests}
                    onChangeText={(text) => setBookingData({ ...bookingData, special_requests: text })}
                    placeholder="Any special requirements..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                </View>

                <View style={{
                  backgroundColor: 'rgba(3, 42, 36, 0.02)',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 12,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Total</Text>
                    <Text style={{ color: '#C9A44B', fontSize: 15, fontWeight: '700' }}>
                      {formatCurrency(selectedPackage?.price * (bookingData.pilgrims || 1))}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <TouchableOpacity
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: termsAccepted ? '#032A24' : 'rgba(3, 42, 36, 0.12)',
                      backgroundColor: termsAccepted ? '#032A24' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    {termsAccepted && <CheckIcon color="#FFFFFF" size={12} />}
                  </TouchableOpacity>
                  <View>
                    <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)}>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }}>
                        I agree to the Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openTermsModal}>
                      <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                        Read Full Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                  onPress={() => setShowBookingModal(false)}
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
                    opacity: (processing || !termsAccepted || !bookingData.contact_phone || !bookingData.contact_email || bookingData.pilgrims < 1) ? 0.5 : 1,
                  }}
                  onPress={confirmBooking}
                  disabled={processing || !termsAccepted || !bookingData.contact_phone || !bookingData.contact_email || bookingData.pilgrims < 1}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Confirm Booking</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={showTermsModal} transparent animationType="fade">
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
                Terms & Conditions
              </Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 10;
                if (isAtBottom) {
                  setTermsScrollComplete(true);
                }
              }}
              scrollEventThrottle={16}
            >
              <View style={{ marginBottom: 12 }}>
                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>1. Booking Terms</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    By booking a Hajj or Umrah package through Itqaan, you agree to the following terms and conditions.
                    All bookings are subject to availability and confirmation by the service provider.
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>2. Payment & Cancellation</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    • A non-refundable deposit is required to confirm your booking{'\n'}
                    • Full payment must be completed before the final deadline{'\n'}
                    • Cancellation policies vary by package and provider{'\n'}
                    • Refunds are subject to the provider's cancellation policy
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>3. Travel Requirements</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    • A valid passport with at least 6 months validity is required{'\n'}
                    • Visa processing times vary by country and season{'\n'}
                    • Health requirements and vaccinations may apply{'\n'}
                    • Travel insurance is recommended for all pilgrims
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>4. Pilgrim Responsibilities</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    • All pilgrims must follow the guidance of their group leader{'\n'}
                    • Respect the sanctity of the holy sites at all times{'\n'}
                    • Follow all Saudi Arabian laws and regulations{'\n'}
                    • Maintain appropriate Islamic conduct throughout the journey
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>5. Liability</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                    Itqaan acts as a platform connecting pilgrims with verified service providers.
                    We are not responsible for the acts or omissions of third-party providers.
                    All services are provided by the listed operators.
                  </Text>
                </View>
              </View>

              {!termsScrollComplete && (
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '600' }}>Scroll to the bottom to accept</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowTermsModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: termsScrollComplete ? '#032A24' : '#F3F4F6',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  opacity: termsScrollComplete ? 1 : 0.6,
                }}
                onPress={acceptTerms}
                disabled={!termsScrollComplete}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: termsScrollComplete ? '#FFFFFF' : '#6B7280',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  {termsScrollComplete ? 'Accept Terms' : 'Please read all terms'}
                </Text>
              </TouchableOpacity>
            </View>
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
                Booking Submitted!
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
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>Your booking request for</Text>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', marginTop: 2 }}>
                  {selectedPackage?.name}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>has been submitted successfully!</Text>
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
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Pilgrims</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{bookingData.pilgrims}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(3, 42, 36, 0.04)' }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Total</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 15, fontWeight: '700' }}>
                    {formatCurrency(selectedPackage?.price * (bookingData.pilgrims || 1))}
                  </Text>
                </View>
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
                  Our team will contact you within 24 hours to confirm your booking and provide further details.
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
                  "And proclaim to the people the Hajj [pilgrimage]; they will come to you on foot and on every lean camel..." — Quran 22:27
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

export default Hajj;