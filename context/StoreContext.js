import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const StoreContext = createContext();

const STORES_STORAGE_KEY = '@servebill_stores';
const STORE_ITEMS_STORAGE_KEY = '@servebill_store_items';

export const StoreProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [storeItems, setStoreItems] = useState({}); // mapped by storeId: items[]
  const [isLoading, setIsLoading] = useState(false);

  // Load stores on startup
  const refreshStores = useCallback(async () => {
    try {
      setIsLoading(true);
      const backendStores = await api.getStores();
      if (backendStores && Array.isArray(backendStores)) {
        setStores(backendStores);
        await AsyncStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(backendStores));
      } else {
        const local = await AsyncStorage.getItem(STORES_STORAGE_KEY);
        if (local) setStores(JSON.parse(local));
      }
    } catch (e) {
      console.warn('Error loading stores:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  // Add new store
  const addStore = async (storeData) => {
    const tempStore = {
      id: Date.now().toString(),
      name: storeData.name.trim(),
      category: storeData.category || 'Grocery',
      phone: storeData.phone || '',
      address: storeData.address || '',
      itemCount: 0,
    };

    setStores((prev) => [tempStore, ...prev]);

    try {
      const savedStore = await api.createStore(storeData);
      if (savedStore) {
        setStores((prev) => prev.map((s) => (s.id === tempStore.id ? savedStore : s)));
        return savedStore;
      }
    } catch (e) {
      console.warn('Failed to sync new store to cloud, saved locally');
    }
    return tempStore;
  };

  // Delete store
  const deleteStore = async (storeId) => {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    setStoreItems((prev) => {
      const copy = { ...prev };
      delete copy[storeId];
      return copy;
    });

    try {
      await api.deleteStore(storeId);
    } catch (e) {
      console.warn('Failed to delete store on cloud');
    }
  };

  // Get items for a specific store
  const fetchStoreItems = async (storeId) => {
    try {
      const backendItems = await api.getStoreItems(storeId);
      if (backendItems && Array.isArray(backendItems)) {
        setStoreItems((prev) => ({ ...prev, [storeId]: backendItems }));
        return backendItems;
      }
      const local = await AsyncStorage.getItem(`${STORE_ITEMS_STORAGE_KEY}_${storeId}`);
      if (local) {
        const parsed = JSON.parse(local);
        setStoreItems((prev) => ({ ...prev, [storeId]: parsed }));
        return parsed;
      }
    } catch (e) {
      console.warn('Error fetching store items:', e);
    }
    return storeItems[storeId] || [];
  };

  // Log purchase & update price history
  const logPurchase = async (storeId, purchasePayload) => {
    const existing = storeItems[storeId] || [];
    const itemIndex = existing.findIndex(
      (i) => i.name.toLowerCase() === purchasePayload.name.trim().toLowerCase()
    );

    const price = parseFloat(purchasePayload.price) || 0;
    const qty = parseFloat(purchasePayload.quantity) || 1;
    const total = purchasePayload.total !== undefined ? parseFloat(purchasePayload.total) : price * qty;
    const purchaseDate = purchasePayload.date || new Date().toISOString();

    const newRecord = {
      id: Date.now().toString(),
      price,
      quantity: qty,
      total,
      unit: purchasePayload.unit || 'kg',
      chargeTo: purchasePayload.chargeTo || 'SHOP',
      notes: purchasePayload.notes || '',
      date: purchaseDate,
    };

    let updatedList = [];
    if (itemIndex !== -1) {
      const current = existing[itemIndex];
      const updatedItem = {
        ...current,
        previousPrice: current.currentPrice || price,
        currentPrice: price,
        unit: purchasePayload.unit || current.unit,
        imageUrl: purchasePayload.imageUrl || current.imageUrl,
        lastPurchasedDate: purchaseDate,
        priceHistory: [newRecord, ...(current.priceHistory || [])],
      };
      updatedList = existing.map((it, idx) => (idx === itemIndex ? updatedItem : it));
    } else {
      const newItem = {
        id: Date.now().toString(),
        storeId,
        storeName: purchasePayload.storeName || '',
        name: purchasePayload.name.trim(),
        category: purchasePayload.category || 'General',
        unit: purchasePayload.unit || 'kg',
        imageUrl: purchasePayload.imageUrl || '',
        currentPrice: price,
        previousPrice: price,
        lastPurchasedDate: purchaseDate,
        priceHistory: [newRecord],
      };
      updatedList = [newItem, ...existing];
    }

    setStoreItems((prev) => ({ ...prev, [storeId]: updatedList }));
    await AsyncStorage.setItem(`${STORE_ITEMS_STORAGE_KEY}_${storeId}`, JSON.stringify(updatedList));

    // Update store item count
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, itemCount: updatedList.length } : s))
    );

    // Sync to backend & cloud
    try {
      const saved = await api.logStorePurchase(storeId, purchasePayload);
      if (saved) {
        setStoreItems((prev) => ({
          ...prev,
          [storeId]: (prev[storeId] || []).map((i) => (i.name.toLowerCase() === saved.name.toLowerCase() ? saved : i)),
        }));
      }
    } catch (e) {
      console.warn('Purchase sync failed, saved locally:', e);
    }
  };

  // Delete store item
  const deleteStoreItem = async (storeId, itemId) => {
    setStoreItems((prev) => {
      const updated = (prev[storeId] || []).filter((i) => i.id !== itemId);
      AsyncStorage.setItem(`${STORE_ITEMS_STORAGE_KEY}_${storeId}`, JSON.stringify(updated)).catch(() => {});
      return { ...prev, [storeId]: updated };
    });

    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, itemCount: Math.max(0, (s.itemCount || 1) - 1) } : s))
    );

    try {
      await api.deleteStoreItem(itemId);
    } catch (e) {
      console.warn('Failed to delete store item on cloud');
    }
  };

  // Upload photo to Cloudinary
  const uploadPhoto = async (base64Data) => {
    try {
      const url = await api.uploadImage(base64Data);
      return url;
    } catch (e) {
      console.warn('Cloudinary upload error in context:', e);
      return null;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        storeItems,
        isLoading,
        refreshStores,
        addStore,
        deleteStore,
        fetchStoreItems,
        logPurchase,
        deleteStoreItem,
        uploadPhoto,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

