import React, { useState, useContext } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessContext } from '../../context/BusinessContext';
import { ThemeContext } from '../../context/ThemeContext';

const PRESET_CATEGORIES = [
  { id: 'Electricity / EB', label: 'Electricity / EB', icon: 'flash' },
  { id: 'Shop Rent', label: 'Shop Rent', icon: 'business' },
  { id: 'Daily Wages', label: 'Daily Wages', icon: 'people' },
  { id: 'Tea & Snacks', label: 'Tea & Snacks', icon: 'cafe' },
  { id: 'Repairs & Maintenance', label: 'Repairs', icon: 'construct' },
  { id: 'Packaging Material', label: 'Packaging', icon: 'cube' },
  { id: 'Cleaning & Supplies', label: 'Cleaning', icon: 'trash-bin' },
  { id: 'Other', label: 'Other Overhead', icon: 'receipt' },
];

export default function AddShopExpenseScreen({ navigation }) {
  const { addShopExpense } = useContext(BusinessContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [category, setCategory] = useState('Electricity / EB');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const selectedCategoryName = category === 'Other' && customCategory.trim() 
    ? customCategory.trim() 
    : category;

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }
    if (!selectedCategoryName.trim()) {
      Alert.alert('Missing Category', 'Please select or enter an expense category.');
      return;
    }

    const expenseData = {
      id: Date.now().toString(),
      type: 'OTHER',
      item: '',
      category: selectedCategoryName,
      amount: parseFloat(amount),
      date: date.toISOString(),
      notes: notes.trim(),
    };

    addShopExpense(expenseData);
    Alert.alert('Bill Recorded', `Recorded ₹${parseFloat(amount).toFixed(2)} under ${selectedCategoryName}.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.mainTitle}>Shop Bills & Overheads</Text>
          <Text style={styles.subtitle}>Rent, electricity, wages & operational costs</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HELPFUL BANNER ROUTING GROCERIES TO STORE TRACKER */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconCircle}>
            <Ionicons name="pricetags" size={18} color="#6366F1" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoTitle}>Buying Groceries or Stock?</Text>
            <Text style={styles.infoSub}>
              Use the Store Price Tracker to track item photos & price changes.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.infoActionBtn}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('StoreDirectory');
            }}
          >
            <Text style={styles.infoActionText}>Open Stores</Text>
            <Ionicons name="chevron-forward" size={14} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* AMOUNT INPUT CARD */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>AMOUNT SPENT (₹) *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              value={amount}
              onChangeText={setAmount}
              autoFocus={true}
            />
          </View>
        </View>

        {/* CATEGORY SELECTOR */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>SELECT BILL / EXPENSE TYPE *</Text>
          <View style={styles.presetGrid}>
            {PRESET_CATEGORIES.map(cat => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={cat.icon} 
                    size={16} 
                    color={isSelected ? '#FFFFFF' : theme.textSecondary} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {category === 'Other' && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.inputLabel, { fontSize: 11 }]}>CUSTOM BILL DESCRIPTION *</Text>
              <View style={styles.standardInputWrap}>
                <Ionicons name="create-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.standardInput}
                  placeholder="e.g. Garbage fee, Water can, Generator fuel"
                  placeholderTextColor={theme.textMuted}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                />
              </View>
            </View>
          )}
        </View>

        {/* DATE PICKER TILE */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.dateIconCircle}>
                <Ionicons name="calendar" size={18} color={theme.error} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.dateLabel}>EXPENSE DATE</Text>
                <Text style={styles.datePickerText}>
                  {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}
        </View>

        {/* NOTES */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>ADDITIONAL NOTES (OPTIONAL)</Text>
          <View style={[styles.standardInputWrap, { height: 80, alignItems: 'flex-start', paddingTop: 10 }]}>
            <Ionicons name="document-text-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.standardInput, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Receipt / Reference number, payee name, notes..."
              placeholderTextColor={theme.textMuted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.88} onPress={handleSave}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>
              Record {selectedCategoryName || 'Bill'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 14, 
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: { 
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: theme.text,
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 12, 
    color: theme.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: { 
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3730A3' : '#C7D2FE',
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#312E81' : '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: isDarkMode ? '#FFFFFF' : '#312E81',
  },
  infoSub: {
    fontSize: 11,
    color: isDarkMode ? '#A5B4FC' : '#4338CA',
    marginTop: 2,
  },
  infoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#FFFFFF',
  },
  infoActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    marginRight: 2,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.error,
    paddingHorizontal: 16,
    height: 64,
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.error,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 30,
    fontWeight: '900',
    color: theme.text,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1F2937' : '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  presetChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  standardInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    height: 48,
  },
  standardInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#3B1A1A' : '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginTop: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  saveBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
