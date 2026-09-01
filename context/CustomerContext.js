import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);

  // --- 1. LOAD DATA ON STARTUP ---
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        let backendCustomers = null;
        try {
          backendCustomers = await api.getCustomers();
        } catch (e) {
          console.log('Backend not available for customers, using local storage.');
        }

        if (backendCustomers && backendCustomers.length > 0) {
          setCustomers(backendCustomers);
        } else {
          const localCustomers = await AsyncStorage.getItem('customers');
          if (localCustomers) setCustomers(JSON.parse(localCustomers));
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    };
    loadCustomerData();
  }, []);

  // --- 2. SAVE LOCAL CACHE WHENEVER DATA CHANGES ---
  useEffect(() => {
    const saveToLocal = async () => {
      try {
        await AsyncStorage.setItem('customers', JSON.stringify(customers));
      } catch (error) {
        console.error('Failed to save customers locally:', error);
      }
    };
    saveToLocal();
  }, [customers]);

  // --- 3. EXPOSED METHODS ---
  const addCustomer = async (customer) => {
    // Add locally immediately for fast UI
    setCustomers(prev => [...prev, customer]);
    
    // Sync to backend
    try {
      const savedCustomer = await api.createCustomer(customer);
      if (savedCustomer) {
        // Swap temp id with real DB id
        setCustomers(prev => prev.map(c => c.id === customer.id ? savedCustomer : c));
      }
    } catch(e) {
      console.warn("Failed to sync new customer to backend");
    }
  };

  const deleteCustomer = async (id) => {
    // Remove locally
    setCustomers(prev => prev.filter(c => c.id !== id));
    
    // Delete on backend
    try {
      await api.deleteCustomer(id);
    } catch (e) {
      console.warn("Failed to delete customer on backend");
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        deleteCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
