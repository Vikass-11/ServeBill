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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MenuContext } from '../context/MenuContext';
import { CustomerContext } from '../context/CustomerContext';

export default function PremiumCreateInvoiceScreen({ navigation }) {
  const { tiffinItems, mealDishes } = useContext(MenuContext);
  const [clientName, setClientName] = useState('');
  const [transportCharge, setTransportCharge] = useState('');
  const [events, setEvents] = useState([
    {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      tiffinQuantities: {},
      addedMeals: [],
    },
  ]);

  const [showPicker, setShowPicker] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalEventId, setModalEventId] = useState(null);
  const [tempMealName, setTempMealName] = useState('Full Meals Package');
  const [tempMealPrice, setTempMealPrice] = useState('');
  const [tempMealQty, setTempMealQty] = useState('');
  const [tempSelectedDishes, setTempSelectedDishes] = useState([]);

  // CRM
  const { customers } = useContext(CustomerContext);
  const [isCustomerModalVisible, setCustomerModalVisible] = useState(false);

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
        const currentQty = ev.tiffinQuantities[itemId] || 0;
        return {
          ...ev,
          tiffinQuantities: {
            ...ev.tiffinQuantities,
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
            ...ev.tiffinQuantities,
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
      price: parseFloat(tempMealPrice),
      quantity: parseInt(tempMealQty, 10),
      dishes: tempSelectedDishes,
    };

    setEvents(
      events.map((ev) =>
        ev.id === modalEventId ? { ...ev, addedMeals: [...ev.addedMeals, newMeal] } : ev
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
          ? { ...ev, addedMeals: ev.addedMeals.filter((meal) => meal.id !== mealId) }
          : ev
      )
    );
  };

  const calculateGrandTotal = () => {
    let total = 0;
    events.forEach((ev) => {
      tiffinItems.forEach((item) => {
        total += parseFloat(item.price) * (ev.tiffinQuantities[item.id] || 0);
      });
      ev.addedMeals.forEach((meal) => {
        total += meal.price * meal.quantity;
      });
    });
    return total;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
            <Text style={styles.mainTitle}>
              Create <Text style={{color: '#888'}}>Bill.</Text>
            </Text>
        </View>

        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="business" size={20} color="#111" />
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
              placeholderTextColor="#aaa"
              value={clientName}
              onChangeText={setClientName}
            />
          </View>
        </View>

        {events.map((ev, index) => (
          <View key={ev.id} style={styles.eventCard}>
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
                  <Ionicons name="calendar-outline" size={20} color="#111" />
                  <Text style={styles.datePickerText}>
                    {' '}
                    {new Date(ev.date).toLocaleDateString('en-GB')}
                  </Text>
                </View>
                <Text style={styles.changeText}>Edit</Text>
              </TouchableOpacity>

              <View style={styles.subHeaderRow}>
                <Ionicons name="cafe-outline" size={18} color="#FF7F50" />
                <Text style={styles.subTitle}>Tiffin Quantities</Text>
              </View>

              {tiffinItems.map((item) => (
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
                      <Ionicons name="remove" size={20} color="#111" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.qtyInput}
                      keyboardType="number-pad"
                      value={String(ev.tiffinQuantities[item.id] || 0)}
                      onChangeText={(value) => setTiffinQuantity(ev.id, item.id, value)}
                      selectTextOnFocus
                      maxLength={4}
                    />
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateTiffinQuantity(ev.id, item.id, 1)}
                    >
                      <Ionicons name="add" size={20} color="#111" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={[styles.subHeaderRow, styles.mealHeaderSpacing]}>
                <Ionicons name="restaurant-outline" size={18} color="#FF7F50" />
                <Text style={styles.subTitle}>Meal Packages</Text>
              </View>

              {ev.addedMeals.map((meal) => (
                <View key={meal.id} style={styles.addedMealCard}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealNameText}>{meal.name}</Text>
                    <Text style={styles.mealDetailText}>
                      {meal.quantity} plates x ₹{meal.price}
                    </Text>
                    <Text style={styles.dishListText}>Items: {meal.dishes.join(', ')}</Text>
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
                <Ionicons name="add-circle-outline" size={20} color="#FF7F50" />
                <Text style={styles.buildMealBtnText}> Build Meals for Day {index + 1}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addDateBtn} onPress={addNewDateEvent}>
          <Ionicons name="add" size={24} color="#111" />
          <Text style={styles.addDateBtnText}> Add Another Date</Text>
        </TouchableOpacity>
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          value={new Date(events.find((ev) => ev.id === activeEventId)?.date || new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* FLOATING CHECKOUT BAR */}
      <View style={styles.footerContainer}>
          <View style={styles.chargeWrapper}>
            <Text style={styles.chargeLabel}>Transport Charge (+):</Text>
            <View style={styles.chargeInputContainer}>
              <Text style={styles.chargeCurrency}>₹</Text>
              <TextInput
                style={styles.chargeInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#888"
                value={transportCharge}
                onChangeText={setTransportCharge}
              />
            </View>
          </View>
          <View style={styles.footerWrapper}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>₹{calculateGrandTotal()}</Text>
            </View>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() => {
                if (!clientName.trim()) {
                  Alert.alert('Error', 'Please enter a customer name.');
                  return;
                }

                navigation.navigate('InvoicePreview', {
                  clientName,
                  events,
                  grandTotal: calculateGrandTotal(),
                  transportCharge: transportCharge ? parseFloat(transportCharge) : 0,
                });
              }}
            >
              <Text style={styles.previewBtnText}>Generate Bill</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{marginLeft: 8}}/>
            </TouchableOpacity>
          </View>
      </View>

      {/* MODAL */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Dishes</Text>
            <ScrollView style={styles.modalScroll}>
              {mealDishes.map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.checkboxRow}
                  onPress={() => toggleDishSelection(dish.name)}
                >
                  <Ionicons
                    name={tempSelectedDishes.includes(dish.name) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={tempSelectedDishes.includes(dish.name) ? '#FF7F50' : '#ccc'}
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
                    value={tempMealName}
                    onChangeText={setTempMealName}
                  />
              </View>
              <View style={styles.row}>
                <View style={[styles.modalInputWrapper, styles.halfInput, styles.rightGap]}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Price"
                      keyboardType="numeric"
                      value={tempMealPrice}
                      onChangeText={setTempMealPrice}
                    />
                </View>
                <View style={[styles.modalInputWrapper, styles.halfInput, styles.leftGap]}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Qty"
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
                    <Text style={{fontSize: 16, fontWeight: '600', color: '#111'}}>{c.name}</Text>
                    <Text style={{fontSize: 13, color: '#888', marginTop: 4}}>{c.phone}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 15 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  
  scrollContent: { paddingBottom: 160, paddingHorizontal: 24 }, // Extra padding for fixed footer + tab bar
  
  clientCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
  },
  iconHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginLeft: 8 },
  pickClientBtn: { backgroundColor: '#FFF0EA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pickClientText: { color: '#FF7F50', fontSize: 12, fontWeight: '700' },
  inputWrapper: {
      backgroundColor: '#f9f9f9',
      borderRadius: 16,
      paddingHorizontal: 16,
  },
  input: { paddingVertical: 16, fontSize: 15, color: '#111' },
  
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
  },
  eventHeader: { 
      flexDirection: 'row', justifyContent: 'space-between', 
      paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center',
      borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  eventDayText: { color: '#111', fontSize: 16, fontWeight: '800' },
  deleteCircle: { backgroundColor: '#FF7F50', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center'},
  
  cardPadding: { padding: 20 },
  datePickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f9f9f9', padding: 16, borderRadius: 16, marginBottom: 20,
  },
  datePickerText: { fontSize: 15, fontWeight: '600', color: '#111', marginLeft: 5 },
  changeText: { color: '#888', fontSize: 13, fontWeight: '600' },
  
  subHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10
  },
  mealHeaderSpacing: { marginTop: 30 },
  subTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginLeft: 8 },
  
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9',
  },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111' },
  itemSubText: { color: '#888', fontSize: 12, marginTop: 2 },
  
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 4 },
  counterBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyInput: {
    width: 40, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111',
  },
  
  buildMealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 16, marginTop: 20,
    borderWidth: 1, borderColor: '#FF7F50', borderStyle: 'dashed', backgroundColor: '#FFF0EA'
  },
  buildMealBtnText: { color: '#FF7F50', fontWeight: '700', marginLeft: 5 },
  
  addedMealCard: {
    backgroundColor: '#f9f9f9', padding: 16, borderRadius: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  mealInfo: { flex: 1 },
  mealNameText: { fontWeight: '700', color: '#111' },
  mealDetailText: { fontSize: 13, color: '#FF7F50', marginTop: 4, fontWeight: '600' },
  dishListText: { fontSize: 11, color: '#888', marginTop: 4 },
  
  addDateBtn: {
    flexDirection: 'row', backgroundColor: '#eaeaea',
    padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  addDateBtnText: { color: '#111', fontSize: 15, fontWeight: '700', marginLeft: 5 },
  
  footerContainer: {
      position: 'absolute', bottom: 100, // Above the tab bar
      left: 0, right: 0, paddingHorizontal: 24,
  },
  chargeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  chargeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginRight: 10,
  },
  chargeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 10,
    width: 90,
  },
  chargeCurrency: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginRight: 4,
  },
  chargeInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  footerWrapper: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  totalContainer: { flex: 1, paddingLeft: 10 },
  totalLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  previewBtn: { 
      backgroundColor: '#FF7F50', paddingVertical: 14, paddingHorizontal: 20, 
      borderRadius: 16, flexDirection: 'row', alignItems: 'center'
  },
  previewBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 20, textAlign: 'center' },
  modalScroll: { marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  checkboxLabel: { fontSize: 15, marginLeft: 12, color: '#111', fontWeight: '500' },
  
  modalInputSection: { marginTop: 10 },
  modalInputWrapper: { backgroundColor: '#f9f9f9', borderRadius: 16, paddingHorizontal: 16, marginBottom: 12 },
  modalInput: { paddingVertical: 14, fontSize: 15, color: '#111' },
  halfInput: { flex: 1 },
  rightGap: { marginRight: 6 },
  leftGap: { marginLeft: 6 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { padding: 16, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: '#888', fontWeight: '700', fontSize: 15 },
  saveBtn: { backgroundColor: '#111', paddingVertical: 16, flex: 1, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
