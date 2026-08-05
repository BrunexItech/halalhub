import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userMenuRef = useRef(null);
  const mobileUserMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const sidebarRef = useRef(null);

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

  const getLeaderTypeLabel = (type) => {
    const labels = {
      'islamic_scholar': 'Islamic Scholar',
      'imam': 'Imam',
      'adhan_caller': 'Adhan Caller',
      'ustadh': 'Ustadh',
      'ustadha': 'Ustadha',
      'kadhi': 'Kadhi'
    };
    return labels[type] || type;
  };

  const getPensionPath = () => {
    if (user?.role === 'leader' || user?.role === 'imam') {
      return '/leader-pension';
    }
    return '/pension';
  };

  const navItems = useMemo(() => {
    const role = user?.role || 'client';
    const leaderType = user?.leaderType || null;
    
    const dashboardItem = { 
      path: '/dashboard', 
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      isCategory: false
    };

    // Islamic Finance - always visible
    const islamicFinanceChildren = [
      { path: '/zakat', label: 'Zakat' },
      { path: '/sadaqa', label: 'Sadaqa' },
      { path: '/takaful', label: 'Takaful' },
      { path: getPensionPath(), label: 'Itqaan Pension' },
    ];

    // For leaders, add Consultations to Islamic Finance
    if (role === 'leader' || role === 'imam') {
      islamicFinanceChildren.push({ path: '/consultations', label: 'Consultations' });
    }

    const islamicFinanceItems = {
      label: 'Islamic Finance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      isCategory: true,
      children: islamicFinanceChildren
    };

    const ecommerceItems = {
      label: 'Ecommerce',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      isCategory: true,
      children: [
        { path: '/market', label: 'HalalMarket' },
        { path: '/butchery', label: 'Halal Butchery' },
        { path: '/restaurants', label: 'Halal Restaurants' },
      ]
    };

    const halalStayItem = { 
      path: '/halalstay', 
      label: 'HalalStay',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      isCategory: false
    };

    const utilitiesItem = { 
      path: '/utilities', 
      label: 'Utilities',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      isCategory: false
    };

    const servicesItems = {
      label: 'Services',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      isCategory: true,
      children: [
        { path: '/hajj', label: 'Hajj & Umrah' },
        { path: '/hearse', label: 'Free Hearse & Shroud' },
        { path: '/mosque-finder', label: 'Find a Mosque' },
        { path: '/wills', label: 'Digital Wills' },
        { path: '/about', label: 'About' },
      ]
    };

    // Dial a Scholar - only for clients and vendors (not leaders)
    if (role !== 'leader' && role !== 'imam') {
      servicesItems.children.splice(4, 0, { path: '/kadhis', label: 'Dial a Scholar' });
    }

    let items = [dashboardItem];

    if (role === 'client') {
      items.push(islamicFinanceItems);
      items.push(ecommerceItems);
      items.push(halalStayItem);
      items.push(utilitiesItem);
      items.push(servicesItems);
    } else if (role === 'vendor') {
      items.push(islamicFinanceItems);
      items.push(ecommerceItems);
      items.push(halalStayItem);
      items.push(utilitiesItem);
      items.push(servicesItems);
    } else if (role === 'leader' || role === 'imam') {
      items.push(islamicFinanceItems);
      items.push(utilitiesItem);
      items.push(servicesItems);
    }

    return items;
  }, [user?.role]);

  const isActive = useCallback((path) => {
    if (!path) return false;
    return location.pathname === path;
  }, [location.pathname]);

  const closeAllMenus = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsMobileUserMenuOpen(false);
  }, []);

  const handleNavigation = useCallback((path) => {
    if (!path) return;
    closeAllMenus();
    requestAnimationFrame(() => {
      navigate(path);
    });
  }, [navigate, closeAllMenus]);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
    setIsMobileUserMenuOpen(false);
  }, []);

  const toggleMobileUserMenu = useCallback(() => {
    setIsMobileUserMenuOpen(prev => !prev);
    setIsUserMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    closeAllMenus();
    setTimeout(() => {
      onLogout();
    }, 100);
  }, [onLogout, closeAllMenus]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && sidebarRef.current.contains(event.target)) {
        return;
      }

      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }

      if (isMobileUserMenuOpen && mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target)) {
        setIsMobileUserMenuOpen(false);
      }

      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        const hamburgerButton = document.querySelector('[aria-label="Open menu"]');
        if (hamburgerButton && !hamburgerButton.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isMobileUserMenuOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAllMenus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeAllMenus]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderNavItem = (item, index, isMobile = false) => {
    if (item.isCategory) {
      return (
        <div key={index} className="mb-1">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[#C9A44B] ${isCollapsed && !isMobile ? 'justify-center px-2' : ''}`}>
            <span className="flex-shrink-0 text-[#C9A44B]">
              {item.icon}
            </span>
            {(!isCollapsed || isMobile) && (
              <span className="flex-1 text-left text-sm">{item.label}</span>
            )}
          </div>
          
          <div className={`${isCollapsed && !isMobile ? '' : 'ml-2 pl-2 border-l-2 border-[rgba(201,164,75,0.18)]'}`}>
            {item.children.map((child, childIndex) => (
              <button
                key={childIndex}
                onClick={() => {
                  if (isMobile) setIsMobileMenuOpen(false);
                  handleNavigation(child.path);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(child.path) 
                    ? 'text-[#C9A44B] bg-[#183B33]' 
                    : 'text-[#B7C0BA] hover:text-[#F7F6F1] hover:bg-[#12342D]'
                } ${isCollapsed && !isMobile ? 'justify-center px-2' : ''}`}
                title={isCollapsed && !isMobile ? child.label : ''}
              >
                {(!isCollapsed || isMobile) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7C0BA]/30 flex-shrink-0" />
                )}
                {(!isCollapsed || isMobile) && (
                  <span className="flex-1 text-left text-sm font-medium">{child.label}</span>
                )}
                {isActive(child.path) && !isCollapsed && !isMobile && (
                  <span className="w-1 h-6 rounded-full bg-[#C9A44B]" />
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <button
        key={index}
        onClick={() => {
          if (isMobile) setIsMobileMenuOpen(false);
          handleNavigation(item.path);
        }}
        className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-bold ${
          isActive(item.path) 
            ? 'text-[#C9A44B] bg-[#183B33] shadow-lg shadow-black/10' 
            : 'text-[#B7C0BA] hover:text-[#F7F6F1] hover:bg-[#12342D]'
        } ${isCollapsed && !isMobile ? 'justify-center px-2' : ''}`}
        title={isCollapsed && !isMobile ? item.label : ''}
      >
        <span className={`flex-shrink-0 ${isActive(item.path) ? 'text-[#C9A44B]' : 'text-[#B7C0BA] group-hover:text-[#F7F6F1]'}`}>
          {item.icon}
        </span>
        {(!isCollapsed || isMobile) && (
          <span className="flex-1 text-left text-sm">{item.label}</span>
        )}
        {isActive(item.path) && !isCollapsed && !isMobile && (
          <span className="w-1 h-6 rounded-full bg-[#C9A44B]" />
        )}
      </button>
    );
  };

  return (
    <>
      <aside 
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-screen bg-[#032A24] transition-all duration-300 ease-in-out flex flex-col border-r border-[rgba(201,164,75,0.18)] shadow-2xl shadow-black/30 ${
          isCollapsed ? 'w-16' : 'w-60'
        } hidden lg:flex`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-5 border-b border-[rgba(201,164,75,0.18)]`}>
          <div 
            className={`flex items-center cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
            onClick={() => handleNavigation('/dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigation('/dashboard')}
          >
            <div className="relative flex-shrink-0">
              <img 
                src="/itqaan_logo.png" 
                alt="Itqaan" 
                className="h-8 w-auto object-contain"
              />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3FAF73] border-2 border-[#032A24] animate-pulse" />
            </div>
          </div>
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[#12342D] transition-colors text-[#B7C0BA] hover:text-[#F7F6F1]"
              aria-label="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2.5 scrollbar-thin scrollbar-thumb-[rgba(201,164,75,0.3)] scrollbar-track-transparent">
          <div className="space-y-0.5">
            {navItems.map((item, index) => renderNavItem(item, index, false))}
          </div>
        </nav>

        <div className={`border-t border-[rgba(201,164,75,0.18)] p-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={toggleUserMenu}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              className={`group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#12342D] transition-all duration-200 ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? user?.fullName || 'Guest' : ''}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C9A44B] to-[#E1C16B] flex items-center justify-center text-[#032A24] font-bold text-xs shadow-lg shadow-[#C9A44B]/20">
                  {getInitials()}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#3FAF73] border-2 border-[#032A24]" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-[#F7F6F1] truncate">
                    {user?.fullName || 'Guest'}
                  </div>
                  <div className="text-xs text-[#B7C0BA] truncate">
                    {user?.role === 'leader' && user?.leaderType 
                      ? getLeaderTypeLabel(user.leaderType)
                      : user?.email || ''}
                  </div>
                </div>
              )}
              {!isCollapsed && (
                <svg className={`w-3.5 h-3.5 text-[#B7C0BA] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {isUserMenuOpen && !isCollapsed && (
              <div 
                className="absolute bottom-full left-0 mb-2 min-w-[180px] bg-[#0B342B] rounded-xl border border-[rgba(201,164,75,0.18)] py-1.5 z-50 animate-slideDown shadow-xl"
                role="menu"
              >
                <div className="absolute -bottom-1 left-6 w-3 h-3 bg-[#0B342B] border-b border-r border-[rgba(201,164,75,0.18)] rotate-45" />
                
                <div className="px-4 py-2.5 border-b border-[rgba(201,164,75,0.18)]">
                  <div className="text-sm font-semibold text-[#F7F6F1]">
                    {user?.fullName || 'Guest'}
                  </div>
                  <div className="text-xs text-[#B7C0BA]">
                    {user?.role === 'leader' && user?.leaderType 
                      ? getLeaderTypeLabel(user.leaderType)
                      : user?.email || ''}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleNavigation('/profile');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#B7C0BA] hover:text-[#F7F6F1] hover:bg-[#12342D] transition-all duration-150"
                  role="menuitem"
                >
                  Profile Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#12342D] transition-all duration-150 border-t border-[rgba(201,164,75,0.18)] mt-1 pt-2"
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {isCollapsed && (
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex fixed top-6 left-[4.5rem] z-50 w-7 h-7 rounded-full bg-[#C9A44B] hover:bg-[#E1C16B] items-center justify-center shadow-lg shadow-[#C9A44B]/30 transition-all duration-300 hover:scale-105"
          aria-label="Expand sidebar"
        >
          <svg className="w-3.5 h-3.5 text-[#032A24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div 
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-[#032A24] transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl shadow-black/50`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-5 border-b border-[rgba(201,164,75,0.18)]">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleNavigation('/dashboard');
              }}
            >
              <div className="relative flex-shrink-0">
                <img 
                  src="/itqaan_logo.png" 
                  alt="Itqaan" 
                  className="h-8 w-auto object-contain"
                />
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[#12342D] transition-colors text-[#B7C0BA]"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 min-h-0">
            <div className="space-y-0.5">
              {navItems.map((item, index) => renderNavItem(item, index, true))}
            </div>
          </nav>

          <div className="flex-shrink-0 border-t border-[rgba(201,164,75,0.18)] p-3">
            <div className="relative" ref={mobileUserMenuRef}>
              <button
                onClick={toggleMobileUserMenu}
                aria-expanded={isMobileUserMenuOpen}
                aria-haspopup="true"
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg bg-[#0B342B] hover:bg-[#12342D] transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A44B] to-[#E1C16B] flex items-center justify-center text-[#032A24] font-bold text-sm">
                    {getInitials()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#3FAF73] border-2 border-[#032A24]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-[#F7F6F1]">
                    {user?.fullName || 'Guest'}
                  </div>
                  <div className="text-xs text-[#B7C0BA] truncate">
                    {user?.role === 'leader' && user?.leaderType 
                      ? getLeaderTypeLabel(user.leaderType)
                      : user?.email || ''}
                  </div>
                </div>
                <svg className={`w-4 h-4 text-[#B7C0BA] transition-transform duration-200 ${isMobileUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isMobileUserMenuOpen && (
                <div 
                  className="absolute bottom-full left-0 right-0 mb-2 bg-[#0B342B] rounded-xl border border-[rgba(201,164,75,0.18)] py-1.5 z-50 animate-slideDown shadow-xl"
                  role="menu"
                >
                  <div className="px-4 py-2.5 border-b border-[rgba(201,164,75,0.18)]">
                    <div className="text-sm font-semibold text-[#F7F6F1]">
                      {user?.fullName || 'Guest'}
                    </div>
                    <div className="text-xs text-[#B7C0BA]">
                      {user?.role === 'leader' && user?.leaderType 
                        ? getLeaderTypeLabel(user.leaderType)
                        : user?.email || ''}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileUserMenuOpen(false);
                      setIsMobileMenuOpen(false);
                      handleNavigation('/profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#B7C0BA] hover:text-[#F7F6F1] hover:bg-[#12342D] transition-all duration-150"
                    role="menuitem"
                  >
                    Profile Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[#12342D] transition-all duration-150 border-t border-[rgba(201,164,75,0.18)] mt-1 pt-2"
                    role="menuitem"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'pl-16' : 'pl-60'}`} />

      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#032A24]/95 backdrop-blur-md border-b border-[rgba(201,164,75,0.18)] rounded-b-2xl shadow-lg shadow-black/30">
        <div className="flex items-center justify-between px-4 h-14">
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => handleNavigation('/dashboard')}
          >
            <div className="relative flex-shrink-0">
              <img 
                src="/itqaan_logo.png" 
                alt="Itqaan" 
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-9 h-9 rounded-xl hover:bg-[#12342D] transition-colors flex items-center justify-center text-[#F7F6F1]"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <div className="lg:hidden h-14" />

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(201, 164, 75, 0.3);
          border-radius: 9999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(201, 164, 75, 0.5);
        }
      `}</style>
    </>
  );
};

export default Navbar;