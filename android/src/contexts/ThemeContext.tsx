import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    // Gradients
    gradientStart: string;
    gradientEnd: string;
    // Chart backgrounds
    chartBackground: string;
    // Status bar
    statusBarStyle: 'light-content' | 'dark-content';
  };
}

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    gradientStart: '#4F46E5',
    gradientEnd: '#6366F1',
    chartBackground: '#FFFFFF',
    statusBarStyle: 'dark-content',
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#000000',
    surface: '#1A1A1A',
    card: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    border: '#2A2A2A',
    primary: '#00A8FF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    gradientStart: '#000000',
    gradientEnd: '#1A1A1A',
    chartBackground: '#1A1A1A',
    statusBarStyle: 'light-content',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('app_theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

