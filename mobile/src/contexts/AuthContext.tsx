import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus, InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  nationalId?: string;
  vendorStatus?: string;
  leaderStatus?: string;
  subRole?: string;
  vendorType?: string;
  leaderType?: string;
  profileImage?: string;
  bio?: string;
  walletBalance?: number;
  kycStatus?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  getToken: () => Promise<string | null>;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Last interaction timestamp (ref — no re-renders)
  const lastInteractionRef = useRef(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 seconds

  // AppState for background/foreground detection
  const appState = useRef(AppState.currentState);
  const backgroundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset inactivity timer (called on user interaction)
  const resetInactivityTimer = () => {
    lastInteractionRef.current = Date.now();
  };

  // Clear background timer
  const clearBackgroundTimer = () => {
    if (backgroundTimerRef.current) {
      clearTimeout(backgroundTimerRef.current);
      backgroundTimerRef.current = null;
    }
  };

  // Start timer when app goes to background
  const startBackgroundTimer = () => {
    if (!user) return;
    clearBackgroundTimer();
    backgroundTimerRef.current = setTimeout(() => {
      console.log('Background timeout: logging out user');
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      startBackgroundTimer();
    } else if (appState.current?.match(/inactive|background/) && nextAppState === 'active') {
      clearBackgroundTimer();
    }
    appState.current = nextAppState;
  };

  // Check inactivity timer every second
  const checkInactivity = () => {
    if (!user) return;
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionRef.current;
    if (timeSinceLastInteraction >= INACTIVITY_TIMEOUT_MS) {
      console.log('Inactivity timeout: logging out user');
      logout();
    }
  };

  // Load stored auth on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      clearBackgroundTimer();
    };
  }, [user]);

  // Inactivity checker interval
  useEffect(() => {
    if (user) {
      lastInteractionRef.current = Date.now();
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      timerIntervalRef.current = setInterval(checkInactivity, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [user]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      clearBackgroundTimer();
    };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('itqaan_token');
      const userData = await AsyncStorage.getItem('itqaan_user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        lastInteractionRef.current = Date.now();
      }
    } catch (error) {
      console.log('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: User, token: string) => {
    try {
      await AsyncStorage.setItem('itqaan_token', token);
      await AsyncStorage.setItem('itqaan_user', JSON.stringify(userData));
      
      if (userData.role) {
        await AsyncStorage.setItem('itqaan_role', userData.role);
      }
      if (userData.subRole) {
        await AsyncStorage.setItem('itqaan_subrole', userData.subRole);
      }
      if (userData.vendorType) {
        await AsyncStorage.setItem('itqaan_vendor_type', userData.vendorType);
      }
      if (userData.leaderType) {
        await AsyncStorage.setItem('itqaan_leader_type', userData.leaderType);
      }
      
      setUser(userData);
      lastInteractionRef.current = Date.now();
    } catch (error) {
      console.log('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    clearBackgroundTimer();
    try {
      await AsyncStorage.multiRemove([
        'itqaan_token',
        'itqaan_user',
        'itqaan_role',
        'itqaan_subrole',
        'itqaan_vendor_type',
        'itqaan_leader_type',
      ]);
      setUser(null);
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem('itqaan_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const getToken = async () => {
    return await AsyncStorage.getItem('itqaan_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        updateUser,
        getToken,
        resetInactivityTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};