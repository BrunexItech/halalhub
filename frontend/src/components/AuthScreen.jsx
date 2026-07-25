import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const AuthScreen = ({ onLogin }) => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  
  // OTP Display State
  const [otpCode, setOtpCode] = useState('');
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0);
  const otpTimerRef = useRef(null);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (otpSent && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [otpSent]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
      }
    };
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const startOtpCountdown = () => {
    setOtpExpirySeconds(30);
    
    if (otpTimerRef.current) {
      clearInterval(otpTimerRef.current);
    }
    
    otpTimerRef.current = setInterval(() => {
      setOtpExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(otpTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otpSent) {
        const response = await authService.loginStep1(phone);
        setOtpSent(true);
        setResendTimer(60);
        setLoading(false);
        
        const receivedOtp = response.data?.otp || response.data?.code || '123456';
        setOtpCode(receivedOtp);
        startOtpCountdown();
        
        setSuccess('Verification code sent');
        setTimeout(() => setSuccess(''), 3000);
        return;
      }

      const otpString = otp.join('');
      if (otpString.length < 6) {
        setError('Please enter all 6 digits');
        setLoading(false);
        return;
      }

      const response = await authService.loginStep2({ phone, pin, otp: otpString });
      const userData = response.data.user;
      
      localStorage.setItem('halalhub_role', userData.role || 'client');

      // Role-based status checking - fixed
      if (userData.role === 'vendor' && userData.vendorStatus === 'pending') {
        setError('Your vendor application is pending admin approval. You will be notified once approved.');
        setLoading(false);
        return;
      }

      if (userData.role === 'vendor' && userData.vendorStatus === 'rejected') {
        setError('Your vendor application has been rejected. Please contact support for assistance.');
        setLoading(false);
        return;
      }

      if (userData.role === 'imam' && userData.imamStatus === 'pending') {
        setError('Your imam application is pending admin approval. You will be notified once approved.');
        setLoading(false);
        return;
      }

      if (userData.role === 'imam' && userData.imamStatus === 'rejected') {
        setError('Your imam application has been rejected. Please contact support for assistance.');
        setLoading(false);
        return;
      }
      
      onLogin(userData, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const response = await authService.loginStep1(phone);
      setResendTimer(60);
      
      const receivedOtp = response.data?.otp || response.data?.code || '123456';
      setOtpCode(receivedOtp);
      startOtpCountdown();
      
      setSuccess('Code resent');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend');
    }
    setLoading(false);
  };

  const togglePinVisibility = () => {
    setShowPin(!showPin);
  };

  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  // SVG Icons
  const LockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );

  const PhoneIcon = () => (
    <svg className="w-5 h-5 text-[#1769AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );

  const KeyIcon = () => (
    <svg className="w-5 h-5 text-[#1769AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F7FC] px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-[#1769AA]/5 p-8 lg:p-10 w-full border border-[#E8EEF4] transition-all duration-300 hover:shadow-2xl hover:shadow-[#1769AA]/10">
          
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center shadow-lg shadow-[#1769AA]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#1769AA]/30">
                <span className="text-white text-xl font-bold">H</span>
              </div>
              <span className="text-2xl font-bold text-[#1A2A3A] tracking-tight">HalalHub</span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1 tracking-wide">Secure · Sharia-Compliant</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-[#F1F7FC] rounded-xl p-1.5 mb-8">
            <button className="flex-1 py-3 rounded-lg text-sm font-semibold bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20 transition-all duration-200 hover:shadow-lg hover:shadow-[#1769AA]/30">
              Sign In
            </button>
            <button
              onClick={() => navigate('/register/role')}
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-[#5A6A7A] hover:text-[#1A2A3A] transition-all duration-200 hover:bg-white/50"
            >
              Register
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm text-[#DC2626] flex justify-between items-center animate-slideDown">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                {error}
              </span>
              <button onClick={() => setError('')} className="text-[#DC2626]/60 hover:text-[#DC2626] transition p-1 rounded-full hover:bg-[#FECACA]/30">
                <CloseIcon />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm text-[#16A34A] flex items-center gap-2 animate-slideDown">
              <CheckIcon />
              {success}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Phone Input */}
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  className="w-full px-5 py-3.5 pl-12 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  disabled={loading}
                  required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                  <PhoneIcon />
                </span>
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  className="w-full px-5 py-3.5 pl-12 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 pr-14"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  disabled={loading}
                  required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                  <KeyIcon />
                </span>
                <button
                  type="button"
                  onClick={togglePinVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#5A6A7A] transition p-1 rounded-full hover:bg-[#F1F7FC]"
                >
                  {showPin ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* OTP Section */}
            {otpSent && (
              <div className="space-y-4 pt-2 animate-fadeIn">
                <div className="bg-[#F1F7FC] rounded-xl p-4 border border-[#E8EEF4] transition-all duration-300 hover:border-[#1769AA]/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-[#1769AA] p-2 bg-[#1769AA]/10 rounded-lg">
                        <LockIcon />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-[#5A6A7A]">Your OTP Code</span>
                        <div className="text-2xl font-mono font-bold text-[#1769AA] tracking-widest mt-0.5">
                          {otpCode || '••••••'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${otpExpirySeconds <= 10 ? 'text-red-600 animate-pulse' : 'text-[#5A6A7A]'}`}>
                        {otpExpirySeconds > 0 ? formatTime(otpExpirySeconds) : 'Expired'}
                      </div>
                      <div className="w-20 h-1 bg-[#E8EEF4] rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            otpExpirySeconds <= 10 ? 'bg-red-600' : 'bg-[#1769AA]'
                          }`}
                          style={{ width: `${(otpExpirySeconds / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {otpExpirySeconds === 0 && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-600" />
                      OTP expired. Click "Resend Code" below.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-3">
                    Enter Verification Code
                  </label>
                  <div className="flex gap-2 sm:gap-3 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        className="w-12 h-14 sm:w-14 sm:h-14 text-center text-xl font-semibold border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 hover:border-[#1769AA]/40"
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        required
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span className="text-xs text-[#94A3B8]">Enter the 6-digit code above</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#1769AA] hover:text-[#2F80C0] transition disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#1769AA] to-[#2F80C0] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#1769AA]/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none transform hover:scale-[1.01] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <SpinnerIcon />
                  Processing...
                </span>
              ) : (
                otpSent ? 'Verify & Sign In' : 'Send Verification Code'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#F1F7FC]">
            <div className="flex flex-wrap justify-center gap-3 text-center">
              <span className="text-[10px] text-[#94A3B8] tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#C9A84C]" />
                Secure
              </span>
              <span className="text-[10px] text-[#94A3B8] tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#C9A84C]" />
                Encrypted
              </span>
              <span className="text-[10px] text-[#94A3B8] tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#C9A84C]" />
                No Riba
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;