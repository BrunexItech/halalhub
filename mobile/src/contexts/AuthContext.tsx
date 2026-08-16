import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../api/client';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Inactivity timer
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 seconds

  // Clear inactivity timer
  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (!user) return; // Only start timer if user is logged in
    
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      console.log('Inactivity timeout: logging out user');
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  };

  // Load stored auth on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearInactivityTimer();
    };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('itqaan_token');
      const userData = await AsyncStorage.getItem('itqaan_user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        // Start inactivity timer after login
        setTimeout(resetInactivityTimer, 1000);
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
      // Start inactivity timer on login
      resetInactivityTimer();
    } catch (error) {
      console.log('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    clearInactivityTimer();
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
      }}
    >
      {/* Wrap children with touch detection to reset inactivity timer */}
      <View 
        style={{ flex: 1 }} 
        onTouchStart={resetInactivityTimer}
        onStartShouldSetResponder={() => true}
      >
        {children}
      </View>
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