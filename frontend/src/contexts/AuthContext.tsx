import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import apiClient from '../utils/api';
import { io, Socket } from 'socket.io-client';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; twoFactorRequired?: boolean; tempToken?: string; method?: 'totp' | 'sms'; maskedPhone?: string; devCode?: string }>;
  verifyTwoFactor: (tempToken: string, code: string) => Promise<{ success: boolean; message?: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (userData: User) => void;
  isLoading: boolean;
  token: string | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  socket?: Socket | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Check for existing token and user
    const savedToken = localStorage.getItem('educonnect_token');
    const savedUser = localStorage.getItem('educonnect_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Verify token with backend
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Manage socket connection lifecycle
  useEffect(() => {
    if (user && !socketRef.current) {
      const socket = io('http://localhost:5000', { transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect', () => {
        // join personal room using user id
        socket.emit('join-room', (user as any)._id || (user as any).id);
      });
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const verifyToken = async (token: string) => {
    try {
      const data = await apiClient.getCurrentUser(token) as { user: User };
      setUser(data.user);
      localStorage.setItem('educonnect_user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; twoFactorRequired?: boolean; tempToken?: string; method?: 'totp' | 'sms' | 'email'; maskedPhone?: string; devCode?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with email:', email);
      
      const data = await apiClient.login(email, password) as any;

      // New email OTP flow (preferred)
      if (data?.otpRequired && data?.tempToken) {
        console.log('OTP required, temp token received');
        setPendingEmail(email);
        return { success: false, twoFactorRequired: true, tempToken: data.tempToken, method: 'email' };
      }

      // Backward compatibility: server might still send twoFactorRequired
      if (data?.twoFactorRequired && data?.tempToken) {
        console.log('Server responded with legacy twoFactorRequired');
        // If we force email OTP server-side, treat this as email OTP step
        setPendingEmail(email);
        return { success: false, twoFactorRequired: true, tempToken: data.tempToken, method: 'email', maskedPhone: data.maskedPhone, devCode: data.devCode };
      }

      console.log('Login successful:', data);
      
      setUser((data as { user: User }).user);
      setToken((data as { token: string }).token);
      localStorage.setItem('educonnect_user', JSON.stringify((data as { user: User }).user));
      localStorage.setItem('educonnect_token', (data as { token: string }).token);
      
      // connect socket after successful login
      if (!socketRef.current) {
        const socket = io('http://localhost:5000', { transports: ['websocket'] });
        socketRef.current = socket;
        socket.on('connect', () => {
          socket.emit('join-room', ((data as { user: any }).user)._id);
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Network error. Please check your connection and try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (tempToken: string, code: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      // Prefer email OTP verification if we have a pending email
      let data: { user: User; token: string };
      if (pendingEmail) {
        const res = await apiClient.verifyOtp(pendingEmail, code) as any;
        data = { user: res.user, token: res.token };
        setPendingEmail(null);
      } else {
        data = await apiClient.verifyLogin2FA(tempToken, code) as { user: User; token: string };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('educonnect_user', JSON.stringify(data.user));
      localStorage.setItem('educonnect_token', data.token);

      return { success: true };
    } catch (error) {
      let errorMessage = 'Invalid or expired code';
      if (error instanceof Error) errorMessage = error.message;
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailOtp = async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const res = await apiClient.verifyOtp(email, otp) as any;
      const data = { user: res.user as User, token: res.token as string };
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('educonnect_user', JSON.stringify(data.user));
      localStorage.setItem('educonnect_token', data.token);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Invalid or expired code';
      if (error instanceof Error) errorMessage = error.message;
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('educonnect_user');
    localStorage.removeItem('educonnect_token');
    socketRef.current?.disconnect();
    socketRef.current = null;
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('educonnect_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyTwoFactor, verifyEmailOtp, logout, updateUser, isLoading, token, theme, toggleTheme, socket: socketRef.current }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}