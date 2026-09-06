import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@sync_queue';

export const syncQueue = {
  add: async (action, payload) => {
    try {
      const queue = await syncQueue.get();
      queue.push({ action, payload, id: Date.now().toString() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to add to sync queue', e);
    }
  },
  get: async () => {
    try {
      const queue = await AsyncStorage.getItem(QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      return [];
    }
  },
  process: async () => {
    const queue = await syncQueue.get();
    if (queue.length === 0) return;

    const { api } = require('./api');
    const remaining = [];
    for (const item of queue) {
      try {
        let success = false;
        if (item.action === 'CREATE_INVOICE') {
          const res = await api.createInvoice(item.payload, true);
          if (res) success = true;
        } else if (item.action === 'DELETE_INVOICE') {
          const res = await api.deleteInvoice(item.payload, true);
          if (res) success = true;
        } else if (item.action === 'CREATE_MENU_ITEM') {
           const res = await api.createMenuItem(item.payload, true);
           if (res) success = true;
        } else if (item.action === 'DELETE_MENU_ITEM') {
           const res = await api.deleteMenuItem(item.payload, true);
           if (res) success = true;
        } else if (item.action === 'UPDATE_MENU_ITEM') {
           const res = await api.updateMenuItem(item.payload, true);
           if (res) success = true;
        }

        if (!success) remaining.push(item);
      } catch (e) {
        remaining.push(item);
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }
};
