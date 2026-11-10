import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncQueue } from '../services/syncQueue';

export const InvoiceContext = createContext();

const DRAFT_STORAGE_KEY = '@servebill_catering_order_draft';

export const InvoiceProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- 1. LOAD INVOICES ON STARTUP ---
  const refreshInvoices = async () => {
    try {
      await syncQueue.process();
      const { api } = require('../services/api');
      const backendData = await api.getInvoices();
      if (backendData && Array.isArray(backendData)) {
        setInvoices(backendData);
        await AsyncStorage.setItem('@saved_invoices', JSON.stringify(backendData));
        return backendData;
      }
    } catch (e) {
      console.log('Error refreshing invoices from cloud:', e);
    }
    return null;
  };

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        await syncQueue.process();
        let backendData = null;
        try {
          const { api } = require('../services/api');
          backendData = await api.getInvoices();
        } catch (e) {
          console.log('Backend not available, using local storage.');
        }

        if (backendData && Array.isArray(backendData)) {
          setInvoices(backendData);
          await AsyncStorage.setItem('@saved_invoices', JSON.stringify(backendData));
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

    // 30-second background live sync for multi-device family updates
    const syncInterval = setInterval(() => {
      refreshInvoices();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, []);

  // --- 2. AUTO-SAVE INVOICES ---
  useEffect(() => {
    if (isDataLoaded) {
      AsyncStorage.setItem('@saved_invoices', JSON.stringify(invoices));
    }
  }, [invoices, isDataLoaded]);

  // --- ACTIONS ---
  const addInvoice = async (invoice) => {
    // 1. Optimistic update locally
    setInvoices((prevInvoices) => {
      const filtered = prevInvoices.filter(inv => inv.id !== invoice.id);
      return [invoice, ...filtered];
    }); 
    
    // 2. Immediate direct write to AsyncStorage (100% guaranteed persistence)
    try {
      const raw = await AsyncStorage.getItem('@saved_invoices');
      const list = raw ? JSON.parse(raw) : [];
      const updatedList = [invoice, ...list.filter(inv => inv.id !== invoice.id)];
      await AsyncStorage.setItem('@saved_invoices', JSON.stringify(updatedList));
    } catch (err) {
      console.error('AsyncStorage immediate save error in addInvoice:', err);
    }

    // 3. Attempt to sync with backend
    try {
      const { api } = require('../services/api');
      const savedInvoice = await api.createInvoice(invoice);
      if (savedInvoice) {
        setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === invoice.id ? savedInvoice : inv));
      }
    } catch (e) {
      console.log('Failed to sync new invoice to backend, queuing...');
      await syncQueue.add('CREATE_INVOICE', invoice);
    }
  };

  const updateInvoice = async (id, updatedData) => {
    setInvoices((prev) => prev.map(inv => inv.id === id ? { ...inv, ...updatedData } : inv));
    
    try {
      const raw = await AsyncStorage.getItem('@saved_invoices');
      const list = raw ? JSON.parse(raw) : [];
      const updatedList = list.map(inv => inv.id === id ? { ...inv, ...updatedData } : inv);
      await AsyncStorage.setItem('@saved_invoices', JSON.stringify(updatedList));
    } catch (err) {
      console.error('AsyncStorage immediate save error in updateInvoice:', err);
    }

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
    setInvoices((prevInvoices) => prevInvoices.filter(inv => inv.id !== id));
    
    try {
      const raw = await AsyncStorage.getItem('@saved_invoices');
      const list = raw ? JSON.parse(raw) : [];
      const updatedList = list.filter(inv => inv.id !== id);
      await AsyncStorage.setItem('@saved_invoices', JSON.stringify(updatedList));
    } catch (err) {
      console.error('AsyncStorage immediate save error in deleteInvoice:', err);
    }

    try {
      const { api } = require('../services/api');
      await api.deleteInvoice(id);
    } catch (e) {
      console.log('Failed to delete invoice from backend, queuing...');
      await syncQueue.add('DELETE_INVOICE', id);
    }
  };

  // --- DRAFT MANAGEMENT ---
  const saveDraft = async (draftData) => {
    try {
      if (!draftData) {
        await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      }
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  };

  const getDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Error reading draft:', e);
      return null;
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
  };

  return (
    <InvoiceContext.Provider value={{
      invoices,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      saveDraft,
      getDraft,
      clearDraft,
      refreshInvoices
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};
