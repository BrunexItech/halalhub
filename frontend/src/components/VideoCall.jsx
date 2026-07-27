import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingService } from '../services/api';

const VideoCall = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const res = await bookingService.getBookingById(bookingId);
      if (res.data.success) {
        const data = res.data.booking;
        setBooking(data);
        setRoomName(data.room_name || `halalhub-booking-${bookingId}`);
        setLoading(false);
      } else {
        setError('Booking not found');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Failed to load booking details');
      setLoading(false);
    }
  };

  const handleLeave = () => {
    navigate('/kadhi-dashboard');
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

  // Get display name for Jitsi
  const getDisplayName = () => {
    if (booking?.user_name) return booking.user_name;
    if (booking?.userName) return booking.userName;
    return 'Guest';
  };

  // Build Jitsi URL with user name pre-filled
  const getJitsiUrl = () => {
    const displayName = encodeURIComponent(getDisplayName());
    return `https://meet.jit.si/${roomName}?config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.enableWelcomePage=false&config.startWithAudioMuted=true&config.startWithVideoMuted=false&userInfo.displayName=${displayName}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white/80 mt-6 text-sm font-medium">Connecting to your consultation...</p>
          <p className="text-white/40 text-xs mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl border border-[#E8EEF4]">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto border-4 border-red-100">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#1A2A3A] mt-4">Unable to Start Call</h3>
          <p className="text-sm text-[#94A3B8] mt-2">{error}</p>
          <button
            className="mt-6 w-full px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20"
            onClick={handleLeave}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0D1B2A] flex flex-col z-50 overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#1769AA] px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            className="text-white hover:text-white/80 transition-colors flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg"
            onClick={handleLeave}
            title="End Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm md:text-base lg:text-lg truncate">Video Consultation</h1>
            <div className="flex flex-wrap items-center gap-2 text-white/70 text-xs">
              <span>{booking?.kadhi_name || 'Kadhi'}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{formatDate(booking?.booking_date)}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{formatTime(booking?.booking_time)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full hidden sm:inline-block">
            Connected
          </span>
          <button
            className="px-4 md:px-6 py-1.5 md:py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
            onClick={handleLeave}
          >
            End Call
          </button>
        </div>
      </div>

      {/* Video Container - Full Screen */}
      <div 
        id="video-container" 
        className="flex-1 relative bg-[#0D1B2A] overflow-hidden"
      >
        <iframe
          src={getJitsiUrl()}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="absolute inset-0 w-full h-full border-0"
          title="Video Call"
          allowFullScreen
        />
        
        {/* Video Controls Overlay - Brand Colors */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1769AA]/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 md:gap-3 shadow-2xl border border-[#4A9AD9]/30 z-20">
          <button
            className="p-2 md:p-2.5 rounded-full hover:bg-white/10 transition-colors text-white"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zm-3 5h6" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 010-7.072m-2.828 9.9a9 9 0 010-12.728" />
              </svg>
            )}
          </button>
          
          <div className="w-px h-6 bg-white/20" />
          
          <button
            className="p-2 md:p-2.5 rounded-full hover:bg-white/10 transition-colors text-white"
            onClick={toggleFullscreen}
            title="Fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
          
          <div className="w-px h-6 bg-white/20" />
          
          <button
            className="p-2 md:p-2.5 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-white shadow-lg shadow-red-600/30"
            onClick={handleLeave}
            title="End Call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>

        {/* Call Status */}
        <div className="absolute top-4 right-4 bg-[#1769AA]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-[#4A9AD9]/30 z-10">
          <span className="text-xs text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>

        {/* Consultation Info on Video */}
        <div className="absolute bottom-24 left-4 bg-[#0D1B2A]/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 z-10">
          <p className="text-xs text-white/50">
            Booking: {bookingId}
          </p>
        </div>
      </div>

      {/* Footer - Visible with Brand Colors */}
      <div className="bg-[#1769AA] py-3 px-4 text-center flex-shrink-0 border-t border-[#4A9AD9]/20 z-10">
        <p className="text-xs text-white/80 tracking-wider font-medium">
          Powered by HalalHub · Secure Video Consultation
        </p>
      </div>
    </div>
  );
};

export default VideoCall;