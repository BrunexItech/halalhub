import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { bookingService, livekitService } from '../../api/client';

const VideoCall = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const bookingId = route.params?.bookingId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [showWebView, setShowWebView] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    requestCameraPermission();
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId]);

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
        setShowWebView(true);
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
    setShowWebView(false);
    navigation.goBack();
  };

  const getWebViewHtml = () => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script>
      function loadScript() {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/livekit-client@1.15.0/dist/livekit-client.umd.min.js';
          script.onload = () => resolve(window.LivekitClient);
          script.onerror = () => reject(new Error('Failed to load LiveKit'));
          document.head.appendChild(script);
        });
      }

      window.getLiveKit = async function() {
        if (window.LivekitClient) return window.LivekitClient;
        try {
          return await loadScript();
        } catch (e) {
          console.error('LiveKit load failed:', e);
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/livekit-client@1.15.0/dist/livekit-client.umd.min.js';
            script.onload = () => resolve(window.LivekitClient);
            script.onerror = () => reject(new Error('All CDN attempts failed'));
            document.head.appendChild(script);
          });
        }
      };
    </script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #0A1A15; font-family: -apple-system, sans-serif; height: 100vh; overflow: hidden; }
      #container { display: flex; flex-direction: column; height: 100vh; background: #0A1A15; }
      #header {
        background: #0B342B;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(201, 164, 75, 0.1);
      }
      #header-left { display: flex; align-items: center; gap: 10px; }
      #close-btn { color: rgba(255,255,255,0.6); font-size: 20px; cursor: pointer; background: none; border: none; }
      #header-title { color: #FFFFFF; font-size: 15px; font-weight: 700; }
      #header-subtitle { color: rgba(255,255,255,0.5); font-size: 11px; }
      #status { display: flex; align-items: center; gap: 6px; }
      #status-dot { width: 8px; height: 8px; border-radius: 50%; background: #D97706; }
      #status-text { color: rgba(255,255,255,0.6); font-size: 11px; }
      #video-grid { flex: 1; display: flex; position: relative; background: #0A1A15; padding: 8px; }
      #remote-video { flex: 1; background: #1A2A25; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
      #remote-video video { width: 100%; height: 100%; object-fit: cover; }
      #remote-placeholder { text-align: center; color: rgba(255,255,255,0.3); }
      #remote-placeholder .icon { font-size: 48px; margin-bottom: 12px; display: block; }
      #remote-placeholder .text { font-size: 14px; }
      #local-video {
        position: absolute;
        bottom: 80px;
        right: 16px;
        width: 120px;
        height: 160px;
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid rgba(201, 164, 75, 0.3);
        background: #0A1A15;
      }
      #local-video video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
      #local-label {
        position: absolute;
        bottom: 4px;
        left: 8px;
        color: rgba(255,255,255,0.5);
        font-size: 10px;
      }
      #controls {
        background: #0B342B;
        padding: 12px 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        border-top: 1px solid rgba(201, 164, 75, 0.1);
      }
      .control-btn {
        padding: 10px;
        border-radius: 10px;
        background: rgba(255,255,255,0.1);
        border: none;
        color: white;
        font-size: 14px;
        min-width: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        cursor: pointer;
      }
      .control-btn .icon { font-size: 18px; }
      .control-btn .label { color: rgba(255,255,255,0.6); font-size: 10px; }
      .control-btn.active { background: rgba(220, 38, 38, 0.3); }
      #end-btn {
        background: #DC2626;
        padding: 10px 20px;
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      #footer {
        background: #0B342B;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-top: 1px solid rgba(201, 164, 75, 0.1);
      }
      #footer-text { color: rgba(201, 164, 75, 0.4); font-size: 10px; letter-spacing: 1px; font-weight: 500; }
      #participant-name {
        position: absolute;
        bottom: 12px;
        left: 12px;
        color: rgba(255,255,255,0.6);
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div id="container">
      <div id="header">
        <div id="header-left">
          <button id="close-btn" onclick="handleEndCall()">✕</button>
          <div>
            <div id="header-title">Video Consultation</div>
            <div id="header-subtitle">${booking?.leader_name || 'Religious Leader'}</div>
          </div>
        </div>
        <div id="status">
          <div id="status-dot"></div>
          <span id="status-text">Connecting...</span>
        </div>
      </div>

      <div id="video-grid">
        <div id="remote-video">
          <div id="remote-placeholder">
            <span class="icon">📹</span>
            <div class="text">Waiting for participant to join...</div>
          </div>
        </div>
        <div id="local-video">
          <video id="local-video-el" autoplay playsinline muted></video>
          <div id="local-label">You</div>
        </div>
      </div>

      <div id="controls">
        <button class="control-btn" id="mute-btn">
          <span class="icon">🎤</span>
          <span class="label">Mute</span>
        </button>
        <button class="control-btn" id="video-btn">
          <span class="icon">🎥</span>
          <span class="label">Video</span>
        </button>
        <button id="end-btn" onclick="handleEndCall()">End</button>
      </div>

      <div id="footer">
        <span id="footer-text">Secure Video Consultation</span>
      </div>
    </div>

    <script>
      const LIVEKIT_URL = 'wss://itqaan.co.ke';
      const TOKEN = '${token}';
      const ROOM_NAME = '${roomName}';

      let room = null;
      let localTrack = null;
      let isMuted = false;
      let isVideoOff = false;

      const statusDot = document.getElementById('status-dot');
      const statusText = document.getElementById('status-text');
      const remoteVideo = document.getElementById('remote-video');
      const remotePlaceholder = document.getElementById('remote-placeholder');
      const localVideoEl = document.getElementById('local-video-el');
      const muteBtn = document.getElementById('mute-btn');
      const videoBtn = document.getElementById('video-btn');

      async function connect() {
        try {
          console.log('[WebView] Loading LiveKit...');
          const LiveKit = await window.getLiveKit();
          
          if (!LiveKit) {
            throw new Error('LiveKit library not loaded');
          }

          console.log('[WebView] LiveKit loaded, connecting...');
          statusDot.style.background = '#D97706';
          statusText.textContent = 'Connecting...';

          room = new LiveKit.Room();

          try {
            console.log('[WebView] Requesting camera...');
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            console.log('[WebView] Camera access granted');
          } catch (permError) {
            console.log('[WebView] Camera permission error:', permError);
          }

          try {
            localTrack = await LiveKit.createLocalVideoTrack({
              resolution: { width: 640, height: 480 },
              facingMode: 'user'
            });
            localVideoEl.srcObject = new MediaStream([localTrack.mediaStreamTrack]);
            console.log('[WebView] Local video track created');
          } catch (e) {
            console.log('[WebView] Camera error:', e);
          }

          console.log('[WebView] Connecting to room...');
          await room.connect(LIVEKIT_URL, TOKEN);
          console.log('[WebView] Connected to room');

          if (localTrack) {
            await room.localParticipant.publishTrack(localTrack);
            console.log('[WebView] Local track published');
          }

          room.on('participantConnected', (participant) => {
            console.log('[WebView] Participant connected:', participant.identity);
            participant.on('trackSubscribed', (track) => {
              console.log('[WebView] Track subscribed:', track.kind);
              if (track.kind === 'video') {
                const videoEl = document.createElement('video');
                videoEl.autoplay = true;
                videoEl.playsInline = true;
                videoEl.style.width = '100%';
                videoEl.style.height = '100%';
                videoEl.style.objectFit = 'cover';
                videoEl.srcObject = new MediaStream([track.mediaStreamTrack]);

                remotePlaceholder.style.display = 'none';
                remoteVideo.innerHTML = '';
                remoteVideo.appendChild(videoEl);

                const nameEl = document.createElement('div');
                nameEl.id = 'participant-name';
                nameEl.textContent = participant.identity || 'Participant';
                remoteVideo.appendChild(nameEl);
              }
            });
          });

          statusDot.style.background = '#3FAF73';
          statusText.textContent = 'Connected';
          console.log('[WebView] Call active');

        } catch (e) {
          console.error('[WebView] Connection error:', e);
          console.error('[WebView] Error details:', e.message);
          statusDot.style.background = '#DC2626';
          statusText.textContent = 'Error connecting';
          remotePlaceholder.innerHTML = '<span class="icon">❌</span><div class="text">Connection failed: ' + e.message + '</div>';
        }
      }

      function handleEndCall() {
        console.log('[WebView] Ending call');
        if (room) {
          room.disconnect();
        }
        window.ReactNativeWebView.postMessage('endCall');
      }

      muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        muteBtn.querySelector('.icon').textContent = isMuted ? '🔇' : '🎤';
        muteBtn.querySelector('.label').textContent = isMuted ? 'Muted' : 'Mute';
        muteBtn.classList.toggle('active', isMuted);
        if (room) {
          room.localParticipant.setMicrophoneEnabled(!isMuted);
        }
      });

      videoBtn.addEventListener('click', () => {
        isVideoOff = !isVideoOff;
        videoBtn.querySelector('.icon').textContent = isVideoOff ? '📷' : '🎥';
        videoBtn.querySelector('.label').textContent = isVideoOff ? 'Off' : 'Video';
        videoBtn.classList.toggle('active', isVideoOff);
        if (room && localTrack) {
          room.localParticipant.setCameraEnabled(!isVideoOff);
        }
        localVideoEl.style.display = isVideoOff ? 'none' : 'block';
      });

      connect();
    </script>
  </body>
</html>
    `;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={styles.loadingText}>Preparing consultation...</Text>
          <Text style={styles.loadingSubText}>Please wait while we connect you</Text>
        </View>
      </SafeAreaView>
    );
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

  if (showWebView && token) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A1A15' }}>
        <WebView
          source={{ html: getWebViewHtml() }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          originWhitelist={['*']}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          androidCameraAccessAllowed={true}
          androidHardwareAccelerationDisabled={false}
          cacheEnabled={false}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'endCall') {
              handleLeave();
            }
          }}
          onError={(error) => {
            console.log('WebView error:', error);
            setError('Failed to load video call');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>Unable to Start</Text>
        <Text style={styles.errorMessage}>Please try again</Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleLeave}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
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
});

export default VideoCall;