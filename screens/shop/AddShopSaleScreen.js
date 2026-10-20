import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessContext } from '../../context/BusinessContext';
import { ThemeContext } from '../../context/ThemeContext';

export default function AddShopSaleScreen({ navigation }) {
  const { shopSales, addShopSale, updateShopSale } = useContext(BusinessContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [morningSales, setMorningSales] = useState('');
  const [nightSales, setNightSales] = useState('');
  const [existingSaleId, setExistingSaleId] = useState(null);

  // Check if a sale already exists for the selected date
  useEffect(() => {
    const selectedDateStr = date.toLocaleDateString('en-GB');
    const existing = shopSales.find(s => {
      const d = new Date(s.date);
      return !isNaN(d.getTime()) && d.toLocaleDateString('en-GB') === selectedDateStr;
    });

    if (existing) {
      setExistingSaleId(existing.id);
      setMorningSales(existing.morningSales ? existing.morningSales.toString() : '');
      setNightSales(existing.nightSales ? existing.nightSales.toString() : '');
    } else {
      setExistingSaleId(null);
      setMorningSales('');
      setNightSales('');
    }
  }, [date, shopSales]);

  const handleSave = () => {
    const morning = parseFloat(morningSales || 0);
    const night = parseFloat(nightSales || 0);
    const total = morning + night;

    if (total <= 0 && !existingSaleId) {
      Alert.alert('Empty Sales', 'Please enter either morning or night sales figures.');
      return;
    }

    if (existingSaleId) {
      updateShopSale(existingSaleId, {
        morningSales: morning,
        nightSales: night,
        totalSales: total
      });
    } else {
      const saleData = {
        id: Date.now().toString(),
        date: date.toISOString(),
        morningSales: morning,
        nightSales: night,
        totalSales: total
      };
      addShopSale(saleData);
    }
    navigation.goBack();
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const total = (parseFloat(morningSales || 0) + parseFloat(nightSales || 0));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.mainTitle}>{existingSaleId ? 'Edit Sales Shift' : 'Record Shift Sales'}</Text>
          <Text style={styles.subtitle}>Enter morning and evening counter revenues</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* DATE PICKER TILE */}
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.dateIconCircle}>
              <Ionicons name="calendar" size={18} color={theme.primary} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.dateLabel}>SHIFT DATE</Text>
              <Text style={styles.datePickerText}>{date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
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

        {/* MORNING SHIFT */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="sunny" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
            <Text style={styles.inputLabel}>MORNING SHIFT SALES (₹)</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              value={morningSales}
              onChangeText={setMorningSales}
            />
          </View>
        </View>

        {/* NIGHT SHIFT */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="moon" size={16} color="#6366F1" style={{ marginRight: 6 }} />
            <Text style={styles.inputLabel}>NIGHT SHIFT SALES (₹)</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              value={nightSales}
              onChangeText={setNightSales}
            />
          </View>
        </View>

        {/* TOTAL SALES DISPLAY CARD */}
        <LinearGradient
          colors={isDarkMode ? ['#131B2E', '#0B101D'] : ['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalBox}
        >
          <View>
            <Text style={styles.totalLabel}>TOTAL DAY GROSS</Text>
            <Text style={styles.totalSub}>Morning + Night Combined</Text>
          </View>
          <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        </LinearGradient>

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.88} onPress={handleSave}>
          <LinearGradient
            colors={theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>{existingSaleId ? 'Update Sales Entry' : 'Save Shift Sales'}</Text>
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
    backgroundColor: theme.primaryLight,
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
    color: theme.primary, 
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
  },
  inputContainer: {
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
    color: theme.primary,
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 22, 
    fontWeight: '900', 
    color: theme.text,
  },
  totalBox: { 
    marginTop: 10, 
    borderRadius: 22, 
    padding: 22,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDarkMode ? 0.35 : 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  totalLabel: { 
    fontSize: 11, 
    color: '#94A3B8', 
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  totalSub: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
    fontWeight: '500',
  },
  totalValue: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#34D399',
    letterSpacing: -0.5,
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 18, 
    overflow: 'hidden',
    shadowColor: theme.primary, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 14, 
    elevation: 5,
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
  }
});
