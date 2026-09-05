import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { BusinessContext } from '../../context/BusinessContext';

export default function AddShopSaleScreen({ navigation }) {
  const { shopSales, addShopSale, updateShopSale } = useContext(BusinessContext);
  
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
      Alert.alert('Empty Sales', 'Please enter either morning or night sales.');
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>Add <Text style={{ color: '#FF7F50' }}>Sales</Text></Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.inputLabel}>Morning Sales (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            value={morningSales}
            onChangeText={setMorningSales}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Night Sales (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            value={nightSales}
            onChangeText={setNightSales}
          />
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Sales</Text>
          <Text style={styles.totalValue}>₹{(parseFloat(morningSales || 0) + parseFloat(nightSales || 0)).toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{existingSaleId ? 'Update Sales' : 'Save Sales'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 25 },
  backBtn: { marginRight: 15 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  
  datePickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  datePickerText: { fontSize: 16, fontWeight: '600', color: '#111', marginLeft: 10 },
  changeText: { color: '#FF7F50', fontSize: 13, fontWeight: '700' },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 18,
    fontSize: 20, fontWeight: '700', color: '#111',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
  },

  totalBox: { 
    marginTop: 20, backgroundColor: '#111', borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  totalLabel: { fontSize: 16, color: '#fff', fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#4ade80' },

  saveBtn: {
    backgroundColor: '#FF7F50', marginTop: 25,
    paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#FF7F50', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
