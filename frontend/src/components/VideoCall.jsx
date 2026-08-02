import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { bookingService } from '../services/api';
import '@livekit/components-styles';

const VideoCall = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
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
        setRoomName(data.room_name || `halalhub-booking-${bookingId}`);
        
        await fetchLiveKitToken(data.room_name || `halalhub-booking-${bookingId}`);
        setLoading(false);
      } else {
        setError('Booking not found. Please check your booking ID.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Failed to load booking details. Please try again.');
      setLoading(false);
    }
  };

  const fetchLiveKitToken = async (room) => {
    try {
      const response = await fetch(`${API_BASE}/livekit/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('halalhub_token')}`
        },
        body: JSON.stringify({
          roomName: room,
          userName: booking?.user_name || 'Guest'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get video token');
      }

      const data = await response.json();
      setToken(data.token);
      setIsConnecting(false);
    } catch (err) {
      console.error('Error fetching LiveKit token:', err);
      setError('Failed to connect to video service. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleLeave = () => {
    navigate('/kadhis');
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('video-container');
    if (!document.fullscreenElement) {
      container?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B342B] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin mx-auto" />
          <p className="text-white/80 mt-6 text-[15px] font-medium">Loading your consultation...</p>
          <p className="text-white/40 text-[13px] mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl border border-[#E8EEF4]">
          <div className="w-20 h-20 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto border-4 border-[#FCA5A5]">
            <svg className="w-10 h-10 text-[#DC2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-[20px] font-bold text-[#1F2937] mt-4">Unable to Start Call</h3>
          <p className="text-[15px] text-[#6B7280] mt-2">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              className="flex-1 px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
              onClick={() => {
                fetchBookingDetails();
              }}
            >
              Try Again
            </button>
            <button
              className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:border-[#0B342B] hover:text-[#0B342B] transition-all duration-200 text-[15px]"
              onClick={handleLeave}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (booking && booking.status !== 'confirmed' && booking.status !== 'completed') {
    const statusMessages = {
      'pending': 'Waiting for Kadhi to accept your request',
      'cancelled': 'This consultation has been cancelled',
      'rejected': 'This consultation was rejected by the Kadhi',
      'expired': 'This consultation has expired'
    };
    
    const message = statusMessages[booking.status] || 'This consultation is not ready yet';
    const isPending = booking.status === 'pending';
    
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl border border-[#E8EEF4]">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 ${
            isPending ? 'bg-[#FEF3C7] border-[#FDE68A]' : 'bg-[#FEE2E2] border-[#FCA5A5]'
          }`}>
            {isPending ? (
              <svg className="w-10 h-10 text-[#D97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-[#DC2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h3 className="text-[20px] font-bold text-[#1F2937] mt-4">
            {isPending ? 'Waiting for Kadhi' : 'Consultation Not Available'}
          </h3>
          <p className="text-[15px] text-[#6B7280] mt-2">{message}</p>
          {isPending && (
            <>
              <p className="text-[13px] text-[#6B7280] mt-1">
                You will be able to join once the Kadhi confirms.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                <span className="text-[13px] text-[#6B7280]">Waiting for confirmation...</span>
              </div>
            </>
          )}
          <button
            className="mt-6 w-full px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
            onClick={handleLeave}
          >
            Back to Consultations
          </button>
        </div>
      </div>
    );
  }

  if (!booking || !booking.room_name) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-lg border border-[#E8EEF4]">
          <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto border-4 border-[#FDE68A]">
            <svg className="w-8 h-8 text-[#D97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-[17px] font-bold text-[#1F2937] mt-4">Meeting Not Ready</h3>
          <p className="text-[14px] text-[#6B7280] mt-2">The video room has not been created for this booking yet.</p>
          <button
            className="mt-4 px-6 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-colors shadow-sm text-[15px]"
            onClick={handleLeave}
          >
            Back to Consultations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0D1B2A] flex flex-col z-50 overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#0B342B] px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            className="text-white hover:text-[#C9A44B] transition-colors flex-shrink-0 p-2 hover:bg-white/10 rounded-xl"
            onClick={handleLeave}
            title="End Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-[15px] md:text-[16px] lg:text-[17px] truncate">Video Consultation</h1>
            <div className="flex flex-wrap items-center gap-2 text-white/70 text-[13px]">
              <span>{booking?.kadhi_name || 'Kadhi'}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{formatDate(booking?.booking_date)}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{formatTime(booking?.booking_time)}</span>
              {isConnected && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="font-mono">{formatDuration(callDuration)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#3FAF73] animate-pulse' : 'bg-[#D97706] animate-pulse'}`} />
            <span className="text-[13px] text-white/80 hidden sm:inline-block">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          <button
            className="px-4 md:px-6 py-1.5 md:py-2 bg-[#DC2626] text-white text-[14px] font-medium rounded-lg hover:bg-[#B91C1C] transition-colors shadow-md shadow-[#DC2626]/20"
            onClick={handleLeave}
          >
            End Call
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div 
        id="video-container" 
        className="flex-1 relative bg-[#0D1B2A] overflow-hidden"
      >
        {token ? (
          <LiveKitRoom
            serverUrl="ws://halalhub_livekit:7880"
            token={token}
            connect={true}
            audio={!isMuted}
            video={!isVideoOff}
            onConnected={() => {
              setIsConnected(true);
              setIsConnecting(false);
            }}
            onDisconnected={() => {
              setIsConnected(false);
              console.log('Disconnected from LiveKit');
            }}
            className="w-full h-full"
          >
            <VideoConference />
          </LiveKitRoom>
        ) : (
          <div className="flex items-center justify-center h-full bg-[#0D1B2A]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin mx-auto" />
              <p className="text-white/60 mt-4 text-[15px]">Connecting to video service...</p>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#0D1B2A]/80 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-2 md:gap-4 shadow-2xl border border-white/10 z-20">
          {/* Audio Toggle */}
          <button
            className={`p-2.5 md:p-3 rounded-xl transition-all duration-200 ${
              isMuted 
                ? 'bg-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626]/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 3L3 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          <div className="w-px h-8 bg-white/10" />
          
          {/* Video Toggle */}
          <button
            className={`p-2.5 md:p-3 rounded-xl transition-all duration-200 ${
              isVideoOff 
                ? 'bg-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626]/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 3L3 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          
          <div className="w-px h-8 bg-white/10" />
          
          {/* Fullscreen Toggle */}
          <button
            className="p-2.5 md:p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V4m0 0H4m5 0l-5 5m10 0V4m0 0h5m-5 0l5 5m-5 5h5m0 0v-5m0 5l-5-5m-5 5v5m0 0h5m-5 0l5-5" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
          
          <div className="w-px h-8 bg-white/10" />
          
          {/* End Call */}
          <button
            className="p-2.5 md:p-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] transition-all duration-200 text-white shadow-lg shadow-[#DC2626]/30"
            onClick={handleLeave}
            title="End Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>

        {/* Call Duration Badge */}
        {isConnected && (
          <div className="absolute top-4 left-4 bg-[#0D1B2A]/60 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10 z-10">
            <span className="text-[13px] text-white/60 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDuration(callDuration)}
            </span>
          </div>
        )}

        {/* Connection Status */}
        <div className="absolute top-4 right-4 bg-[#0B342B]/80 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-[#C9A44B]/30 z-10">
          <span className="text-[13px] text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#3FAF73] animate-pulse' : 'bg-[#D97706] animate-pulse'}`} />
            {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>

        {/* Booking Info */}
        <div className="absolute bottom-24 left-4 bg-[#0D1B2A]/70 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10 z-10">
          <p className="text-[13px] text-white/50">
            Booking: {bookingId}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#0B342B] py-3 px-4 text-center flex-shrink-0 border-t border-white/10 z-10">
        <p className="text-[13px] text-[#C9A44B]/80 tracking-wider font-medium">
          Powered by HalalHub · Secure Video Consultation
        </p>
      </div>
    </div>
  );
};

export default VideoCall;