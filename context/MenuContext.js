import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncQueue } from '../services/syncQueue';

export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [tiffinItems, setTiffinItems] = useState([]);
  const [mealDishes, setMealDishes] = useState([]);
  
  // This helps us avoid saving empty arrays before the old data loads
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const normalizeTiffins = (items) => {
    return (items || []).map(item => ({
      ...item,
      id: item.id || (item._id ? item._id.toString() : Date.now().toString()),
      unit: item.unit && item.unit !== 'fixed' ? item.unit : 'nos',
      price: parseFloat(item.price) || 0,
    }));
  };

  const refreshMenu = async () => {
    try {
      await syncQueue.process();
      const { api } = require('../services/api');
      const backendMenu = await api.getMenu();
      if (backendMenu && Array.isArray(backendMenu) && backendMenu.length > 0) {
        const tiffin = backendMenu.filter(m => m.category === 'tiffin');
        const meals = backendMenu.filter(m => m.category === 'meal');
        if (tiffin.length > 0) setTiffinItems(normalizeTiffins(tiffin));
        if (meals.length > 0) setMealDishes(meals);
        return backendMenu;
      }
    } catch (e) {
      console.log('Error refreshing menu from cloud:', e);
    }
    return null;
  };

  // --- 1. LOAD DATA ON STARTUP ---
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        await syncQueue.process();
        let backendMenu = null;
        try {
          const { api } = require('../services/api');
          backendMenu = await api.getMenu();
        } catch (e) {
          console.log('Backend not available for menu, using local storage.');
        }

        const defaultTiffins = [
          { id: 'def-1', name: 'Idly', price: 10, unit: 'nos', category: 'tiffin', stock: 100 },
          { id: 'def-2', name: 'Dosa', price: 25, unit: 'nos', category: 'tiffin', stock: 80 },
          { id: 'def-3', name: 'Poori', price: 40, unit: 'plate', category: 'tiffin', stock: 50 },
          { id: 'def-4', name: 'Upma', price: 0, unit: 'plate', category: 'tiffin', stock: 10 },
          { id: 'def-5', name: 'Filter Coffee', price: 15, unit: 'cup', category: 'tiffin', stock: 100 },
        ];

        const defaultMeals = [
          { id: 'meal-1', name: 'White Rice', category: 'meal' },
          { id: 'meal-2', name: 'Sambar', category: 'meal' },
          { id: 'meal-3', name: 'Rasam', category: 'meal' },
          { id: 'meal-4', name: 'Poriyal', category: 'meal' },
          { id: 'meal-5', name: 'Appalam', category: 'meal' },
          { id: 'meal-6', name: 'Payasam', category: 'meal' },
        ];

        if (backendMenu && backendMenu.length > 0) {
          const tiffin = backendMenu.filter(m => m.category === 'tiffin');
          const meals = backendMenu.filter(m => m.category === 'meal');
          setTiffinItems(normalizeTiffins(tiffin.length > 0 ? tiffin : defaultTiffins));
          setMealDishes(meals.length > 0 ? meals : defaultMeals);
        } else {
          const savedTiffin = await AsyncStorage.getItem('@tiffin_items');
          const savedMeals = await AsyncStorage.getItem('@meal_dishes');
          
          if (savedTiffin && JSON.parse(savedTiffin).length > 0) {
            setTiffinItems(normalizeTiffins(JSON.parse(savedTiffin)));
          } else {
            setTiffinItems(defaultTiffins);
          }

          if (savedMeals && JSON.parse(savedMeals).length > 0) {
            setMealDishes(JSON.parse(savedMeals));
          } else {
            setMealDishes(defaultMeals);
          }
        }
        
        setIsDataLoaded(true); // Tell the app we finished loading
      } catch (error) {
        console.error("Error loading menu data:", error);
      }
    };
    loadMenuData();
  }, []);

  // --- 2. AUTO-SAVE TIFFIN ITEMS ---
  useEffect(() => {
    if (isDataLoaded) {
      AsyncStorage.setItem('@tiffin_items', JSON.stringify(tiffinItems));
    }
  }, [tiffinItems, isDataLoaded]);

  // --- 3. AUTO-SAVE MEAL DISHES ---
  useEffect(() => {
    if (isDataLoaded) {
      AsyncStorage.setItem('@meal_dishes', JSON.stringify(mealDishes));
    }
  }, [mealDishes, isDataLoaded]);

  // --- ACTIONS ---
  const addTiffinItem = async (item) => {
    setTiffinItems(prev => [...prev, item]);
    try {
      const { api } = require('../services/api');
      const savedItem = await api.createMenuItem({ ...item, category: 'tiffin' });
      if (savedItem) {
        setTiffinItems(prev => prev.map(i => i.id === item.id ? savedItem : i));
      }
    } catch(e) {
      console.warn("Failed to sync new tiffin to backend, queuing...");
      await syncQueue.add('CREATE_MENU_ITEM', { ...item, category: 'tiffin' });
    }
  };

  const updateTiffinItem = async (updatedItem) => {
    setTiffinItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    try {
      const { api } = require('../services/api');
      await api.updateMenuItem(updatedItem);
    } catch(e) {
      console.warn("Failed to update tiffin to backend, queuing...");
      await syncQueue.add('UPDATE_MENU_ITEM', updatedItem);
    }
  };

  const deleteTiffinItem = async (id) => {
    setTiffinItems(prev => prev.filter(item => item.id !== id));
    try {
      const { api } = require('../services/api');
      await api.deleteMenuItem(id);
    } catch(e) {
      console.warn("Failed to delete tiffin from backend, queuing...");
      await syncQueue.add('DELETE_MENU_ITEM', id);
    }
  };

  const addMealDish = async (dish) => {
    setMealDishes(prev => [...prev, dish]);
    try {
      const { api } = require('../services/api');
      const savedDish = await api.createMenuItem({ ...dish, category: 'meal' });
      if (savedDish) {
        setMealDishes(prev => prev.map(d => d.id === dish.id ? savedDish : d));
      }
    } catch(e) {
      console.warn("Failed to sync new meal dish to backend, queuing...");
      await syncQueue.add('CREATE_MENU_ITEM', { ...dish, category: 'meal' });
    }
  };

  const updateMealDish = async (updatedDish) => {
    setMealDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
    try {
      const { api } = require('../services/api');
      await api.updateMenuItem(updatedDish);
    } catch(e) {
      console.warn("Failed to update meal dish to backend, queuing...");
      await syncQueue.add('UPDATE_MENU_ITEM', updatedDish);
    }
  };

  const deleteMealDish = async (id) => {
    setMealDishes(prev => prev.filter(dish => dish.id !== id));
    try {
      const { api } = require('../services/api');
      await api.deleteMenuItem(id);
    } catch(e) {
      console.warn("Failed to delete meal dish from backend, queuing...");
      await syncQueue.add('DELETE_MENU_ITEM', id);
    }
  };

  return (
    <MenuContext.Provider 
      value={{ 
        tiffinItems, addTiffinItem, updateTiffinItem, deleteTiffinItem,
        mealDishes, addMealDish, updateMealDish, deleteMealDish,
        refreshMenu
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};