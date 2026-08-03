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

      if (userData.role === 'vendor' && userData.vendorStatus === 'pending') {
        setError('Your vendor application is pending admin approval.');
        setLoading(false);
        return;
      }

      if (userData.role === 'vendor' && userData.vendorStatus === 'rejected') {
        setError('Your vendor application has been rejected.');
        setLoading(false);
        return;
      }

      if (userData.role === 'imam' && userData.imamStatus === 'pending') {
        setError('Your religious leader application is pending admin approval.');
        setLoading(false);
        return;
      }

      if (userData.role === 'imam' && userData.imamStatus === 'rejected') {
        setError('Your religious leader application has been rejected.');
        setLoading(false);
        return;
      }
      
      if (userData.subRole) {
        localStorage.setItem('halalhub_subrole', userData.subRole);
      }
      
      if (userData.vendorType) {
        localStorage.setItem('halalhub_vendor_type', userData.vendorType);
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

  const LockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#032A24] px-4 py-8">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="bg-[#0B342B] rounded-3xl shadow-2xl shadow-black/30 p-6 md:p-8 w-full border border-[#C9A44B]/30 relative overflow-hidden">
          
          {/* Subtle decorative elements */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <img 
                  src="/itqaan_logo.png" 
                  alt="Itqaan" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#032A24] rounded-xl p-1 mb-6">
              <button className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] shadow-lg shadow-[#C9A44B]/30 transition-all duration-300">
                Sign In
              </button>
              <button
                onClick={() => navigate('/register/role')}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-[#B7C0BA] hover:text-[#F7F6F1] transition-all duration-300"
              >
                Register
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-xs text-[#F7F6F1] flex justify-between items-center animate-slideDown">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-[#B7C0BA]/60 hover:text-[#B7C0BA] transition">✕</button>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-[#032A24] border border-[#3FAF73]/30 rounded-xl text-xs text-[#3FAF73] animate-slideDown">
                {success}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#FFFFFF] uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#FFFFFF] uppercase tracking-wider mb-1.5">
                  PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    className="w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 pr-12"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePinVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7C0BA]/60 hover:text-[#B7C0BA] transition"
                  >
                    {showPin ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 pt-1">
                  <div className="bg-[#032A24] rounded-xl p-3 border border-[#C9A44B]/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="text-[#C9A44B]">
                          <LockIcon />
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-[#C9A44B]">Your OTP Code</span>
                          <div className="text-lg font-mono font-bold text-[#E1C16B] tracking-widest mt-0.5">
                            {otpCode || '••••••'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-semibold ${otpExpirySeconds <= 10 ? 'text-[#DC2626]' : 'text-[#C9A44B]'}`}>
                          {otpExpirySeconds > 0 ? formatTime(otpExpirySeconds) : 'Expired'}
                        </div>
                        <div className="w-16 h-1 bg-[#032A24] rounded-full mt-1 overflow-hidden border border-[#C9A44B]/30">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              otpExpirySeconds <= 10 ? 'bg-[#DC2626]' : 'bg-gradient-to-r from-[#C9A44B] to-[#E1C16B]'
                            }`}
                            style={{ width: `${(otpExpirySeconds / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {otpExpirySeconds === 0 && (
                      <p className="text-[10px] text-[#DC2626] mt-1.5">OTP expired. Click "Resend Code" below.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#FFFFFF] uppercase tracking-wider mb-2">
                      Enter Verification Code
                    </label>
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => inputRefs.current[index] = el}
                          type="text"
                          inputMode="numeric"
                          maxLength="1"
                          value={digit}
                          className="w-10 h-12 rounded-xl text-[#F7F6F1] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          required
                          style={{
                            backgroundColor: '#032A24',
                            border: '1px solid rgba(201, 164, 75, 0.3)',
                            textAlign: 'center',
                            caretColor: '#C9A44B',
                            padding: 0,
                            margin: 0,
                            textIndent: 0,
                            lineHeight: '48px',
                            height: '48px',
                            width: '40px',
                            display: 'inline-block',
                            boxSizing: 'border-box',
                            WebkitTextFillColor: '#F7F6F1',
                            MozOsxFontSmoothing: 'grayscale',
                            fontVariantNumeric: 'tabular-nums'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-[10px] text-[#B7C0BA]/60">Enter the 6-digit code above</span>
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-[#C9A44B] hover:text-[#E1C16B] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || loading}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-[#C9A44B]/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    Processing...
                  </span>
                ) : (
                  otpSent ? 'Verify & Sign In' : 'Send Verification Code'
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#C9A44B]/20">
              <p className="text-center text-[9px] text-[#C9A44B]/40 tracking-wider">
                Secure · Encrypted · No Riba
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;