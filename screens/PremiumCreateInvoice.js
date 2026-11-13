import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomDatePicker from '../components/CustomDatePicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuContext } from '../context/MenuContext';
import { CustomerContext } from '../context/CustomerContext';
import { InvoiceContext } from '../context/InvoiceContext';
import { ThemeContext } from '../context/ThemeContext';

export default function PremiumCreateInvoiceScreen({ route, navigation }) {
  const { tiffinItems, mealDishes, updateTiffinItem } = useContext(MenuContext);
  const { addInvoice, updateInvoice, saveDraft, getDraft, clearDraft } = useContext(InvoiceContext);
  const editInvoice = route?.params?.editInvoice;
  const isNewBillParam = route?.params?.newBill;
  const lastLoadedInvoiceId = useRef(null);

  const sanitizeEvents = (rawEvents, fallbackDate) => {
    if (!rawEvents || !Array.isArray(rawEvents) || rawEvents.length === 0) {
      return [{
        id: Date.now().toString(),
        date: fallbackDate || new Date().toISOString(),
        transportCharge: '',
        sessions: {
          breakfast: { items: [], meals: [] },
          lunch: { items: [], meals: [] },
          dinner: { items: [], meals: [] },
        },
      }];
    }
    return rawEvents.map((ev, index) => {
      let sessions = ev.sessions;
      if (!sessions || typeof sessions !== 'object') {
        sessions = {
          breakfast: { items: [], meals: [] },
          lunch: { items: [], meals: [] },
          dinner: { items: [], meals: [] },
        };

        // Migrate legacy selectedTiffins -> breakfast.items
        const legacyTiffins = Array.isArray(ev.selectedTiffins) ? ev.selectedTiffins : [];
        legacyTiffins.forEach((itemId) => {
          const tItem = (tiffinItems || []).find((t) => t.id === itemId) || { id: itemId, name: 'Food Item', price: 0, unit: 'nos' };
          const mode = ev.pricingModes?.[itemId] || (parseFloat(tItem.price) > 0 ? 'unit' : 'fixed');
          const qty = ev.tiffinQuantities?.[itemId] || (mode === 'unit' ? 1 : 0);
          const fixedPrice = ev.fixedPrices?.[itemId] !== undefined ? String(ev.fixedPrices[itemId]) : (parseFloat(tItem.price) > 0 ? String(tItem.price) : '');
          sessions.breakfast.items.push({
            id: itemId,
            name: tItem.name,
            price: parseFloat(tItem.price) || 0,
            unit: tItem.unit || 'nos',
            pricingMode: mode,
            quantity: qty,
            fixedPrice,
            fixedSelected: ev.fixedSelected?.[itemId] !== undefined ? Boolean(ev.fixedSelected[itemId]) : parseFloat(fixedPrice) > 0,
          });
        });

        // Migrate legacy addedMeals -> lunch.meals
        const legacyMeals = Array.isArray(ev.addedMeals) ? ev.addedMeals : [];
        legacyMeals.forEach((m, mIdx) => {
          sessions.lunch.meals.push({
            id: m.id || `${Date.now()}-m-${mIdx}`,
            name: m.name || 'Full Meals Package',
            price: parseFloat(m.price) || 0,
            quantity: parseInt(m.quantity, 10) || 1,
            pricingMode: m.pricingMode === 'fixed' ? 'fixed' : 'unit',
            dishes: Array.isArray(m.dishes) ? m.dishes : [],
          });
        });
      }

      ['breakfast', 'lunch', 'dinner'].forEach((key) => {
        if (!sessions[key]) sessions[key] = { items: [], meals: [] };
        if (!Array.isArray(sessions[key].items)) sessions[key].items = [];
        if (!Array.isArray(sessions[key].meals)) sessions[key].meals = [];
      });

      return {
        id: ev.id || `${Date.now()}-${index}`,
        date: ev.date || fallbackDate || new Date().toISOString(),
        transportCharge: ev.transportCharge != null ? ev.transportCharge.toString() : '',
        sessions,
      };
    });
  };

  const formatDateSafe = (dateVal) => {
    if (!dateVal) return new Date().toLocaleDateString('en-GB');
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      return String(dateVal);
    }
    return d.toLocaleDateString('en-GB');
  };

  const [clientName, setClientName] = useState(editInvoice?.clientName || editInvoice?.customerName || '');
  const [transportCharge, setTransportCharge] = useState(editInvoice?.transportCharge != null ? editInvoice.transportCharge.toString() : '');
  const [clientPhone, setClientPhone] = useState(editInvoice?.clientPhone || editInvoice?.customerPhone || '');
  const [advanceAmount, setAdvanceAmount] = useState(editInvoice?.advanceAmount != null ? editInvoice.advanceAmount.toString() : '');
  const [extraItems, setExtraItems] = useState(Array.isArray(editInvoice?.extraItems) ? editInvoice.extraItems : []);
  const [events, setEvents] = useState(() => sanitizeEvents(editInvoice?.events, editInvoice?.date));

  const [showPicker, setShowPicker] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalEventId, setModalEventId] = useState(null);
  const [modalSessionKey, setModalSessionKey] = useState('lunch');
  const [tempMealName, setTempMealName] = useState('Full Meals Package');
  const [tempMealPrice, setTempMealPrice] = useState('');
  const [tempMealQty, setTempMealQty] = useState('');
  const [tempMealPricingMode, setTempMealPricingMode] = useState('unit');
  const [tempSelectedDishes, setTempSelectedDishes] = useState([]);

  const [isFoodPickerVisible, setFoodPickerVisible] = useState(false);
  const [foodPickerEventId, setFoodPickerEventId] = useState(null);
  const [foodPickerSessionKey, setFoodPickerSessionKey] = useState('breakfast');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');

  const [isExtraModalVisible, setExtraModalVisible] = useState(false);
  const [tempExtraDesc, setTempExtraDesc] = useState('');
  const [tempExtraAmount, setTempExtraAmount] = useState('');

  // Draft & Auto-Save States
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setTransportCharge('');
    setAdvanceAmount('');
    setExtraItems([]);
    setEvents([{
      id: Date.now().toString(),
      date: new Date().toISOString(),
      transportCharge: '',
      sessions: {
        breakfast: { items: [], meals: [] },
        lunch: { items: [], meals: [] },
        dinner: { items: [], meals: [] },
      },
    }]);
  };

  const checkHasContent = (
    cName = clientName,
    cPhone = clientPhone,
    tCharge = transportCharge,
    advAmt = advanceAmount,
    xItems = extraItems,
    evs = events
  ) => {
    return Boolean(
      (cName && cName.trim().length > 0) ||
      (cPhone && cPhone.trim().length > 0) ||
      (tCharge && parseFloat(tCharge) > 0) ||
      (advAmt && parseFloat(advAmt) > 0) ||
      (Array.isArray(xItems) && xItems.length > 0) ||
      (Array.isArray(evs) && evs.some(e => {
        if (e.transportCharge && parseFloat(e.transportCharge) > 0) return true;
        if (e.sessions) {
          return Object.values(e.sessions).some(sess =>
            (Array.isArray(sess?.items) && sess.items.length > 0) ||
            (Array.isArray(sess?.meals) && sess.meals.length > 0)
          );
        }
        return false;
      }))
    );
  };

  // Handle route params updates, draft restoration & edit mode
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Case 1: Editing existing recorded invoice
      if (editInvoice && editInvoice.id !== lastLoadedInvoiceId.current) {
        lastLoadedInvoiceId.current = editInvoice.id;
        setClientName(editInvoice.clientName || editInvoice.customerName || '');
        setClientPhone(editInvoice.clientPhone || editInvoice.customerPhone || '');
        setTransportCharge(editInvoice.transportCharge != null ? editInvoice.transportCharge.toString() : '');
        setAdvanceAmount(editInvoice.advanceAmount != null ? editInvoice.advanceAmount.toString() : '');
        setEvents(sanitizeEvents(editInvoice.events, editInvoice.date));
        if (Array.isArray(editInvoice.extraItems)) {
          setExtraItems(editInvoice.extraItems);
        }
        setHasRestoredDraft(false);
        isInitialLoadRef.current = false;
        return;
      }

      // Case 2: New invoice - check for existing draft
      if (!editInvoice) {
        try {
          const draft = await getDraft();
          if (!isMounted) return;

          if (draft && checkHasContent(draft.clientName, draft.clientPhone, draft.transportCharge, draft.advanceAmount, draft.extraItems, draft.events)) {
            setClientName(draft.clientName || '');
            setClientPhone(draft.clientPhone || '');
            setTransportCharge(draft.transportCharge != null ? draft.transportCharge.toString() : '');
            setAdvanceAmount(draft.advanceAmount != null ? draft.advanceAmount.toString() : '');
            setExtraItems(Array.isArray(draft.extraItems) ? draft.extraItems : []);
            setEvents(sanitizeEvents(draft.events, draft.updatedAt));
            setHasRestoredDraft(true);
          } else if (isNewBillParam && lastLoadedInvoiceId.current !== null) {
            resetForm();
            setHasRestoredDraft(false);
          }
        } catch (e) {
          console.error('Error fetching draft:', e);
        }
        lastLoadedInvoiceId.current = null;
        isInitialLoadRef.current = false;
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [editInvoice, route?.params?.timestamp]);

  // Debounced Auto-Save Draft
  useEffect(() => {
    if (isInitialLoadRef.current || editInvoice) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (checkHasContent()) {
        await saveDraft({
          clientName,
          clientPhone,
          transportCharge,
          advanceAmount,
          extraItems,
          events,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await clearDraft();
        setHasRestoredDraft(false);
      }
    }, 400);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [clientName, clientPhone, transportCharge, advanceAmount, extraItems, events, editInvoice]);

  // CRM
  const { customers } = useContext(CustomerContext);
  const [isCustomerModalVisible, setCustomerModalVisible] = useState(false);

  const openFoodItemPicker = (eventId, sessionKey = 'breakfast') => {
    setFoodPickerEventId(eventId);
    setFoodPickerSessionKey(sessionKey);
    setFoodSearchQuery('');
    setFoodPickerVisible(true);
  };

  const filteredFoodItems = useMemo(() => {
    if (!tiffinItems || !Array.isArray(tiffinItems)) return [];
    if (!foodSearchQuery.trim()) return tiffinItems;
    const q = foodSearchQuery.trim().toLowerCase();
    return tiffinItems.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [tiffinItems, foodSearchQuery]);

  const addFoodItemToSession = (eventId, sessionKey, item) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSessions = ev.sessions || {
          breakfast: { items: [], meals: [] },
          lunch: { items: [], meals: [] },
          dinner: { items: [], meals: [] },
        };
        const targetSession = currentSessions[sessionKey] || { items: [], meals: [] };
        const existingItems = Array.isArray(targetSession.items) ? targetSession.items : [];
        if (existingItems.some((i) => i.id === item.id)) return ev; // avoid duplicates

        const hasMenuPrice = item.price !== undefined && parseFloat(item.price) > 0;
        const defaultMode = hasMenuPrice ? 'unit' : 'fixed';

        const newItem = {
          id: item.id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          unit: item.unit || 'nos',
          pricingMode: defaultMode,
          quantity: defaultMode === 'unit' ? 1 : 0,
          fixedPrice: defaultMode === 'fixed' ? (hasMenuPrice ? String(item.price) : '') : '',
          fixedSelected: true,
        };

        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [sessionKey]: {
              ...targetSession,
              items: [...existingItems, newItem],
            },
          },
        };
      })
    );
  };

  const removeFoodItemFromSession = (eventId, sessionKey, itemId) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSessions = ev.sessions || {};
        const targetSession = currentSessions[sessionKey] || { items: [], meals: [] };
        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [sessionKey]: {
              ...targetSession,
              items: (targetSession.items || []).filter((i) => i.id !== itemId),
            },
          },
        };
      })
    );
  };

  const toggleSessionItemPricingMode = (eventId, sessionKey, itemId) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSessions = ev.sessions || {};
        const targetSession = currentSessions[sessionKey] || { items: [], meals: [] };
        const updatedItems = (targetSession.items || []).map((it) => {
          if (it.id !== itemId) return it;
          const nextMode = it.pricingMode === 'fixed' ? 'unit' : 'fixed';
          return {
            ...it,
            pricingMode: nextMode,
            quantity: nextMode === 'unit' && (!it.quantity || it.quantity === 0) ? 1 : it.quantity,
            fixedPrice: nextMode === 'fixed' && !it.fixedPrice ? (it.price > 0 ? String(it.price) : '') : it.fixedPrice,
            fixedSelected: true,
          };
        });
        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [sessionKey]: {
              ...targetSession,
              items: updatedItems,
            },
          },
        };
      })
    );
  };

  const updateSessionItemQuantity = (eventId, sessionKey, itemId, delta) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSessions = ev.sessions || {};
        const targetSession = currentSessions[sessionKey] || { items: [], meals: [] };
        const updatedItems = (targetSession.items || []).map((it) => {
          if (it.id !== itemId) return it;
          const currentQty = parseInt(it.quantity, 10) || 0;
          return {
            ...it,
            quantity: Math.max(0, currentQty + delta),
          };
        });
        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [sessionKey]: {
              ...targetSession,
              items: updatedItems,
            },
          },
        };
      })
    );
  };

  const setSessionItemQuantity = (eventId, sessionKey, itemId, val) => {
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSessions = ev.sessions || {};
        const targetSession = currentSessions[sessionKey] || { items: [], meals: [] };
        const updatedItems = (targetSession.items || []).map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            quantity: parsed,
          };
        });
        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [sessionKey]: {
              ...targetSession,
              items: updatedItems,
            },
          },
        };
      })
    );
  };

  const setSessionItemFixedPrice = (eventId, sessionKey, itemId, val) => {
    const sanitized = val.replace(/[^0-9.]/g, '');
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSessions = ev.sessions || {};
        const targetSession = currentSessions[sessionKey] || { items: [], meals: [] };
        const updatedItems = (targetSession.items || []).map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            fixedPrice: sanitized,
            fixedSelected: sanitized !== '' && parseFloat(sanitized) > 0,
          };
        });
        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [sessionKey]: {
              ...targetSession,
              items: updatedItems,
            },
          },
        };
      })
    );
  };

  const toggleSessionItemFixedSelection = (eventId, sessionKey, itemId) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSessions = ev.sessions || {};
        const targetSession = currentSessions[sessionKey] || { items: [], meals: [] };
        const updatedItems = (targetSession.items || []).map((it) => {
          if (it.id !== itemId) return it;
          const willBeOn = !it.fixedSelected;
          let newFixedPrice = it.fixedPrice;
          if (willBeOn && (!newFixedPrice || parseFloat(newFixedPrice) === 0)) {
            newFixedPrice = it.price > 0 ? String(it.price) : '';
          }
          return {
            ...it,
            fixedSelected: willBeOn,
            fixedPrice: newFixedPrice,
          };
        });
        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [sessionKey]: {
              ...targetSession,
              items: updatedItems,
            },
          },
        };
      })
    );
  };

  const openMealModal = (eventId, sessionKey = 'lunch') => {
    setModalEventId(eventId);
    setModalSessionKey(sessionKey);
    const defaultName = sessionKey === 'breakfast' ? 'Breakfast Feast Package' : sessionKey === 'dinner' ? 'Dinner Feast Package' : 'Full Meals Package';
    setTempMealName(defaultName);
    setTempMealPrice('');
    setTempMealQty('');
    setTempMealPricingMode('unit');
    setTempSelectedDishes([]);
    setModalVisible(true);
  };

  const saveCustomMeal = () => {
    if (tempMealPricingMode === 'fixed') {
      if (!tempMealPrice || parseFloat(tempMealPrice) <= 0) {
        Alert.alert('Missing Price', 'Please enter the flat total package price.');
        return;
      }
    } else {
      if (!tempMealPrice || !tempMealQty) {
        Alert.alert('Missing Info', 'Enter rate per plate and plate quantity for the meal.');
        return;
      }
    }

    const newMeal = {
      id: Date.now().toString(),
      name: tempMealName?.trim() || 'Meal Package',
      price: parseFloat(tempMealPrice) || 0,
      quantity: tempMealPricingMode === 'fixed' ? 1 : (parseInt(tempMealQty, 10) || 1),
      pricingMode: tempMealPricingMode,
      dishes: Array.isArray(tempSelectedDishes) ? tempSelectedDishes : [],
    };

    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== modalEventId) return ev;
        const currentSessions = ev.sessions || {
          breakfast: { items: [], meals: [] },
          lunch: { items: [], meals: [] },
          dinner: { items: [], meals: [] },
        };
        const targetSession = currentSessions[modalSessionKey] || { items: [], meals: [] };
        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [modalSessionKey]: {
              ...targetSession,
              meals: [...(targetSession.meals || []), newMeal],
            },
          },
        };
      })
    );

    setTempMealName('Full Meals Package');
    setTempMealPrice('');
    setTempMealQty('');
    setTempMealPricingMode('unit');
    setTempSelectedDishes([]);
    setModalVisible(false);
  };

  const removeMealFromSession = (eventId, sessionKey, mealId) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSessions = ev.sessions || {};
        const targetSession = currentSessions[sessionKey] || { items: [], meals: [] };
        return {
          ...ev,
          sessions: {
            ...currentSessions,
            [sessionKey]: {
              ...targetSession,
              meals: (targetSession.meals || []).filter((m) => m.id !== mealId),
            },
          },
        };
      })
    );
  };

  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const addNewDateEvent = () => {
    setEvents([
      ...events,
      {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        transportCharge: '',
        sessions: {
          breakfast: { items: [], meals: [] },
          lunch: { items: [], meals: [] },
          dinner: { items: [], meals: [] },
        },
      },
    ]);
  };

  const removeEvent = (eventId) => {
    if (events.length === 1) {
      Alert.alert('Action Denied', 'An invoice needs at least one date.');
      return;
    }
    setEvents(events.filter((ev) => ev.id !== eventId));
  };

  const setEventTransportCharge = (eventId, val) => {
    const cleanVal = val.replace(/[^0-9.]/g, '');
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          transportCharge: cleanVal,
        };
      })
    );
  };

  const calculateDaysTransport = () => {
    return (events || []).reduce((acc, ev) => acc + (parseFloat(ev.transportCharge) || 0), 0);
  };

  const calculateSessionTotal = (session) => {
    if (!session) return 0;
    let sum = 0;
    (session.items || []).forEach((item) => {
      if (item.pricingMode === 'fixed') {
        const amt = parseFloat(item.fixedPrice) || 0;
        const isSel = item.fixedSelected !== undefined ? item.fixedSelected : amt > 0;
        if (isSel && amt > 0) sum += amt;
      } else {
        const qty = parseInt(item.quantity, 10) || 0;
        const rate = parseFloat(item.price) || 0;
        if (qty > 0 && rate > 0) sum += qty * rate;
      }
    });
    (session.meals || []).forEach((meal) => {
      const p = parseFloat(meal.price) || 0;
      if (meal.pricingMode === 'fixed') {
        sum += p;
      } else {
        const q = parseInt(meal.quantity, 10) || 1;
        sum += p * q;
      }
    });
    return sum;
  };

  const calculateGrandTotal = () => {
    let total = 0;
    (events || []).forEach((ev) => {
      if (!ev) return;
      if (ev.sessions) {
        ['breakfast', 'lunch', 'dinner'].forEach((sKey) => {
          total += calculateSessionTotal(ev.sessions[sKey]);
        });
      }
    });
    if (Array.isArray(extraItems)) {
      extraItems.forEach((extra) => {
        total += parseFloat(extra.amount) || 0;
      });
    }
    return isNaN(total) ? 0 : total;
  };

  // Backwards compatibility wrappers
  const addTiffinToEvent = (eventId, item) => addFoodItemToSession(eventId, 'breakfast', item);
  const removeTiffinFromEvent = (eventId, itemId) => removeFoodItemFromSession(eventId, 'breakfast', itemId);
  const removeMeal = (eventId, mealId) => removeMealFromSession(eventId, 'lunch', mealId);
  const toggleDishSelection = (dishName) => {
    setTempSelectedDishes((prev) =>
      prev.includes(dishName) ? prev.filter((dish) => dish !== dishName) : [...prev, dishName]
    );
  };

  const saveExtraItem = () => {
    if (!tempExtraDesc.trim() || !tempExtraAmount) {
      Alert.alert('Missing Info', 'Enter description and amount.');
      return;
    }
    setExtraItems([
      ...extraItems,
      { id: Date.now().toString(), description: tempExtraDesc.trim(), amount: parseFloat(tempExtraAmount) || 0 }
    ]);
    setTempExtraDesc('');
    setTempExtraAmount('');
    setExtraModalVisible(false);
  };

  const removeExtraItem = (id) => {
    setExtraItems(extraItems.filter(item => item.id !== id));
  };

  const handleBackNavigation = async () => {
    if (!editInvoice && checkHasContent()) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      await saveDraft({
        clientName,
        clientPhone,
        transportCharge,
        advanceAmount,
        extraItems,
        events,
        updatedAt: new Date().toISOString(),
      });
    }

    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CateringDashboard');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER - Always shows Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackNavigation} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>
              {editInvoice ? 'Edit' : 'Create'} <Text style={{ color: theme.primary }}>Bill.</Text>
            </Text>
            <Text style={styles.subtitleHeader}>
              {editInvoice ? 'Update billing & quantities' : 'New Catering & Tiffin Order'}
            </Text>
          </View>
        </View>

        {/* DRAFT RESTORED BANNER */}
        {hasRestoredDraft && !editInvoice && (
          <View style={styles.draftBanner}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="bookmark" size={15} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.draftBannerTitle}>Draft Restored</Text>
              </View>
              <Text style={styles.draftBannerSubtitle}>
                Your unfinished bill was automatically saved and restored.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.discardDraftBtn}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  'Start Fresh?',
                  'This will discard your current draft and clear all fields for a fresh bill.',
                  [
                    { text: 'Keep Draft', style: 'cancel' },
                    {
                      text: 'Discard & Start Fresh',
                      style: 'destructive',
                      onPress: async () => {
                        await clearDraft();
                        setHasRestoredDraft(false);
                        resetForm();
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.discardDraftText}>Start Fresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CUSTOMER CARD */}
        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="business" size={20} color={theme.text} />
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setCustomerModalVisible(true)} style={styles.pickClientBtn}>
              <Text style={styles.pickClientText}>Select Saved</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Client Name / Company Name"
              placeholderTextColor={theme.textMuted}
              value={clientName}
              onChangeText={setClientName}
            />
          </View>
          <View style={[styles.inputWrapper, { marginTop: 10 }]}>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              value={clientPhone}
              onChangeText={setClientPhone}
            />
          </View>
        </View>

        {/* 3 SESSION CONFIGS */}
        {(() => {
          return null;
        })()}

        {/* EVENT DAYS SECTION */}
        {(events || []).map((ev, index) => {
          const SESSION_DEFS = [
            {
              key: 'breakfast',
              title: 'Breakfast',
              icon: 'sunny-outline',
              accentColor: '#FF6B55',
              bgTint: isDarkMode ? '#3B1F1B' : '#FFE2D5',
              textColor: isDarkMode ? '#FFAAA0' : '#B84724',
              subtext: 'Morning tiffins, coffee & breakfast packages',
            },
            {
              key: 'lunch',
              title: 'Lunch',
              icon: 'restaurant-outline',
              accentColor: '#D97706',
              bgTint: isDarkMode ? '#3A2E12' : '#FFF0BD',
              textColor: isDarkMode ? '#FDE047' : '#92610A',
              subtext: 'Thali meals, lunch specials, sweets & curries',
            },
            {
              key: 'dinner',
              title: 'Dinner',
              icon: 'moon-outline',
              accentColor: '#7C3AED',
              bgTint: isDarkMode ? '#2D1B4E' : '#E9DFFF',
              textColor: isDarkMode ? '#C4B5FD' : '#5E4B8B',
              subtext: 'Evening tiffins, dinner feasts & dessert packages',
            },
          ];

          return (
          <View key={ev.id || index} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.eventBadgeCircle}>
                  <Text style={styles.eventBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.eventDayText}>Service Day {index + 1}</Text>
              </View>
              {events.length > 1 && (
                <TouchableOpacity onPress={() => removeEvent(ev.id)} style={styles.deleteCircle}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cardPadding}>
              {/* DATE SELECTOR BUTTON */}
              <TouchableOpacity
                style={styles.datePickerBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveEventId(ev.id);
                  setShowPicker(true);
                }}
              >
                <View style={styles.row}>
                  <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                  <Text style={styles.datePickerText}>
                    {' '}{formatDateSafe(ev.date)}
                  </Text>
                </View>
                <View style={styles.changeDatePill}>
                  <Text style={styles.changeText}>Change Date</Text>
                </View>
              </TouchableOpacity>

              {/* SERVICE DAY TRANSPORTATION ROW */}
              <View style={styles.eventTransportCard}>
                <View style={styles.eventTransportLeft}>
                  <View style={styles.eventTransportIcon}>
                    <Ionicons name="car-outline" size={17} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTransportTitle}>Day {index + 1} Transport</Text>
                    <Text style={styles.eventTransportSub}>Vehicle & delivery charge for this day</Text>
                  </View>
                </View>
                <View style={styles.eventTransportInputWrap}>
                  <Text style={styles.eventTransportCurrency}>₹</Text>
                  <TextInput
                    style={styles.eventTransportInput}
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={ev.transportCharge !== undefined && ev.transportCharge !== null ? String(ev.transportCharge) : ''}
                    onChangeText={(val) => setEventTransportCharge(ev.id, val)}
                  />
                </View>
              </View>

              {/* 3 SESSIONS: BREAKFAST, LUNCH, DINNER */}
              {SESSION_DEFS.map((sDef) => {
                const session = ev.sessions?.[sDef.key] || { items: [], meals: [] };
                const sessionTotal = calculateSessionTotal(session);
                const items = session.items || [];
                const meals = session.meals || [];
                const isEmpty = items.length === 0 && meals.length === 0;

                return (
                  <View key={sDef.key} style={styles.sessionCard}>
                    {/* SESSION HEADER */}
                    <View style={styles.sessionHeaderRow}>
                      <View style={[styles.sessionIconBox, { backgroundColor: sDef.bgTint }]}>
                        <Ionicons name={sDef.icon} size={18} color={sDef.accentColor} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.sessionTitle}>{sDef.title}</Text>
                          {sessionTotal > 0 ? (
                            <View style={[styles.sessionTotalPill, { backgroundColor: sDef.bgTint }]}>
                              <Text style={[styles.sessionTotalPillText, { color: sDef.textColor }]}>
                                ₹{sessionTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.sessionSubtext}>{sDef.subtext}</Text>
                      </View>
                    </View>

                    {/* ITEMS IN THIS SESSION */}
                    {items.map((item) => {
                      const isFixed = item.pricingMode === 'fixed';
                      const hasMenuPrice = item.price !== undefined && parseFloat(item.price) > 0;
                      const currentQty = parseInt(item.quantity, 10) || 0;
                      const fixedVal = item.fixedPrice !== undefined && item.fixedPrice !== null ? String(item.fixedPrice) : '';
                      const fixedAmt = parseFloat(fixedVal) || 0;
                      const isFixedSelected = item.fixedSelected !== undefined ? item.fixedSelected : fixedAmt > 0;
                      const itemRowTotal = isFixed
                        ? (isFixedSelected ? fixedAmt : 0)
                        : currentQty * (parseFloat(item.price) || 0);

                      return (
                        <View key={item.id} style={[styles.foodItemCard, itemRowTotal > 0 && styles.foodItemCardActive]}>
                          <View style={styles.foodItemHeader}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={styles.itemName}>{item.name}</Text>
                              <Text style={styles.itemSubText}>
                                {isFixed
                                  ? fixedAmt > 0
                                    ? `Total: ₹${fixedAmt}`
                                    : hasMenuPrice
                                    ? `Flat Total (Menu Rate: ₹${item.price})`
                                    : 'Direct Total (e.g. ₹500)'
                                  : hasMenuPrice
                                  ? `Rate: ₹${item.price} per ${item.unit || 'nos'}`
                                  : 'Rate: ₹0 (Flexible)'}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <TouchableOpacity
                                style={[styles.modeToggleChip, isFixed ? styles.modeToggleChipFixed : styles.modeToggleChipUnit]}
                                activeOpacity={0.75}
                                onPress={() => toggleSessionItemPricingMode(ev.id, sDef.key, item.id)}
                              >
                                <Ionicons
                                  name={isFixed ? 'cash-outline' : 'calculator-outline'}
                                  size={13}
                                  color={isFixed ? theme.accentPurple : theme.primary}
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={[styles.modeToggleText, { color: isFixed ? theme.accentPurple : theme.primary }]}>
                                  {isFixed ? 'Direct Total' : 'By Qty'}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.removeItemBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => removeFoodItemFromSession(ev.id, sDef.key, item.id)}
                              >
                                <Ionicons name="trash-outline" size={17} color={theme.error} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.foodInputRow}>
                            {isFixed ? (
                              <View style={styles.fixedInputWrap}>
                                <TouchableOpacity
                                  style={[styles.fixedCheckbox, isFixedSelected && styles.fixedCheckboxChecked]}
                                  activeOpacity={0.8}
                                  onPress={() => toggleSessionItemFixedSelection(ev.id, sDef.key, item.id)}
                                >
                                  <Ionicons
                                    name={isFixedSelected ? 'checkmark' : 'add'}
                                    size={16}
                                    color={isFixedSelected ? '#FFFFFF' : theme.textSecondary}
                                  />
                                  <Text style={[styles.fixedCheckboxLabel, isFixedSelected && styles.fixedCheckboxLabelChecked]}>
                                    {isFixedSelected ? 'In Bill' : 'Include'}
                                  </Text>
                                </TouchableOpacity>

                                <View style={[styles.fixedAmountInputBox, isFixedSelected && styles.fixedAmountInputBoxActive]}>
                                  <Text style={styles.currencySymbol}>₹</Text>
                                  <TextInput
                                    style={styles.fixedPriceInput}
                                    keyboardType="numeric"
                                    placeholder="Total ₹ (e.g. 500)"
                                    placeholderTextColor={theme.textMuted}
                                    value={String(fixedVal)}
                                    onChangeText={(val) => setSessionItemFixedPrice(ev.id, sDef.key, item.id, val)}
                                    selectTextOnFocus
                                  />
                                </View>
                              </View>
                            ) : (
                              <View style={styles.unitInputWrap}>
                                <View style={styles.counter}>
                                  <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => updateSessionItemQuantity(ev.id, sDef.key, item.id, -1)}
                                  >
                                    <Ionicons name="remove" size={18} color={theme.text} />
                                  </TouchableOpacity>
                                  <TextInput
                                    style={styles.qtyInput}
                                    keyboardType="number-pad"
                                    value={String(currentQty)}
                                    onChangeText={(value) => setSessionItemQuantity(ev.id, sDef.key, item.id, value)}
                                    selectTextOnFocus
                                    maxLength={4}
                                  />
                                  <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => updateSessionItemQuantity(ev.id, sDef.key, item.id, 1)}
                                  >
                                    <Ionicons name="add" size={18} color={theme.text} />
                                  </TouchableOpacity>
                                </View>

                                {currentQty > 0 && (
                                  <View style={styles.itemTotalTag}>
                                    <Text style={styles.itemTotalTagText}>
                                      ₹{(currentQty * (parseFloat(item.price) || 0)).toFixed(0)}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}

                    {/* MEAL PACKAGES IN THIS SESSION */}
                    {meals.map((meal) => {
                      const isFixed = meal.pricingMode === 'fixed';
                      const mealTotal = isFixed
                        ? (parseFloat(meal.price) || 0)
                        : (parseFloat(meal.price) || 0) * (parseInt(meal.quantity, 10) || 1);

                      return (
                        <View key={meal.id} style={styles.addedMealCard}>
                          <View style={styles.mealInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.mealNameText}>{meal.name}</Text>
                              {isFixed && (
                                <View style={{ backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 9, fontWeight: '700', color: isDarkMode ? '#A5B4FC' : '#4F46E5' }}>LUMP SUM</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.mealDetailText}>
                              {isFixed
                                ? `Flat Package Total: ₹${mealTotal.toFixed(2)}${meal.quantity > 1 ? ` (~${meal.quantity} guests)` : ''}`
                                : `${meal.quantity} plates × ₹${meal.price} = ₹${mealTotal.toFixed(2)}`}
                            </Text>
                            {Array.isArray(meal.dishes) && meal.dishes.length > 0 && (
                              <Text style={styles.dishListText}>Dishes: {meal.dishes.join(', ')}</Text>
                            )}
                          </View>
                          <TouchableOpacity onPress={() => removeMealFromSession(ev.id, sDef.key, meal.id)} style={{ padding: 6 }}>
                            <Ionicons name="trash-outline" size={20} color={theme.error} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    {/* ACTION BUTTONS FOR THIS SESSION */}
                    <View style={styles.sessionActionsRow}>
                      <TouchableOpacity
                        style={styles.sessionAddBtn}
                        activeOpacity={0.8}
                        onPress={() => openFoodItemPicker(ev.id, sDef.key)}
                      >
                        <Ionicons name="cafe-outline" size={15} color={theme.primary} style={{ marginRight: 5 }} />
                        <Text style={styles.sessionAddBtnText}>+ Food Item</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.sessionAddBtn, styles.sessionAddMealBtn]}
                        activeOpacity={0.8}
                        onPress={() => openMealModal(ev.id, sDef.key)}
                      >
                        <Ionicons name="restaurant-outline" size={15} color={theme.accentPurple} style={{ marginRight: 5 }} />
                        <Text style={[styles.sessionAddBtnText, { color: theme.accentPurple }]}>+ Thali / Package</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ); })}

        {/* ADD ANOTHER DATE BUTTON */}
        <TouchableOpacity style={styles.addDateBtn} onPress={addNewDateEvent} activeOpacity={0.85}>
          <Ionicons name="calendar" size={18} color={theme.primary} />
          <Text style={styles.addDateBtnText}> Add Another Event Date</Text>
        </TouchableOpacity>
        
        {/* TRANSPORT CHARGE */}
        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="car-outline" size={20} color={theme.text} />
            <Text style={styles.sectionTitle}>
              {events.length > 1 ? 'Additional / General Transport (+)' : 'Transport Charge (+)'}
            </Text>
          </View>
          <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.primary, marginRight: 6 }}>₹</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={transportCharge}
              onChangeText={setTransportCharge}
            />
          </View>
          {calculateDaysTransport() > 0 && (
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDarkMode ? '#1E1B2E' : '#F5F3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: isDarkMode ? '#A5B4FC' : '#6D28D9' }}>Day-wise Transport Total ({events.filter(e => parseFloat(e.transportCharge) > 0).length} Days):</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? '#A5B4FC' : '#6D28D9' }}>+₹{calculateDaysTransport().toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* EXTRA ITEMS SECTION */}
        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="list-circle-outline" size={20} color={theme.text} />
            <Text style={styles.sectionTitle}>Extra Items / Charges</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setExtraModalVisible(true)} style={styles.pickClientBtn}>
              <Text style={styles.pickClientText}>+ Add Extra</Text>
            </TouchableOpacity>
          </View>
          {extraItems.length === 0 ? (
             <Text style={{ color: theme.textSecondary, fontSize: 13, fontStyle: 'italic' }}>No extra items added.</Text>
          ) : (
            extraItems.map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: theme.text, fontSize: 15, flex: 1 }}>{item.description}</Text>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700', marginRight: 15 }}>₹{parseFloat(item.amount || 0).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeExtraItem(item.id)}>
                  <Ionicons name="trash-outline" size={18} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ADVANCE PAYMENT SECTION */}
        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="cash-outline" size={20} color={theme.text} />
            <Text style={styles.sectionTitle}>Advance Received (-)</Text>
          </View>
          <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.success, marginRight: 6 }}>₹</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={advanceAmount}
              onChangeText={setAdvanceAmount}
            />
          </View>
        </View>
      </ScrollView>

      {/* UNIVERSAL THEMED MODAL DATE PICKER */}
      {showPicker && (
        <CustomDatePicker
          visible={showPicker}
          initialDate={events.find((ev) => ev.id === activeEventId)?.date || new Date().toISOString()}
          onSelect={(selectedDate) => {
             setShowPicker(false);
             if (selectedDate && activeEventId) {
               setEvents(
                 events.map((ev) =>
                   ev.id === activeEventId ? { ...ev, date: selectedDate.toISOString() } : ev
                 )
               );
             }
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* FLOATING CHECKOUT BAR */}
      <View style={styles.footerContainer}>
        <LinearGradient
          colors={isDarkMode ? ['#131B2E', '#0B101D'] : ['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.footerWrapper}
        >
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>
              ₹{(calculateGrandTotal() + (calculateDaysTransport() + (parseFloat(transportCharge) || 0))).toFixed(2)}
            </Text>
            {(calculateDaysTransport() + (parseFloat(transportCharge) || 0)) > 0 && (
              <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 1, fontWeight: '600' }}>
                (incl. ₹{(calculateDaysTransport() + (parseFloat(transportCharge) || 0)).toFixed(0)} transport)
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.previewBtn}
            disabled={isSavingBill}
            activeOpacity={0.88}
            onPress={async () => {
              if (isSavingBill) return;
              if (!clientName.trim()) {
                Alert.alert('Required', 'Please enter a customer name.');
                return;
              }

              setIsSavingBill(true);

              try {
                const subTotal = calculateGrandTotal();
                const taxAmount = 0;
                const totalTransport = calculateDaysTransport() + (parseFloat(transportCharge) || 0);
                const grandTotal = subTotal + totalTransport;

                // Deduct stock levels safely across all sessions
                (events || []).forEach((ev) => {
                  if (!ev || !ev.sessions) return;
                  ['breakfast', 'lunch', 'dinner'].forEach((sKey) => {
                    const sess = ev.sessions[sKey];
                    if (!sess) return;
                    (sess.items || []).forEach((it) => {
                      const qty = parseInt(it.quantity, 10) || 0;
                      if (qty > 0) {
                        const mItem = (tiffinItems || []).find((t) => t.id === it.id);
                        if (mItem) {
                          const newStock = Math.max(0, (mItem.stock || 0) - qty);
                          updateTiffinItem({ ...mItem, stock: newStock });
                        }
                      }
                    });
                  });
                });

                const formattedEvents = (events || []).map((ev) => {
                  const selectedTiffins = [];
                  const tiffinQuantities = {};
                  const fixedPrices = {};
                  const pricingModes = {};
                  const fixedSelected = {};
                  const addedMeals = [];

                  ['breakfast', 'lunch', 'dinner'].forEach((sKey) => {
                    const sess = ev.sessions?.[sKey];
                    if (sess) {
                      (sess.items || []).forEach((it) => {
                        selectedTiffins.push(it.id);
                        tiffinQuantities[it.id] = it.quantity || 0;
                        fixedPrices[it.id] = it.fixedPrice || '';
                        pricingModes[it.id] = it.pricingMode || 'unit';
                        fixedSelected[it.id] = it.fixedSelected !== undefined ? it.fixedSelected : true;
                      });
                      (sess.meals || []).forEach((m) => {
                        addedMeals.push(m);
                      });
                    }
                  });

                  return {
                    ...ev,
                    transportCharge: parseFloat(ev.transportCharge) || 0,
                    selectedTiffins,
                    tiffinQuantities,
                    fixedPrices,
                    pricingModes,
                    fixedSelected,
                    addedMeals,
                  };
                });

                const newInvoice = {
                  id: editInvoice ? editInvoice.id : Date.now().toString(),
                  clientName: clientName.trim(),
                  clientPhone: clientPhone.trim(),
                  date: editInvoice ? editInvoice.date : new Date().toLocaleDateString('en-IN'),
                  events: formattedEvents,
                  subTotal,
                  taxAmount,
                  grandTotal: grandTotal.toFixed(2),
                  transportCharge: totalTransport,
                  advanceAmount: advanceAmount ? parseFloat(advanceAmount) : 0,
                  amountReceived: advanceAmount ? parseFloat(advanceAmount) : (editInvoice?.amountReceived || 0),
                  extraItems,
                };
                
                if (editInvoice) {
                  await updateInvoice(newInvoice.id, newInvoice);
                } else {
                  await addInvoice(newInvoice);
                }

                // Clear the auto-saved draft since bill is finalized and permanently saved
                if (autoSaveTimerRef.current) {
                  clearTimeout(autoSaveTimerRef.current);
                }
                await clearDraft();
                setHasRestoredDraft(false);

                navigation.navigate('InvoicePreview', {
                  id: newInvoice.id,
                  clientName: clientName.trim(),
                  clientPhone: clientPhone.trim(),
                  date: newInvoice.date,
                  events: formattedEvents,
                  subTotal,
                  taxAmount,
                  grandTotal: grandTotal.toFixed(2),
                  transportCharge: totalTransport,
                  advanceAmount: advanceAmount ? parseFloat(advanceAmount) : 0,
                  extraItems,
                  isPreviewOnly: true,
                  isSaved: true,
                });
              } catch (e) {
                console.error('Error generating and saving bill:', e);
                Alert.alert('Save Error', 'Unable to record bill. Please try again.');
              } finally {
                setIsSavingBill(false);
              }
            }}
          >
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.previewBtnGradient}
            >
              <Text style={styles.previewBtnText}>
                {isSavingBill ? 'Saving Bill...' : 'Generate Bill'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* EXTRA ITEMS MODAL */}
      <Modal visible={isExtraModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Extra Item</Text>
            
            <View style={styles.modalInputSection}>
              <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Description (e.g. Banana Leaves, Gas)"
                    placeholderTextColor={theme.textMuted}
                    value={tempExtraDesc}
                    onChangeText={setTempExtraDesc}
                  />
              </View>
              <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Total Amount (₹)"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={tempExtraAmount}
                    onChangeText={setTempExtraAmount}
                  />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setExtraModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveExtraItem} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BUILD MEALS MODAL */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Dishes for Thali</Text>
            <ScrollView style={styles.modalScroll}>
              {(mealDishes || []).map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.checkboxRow}
                  onPress={() => toggleDishSelection(dish.name)}
                >
                  <Ionicons
                    name={tempSelectedDishes.includes(dish.name) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={tempSelectedDishes.includes(dish.name) ? theme.primary : theme.textMuted}
                  />
                  <Text style={styles.checkboxLabel}>{dish.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalInputSection}>
              {/* PRICING MODE TOGGLE */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                borderRadius: 10,
                padding: 3,
                marginBottom: 12,
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: tempMealPricingMode === 'unit' ? (isDarkMode ? '#334155' : '#FFFFFF') : 'transparent',
                    elevation: tempMealPricingMode === 'unit' ? 2 : 0,
                    shadowColor: '#000',
                    shadowOpacity: tempMealPricingMode === 'unit' ? 0.08 : 0,
                    shadowRadius: 2,
                  }}
                  onPress={() => setTempMealPricingMode('unit')}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: tempMealPricingMode === 'unit' ? theme.primary : theme.textMuted
                  }}>
                    Per-Plate Rate
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: tempMealPricingMode === 'fixed' ? (isDarkMode ? '#334155' : '#FFFFFF') : 'transparent',
                    elevation: tempMealPricingMode === 'fixed' ? 2 : 0,
                    shadowColor: '#000',
                    shadowOpacity: tempMealPricingMode === 'fixed' ? 0.08 : 0,
                    shadowRadius: 2,
                  }}
                  onPress={() => setTempMealPricingMode('fixed')}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: tempMealPricingMode === 'fixed' ? theme.primary : theme.textMuted
                  }}>
                    Flat Total Price
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Package Label (e.g. VIP Lunch Package)"
                    placeholderTextColor={theme.textMuted}
                    value={tempMealName}
                    onChangeText={setTempMealName}
                  />
              </View>

              {tempMealPricingMode === 'unit' ? (
                <View style={styles.row}>
                  <View style={[styles.modalInputWrapper, styles.halfInput, styles.rightGap]}>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Rate per Plate (₹)"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                        value={tempMealPrice}
                        onChangeText={setTempMealPrice}
                      />
                  </View>
                  <View style={[styles.modalInputWrapper, styles.halfInput, styles.leftGap]}>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Plate Qty"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                        value={tempMealQty}
                        onChangeText={setTempMealQty}
                      />
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.row}>
                    <View style={[styles.modalInputWrapper, styles.halfInput, styles.rightGap]}>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Flat Total Price (₹)"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="numeric"
                          value={tempMealPrice}
                          onChangeText={setTempMealPrice}
                        />
                    </View>
                    <View style={[styles.modalInputWrapper, styles.halfInput, styles.leftGap]}>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Approx. Guests (Opt)"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="numeric"
                          value={tempMealQty}
                          onChangeText={setTempMealQty}
                        />
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4, fontStyle: 'italic' }}>
                    💡 Billed as total amount. Rate and quantity will not be printed on the invoice.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setTempMealPricingMode('unit'); setModalVisible(false); }} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveCustomMeal} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Add Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOMER PICKER MODAL */}
      <Modal visible={isCustomerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {(!customers || customers.length === 0) ? (
                <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No clients saved yet.</Text>
              ) : (
                customers.map(c => (
                  <TouchableOpacity
                    key={c.id || c._id}
                    style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}
                    onPress={() => {
                      setClientName(c.name || '');
                      setClientPhone(c.phone || '');
                      setCustomerModalVisible(false);
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{c.name}</Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>{c.phone}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FOOD ITEM PICKER MODAL */}
      <Modal visible={isFoodPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.foodPickerModalContent]}>
            {/* Modal Header */}
            <View style={styles.pickerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select Food Item</Text>
                <Text style={styles.pickerSubTitle}>
                  Service Day {events.findIndex((e) => e.id === foodPickerEventId) + 1} • {foodPickerSessionKey ? foodPickerSessionKey.toUpperCase() : 'BREAKFAST'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFoodPickerVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={28} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={styles.pickerSearchBar}>
              <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search food item (e.g. Dosa, Upma)..."
                placeholderTextColor={theme.textMuted}
                value={foodSearchQuery}
                onChangeText={setFoodSearchQuery}
                autoCorrect={false}
              />
              {foodSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setFoodSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Items List */}
            <ScrollView style={styles.foodPickerScroll} showsVerticalScrollIndicator={false}>
              {filteredFoodItems.length === 0 ? (
                <View style={styles.emptyPickerWrap}>
                  <Ionicons name="search" size={32} color={theme.textMuted} />
                  <Text style={styles.emptyPickerText}>
                    {tiffinItems && tiffinItems.length === 0
                      ? 'No items in menu yet. Add items in Manage Menu.'
                      : 'No matching food items found.'}
                  </Text>
                </View>
              ) : (
                filteredFoodItems.map((item) => {
                  const activeEvent = events.find((e) => e.id === foodPickerEventId);
                  const targetSession = activeEvent?.sessions?.[foodPickerSessionKey];
                  const isAlreadyAdded =
                    targetSession &&
                    Array.isArray(targetSession.items) &&
                    targetSession.items.some((i) => i.id === item.id);
                  const hasMenuPrice = item.price !== undefined && parseFloat(item.price) > 0;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.pickerItemRow,
                        isAlreadyAdded && styles.pickerItemRowAdded,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (isAlreadyAdded) {
                          removeFoodItemFromSession(foodPickerEventId, foodPickerSessionKey, item.id);
                        } else {
                          addFoodItemToSession(foodPickerEventId, foodPickerSessionKey, item);
                        }
                      }}
                    >
                      <View style={styles.pickerItemInfo}>
                        <Text style={[styles.pickerItemName, isAlreadyAdded && { color: theme.primary }]}>
                          {item.name}
                        </Text>
                        <View style={styles.pickerItemBadgeRow}>
                          <Text style={styles.pickerItemPriceText}>
                            {hasMenuPrice ? `₹${item.price} / ${item.unit || 'nos'}` : 'Direct Total (Flexible)'}
                          </Text>
                          {item.category ? (
                            <View style={styles.pickerCategoryChip}>
                              <Text style={styles.pickerCategoryText}>{item.category}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.pickerActionBtn,
                          isAlreadyAdded ? styles.pickerActionBtnAdded : styles.pickerActionBtnAdd,
                        ]}
                      >
                        <Ionicons
                          name={isAlreadyAdded ? 'checkmark-circle' : 'add-circle'}
                          size={18}
                          color={isAlreadyAdded ? '#FFFFFF' : theme.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.pickerActionText,
                            isAlreadyAdded ? styles.pickerActionTextAdded : styles.pickerActionTextAdd,
                          ]}
                        >
                          {isAlreadyAdded ? 'Added' : 'Add'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Bottom Done Bar */}
            <TouchableOpacity
              style={styles.pickerDoneBtn}
              activeOpacity={0.85}
              onPress={() => setFoodPickerVisible(false)}
            >
              <Text style={styles.pickerDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 10 
  },
  backBtn: { 
    padding: 8, 
    marginRight: 10,
    backgroundColor: theme.inputBackground,
    borderRadius: 14,
  },
  mainTitle: { fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  subtitleHeader: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginTop: 2 },
  
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
    borderWidth: 1,
    borderColor: isDarkMode ? '#059669' : '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  draftBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: isDarkMode ? '#34D399' : '#065F46',
  },
  draftBannerSubtitle: {
    fontSize: 11,
    color: isDarkMode ? '#A7F3D0' : '#047857',
  },
  discardDraftBtn: {
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
    borderWidth: 1,
    borderColor: isDarkMode ? '#EF4444' : '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discardDraftText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  
  scrollContent: { paddingBottom: 180, paddingHorizontal: 20 },
  
  clientCard: {
    backgroundColor: theme.card,
    padding: 18,
    borderRadius: 22,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 10, elevation: 3,
  },
  iconHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: theme.text, marginLeft: 8 },
  pickClientBtn: { 
    backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  pickClientText: { color: theme.primary, fontSize: 12, fontWeight: '700' },
  inputWrapper: {
    backgroundColor: theme.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  input: { paddingVertical: 14, fontSize: 15, color: theme.text },
  
  eventCard: {
    backgroundColor: theme.card,
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 10, elevation: 3,
  },
  eventHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: theme.border,
    backgroundColor: isDarkMode ? '#131B2E' : '#F8FAFC'
  },
  eventBadgeCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  eventBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  eventDayText: { color: theme.text, fontSize: 15, fontWeight: '800' },
  deleteCircle: { 
    backgroundColor: theme.error, 
    width: 26, height: 26, borderRadius: 13, 
    justifyContent: 'center', alignItems: 'center'
  },
  
  cardPadding: { padding: 18 },
  datePickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.inputBackground, padding: 14, borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: theme.border,
  },
  datePickerText: { fontSize: 14, fontWeight: '700', color: theme.text, marginLeft: 6 },
  changeDatePill: {
    backgroundColor: theme.surface,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  changeText: { color: theme.primary, fontSize: 11, fontWeight: '800' },
  
  eventTransportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#1E1B2E' : '#F5F3FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? '#4338CA' : '#DDD6FE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  eventTransportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTransportIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: isDarkMode ? '#312E81' : '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  eventTransportTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: isDarkMode ? '#E0E7FF' : '#4338CA',
  },
  eventTransportSub: {
    fontSize: 10,
    color: isDarkMode ? '#A5B4FC' : '#6D28D9',
    marginTop: 1,
  },
  eventTransportInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#4338CA' : '#C4B5FD',
    paddingHorizontal: 10,
    height: 38,
    minWidth: 90,
  },
  eventTransportCurrency: {
    fontSize: 14,
    fontWeight: '900',
    color: isDarkMode ? '#A5B4FC' : '#6D28D9',
    marginRight: 4,
  },
  eventTransportInput: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    minWidth: 60,
    paddingVertical: 2,
  },

  sessionCard: {
    backgroundColor: isDarkMode ? '#171B26' : '#F9F8FD',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isDarkMode ? '#282F40' : '#EAE7F2',
    padding: 14,
    marginBottom: 14,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  sessionTotalPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  sessionTotalPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sessionSubtext: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 1,
  },
  sessionActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  sessionAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primaryLight,
    paddingVertical: 9,
    borderRadius: 12,
  },
  sessionAddMealBtn: {
    backgroundColor: isDarkMode ? '#2E1065' : '#F5F3FF',
  },
  sessionAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  
  subHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4,
  },
  sectionHelperText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 12,
    lineHeight: 15,
  },
  mealHeaderSpacing: { marginTop: 24 },
  subTitle: { fontSize: 14, fontWeight: '800', color: theme.text, marginLeft: 8 },
  
  foodItemCard: {
    backgroundColor: theme.inputBackground,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  foodItemCardActive: {
    borderColor: theme.primary,
    backgroundColor: isDarkMode ? '#1E1B2E' : '#FFF9F5',
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: { fontSize: 15, fontWeight: '800', color: theme.text },
  itemSubText: { color: theme.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '500' },
  
  modeToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeToggleChipFixed: {
    backgroundColor: isDarkMode ? '#2B1A3A' : '#F5F3FF',
    borderColor: theme.accentPurple,
  },
  modeToggleChipUnit: {
    backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA',
    borderColor: theme.primary,
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  
  foodInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fixedInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  fixedCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  fixedCheckboxChecked: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  fixedCheckboxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    marginLeft: 4,
  },
  fixedCheckboxLabelChecked: {
    color: '#FFFFFF',
  },
  fixedAmountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 10,
    width: 160,
  },
  fixedAmountInputBoxActive: {
    borderColor: theme.primary,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.primary,
    marginRight: 4,
  },
  fixedPriceInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  
  unitInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  counter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.surface, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: theme.border,
    padding: 3 
  },
  counterBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  qtyInput: {
    width: 44, textAlign: 'center', fontSize: 15, fontWeight: '800', color: theme.text,
  },
  itemTotalTag: {
    backgroundColor: isDarkMode ? '#063B26' : '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  itemTotalTagText: {
    color: theme.success,
    fontWeight: '800',
    fontSize: 13,
  },
  
  buildMealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 14, marginTop: 14,
    borderWidth: 1, borderColor: theme.primary, borderStyle: 'dashed', 
    backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA'
  },
  buildMealBtnText: { color: theme.primary, fontWeight: '800', fontSize: 13, marginLeft: 4 },
  
  addedMealCard: {
    backgroundColor: theme.surface, padding: 14, borderRadius: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: theme.border,
  },
  mealInfo: { flex: 1 },
  mealNameText: { fontWeight: '800', color: theme.text, fontSize: 14 },
  mealDetailText: { fontSize: 12, color: theme.primary, marginTop: 3, fontWeight: '700' },
  dishListText: { fontSize: 11, color: theme.textSecondary, marginTop: 3 },
  
  addDateBtn: {
    flexDirection: 'row', backgroundColor: theme.card,
    padding: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: theme.border,
  },
  addDateBtnText: { color: theme.text, fontSize: 14, fontWeight: '800', marginLeft: 6 },
  
  footerContainer: {
    position: 'absolute', bottom: 100,
    left: 0, right: 0, paddingHorizontal: 20,
  },
  footerWrapper: {
    borderRadius: 22,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDarkMode ? 0.4 : 0.2,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
  },
  totalContainer: { flex: 1, paddingLeft: 10 },
  totalLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5 },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  previewBtn: { 
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  previewBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  previewBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalContent: { 
    backgroundColor: theme.card, borderRadius: 24, padding: 20, maxHeight: '80%',
    borderWidth: 1, borderColor: theme.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 16, textAlign: 'center' },
  modalScroll: { marginBottom: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  checkboxLabel: { fontSize: 14, marginLeft: 10, color: theme.text, fontWeight: '600' },
  
  modalInputSection: { marginTop: 6 },
  modalInputWrapper: { 
    backgroundColor: theme.inputBackground, borderRadius: 14, paddingHorizontal: 14, marginBottom: 10,
    borderWidth: 1, borderColor: theme.border,
  },
  modalInput: { paddingVertical: 12, fontSize: 14, color: theme.text },
  halfInput: { flex: 1 },
  rightGap: { marginRight: 6 },
  leftGap: { marginLeft: 6 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  cancelBtn: { padding: 14, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: theme.textSecondary, fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: theme.primary, paddingVertical: 14, flex: 1, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#4D291C' : '#FFD9CC',
  },
  headerAddBtnText: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 3,
  },
  emptyFoodCard: {
    backgroundColor: theme.inputBackground,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emptyFoodIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyFoodTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  emptyFoodSub: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 14,
    lineHeight: 17,
  },
  addFoodPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addFoodPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  removeItemBtn: {
    padding: 7,
    marginLeft: 8,
    backgroundColor: isDarkMode ? '#3B171A' : '#FEE2E2',
    borderRadius: 9,
  },
  addMoreFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? '#2A1A14' : '#FFF5F0',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? '#4D291C' : '#FFD4C2',
    marginTop: 4,
    marginBottom: 12,
  },
  addMoreFoodBtnText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  foodPickerModalContent: {
    maxHeight: '85%',
    paddingBottom: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  pickerSubTitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  pickerSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 0,
  },
  foodPickerScroll: {
    maxHeight: 320,
    marginBottom: 14,
  },
  emptyPickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyPickerText: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pickerItemRowAdded: {
    borderColor: theme.primary,
    backgroundColor: isDarkMode ? '#231B2A' : '#FFF9F6',
  },
  pickerItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  pickerItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
  pickerItemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pickerItemPriceText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  pickerCategoryChip: {
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  pickerCategoryText: {
    fontSize: 10,
    color: theme.textSecondary,
    fontWeight: '700',
  },
  pickerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  pickerActionBtnAdd: {
    backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  pickerActionBtnAdded: {
    backgroundColor: theme.success,
  },
  pickerActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pickerActionTextAdd: {
    color: theme.primary,
  },
  pickerActionTextAdded: {
    color: '#FFFFFF',
  },
  pickerDoneBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
