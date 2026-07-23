import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Client navigation items
  const clientNavItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/wallet', icon: '💳', label: 'Wallet' },
    { path: '/zakat', icon: '⚖️', label: 'Zakat' },
    { path: '/sadaqa', icon: '🤲', label: 'Sadaqa' },
    { path: '/p2p', icon: '🤝', label: 'P2P Amanah' },
    { path: '/takaful', icon: '🛡️', label: 'Takaful' },
    { path: '/pension', icon: '🏛️', label: 'Imam Pension' },
    { path: '/utilities', icon: '⚡', label: 'Utilities' },
    { path: '/halalstay', icon: '🏨', label: 'HalalStay' },
    { path: '/hajj', icon: '🕋', label: 'Hajj & Umrah' },
    { path: '/hearse', icon: '🚑', label: 'Hearse & Shroud' },
    { path: '/ecommerce', icon: '🛒', label: 'Halal Market' },
    { path: '/restaurants', icon: '🍽️', label: 'HalaRestaurants' },
    { path: '/mosque', icon: '🕌', label: 'Mosque Finder' },
    { path: '/wills', icon: '📜', label: 'Digital Wills' },
    { path: '/kadhis', icon: '📖', label: 'Kadhis & Scholars' },
    { path: '/about', icon: 'ℹ️', label: 'About' },
  ];

  // Vendor navigation items
  const vendorNavItems = [
    { path: '/dashboard', icon: '🏪', label: 'Dashboard' },
    { path: '/ecommerce', icon: '🛒', label: 'My Products' },
    { path: '/wallet', icon: '💳', label: 'Wallet' },
    { path: '/kyc-status', icon: '📋', label: 'KYC Status' },
    { path: '/about', icon: 'ℹ️', label: 'About' },
  ];

  const isVendor = user?.role === 'vendor';
  const navItems = isVendor ? vendorNavItems : clientNavItems;

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 993) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  const getUserRole = () => {
    if (isVendor) return 'Vendor';
    return 'Verified';
  };

  return (
    <>
      <button
        className="sidebar-hamburger"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <span className={`hamburger-icon ${isMobileOpen ? 'open' : ''}`}>
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </span>
      </button>

      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`sidebar ${isMobileOpen ? 'sidebar-open' : ''}`}>
        {/* ===== LOGO SECTION ===== */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrapper">
            <img 
              src="/Halalhub_logo.png" 
              alt="HalalHub" 
              className="sidebar-logo-img"
            />
          </div>
        </div>

        {/* ===== NAVIGATION ===== */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive && <span className="nav-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* ===== USER PROFILE ===== */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar-wrapper">
              <div className="user-avatar">{getInitials()}</div>
              <span className="user-status-dot" />
            </div>
            <div className="user-info">
              <div className="user-name">{user?.fullName || 'Guest'}</div>
              <div className="user-role">{getUserRole()}</div>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        /* ===== SIDEBAR - CLEAN PREMIUM ===== */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          box-shadow: none;
          border-right: none;
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        /* ===== LOGO SECTION ===== */
        .sidebar-brand {
          padding: 28px 20px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #FFFFFF;
          border-bottom: 1px solid rgba(0, 0, 0, 0.02);
        }

        .sidebar-logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .sidebar-logo-img {
          height: 200px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .sidebar-logo-img:hover {
          transform: scale(1.02);
        }

        /* ===== NAVIGATION ===== */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px;
          scroll-behavior: smooth;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 3px;
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(201, 168, 76, 0.2);
          border-radius: 4px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: #5A4A3A;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          position: relative;
          text-align: left;
          margin-bottom: 2px;
        }

        .sidebar-nav-item:hover {
          background: rgba(212, 175, 55, 0.06);
          color: #0D4A3E;
          transform: translateX(4px);
        }

        .sidebar-nav-item.active {
          background: rgba(212, 175, 55, 0.10);
          color: #0D4A3E;
          font-weight: 600;
        }

        .sidebar-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 60%;
          background: #D4AF37;
          border-radius: 0 4px 4px 0;
        }

        .nav-icon {
          font-size: 1.15rem;
          width: 26px;
          text-align: center;
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #D4AF37;
          flex-shrink: 0;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }

        /* ===== USER PROFILE ===== */
        .sidebar-footer {
          padding: 14px 16px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.02);
          flex-shrink: 0;
          background: #FFFFFF;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37, #E8C96A);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          color: #0D4A3E;
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 2px 12px rgba(212, 175, 55, 0.1);
        }

        .user-status-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #27AE60;
          border: 2px solid #FFFFFF;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1C1208;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.6rem;
          color: #6B5C3E;
          letter-spacing: 0.04em;
          font-weight: 500;
          text-transform: uppercase;
        }

        .logout-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6B5C3E;
          padding: 6px 8px;
          transition: all 0.3s ease;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.4;
        }

        .logout-btn:hover {
          opacity: 1;
          color: #C0392B;
          background: rgba(192, 57, 43, 0.04);
        }

        /* ===== HAMBURGER ===== */
        .sidebar-hamburger {
          display: none;
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 1001;
          background: #FFFFFF;
          border: none;
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .sidebar-hamburger:hover {
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.08);
        }

        .hamburger-icon {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 24px;
        }

        .hamburger-line {
          display: block;
          width: 100%;
          height: 2.5px;
          background: #0D4A3E;
          border-radius: 4px;
          transition: all 0.3s ease;
          transform-origin: center;
        }

        .hamburger-icon.open .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
          background: #D4AF37;
        }

        .hamburger-icon.open .hamburger-line:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }

        .hamburger-icon.open .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
          background: #D4AF37;
        }

        /* ===== OVERLAY ===== */
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.15);
          z-index: 999;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
            width: 300px;
          }

          .sidebar-open {
            transform: translateX(0);
          }

          .sidebar-hamburger {
            display: block;
          }

          .sidebar-overlay {
            display: block;
          }
        }

        @media (min-width: 993px) {
          .sidebar {
            transform: translateX(0) !important;
          }

          .sidebar-hamburger {
            display: none !important;
          }

          .sidebar-overlay {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .sidebar {
            width: 100%;
            max-width: 320px;
          }

          .sidebar-brand {
            padding: 20px 16px 16px;
          }

          .sidebar-logo-img {
            height: 70px;
          }

          .sidebar-nav {
            padding: 8px 10px;
          }

          .sidebar-nav-item {
            padding: 10px 12px;
            font-size: 0.82rem;
            gap: 12px;
          }

          .nav-icon {
            font-size: 1rem;
            width: 22px;
          }

          .sidebar-footer {
            padding: 10px 14px 16px;
          }

          .user-avatar {
            width: 38px;
            height: 38px;
            font-size: 0.8rem;
          }

          .sidebar-hamburger {
            top: 12px;
            left: 12px;
            padding: 8px 10px;
          }

          .hamburger-icon {
            width: 20px;
            gap: 4px;
          }

          .hamburger-line {
            height: 2px;
          }
        }

        @media (max-width: 380px) {
          .sidebar {
            max-width: 280px;
          }

          .sidebar-logo-img {
            height: 55px;
          }

          .sidebar-nav-item {
            padding: 8px 10px;
            font-size: 0.75rem;
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;