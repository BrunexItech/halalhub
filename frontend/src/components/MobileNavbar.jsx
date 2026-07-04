import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MobileNavbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

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
    { path: '/admin', icon: '🛡️', label: 'Admin Panel' }
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleNavigate = (path) => { 
    navigate(path); 
    setIsOpen(false); 
  };

  return (
    <>
      {/* Top Navbar - Logo on LEFT, Hamburger on RIGHT */}
      <nav className="mobile-navbar">
        {/* Logo - Left */}
        <div className="mobile-logo" onClick={() => navigate('/dashboard')}>
          <img src="/HalalHub_Logo.png" alt="HalalHub" className="mobile-logo-img" />
          <span className="logo-en-mobile">HalalHub</span>
        </div>
        
        {/* Right side - User badge + Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="mobile-user-badge" onClick={() => navigate('/profile')}>
            <span>{user?.fullName?.charAt(0) || 'U'}</span>
          </div>
          <button className="hamburger-btn" onClick={toggleMenu} aria-label="Menu">
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Dropdown Menu */}
      <div className={`mobile-dropdown ${isOpen ? 'open' : ''}`}>
        <div className="mobile-dropdown-header">
          <div className="mobile-dropdown-user">
            <div className="mobile-avatar">
              {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'AU'}
            </div>
            <div className="mobile-user-info">
              <div className="mobile-user-name">{user?.fullName || 'User'}</div>
              <div className="mobile-user-role">Verified Member ✓</div>
            </div>
          </div>
        </div>

        <div className="mobile-nav-list">
          {navItems.map((item) => (
            <div
              key={item.path}
              className="mobile-nav-item"
              onClick={() => handleNavigate(item.path)}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mobile-dropdown-footer">
          <button className="mobile-logout-btn" onClick={onLogout}>
            ⏻ Logout
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="mobile-overlay" onClick={toggleMenu}></div>}
    </>
  );
};

export default MobileNavbar;