import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  verifyOtp: (email: string, otp: string) => Promise<AuthResponse>;
  verifyTwoFactor: (tempToken: string, code: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
  forgotPassword: (email: string) => Promise<any>;
  verifyResetOtp: (email: string, otp: string) => Promise<any>;
  resetPassword: (email: string, otp: string, password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('educonnect_token');
      const userData = await AsyncStorage.getItem('educonnect_user');

      if (token && userData) {
        // Verify token with backend
        try {
          const currentUser = await apiService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token validation failed, clear everything
            console.log('Token validation failed, clearing auth state');
            await AsyncStorage.removeItem('educonnect_token');
            await AsyncStorage.removeItem('educonnect_user');
            setUser(null);
          }
        } catch (error: any) {
          // If error contains "Token is not valid" or 401, clear the invalid token
          const errorMsg = error?.message || String(error);
          if (errorMsg.includes('Token is not valid') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
            console.log('Invalid token detected, clearing auth state');
            await AsyncStorage.removeItem('educonnect_token');
            await AsyncStorage.removeItem('educonnect_user');
            setUser(null);
          } else {
            // Network error - keep cached user for offline access
            console.log('Network error during auth check, using cached data');
            setUser(JSON.parse(userData));
          }
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Auth state check failed:', error);
      // Clear any corrupted data
      await AsyncStorage.removeItem('educonnect_token');
      await AsyncStorage.removeItem('educonnect_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    // Do NOT toggle global isLoading here to avoid replacing navigation tree during transitions
    try {
      const response = await apiService.login(email, password);

      if (response.success && response.user && response.token) {
        setUser(response.user);
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Login error');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      } as AuthResponse;
    }
  };

  const register = async (userData: any): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await apiService.register(userData);
      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Registration error');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyOtp(email, otp);

      if (response.success && response.user && response.token) {
        setUser(response.user);
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('OTP verification error');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'OTP verification failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (tempToken: string, code: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyLogin2FA(tempToken, code);

      if (response.success && response.user && response.token) {
        setUser(response.user);
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('2FA verification error');
      return {
        success: false,
        message: error instanceof Error ? error.message : '2FA verification failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Logout error');
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    AsyncStorage.setItem('educonnect_user', JSON.stringify(userData));
  };

  const forgotPassword = async (email: string) => {
    try {
      return await apiService.forgotPassword(email);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Forgot password error');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Request failed',
      };
    }
  };

  const verifyResetOtp = async (email: string, otp: string) => {
    try {
      return await apiService.verifyResetOtp(email, otp);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Verify reset OTP error');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  };

  const resetPassword = async (email: string, otp: string, password: string) => {
    try {
      return await apiService.resetPassword(email, otp, password);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Reset password error');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Reset failed',
      };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    verifyOtp,
    verifyTwoFactor,
    logout,
    updateUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
