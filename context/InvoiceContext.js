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
        const savedInvoices = await AsyncStorage.getItem('@saved_invoices');
        if (savedInvoices) {
          setInvoices(JSON.parse(savedInvoices));
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
  const addInvoice = (invoice) => {
    // FIX APPLIED: Using (prevInvoices) ensures we never overwrite or lose old history
    // when saving multiple invoices back-to-back.
    setInvoices((prevInvoices) => [invoice, ...prevInvoices]); 
  };

  const deleteInvoice = (id) => {
    // FIX APPLIED: Safely grabbing the previous list before filtering out the deleted bill
    setInvoices((prevInvoices) => prevInvoices.filter(inv => inv.id !== id));
  };

  return (
    <InvoiceContext.Provider value={{ invoices, addInvoice, deleteInvoice }}>
      {children}
    </InvoiceContext.Provider>
  );
};