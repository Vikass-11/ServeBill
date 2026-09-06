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
      throw error;
    }
  },

  updateInvoice: async (id, invoiceData) => {
    try {
      const response = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (updateInvoice):', error);
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
      throw error;
    }
  },

  updateMenuItem: async (menuItem) => {
    try {
      const response = await fetch(`${BASE_URL}/menu/${menuItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItem)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (updateMenuItem):', error);
      throw error;
    }
  },

  deleteInvoice: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/invoices/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (deleteInvoice):', error);
      throw error;
    }
  },

  deleteMenuItem: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/menu/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (deleteMenuItem):', error);
      throw error;
    }
  },

  getCustomers: async () => {
    try {
      const response = await fetch(`${BASE_URL}/customers`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getCustomers):', error);
      return null;
    }
  },

  createCustomer: async (customerData) => {
    try {
      const response = await fetch(`${BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (createCustomer):', error);
      return null;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/customers/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (deleteCustomer):', error);
      return null;
    }
  },

  getShopSales: async () => {
    try {
      const response = await fetch(`${BASE_URL}/shopsales`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getShopSales):', error);
      return null;
    }
  },

  createShopSale: async (saleData) => {
    try {
      const response = await fetch(`${BASE_URL}/shopsales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (createShopSale):', error);
      return null;
    }
  },

  updateShopSale: async (id, saleData) => {
    try {
      const response = await fetch(`${BASE_URL}/shopsales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (updateShopSale):', error);
      return null;
    }
  },

  getShopExpenses: async () => {
    try {
      const response = await fetch(`${BASE_URL}/shopexpenses`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (getShopExpenses):', error);
      return null;
    }
  },

  createShopExpense: async (expenseData) => {
    try {
      const response = await fetch(`${BASE_URL}/shopexpenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.warn('API Error (createShopExpense):', error);
      return null;
    }
  }
};
