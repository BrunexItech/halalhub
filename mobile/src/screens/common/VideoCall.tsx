import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { bookingService } from '../../api/client';

const VideoCall = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const bookingId = route.params?.bookingId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingService.getBookingById(bookingId);

      if (res.data.success && res.data.booking) {
        const data = res.data.booking;
        setBooking(data);
        setIsConnecting(false);
        setLoading(false);
      } else {
        setError('Booking not found. Please check your booking ID.');
        setLoading(false);
      }
    } catch (err) {
      console.log('Error fetching booking:', err);
      setError('Failed to load booking details. Please try again.');
      setLoading(false);
    }
  };

  const handleLeave = () => {
    navigation.goBack();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#032A24' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: 'rgba(201, 164, 75, 0.8)', marginTop: 16, fontSize: 15, fontWeight: '500' }}>
            Preparing Your Consultation
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 4 }}>
            Please wait while we connect you
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 4,
              borderColor: '#FCA5A5',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 32 }}>⚠️</Text>
            </View>
            <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700', marginTop: 16 }}>
              Unable to Start Call
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              {error}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#0B342B',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={fetchBookingDetails}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                }}
                onPress={handleLeave}
              >
                <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Waiting for confirmation
  if (booking && booking.status !== 'confirmed' && booking.status !== 'completed') {
    const statusMessages: Record<string, string> = {
      pending: 'Waiting for the religious leader to accept your request',
      cancelled: 'This consultation has been cancelled',
      rejected: 'This consultation was rejected by the religious leader',
      expired: 'This consultation has expired',
    };

    const message = statusMessages[booking.status] || 'This consultation is not ready yet';
    const isPending = booking.status === 'pending';

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: isPending ? '#FEF3C7' : '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 4,
              borderColor: isPending ? '#FDE68A' : '#FCA5A5',
            }}>
              <Text style={{ color: isPending ? '#D97706' : '#DC2626', fontSize: 32 }}>
                {isPending ? '⏳' : '✕'}
              </Text>
            </View>
            <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700', marginTop: 16 }}>
              {isPending ? 'Awaiting Confirmation' : 'Consultation Not Available'}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              {message}
            </Text>
            {isPending && (
              <>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                  You will be able to join once the leader confirms.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706' }} />
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Waiting for confirmation...</Text>
                </View>
              </>
            )}
            <TouchableOpacity
              style={{
                backgroundColor: '#0B342B',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                width: '100%',
                marginTop: 20,
                shadowColor: '#0B342B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={handleLeave}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Back to Consultations</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // No room
  if (!booking || !booking.room_name) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FEF3C7',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 4,
              borderColor: '#FDE68A',
            }}>
              <Text style={{ color: '#D97706', fontSize: 28 }}>⚠️</Text>
            </View>
            <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 16 }}>
              Meeting Not Ready
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              The video room has not been created for this booking yet.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#0B342B',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                width: '100%',
                marginTop: 16,
                shadowColor: '#0B342B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={handleLeave}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Back to Consultations</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Video Call UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A1A15' }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          backgroundColor: '#0B342B',
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(201, 164, 75, 0.1)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={handleLeave}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Video Consultation</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                {booking?.leader_name || 'Religious Leader'} · {formatDate(booking?.booking_date)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.05)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.05)',
            }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isConnected ? '#3FAF73' : '#D97706',
              }} />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginLeft: 4 }}>
                {isConnected ? 'Connected' : 'Connecting...'}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#DC2626',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 8,
              }}
              onPress={handleLeave}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>End</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Container */}
        <View style={{ flex: 1, backgroundColor: '#0A1A15', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            backgroundColor: '#0A1A15',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(201, 164, 75, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: 'rgba(201, 164, 75, 0.2)',
            }}>
              <Text style={{ fontSize: 36 }}>📹</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '500', marginTop: 16 }}>
              {isConnected ? 'Connected' : 'Connecting to server...'}
            </Text>
            {isConnected && (
              <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 14, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {formatDuration(callDuration)}
              </Text>
            )}
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 8 }}>
              Ref: {bookingId?.slice(0, 12)}...
            </Text>
          </View>

          {/* Controls */}
          <View style={{
            position: 'absolute',
            bottom: 24,
            left: 16,
            right: 16,
            backgroundColor: 'rgba(10, 26, 21, 0.85)',
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.05)',
          }}>
            <TouchableOpacity
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: isMuted ? 'rgba(220, 38, 38, 0.3)' : 'rgba(255,255,255,0.1)',
              }}
              onPress={toggleMute}
            >
              <Text style={{ color: isMuted ? '#DC2626' : '#FFFFFF', fontSize: 18 }}>
                {isMuted ? '🔇' : '🎤'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: isVideoOff ? 'rgba(220, 38, 38, 0.3)' : 'rgba(255,255,255,0.1)',
              }}
              onPress={toggleVideo}
            >
              <Text style={{ color: isVideoOff ? '#DC2626' : '#FFFFFF', fontSize: 18 }}>
                {isVideoOff ? '📷' : '🎥'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
              onPress={() => {}}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>🖥️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
              onPress={() => {}}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>⛶</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: '#DC2626',
              }}
              onPress={handleLeave}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={{
          backgroundColor: '#0B342B',
          paddingVertical: 8,
          paddingHorizontal: 16,
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: 'rgba(201, 164, 75, 0.1)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image
              source={require("../../../assets/itqaan_logo.png")}
              style={{ height: 16, width: 40, opacity: 0.7 }}
              resizeMode="contain"
            />
            <Text style={{ color: 'rgba(201, 164, 75, 0.4)', fontSize: 10, letterSpacing: 1, fontWeight: '500' }}>
              Secure Video Consultation
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default VideoCall;