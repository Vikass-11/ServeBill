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
        selectedTiffins: [],
        tiffinQuantities: {},
        fixedPrices: {},
        pricingModes: {},
        fixedSelected: {},
        addedMeals: [],
      }];
    }
    return rawEvents.map((ev, index) => {
      let selectedTiffins = Array.isArray(ev.selectedTiffins) ? [...ev.selectedTiffins] : null;
      if (!selectedTiffins) {
        selectedTiffins = [];
        if (ev.tiffinQuantities && typeof ev.tiffinQuantities === 'object') {
          Object.keys(ev.tiffinQuantities).forEach((k) => {
            if (ev.tiffinQuantities[k] > 0 && !selectedTiffins.includes(k)) {
              selectedTiffins.push(k);
            }
          });
        }
        if (ev.fixedPrices && typeof ev.fixedPrices === 'object') {
          Object.keys(ev.fixedPrices).forEach((k) => {
            const amt = parseFloat(ev.fixedPrices[k]) || 0;
            const isSel = ev.fixedSelected ? ev.fixedSelected[k] : amt > 0;
            if (isSel && amt > 0 && !selectedTiffins.includes(k)) {
              selectedTiffins.push(k);
            }
          });
        }
      }

      return {
        id: ev.id || `${Date.now()}-${index}`,
        date: ev.date || fallbackDate || new Date().toISOString(),
        transportCharge: ev.transportCharge != null ? ev.transportCharge.toString() : '',
        selectedTiffins,
        tiffinQuantities: ev.tiffinQuantities && typeof ev.tiffinQuantities === 'object' ? ev.tiffinQuantities : {},
        fixedPrices: ev.fixedPrices && typeof ev.fixedPrices === 'object' ? ev.fixedPrices : {},
        pricingModes: ev.pricingModes && typeof ev.pricingModes === 'object' ? ev.pricingModes : {},
        fixedSelected: ev.fixedSelected && typeof ev.fixedSelected === 'object' ? ev.fixedSelected : {},
        addedMeals: Array.isArray(ev.addedMeals)
          ? ev.addedMeals.map((m, mIdx) => ({
              id: m.id || `${Date.now()}-m-${mIdx}`,
              name: m.name || 'Full Meals Package',
              price: parseFloat(m.price) || 0,
              quantity: parseInt(m.quantity, 10) || 1,
              dishes: Array.isArray(m.dishes) ? m.dishes : [],
            }))
          : [],
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
  const [tempMealName, setTempMealName] = useState('Full Meals Package');
  const [tempMealPrice, setTempMealPrice] = useState('');
  const [tempMealQty, setTempMealQty] = useState('');
  const [tempSelectedDishes, setTempSelectedDishes] = useState([]);

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
      selectedTiffins: [],
      tiffinQuantities: {},
      fixedPrices: {},
      pricingModes: {},
      fixedSelected: {},
      addedMeals: [],
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
      (Array.isArray(evs) && evs.some(e => 
        (Array.isArray(e.selectedTiffins) && e.selectedTiffins.length > 0) ||
        (Array.isArray(e.addedMeals) && e.addedMeals.length > 0) ||
        (e.fixedPrices && Object.values(e.fixedPrices).some(p => parseFloat(p) > 0)) ||
        (e.tiffinQuantities && Object.values(e.tiffinQuantities).some(q => q > 0))
      ))
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

  // Food Item Picker State
  const [isFoodPickerVisible, setFoodPickerVisible] = useState(false);
  const [foodPickerEventId, setFoodPickerEventId] = useState(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');

  const openFoodItemPicker = (eventId) => {
    setFoodPickerEventId(eventId);
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

  const addTiffinToEvent = (eventId, item) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSelected = Array.isArray(ev.selectedTiffins) ? ev.selectedTiffins : [];
        if (currentSelected.includes(item.id)) return ev; // Prevent duplicates

        const mode = getItemPricingMode(ev, item);
        const isFixed = mode === 'fixed';
        const hasMenuPrice = item.price !== undefined && parseFloat(item.price) > 0;

        const updatedQuantities = { ...(ev.tiffinQuantities || {}) };
        if (!isFixed && (!updatedQuantities[item.id] || updatedQuantities[item.id] === 0)) {
          updatedQuantities[item.id] = 1; // Default to 1 on add
        }

        const updatedFixedPrices = { ...(ev.fixedPrices || {}) };
        const updatedFixedSelected = { ...(ev.fixedSelected || {}) };
        if (isFixed) {
          if (updatedFixedPrices[item.id] === undefined) {
            updatedFixedPrices[item.id] = hasMenuPrice ? String(item.price) : '';
          }
          updatedFixedSelected[item.id] = true;
        }

        return {
          ...ev,
          selectedTiffins: [...currentSelected, item.id],
          tiffinQuantities: updatedQuantities,
          fixedPrices: updatedFixedPrices,
          fixedSelected: updatedFixedSelected,
        };
      })
    );
  };

  const removeTiffinFromEvent = (eventId, itemId) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentSelected = Array.isArray(ev.selectedTiffins) ? ev.selectedTiffins : [];
        const updatedSelected = currentSelected.filter((id) => id !== itemId);

        const updatedQuantities = { ...(ev.tiffinQuantities || {}) };
        delete updatedQuantities[itemId];

        const updatedFixedPrices = { ...(ev.fixedPrices || {}) };
        delete updatedFixedPrices[itemId];

        const updatedFixedSelected = { ...(ev.fixedSelected || {}) };
        delete updatedFixedSelected[itemId];

        return {
          ...ev,
          selectedTiffins: updatedSelected,
          tiffinQuantities: updatedQuantities,
          fixedPrices: updatedFixedPrices,
          fixedSelected: updatedFixedSelected,
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
        selectedTiffins: [],
        tiffinQuantities: {},
        fixedPrices: {},
        pricingModes: {},
        fixedSelected: {},
        addedMeals: [],
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

  // Helper to determine whether an item in an event is in 'fixed' (direct total) or 'unit' (quantity x rate) mode
  const getItemPricingMode = (ev, item) => {
    if (ev && ev.pricingModes && ev.pricingModes[item.id]) {
      return ev.pricingModes[item.id];
    }
    // If item has a rate specified in menu (> 0), default to 'unit' (Quantity x Rate)
    // If item has NO rate in menu (e.g. Upma with price 0), default to 'fixed' (Direct Total Price)
    const hasPredefinedPrice = item && parseFloat(item.price) > 0;
    return hasPredefinedPrice ? 'unit' : 'fixed';
  };

  // Toggle pricing mode (Unit <-> Fixed) directly on the billing screen
  const toggleItemPricingMode = (eventId, itemId) => {
    setEvents(prevEvents =>
      prevEvents.map(ev => {
        if (ev.id !== eventId) return ev;
        const item = (tiffinItems || []).find(t => t.id === itemId) || { id: itemId };
        const currentMode = getItemPricingMode(ev, item);
        const nextMode = currentMode === 'fixed' ? 'unit' : 'fixed';
        
        const updatedFixedPrices = { ...(ev.fixedPrices || {}) };
        const updatedFixedSelected = { ...(ev.fixedSelected || {}) };
        
        if (nextMode === 'fixed' && updatedFixedPrices[itemId] === undefined) {
          updatedFixedPrices[itemId] = item?.price && parseFloat(item.price) > 0 ? String(item.price) : '';
          updatedFixedSelected[itemId] = updatedFixedPrices[itemId] !== '';
        }

        return {
          ...ev,
          pricingModes: {
            ...(ev.pricingModes || {}),
            [itemId]: nextMode,
          },
          fixedPrices: updatedFixedPrices,
          fixedSelected: updatedFixedSelected,
        };
      })
    );
  };

  // Update quantity for unit-based items
  const updateTiffinQuantity = (eventId, itemId, amount) => {
    setEvents(
      events.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentQty = (ev.tiffinQuantities && ev.tiffinQuantities[itemId]) || 0;
        return {
          ...ev,
          tiffinQuantities: {
            ...(ev.tiffinQuantities || {}),
            [itemId]: Math.max(0, currentQty + amount),
          },
        };
      })
    );
  };

  const setTiffinQuantity = (eventId, itemId, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    const parsedQuantity = sanitizedValue === '' ? 0 : parseInt(sanitizedValue, 10);

    setEvents(
      events.map((ev) => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          tiffinQuantities: {
            ...(ev.tiffinQuantities || {}),
            [itemId]: Number.isNaN(parsedQuantity) ? 0 : parsedQuantity,
          },
        };
      })
    );
  };

  // Update total price for fixed-price items (e.g. Upma flat price)
  const setFixedPrice = (eventId, itemId, value) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setEvents(prevEvents =>
      prevEvents.map(ev => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          fixedPrices: {
            ...(ev.fixedPrices || {}),
            [itemId]: sanitized,
          },
          fixedSelected: {
            ...(ev.fixedSelected || {}),
            [itemId]: sanitized !== '' && parseFloat(sanitized) > 0,
          }
        };
      })
    );
  };

  // Toggle whether a fixed-price item is included in the bill
  const toggleFixedItemSelection = (eventId, itemId) => {
    setEvents(prevEvents =>
      prevEvents.map(ev => {
        if (ev.id !== eventId) return ev;
        const item = tiffinItems.find(t => t.id === itemId);
        const currentSelected = ev.fixedSelected ? ev.fixedSelected[itemId] : undefined;
        const isCurrentlyOn = currentSelected !== undefined ? currentSelected : (parseFloat(ev.fixedPrices?.[itemId] ?? item?.price ?? 0) > 0);
        const willBeOn = !isCurrentlyOn;
        
        let newFixedPrice = ev.fixedPrices && ev.fixedPrices[itemId] !== undefined ? ev.fixedPrices[itemId] : '';
        if (willBeOn && (!newFixedPrice || parseFloat(newFixedPrice) === 0)) {
          newFixedPrice = item?.price ? String(item.price) : '';
        }

        return {
          ...ev,
          fixedSelected: {
            ...(ev.fixedSelected || {}),
            [itemId]: willBeOn,
          },
          fixedPrices: {
            ...(ev.fixedPrices || {}),
            [itemId]: newFixedPrice,
          }
        };
      })
    );
  };

  const toggleDishSelection = (dishName) => {
    setTempSelectedDishes((prev) =>
      prev.includes(dishName) ? prev.filter((dish) => dish !== dishName) : [...prev, dishName]
    );
  };

  const saveCustomMeal = () => {
    if (!tempMealPrice || !tempMealQty) {
      Alert.alert('Missing Info', 'Enter price and quantity for the meal.');
      return;
    }

    const newMeal = {
      id: Date.now().toString(),
      name: tempMealName,
      price: parseFloat(tempMealPrice) || 0,
      quantity: parseInt(tempMealQty, 10) || 1,
      dishes: Array.isArray(tempSelectedDishes) ? tempSelectedDishes : [],
    };

    setEvents(
      events.map((ev) =>
        ev.id === modalEventId ? { ...ev, addedMeals: [...(ev.addedMeals || []), newMeal] } : ev
      )
    );

    setTempMealName('Full Meals Package');
    setTempMealPrice('');
    setTempMealQty('');
    setTempSelectedDishes([]);
    setModalVisible(false);
  };

  const removeMeal = (eventId, mealId) => {
    setEvents(
      events.map((ev) =>
        ev.id === eventId
          ? { ...ev, addedMeals: (ev.addedMeals || []).filter((meal) => meal.id !== mealId) }
          : ev
      )
    );
  };

  // Grand Total calculation supporting both Unit-Based and Fixed Total Price items
  const calculateGrandTotal = () => {
    let total = 0;
    (events || []).forEach((ev) => {
      if (!ev) return;
      if (tiffinItems && Array.isArray(tiffinItems)) {
        tiffinItems.forEach((item) => {
          if (Array.isArray(ev.selectedTiffins) && !ev.selectedTiffins.includes(item.id)) {
            return;
          }
          const mode = getItemPricingMode(ev, item);
          if (mode === 'fixed') {
            const rawVal = ev.fixedPrices && ev.fixedPrices[item.id] !== undefined
              ? ev.fixedPrices[item.id]
              : item.price;
            const amt = parseFloat(rawVal) || 0;
            const isSelected = ev.fixedSelected && ev.fixedSelected[item.id] !== undefined
              ? ev.fixedSelected[item.id]
              : amt > 0;
            if (isSelected && amt > 0) {
              total += amt;
            }
          } else {
            const qty = (ev.tiffinQuantities && ev.tiffinQuantities[item.id]) || 0;
            const rate = parseFloat(item.price) || 0;
            if (qty > 0 && !isNaN(rate)) {
              total += rate * (Number(qty) || 0);
            }
          }
        });
      }
      if (ev && Array.isArray(ev.addedMeals)) {
        ev.addedMeals.forEach((meal) => {
          const price = parseFloat(meal.price) || 0;
          const qty = parseInt(meal.quantity, 10) || 0;
          total += price * qty;
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

        {/* EVENT DAYS SECTION */}
        {(events || []).map((ev, index) => (
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

              {/* TIFFIN & FOOD ITEMS SECTION */}
              <View style={styles.subHeaderRow}>
                <Ionicons name="cafe-outline" size={18} color={theme.primary} />
                <Text style={styles.subTitle}>Tiffin & Food Items</Text>
                <View style={{ flex: 1 }} />
                {(ev.selectedTiffins && ev.selectedTiffins.length > 0) && (
                  <TouchableOpacity
                    style={styles.headerAddBtn}
                    onPress={() => openFoodItemPicker(ev.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={15} color={theme.primary} />
                    <Text style={styles.headerAddBtnText}>Add Item</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.sectionHelperText}>
                Select items from your menu below to enter quantities or direct prices.
              </Text>

              {(!ev.selectedTiffins || ev.selectedTiffins.length === 0) ? (
                <View style={styles.emptyFoodCard}>
                  <View style={styles.emptyFoodIconWrap}>
                    <Ionicons name="restaurant-outline" size={24} color={theme.primary} />
                  </View>
                  <Text style={styles.emptyFoodTitle}>No Food Items Selected</Text>
                  <Text style={styles.emptyFoodSub}>
                    Tap below to pick items from your menu for Day {index + 1}.
                  </Text>
                  <TouchableOpacity
                    style={styles.addFoodPrimaryBtn}
                    activeOpacity={0.85}
                    onPress={() => openFoodItemPicker(ev.id)}
                  >
                    <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.addFoodPrimaryBtnText}>+ Add Food Item</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {(ev.selectedTiffins || []).map((selectedId) => {
                    const item = (tiffinItems || []).find((t) => t.id === selectedId) || {
                      id: selectedId,
                      name: 'Custom Food Item',
                      price: 0,
                      unit: 'nos',
                    };
                    const mode = getItemPricingMode(ev, item);
                    const isFixed = mode === 'fixed';
                    const hasMenuPrice = item.price !== undefined && parseFloat(item.price) > 0;
                    const currentQty = (ev.tiffinQuantities && ev.tiffinQuantities[item.id]) || 0;

                    const fixedVal =
                      ev.fixedPrices && ev.fixedPrices[item.id] !== undefined
                        ? ev.fixedPrices[item.id]
                        : hasMenuPrice
                        ? String(item.price)
                        : '';
                    const fixedAmt = parseFloat(fixedVal) || 0;
                    const isFixedSelected =
                      ev.fixedSelected && ev.fixedSelected[item.id] !== undefined
                        ? ev.fixedSelected[item.id]
                        : fixedAmt > 0;

                    const itemRowTotal = isFixed
                      ? isFixedSelected
                        ? fixedAmt
                        : 0
                      : currentQty * (parseFloat(item.price) || 0);

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.foodItemCard,
                          itemRowTotal > 0 && styles.foodItemCardActive,
                        ]}
                      >
                        {/* Top Row: Item Name, Price Info & Action Chips */}
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
                                : `Rate: ₹0 (Flexible)`}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* Pricing Mode Toggle Pill */}
                            <TouchableOpacity
                              style={[
                                styles.modeToggleChip,
                                isFixed ? styles.modeToggleChipFixed : styles.modeToggleChipUnit,
                              ]}
                              activeOpacity={0.75}
                              onPress={() => toggleItemPricingMode(ev.id, item.id)}
                            >
                              <Ionicons
                                name={isFixed ? 'cash-outline' : 'calculator-outline'}
                                size={13}
                                color={isFixed ? theme.accentPurple : theme.primary}
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={[
                                  styles.modeToggleText,
                                  { color: isFixed ? theme.accentPurple : theme.primary },
                                ]}
                              >
                                {isFixed ? 'Direct Total' : 'By Qty'}
                              </Text>
                            </TouchableOpacity>

                            {/* Remove Item Button */}
                            <TouchableOpacity
                              style={styles.removeItemBtn}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              onPress={() => removeTiffinFromEvent(ev.id, item.id)}
                            >
                              <Ionicons name="trash-outline" size={17} color={theme.error} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Bottom Row: Flexible Entry Inputs */}
                        <View style={styles.foodInputRow}>
                          {isFixed ? (
                            // FIXED TOTAL PRICE ENTRY
                            <View style={styles.fixedInputWrap}>
                              <TouchableOpacity
                                style={[
                                  styles.fixedCheckbox,
                                  isFixedSelected && styles.fixedCheckboxChecked,
                                ]}
                                activeOpacity={0.8}
                                onPress={() => toggleFixedItemSelection(ev.id, item.id)}
                              >
                                <Ionicons
                                  name={isFixedSelected ? 'checkmark' : 'add'}
                                  size={16}
                                  color={isFixedSelected ? '#FFFFFF' : theme.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.fixedCheckboxLabel,
                                    isFixedSelected && styles.fixedCheckboxLabelChecked,
                                  ]}
                                >
                                  {isFixedSelected ? 'In Bill' : 'Include'}
                                </Text>
                              </TouchableOpacity>

                              <View
                                style={[
                                  styles.fixedAmountInputBox,
                                  isFixedSelected && styles.fixedAmountInputBoxActive,
                                ]}
                              >
                                <Text style={styles.currencySymbol}>₹</Text>
                                <TextInput
                                  style={styles.fixedPriceInput}
                                  keyboardType="numeric"
                                  placeholder="Total ₹ (e.g. 500)"
                                  placeholderTextColor={theme.textMuted}
                                  value={String(fixedVal)}
                                  onChangeText={(val) => setFixedPrice(ev.id, item.id, val)}
                                  selectTextOnFocus
                                />
                              </View>
                            </View>
                          ) : (
                            // UNIT-BASED QUANTITY ENTRY
                            <View style={styles.unitInputWrap}>
                              <View style={styles.counter}>
                                <TouchableOpacity
                                  style={styles.counterBtn}
                                  onPress={() => updateTiffinQuantity(ev.id, item.id, -1)}
                                >
                                  <Ionicons name="remove" size={18} color={theme.text} />
                                </TouchableOpacity>
                                <TextInput
                                  style={styles.qtyInput}
                                  keyboardType="number-pad"
                                  value={String(currentQty)}
                                  onChangeText={(value) => setTiffinQuantity(ev.id, item.id, value)}
                                  selectTextOnFocus
                                  maxLength={4}
                                />
                                <TouchableOpacity
                                  style={styles.counterBtn}
                                  onPress={() => updateTiffinQuantity(ev.id, item.id, 1)}
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

                  {/* Add Another Food Item to this day */}
                  <TouchableOpacity
                    style={styles.addMoreFoodBtn}
                    activeOpacity={0.85}
                    onPress={() => openFoodItemPicker(ev.id)}
                  >
                    <Ionicons name="add-circle-outline" size={17} color={theme.primary} />
                    <Text style={styles.addMoreFoodBtnText}>+ Add Another Food Item</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* MEAL PACKAGES SECTION */}
              <View style={[styles.subHeaderRow, styles.mealHeaderSpacing]}>
                <Ionicons name="restaurant-outline" size={18} color={theme.accentPurple} />
                <Text style={styles.subTitle}>Meal Packages</Text>
              </View>

              {(ev.addedMeals || []).map((meal) => (
                <View key={meal.id} style={styles.addedMealCard}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealNameText}>{meal.name}</Text>
                    <Text style={styles.mealDetailText}>
                      {meal.quantity} plates x ₹{meal.price} = ₹{(meal.quantity * meal.price).toFixed(2)}
                    </Text>
                    {Array.isArray(meal.dishes) && meal.dishes.length > 0 && (
                      <Text style={styles.dishListText}>Dishes: {meal.dishes.join(', ')}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => removeMeal(ev.id, meal.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.buildMealBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setModalEventId(ev.id);
                  setModalVisible(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
                <Text style={styles.buildMealBtnText}> Build Thali / Meal Package</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

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

                // Deduct stock levels safely
                (events || []).forEach((ev) => {
                  if (!ev) return;
                  (tiffinItems || []).forEach((item) => {
                    if (Array.isArray(ev.selectedTiffins) && !ev.selectedTiffins.includes(item.id)) {
                      return;
                    }
                    const qty = (ev.tiffinQuantities && ev.tiffinQuantities[item.id]) || 0;
                    if (qty > 0) {
                      const newStock = Math.max(0, (item.stock || 0) - qty);
                      updateTiffinItem({ ...item, stock: newStock });
                    }
                  });
                });

                const formattedEvents = (events || []).map((ev) => ({
                  ...ev,
                  transportCharge: parseFloat(ev.transportCharge) || 0,
                }));

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
              <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Package Label (e.g. VIP Lunch Package)"
                    placeholderTextColor={theme.textMuted}
                    value={tempMealName}
                    onChangeText={setTempMealName}
                  />
              </View>
              <View style={styles.row}>
                <View style={[styles.modalInputWrapper, styles.halfInput, styles.rightGap]}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Rate (₹)"
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
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
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
                  Service Day {events.findIndex((e) => e.id === foodPickerEventId) + 1}
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
                  const isAlreadyAdded =
                    activeEvent &&
                    Array.isArray(activeEvent.selectedTiffins) &&
                    activeEvent.selectedTiffins.includes(item.id);
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
                          removeTiffinFromEvent(foodPickerEventId, item.id);
                        } else {
                          addTiffinToEvent(foodPickerEventId, item);
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
