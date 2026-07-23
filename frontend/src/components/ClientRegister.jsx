import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { getCounties, getSubCounties, getWards } from '../services/locationApi';

const ClientRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const inputRefs = useRef([]);
  
  // Location data
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    pin: '',
    county: '',
    countyName: '',
    subCounty: '',
    subCountyName: '',
    ward: '',
    wardName: ''
  });

  // Fetch counties on mount
  useEffect(() => {
    const fetchCounties = async () => {
      try {
        setLoadingLocations(true);
        const data = await getCounties();
        setCounties(data);
        setLocationError('');
      } catch (err) {
        setLocationError('Failed to load counties. Please refresh.');
        console.error(err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchCounties();
  }, []);

  // Fetch sub-counties when county changes
  useEffect(() => {
    if (formData.countyName) {
      const fetchSubs = async () => {
        try {
          const data = await getSubCounties(formData.countyName);
          setSubCounties(data);
          setWards([]);
          setFormData(prev => ({
            ...prev,
            subCounty: '',
            subCountyName: '',
            ward: '',
            wardName: ''
          }));
        } catch (err) {
          console.error('Failed to fetch sub-counties:', err);
          setSubCounties([]);
        }
      };
      fetchSubs();
    } else {
      setSubCounties([]);
      setWards([]);
    }
  }, [formData.countyName]);

  // Fetch wards when sub-county changes
  useEffect(() => {
    if (formData.countyName && formData.subCountyName) {
      const fetchWards = async () => {
        try {
          const data = await getWards(formData.countyName, formData.subCountyName);
          setWards(data);
          setFormData(prev => ({
            ...prev,
            ward: '',
            wardName: ''
          }));
        } catch (err) {
          console.error('Failed to fetch wards:', err);
          setWards([]);
        }
      };
      fetchWards();
    } else {
      setWards([]);
    }
  }, [formData.countyName, formData.subCountyName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCountyChange = (e) => {
    const value = e.target.value;
    const [id, name] = value.split('|');
    setFormData({
      ...formData,
      county: id,
      countyName: name,
      subCounty: '',
      subCountyName: '',
      ward: '',
      wardName: ''
    });
  };

  const handleSubCountyChange = (e) => {
    const value = e.target.value;
    const [id, name] = value.split('|');
    setFormData({
      ...formData,
      subCounty: id,
      subCountyName: name,
      ward: '',
      wardName: ''
    });
  };

  const handleWardChange = (e) => {
    const value = e.target.value;
    const [id, name] = value.split('|');
    setFormData({
      ...formData,
      ward: id,
      wardName: name
    });
  };

  // OTP handlers
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

  const handleNext = () => {
    setError('');
    setSuccess('');

    if (step === 1 && (!formData.fullName || !formData.county || !formData.subCounty || !formData.ward)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 2 && (!formData.phone || !formData.email)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 3 && (!formData.nationalId || !formData.pin || formData.pin.length < 4)) {
      setError('Please enter a valid National ID and PIN (min 4 digits)');
      return;
    }
    setStep(step + 1);
    setError('');
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const sendOtp = () => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);
    setOtpStep(true);
    alert(`Your OTP is: ${otpCode}`);
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
    if (otpString !== generatedOtp) {
      setError('Invalid OTP. Please try again.');
      return;
    }
    
    setLoading(true);
    try {
      await authService.register({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        nationalId: formData.nationalId,
        pin: formData.pin,
        region: formData.countyName,
        subCounty: formData.subCountyName,
        ward: formData.wardName,
        role: 'client'
      });
      setStep(5);
      setSuccess('Registration complete!');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  const renderStepIndicator = () => {
    const current = step > 4 ? 4 : step;
    return (
      <div className="flex items-center justify-center gap-0 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              i <= current 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/25' 
                : 'bg-[#F1F7FC] text-[#94A3B8]'
            }`}>
              {i < current ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              ) : i}
            </div>
            {i < 4 && (
              <div className={`w-8 h-0.5 transition-all duration-300 ${
                i < current ? 'bg-[#1769AA]' : 'bg-[#E2E8F0]'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Personal Information</h3>
              <p className="text-sm text-[#94A3B8]">Tell us about yourself</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <input
                className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g., Abdullahi Mohamed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                County *
              </label>
              {loadingLocations ? (
                <div className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] text-[#94A3B8] text-sm">Loading counties...</div>
              ) : locationError ? (
                <div className="w-full px-5 py-3.5 border border-[#FECACA] rounded-xl bg-[#FEF2F2] text-[#DC2626] text-sm">{locationError}</div>
              ) : (
                <select
                  className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none"
                  value={formData.county ? `${formData.county}|${formData.countyName}` : ''}
                  onChange={handleCountyChange}
                >
                  <option value="">Select your county</option>
                  {counties.map((county) => (
                    <option key={county.id} value={`${county.id}|${county.name}`}>
                      {county.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {formData.county && (
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                  Sub-County *
                </label>
                <select
                  className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none"
                  value={formData.subCounty ? `${formData.subCounty}|${formData.subCountyName}` : ''}
                  onChange={handleSubCountyChange}
                >
                  <option value="">Select your sub-county</option>
                  {subCounties.map((sub) => (
                    <option key={sub.id} value={`${sub.id}|${sub.name}`}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.subCounty && (
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                  Ward *
                </label>
                <select
                  className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none"
                  value={formData.ward ? `${formData.ward}|${formData.wardName}` : ''}
                  onChange={handleWardChange}
                >
                  <option value="">Select your ward</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={`${ward.id}|${ward.name}`}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Contact Information</h3>
              <p className="text-sm text-[#94A3B8]">How can we reach you?</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                Phone Number *
              </label>
              <input
                className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+2547XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                Email *
              </label>
              <input
                className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-[#1A2A3A]">ID & Security</h3>
              <p className="text-sm text-[#94A3B8]">Verify your identity</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                National ID *
              </label>
              <input
                className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="e.g., 12345678"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">
                Create PIN *
              </label>
              <input
                className="w-full px-5 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="4-digit PIN"
                maxLength="6"
              />
              <p className="text-xs text-[#94A3B8] mt-2">PIN must be at least 4 digits</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Verify Your Identity</h3>
              <p className="text-sm text-[#94A3B8]">Enter the 6-digit code sent to your phone</p>
            </div>

            <div className="flex gap-3 justify-center py-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  className="w-12 h-14 text-center text-xl font-semibold border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  required
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-[#94A3B8]">
                {otpStep ? 'Code sent to your phone' : 'Click "Send OTP" below'}
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-[#1769AA] hover:text-[#2F80C0] transition"
                onClick={sendOtp}
              >
                Send OTP
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-6 animate-fadeIn">
            <div className="w-20 h-20 rounded-xl bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4 border border-[#BBF7D0]">
              <svg className="w-10 h-10 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#1A2A3A]">Registration Complete!</h3>
            <p className="text-[#5A6A7A] mt-2 leading-relaxed">
              Your account has been created successfully.<br />
              Welcome to HalalHub, {formData.fullName}!
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-8 py-3.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/25 transition-all duration-200"
            >
              Login Now
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F7FC] px-4 py-8">
      <div className="flex flex-col lg:flex-row max-w-5xl w-full bg-white rounded-3xl shadow-xl shadow-[#1769AA]/5 border border-[#E8EEF4] overflow-hidden">

        {/* LEFT: Branding Section */}
        <div className="w-full lg:w-1/2 bg-[#1769AA] p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center text-white">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">H</span>
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">HalalHub</div>
              <div className="text-xs text-white/60 tracking-[0.15em] uppercase mt-1">Sharia-Compliant Fintech</div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold mt-4">Create Your Account</h1>
            <p className="text-white/70 mt-2 max-w-sm mx-auto">
              Join the community and access Sharia-compliant financial services
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>Halal-Certified Platform</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>Secure &amp; Encrypted</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>No Riba Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Registration Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-white flex items-center">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1A2A3A]">
                {step > 4 ? 'Complete!' : `Step ${step} of 4`}
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1">
                {step > 4 ? 'Your account is ready' : 'Fill in your details to continue'}
              </p>
            </div>

            {step <= 4 && renderStepIndicator()}

            {error && (
              <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center justify-between text-sm text-[#DC2626]">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-[#DC2626]/60 hover:text-[#DC2626] transition">✕</button>
              </div>
            )}

            {success && step === 5 && (
              <div className="mb-4 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm text-[#16A34A]">
                {success}
              </div>
            )}

            <div className="py-2">
              {renderStep()}
            </div>

            {step >= 1 && step < 4 && (
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button
                    className="flex-1 px-6 py-3.5 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-200"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                <button
                  className={`${step > 1 ? 'flex-[2]' : 'flex-1'} px-6 py-3.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200`}
                  onClick={handleNext}
                >
                  Continue
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 px-6 py-3.5 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-200"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="flex-[2] px-6 py-3.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-[#F1F7FC] text-center">
              <p className="text-sm text-[#5A6A7A]">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/')}
                  className="font-semibold text-[#1769AA] hover:text-[#2F80C0] transition"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientRegister;