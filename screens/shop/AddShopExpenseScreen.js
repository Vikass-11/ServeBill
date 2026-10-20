import React, { useState, useContext } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessContext } from '../../context/BusinessContext';
import { ThemeContext } from '../../context/ThemeContext';

export default function AddShopExpenseScreen({ navigation }) {
  const { addShopExpense } = useContext(BusinessContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  
  const [expenseType, setExpenseType] = useState('PURCHASE'); // 'PURCHASE' or 'OTHER'
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }
    if (expenseType === 'PURCHASE' && !item.trim()) {
      Alert.alert('Missing Item', 'Please enter the item name for this purchase.');
      return;
    }
    if (expenseType === 'OTHER' && !category.trim()) {
      Alert.alert('Missing Category', 'Please enter a category for this expense.');
      return;
    }

    const expenseData = {
      id: Date.now().toString(),
      type: expenseType,
      item: expenseType === 'PURCHASE' ? item.trim() : '',
      category: expenseType === 'OTHER' ? category.trim() : 'Inventory',
      amount: parseFloat(amount),
      date: date.toISOString(),
      notes: notes.trim(),
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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.mainTitle}>Log Shop Cost</Text>
          <Text style={styles.subtitle}>Inventory purchases & operating expenses</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TYPE TOGGLE PILL */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, expenseType === 'PURCHASE' && styles.toggleBtnActive]}
            onPress={() => setExpenseType('PURCHASE')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="cart" 
              size={16} 
              color={expenseType === 'PURCHASE' ? theme.background : theme.textSecondary} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.toggleText, expenseType === 'PURCHASE' && styles.toggleTextActive]}>
              Raw Material / Stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toggleBtn, expenseType === 'OTHER' && styles.toggleBtnActive]}
            onPress={() => setExpenseType('OTHER')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="receipt" 
              size={16} 
              color={expenseType === 'OTHER' ? theme.background : theme.textSecondary} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.toggleText, expenseType === 'OTHER' && styles.toggleTextActive]}>
              Operating Cost
            </Text>
          </TouchableOpacity>
        </View>

        {/* DATE PICKER TILE */}
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

        {/* AMOUNT */}
        <View style={styles.inputGroup}>
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
            />
          </View>
        </View>

        {/* ITEM OR CATEGORY */}
        {expenseType === 'PURCHASE' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ITEM OR MATERIAL NAME *</Text>
            <View style={styles.standardInputWrap}>
              <Ionicons name="basket-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.standardInput}
                placeholder="e.g. Cooking Oil, Basmati Rice, Milk"
                placeholderTextColor={theme.textMuted}
                value={item}
                onChangeText={setItem}
              />
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EXPENSE CATEGORY *</Text>
            <View style={styles.standardInputWrap}>
              <Ionicons name="pricetag-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.standardInput}
                placeholder="e.g. Electricity, Daily Wages, Gas Cylinder"
                placeholderTextColor={theme.textMuted}
                value={category}
                onChangeText={setCategory}
              />
            </View>
          </View>
        )}

        {/* NOTES */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ADDITIONAL NOTES (OPTIONAL)</Text>
          <View style={[styles.standardInputWrap, { height: 90, alignItems: 'flex-start', paddingTop: 12 }]}>
            <Ionicons name="create-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.standardInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Vendor name, bill number, or notes..."
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
              Log {expenseType === 'PURCHASE' ? 'Inventory Purchase' : 'Expense'}
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
    letterSpacing: -0.4 
  },
  subtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 18,
    paddingBottom: 100 
  },
  toggleContainer: { 
    flexDirection: 'row', 
    backgroundColor: theme.card, 
    borderRadius: 20, 
    padding: 4, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleBtn: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, 
    borderRadius: 16,
  },
  toggleBtnActive: { 
    backgroundColor: theme.text, 
    shadowColor: theme.shadow, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 6, 
    elevation: 2,
  },
  toggleText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: theme.textSecondary,
  },
  toggleTextActive: { 
    color: theme.background, 
    fontWeight: '800',
  },
  datePickerBtn: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: theme.card, 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: isDarkMode ? 0.2 : 0.04, 
    shadowRadius: 10, 
    elevation: 2,
  },
  dateIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 0.8,
  },
  datePickerText: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: theme.text, 
    marginTop: 2,
  },
  changeText: { 
    color: theme.error, 
    fontSize: 12, 
    fontWeight: '800' 
  },
  inputGroup: { 
    marginBottom: 18 
  },
  inputLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: theme.textSecondary, 
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 2,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card, 
    borderRadius: 18, 
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow, 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: isDarkMode ? 0.2 : 0.03, 
    shadowRadius: 8, 
    elevation: 2,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.error,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 22, 
    fontWeight: '900', 
    color: theme.text,
  },
  standardInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.15 : 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  standardInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 14,
  },
  saveBtn: {
    marginTop: 14,
    borderRadius: 18, 
    overflow: 'hidden',
    shadowColor: theme.error, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 14, 
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
    fontSize: 15, 
    fontWeight: '800',
  }
});
