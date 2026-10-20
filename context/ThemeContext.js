import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const lightTheme = {
  mode: 'light',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#FF5A36',
  primaryDark: '#E04018',
  primaryLight: '#FFF1EC',
  primaryGradient: ['#FF6A46', '#FF4500'],
  secondary: '#6366F1',
  secondaryLight: '#EEF2FF',
  accentPurple: '#8B5CF6',
  accentPurpleLight: '#F5F3FF',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  border: '#E2E8F0',
  borderSubtle: 'rgba(0, 0, 0, 0.05)',
  inputBackground: '#F1F5F9',
  inputBorder: '#CBD5E1',
  shadow: '#0F172A',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarInactive: '#94A3B8',
};

export const darkTheme = {
  mode: 'dark',
  background: '#090D16',
  surface: '#111827',
  card: '#131B2E',
  cardElevated: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#FF6A46',
  primaryDark: '#E04018',
  primaryLight: '#2C1710',
  primaryGradient: ['#FF7855', '#FF4E11'],
  secondary: '#818CF8',
  secondaryLight: '#1E1B4B',
  accentPurple: '#A78BFA',
  accentPurpleLight: '#2E1065',
  warning: '#FBBF24',
  warningLight: '#3A2800',
  error: '#F87171',
  errorLight: '#3C1414',
  success: '#34D399',
  successLight: '#063B26',
  border: '#1E293B',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  inputBackground: '#0F172A',
  inputBorder: '#1E293B',
  shadow: '#000000',
  tabBar: '#131B2E',
  tabBarBorder: '#1E293B',
  tabBarInactive: '#64748B',
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    // load from async storage
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.log("Error loading theme:", error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
