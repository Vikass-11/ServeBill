import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [shopSales, setShopSales] = useState([]);
  const [shopExpenses, setShopExpenses] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        let backendSales = null;
        let backendExpenses = null;

        try {
          backendSales = await api.getShopSales();
          backendExpenses = await api.getShopExpenses();
        } catch (e) {
          console.log('Backend not available, using local storage.');
        }

        if (backendSales && backendSales.length > 0) {
          setShopSales(backendSales);
        } else {
          const savedSales = await AsyncStorage.getItem('@shop_sales');
          if (savedSales) setShopSales(JSON.parse(savedSales));
        }

        if (backendExpenses && backendExpenses.length > 0) {
          setShopExpenses(backendExpenses);
        } else {
          const savedExpenses = await AsyncStorage.getItem('@shop_expenses');
          if (savedExpenses) setShopExpenses(JSON.parse(savedExpenses));
        }
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error loading business data:", error);
      }
    };
    loadBusinessData();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      AsyncStorage.setItem('@shop_sales', JSON.stringify(shopSales));
      AsyncStorage.setItem('@shop_expenses', JSON.stringify(shopExpenses));
    }
  }, [shopSales, shopExpenses, isDataLoaded]);

  const addShopSale = async (sale) => {
    setShopSales(prev => [sale, ...prev]);
    try {
      const saved = await api.createShopSale(sale);
      if (saved) {
        setShopSales(prev => prev.map(s => s.id === sale.id ? saved : s));
      }
    } catch (e) {
      console.log('Failed to sync new shop sale to backend');
    }
  };

  const updateShopSale = async (id, updatedData) => {
    setShopSales(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
    try {
      const saved = await api.updateShopSale(id, updatedData);
      if (saved) {
        setShopSales(prev => prev.map(s => s.id === id ? saved : s));
      }
    } catch (e) {
      console.log('Failed to update shop sale on backend');
    }
  };

  const addShopExpense = async (expense) => {
    setShopExpenses(prev => [expense, ...prev]);
    try {
      const saved = await api.createShopExpense(expense);
      if (saved) {
        setShopExpenses(prev => prev.map(e => e.id === expense.id ? saved : e));
      }
    } catch (e) {
      console.log('Failed to sync new shop expense to backend');
    }
  };

  return (
    <BusinessContext.Provider value={{ shopSales, shopExpenses, addShopSale, updateShopSale, addShopExpense }}>
      {children}
    </BusinessContext.Provider>
  );
};
