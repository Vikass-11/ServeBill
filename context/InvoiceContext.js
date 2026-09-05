import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- 1. LOAD INVOICES ON STARTUP ---
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        // Try to fetch from backend if available
        let backendData = null;
        try {
          const { api } = require('../services/api');
          backendData = await api.getInvoices();
        } catch (e) {
          console.log('Backend not available, using local storage.');
        }

        if (backendData && backendData.length > 0) {
          setInvoices(backendData);
        } else {
          // Fallback to local storage
          const savedInvoices = await AsyncStorage.getItem('@saved_invoices');
          if (savedInvoices) {
            setInvoices(JSON.parse(savedInvoices));
          }
        }
        setIsDataLoaded(true); // Tell the app we finished loading
      } catch (error) {
        console.error("Error loading invoices:", error);
      }
    };
    loadInvoices();
  }, []);

  // --- 2. AUTO-SAVE INVOICES ---
  useEffect(() => {
    if (isDataLoaded) {
      AsyncStorage.setItem('@saved_invoices', JSON.stringify(invoices));
    }
  }, [invoices, isDataLoaded]);

  // --- ACTIONS ---
  const addInvoice = async (invoice) => {
    // Optimistic update locally
    setInvoices((prevInvoices) => [invoice, ...prevInvoices]); 
    
    // Attempt to sync with backend
    try {
      const { api } = require('../services/api');
      const savedInvoice = await api.createInvoice(invoice);
      if (savedInvoice) {
        setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === invoice.id ? savedInvoice : inv));
      }
    } catch (e) {
      console.log('Failed to sync new invoice to backend');
    }
  };

  const updateInvoice = async (id, updatedData) => {
    setInvoices((prev) => prev.map(inv => inv.id === id ? { ...inv, ...updatedData } : inv));
    try {
      const { api } = require('../services/api');
      const savedInvoice = await api.updateInvoice(id, updatedData);
      if (savedInvoice) {
        setInvoices(prev => prev.map(inv => inv.id === id ? savedInvoice : inv));
      }
    } catch (e) {
      console.log('Failed to update invoice on backend');
    }
  };

  const deleteInvoice = async (id) => {
    // FIX APPLIED: Safely grabbing the previous list before filtering out the deleted bill
    setInvoices((prevInvoices) => prevInvoices.filter(inv => inv.id !== id));
    
    try {
      const { api } = require('../services/api');
      await api.deleteInvoice(id);
    } catch (e) {
      console.log('Failed to delete invoice from backend');
    }
  };

  return (
    <InvoiceContext.Provider value={{ invoices, addInvoice, updateInvoice, deleteInvoice }}>
      {children}
    </InvoiceContext.Provider>
  );
};