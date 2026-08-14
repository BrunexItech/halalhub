import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { getCounties, getSubCounties, getWards } from '../services/locationApi';
import countriesData from 'world-countries';

// ============================================================
// Process countries data
// ============================================================
const processCountriesData = () => {
  try {
    return countriesData.map((country) => {
      let dialCode = '';
      if (country.idd) {
        const root = country.idd.root || '';
        const suffixes = country.idd.suffixes || [];
        dialCode = root + (suffixes.length > 0 ? suffixes[0] : '');
      }
      return {
        name: country.name?.common || country.name || '',
        alpha2: country.cca2 || '',
        dialCode: dialCode,
        flag: country.flag || '🏳️',
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error processing countries data:', error);
    return [];
  }
};

// ============================================================
// CountrySelect Component
// ============================================================
const CountrySelect = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  
  const allCountries = React.useMemo(() => processCountriesData(), []);
  const selectedCountry = allCountries.find(c => c.alpha2 === value) || allCountries[0];
  
  const filteredCountries = allCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.alpha2.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country) => {
    onChange(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (allCountries.length === 0) {
    return (
      <div className="w-full px-3 py-2 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#B7C0BA] text-sm h-[42px] flex items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="w-full px-2 py-2 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-lg focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 flex items-center justify-between h-[42px]"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="text-xl leading-none">{selectedCountry?.flag || '🏳️'}</span>
        <span className={`ml-1 text-[10px] text-[#B7C0BA] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-[280px] mt-1 bg-[#0B342B] border border-[#C9A44B]/30 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
          <div className="sticky top-0 p-2 bg-[#0B342B] border-b border-[#C9A44B]/20 z-10">
            <input
              type="text"
              className="w-full px-3 py-1.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-lg text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A44B]"
              placeholder="Search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="pb-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.alpha2}
                  type="button"
                  className={`w-full px-3 py-1.5 text-left hover:bg-[#032A24] transition-colors flex items-center gap-3 ${
                    country.alpha2 === value ? 'bg-[#032A24]/50' : ''
                  }`}
                  onClick={() => handleSelect(country)}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-[#F7F6F1] text-sm flex-1">{country.name}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-[#B7C0BA] text-sm text-center">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VendorRegister = () => {
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

  // Country selection state
  const [selectedCountry, setSelectedCountry] = useState(null);

  const businessTypes = [
    { id: 'halalmarket', name: 'Halal Market', description: 'Sell halal products' },
    { id: 'halalbutchery', name: 'Halal Butchery', description: 'Sell halal-certified meat' },
    { id: 'restaurant', name: 'Restaurant', description: 'Halal-certified dining' },
    { id: 'halalstay', name: 'HalalStay', description: 'Halal-friendly accommodation' },
    { id: 'hearse', name: 'Hearse & Shroud Provider', description: 'Islamic funeral services' },
    { id: 'hajj', name: 'Hajj & Umrah Package Provider', description: 'Offer Hajj and Umrah packages' },
  ];

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    vendorType: '',
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

  // Set default country to Kenya
  useEffect(() => {
    const allCountries = processCountriesData();
    const kenya = allCountries.find(c => c.alpha2 === 'KE');
    if (kenya) {
      setSelectedCountry(kenya);
      setFormData(prev => ({
        ...prev,
        phone: kenya.dialCode
      }));
    } else if (allCountries.length > 0) {
      setSelectedCountry(allCountries[0]);
      setFormData(prev => ({
        ...prev,
        phone: allCountries[0].dialCode
      }));
    }
  }, []);

  // Update phone when country changes
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setFormData(prev => ({
      ...prev,
      phone: country.dialCode
    }));
  };

  // Get full phone number for backend
  const getFullPhoneNumber = () => {
    if (!selectedCountry) return formData.phone;
    const cleanPhone = formData.phone.replace(/\s/g, '');
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    return `${selectedCountry.dialCode}${cleanPhone}`;
  };

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

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });

    if (name === 'businessType') {
      setFormData(prev => ({
        ...prev,
        businessType: value,
        vendorType: value
      }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (selectedCountry && !value.startsWith(selectedCountry.dialCode)) {
      setFormData({ ...formData, phone: selectedCountry.dialCode });
    } else {
      setFormData({ ...formData, phone: value });
    }
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
    const fullPhone = getFullPhoneNumber();
    
    if (!fullPhone || fullPhone.length < 8) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.sendRegistrationOtp({ 
        phone: fullPhone,
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
    
    const fullPhone = getFullPhoneNumber();
    
    setLoading(true);
    setError('');
    try {
      const response = await authService.sendRegistrationOtp({ 
        phone: fullPhone,
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

    if (step === 1 && (!formData.businessName || !formData.businessType || !formData.county || !formData.subCounty || !formData.ward)) {
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

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
    
    const fullPhone = getFullPhoneNumber();
    
    setLoading(true);
    setError('');
    try {
      const verifyResponse = await authService.verifyRegistrationOtp({
        phone: fullPhone,
        otp: otpString
      });
      
      if (!verifyResponse.data.success) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }
      
      await authService.registerVendor({
        businessName: formData.businessName,
        businessType: formData.businessType,
        vendorType: formData.businessType,
        phone: fullPhone,
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
      <div className="flex items-center justify-center gap-0 py-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <h3 className="text-base font-bold text-[#F7F6F1]">Business Information</h3>
              <p className="text-xs text-[#B7C0BA]">Tell us about your business</p>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px]"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Business Name *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <select
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 appearance-none h-[42px]"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
              >
                <option value="" className="bg-[#032A24]">Select Business Type *</option>
                {businessTypes.map((type) => (
                  <option key={type.id} value={type.id} className="bg-[#032A24]">
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              {loadingLocations ? (
                <div className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#B7C0BA] text-sm h-[42px] flex items-center">Loading counties...</div>
              ) : locationError ? (
                <div className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#DC2626]/30 rounded-xl text-[#DC2626] text-sm h-[42px] flex items-center">{locationError}</div>
              ) : (
                <select
                  className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 appearance-none h-[42px]"
                  value={formData.county ? `${formData.county}|${formData.countyName}` : ''}
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

            {formData.county && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <select
                  className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 appearance-none h-[42px]"
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
                  className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 appearance-none h-[42px]"
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
              <div className="relative flex gap-2">
                <div className="w-[58px] sm:w-[65px] flex-shrink-0">
                  <CountrySelect 
                    value={selectedCountry?.alpha2 || 'KE'}
                    onChange={handleCountryChange}
                    disabled={loading}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px]"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="712345678"
                  />
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px]"
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
              <h3 className="text-base font-bold text-[#F7F6F1]">Business Registration</h3>
              <p className="text-xs text-[#B7C0BA]">Verify your business identity</p>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px]"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="National ID *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px]"
                name="kraPin"
                value={formData.kraPin}
                onChange={handleChange}
                placeholder="KRA PIN *"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px]"
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
          <div className="space-y-3 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">Security</h3>
              <p className="text-xs text-[#B7C0BA]">Create your account PIN</p>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C9A44B]/20 to-[#E1C16B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                className="relative w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px]"
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

      case 5:
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">Halal Compliance</h3>
              <p className="text-xs text-[#B7C0BA]">Please confirm the following to proceed</p>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 p-3 bg-[#032A24] rounded-xl cursor-pointer hover:bg-[#12342D] transition-all duration-200 border border-[#C9A44B]/30">
                <input
                  type="checkbox"
                  name="halalDeclared"
                  checked={formData.halalDeclared}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded-md border-[#C9A44B]/30 bg-[#032A24] text-[#C9A44B] focus:ring-[#C9A44B]/40 focus:ring-2"
                />
                <span className="text-xs text-[#F7F6F1] font-medium">I declare my business is Sharia-compliant</span>
              </label>

              <label className="flex items-start gap-3 p-3 bg-[#032A24] rounded-xl cursor-pointer hover:bg-[#12342D] transition-all duration-200 border border-[#C9A44B]/30">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded-md border-[#C9A44B]/30 bg-[#032A24] text-[#C9A44B] focus:ring-[#C9A44B]/40 focus:ring-2"
                />
                <span className="text-xs text-[#F7F6F1] font-medium">I accept Itqaan's Terms &amp; Conditions</span>
              </label>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-3 animate-fadeIn">
            <div className="mb-1.5">
              <h3 className="text-base font-bold text-[#F7F6F1]">Verify Your Identity</h3>
              <p className="text-xs text-[#B7C0BA]">Enter the 6-digit code</p>
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
                        {otpCode || '••••••'}
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

            <div className="flex justify-between items-center">
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
            <h3 className="text-xl font-bold text-[#F7F6F1]">Application Submitted!</h3>
            <p className="text-[#B7C0BA] text-sm mt-2 leading-relaxed">
              Your vendor application is under review.<br />
              We'll notify you once approved.
            </p>
            <div className="mt-4 p-4 bg-[#032A24] rounded-xl text-left space-y-1.5 border border-[#C9A44B]/30">
              <div className="flex justify-between text-xs">
                <span className="text-[#B7C0BA]">Business:</span>
                <span className="font-medium text-[#F7F6F1]">{formData.businessName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#B7C0BA]">Email:</span>
                <span className="font-medium text-[#F7F6F1]">{formData.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#B7C0BA]">County:</span>
                <span className="font-medium text-[#F7F6F1]">{formData.countyName}</span>
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

        {/* LEFT: Branding Section */}
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

            <h1 className="text-2xl lg:text-3xl font-bold text-[#F7F6F1]">Become a Vendor</h1>
            <p className="text-[#B7C0BA] text-sm mt-1.5 max-w-sm mx-auto">
              Register your business on Africa's leading halal platform
            </p>

            <div className="mt-6 space-y-2 flex flex-col items-start w-full max-w-[200px] mx-auto">
              <div className="flex items-center gap-2.5 text-xs text-[#B7C0BA]">
                <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#C9A44B]/20 text-[#C9A44B] text-[10px] font-bold flex-shrink-0">✓</span>
                <span className="leading-none">Halal-Certified Marketplace</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#B7C0BA]">
                <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#C9A44B]/20 text-[#C9A44B] text-[10px] font-bold flex-shrink-0">✓</span>
                <span className="leading-none whitespace-nowrap">Reach Thousands of Customers</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#B7C0BA]">
                <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#C9A44B]/20 text-[#C9A44B] text-[10px] font-bold flex-shrink-0">✓</span>
                <span className="leading-none">Secure Payment Processing</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Registration Form */}
        <div className="w-full lg:w-3/5 p-6 lg:p-8 bg-[#0B342B] flex items-center">
          <div className="w-full max-w-sm mx-auto relative z-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#F7F6F1]">
                {step > 6 ? 'Complete!' : `Step ${step} of 6`}
              </h2>
              <p className="text-xs text-[#B7C0BA] mt-0.5">
                {step > 6 ? 'Your application is submitted' : 'Fill in your business details'}
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

            {step >= 1 && step <= 5 && (
              <div className="flex gap-2.5 mt-5">
                {step > 1 && (
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#032A24] text-[#B7C0BA] font-semibold text-xs hover:bg-[#12342D] transition-all duration-300 h-[42px]"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                <button
                  className={`${step > 1 ? 'flex-[2]' : 'flex-1'} px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-xs shadow-md shadow-[#C9A44B]/20 hover:shadow-lg hover:shadow-[#C9A44B]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] h-[42px]`}
                  onClick={handleNext}
                >
                  {step === 5 ? 'Submit Application' : 'Continue'}
                </button>
              </div>
            )}

            {step === 6 && (
              <div className="flex gap-2.5 mt-5">
                <button
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#032A24] text-[#B7C0BA] font-semibold text-xs hover:bg-[#12342D] transition-all duration-300 h-[42px]"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-xs shadow-md shadow-[#C9A44B]/20 hover:shadow-lg hover:shadow-[#C9A44B]/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] h-[42px]"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#032A24]/30 border-t-[#032A24] rounded-full animate-spin" />
                      Verifying...
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

export default VendorRegister;