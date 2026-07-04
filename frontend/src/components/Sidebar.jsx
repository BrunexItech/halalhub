import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/wallet', icon: '💳', label: 'Wallet' },
    { path: '/zakat', icon: '⚖️', label: 'Zakat' },
    { path: '/sadaqa', icon: '🤲', label: 'Sadaqa' },
    { path: '/p2p', icon: '🤝', label: 'P2P Amanah' },
    { path: '/takaful', icon: '🛡️', label: 'Takaful' },
    { path: '/pension', icon: '🕌', label: 'Imam Pension' },
    { path: '/utilities', icon: '⚡', label: 'Utilities' },
    { path: '/halalstay', icon: '🏨', label: 'HalalStay' },
    { path: '/hajj', icon: '🕋', label: 'Hajj & Umrah' },
    { path: '/hearse', icon: '🚑', label: 'Hearse & Shroud' },
    { path: '/ecommerce', icon: '🛒', label: 'Halal Market' },
    { path: '/restaurants', icon: '🍽️', label: 'HalaRestaurants' },
    { path: '/mosque', icon: '🕌', label: 'Mosque Finder' },
    { path: '/wills', icon: '📜', label: 'Digital Wills' },
    { path: '/kadhis', icon: '📖', label: 'Kadhis & Scholars' },
    { path: '/kyc-status', icon: '📋', label: 'My KYC Status' },
    { path: '/about', icon: 'ℹ️', label: 'About' },
    { path: '/devcode', icon: '💻', label: 'Developer Code' }
  ];

  // Mobile hamburger menu state
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '12px',
          left: '12px',
          zIndex: 200,
          background: '#0B3D2E',
          border: 'none',
          color: '#C9A84C',
          fontSize: '1.5rem',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          '@media (max-width: 992px)': {
            display: 'block'
          }
        }}
        aria-label="Toggle menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            '@media (max-width: 992px)': {
              display: 'block'
            }
          }}
        />
      )}

      <div style={{
        width: '260px',
        minHeight: '100vh',
        background: '#0B3D2E',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        transition: 'transform 0.3s ease',
        transform: window.innerWidth <= 992 && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
        '@media (max-width: 992px)': {
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          width: '280px'
        }
      }}>
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(201,168,76,0.15)'
        }}>
          <div style={{
            fontFamily: "'Amiri', serif",
            fontSize: '1.5rem',
            color: '#C9A84C',
            display: 'block',
            lineHeight: '1.2'
          }}>هَلَال هَبْ</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#FFFFFF',
            letterSpacing: '0.06em',
            display: 'block'
          }}>HalalHub</div>
          <div style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>Sharia-Compliant Platform</div>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 0'
        }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.28s ease',
                  position: 'relative',
                  borderLeft: `3px solid ${isActive ? '#C9A84C' : 'transparent'}`,
                  background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.65)'
                }}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth <= 992) setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
                    e.currentTarget.style.color = '#E8C96A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                  }
                }}
              >
                <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(201,168,76,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#0B3D2E',
              fontSize: '0.85rem',
              flexShrink: 0
            }}>
              {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'AU'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{user?.fullName || 'Ali User'}</div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.35)'
              }}>Verified Member ✓</div>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '1rem',
                padding: '4px',
                transition: 'all 0.28s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#C0392B'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              ⏻
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 992px) {
          .sidebar-desktop {
            transform: translateX(-100%);
          }
          .sidebar-mobile-open {
            transform: translateX(0);
          }
          .hamburger-btn {
            display: block !important;
          }
          .overlay {
            display: block !important;
          }
        }
        @media (min-width: 993px) {
          .hamburger-btn {
            display: none !important;
          }
          .overlay {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;