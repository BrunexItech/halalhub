import React, { useState } from 'react';
import { authService } from '../services/api';

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('+254712345678');
  const [pin, setPin] = useState('1234');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [regData, setRegData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    pin: '',
    county: '',
    subCounty: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otpSent) {
        await authService.loginStep1(phone);
        setOtpSent(true);
        setLoading(false);
        return;
      }

      const response = await authService.loginStep2({ phone, pin, otp });
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.register(regData);
      setSuccess('✅ Account created! Please login.');
      setRegData({ fullName: '', phone: '', email: '', nationalId: '', pin: '', county: '', subCounty: '' });
      setIsLogin(true); // Switch to login tab
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B3D2E',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(201,168,76,0.04) 0, rgba(201,168,76,0.04) 1px, transparent 0, transparent 50%)',
        backgroundSize: '30px 30px'
      }}></div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: '22px',
        padding: '48px 40px',
        width: 'min(440px, 94vw)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'Amiri', serif",
            fontSize: '2.4rem',
            background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'block',
            lineHeight: '1.2'
          }}>هَلَال هَبْ</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.7rem',
            fontWeight: 600,
            color: '#FFFFFF',
            letterSpacing: '0.08em',
            display: 'block',
            marginTop: '4px'
          }}>HalalHub</div>
          <div style={{
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: '6px',
            display: 'block'
          }}>Sharia-Compliant Fintech &amp; Lifestyle</div>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '28px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            style={{
              flex: 1,
              padding: '10px',
              textAlign: 'center',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: isLogin ? '#C9A84C' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.28s ease',
              border: 'none',
              background: isLogin ? 'rgba(201,168,76,0.2)' : 'transparent'
            }}
            onClick={() => { setIsLogin(true); setOtpSent(false); setError(''); setSuccess(''); }}
          >
            Login
          </button>
          <button
            style={{
              flex: 1,
              padding: '10px',
              textAlign: 'center',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: !isLogin ? '#C9A84C' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.28s ease',
              border: 'none',
              background: !isLogin ? 'rgba(201,168,76,0.2)' : 'transparent'
            }}
            onClick={() => { setIsLogin(false); setOtpSent(false); setError(''); setSuccess(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(192,57,43,0.2)',
            border: '1px solid #C0392B',
            color: '#C0392B',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(39,174,96,0.2)',
            border: '1px solid #27AE60',
            color: '#27AE60',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.85rem'
          }}>
            {success}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px'
              }}>Phone Number</label>
              <input
                type="tel"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.28s ease'
                }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px'
              }}>PIN / Password</label>
              <input
                type="password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.28s ease'
                }}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                required
              />
            </div>

            {otpSent && (
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '8px'
                }}>OTP Verification</label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.28s ease',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontSize: '1.2rem'
                  }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength="6"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0B3D2E',
                cursor: 'pointer',
                transition: 'all 0.28s ease',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
                marginTop: '8px'
              }}
              disabled={loading}
            >
              {loading ? 'Loading...' : (otpSent ? 'Verify OTP →' : 'Send OTP →')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px'
              }}>Full Name</label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.28s ease'
                }}
                value={regData.fullName}
                onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                placeholder="Abdullahi Mohamed"
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px'
              }}>Phone Number</label>
              <input
                type="tel"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.28s ease'
                }}
                value={regData.phone}
                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                placeholder="+254 7XX XXX XXX"
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px'
              }}>Email</label>
              <input
                type="email"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.28s ease'
                }}
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px'
              }}>National ID</label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.28s ease'
                }}
                value={regData.nationalId}
                onChange={(e) => setRegData({ ...regData, nationalId: e.target.value })}
                placeholder="National ID Number"
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '8px'
              }}>Create PIN</label>
              <input
                type="password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.28s ease'
                }}
                value={regData.pin}
                onChange={(e) => setRegData({ ...regData, pin: e.target.value })}
                placeholder="4-digit PIN"
                maxLength="6"
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0B3D2E',
                cursor: 'pointer',
                transition: 'all 0.28s ease',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
                marginTop: '8px'
              }}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Create Account →'}
            </button>
          </form>
        )}

        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '0.75rem',
          marginTop: '14px',
          lineHeight: '1.5'
        }}>
          🔒 Kenya DPA 2019 compliant · End-to-end encrypted · No riba
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
