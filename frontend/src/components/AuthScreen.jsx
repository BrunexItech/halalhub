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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otpSent) {
        await authService.loginStep1(phone);
        setOtpSent(true);
        setResendTimer(60);
        setLoading(false);
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
      await authService.loginStep1(phone);
      setResendTimer(60);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F7FC] px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Single Card - Clean & Centered */}
        <div className="bg-white rounded-2xl shadow-xl shadow-[#1769AA]/5 p-8 lg:p-10 w-full border border-[#E8EEF4]">
          
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#1769AA] flex items-center justify-center">
                <span className="text-white text-lg font-bold">H</span>
              </div>
              <span className="text-2xl font-bold text-[#1A2A3A]">HalalHub</span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">Secure · Sharia-Compliant</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-[#F1F7FC] rounded-xl p-1.5 mb-8">
            <button className="flex-1 py-3 rounded-lg text-sm font-semibold bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20">
              Sign In
            </button>
            <button
              onClick={() => navigate('/register/role')}
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-[#5A6A7A] hover:text-[#1A2A3A] transition"
            >
              Register
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm text-[#DC2626] flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-[#DC2626]/60 hover:text-[#DC2626] transition">✕</button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm text-[#16A34A]">
              {success}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Phone Input */}
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                disabled={loading}
                required
              />
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 pr-20"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={togglePinVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#5A6A7A] transition text-xs font-medium"
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* OTP Section */}
            {otpSent && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-3">
                    Verification Code
                  </label>
                  <div className="flex gap-3 justify-between">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        className="w-14 h-14 text-center text-xl font-semibold border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        required
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#94A3B8]">6-digit code sent to your phone</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#1769AA] hover:text-[#2F80C0] transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full py-3.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                otpSent ? 'Verify & Sign In' : 'Send Verification Code'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#F1F7FC]">
            <p className="text-center text-xs text-[#94A3B8] tracking-wider">
              Secure · Encrypted · No Riba
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;