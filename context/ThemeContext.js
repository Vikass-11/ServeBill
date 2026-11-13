import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const lightTheme = {
  mode: 'light',
  background: '#F8F7FC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#25243A',
  textSecondary: '#77758B',
  textMuted: '#9E9CAF',
  primary: '#FF6B55',
  primaryDark: '#E04E38',
  primaryLight: '#FFF2F0',
  primaryGradient: ['#FF7E69', '#FF5A40'],
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
  border: '#F0EEF6',
  borderSubtle: 'rgba(37, 36, 58, 0.06)',
  inputBackground: '#F4F3F9',
  inputBorder: '#E6E4EE',
  shadow: '#1E1B38',
  tabBar: '#181725',
  tabBarBorder: '#282738',
  tabBarInactive: '#8A879D',

  // Reference-Matched Modern Pastel Design System
  pastelLavender: '#DCD9FF',
  pastelLavenderDark: '#554E96',
  pastelPeach: '#FFE6D8',
  pastelPeachDark: '#A14F2B',
  pastelMint: '#D0F5E8',
  pastelMintDark: '#177A54',
  pastelYellow: '#FFF0BD',
  pastelYellowDark: '#7A6216',
  pastelBlue: '#DCEBFF',
  pastelBlueDark: '#2C5A96',
  pastelCoral: '#FFD5CC',
  pastelCoralDark: '#9C382A',
  pastelSoftRed: '#FFB8B3',
  pastelSoftRedDark: '#A32F26',
  dockBg: '#FFFFFF',
  dockActiveSquircle: '#1E1D2E',
  radiusCard: 26,
  radiusPill: 18,
  radiusModal: 28,
};

export const darkTheme = {
  mode: 'dark',
  background: '#0F0E17',
  surface: '#181725',
  card: '#181725',
  cardElevated: '#212032',
  text: '#F8F7FC',
  textSecondary: '#9E9CAF',
  textMuted: '#68667A',
  primary: '#FF7E69',
  primaryDark: '#E04E38',
  primaryLight: '#3A1E18',
  primaryGradient: ['#FF8F7D', '#FF5A40'],
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
  border: '#282738',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  inputBackground: '#212032',
  inputBorder: '#2E2D42',
  shadow: '#000000',
  tabBar: '#12111D',
  tabBarBorder: '#242333',
  tabBarInactive: '#68667A',

  // Modern Pastel Design System (Dark adaptation)
  pastelLavender: '#2E2445',
  pastelLavenderDark: '#D4C4F5',
  pastelPeach: '#3B231B',
  pastelPeachDark: '#F7C6B6',
  pastelMint: '#173327',
  pastelMintDark: '#B1EAD0',
  pastelYellow: '#352D16',
  pastelYellowDark: '#FCE79C',
  pastelBlue: '#192C45',
  pastelBlueDark: '#B9D7FE',
  pastelCoral: '#401F1B',
  pastelCoralDark: '#FFB8B0',
  darkDock: '#0E0D17',
  radiusCard: 24,
  radiusPill: 16,
  radiusModal: 28,
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
