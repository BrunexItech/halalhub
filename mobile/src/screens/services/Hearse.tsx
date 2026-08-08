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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { hearseService } from '../../api/client';

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

  const services = [
    {
      id: 'hearse_transport',
      name: 'Islamic Hearse Transport',
      description: 'Dignified transport of the deceased from pickup location to mosque and cemetery.',
      price: 0,
      fields: ['pickupLocation', 'destination', 'mosqueLocation', 'cemeteryLocation'],
      icon: 'H',
    },
    {
      id: 'shroud',
      name: 'Shroud / Kafan Services',
      description: 'Complete shroud (kafan) set for male, female, or child.',
      price: 0,
      fields: ['shroudType', 'shroudQuantity'],
      icon: 'S',
    },
    {
      id: 'complete_service',
      name: 'Complete Funeral Service',
      description: 'Full funeral assistance including hearse, shroud, and burial coordination.',
      price: 0,
      fields: ['pickupLocation', 'destination', 'mosqueLocation', 'cemeteryLocation', 'shroudType', 'shroudQuantity'],
      icon: 'C',
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

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setRequestData({
      ...requestData,
      serviceType: service.id,
    });
    setError('');
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
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading services...</Text>
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
                  Islamic Services
                </Text>
                <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>24/7 Support</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Hearse & Shroud Services</Text>
              <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 6, maxWidth: 400, lineHeight: 20 }}>
                Dignified and respectful funeral assistance. Available 24/7 to support you during difficult times.
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
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>24/7 Support Available</Text>
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

          {/* Services */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Select a Service</Text>
            {services.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <TouchableOpacity
                  key={service.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? '#0B342B' : '#E8EEF4',
                    shadowColor: isSelected ? '#0B342B' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.1 : 0,
                    shadowRadius: 8,
                    elevation: isSelected ? 2 : 0,
                  }}
                  onPress={() => handleServiceSelect(service)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: '#FAFAF7',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                      }}>
                        <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>{service.icon}</Text>
                      </View>
                      <View>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{service.name}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{service.description}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '600' }}>Free</Text>
                      {isSelected && (
                        <Text style={{ color: '#0B342B', fontSize: 12, fontWeight: '500' }}>✓ Selected</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Request Form */}
          {selectedService ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E8EEF4',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Service Details</Text>

              {(selectedService.id === 'hearse_transport' || selectedService.id === 'complete_service') && (
                <>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Pickup Location *</Text>
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
                      value={requestData.pickupLocation}
                      onChangeText={(text) => handleRequestChange('pickupLocation', text)}
                      placeholder="Enter pickup location"
                    />
                  </View>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Destination Location</Text>
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
                      value={requestData.destination}
                      onChangeText={(text) => handleRequestChange('destination', text)}
                      placeholder="Enter destination location"
                    />
                  </View>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Mosque Location (Optional)</Text>
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
                      value={requestData.mosqueLocation}
                      onChangeText={(text) => handleRequestChange('mosqueLocation', text)}
                      placeholder="Enter mosque location"
                    />
                  </View>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Cemetery Location (Optional)</Text>
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
                      value={requestData.cemeteryLocation}
                      onChangeText={(text) => handleRequestChange('cemeteryLocation', text)}
                      placeholder="Enter cemetery location"
                    />
                  </View>
                </>
              )}

              {(selectedService.id === 'shroud' || selectedService.id === 'complete_service') && (
                <>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Shroud Type *</Text>
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <TextInput
                        style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                        value={requestData.shroudType}
                        onChangeText={(text) => handleRequestChange('shroudType', text)}
                        placeholder="adult_male"
                      />
                    </View>
                  </View>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Quantity *</Text>
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
                      value={String(requestData.shroudQuantity)}
                      onChangeText={(text) => handleRequestChange('shroudQuantity', parseInt(text) || 1)}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Contact Person *</Text>
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
                    value={requestData.contactPerson}
                    onChangeText={(text) => handleRequestChange('contactPerson', text)}
                    placeholder="Enter contact person"
                  />
                </View>
                <View style={{ flex: 1 }}>
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
                    value={requestData.contactPhone}
                    onChangeText={(text) => handleRequestChange('contactPhone', text)}
                    placeholder="Enter phone number"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Scheduled Date</Text>
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
                    value={requestData.scheduledDate}
                    onChangeText={(text) => handleRequestChange('scheduledDate', text)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Scheduled Time</Text>
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
                    value={requestData.scheduledTime}
                    onChangeText={(text) => handleRequestChange('scheduledTime', text)}
                    placeholder="HH:MM"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Urgency</Text>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={requestData.urgency}
                    onChangeText={(text) => handleRequestChange('urgency', text)}
                    placeholder="standard"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
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
                  value={requestData.specialRequests}
                  onChangeText={(text) => handleRequestChange('specialRequests', text)}
                  placeholder="Any special requirements or instructions..."
                  multiline
                />
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#0B342B',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={handleRequestSubmit}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Emergency Contact */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Emergency Contact</Text>
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 2,
              borderColor: 'rgba(220, 38, 38, 0.2)',
              borderRadius: 10,
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '500' }}>24/7 Support Hotline</Text>
              <Text style={{ color: '#DC2626', fontSize: 28, fontWeight: '700', marginTop: 4 }}>0800 720 720</Text>
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>Available 24 hours a day, 7 days a week</Text>
            </View>
          </View>

          {/* Islamic Guidance */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Islamic Guidance</Text>
            <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', marginBottom: 10, fontStyle: 'italic' }}>
              "Every soul shall taste death." — Quran 3:185
            </Text>
            <View style={{
              backgroundColor: '#FAFAF7',
              padding: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#E8EEF4',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#1F2937', fontSize: 20, textAlign: 'center' }}>إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Inna lillahi wa inna ilayhi raji'un</Text>
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>"To Allah we belong and to Him we shall return"</Text>
            </View>
          </View>

          {/* My Requests */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>My Requests</Text>
              <TouchableOpacity onPress={fetchMyRequests}>
                <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {loadingRequests ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#C9A44B" />
              </View>
            ) : myRequests.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>No requests yet</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Submit a request to get started</Text>
              </View>
            ) : (
              myRequests.slice(0, 5).map((request) => {
                const status = getStatusBadge(request.status);
                return (
                  <View key={request.id} style={{
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    marginBottom: 6,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                          {getServiceLabel(request.service_type)}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(request.scheduled_date || request.createdat)}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                          {request.reference}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: status.style.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.05)',
                      }}>
                        <Text style={{ color: status.style.text, fontSize: 12, fontWeight: '500' }}>{status.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
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
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Confirm Request</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>{selectedService?.name}</Text>
              </View>

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                {requestData.pickupLocation && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Pickup</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{requestData.pickupLocation}</Text>
                  </View>
                )}
                {requestData.destination && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Destination</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{requestData.destination}</Text>
                  </View>
                )}
                {requestData.contactPerson && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Contact</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{requestData.contactPerson}</Text>
                  </View>
                )}
                {requestData.shroudType && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Shroud Type</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                      {shroudTypes.find((t) => t.id === requestData.shroudType)?.label || requestData.shroudType}
                    </Text>
                  </View>
                )}
                {requestData.urgency && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Urgency</Text>
                    <Text style={{
                      color: requestData.urgency === 'urgent' ? '#DC2626' : '#1F2937',
                      fontSize: 14,
                      fontWeight: '600',
                    }}>
                      {requestData.urgency === 'urgent' ? 'Urgent' : 'Standard'}
                    </Text>
                  </View>
                )}
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
                  A service provider will contact you shortly to confirm the details and coordinate the service.
                </Text>
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
                  onPress={() => setShowConfirmModal(false)}
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
                    opacity: processing ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={confirmRequest}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Confirm Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Request Submitted</Text>
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
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>Your request has been submitted</Text>
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700', marginTop: 2 }}>Reference: {requestId}</Text>
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
                  A service provider will contact you within 10 minutes to confirm the details.
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
                  "Every soul shall taste death." — Quran 3:185
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

export default Hearse;