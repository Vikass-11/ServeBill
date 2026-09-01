import { Platform } from 'react-native';

// Use localhost for web/iOS simulator, or 10.0.2.2 for Android emulator
// If deploying, change this to your actual deployed backend URL.
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();

export const api = {
  getInvoices: async () => {
    try {
      const response = await fetch(`${BASE_URL}/invoices`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getInvoices):', error);
      return null;
    }
  },
  
  createInvoice: async (invoiceData) => {
    try {
      const response = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (createInvoice):', error);
      return null;
    }
  },

  getMenu: async () => {
    try {
      const response = await fetch(`${BASE_URL}/menu`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getMenu):', error);
      return null;
    }
  },

  createMenuItem: async (menuItem) => {
    try {
      const response = await fetch(`${BASE_URL}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItem)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (createMenuItem):', error);
      return null;
    }
  },

  deleteInvoice: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/invoices/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (deleteInvoice):', error);
      return null;
    }
  },

  deleteMenuItem: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/menu/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (deleteMenuItem):', error);
      return null;
    }
  }
};
