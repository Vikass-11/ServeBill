import React, { useState, useContext } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { BusinessContext } from '../../context/BusinessContext';

export default function AddShopExpenseScreen({ navigation }) {
  const { addShopExpense } = useContext(BusinessContext);
  
  const [expenseType, setExpenseType] = useState('PURCHASE'); // 'PURCHASE' or 'OTHER'
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (expenseType === 'PURCHASE' && !item.trim()) {
      Alert.alert('Missing Item', 'Please enter the item name for the purchase.');
      return;
    }
    if (expenseType === 'OTHER' && !category.trim()) {
      Alert.alert('Missing Category', 'Please enter a category for the expense.');
      return;
    }

    const expenseData = {
      id: Date.now().toString(),
      type: expenseType,
      item: expenseType === 'PURCHASE' ? item : '',
      category: expenseType === 'OTHER' ? category : 'Inventory',
      amount: parseFloat(amount),
      date: date.toISOString(),
      notes
    };

    addShopExpense(expenseData);
    navigation.goBack();
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>Add <Text style={{ color: '#4ade80' }}>Expense</Text></Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Toggle PURCHASE / OTHER */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, expenseType === 'PURCHASE' && styles.toggleBtnActive]}
            onPress={() => setExpenseType('PURCHASE')}
          >
            <Text style={[styles.toggleText, expenseType === 'PURCHASE' && styles.toggleTextActive]}>Purchase</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, expenseType === 'OTHER' && styles.toggleBtnActive]}
            onPress={() => setExpenseType('OTHER')}
          >
            <Text style={[styles.toggleText, expenseType === 'OTHER' && styles.toggleTextActive]}>Other Expense</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={20} color="#111" />
            <Text style={styles.datePickerText}>{date.toLocaleDateString('en-GB')}</Text>
          </View>
          <Text style={styles.changeText}>Edit</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {expenseType === 'PURCHASE' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Item Purchased</Text>
            <TextInput
              style={[styles.input, { fontSize: 16 }]}
              placeholder="e.g. Rice, Dal, Oil..."
              value={item}
              onChangeText={setItem}
            />
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expense Category</Text>
            <TextInput
              style={[styles.input, { fontSize: 16 }]}
              placeholder="e.g. Rent, Salary, Electricity..."
              value={category}
              onChangeText={setCategory}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, { fontSize: 16, height: 80, textAlignVertical: 'top' }]}
            placeholder="Any extra details..."
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save {expenseType === 'PURCHASE' ? 'Purchase' : 'Expense'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  backBtn: { marginRight: 15 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  
  toggleContainer: { 
    flexDirection: 'row', backgroundColor: '#e5e5e5', borderRadius: 12, padding: 4, marginBottom: 25 
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#888' },
  toggleTextActive: { color: '#111', fontWeight: '800' },

  datePickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  datePickerText: { fontSize: 16, fontWeight: '600', color: '#111', marginLeft: 10 },
  changeText: { color: '#4ade80', fontSize: 13, fontWeight: '700' },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 20, fontWeight: '700', color: '#111',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
  },

  saveBtn: {
    backgroundColor: '#4ade80', marginTop: 10,
    paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#4ade80', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 5,
  },
  saveBtnText: { color: '#111', fontSize: 16, fontWeight: '800' }
});
