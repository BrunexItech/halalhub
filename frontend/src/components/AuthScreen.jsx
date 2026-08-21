import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
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
      <div className="w-full px-3 py-2 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#B7C0BA] text-sm">
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
      )}
    </div>
  );
};

// ============================================================
// PIN Popup Modal Component - UPDATED: 4 digits
// ============================================================
const PinPopup = ({ isOpen, onClose, onVerify, loading, error }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(0, 1);
    setPin(newPin);
    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'Enter') {
      const pinString = pin.join('');
      if (pinString.length === 4) {
        onVerify(pinString);
      }
    }
  };

  const handleSubmit = () => {
    const pinString = pin.join('');
    if (pinString.length === 4) {
      onVerify(pinString);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0B342B] rounded-3xl max-w-sm w-full p-6 border border-[#C9A44B]/30 shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#032A24] border border-[#C9A44B]/30 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#F7F6F1]">Enter Your PIN</h3>
          <p className="text-sm text-[#B7C0BA] mt-1">Enter your 4-digit transaction PIN to continue</p>
        </div>

        <div className="flex gap-3 justify-center mb-4">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              className="w-14 h-14 rounded-xl bg-[#032A24] border border-[#C9A44B]/30 text-center text-[#F7F6F1] text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoFocus={index === 0}
              required
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#032A24] border border-[#DC2626]/30 rounded-xl text-xs text-[#DC2626] text-center">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#032A24] text-[#B7C0BA] font-semibold text-sm hover:bg-[#12342D] transition-all duration-300"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-sm shadow-md shadow-[#C9A44B]/20 hover:shadow-lg hover:shadow-[#C9A44B]/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={loading || pin.join('').length < 4}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify PIN'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// AuthScreen Component - Two-Step Login (4-Digit PIN)
// ============================================================
const AuthScreen = ({ onLogin }) => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showPinPopup, setShowPinPopup] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  // Set default country to Kenya
  useEffect(() => {
    const allCountries = processCountriesData();
    const kenya = allCountries.find(c => c.alpha2 === 'KE');
    if (kenya) {
      setSelectedCountry(kenya);
    } else if (allCountries.length > 0) {
      setSelectedCountry(allCountries[0]);
    }
  }, []);

  // Auto-populate phone with dial code when country changes
  useEffect(() => {
    if (selectedCountry) {
      const dialCode = selectedCountry.dialCode;
      if (!phone.startsWith(dialCode)) {
        setPhone(dialCode);
      }
    }
  }, [selectedCountry]);

  const getFullPhoneNumber = () => {
    if (!selectedCountry) return phone;
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    return `${selectedCountry.dialCode}${cleanPhone}`;
  };

  const isValidPhone = (phoneStr) => {
    const clean = phoneStr.replace(/\s/g, '');
    let local = clean;
    if (selectedCountry && clean.startsWith(selectedCountry.dialCode)) {
      local = clean.substring(selectedCountry.dialCode.length);
    } else if (clean.startsWith('+')) {
      local = clean.replace(/^\+?\d+/, '');
    }
    const digits = local.replace(/[^0-9]/g, '');
    return digits.length >= 6;
  };

  // Step 1: Validate Phone + Password, then show PIN popup
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedCountry) {
      setError('Please select your country.');
      setLoading(false);
      return;
    }

    const cleanPhone = phone.replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      setError('Please enter a valid phone number (minimum 6 digits).');
      setLoading(false);
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    const fullPhone = getFullPhoneNumber();

    try {
      const response = await authService.validatePassword({
        phone: fullPhone,
        password: password
      });

      setTempUserData({
        phone: fullPhone,
        userData: response.data.user
      });
      setShowPinPopup(true);
      setPinError('');
      setLoading(false);

    } catch (err) {
      setError(err.response?.data?.error || 'Invalid password. Please try again.');
      setLoading(false);
    }
  };

  // Step 2: Verify PIN and complete login
  const handlePinVerify = async (pin) => {
    setPinLoading(true);
    setPinError('');

    try {
      const response = await authService.verifyPin({
        phone: tempUserData.phone,
        pin: pin
      });

      const userData = response.data.user;
      localStorage.setItem('halalhub_role', userData.role || 'client');

      if (userData.role === 'vendor' && userData.vendorStatus === 'pending') {
        setPinError('Your vendor application is pending admin approval.');
        setPinLoading(false);
        return;
      }

      if (userData.role === 'vendor' && userData.vendorStatus === 'rejected') {
        setPinError('Your vendor application has been rejected.');
        setPinLoading(false);
        return;
      }

      if (userData.role === 'leader' && userData.leaderStatus === 'pending') {
        setPinError('Your religious leader application is pending admin approval.');
        setPinLoading(false);
        return;
      }

      if (userData.role === 'leader' && userData.leaderStatus === 'rejected') {
        setPinError('Your religious leader application has been rejected.');
        setPinLoading(false);
        return;
      }
      
      if (userData.subRole) {
        localStorage.setItem('halalhub_subrole', userData.subRole);
      }
      
      if (userData.vendorType) {
        localStorage.setItem('halalhub_vendor_type', userData.vendorType);
      }

      setShowPinPopup(false);
      setPinLoading(false);
      onLogin(userData, response.data.token);

    } catch (err) {
      setPinError(err.response?.data?.error || 'Invalid PIN. Please try again.');
      setPinLoading(false);
    }
  };

  const handlePinPopupClose = () => {
    setShowPinPopup(false);
    setPinError('');
    setTempUserData(null);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

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
    <div className="min-h-screen flex items-center justify-center bg-[#032A24] px-3 sm:px-4 py-8">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="bg-[#0B342B] rounded-3xl shadow-2xl shadow-black/30 p-5 sm:p-6 md:p-8 w-full border border-[#C9A44B]/30 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="text-center mb-6">
              <img 
                src="/itqaan_logo.png" 
                alt="Itqaan" 
                className="h-14 sm:h-16 w-auto object-contain mx-auto"
              />
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

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Phone Number */}
              <div>
                <label className="block text-[10px] font-semibold text-[#FFFFFF] uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="w-[58px] sm:w-[65px] flex-shrink-0">
                    <CountrySelect 
                      value={selectedCountry?.alpha2 || 'KE'}
                      onChange={setSelectedCountry}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="tel"
                      className="w-full px-3 sm:px-4 py-2 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="712345678"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-semibold text-[#FFFFFF] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-3 sm:px-4 py-2 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300 h-[42px] pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7C0BA]/60 hover:text-[#B7C0BA] transition"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-[#C9A44B]/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    Verifying...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-[11px] text-[#C9A44B]/60 hover:text-[#C9A44B] transition-colors duration-200"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-[#C9A44B]/20">
              <p className="text-center text-[9px] text-[#C9A44B]/40 tracking-wider">
                Secure · Encrypted · No Riba
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Popup */}
      <PinPopup
        isOpen={showPinPopup}
        onClose={handlePinPopupClose}
        onVerify={handlePinVerify}
        loading={pinLoading}
        error={pinError}
      />
    </div>
  );
};

export default AuthScreen;