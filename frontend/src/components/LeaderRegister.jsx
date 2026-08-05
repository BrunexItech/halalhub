import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { getCounties, getSubCounties, getWards } from '../services/locationApi';

const LEADER_TYPES = [
  { id: 'islamic_scholar', label: 'Islamic Scholar' },
  { id: 'imam', label: 'Imam' },
  { id: 'adhan_caller', label: 'Adhan Caller' },
  { id: 'ustadh', label: 'Ustadh' },
  { id: 'ustadha', label: 'Ustadha' },
  { id: 'kadhi', label: 'Kadhi' }
];

const CONSULTATION_TYPES = ['video', 'in-person', 'phone', 'chat'];

const LeaderRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);
  const otpTimerRef = useRef(null);
  
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    pin: '',
    leaderType: '',
    location: '',
    region: '',
    regionName: '',
    subCounty: '',
    subCountyName: '',
    ward: '',
    wardName: '',
    mosqueName: '',
    mosqueLocation: '',
    qualifications: '',
    yearsOfService: '',
    bio: '',
    institution: '',
    consultationFee: '',
    consultationTypes: [],
    termsAccepted: false
  });

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

  useEffect(() => {
    if (formData.regionName) {
      const fetchSubs = async () => {
        try {
          const data = await getSubCounties(formData.regionName);
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
  }, [formData.regionName]);

  useEffect(() => {
    if (formData.regionName && formData.subCountyName) {
      const fetchWards = async () => {
        try {
          const data = await getWards(formData.regionName, formData.subCountyName);
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
  }, [formData.regionName, formData.subCountyName]);

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

  const handleConsultationTypeToggle = (type) => {
    setFormData(prev => {
      const current = prev.consultationTypes || [];
      if (current.includes(type)) {
        return { ...prev, consultationTypes: current.filter(t => t !== type) };
      } else {
        return { ...prev, consultationTypes: [...current, type] };
      }
    });
  };

  const handleCountyChange = (e) => {
    const value = e.target.value;
    const [id, name] = value.split('|');
    setFormData({
      ...formData,
      region: id,
      regionName: name,
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

    if (step === 1 && (!formData.fullName || !formData.leaderType || !formData.location || !formData.region || !formData.subCounty || !formData.ward)) {
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
      const verifyResponse = await authService.verifyRegistrationOtp({
        phone: formData.phone,
        otp: otpString
      });

      if (!verifyResponse.data.success) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      await authService.registerLeader({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        nationalId: formData.nationalId,
        pin: formData.pin,
        leaderType: formData.leaderType,
        location: formData.location,
        region: formData.regionName,
        subCounty: formData.subCountyName,
        ward: formData.wardName,
        mosqueName: formData.mosqueName || null,
        mosqueLocation: formData.mosqueLocation || null,
        qualifications: formData.qualifications.split(',').map(q => q.trim()),
        yearsOfService: parseInt(formData.yearsOfService) || 0,
        bio: formData.bio || null,
        institution: formData.institution || null,
        consultationFee: parseInt(formData.consultationFee) || 0,
        consultationTypes: formData.consultationTypes.length > 0 ? formData.consultationTypes : ['video'],
        availableForConsultation: formData.consultationTypes.length > 0,
        termsAccepted: formData.termsAccepted
      });

      setStep(7);
      const leaderLabel = LEADER_TYPES.find(t => t.id === formData.leaderType)?.label || 'Leader';
      setSuccess(`${leaderLabel} application submitted successfully!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const renderStepIndicator = () => {
    const current = step > 6 ? 6 : step;
    const steps = [1, 2, 3, 4, 5, 6];
    return (
      <div className="flex items-center justify-center gap-0 py-3">
        {steps.map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-500 ${
              i <= current
                ? 'bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] shadow-md shadow-[#C9A44B]/20'
                : 'bg-[#032A24] text-[#B7C0BA] border border-[#C9A44B]/20'
            }`}>
              {i < current ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              ) : i}
            </div>
            {i < 6 && (
              <div className={`w-5 h-0.5 transition-all duration-500 ${
                i < current ? 'bg-gradient-to-r from-[#C9A44B] to-[#E1C16B]' : 'bg-[#C9A44B]/20'
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
          <div className="space-y-3 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">Leader Information</h3>
              <p className="text-xs text-[#B7C0BA]">Tell us about yourself</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <select
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 appearance-none"
                name="leaderType"
                value={formData.leaderType}
                onChange={handleChange}
              >
                <option value="" className="bg-[#032A24]">Select Leader Type *</option>
                {LEADER_TYPES.map((type) => (
                  <option key={type.id} value={type.id} className="bg-[#032A24]">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Specific Location/Address *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              {loadingLocations ? (
                <div className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#B7C0BA] text-sm">Loading counties...</div>
              ) : locationError ? (
                <div className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#DC2626]/30 rounded-xl text-[#DC2626] text-sm">{locationError}</div>
              ) : (
                <select
                  className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 appearance-none"
                  value={formData.region ? `${formData.region}|${formData.regionName}` : ''}
                  onChange={handleCountyChange}
                >
                  <option value="" className="bg-[#032A24]">Select County *</option>
                  {counties.map((county) => (
                    <option key={county.id} value={`${county.id}|${county.name}`} className="bg-[#032A24]">
                      {county.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {formData.region && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <select
                  className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 appearance-none"
                  value={formData.subCounty ? `${formData.subCounty}|${formData.subCountyName}` : ''}
                  onChange={handleSubCountyChange}
                >
                  <option value="" className="bg-[#032A24]">Select Sub-County *</option>
                  {subCounties.map((sub) => (
                    <option key={sub.id} value={`${sub.id}|${sub.name}`} className="bg-[#032A24]">
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.subCounty && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <select
                  className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 appearance-none"
                  value={formData.ward ? `${formData.ward}|${formData.wardName}` : ''}
                  onChange={handleWardChange}
                >
                  <option value="" className="bg-[#032A24]">Select Ward *</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={`${ward.id}|${ward.name}`} className="bg-[#032A24]">
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                name="mosqueName"
                value={formData.mosqueName}
                onChange={handleChange}
                placeholder="Mosque Name (Optional)"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                name="mosqueLocation"
                value={formData.mosqueLocation}
                onChange={handleChange}
                placeholder="Mosque Location (Optional)"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">Contact Information</h3>
              <p className="text-xs text-[#B7C0BA]">How can we reach you?</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address *"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">ID & Security</h3>
              <p className="text-xs text-[#B7C0BA]">Verify your identity</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="National ID *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="Create PIN *"
                maxLength="6"
              />
              <p className="text-[10px] text-[#B7C0BA]/60 mt-1.5">PIN must be at least 4 digits</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">Qualifications & Consultation</h3>
              <p className="text-xs text-[#B7C0BA]">Tell us about your qualifications and services</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <textarea
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 resize-y min-h-[80px]"
                name="qualifications"
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="Qualifications (e.g., Bachelors Islamic Studies, Masters Theology) *"
              />
              <p className="text-[10px] text-[#B7C0BA]/60 mt-1">Separate multiple qualifications with commas</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                type="number"
                name="yearsOfService"
                value={formData.yearsOfService}
                onChange={handleChange}
                placeholder="Years of Service"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                placeholder="Institution (Optional)"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                type="number"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                placeholder="Consultation Fee (KES) - Optional"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#B7C0BA] block mb-1.5">Consultation Types (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {CONSULTATION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      formData.consultationTypes.includes(type)
                        ? 'bg-[#C9A44B] text-[#032A24]'
                        : 'bg-[#032A24] text-[#B7C0BA] border border-[#C9A44B]/30'
                    }`}
                    onClick={() => handleConsultationTypeToggle(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <textarea
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 resize-y min-h-[60px]"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Bio / About You (Optional)"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">Terms & Conditions</h3>
              <p className="text-xs text-[#B7C0BA]">Please confirm the following to proceed</p>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 p-3 bg-[#032A24] rounded-xl cursor-pointer hover:bg-[#12342D] transition-all duration-200 border border-[#C9A44B]/30">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded-md border-[#C9A44B]/30 bg-[#032A24] text-[#C9A44B] focus:ring-[#C9A44B]/40 focus:ring-2"
                />
                <span className="text-xs text-[#F7F6F1] font-medium">I accept Itqaan's Terms & Conditions</span>
              </label>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-3 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">Verify Your Identity</h3>
              <p className="text-xs text-[#B7C0BA]">Enter the 6-digit code sent to your phone</p>
            </div>

            {otpSent && (
              <div className="bg-[#032A24] rounded-xl p-3 border border-[#C9A44B]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="text-[#C9A44B]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-[#C9A44B]">Your OTP Code</span>
                      <div className="text-lg font-mono font-bold text-[#E1C16B] tracking-widest mt-0.5">
                        {otpCode || '......'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${otpExpirySeconds <= 10 ? 'text-[#DC2626]' : 'text-[#C9A44B]'}`}>
                      {otpExpirySeconds > 0 ? `${otpExpirySeconds}s` : 'Expired'}
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
            )}

            <div className="flex gap-2 justify-center py-1">
              {otp.map((digit, index) => {
                const isFilled = digit && digit.length > 0;
                return (
                  <div
                    key={index}
                    className="relative w-10 h-12 rounded-xl cursor-text"
                    style={{
                      backgroundColor: '#032A24',
                      border: '1px solid rgba(201, 164, 75, 0.3)',
                    }}
                    onClick={() => {
                      if (inputRefs.current[index]) {
                        inputRefs.current[index].focus();
                      }
                    }}
                  >
                    <input
                      ref={(el) => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      className="absolute inset-0 w-full h-full bg-transparent border-none outline-none text-center text-[#F7F6F1] text-base font-semibold"
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      required
                      style={{
                        caretColor: 'transparent',
                        padding: 0,
                        margin: 0,
                        textIndent: 0,
                        lineHeight: '48px',
                        height: '48px',
                        width: '40px',
                        boxSizing: 'border-box',
                        WebkitTextFillColor: '#F7F6F1',
                        MozOsxFontSmoothing: 'grayscale',
                        fontVariantNumeric: 'tabular-nums',
                        opacity: 1,
                      }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#F7F6F1] text-base font-semibold"
                      style={{
                        lineHeight: '48px',
                        height: '48px',
                        width: '40px',
                      }}
                    >
                      {isFilled ? digit : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-[10px] text-[#B7C0BA]/60">
                {otpSent ? 'Enter the code above' : 'Click "Send Code" to receive OTP'}
              </span>
              <button
                type="button"
                className={`text-[10px] font-semibold transition ${
                  otpSent
                    ? 'text-[#C9A44B] hover:text-[#E1C16B]'
                    : 'text-[#C9A44B] hover:text-[#E1C16B]'
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
          <div className="text-center py-6 animate-scaleIn">
            <div className="w-16 h-16 rounded-xl bg-[#032A24] flex items-center justify-center mx-auto mb-4 border border-[#3FAF73]/30">
              <svg className="w-8 h-8 text-[#3FAF73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#F7F6F1]">Application Submitted</h3>
            <p className="text-[#B7C0BA] text-sm mt-2 leading-relaxed">
              Your {LEADER_TYPES.find(t => t.id === formData.leaderType)?.label || 'Leader'} application is under review.<br />
              We'll notify you once approved.
            </p>
            <div className="mt-4 p-4 bg-[#032A24] rounded-xl text-left space-y-1.5 border border-[#C9A44B]/30">
              <div className="flex justify-between text-xs">
                <span className="text-[#B7C0BA]">Name:</span>
                <span className="font-medium text-[#F7F6F1]">{formData.fullName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#B7C0BA]">Type:</span>
                <span className="font-medium text-[#F7F6F1]">{LEADER_TYPES.find(t => t.id === formData.leaderType)?.label || 'Leader'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#B7C0BA]">Location:</span>
                <span className="font-medium text-[#F7F6F1]">{formData.location}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#B7C0BA]">Email:</span>
                <span className="font-medium text-[#F7F6F1]">{formData.email}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-sm rounded-xl hover:shadow-2xl hover:shadow-[#C9A44B]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
    <div className="min-h-screen flex items-center justify-center bg-[#032A24] px-4 py-8">
      <div className="flex flex-col lg:flex-row max-w-4xl w-full bg-[#0B342B] rounded-3xl shadow-2xl shadow-black/30 border border-[#C9A44B]/30 overflow-hidden relative">

        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />

        <div className="w-full lg:w-2/5 bg-gradient-to-br from-[#032A24] to-[#0B342B] p-6 lg:p-8 flex items-center justify-center relative overflow-hidden">
          <div className="relative z-10 text-center">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-3">
                <img
                  src="/itqaan_logo.png"
                  alt="Itqaan"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <div className="text-[9px] font-medium text-[#C9A44B] tracking-[0.2em] uppercase">Sharia-Compliant Fintech</div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-[#F7F6F1]">Become a Religious Leader</h1>
            <p className="text-[#B7C0BA] text-sm mt-1.5 max-w-sm mx-auto">
              Register as an Islamic Scholar, Imam, Adhan Caller, Ustadh, Ustadha, or Kadhi.
            </p>

            <div className="mt-6 space-y-1 flex flex-col items-start w-full max-w-[200px] mx-auto">
              <div className="flex items-center gap-2.5 text-xs text-[#B7C0BA]">
                <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#C9A44B]/20 text-[#C9A44B] text-[10px] font-bold flex-shrink-0">✓</span>
                <span className="leading-none whitespace-nowrap">Choose Your Leader Type</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#B7C0BA]">
                <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#C9A44B]/20 text-[#C9A44B] text-[10px] font-bold flex-shrink-0">✓</span>
                <span className="leading-none whitespace-nowrap">Build Your Pension</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#B7C0BA]">
                <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#C9A44B]/20 text-[#C9A44B] text-[10px] font-bold flex-shrink-0">✓</span>
                <span className="leading-none whitespace-nowrap">Offer Consultations</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#B7C0BA]">
                <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#C9A44B]/20 text-[#C9A44B] text-[10px] font-bold flex-shrink-0">✓</span>
                <span className="leading-none whitespace-nowrap">Community Support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-3/5 p-6 lg:p-8 bg-[#0B342B] flex items-center">
          <div className="w-full max-w-sm mx-auto relative z-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#F7F6F1]">
                {step > 6 ? 'Complete!' : `Step ${step} of 6`}
              </h2>
              <p className="text-xs text-[#B7C0BA] mt-0.5">
                {step > 6 ? 'Your application is submitted' : 'Fill in your details to continue'}
              </p>
            </div>

            {step <= 6 && renderStepIndicator()}

            {error && (
              <div className="mb-3 p-3 bg-[#032A24] border border-[#DC2626]/30 rounded-xl flex items-center justify-between text-xs text-[#DC2626] animate-slideDown">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-[#DC2626]/60 hover:text-[#DC2626] transition">✕</button>
              </div>
            )}

            {success && step === 7 && (
              <div className="mb-3 p-3 bg-[#032A24] border border-[#3FAF73]/30 rounded-xl text-xs text-[#3FAF73] animate-slideDown">
                {success}
              </div>
            )}

            <div className="py-1">
              {renderStep()}
            </div>

            {step >= 1 && step <= 4 && (
              <div className="flex gap-2.5 mt-5">
                {step > 1 && (
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#032A24] text-[#B7C0BA] font-semibold text-xs hover:bg-[#12342D] transition-all duration-300"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                <button
                  className={`${step > 1 ? 'flex-[2]' : 'flex-1'} px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-xs shadow-md shadow-[#C9A44B]/20 hover:shadow-lg hover:shadow-[#C9A44B]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                  onClick={handleNext}
                >
                  Continue
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="flex gap-2.5 mt-5">
                <button
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#032A24] text-[#B7C0BA] font-semibold text-xs hover:bg-[#12342D] transition-all duration-300"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-xs shadow-md shadow-[#C9A44B]/20 hover:shadow-lg hover:shadow-[#C9A44B]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleNext}
                >
                  Submit Application
                </button>
              </div>
            )}

            {step === 6 && (
              <div className="flex gap-2.5 mt-5">
                <button
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#032A24] text-[#B7C0BA] font-semibold text-xs hover:bg-[#12342D] transition-all duration-300"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-xs shadow-md shadow-[#C9A44B]/20 hover:shadow-lg hover:shadow-[#C9A44B]/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#032A24]/30 border-t-[#032A24] rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Verify & Submit'
                  )}
                </button>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-[#C9A44B]/20 text-center">
              <p className="text-xs text-[#B7C0BA]">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/')}
                  className="font-semibold text-[#C9A44B] hover:text-[#E1C16B] transition"
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

export default LeaderRegister;