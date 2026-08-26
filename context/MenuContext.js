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
    setTiffinItems([...tiffinItems, item]);
    try {
      const { api } = require('../services/api');
      await api.createMenuItem({ ...item, category: 'tiffin' });
    } catch(e) {}
  };

  const deleteTiffinItem = (id) => {
    setTiffinItems(tiffinItems.filter(item => item.id !== id));
  };

  const addMealDish = async (dish) => {
    setMealDishes([...mealDishes, dish]);
    try {
      const { api } = require('../services/api');
      await api.createMenuItem({ ...dish, category: 'meal' });
    } catch(e) {}
  };

  const deleteMealDish = (id) => {
    setMealDishes(mealDishes.filter(dish => dish.id !== id));
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