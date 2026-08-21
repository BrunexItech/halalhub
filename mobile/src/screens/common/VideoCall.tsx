import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  StatusBar,
  Dimensions,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { bookingService, livekitService } from '../../api/client';

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useLocalParticipant,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import type { TrackReference } from '@livekit/react-native';

const { width, height } = Dimensions.get('window');

// Inner component that uses useTracks / useLocalParticipant (must be inside LiveKitRoom)
const VideoGrid = ({
  isConnected,
  styles,
}: {
  isConnected: boolean;
  styles: any;
}) => {
  const { localParticipant } = useLocalParticipant();

  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });

  const remoteVideoTrack = tracks.find(
    (t) => !t.participant.isLocal && t.source === Track.Source.Camera
  ) as TrackReference | undefined;

  const localCameraPublication = localParticipant
    ? Array.from(localParticipant.videoTrackPublications.values()).find(
        (pub) => pub.source === Track.Source.Camera
      )
    : undefined;

  const localVideoTrack: TrackReference | undefined = localCameraPublication
    ? {
        participant: localParticipant,
        publication: localCameraPublication,
        source: Track.Source.Camera,
      }
    : undefined;

  const localTrackSid = localVideoTrack?.publication?.trackSid || 'local';

  // Force local VideoTrack to remount whenever remote track changes
  // (i.e., when B joins/leaves). This fixes the "local disappears when B joins" bug.
  const [localRenderKey, setLocalRenderKey] = useState(0);
  useEffect(() => {
    // Increment key whenever remote track SID changes
    setLocalRenderKey((k) => k + 1);
  }, [remoteVideoTrack?.publication?.trackSid]);

  console.log('[VideoGrid] tracks:', tracks);
  console.log(
    '[VideoGrid] tracks length:',
    tracks?.length,
    'isConnected:',
    isConnected
  );

  console.log(
    '[VideoGrid] localVideoTrack:',
    localVideoTrack?.publication?.trackSid,
    'remoteVideoTrack:',
    remoteVideoTrack?.publication?.trackSid
  );

  useEffect(() => {
    console.log('[VideoGrid] useTracks changed:', {
      count: tracks.length,
      tracks: tracks.map((t) => ({
        source: t.source,
        kind: t.kind,
        participant: t.participant.identity,
        isLocal: t.participant.isLocal,
        publicationSid: t.publication?.trackSid,
      })),
    });
  }, [tracks]);

  return (
    <View style={styles.videoGrid}>
      {/* Remote video */}
      {remoteVideoTrack ? (
        <VideoTrack
          trackRef={remoteVideoTrack}
          style={styles.remoteVideo}
        />
      ) : (
        <View style={styles.remotePlaceholder}>
          <Text style={styles.remotePlaceholderIcon}>📹</Text>
          <Text style={styles.remotePlaceholderText}>
            {isConnected ? 'Waiting for participant to join...' : 'Connecting...'}
          </Text>
        </View>
      )}

      {/* Local Video - PiP - ALWAYS rendered when connected, key changes when remote changes */}
      {isConnected && (
        <View style={styles.localVideoContainer}>
          <VideoTrack
            key={`local-${localRenderKey}-${localTrackSid}`}
            trackRef={
              localVideoTrack ?? {
                participant: localParticipant,
                publication: localCameraPublication,
                source: Track.Source.Camera,
              }
            }
            style={styles.localVideo}
            mirror={true}
          />
          <Text style={styles.localLabel}>You</Text>
        </View>
      )}
    </View>
  );
};

// Component that uses useLocalParticipant (must be inside LiveKitRoom)
const CallControls = ({
  isConnected,
  setIsMuted,
  setIsVideoOff,
  isMuted,
  isVideoOff,
  onLeave,
  styles,
  formatDuration,
  callDuration,
  booking,
}: any) => {
  const { localParticipant } = useLocalParticipant();
  const cameraEnabledRef = useRef(false);

  useEffect(() => {
    if (!isConnected || !localParticipant || cameraEnabledRef.current) return;

    console.log('[CallControls] localParticipant available, enabling camera/mic');
    cameraEnabledRef.current = true;

    // Small delay to ensure permissions are fully applied
    setTimeout(() => {
      localParticipant
        .setCameraEnabled(true)
        .then(() => {
          console.log('[CallControls] Camera enabled and publishing');
        })
        .catch((err: any) => {
          console.log('[CallControls] Failed to enable camera:', err);
        });

      localParticipant
        .setMicrophoneEnabled(true)
        .then(() => {
          console.log('[CallControls] Microphone enabled and publishing');
        })
        .catch((err: any) => {
          console.log('[CallControls] Failed to enable microphone:', err);
        });
    }, 400);
  }, [isConnected, localParticipant]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!newMuted);
    }
  };

  const toggleVideo = () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    if (localParticipant) {
      localParticipant.setCameraEnabled(!newVideoOff);
    }
  };

  return (
    <>
      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
          <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Text style={styles.controlIcon}>{isVideoOff ? '📷' : '🎥'}</Text>
          <Text style={styles.controlLabel}>{isVideoOff ? 'Off' : 'Video'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endButton} onPress={onLeave}>
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure Video Consultation</Text>
        {isConnected && (
          <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
        )}
      </View>
    </>
  );
};

const VideoCall = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const bookingId = route.params?.bookingId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionsReady, setPermissionsReady] = useState(false);

  const durationInterval = useRef<any | null>(null);

  const LIVEKIT_URL = 'wss://itqaan.co.ke';

  // Request permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        const allGranted = Object.values(granted).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );
        if (allGranted) {
          setPermissionsGranted(true);
          setPermissionsReady(true);
        } else {
          Alert.alert(
            'Permissions Required',
            'Camera and microphone permissions are required for video calls.',
            [
              { text: 'Cancel', onPress: () => navigation.goBack() },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          setPermissionsGranted(false);
          setPermissionsReady(false);
        }
      } catch (err) {
        console.log('Permission error:', err);
        setError('Failed to get permissions');
        setPermissionsGranted(false);
        setPermissionsReady(false);
      }
    } else {
      setPermissionsGranted(true);
      setPermissionsReady(true);
    }
  };

  useEffect(() => {
    requestPermissions();
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (isConnected) {
      durationInterval.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isConnected]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookingById(bookingId);
      if (res.data.success && res.data.booking) {
        const data = res.data.booking;
        setBooking(data);
        setRoomName(data.room_name || `consultation-${bookingId}`);
        if (data.status === 'confirmed' || data.status === 'completed') {
          await generateToken(data.room_name || `consultation-${bookingId}`);
        } else {
          setLoading(false);
        }
      } else {
        setError('Booking not found');
        setLoading(false);
      }
    } catch (err) {
      console.log('Error fetching booking:', err);
      setError('Failed to load booking');
      setLoading(false);
    }
  };

  const generateToken = async (roomNameParam: string) => {
    try {
      const res = await livekitService.getToken({
        roomName: roomNameParam,
        participantName: booking?.user_name || 'User',
        participantIdentity: `user-${booking?.user_id || Date.now()}`,
      });
      if (res.data.success) {
        setToken(res.data.token);
        setLoading(false);
      } else {
        setError('Failed to get access token');
        setLoading(false);
      }
    } catch (err) {
      console.log('Error generating token:', err);
      setError('Failed to join meeting');
      setLoading(false);
    }
  };

  const handleLeave = () => {
    navigation.goBack();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading / permissions state
  if (loading || !permissionsReady) {
  const message = permissionsGranted ? 'Preparing consultation...' : 'Requesting permissions...';
  return <LoadingSpinner message={message} />;
}

  if (error || !token) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Unable to Join</Text>
          <Text style={styles.errorMessage}>{error || 'Something went wrong'}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleLeave}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (booking && booking.status !== 'confirmed' && booking.status !== 'completed') {
    const isPending = booking.status === 'pending';
    return (
      <SafeAreaView style={styles.waitingContainer}>
        <View style={styles.waitingContent}>
          <View style={[styles.waitingIcon, { backgroundColor: isPending ? '#FEF3C7' : '#FEE2E2' }]}>
            <Text style={{ fontSize: 32 }}>{isPending ? '⏳' : '✕'}</Text>
          </View>
          <Text style={styles.waitingTitle}>
            {isPending ? 'Awaiting Confirmation' : 'Consultation Not Available'}
          </Text>
          <Text style={styles.waitingMessage}>
            {isPending
              ? 'Waiting for the religious leader to accept your request'
              : 'This consultation is not ready yet'}
          </Text>
          {isPending && (
            <View style={styles.waitingStatus}>
              <View style={styles.waitingDot} />
              <Text style={styles.waitingStatusText}>Waiting for confirmation...</Text>
            </View>
          )}
          <TouchableOpacity style={styles.waitingButton} onPress={handleLeave}>
            <Text style={styles.waitingButtonText}>Back to Consultations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking || !booking.room_name) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Meeting Not Ready</Text>
          <Text style={styles.errorMessage}>The video room has not been created for this booking yet.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleLeave}>
            <Text style={styles.errorButtonText}>Back to Consultations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A1A15' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1A15" />

      {/* Native LiveKit Room */}
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        roomName={roomName}
        onConnected={() => {
          console.log('[Native] onConnected called');
          setIsConnected(true);
          console.log('[Native] Connected to LiveKit');
        }}
        onDisconnected={() => {
          setIsConnected(false);
          console.log('[Native] Disconnected from LiveKit');
        }}
        onError={(err) => {
          console.log('[Native] LiveKit error:', err);
          setError('Connection error: ' + err.message);
        }}
        style={{ flex: 1 }}
        audio={true}
        video={true}
        options={{
          adaptiveStream: true,
          dynacast: true,
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#0A1A15' }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleLeave} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Video Consultation</Text>
                <Text style={styles.headerSubtitle}>
                  {booking?.leader_name || 'Religious Leader'}
                </Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4ADE80' : '#D97706' }]} />
              <Text style={styles.statusText}>
                {isConnected ? 'Connected' : 'Connecting...'}
              </Text>
            </View>
          </View>

          {/* Video Grid */}
          <VideoGrid isConnected={isConnected} styles={styles} />

          {/* Controls & footer using useLocalParticipant */}
          <CallControls
            isConnected={isConnected}
            setIsMuted={setIsMuted}
            setIsVideoOff={setIsVideoOff}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onLeave={handleLeave}
            styles={styles}
            formatDuration={formatDuration}
            callDuration={callDuration}
            booking={booking}
          />
        </View>
      </LiveKitRoom>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#032A24' },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: 'rgba(201, 164, 75, 0.8)', marginTop: 16, fontSize: 15, fontWeight: '500' },
  loadingSubText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 4 },

  errorContainer: { flex: 1, backgroundColor: '#FAFAF7' },
  errorContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { color: '#1F2937', fontSize: 20, fontWeight: '700' },
  errorMessage: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8 },
  errorButton: { backgroundColor: '#032A24', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  errorButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  waitingContainer: { flex: 1, backgroundColor: '#FAFAF7' },
  waitingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  waitingIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FDE68A' },
  waitingTitle: { color: '#1F2937', fontSize: 20, fontWeight: '700', marginTop: 16 },
  waitingMessage: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8 },
  waitingStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  waitingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706' },
  waitingStatusText: { color: '#6B7280', fontSize: 13 },
  waitingButton: { backgroundColor: '#032A24', paddingVertical: 12, borderRadius: 12, alignItems: 'center', width: '100%', marginTop: 20 },
  waitingButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  header: {
    backgroundColor: '#0B342B',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 164, 75, 0.1)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeButton: { padding: 4 },
  closeButtonText: { color: 'rgba(255,255,255,0.6)', fontSize: 20 },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  videoGrid: {
    flex: 1,
    backgroundColor: '#0A1A15',
    position: 'relative',
    padding: 8,
  },
  remoteVideo: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1A2A25',
  },
  remotePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remotePlaceholderIcon: { fontSize: 48, color: 'rgba(255,255,255,0.3)' },
  remotePlaceholderText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, marginTop: 12 },

  localVideoContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(201, 164, 75, 0.3)',
    backgroundColor: '#0A1A15',
  },
  localVideo: { flex: 1 },
  localLabel: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },

  controls: {
    backgroundColor: '#0B342B',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 164, 75, 0.1)',
  },
  controlButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 60,
    alignItems: 'center',
  },
  controlButtonActive: { backgroundColor: 'rgba(220, 38, 38, 0.3)' },
  controlIcon: { fontSize: 18 },
  controlLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },

  endButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  endButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  footer: {
    backgroundColor: '#0B342B',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 164, 75, 0.1)',
  },
  footerText: { color: 'rgba(201, 164, 75, 0.4)', fontSize: 10, letterSpacing: 1, fontWeight: '500' },
  durationText: { color: '#C9A44B', fontSize: 10, fontWeight: '500' },
});

export default VideoCall;