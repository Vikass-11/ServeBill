import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const lightTheme = {
  mode: 'light',
  background: '#FAF9F6',
  card: '#fff',
  text: '#111',
  textSecondary: '#666',
  textMuted: '#888',
  primary: '#FF7F50',
  primaryLight: '#FFF0EA',
  border: '#eee',
  inputBackground: '#f8f9fa',
  inputBorder: '#e9ecef',
  error: '#FF0000',
  success: '#4CAF50',
  shadow: '#000',
  tabBar: '#111', // dark tab bar in light mode
};

export const darkTheme = {
  mode: 'dark',
  background: '#121212',
  card: '#1E1E1E',
  text: '#EFEFEF',
  textSecondary: '#A0A0A0',
  textMuted: '#777',
  primary: '#FF7F50',
  primaryLight: '#3A2015',
  border: '#333',
  inputBackground: '#2A2A2A',
  inputBorder: '#3C3C3C',
  error: '#FF5252',
  success: '#81C784',
  shadow: '#000',
  tabBar: '#2C2C2C',
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
