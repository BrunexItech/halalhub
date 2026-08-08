import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { hearseService } from '../../api/client';

const HearseProviderDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
  });

  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [profile, setProfile] = useState({
    businessName: '',
    phone: '',
    email: '',
    serviceArea: '',
    isVerified: false,
    status: 'pending',
  });

  useEffect(() => {
    fetchProfile();
    fetchRequests();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setProfile({
        businessName: user?.fullName || user?.business_name || 'Hearse Provider',
        phone: user?.phone || '',
        email: user?.email || '',
        serviceArea: user?.region || 'Nairobi',
        isVerified: false,
        status: 'pending',
      });
    } catch (err) {
      console.log('Error fetching profile:', err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await hearseService.getProviderRequests();
      if (response.data.success) {
        setRequests(response.data.requests || []);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.log('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await hearseService.getProviderStats();
      if (response.data.success) {
        setStats(response.data.stats || {
          totalRequests: 0,
          pendingRequests: 0,
          inProgressRequests: 0,
          completedRequests: 0,
        });
      }
    } catch (err) {
      console.log('Error fetching stats:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
    fetchStats();
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessing(true);
    setError('');
    try {
      await hearseService.acceptRequest(requestId);
      setSuccess('Request accepted successfully');
      await fetchRequests();
      await fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to accept request');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    setProcessing(true);
    setError('');
    try {
      await hearseService.completeRequest(requestId);
      setSuccess('Request marked as completed');
      await fetchRequests();
      await fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to complete request');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleContactClient = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FEF3C7', text: '#D97706' },
      in_progress: { bg: '#DBEAFE', text: '#3B82F6' },
      completed: { bg: '#D1FAE5', text: '#3FAF73' },
      cancelled: { bg: '#FEE2E2', text: '#DC2626' },
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
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

  if (loading && requests.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading dashboard...</Text>
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
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <View>
              <Text style={{ color: '#1F2937', fontSize: 24, fontWeight: '700' }}>Hearse Provider Dashboard</Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
                Manage funeral service requests and client communications
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <View style={{
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#E8EEF4',
              }}>
                <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>{profile.businessName}</Text>
              </View>
              <View style={{
                backgroundColor: profile.isVerified ? '#D1FAE5' : '#FEF3C7',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: profile.isVerified ? '#A7F3D0' : '#FDE68A',
              }}>
                <Text style={{
                  color: profile.isVerified ? '#3FAF73' : '#D97706',
                  fontSize: 13,
                  fontWeight: '500',
                }}>
                  {profile.isVerified ? 'Verified' : 'Pending Verification'}
                </Text>
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

          {success ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(63, 175, 115, 0.2)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}>
              <Text style={{ color: '#3FAF73', fontSize: 13 }}>{success}</Text>
            </View>
          ) : null}

          {/* Stats */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Requests', value: stats.totalRequests, color: '#1F2937' },
              { label: 'Pending', value: stats.pendingRequests, color: '#D97706' },
              { label: 'In Progress', value: stats.inProgressRequests, color: '#3B82F6' },
              { label: 'Completed', value: stats.completedRequests, color: '#3FAF73' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 60,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{item.label}</Text>
                <Text style={{ color: item.color, fontSize: 24, fontWeight: '700' }}>{item.value}</Text>
              </View>
            ))}
          </View>

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
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>Filter:</Text>
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: filter === status ? '#0B342B' : '#FAFAF7',
                  }}
                  onPress={() => setFilter(status)}
                >
                  <Text style={{
                    color: filter === status ? '#FFFFFF' : '#6B7280',
                    fontSize: 13,
                    fontWeight: filter === status ? '600' : '500',
                    textTransform: 'capitalize',
                  }}>
                    {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ marginLeft: 'auto' }}
                onPress={() => { fetchRequests(); fetchStats(); }}
              >
                <Text style={{ color: '#0B342B', fontSize: 13, fontWeight: '500' }}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Requests List */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#F4F5F1',
            }}>
              <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Service Requests</Text>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>{filteredRequests.length} request(s) found</Text>
            </View>

            {filteredRequests.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>No requests found</Text>
              </View>
            ) : (
              filteredRequests.map((request) => {
                const status = getStatusBadge(request.status);
                return (
                  <View key={request.id} style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F4F5F1',
                    backgroundColor: '#FFFFFF',
                    gap: 6,
                  }}>
                    <View style={{ flex: 0.6, minWidth: 70 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                        {request.id}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 80 }}>
                      <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }}>
                        {getServiceLabel(request.service_type)}
                      </Text>
                      {request.urgency === 'urgent' && (
                        <View style={{
                          backgroundColor: '#FEE2E2',
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                          borderRadius: 999,
                          alignSelf: 'flex-start',
                        }}>
                          <Text style={{ color: '#DC2626', fontSize: 10, fontWeight: '500' }}>Urgent</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 80 }}>
                      <Text style={{ color: '#1F2937', fontSize: 13 }} numberOfLines={1}>
                        {request.contact_person || 'Client'}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{request.contact_phone}</Text>
                    </View>
                    <View style={{ flex: 0.7, minWidth: 70 }}>
                      <Text style={{ color: '#1F2937', fontSize: 13 }}>{formatDate(request.scheduled_date)}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{request.scheduled_time}</Text>
                    </View>
                    <View style={{ flex: 0.6, minWidth: 70 }}>
                      <View style={{
                        backgroundColor: status.style.bg,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        alignSelf: 'flex-start',
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.05)',
                      }}>
                        <Text style={{ color: status.style.text, fontSize: 12, fontWeight: '500' }}>{status.label}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, minWidth: 100, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                        }}
                        onPress={() => handleViewRequest(request)}
                      >
                        <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '500' }}>View</Text>
                      </TouchableOpacity>
                      {request.status === 'pending' && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#3FAF73',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 6,
                            opacity: processing ? 0.6 : 1,
                          }}
                          onPress={() => handleAcceptRequest(request.id)}
                          disabled={processing}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Accept</Text>
                        </TouchableOpacity>
                      )}
                      {request.status === 'in_progress' && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#3B82F6',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 6,
                            opacity: processing ? 0.6 : 1,
                          }}
                          onPress={() => handleCompleteRequest(request.id)}
                          disabled={processing}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Complete</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#0B342B',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                        onPress={() => handleContactClient(request.contact_phone)}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Call</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Profile Card */}
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
            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Provider Profile</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {[
                { label: 'Business Name', value: profile.businessName },
                { label: 'Phone', value: profile.phone },
                { label: 'Email', value: profile.email },
                { label: 'Service Area', value: profile.serviceArea },
              ].map((item, index) => (
                <View key={index} style={{ flex: 1, minWidth: 100 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Islamic Guidance */}
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: '#6B7280', fontSize: 13, letterSpacing: 1 }}>
              Serving the community with dignity and respect
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2, fontStyle: 'italic' }}>
              "Every soul shall taste death." — Quran 3:185
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Request Details Modal */}
      <Modal visible={showRequestModal} transparent animationType="fade">
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
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Request Details</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Request ID</Text>
                  <Text style={{ color: '#1F2937', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    {selectedRequest?.id}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Service Type</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {getServiceLabel(selectedRequest?.service_type)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Status</Text>
                  <View style={{
                    backgroundColor: getStatusBadge(selectedRequest?.status).style.bg,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.05)',
                  }}>
                    <Text style={{
                      color: getStatusBadge(selectedRequest?.status).style.text,
                      fontSize: 12,
                      fontWeight: '500',
                    }}>
                      {getStatusBadge(selectedRequest?.status).label}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Date</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {formatDate(selectedRequest?.scheduled_date)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Time</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {selectedRequest?.scheduled_time}
                  </Text>
                </View>
                {selectedRequest?.pickup_location && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#E8EEF4',
                    marginTop: 4,
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Pickup Location</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                      {selectedRequest.pickup_location}
                    </Text>
                  </View>
                )}
                {selectedRequest?.destination_location && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Destination</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                      {selectedRequest.destination_location}
                    </Text>
                  </View>
                )}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: '#E8EEF4',
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Client</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {selectedRequest?.contact_person}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Phone</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {selectedRequest?.contact_phone}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Urgency</Text>
                  <Text style={{
                    color: selectedRequest?.urgency === 'urgent' ? '#DC2626' : '#1F2937',
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    {selectedRequest?.urgency === 'urgent' ? 'Urgent' : 'Standard'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {selectedRequest?.status === 'pending' && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#3FAF73',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      opacity: processing ? 0.6 : 1,
                    }}
                    onPress={() => {
                      handleAcceptRequest(selectedRequest.id);
                      setShowRequestModal(false);
                    }}
                    disabled={processing}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Accept Request</Text>
                  </TouchableOpacity>
                )}
                {selectedRequest?.status === 'in_progress' && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#3B82F6',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      opacity: processing ? 0.6 : 1,
                    }}
                    onPress={() => {
                      handleCompleteRequest(selectedRequest.id);
                      setShowRequestModal(false);
                    }}
                    disabled={processing}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => handleContactClient(selectedRequest?.contact_phone)}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Call Client</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}
                  onPress={() => setShowRequestModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HearseProviderDashboard;