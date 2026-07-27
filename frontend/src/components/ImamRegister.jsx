import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const ImamRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);
  const otpTimerRef = useRef(null);
  
  // Location data
  const [counties, setCounties] = useState(['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Garissa', 'Malindi', 'Thika', 'Kitale', 'Meru']);

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    pin: '',
    title: 'Imam',
    subRole: 'imam',
    mosqueName: '',
    mosqueLocation: '',
    mosqueCounty: '',
    qualifications: '',
    yearsOfService: '',
    institution: '',
    bio: '',
    region: '',
    subCounty: '',
    ward: '',
    termsAccepted: false
  });

  // Cleanup OTP timer
  useEffect(() => {
    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

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

  const handleSendOtp = async () => {
    if (!formData.phone) {
      setError('Please enter your phone number first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.sendRegistrationOtp({
        phone: formData.phone,
        email: formData.email
      });

      setOtpSent(true);
      setOtpStep(true);
      setResendTimer(60);

      const receivedOtp = response.data?.otp || response.data?.code || '123456';
      setOtpCode(receivedOtp);
      startOtpCountdown();

      setSuccess('Verification code sent');
      setTimeout(() => setSuccess(''), 3000);

      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 300);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError('');
    try {
      const response = await authService.sendRegistrationOtp({
        phone: formData.phone,
        email: formData.email
      });

      setResendTimer(60);

      const receivedOtp = response.data?.otp || response.data?.code || '123456';
      setOtpCode(receivedOtp);
      startOtpCountdown();

      setSuccess('Code resent');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setError('');
    setSuccess('');

    if (step === 1 && (!formData.fullName || !formData.phone || !formData.email || !formData.nationalId || !formData.pin || formData.pin.length < 4)) {
      setError('Please fill in all required fields. PIN must be at least 4 digits.');
      return;
    }
    if (step === 2 && (!formData.subRole)) {
      setError('Please select your role (Imam or Kadhi)');
      return;
    }
    if (step === 3 && (!formData.mosqueName || !formData.mosqueLocation)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 4 && (!formData.qualifications)) {
      setError('Please enter your qualifications');
      return;
    }
    if (step === 5 && (!formData.termsAccepted)) {
      setError('Please accept the terms and conditions');
      return;
    }
    setStep(step + 1);
    setError('');
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Verify OTP
      const verifyResponse = await authService.verifyRegistrationOtp({
        phone: formData.phone,
        otp: otpString
      });

      if (!verifyResponse.data.success) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      // Register Religious Leader (Imam or Kadhi)
      await authService.registerImam({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        nationalId: formData.nationalId,
        pin: formData.pin,
        title: formData.title || 'Imam',
        subRole: formData.subRole,
        mosqueName: formData.mosqueName,
        mosqueLocation: formData.mosqueLocation,
        mosqueCounty: formData.mosqueCounty,
        qualifications: formData.qualifications.split(',').map(q => q.trim()),
        yearsOfService: parseInt(formData.yearsOfService) || 0,
        institution: formData.institution,
        bio: formData.bio,
        region: formData.region,
        subCounty: formData.subCounty,
        ward: formData.ward,
        termsAccepted: formData.termsAccepted
      });

      setStep(7);
      const roleLabel = formData.subRole === 'kadhi' ? 'Kadhi' : 'Imam';
      setSuccess(`${roleLabel} application submitted successfully!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const renderStepIndicator = () => {
    const current = step > 6 ? 6 : step;
    const steps = [1, 2, 3, 4, 5, 6];
    return (
      <div className="flex items-center justify-center gap-0 py-4">
        {steps.map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
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
            {i < 6 && (
              <div className={`w-8 h-0.5 transition-all duration-500 ${
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
          <div className="space-y-5 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Personal Information</h3>
              <p className="text-sm text-[#94A3B8]">Tell us about yourself</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="National ID *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="Create PIN *"
                maxLength="6"
              />
              <p className="text-xs text-[#94A3B8] mt-2">PIN must be at least 4 digits</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Select Your Role</h3>
              <p className="text-sm text-[#94A3B8]">Choose your primary role as a religious leader</p>
            </div>

            <div className="space-y-4">
              <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                formData.subRole === 'imam'
                  ? 'border-[#1769AA] bg-[#F1F7FC] shadow-md shadow-[#1769AA]/10'
                  : 'border-[#E2E8F0] hover:border-[#1769AA]/40 hover:bg-[#F8FAFC]'
              }`}>
                <input
                  type="radio"
                  name="subRole"
                  value="imam"
                  checked={formData.subRole === 'imam'}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded-full border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30 focus:ring-2 flex-shrink-0"
                />
                <div>
                  <div className="font-bold text-[#1A2A3A]">Imam</div>
                  <div className="text-sm text-[#94A3B8]">Mosque leadership, pension, community support</div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706]">Pension</span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A]">Supporters</span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1769AA]">Verified</span>
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                formData.subRole === 'kadhi'
                  ? 'border-[#1769AA] bg-[#F1F7FC] shadow-md shadow-[#1769AA]/10'
                  : 'border-[#E2E8F0] hover:border-[#1769AA]/40 hover:bg-[#F8FAFC]'
              }`}>
                <input
                  type="radio"
                  name="subRole"
                  value="kadhi"
                  checked={formData.subRole === 'kadhi'}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded-full border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30 focus:ring-2 flex-shrink-0"
                />
                <div>
                  <div className="font-bold text-[#1A2A3A]">Kadhi</div>
                  <div className="text-sm text-[#94A3B8]">Islamic legal guidance, consultations, video calls</div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1769AA]">Consultations</span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A]">Video Calls</span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706]">Legal Guidance</span>
                  </div>
                </div>
              </label>
            </div>

            <div className="bg-[#F1F7FC] rounded-xl p-4 border border-[#E8EEF4] mt-2">
              <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
                You can only register as one primary role. If you serve in both capacities, please choose your primary role.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Mosque Details</h3>
              <p className="text-sm text-[#94A3B8]">Tell us about your mosque</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="mosqueName"
                value={formData.mosqueName}
                onChange={handleChange}
                placeholder="Mosque Name *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="mosqueLocation"
                value={formData.mosqueLocation}
                onChange={handleChange}
                placeholder="Mosque Location (Street/City) *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <select
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300 appearance-none"
                name="mosqueCounty"
                value={formData.mosqueCounty}
                onChange={handleChange}
              >
                <option value="">Select County</option>
                {counties.map((county) => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Title (e.g., Chief Imam, Sheikh)"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Qualifications & Background</h3>
              <p className="text-sm text-[#94A3B8]">Tell us about your qualifications</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <textarea
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300 resize-y min-h-[100px]"
                name="qualifications"
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="Qualifications (e.g., Bachelors Islamic Studies, Masters Theology) *"
              />
              <p className="text-xs text-[#94A3B8] mt-2">Separate multiple qualifications with commas</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                type="number"
                name="yearsOfService"
                value={formData.yearsOfService}
                onChange={handleChange}
                placeholder="Years of Service"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                placeholder="Institution (optional)"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <textarea
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300 resize-y min-h-[80px]"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Bio / About You (optional)"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Terms & Conditions</h3>
              <p className="text-sm text-[#94A3B8]">Please confirm the following to proceed</p>
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 p-4 bg-[#F1F7FC] rounded-2xl cursor-pointer hover:bg-[#E8EEF4] transition-all duration-200">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded-md border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30 focus:ring-2"
                />
                <span className="text-sm text-[#1A2A3A] font-medium">I accept HalalHub's Terms & Conditions</span>
              </label>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Verify Your Identity</h3>
              <p className="text-sm text-[#94A3B8]">Enter the 6-digit code sent to your phone</p>
            </div>

            {otpSent && (
              <div className="bg-[#F1F7FC] rounded-xl p-4 border border-[#E8EEF4]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1769AA]/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#1769AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#5A6A7A]">Your OTP Code</span>
                      <div className="text-2xl font-mono font-bold text-[#1769AA] tracking-widest mt-0.5">
                        {otpCode || '••••••'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${otpExpirySeconds <= 10 ? 'text-red-600' : 'text-[#5A6A7A]'}`}>
                      {otpExpirySeconds > 0 ? `${otpExpirySeconds}s` : 'Expired'}
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
                  <p className="text-xs text-red-600 mt-2">OTP expired. Click "Resend Code" below.</p>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center py-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  className="w-14 h-16 text-center text-xl font-bold bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  required
                />
              ))}
            </div>

            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs text-[#94A3B8]">
                {otpSent ? 'Enter the code above' : 'Click "Send Code" to receive OTP'}
              </span>
              <button
                type="button"
                className={`text-xs font-semibold transition ${
                  otpSent
                    ? 'text-[#1769AA] hover:text-[#2F80C0]'
                    : 'text-[#1769AA] hover:text-[#2F80C0]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={otpSent ? handleResendOtp : handleSendOtp}
                disabled={(otpSent && resendTimer > 0) || loading}
              >
                {otpSent
                  ? (resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code')
                  : 'Send Code'}
              </button>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="text-center py-8 animate-scaleIn">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-400/20">
              <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-heading font-bold text-[#1A2A3A]">Application Submitted</h3>
            <p className="text-[#5A6A7A] mt-3 leading-relaxed">
              Your {formData.subRole === 'kadhi' ? 'Kadhi' : 'Imam'} application is under review.<br />
              We'll notify you once approved.
            </p>
            <div className="mt-6 p-5 bg-[#F1F7FC] rounded-2xl text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Name:</span>
                <span className="font-medium text-[#1A2A3A]">{formData.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Role:</span>
                <span className="font-medium text-[#1A2A3A]">{formData.subRole === 'kadhi' ? 'Kadhi' : 'Imam'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Mosque:</span>
                <span className="font-medium text-[#1A2A3A]">{formData.mosqueName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Email:</span>
                <span className="font-medium text-[#1A2A3A]">{formData.email}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-8 px-8 py-4 bg-[#1769AA] text-white font-bold rounded-2xl hover:bg-[#2F80C0] hover:shadow-2xl hover:shadow-[#1769AA]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Return to Login
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F7FC] px-4 py-8">
      <div className="flex flex-col lg:flex-row max-w-6xl w-full bg-white rounded-3xl shadow-xl shadow-[#1769AA]/5 border border-[#E8EEF4] overflow-hidden">

        {/* LEFT: Branding Section */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#1769AA] to-[#2F80C0] p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10 text-center text-white">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">H</span>
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">HalalHub</div>
              <div className="text-xs text-white/60 tracking-[0.15em] uppercase mt-1">Sharia-Compliant Fintech</div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold mt-4">Become a Religious Leader</h1>
            <p className="text-white/70 mt-2 max-w-sm mx-auto">
              Register as an Imam or Kadhi to serve your community.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>Choose Your Primary Role</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>Serve Your Community</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>Access Platform Services</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          </div>
        </div>

        {/* RIGHT: Registration Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-white flex items-center">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1A2A3A]">
                {step > 6 ? 'Complete!' : `Step ${step} of 6`}
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1">
                {step > 6 ? 'Your application is submitted' : 'Fill in your details to continue'}
              </p>
            </div>

            {step <= 6 && renderStepIndicator()}

            {error && (
              <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-center justify-between text-sm text-[#DC2626] animate-slideDown">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-[#DC2626]/60 hover:text-[#DC2626] transition">✕</button>
              </div>
            )}

            {success && step === 7 && (
              <div className="mb-4 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-sm text-[#16A34A] animate-slideDown">
                {success}
              </div>
            )}

            <div className="py-2">
              {renderStep()}
            </div>

            {step >= 1 && step <= 4 && (
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    className="flex-1 px-6 py-3.5 rounded-2xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-300"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                <button
                  className={`${step > 1 ? 'flex-[2]' : 'flex-1'} px-6 py-3.5 rounded-2xl bg-[#1769AA] text-white font-bold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                  onClick={handleNext}
                >
                  Continue
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="flex gap-3 mt-8">
                <button
                  className="flex-1 px-6 py-3.5 rounded-2xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-300"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="flex-[2] px-6 py-3.5 rounded-2xl bg-[#1769AA] text-white font-bold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleNext}
                >
                  Submit Application
                </button>
              </div>
            )}

            {step === 6 && (
              <div className="flex gap-3 mt-8">
                <button
                  className="flex-1 px-6 py-3.5 rounded-2xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-300"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="flex-[2] px-6 py-3.5 rounded-2xl bg-[#1769AA] text-white font-bold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Verify & Submit'
                  )}
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#F1F7FC] text-center">
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

export default ImamRegister;