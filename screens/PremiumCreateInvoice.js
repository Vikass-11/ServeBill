import React, { useContext, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const { addInvoice, updateInvoice } = useContext(InvoiceContext);
  const editInvoice = route?.params?.editInvoice;

  const sanitizeEvents = (rawEvents, fallbackDate) => {
    if (!rawEvents || !Array.isArray(rawEvents) || rawEvents.length === 0) {
      return [{
        id: Date.now().toString(),
        date: fallbackDate || new Date().toISOString(),
        tiffinQuantities: {},
        addedMeals: [],
      }];
    }
    return rawEvents.map((ev, index) => ({
      id: ev.id || `${Date.now()}-${index}`,
      date: ev.date || fallbackDate || new Date().toISOString(),
      tiffinQuantities: ev.tiffinQuantities && typeof ev.tiffinQuantities === 'object' ? ev.tiffinQuantities : {},
      addedMeals: Array.isArray(ev.addedMeals)
        ? ev.addedMeals.map((m, mIdx) => ({
            id: m.id || `${Date.now()}-m-${mIdx}`,
            name: m.name || 'Full Meals Package',
            price: parseFloat(m.price) || 0,
            quantity: parseInt(m.quantity, 10) || 1,
            dishes: Array.isArray(m.dishes) ? m.dishes : [],
          }))
        : [],
    }));
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

  React.useEffect(() => {
    if (editInvoice) {
      setClientName(editInvoice.clientName || editInvoice.customerName || '');
      setClientPhone(editInvoice.clientPhone || editInvoice.customerPhone || '');
      setTransportCharge(editInvoice.transportCharge != null ? editInvoice.transportCharge.toString() : '');
      setAdvanceAmount(editInvoice.advanceAmount != null ? editInvoice.advanceAmount.toString() : '');
      setEvents(sanitizeEvents(editInvoice.events, editInvoice.date));
      if (Array.isArray(editInvoice.extraItems)) {
        setExtraItems(editInvoice.extraItems);
      }
    }
  }, [editInvoice]);

  // CRM
  const { customers } = useContext(CustomerContext);
  const [isCustomerModalVisible, setCustomerModalVisible] = useState(false);
  
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const addNewDateEvent = () => {
    setEvents([
      ...events,
      {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        tiffinQuantities: {},
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

  const onDateChange = (_pickerEvent, selectedDate) => {
    setShowPicker(false);
    if (selectedDate && activeEventId) {
      setEvents(
        events.map((ev) =>
          ev.id === activeEventId ? { ...ev, date: selectedDate.toISOString() } : ev
        )
      );
    }
  };

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

  const calculateGrandTotal = () => {
    let total = 0;
    (events || []).forEach((ev) => {
      if (ev && tiffinItems) {
        tiffinItems.forEach((item) => {
          const qty = (ev.tiffinQuantities && ev.tiffinQuantities[item.id]) || 0;
          total += (parseFloat(item.price) || 0) * (Number(qty) || 0);
        });
      }
      if (ev && Array.isArray(ev.addedMeals)) {
        ev.addedMeals.forEach((meal) => {
          total += (parseFloat(meal.price) || 0) * (parseInt(meal.quantity, 10) || 0);
        });
      }
    });
    if (Array.isArray(extraItems)) {
      extraItems.forEach((extra) => {
        total += parseFloat(extra.amount) || 0;
      });
    }
    return total;
  };

  const saveExtraItem = () => {
    if (!tempExtraDesc.trim() || !tempExtraAmount) {
      Alert.alert('Missing Info', 'Enter description and amount.');
      return;
    }
    setExtraItems([
      ...extraItems,
      { id: Date.now().toString(), description: tempExtraDesc, amount: parseFloat(tempExtraAmount) }
    ]);
    setTempExtraDesc('');
    setTempExtraAmount('');
    setExtraModalVisible(false);
  };

  const removeExtraItem = (id) => {
    setExtraItems(extraItems.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          {navigation.canGoBack && navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          )}
          <Text style={styles.mainTitle}>
            {editInvoice ? 'Edit' : 'Create'} <Text style={{color: theme.textMuted}}>Bill.</Text>
          </Text>
        </View>

        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="business" size={20} color={theme.text} />
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <View style={{flex: 1}} />
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
          <View style={[styles.inputWrapper, {marginTop: 10}]}>
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

        {(events || []).map((ev, index) => (
          <View key={ev.id || index} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventDayText}>Service Day {index + 1}</Text>
              <TouchableOpacity onPress={() => removeEvent(ev.id)} style={styles.deleteCircle}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardPadding}>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => {
                  setActiveEventId(ev.id);
                  setShowPicker(true);
                }}
              >
                <View style={styles.row}>
                  <Ionicons name="calendar-outline" size={20} color={theme.text} />
                  <Text style={styles.datePickerText}>
                    {' '}
                    {formatDateSafe(ev.date)}
                  </Text>
                </View>
                <Text style={styles.changeText}>Edit</Text>
              </TouchableOpacity>

              <View style={styles.subHeaderRow}>
                <Ionicons name="cafe-outline" size={18} color={theme.primary} />
                <Text style={styles.subTitle}>Tiffin Quantities</Text>
              </View>

              {(tiffinItems || []).map((item) => (
                <View key={item.id} style={styles.menuRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSubText}>₹{item.price} per {item.unit}</Text>
                  </View>
                  <View style={styles.counter}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateTiffinQuantity(ev.id, item.id, -1)}
                    >
                      <Ionicons name="remove" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.qtyInput}
                      keyboardType="number-pad"
                      value={String((ev.tiffinQuantities && ev.tiffinQuantities[item.id]) || 0)}
                      onChangeText={(value) => setTiffinQuantity(ev.id, item.id, value)}
                      selectTextOnFocus
                      maxLength={4}
                    />
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateTiffinQuantity(ev.id, item.id, 1)}
                    >
                      <Ionicons name="add" size={20} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={[styles.subHeaderRow, styles.mealHeaderSpacing]}>
                <Ionicons name="restaurant-outline" size={18} color={theme.accentPurple} />
                <Text style={styles.subTitle}>Meal Packages</Text>
              </View>

              {(ev.addedMeals || []).map((meal) => (
                <View key={meal.id} style={styles.addedMealCard}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealNameText}>{meal.name}</Text>
                    <Text style={styles.mealDetailText}>
                      {meal.quantity} plates x ₹{meal.price}
                    </Text>
                    <Text style={styles.dishListText}>Items: {Array.isArray(meal.dishes) ? meal.dishes.join(', ') : ''}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeMeal(ev.id, meal.id)} style={{padding: 5}}>
                    <Ionicons name="trash-outline" size={22} color="#aaa" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.buildMealBtn}
                onPress={() => {
                  setModalEventId(ev.id);
                  setModalVisible(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                <Text style={styles.buildMealBtnText}> Build Meals for Day {index + 1}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addDateBtn} onPress={addNewDateEvent}>
          <Ionicons name="add" size={24} color={theme.text} />
          <Text style={styles.addDateBtnText}> Add Another Date</Text>
        </TouchableOpacity>
        
        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="car-outline" size={20} color={theme.text} />
            <Text style={styles.sectionTitle}>Transport Charge (+)</Text>
          </View>
          <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginRight: 5 }}>₹</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={transportCharge}
              onChangeText={setTransportCharge}
            />
          </View>
        </View>

        {/* EXTRA ITEMS SECTION */}
        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="list-circle-outline" size={20} color={theme.text} />
            <Text style={styles.sectionTitle}>Extra Items / Charges</Text>
            <View style={{flex: 1}} />
            <TouchableOpacity onPress={() => setExtraModalVisible(true)} style={styles.pickClientBtn}>
              <Text style={styles.pickClientText}>+ Add Extra</Text>
            </TouchableOpacity>
          </View>
          {extraItems.length === 0 ? (
             <Text style={{color: theme.textSecondary, fontSize: 13, fontStyle: 'italic'}}>No extra items added.</Text>
          ) : (
            extraItems.map((item) => (
              <View key={item.id} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                <Text style={{color: theme.text, fontSize: 15, flex: 1}}>{item.description}</Text>
                <Text style={{color: theme.text, fontSize: 15, fontWeight: '700', marginRight: 15}}>₹{item.amount}</Text>
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
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginRight: 5 }}>₹</Text>
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

      {showPicker && Platform.OS === 'web' && (
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

      {showPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={(() => {
            const evDate = events.find((ev) => ev.id === activeEventId)?.date;
            const parsed = evDate ? new Date(evDate) : new Date();
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          })()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
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
              ₹{(calculateGrandTotal() + (parseFloat(transportCharge) || 0)).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.previewBtn}
            activeOpacity={0.88}
            onPress={() => {
              if (!clientName.trim()) {
                Alert.alert('Error', 'Please enter a customer name.');
                return;
              }

              const subTotal = calculateGrandTotal();
              const taxAmount = 0;
              const grandTotal = subTotal + (parseFloat(transportCharge) || 0);

              // Deduct stock levels
              events.forEach((ev) => {
                tiffinItems.forEach((item) => {
                  const qty = ev.tiffinQuantities[item.id] || 0;
                  if (qty > 0) {
                    const newStock = Math.max(0, (item.stock || 0) - qty);
                    updateTiffinItem({ ...item, stock: newStock });
                  }
                });
              });

              const newInvoice = {
                id: editInvoice ? editInvoice.id : Date.now().toString(),
                clientName,
                clientPhone,
                date: editInvoice ? editInvoice.date : new Date().toLocaleDateString('en-IN'),
                events,
                subTotal,
                taxAmount,
                grandTotal: grandTotal.toFixed(2),
                transportCharge: transportCharge ? parseFloat(transportCharge) : 0,
                advanceAmount: advanceAmount ? parseFloat(advanceAmount) : 0,
                amountReceived: advanceAmount ? parseFloat(advanceAmount) : (editInvoice?.amountReceived || 0),
                extraItems
              };
              
              if (editInvoice) {
                updateInvoice(newInvoice.id, newInvoice);
              } else {
                addInvoice(newInvoice);
              }

              navigation.navigate('InvoicePreview', {
                clientName,
                clientPhone,
                events,
                subTotal,
                taxAmount,
                grandTotal,
                transportCharge: transportCharge ? parseFloat(transportCharge) : 0,
                advanceAmount: advanceAmount ? parseFloat(advanceAmount) : 0,
                extraItems,
                isPreviewOnly: true, // Hide save button in preview since it's auto-saved
              });
            }}
          >
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.previewBtnGradient}
            >
              <Text style={styles.previewBtnText}>Generate Bill</Text>
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
                    placeholder="Description (e.g. Banana Leaves)"
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

      {/* MODAL */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Dishes</Text>
            <ScrollView style={styles.modalScroll}>
              {(mealDishes || []).map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.checkboxRow}
                  onPress={() => toggleDishSelection(dish.name)}
                >
                  <Ionicons
                    name={tempSelectedDishes.includes(dish.name) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
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
                    placeholder="Package Label"
                    placeholderTextColor={theme.textMuted}
                    value={tempMealName}
                    onChangeText={setTempMealName}
                  />
              </View>
              <View style={styles.row}>
                <View style={[styles.modalInputWrapper, styles.halfInput, styles.rightGap]}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Price"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={tempMealPrice}
                      onChangeText={setTempMealPrice}
                    />
                </View>
                <View style={[styles.modalInputWrapper, styles.halfInput, styles.leftGap]}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Qty"
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
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#ccc" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {(!customers || customers.length === 0) ? (
                <Text style={{textAlign: 'center', color: '#888', marginTop: 20}}>No clients saved yet.</Text>
              ) : (
                customers.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={{paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee'}}
                    onPress={() => {
                      setClientName(c.name);
                      setCustomerModalVisible(false);
                    }}
                  >
                    <Text style={{fontSize: 16, fontWeight: '600', color: theme.text}}>{c.name}</Text>
                    <Text style={{fontSize: 13, color: theme.textSecondary, marginTop: 4}}>{c.phone}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 15 },
  backBtn: { marginRight: 15 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  
  scrollContent: { paddingBottom: 160, paddingHorizontal: 24 }, // Extra padding for fixed footer + tab bar
  
  clientCard: {
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
  },
  iconHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginLeft: 8 },
  pickClientBtn: { backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pickClientText: { color: theme.primary, fontSize: 12, fontWeight: '700' },
  inputWrapper: {
      backgroundColor: theme.inputBackground,
      borderRadius: 16,
      paddingHorizontal: 16,
  },
  input: { paddingVertical: 16, fontSize: 15, color: theme.text },
  
  eventCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
  },
  eventHeader: { 
      flexDirection: 'row', justifyContent: 'space-between', 
      paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center',
      borderBottomWidth: 1, borderBottomColor: theme.border
  },
  eventDayText: { color: theme.text, fontSize: 16, fontWeight: '800' },
  deleteCircle: { backgroundColor: theme.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center'},
  
  cardPadding: { padding: 20 },
  datePickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.inputBackground, padding: 16, borderRadius: 16, marginBottom: 20,
  },
  datePickerText: { fontSize: 15, fontWeight: '600', color: theme.text, marginLeft: 5 },
  changeText: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  
  subHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10
  },
  mealHeaderSpacing: { marginTop: 30 },
  subTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginLeft: 8 },
  
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.inputBackground,
  },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 15, fontWeight: '600', color: theme.text },
  itemSubText: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: 12, padding: 4 },
  counterBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyInput: {
    width: 40, textAlign: 'center', fontSize: 16, fontWeight: '700', color: theme.text,
  },
  
  buildMealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 16, marginTop: 20,
    borderWidth: 1, borderColor: theme.primary, borderStyle: 'dashed', backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA'
  },
  buildMealBtnText: { color: theme.primary, fontWeight: '700', marginLeft: 5 },
  
  addedMealCard: {
    backgroundColor: theme.inputBackground, padding: 16, borderRadius: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  mealInfo: { flex: 1 },
  mealNameText: { fontWeight: '700', color: theme.text },
  mealDetailText: { fontSize: 13, color: theme.primary, marginTop: 4, fontWeight: '600' },
  dishListText: { fontSize: 11, color: theme.textSecondary, marginTop: 4 },
  
  addDateBtn: {
    flexDirection: 'row', backgroundColor: theme.inputBackground,
    padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  addDateBtnText: { color: theme.text, fontSize: 15, fontWeight: '700', marginLeft: 5 },
  
  footerContainer: {
      position: 'absolute', bottom: 100, // Above the tab bar
      left: 0, right: 0, paddingHorizontal: 24,
  },
  chargeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  chargeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    marginRight: 10,
  },
  chargeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 10,
    width: 90,
  },
  chargeCurrency: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginRight: 4,
  },
  chargeInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  footerWrapper: {
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDarkMode ? 0.4 : 0.18,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
  },
  totalContainer: { flex: 1, paddingLeft: 10 },
  totalLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5 },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  previewBtn: { 
    borderRadius: 16,
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
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: theme.card, borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 20, textAlign: 'center' },
  modalScroll: { marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  checkboxLabel: { fontSize: 15, marginLeft: 12, color: theme.text, fontWeight: '500' },
  
  modalInputSection: { marginTop: 10 },
  modalInputWrapper: { backgroundColor: theme.inputBackground, borderRadius: 16, paddingHorizontal: 16, marginBottom: 12 },
  modalInput: { paddingVertical: 14, fontSize: 15, color: theme.text },
  halfInput: { flex: 1 },
  rightGap: { marginRight: 6 },
  leftGap: { marginLeft: 6 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { padding: 16, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: theme.textSecondary, fontWeight: '700', fontSize: 15 },
  saveBtn: { backgroundColor: theme.text, paddingVertical: 16, flex: 1, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: theme.background, fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
