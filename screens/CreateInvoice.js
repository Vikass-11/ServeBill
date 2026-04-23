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
import { LinearGradient } from 'expo-linear-gradient';
import { MenuContext } from '../context/MenuContext';

export default function CreateInvoiceScreen({ navigation }) {
  const { tiffinItems, mealDishes } = useContext(MenuContext);
  const [clientName, setClientName] = useState('');
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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.clientCard}>
          <View style={styles.iconHeading}>
            <Ionicons name="person" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Customer Details</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Client Name / Company Name"
            placeholderTextColor="#95a5a6"
            value={clientName}
            onChangeText={setClientName}
          />
        </View>

        {events.map((ev, index) => (
          <View key={ev.id} style={styles.eventCard}>
            <LinearGradient colors={['#3498db', '#2980b9']} style={styles.eventHeader}>
              <Text style={styles.eventDayText}>Service Day {index + 1}</Text>
              <TouchableOpacity onPress={() => removeEvent(ev.id)}>
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.cardPadding}>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => {
                  setActiveEventId(ev.id);
                  setShowPicker(true);
                }}
              >
                <View style={styles.row}>
                  <Ionicons name="calendar" size={20} color="#3498db" />
                  <Text style={styles.datePickerText}>
                    {' '}
                    {new Date(ev.date).toLocaleDateString('en-GB')}
                  </Text>
                </View>
                <Text style={styles.changeText}>Edit Date</Text>
              </TouchableOpacity>

              <View style={styles.subHeaderRow}>
                <Ionicons name="fast-food-outline" size={18} color="#7f8c8d" />
                <Text style={styles.subTitle}>Tiffin Quantities</Text>
              </View>

              {tiffinItems.map((item) => (
                <View key={item.id} style={styles.menuRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSubText}>Rs. {item.price} per {item.unit}</Text>
                  </View>
                  <View style={styles.counter}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateTiffinQuantity(ev.id, item.id, -1)}
                    >
                      <Ionicons name="remove" size={20} color="#fff" />
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
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={[styles.subHeaderRow, styles.mealHeaderSpacing]}>
                <Ionicons name="restaurant-outline" size={18} color="#7f8c8d" />
                <Text style={styles.subTitle}>Meal Packages</Text>
              </View>

              {ev.addedMeals.map((meal) => (
                <View key={meal.id} style={styles.addedMealCard}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealNameText}>{meal.name}</Text>
                    <Text style={styles.mealDetailText}>
                      {meal.quantity} plates x Rs. {meal.price}
                    </Text>
                    <Text style={styles.dishListText}>Items: {meal.dishes.join(', ')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeMeal(ev.id, meal.id)}>
                    <Ionicons name="trash" size={20} color="#e74c3c" />
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
                <Ionicons name="construct-outline" size={18} color="#f39c12" />
                <Text style={styles.buildMealBtnText}> Build Meals for Day {index + 1}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addDateBtn} onPress={addNewDateEvent}>
          <Ionicons name="add-circle" size={22} color="#fff" />
          <Text style={styles.addDateBtnText}> Add Another Service Date</Text>
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

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Estimate</Text>
          <Text style={styles.totalValue}>Rs. {calculateGrandTotal()}</Text>
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
            });
          }}
        >
          <LinearGradient colors={['#27ae60', '#2ecc71']} style={styles.previewGradient}>
            <Text style={styles.previewBtnText}>GENERATE PREVIEW</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Dishes for Package</Text>
            <ScrollView style={styles.modalScroll}>
              {mealDishes.map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.checkboxRow}
                  onPress={() => toggleDishSelection(dish.name)}
                >
                  <Ionicons
                    name={tempSelectedDishes.includes(dish.name) ? 'checkbox' : 'square-outline'}
                    size={24}
                    color="#3498db"
                  />
                  <Text style={styles.checkboxLabel}>{dish.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalInputSection}>
              <TextInput
                style={styles.input}
                placeholder="Package Label"
                value={tempMealName}
                onChangeText={setTempMealName}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput, styles.rightGap]}
                  placeholder="Price"
                  keyboardType="numeric"
                  value={tempMealPrice}
                  onChangeText={setTempMealPrice}
                />
                <TextInput
                  style={[styles.input, styles.halfInput, styles.leftGap]}
                  placeholder="Qty"
                  keyboardType="numeric"
                  value={tempMealQty}
                  onChangeText={setTempMealQty}
                />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9' },
  scrollContent: { paddingBottom: 100 },
  clientCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginLeft: 8 },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#2c3e50',
  },
  eventCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    elevation: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  eventDayText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardPadding: { padding: 15 },
  datePickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  datePickerText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  changeText: { color: '#3498db', fontSize: 12, fontWeight: 'bold' },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 5,
  },
  mealHeaderSpacing: { marginTop: 20 },
  subTitle: { fontSize: 15, fontWeight: 'bold', color: '#7f8c8d', marginLeft: 6 },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemSubText: { color: '#95a5a6', fontSize: 13, marginTop: 2 },
  counter: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: {
    backgroundColor: '#3498db',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInput: {
    width: 68,
    height: 40,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#d7e3ea',
    borderRadius: 10,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  buildMealBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#f39c12',
    borderStyle: 'dashed',
  },
  buildMealBtnText: { color: '#f39c12', fontWeight: 'bold' },
  addedMealCard: {
    backgroundColor: '#fff9f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  mealInfo: { flex: 1 },
  mealNameText: { fontWeight: 'bold', color: '#d35400' },
  mealDetailText: { fontSize: 13, color: '#666', marginTop: 2 },
  dishListText: { fontSize: 11, fontStyle: 'italic', color: '#7f8c8d', marginTop: 2 },
  addDateBtn: {
    flexDirection: 'row',
    backgroundColor: '#8e44ad',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalContainer: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#7f8c8d', fontWeight: 'bold' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#27ae60' },
  previewBtn: { flex: 1.5 },
  previewGradient: { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  previewBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalScroll: { marginBottom: 15 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkboxLabel: { fontSize: 16, marginLeft: 10, color: '#2c3e50' },
  modalInputSection: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  halfInput: { flex: 1 },
  rightGap: { marginRight: 5 },
  leftGap: { marginLeft: 5 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  cancelBtn: { padding: 10, marginRight: 20 },
  cancelBtnText: { color: '#e74c3c', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2ecc71', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
