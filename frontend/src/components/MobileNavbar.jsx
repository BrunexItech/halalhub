import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MobileNavbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'AU';
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      <nav className="mobile-navbar-premium">
        {/* Left: Logo */}
        <div className="mobile-nav-left" onClick={() => navigate('/dashboard')}>
          <div className="mobile-logo-wrapper">
            <img src="/HalalHub_Logo.png" alt="HalalHub" className="mobile-logo-img" />
          </div>
          <div className="mobile-brand-text">
            <span className="mobile-brand-name">HalalHub</span>
            <span className="mobile-brand-tagline">Sharia-Compliant</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="mobile-nav-right">
          <button 
            className={`mobile-hamburger ${isDropdownOpen ? 'active' : ''}`}
            onClick={toggleDropdown}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <div className="mobile-user-badge" onClick={() => navigate('/profile')}>
            {getInitials()}
            <span className="user-status-dot" />
          </div>
        </div>
      </nav>

      {/* Dropdown Menu */}
      <div className={`mobile-dropdown-premium ${isDropdownOpen ? 'open' : ''}`}>
        <div className="dropdown-header">
          <div className="dropdown-user">
            <div className="dropdown-avatar">{getInitials()}</div>
            <div className="dropdown-user-info">
              <div className="dropdown-user-name">{user?.fullName || 'Guest'}</div>
              <div className="dropdown-user-role">Verified Member ✓</div>
            </div>
          </div>
        </div>

        <div className="dropdown-nav-items">
          <button className="dropdown-nav-item" onClick={() => { navigate('/dashboard'); setIsDropdownOpen(false); }}>
            <span className="dropdown-nav-icon">📊</span>
            <span className="dropdown-nav-label">Dashboard</span>
          </button>
          <button className="dropdown-nav-item" onClick={() => { navigate('/wallet'); setIsDropdownOpen(false); }}>
            <span className="dropdown-nav-icon">💳</span>
            <span className="dropdown-nav-label">Wallet</span>
          </button>
          <button className="dropdown-nav-item" onClick={() => { navigate('/zakat'); setIsDropdownOpen(false); }}>
            <span className="dropdown-nav-icon">⚖️</span>
            <span className="dropdown-nav-label">Zakat</span>
          </button>
          <button className="dropdown-nav-item" onClick={() => { navigate('/sadaqa'); setIsDropdownOpen(false); }}>
            <span className="dropdown-nav-icon">🤲</span>
            <span className="dropdown-nav-label">Sadaqa</span>
          </button>
          <button className="dropdown-nav-item" onClick={() => { navigate('/ecommerce'); setIsDropdownOpen(false); }}>
            <span className="dropdown-nav-icon">🛒</span>
            <span className="dropdown-nav-label">Halal Market</span>
          </button>
          <button className="dropdown-nav-item" onClick={() => { navigate('/halalstay'); setIsDropdownOpen(false); }}>
            <span className="dropdown-nav-icon">🏨</span>
            <span className="dropdown-nav-label">HalalStay</span>
          </button>
        </div>

        <div className="dropdown-footer">
          <button className="dropdown-logout-btn" onClick={onLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isDropdownOpen && (
        <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
      )}

      <style>{`
        /* ======================================== */
        /* ===== PREMIUM MOBILE NAVBAR ===== */
        /* ======================================== */

        .mobile-navbar-premium {
          display: none;
          background: linear-gradient(135deg, #0B3D2E 0%, #145A40 50%, #1A7A55 100%);
          padding: 12px 18px;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          min-height: 68px;
          width: 100%;
          flex-shrink: 0;
          box-shadow: 0 4px 24px rgba(11, 61, 46, 0.25);
          border-bottom: 1px solid rgba(201, 168, 76, 0.12);
        }

        /* ===== LEFT: LOGO ===== */
        .mobile-nav-left {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          flex: 1;
        }

        .mobile-logo-wrapper {
          position: relative;
        }

        .mobile-logo-img {
          height: 50px;
          width: auto;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
          transition: transform 0.3s ease;
        }

        .mobile-logo-img:hover {
          transform: scale(1.05);
        }

        .mobile-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .mobile-brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          color: #FFFFFF;
          font-size: 1.2rem;
          letter-spacing: 0.06em;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .mobile-brand-tagline {
          font-family: 'Outfit', sans-serif;
          font-size: 0.5rem;
          font-weight: 400;
          color: rgba(201, 168, 76, 0.7);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ===== RIGHT: ACTIONS ===== */
        .mobile-nav-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        /* ===== HAMBURGER ===== */
        .mobile-hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          transition: all 0.3s ease;
        }

        .hamburger-line {
          display: block;
          width: 26px;
          height: 2.5px;
          background: #FFFFFF;
          border-radius: 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }

        .mobile-hamburger.active .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
          background: #C9A84C;
        }

        .mobile-hamburger.active .hamburger-line:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }

        .mobile-hamburger.active .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
          background: #C9A84C;
        }

        /* ===== USER BADGE ===== */
        .mobile-user-badge {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #C9A84C, #E8C96A);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #0B3D2E;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 2px 12px rgba(201, 168, 76, 0.25);
          flex-shrink: 0;
        }

        .mobile-user-badge:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 20px rgba(201, 168, 76, 0.4);
        }

        .user-status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #27AE60;
          border: 2px solid #0B3D2E;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* ======================================== */
        /* ===== DROPDOWN MENU ===== */
        /* ======================================== */

        .mobile-dropdown-premium {
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          background: rgba(11, 61, 46, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 999;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(201, 168, 76, 0.08);
        }

        .mobile-dropdown-premium.open {
          max-height: 80vh;
          overflow-y: auto;
        }

        .dropdown-header {
          padding: 18px 20px;
          border-bottom: 1px solid rgba(201, 168, 76, 0.06);
        }

        .dropdown-user {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dropdown-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #C9A84C, #E8C96A);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          color: #0B3D2E;
          flex-shrink: 0;
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 2px 12px rgba(201, 168, 76, 0.2);
        }

        .dropdown-user-info {
          flex: 1;
        }

        .dropdown-user-name {
          font-size: 1rem;
          font-weight: 600;
          color: #FFFFFF;
        }

        .dropdown-user-role {
          font-size: 0.7rem;
          color: rgba(201, 168, 76, 0.6);
        }

        .dropdown-nav-items {
          padding: 8px 12px;
        }

        .dropdown-nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          text-align: left;
        }

        .dropdown-nav-item:hover {
          background: rgba(201, 168, 76, 0.08);
          color: #FFFFFF;
          transform: translateX(4px);
        }

        .dropdown-nav-item:active {
          transform: scale(0.98);
        }

        .dropdown-nav-icon {
          font-size: 1.2rem;
          width: 28px;
          text-align: center;
          flex-shrink: 0;
        }

        .dropdown-nav-label {
          font-weight: 500;
        }

        .dropdown-footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(201, 168, 76, 0.06);
        }

        .dropdown-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: rgba(192, 57, 43, 0.12);
          color: #E74C3C;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .dropdown-logout-btn:hover {
          background: rgba(192, 57, 43, 0.2);
          transform: scale(1.02);
        }

        /* ===== OVERLAY ===== */
        .dropdown-overlay {
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 998;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ======================================== */
        /* ===== RESPONSIVE ===== */
        /* ======================================== */

        @media (max-width: 992px) {
          .mobile-navbar-premium {
            display: flex !important;
          }
        }

        @media (max-width: 480px) {
          .mobile-navbar-premium {
            padding: 10px 14px;
            min-height: 60px;
          }

          .mobile-logo-img {
            height: 34px;
          }

          .mobile-brand-name {
            font-size: 1rem;
          }

          .mobile-brand-tagline {
            font-size: 0.45rem;
          }

          .mobile-user-badge {
            width: 34px;
            height: 34px;
            font-size: 0.75rem;
          }

          .mobile-hamburger {
            gap: 4px;
          }

          .hamburger-line {
            width: 22px;
            height: 2px;
          }

          .mobile-hamburger.active .hamburger-line:nth-child(1) {
            transform: rotate(45deg) translate(4px, 4px);
          }

          .mobile-hamburger.active .hamburger-line:nth-child(3) {
            transform: rotate(-45deg) translate(5px, -5px);
          }

          .dropdown-avatar {
            width: 40px;
            height: 40px;
            font-size: 0.85rem;
          }

          .dropdown-user-name {
            font-size: 0.9rem;
          }

          .dropdown-nav-item {
            padding: 10px 14px;
            font-size: 0.85rem;
          }

          .dropdown-nav-icon {
            font-size: 1rem;
            width: 24px;
          }

          .dropdown-logout-btn {
            padding: 10px;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 380px) {
          .mobile-navbar-premium {
            padding: 8px 10px;
            min-height: 52px;
          }

          .mobile-logo-img {
            height: 28px;
          }

          .mobile-brand-name {
            font-size: 0.85rem;
          }

          .mobile-brand-tagline {
            font-size: 0.4rem;
          }

          .mobile-user-badge {
            width: 30px;
            height: 30px;
            font-size: 0.65rem;
          }

          .hamburger-line {
            width: 18px;
            height: 2px;
          }

          .mobile-hamburger {
            gap: 3px;
          }

          .dropdown-avatar {
            width: 34px;
            height: 34px;
            font-size: 0.7rem;
          }

          .dropdown-user-name {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  );
};

export default MobileNavbar;