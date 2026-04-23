import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import our Context
import { MenuContext } from '../context/MenuContext';

export default function ManageMenuScreen() {
  // Pull in BOTH lists and functions from Context
  const { 
    tiffinItems, addTiffinItem, deleteTiffinItem,
    mealDishes, addMealDish, deleteMealDish 
  } = useContext(MenuContext);

  // Tab State
  const [activeTab, setActiveTab] = useState('tiffin'); 

  // Form State: Tiffin
  const [tiffinName, setTiffinName] = useState('');
  const [tiffinPrice, setTiffinPrice] = useState('');
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
      price: tiffinPrice,
      unit: tiffinUnit,
    };
    addTiffinItem(newItem);
    setTiffinName('');
    setTiffinPrice('');
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
  };

  // --- UI ---
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* PREMIUM TAB SELECTOR */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'tiffin' && styles.activeTab]} 
            onPress={() => setActiveTab('tiffin')}
          >
            <Ionicons name="fast-food" size={20} color={activeTab === 'tiffin' ? '#3498db' : '#95a5a6'} />
            <Text style={[styles.tabText, activeTab === 'tiffin' && styles.activeTabText]}> Tiffin Items</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'meals' && styles.activeTab]} 
            onPress={() => setActiveTab('meals')}
          >
            <Ionicons name="restaurant" size={20} color={activeTab === 'meals' ? '#3498db' : '#95a5a6'} />
            <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}> Meal Dishes</Text>
          </TouchableOpacity>
        </View>

        {/* CONDITIONAL RENDERING BASED ON TAB */}
        {activeTab === 'tiffin' ? (
          
          // --- TIFFIN TAB CONTENT ---
          <View style={styles.content}>
            <View style={styles.inputCard}>
              <Text style={styles.cardHeader}>Add New Tiffin</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Item Name (e.g., Idly, Dosa)" 
                placeholderTextColor="#95a5a6"
                value={tiffinName} 
                onChangeText={setTiffinName} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Price per unit (e.g., 10)" 
                placeholderTextColor="#95a5a6"
                value={tiffinPrice} 
                onChangeText={setTiffinPrice} 
                keyboardType="numeric" 
              />
              
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
              
              <TouchableOpacity onPress={handleAddTiffin}>
                <LinearGradient colors={['#27ae60', '#2ecc71']} style={styles.gradientButton}>
                  <Ionicons name="add-circle-outline" size={22} color="#fff" />
                  <Text style={styles.gradientButtonText}> Add Tiffin Item</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Current Tiffin Menu</Text>
            <FlatList 
              data={tiffinItems}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.listLeftInfo}>
                    <View style={styles.iconBoxTiffin}>
                      <Ionicons name="cafe-outline" size={20} color="#e67e22" />
                    </View>
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>₹{item.price} / {item.unit}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteTiffinItem(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

        ) : (

          // --- MEALS TAB CONTENT ---
          <View style={styles.content}>
            <View style={styles.inputCard}>
              <Text style={styles.cardHeader}>Master Dish Entry</Text>
              <Text style={styles.helperText}>Add baseline dishes here (no prices needed). You will set the final Thali price on the invoice page.</Text>
              
              <TextInput 
                style={styles.input} 
                placeholder="Dish Name (e.g., Potato Poriyal)" 
                placeholderTextColor="#95a5a6"
                value={mealDishName} 
                onChangeText={setMealDishName} 
              />
              
              <TouchableOpacity onPress={handleAddMealDish}>
                <LinearGradient colors={['#2980b9', '#3498db']} style={styles.gradientButton}>
                  <Ionicons name="add-circle-outline" size={22} color="#fff" />
                  <Text style={styles.gradientButtonText}> Add to Master List</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Master Meal Dishes</Text>
            <FlatList 
              data={mealDishes}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.listLeftInfo}>
                    <View style={styles.iconBoxMeal}>
                      <Ionicons name="restaurant-outline" size={20} color="#8e44ad" />
                    </View>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteMealDish(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10 // Keeps shadow visible over content
  },
  tabButton: { 
    flex: 1, 
    flexDirection: 'row',
    paddingVertical: 16, 
    justifyContent: 'center',
    alignItems: 'center', 
    borderBottomWidth: 3, 
    borderBottomColor: 'transparent' 
  },
  activeTab: { borderBottomColor: '#3498db' },
  tabText: { fontSize: 16, fontWeight: 'bold', color: '#95a5a6' },
  activeTabText: { color: '#3498db' },
  
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  
  inputCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
  helperText: { color: '#7f8c8d', marginBottom: 15, fontSize: 13, lineHeight: 18 },
  
  input: { 
    backgroundColor: '#f8f9fa',
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 10, 
    padding: 14, 
    marginBottom: 12, 
    fontSize: 16,
    color: '#2c3e50'
  },
  
  unitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  unitBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 8, 
    alignItems: 'center', 
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa'
  },
  activeUnitBtn: { backgroundColor: '#3498db', borderColor: '#3498db' },
  unitBtnText: { color: '#7f8c8d', fontWeight: 'bold', fontSize: 13 },
  activeUnitBtnText: { color: '#fff' },
  
  gradientButton: { 
    flexDirection: 'row',
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  gradientButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 10, marginLeft: 5 },
  
  listItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listLeftInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBoxTiffin: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fdf2e9', 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  iconBoxMeal: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5eef8', 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  itemPrice: { color: '#7f8c8d', marginTop: 4, fontSize: 13, fontWeight: '500' },
  
  deleteBtn: { padding: 8 },
});