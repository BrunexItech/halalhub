import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { getCounties, getSubCounties, getWards } from '../services/locationApi';

const VendorRegister = () => {
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
    businessName: '',
    phone: '',
    email: '',
    nationalId: '',
    kraPin: '',
    businessRegNo: '',
    pin: '',
    county: '',
    countyName: '',
    subCounty: '',
    subCountyName: '',
    ward: '',
    wardName: '',
    halalDeclared: false,
    termsAccepted: false
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
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

    if (step === 1 && (!formData.businessName || !formData.county || !formData.subCounty || !formData.ward)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 2 && (!formData.phone || !formData.email)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 3 && (!formData.nationalId || !formData.kraPin || !formData.businessRegNo)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 4 && (!formData.pin || formData.pin.length < 4)) {
      setError('Please enter a valid PIN (min 4 digits)');
      return;
    }
    if (step === 5 && (!formData.halalDeclared || !formData.termsAccepted)) {
      setError('Please accept all declarations to continue');
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
      await authService.registerVendor({
        businessName: formData.businessName,
        phone: formData.phone,
        email: formData.email,
        nationalId: formData.nationalId,
        kraPin: formData.kraPin,
        businessRegNo: formData.businessRegNo,
        pin: formData.pin,
        region: formData.countyName,
        subCounty: formData.subCountyName,
        ward: formData.wardName,
        halalDeclared: formData.halalDeclared,
        termsAccepted: formData.termsAccepted
      });
      setStep(7);
      setSuccess('Application submitted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  const renderStepIndicator = () => {
    const current = step > 6 ? 6 : step;
    return (
      <div className="flex items-center justify-center gap-0 py-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Business Information</h3>
              <p className="text-sm text-[#94A3B8]">Tell us about your business</p>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Business Name *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              {loadingLocations ? (
                <div className="relative w-full px-5 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[#94A3B8] text-sm">Loading counties...</div>
              ) : locationError ? (
                <div className="relative w-full px-5 py-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-[#DC2626] text-sm">{locationError}</div>
              ) : (
                <select
                  className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300 appearance-none"
                  value={formData.county ? `${formData.county}|${formData.countyName}` : ''}
                  onChange={handleCountyChange}
                >
                  <option value="">Select County *</option>
                  {counties.map((county) => (
                    <option key={county.id} value={`${county.id}|${county.name}`}>
                      {county.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {formData.county && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <select
                  className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300 appearance-none"
                  value={formData.subCounty ? `${formData.subCounty}|${formData.subCountyName}` : ''}
                  onChange={handleSubCountyChange}
                >
                  <option value="">Select Sub-County *</option>
                  {subCounties.map((sub) => (
                    <option key={sub.id} value={`${sub.id}|${sub.name}`}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.subCounty && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <select
                  className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300 appearance-none"
                  value={formData.ward ? `${formData.ward}|${formData.wardName}` : ''}
                  onChange={handleWardChange}
                >
                  <option value="">Select Ward *</option>
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
          <div className="space-y-5 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Contact Information</h3>
              <p className="text-sm text-[#94A3B8]">How can we reach you?</p>
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Business Registration</h3>
              <p className="text-sm text-[#94A3B8]">Verify your business identity</p>
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
                name="kraPin"
                value={formData.kraPin}
                onChange={handleChange}
                placeholder="KRA PIN *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                name="businessRegNo"
                value={formData.businessRegNo}
                onChange={handleChange}
                placeholder="Business Registration No. *"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Security</h3>
              <p className="text-sm text-[#94A3B8]">Create your account PIN</p>
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

      case 5:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="mb-2">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Halal Compliance</h3>
              <p className="text-sm text-[#94A3B8]">Please confirm the following to proceed</p>
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 p-4 bg-[#F1F7FC] rounded-2xl cursor-pointer hover:bg-[#E8EEF4] transition-all duration-200">
                <input
                  type="checkbox"
                  name="halalDeclared"
                  checked={formData.halalDeclared}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded-md border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30 focus:ring-2"
                />
                <span className="text-sm text-[#1A2A3A] font-medium">I declare my business is Sharia-compliant</span>
              </label>

              <label className="flex items-start gap-3 p-4 bg-[#F1F7FC] rounded-2xl cursor-pointer hover:bg-[#E8EEF4] transition-all duration-200">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded-md border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30 focus:ring-2"
                />
                <span className="text-sm text-[#1A2A3A] font-medium">I accept HalalHub's Terms &amp; Conditions</span>
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

      case 7:
        return (
          <div className="text-center py-8 animate-scaleIn">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-400/20">
              <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-heading font-bold text-[#1A2A3A]">Application Submitted!</h3>
            <p className="text-[#5A6A7A] mt-3 leading-relaxed">
              Your vendor application is under review.<br />
              We'll notify you once approved.
            </p>
            <div className="mt-6 p-5 bg-[#F1F7FC] rounded-2xl text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Business:</span>
                <span className="font-medium text-[#1A2A3A]">{formData.businessName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">Email:</span>
                <span className="font-medium text-[#1A2A3A]">{formData.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">County:</span>
                <span className="font-medium text-[#1A2A3A]">{formData.countyName}</span>
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

            <h1 className="text-3xl lg:text-4xl font-bold mt-4">Become a Vendor</h1>
            <p className="text-white/70 mt-2 max-w-sm mx-auto">
              Register your business and start selling on Africa's leading halal platform
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>Halal-Certified Marketplace</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>Reach Thousands of Customers</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold">✓</span>
                <span>Secure Payment Processing</span>
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
                {step > 6 ? 'Your application is submitted' : 'Fill in your business details'}
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

            {step >= 1 && step < 5 && step !== 6 && (
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
                  {step === 5 ? 'Submit Application' : 'Continue'}
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
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
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

export default VendorRegister;