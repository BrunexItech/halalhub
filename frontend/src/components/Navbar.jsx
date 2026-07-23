import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRefs = useRef({});
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navbarRef = useRef(null);

  const getInitials = useCallback(() => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'GU';
  }, [user?.fullName]);

  const navItems = useMemo(() => [
    { 
      path: '/dashboard', 
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      label: 'Finance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      dropdown: [
        { path: '/p2p', label: 'P2P Amanah' },
        { path: '/takaful', label: 'Takaful' },
        { path: '/pension', label: 'Imam Pension' },
      ]
    },
    {
      label: 'Charity',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      dropdown: [
        { path: '/zakat', label: 'Zakat' },
        { path: '/sadaqa', label: 'Sadaqa' },
      ]
    },
    {
      label: 'Ecommerce',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      dropdown: [
        { path: '/ecommerce', label: 'HalalMarket' },
        { path: '/restaurants', label: 'Restaurants' },
      ]
    },
    { 
      path: '/halalstay', 
      label: 'HalalStay',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      label: 'Services',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      dropdown: [
        { path: '/hajj', label: 'Hajj & Umrah' },
        { path: '/hearse', label: 'Funeral Services' },
        { path: '/mosque-finder', label: 'Mosques' },
        { path: '/wills', label: 'Digital Wills' },
        { path: '/kadhis', label: 'Scholars' },
        { path: '/about', label: 'About' },
      ]
    },
    { 
      path: '/utilities', 
      label: 'Utilities',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ], []);

  const isActive = useCallback((path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  const hasActiveChild = useCallback((dropdown) => {
    return dropdown?.some(item => isActive(item.path));
  }, [isActive]);

  const closeAllMenus = useCallback(() => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, []);

  const handleNavigation = useCallback((path) => {
    if (!path) return;
    
    // Close all menus first
    closeAllMenus();
    
    // Use requestAnimationFrame for smooth UI update before navigation
    requestAnimationFrame(() => {
      navigate(path);
    });
  }, [navigate, closeAllMenus]);

  const toggleDropdown = useCallback((label) => {
    setOpenDropdown(prev => prev === label ? null : label);
    setIsUserMenuOpen(false);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
    setOpenDropdown(null);
  }, []);

  const handleLogout = useCallback(() => {
    closeAllMenus();
    // Small delay to ensure menu closes before logout
    setTimeout(() => {
      onLogout();
    }, 100);
  }, [onLogout, closeAllMenus]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is inside navbar
      if (navbarRef.current && navbarRef.current.contains(event.target)) {
        return;
      }

      // Close dropdowns
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setOpenDropdown(null);
        }
      }

      // Close user menu
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }

      // Close mobile menu
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        // Check if click is on the hamburger button
        const hamburgerButton = document.querySelector('[aria-label="Toggle menu"]');
        if (hamburgerButton && !hamburgerButton.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, isUserMenuOpen, isMobileMenuOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAllMenus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeAllMenus]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav 
        ref={navbarRef}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8EEF4] shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">

            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer flex-shrink-0 group mr-8 lg:mr-12"
              onClick={() => handleNavigation('/dashboard')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigation('/dashboard')}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center shadow-md shadow-[#1769AA]/20 group-hover:shadow-lg group-hover:shadow-[#1769AA]/30 transition-all duration-300">
                  <span className="text-white text-lg font-bold">H</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-[#1A2A3A] tracking-tight">HalalHub</span>
                <span className="block text-[10px] font-medium text-[#1769AA]/70 tracking-[0.15em] uppercase">Sharia-Compliant</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5 ml-4">
              {navItems.map((item, index) => (
                <div 
                  key={index} 
                  className="relative"
                  ref={(el) => {
                    if (item.dropdown) {
                      dropdownRefs.current[item.label] = el;
                    }
                  }}
                >
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        aria-expanded={openDropdown === item.label}
                        aria-haspopup="true"
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          openDropdown === item.label || hasActiveChild(item.dropdown)
                            ? 'bg-[#1769AA]/10 text-[#1769AA]' 
                            : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1769AA]'
                        }`}
                      >
                        <span className="opacity-60">{item.icon}</span>
                        <span>{item.label}</span>
                        <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === item.label && (
                        <div 
                          className="absolute top-full left-0 mt-1.5 min-w-[200px] bg-white rounded-2xl shadow-xl border border-[#E8EEF4] py-2 z-50 animate-slideDown"
                          role="menu"
                        >
                          <div className="absolute -top-1 left-6 w-3 h-3 bg-white border-t border-l border-[#E8EEF4] rotate-45" />
                          {item.dropdown.map((sub, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                // Close dropdown first, then navigate
                                setOpenDropdown(null);
                                handleNavigation(sub.path);
                              }}
                              className={`w-full text-left px-5 py-2.5 text-sm transition-all duration-150 ${
                                isActive(sub.path) 
                                  ? 'bg-[#1769AA]/5 text-[#1769AA] font-medium border-r-2 border-[#1769AA]' 
                                  : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                              }`}
                              role="menuitem"
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive(item.path) 
                          ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                          : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1769AA]'
                      }`}
                    >
                      <span className={`${isActive(item.path) ? 'text-white/80' : 'opacity-60'}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-[#F1F7FC] transition-all duration-200"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#1769AA]/20 group-hover:shadow-lg group-hover:shadow-[#1769AA]/30 transition-all duration-300">
                      {getInitials()}
                    </div>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-[#1A2A3A] leading-tight">
                      {user?.fullName || 'Guest'}
                    </div>
                  </div>
                  <svg className={`hidden lg:block w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div 
                    className="hidden lg:block absolute right-0 mt-2 min-w-[200px] bg-white rounded-2xl shadow-xl border border-[#E8EEF4] py-2 z-50 animate-slideDown"
                    role="menu"
                  >
                    <div className="absolute -top-1 right-6 w-3 h-3 bg-white border-t border-l border-[#E8EEF4] rotate-45" />
                    
                    <div className="px-4 py-3 border-b border-[#F1F7FC]">
                      <div className="text-sm font-semibold text-[#1A2A3A]">
                        {user?.fullName || 'Guest'}
                      </div>
                      <div className="text-xs text-[#94A3B8]">
                        {user?.email || ''}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleNavigation('/profile');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A] transition-all duration-150"
                      role="menuitem"
                    >
                      Profile Settings
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-150 border-t border-[#F1F7FC] mt-1 pt-2"
                      role="menuitem"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden relative w-10 h-10 rounded-xl hover:bg-[#F1F7FC] transition-colors flex items-center justify-center"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <div className="flex flex-col gap-1.5">
                  <span className={`block w-5 h-0.5 bg-[#1A2A3A] rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                  <span className={`block w-5 h-0.5 bg-[#1A2A3A] rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                  <span className={`block w-5 h-0.5 bg-[#1A2A3A] rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </div>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          ref={mobileMenuRef}
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="px-4 py-4 space-y-1 bg-white border-t border-[#E8EEF4] max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex items-center gap-3 px-3 py-4 mb-3 bg-[#F1F7FC] rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-sm">
                {getInitials()}
              </div>
              <div>
                <div className="font-semibold text-[#1A2A3A]">{user?.fullName || 'Guest'}</div>
              </div>
            </div>

            {navItems.map((item, index) => (
              <div key={index}>
                {item.dropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      aria-expanded={openDropdown === item.label}
                      className="flex items-center justify-between w-full px-3 py-3.5 rounded-xl text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#1769AA]/60">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openDropdown === item.label && (
                      <div className="ml-8 pl-3 border-l-2 border-[#1769AA]/20 space-y-0.5">
                        {item.dropdown.map((sub, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              // Close dropdown and mobile menu, then navigate
                              setOpenDropdown(null);
                              setIsMobileMenuOpen(false);
                              handleNavigation(sub.path);
                            }}
                            className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              isActive(sub.path) 
                                ? 'bg-[#1769AA]/5 text-[#1769AA] font-medium' 
                                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleNavigation(item.path);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3.5 rounded-xl transition-colors ${
                      isActive(item.path) 
                        ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                        : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                    }`}
                  >
                    <span className={`${isActive(item.path) ? 'text-white/80' : 'text-[#1769AA]/60'}`}>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-3 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-[#E8EEF4] pt-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>

            <div className="mt-4 pt-4 border-t border-[#E8EEF4] text-center">
              <p className="text-[10px] text-[#94A3B8] tracking-wider">Secure · Sharia-Compliant</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="h-16 lg:h-[72px]" />
    </>
  );
};

export default Navbar;