import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [tiffinItems, setTiffinItems] = useState([]);
  const [mealDishes, setMealDishes] = useState([]);
  
  // This helps us avoid saving empty arrays before the old data loads
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- 1. LOAD DATA ON STARTUP ---
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        let backendMenu = null;
        try {
          const { api } = require('../services/api');
          backendMenu = await api.getMenu();
        } catch (e) {
          console.log('Backend not available for menu, using local storage.');
        }

        if (backendMenu && backendMenu.length > 0) {
          const tiffin = backendMenu.filter(m => m.category === 'tiffin');
          const meals = backendMenu.filter(m => m.category === 'meal');
          setTiffinItems(tiffin);
          setMealDishes(meals);
        } else {
          const savedTiffin = await AsyncStorage.getItem('@tiffin_items');
          const savedMeals = await AsyncStorage.getItem('@meal_dishes');
          
          if (savedTiffin) setTiffinItems(JSON.parse(savedTiffin));
          if (savedMeals) setMealDishes(JSON.parse(savedMeals));
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
      console.warn("Failed to sync new tiffin to backend");
    }
  };

  const deleteTiffinItem = async (id) => {
    setTiffinItems(prev => prev.filter(item => item.id !== id));
    try {
      const { api } = require('../services/api');
      await api.deleteMenuItem(id);
    } catch(e) {}
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
      console.warn("Failed to sync new meal dish to backend");
    }
  };

  const deleteMealDish = async (id) => {
    setMealDishes(prev => prev.filter(dish => dish.id !== id));
    try {
      const { api } = require('../services/api');
      await api.deleteMenuItem(id);
    } catch(e) {}
  };

  return (
    <MenuContext.Provider 
      value={{ 
        tiffinItems, addTiffinItem, deleteTiffinItem,
        mealDishes, addMealDish, deleteMealDish
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};