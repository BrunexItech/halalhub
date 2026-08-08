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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { hajjService } from '../../api/client';

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
  });

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrollComplete, setTermsScrollComplete] = useState(false);

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
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading packages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* Hero Section */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Hajj & Umrah
                </Text>
                <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>
                  Pilgrimage Packages
                </Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>
                Your Journey of a Lifetime
              </Text>
              <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 6, maxWidth: 400, lineHeight: 20 }}>
                Discover and book Hajj and Umrah packages with trusted operators.
                All packages include visa assistance, accommodation, and spiritual guidance.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>Trusted Operators</Text>
                </View>
              </View>
            </View>
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Filters */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
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
                    backgroundColor: filterType === filter.id ? '#0B342B' : '#FAFAF7',
                    shadowColor: filterType === filter.id ? '#0B342B' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: filterType === filter.id ? 0.2 : 0,
                    shadowRadius: 8,
                    elevation: filterType === filter.id ? 4 : 0,
                  }}
                  onPress={() => setFilterType(filter.id)}
                >
                  <Text style={{
                    color: filterType === filter.id ? '#FFFFFF' : '#6B7280',
                    fontSize: 14,
                    fontWeight: filterType === filter.id ? '600' : '500',
                  }}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Packages */}
          {packages.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E8EEF4',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>No packages found for this category.</Text>
            </View>
          ) : (
            packages.map((pkg) => (
              <View key={pkg.id} style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                      <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{pkg.name}</Text>
                      <View style={{
                        backgroundColor: getTierColor(pkg.type) + '15',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}>
                        <Text style={{ color: getTierColor(pkg.type), fontSize: 12, fontWeight: '600' }}>
                          {getTypeLabel(pkg.type)}
                        </Text>
                      </View>
                      {pkg.is_featured && (
                        <View style={{
                          backgroundColor: '#C9A44B',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Featured</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>{pkg.vendor_name || 'Trusted Operator'} · {pkg.duration_days} days</Text>
                    <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 6, lineHeight: 20 }}>{pkg.description}</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {(pkg.includes || []).slice(0, 5).map((feature: string, i: number) => (
                        <View key={i} style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 12 }}>{feature}</Text>
                        </View>
                      ))}
                      {(pkg.includes || []).length > 5 && (
                        <View style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 12 }}>+{(pkg.includes || []).length - 5}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', minWidth: 100 }}>
                    <Text style={{ color: '#0B342B', fontSize: 24, fontWeight: '700' }}>{formatCurrency(pkg.price)}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>per person</Text>
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: '#F4F5F1',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ color: '#C9A44B', fontSize: 14 }}>★</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{pkg.vendor_rating || 'New'}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>({pkg.total_bookings || 0} bookings)</Text>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>·</Text>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>{pkg.available_slots || 0} slots left</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        backgroundColor: '#FAFAF7',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                      }}
                      onPress={() => handleEnquire(pkg)}
                    >
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>Enquire</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: (pkg.is_active && pkg.available_slots > 0) ? '#0B342B' : '#F4F5F1',
                        opacity: (pkg.is_active && pkg.available_slots > 0) ? 1 : 0.6,
                        shadowColor: (pkg.is_active && pkg.available_slots > 0) ? '#0B342B' : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: (pkg.is_active && pkg.available_slots > 0) ? 0.2 : 0,
                        shadowRadius: 8,
                        elevation: (pkg.is_active && pkg.available_slots > 0) ? 4 : 0,
                      }}
                      onPress={() => (pkg.is_active && pkg.available_slots > 0) && handleBookNow(pkg)}
                      disabled={!pkg.is_active || pkg.available_slots <= 0}
                    >
                      <Text style={{
                        color: (pkg.is_active && pkg.available_slots > 0) ? '#FFFFFF' : '#6B7280',
                        fontSize: 14,
                        fontWeight: '600',
                      }}>
                        {pkg.is_active && pkg.available_slots > 0 ? 'Book Now' : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Quick Enquiry Sidebar */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Quick Enquiry</Text>
            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Journey Type</Text>
              <TextInput
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: '#1F2937',
                  fontSize: 14,
                }}
                value={bookingData.journeyType || 'hajj'}
                onChangeText={(text) => setBookingData({ ...bookingData, journeyType: text })}
                placeholder="hajj"
              />
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Departure City</Text>
              <TextInput
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: '#1F2937',
                  fontSize: 14,
                }}
                value={bookingData.departureCity || 'Nairobi'}
                onChangeText={(text) => setBookingData({ ...bookingData, departureCity: text })}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Adults</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={String(bookingData.adults || 2)}
                  onChangeText={(text) => setBookingData({ ...bookingData, adults: parseInt(text) || 2 })}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Children</Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={String(bookingData.children || 0)}
                  onChangeText={(text) => setBookingData({ ...bookingData, children: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#0B342B',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
                shadowColor: '#0B342B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => {
                setSuccess('Enquiry sent! We will contact you soon.');
                setTimeout(() => setSuccess(''), 3000);
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Send Enquiry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Package Detail Modal */}
      <Modal visible={showPackageModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>{selectedPackage?.name}</Text>
              <TouchableOpacity onPress={() => setShowPackageModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Operator</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedPackage?.vendor_name || 'Trusted Operator'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Duration</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedPackage?.duration_days} days</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Type</Text>
                  <Text style={{ color: getTierColor(selectedPackage?.type), fontSize: 14, fontWeight: '600' }}>
                    {getTypeLabel(selectedPackage?.type)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Price</Text>
                  <Text style={{ color: '#0B342B', fontSize: 18, fontWeight: '700' }}>{formatCurrency(selectedPackage?.price)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Available Slots</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedPackage?.available_slots || 0}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Total Bookings</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedPackage?.total_bookings || 0}</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>{selectedPackage?.description}</Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>Included:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {(selectedPackage?.includes || []).map((feature: string, i: number) => (
                    <View key={i} style={{
                      backgroundColor: '#FAFAF7',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                    }}>
                      <Text style={{ color: '#1F2937', fontSize: 12 }}>✓ {feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {(selectedPackage?.excludes || []).length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>Excludes:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {(selectedPackage?.excludes || []).map((item: string, i: number) => (
                      <View key={i} style={{
                        backgroundColor: '#FEF2F2',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(220, 38, 38, 0.2)',
                      }}>
                        <Text style={{ color: '#DC2626', fontSize: 12 }}>✗ {item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: (selectedPackage?.is_active && selectedPackage?.available_slots > 0) ? '#0B342B' : '#DC2626',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  {(selectedPackage?.is_active && selectedPackage?.available_slots > 0) ? '✓ Available' : '✗ Currently Unavailable'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowPackageModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Close</Text>
                </TouchableOpacity>
                {(selectedPackage?.is_active && selectedPackage?.available_slots > 0) && (
                  <TouchableOpacity
                    style={{
                      flex: 2,
                      backgroundColor: '#0B342B',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      shadowColor: '#0B342B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={() => {
                      setShowPackageModal(false);
                      handleBookNow(selectedPackage);
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Book Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Booking Modal */}
      <Modal visible={showBookingModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Book {selectedPackage?.name}</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Package</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedPackage?.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Price</Text>
                  <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>{formatCurrency(selectedPackage?.price)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Duration</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedPackage?.duration_days} days</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Available Slots</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{selectedPackage?.available_slots || 0}</Text>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Pilgrim Details
                </Text>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Number of Pilgrims *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
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
                  <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                    Max {selectedPackage?.available_slots || 50} slots available
                  </Text>
                </View>

                {Array.from({ length: bookingData.pilgrims || 1 }).map((_, index) => (
                  <View key={index} style={{
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    marginBottom: 8,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                      Pilgrim {index + 1}
                    </Text>
                    <View style={{ marginBottom: 6 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', marginBottom: 2 }}>Full Name</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={(bookingData.pilgrim_names || [])[index] || ''}
                        onChangeText={(text) => handlePilgrimNameChange(index, text)}
                        placeholder="Enter full name"
                      />
                    </View>
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', marginBottom: 2 }}>Passport Number</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={(bookingData.passport_numbers || [])[index] || ''}
                        onChangeText={(text) => handlePassportChange(index, text)}
                        placeholder="Enter passport number"
                      />
                    </View>
                  </View>
                ))}

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Contact Phone *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={bookingData.contact_phone}
                    onChangeText={(text) => setBookingData({ ...bookingData, contact_phone: text })}
                    placeholder="Enter your phone number"
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Contact Email *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={bookingData.contact_email}
                    onChangeText={(text) => setBookingData({ ...bookingData, contact_email: text })}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Special Requests</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      color: '#1F2937',
                      fontSize: 14,
                      minHeight: 60,
                      textAlignVertical: 'top',
                    }}
                    value={bookingData.special_requests}
                    onChangeText={(text) => setBookingData({ ...bookingData, special_requests: text })}
                    placeholder="Any special requirements..."
                    multiline
                  />
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 12,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>Total</Text>
                    <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>
                      {formatCurrency(selectedPackage?.price * (bookingData.pilgrims || 1))}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <TouchableOpacity
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: termsAccepted ? '#0B342B' : 'rgba(11, 52, 43, 0.12)',
                      backgroundColor: termsAccepted ? '#0B342B' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    {termsAccepted && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </TouchableOpacity>
                  <View>
                    <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)}>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>
                        I agree to the Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openTermsModal}>
                      <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500', marginTop: 2 }}>
                        Read Full Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowBookingModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: (processing || !termsAccepted || !bookingData.contact_phone || !bookingData.contact_email || bookingData.pilgrims < 1) ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={confirmBooking}
                  disabled={processing || !termsAccepted || !bookingData.contact_phone || !bookingData.contact_email || bookingData.pilgrims < 1}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Confirm Booking</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={showTermsModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
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
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>1. Booking Terms</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    By booking a Hajj or Umrah package through Itqaan, you agree to the following terms and conditions.
                    All bookings are subject to availability and confirmation by the service provider.
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>2. Payment & Cancellation</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    • A non-refundable deposit is required to confirm your booking{'\n'}
                    • Full payment must be completed before the final deadline{'\n'}
                    • Cancellation policies vary by package and provider{'\n'}
                    • Refunds are subject to the provider's cancellation policy
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>3. Travel Requirements</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    • A valid passport with at least 6 months validity is required{'\n'}
                    • Visa processing times vary by country and season{'\n'}
                    • Health requirements and vaccinations may apply{'\n'}
                    • Travel insurance is recommended for all pilgrims
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>4. Pilgrim Responsibilities</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    • All pilgrims must follow the guidance of their group leader{'\n'}
                    • Respect the sanctity of the holy sites at all times{'\n'}
                    • Follow all Saudi Arabian laws and regulations{'\n'}
                    • Maintain appropriate Islamic conduct throughout the journey
                  </Text>
                </View>

                <View style={{
                  backgroundColor: '#FAFAF7',
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  marginBottom: 10,
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>5. Liability</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
                    Itqaan acts as a platform connecting pilgrims with verified service providers.
                    We are not responsible for the acts or omissions of third-party providers.
                    All services are provided by the listed operators.
                  </Text>
                </View>
              </View>

              {!termsScrollComplete && (
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 14, fontWeight: '600' }}>Scroll to the bottom to accept</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#F4F5F1',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: termsScrollComplete ? '#0B342B' : '#F4F5F1',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: termsScrollComplete ? 1 : 0.6,
                }}
                onPress={acceptTerms}
                disabled={!termsScrollComplete}
              >
                <Text style={{
                  color: termsScrollComplete ? '#FFFFFF' : '#6B7280',
                  fontSize: 15,
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#0B342B',
              padding: 16,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              margin: -20,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Booking Submitted!</Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(11, 52, 43, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(11, 52, 43, 0.2)',
                }}>
                  <Text style={{ color: '#0B342B', fontSize: 32 }}>✓</Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>Your booking request for</Text>
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700', marginTop: 2 }}>{selectedPackage?.name}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>has been submitted successfully!</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Pilgrims</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{bookingData.pilgrims}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E8EEF4' }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>Total</Text>
                  <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>
                    {formatCurrency(selectedPackage?.price * (bookingData.pilgrims || 1))}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                  Our team will contact you within 24 hours to confirm your booking and provide further details.
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 }}>
                  "And proclaim to the people the Hajj [pilgrimage]; they will come to you on foot and on every lean camel..." — Quran 22:27
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#0B342B',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Toast */}
      {success ? (
        <View style={{
          position: 'absolute',
          top: 60,
          right: 16,
          left: 16,
          backgroundColor: '#0B342B',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#0B342B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#C9A44B', fontSize: 16 }}>✓</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Hajj;