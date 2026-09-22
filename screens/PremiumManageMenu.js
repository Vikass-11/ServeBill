import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import our Context
import { MenuContext } from '../context/MenuContext';
import { ThemeContext } from '../context/ThemeContext';

export default function PremiumManageMenuScreen() {
  // Pull in BOTH lists and functions from Context
  const { 
    tiffinItems, addTiffinItem, deleteTiffinItem,
    mealDishes, addMealDish, deleteMealDish 
  } = useContext(MenuContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  // Tab State
  const [activeTab, setActiveTab] = useState('tiffin'); 

  // Form State: Tiffin
  const [tiffinName, setTiffinName] = useState('');
  const [tiffinPrice, setTiffinPrice] = useState('');
  const [tiffinCostPrice, setTiffinCostPrice] = useState('');
  const [tiffinStock, setTiffinStock] = useState('');
  const [tiffinUnit, setTiffinUnit] = useState('nos');

  // Form State: Meals
  const [mealDishName, setMealDishName] = useState('');

  // --- ACTIONS ---
  const handleAddTiffin = () => {
    if (!tiffinName.trim() || !tiffinPrice.trim()) {
      Alert.alert('Missing Info', 'Please enter both name and price.');
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      name: tiffinName,
      price: parseFloat(tiffinPrice),
      costPrice: tiffinCostPrice ? parseFloat(tiffinCostPrice) : 0,
      stock: tiffinStock ? parseInt(tiffinStock, 10) : 0,
      unit: tiffinUnit,
    };
    addTiffinItem(newItem);
    setTiffinName('');
    setTiffinPrice('');
    Keyboard.dismiss();
    setTiffinCostPrice('');
    setTiffinStock('');
  };

  const handleAddMealDish = () => {
    if (!mealDishName.trim()) {
      Alert.alert('Missing Info', 'Please enter a dish name.');
      return;
    }
    const newDish = {
      id: Date.now().toString(),
      name: mealDishName,
    };
    addMealDish(newDish);
    setMealDishName('');
    Keyboard.dismiss();
  };

  // --- UI ---
  const renderHeaderContent = () => (
    <View>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>
          Manage <Text style={{color: theme.textMuted}}>Menu.</Text>
        </Text>
      </View>

      {/* PILL TAB SELECTOR */}
      <View style={styles.categoriesWrapper}>
        <TouchableOpacity 
          style={styles.categoryItem} 
          onPress={() => setActiveTab('tiffin')}
        >
          <View style={[styles.catIconPlaceholder, activeTab === 'tiffin' && styles.catActive]}>
              <Ionicons name="cafe" size={24} color={activeTab === 'tiffin' ? theme.background : theme.primary} />
          </View>
          <Text style={[styles.catText, activeTab === 'tiffin' && {fontWeight: 'bold', color: theme.text}]}>Tiffins</Text>
          {activeTab === 'tiffin' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.categoryItem} 
          onPress={() => setActiveTab('meals')}
        >
          <View style={[styles.catIconPlaceholder, activeTab === 'meals' && styles.catActive]}>
              <Ionicons name="fast-food" size={24} color={activeTab === 'meals' ? theme.background : theme.primary} />
          </View>
          <Text style={[styles.catText, activeTab === 'meals' && {fontWeight: 'bold', color: theme.text}]}>Meals</Text>
          {activeTab === 'meals' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* CONDITIONAL RENDERING BASED ON TAB */}
      <View style={styles.content}>
        {activeTab === 'tiffin' ? (
          <>
            <View style={styles.inputCard}>
              <Text style={styles.cardHeader}>Add New Tiffin</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="fast-food-outline" size={20} color="#aaa" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Item Name (e.g., Idly, Dosa)" 
                  placeholderTextColor="#aaa"
                  value={tiffinName} 
                  onChangeText={setTiffinName} 
                />
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="cash-outline" size={20} color="#aaa" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Price per unit" 
                  placeholderTextColor="#aaa"
                  value={tiffinPrice} 
                  onChangeText={setTiffinPrice} 
                  keyboardType="numeric" 
                />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="pricetag-outline" size={20} color="#aaa" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Cost Price (optional)" 
                  placeholderTextColor="#aaa"
                  value={tiffinCostPrice} 
                  onChangeText={setTiffinCostPrice} 
                  keyboardType="numeric" 
                />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="cube-outline" size={20} color="#aaa" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Initial Stock (optional)" 
                  placeholderTextColor="#aaa"
                  value={tiffinStock} 
                  onChangeText={setTiffinStock} 
                  keyboardType="numeric" 
                />
              </View>
              
              <View style={styles.unitRow}>
                {['nos', 'plate', 'kg'].map(unit => (
                  <TouchableOpacity 
                    key={unit} 
                    style={[styles.unitBtn, tiffinUnit === unit && styles.activeUnitBtn]} 
                    onPress={() => setTiffinUnit(unit)}
                  >
                    <Text style={[styles.unitBtnText, tiffinUnit === unit && styles.activeUnitBtnText]}>
                      {unit.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity onPress={handleAddTiffin} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Add Tiffin Item</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Current Menu</Text>
          </>
        ) : (
          <>
            <View style={styles.inputCard}>
              <Text style={styles.cardHeader}>Master Dish Entry</Text>
              <Text style={styles.helperText}>Add baseline dishes here (no prices needed). You will set the final Thali price on the invoice page.</Text>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="restaurant-outline" size={20} color="#aaa" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Dish Name (e.g., Potato Poriyal)" 
                  placeholderTextColor="#aaa"
                  value={mealDishName} 
                  onChangeText={setMealDishName} 
                />
              </View>
              
              <TouchableOpacity onPress={handleAddMealDish} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Add to Master List</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Master Meal Dishes</Text>
          </>
        )}
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    if (activeTab === 'tiffin') {
      return (
        <View style={styles.listItem}>
          <View style={styles.listLeftInfo}>
            <View style={styles.iconBoxTiffin}>
              <Ionicons name="cafe-outline" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                <Text style={{color: theme.primary}}>₹</Text>{item.price} / {item.unit} • Stock: {item.stock || 0}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => deleteTiffinItem(item.id)} style={styles.deleteBtn}>
            <Ionicons name="remove-circle-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.listItem}>
          <View style={styles.listLeftInfo}>
            <View style={styles.iconBoxMeal}>
              <Ionicons name="restaurant-outline" size={20} color={theme.text} />
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteMealDish(item.id)} style={styles.deleteBtn}>
            <Ionicons name="remove-circle-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <FlatList 
          data={activeTab === 'tiffin' ? tiffinItems : mealDishes}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={renderHeaderContent()}
          renderItem={renderItem}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 10 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  
  categoriesWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: theme.inputBackground,
    paddingVertical: 15,
    borderRadius: 40,
    marginHorizontal: 24,
  },
  categoryItem: { alignItems: 'center', marginHorizontal: 20 },
  catIconPlaceholder: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: theme.card,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  catActive: { backgroundColor: theme.text },
  catText: { fontSize: 13, color: theme.textSecondary },
  activeDot: { width: 20, height: 3, backgroundColor: theme.text, borderRadius: 2, marginTop: 4 },
  
  content: { flex: 1, paddingHorizontal: 24 },
  
  inputCard: { 
    backgroundColor: theme.card, padding: 20, borderRadius: 24, marginBottom: 20,
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05, shadowRadius: 15, elevation: 3,
  },
  cardHeader: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 15 },
  helperText: { color: theme.textSecondary, marginBottom: 20, fontSize: 13, lineHeight: 18 },
  
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.inputBackground, borderRadius: 16, paddingHorizontal: 16, marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: theme.text },
  
  unitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  unitBtn: { 
    flex: 1, paddingVertical: 12, borderRadius: 12, 
    alignItems: 'center', marginHorizontal: 4, backgroundColor: theme.inputBackground,
    borderWidth: 1, borderColor: theme.border
  },
  activeUnitBtn: { backgroundColor: theme.text, borderColor: theme.text },
  unitBtnText: { color: theme.textSecondary, fontWeight: '600', fontSize: 13 },
  activeUnitBtnText: { color: theme.background },
  
  primaryButton: { 
    backgroundColor: theme.text, borderRadius: 16, paddingVertical: 16, 
    alignItems: 'center', justifyContent: 'center', marginTop: 10
  },
  primaryButtonText: { color: theme.background, fontSize: 16, fontWeight: '700' },
  
  sectionTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 15, marginTop: 10 },
  
  listItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: theme.card, padding: 16, borderRadius: 20, marginBottom: 12, 
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    marginHorizontal: 24,
  },
  listLeftInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBoxTiffin: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA', 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  iconBoxMeal: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: theme.inputBackground, 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  itemName: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 },
  itemPrice: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
  
  deleteBtn: { padding: 8 },
});
