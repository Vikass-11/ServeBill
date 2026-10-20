import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { MenuContext } from '../context/MenuContext';
import { ThemeContext } from '../context/ThemeContext';

export default function PremiumManageMenuScreen() {
  const { 
    tiffinItems, addTiffinItem, deleteTiffinItem,
    mealDishes, addMealDish, deleteMealDish 
  } = useContext(MenuContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [activeTab, setActiveTab] = useState('tiffin'); // 'tiffin' or 'meals'
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  // Form State: Tiffin
  const [tiffinName, setTiffinName] = useState('');
  const [tiffinPrice, setTiffinPrice] = useState('');
  const [tiffinCostPrice, setTiffinCostPrice] = useState('');
  const [tiffinStock, setTiffinStock] = useState('');
  const [tiffinUnit, setTiffinUnit] = useState('nos');

  // Form State: Meals
  const [mealDishName, setMealDishName] = useState('');

  // Filtering
  const filteredTiffins = useMemo(() => {
    return tiffinItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tiffinItems, searchQuery]);

  const filteredMeals = useMemo(() => {
    return mealDishes.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mealDishes, searchQuery]);

  const handleAddTiffin = () => {
    if (!tiffinName.trim() || !tiffinPrice.trim()) {
      Alert.alert('Missing Info', 'Please enter both item name and unit price.');
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      name: tiffinName.trim(),
      price: parseFloat(tiffinPrice),
      costPrice: tiffinCostPrice ? parseFloat(tiffinCostPrice) : 0,
      stock: tiffinStock ? parseInt(tiffinStock, 10) : 0,
      unit: tiffinUnit,
    };
    addTiffinItem(newItem);
    setTiffinName('');
    setTiffinPrice('');
    setTiffinCostPrice('');
    setTiffinStock('');
    setAddModalVisible(false);
    Keyboard.dismiss();
  };

  const handleAddMealDish = () => {
    if (!mealDishName.trim()) {
      Alert.alert('Missing Info', 'Please enter a master dish name.');
      return;
    }
    const newDish = {
      id: Date.now().toString(),
      name: mealDishName.trim(),
    };
    addMealDish(newDish);
    setMealDishName('');
    setAddModalVisible(false);
    Keyboard.dismiss();
  };

  const confirmDelete = (item, type) => {
    Alert.alert(
      'Remove Dish',
      `Are you sure you want to remove "${item.name}" from your catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => {
            if (type === 'tiffin') deleteTiffinItem(item.id);
            else deleteMealDish(item.id);
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* SEGMENTED TAB SWITCHER */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'tiffin' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('tiffin')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="cafe" 
            size={16} 
            color={activeTab === 'tiffin' ? '#FFFFFF' : theme.textSecondary} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.segmentText, activeTab === 'tiffin' && styles.segmentTextActive]}>
            Tiffins ({tiffinItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'meals' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('meals')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="restaurant" 
            size={16} 
            color={activeTab === 'meals' ? '#FFFFFF' : theme.textSecondary} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.segmentText, activeTab === 'meals' && styles.segmentTextActive]}>
            Meals ({mealDishes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab === 'tiffin' ? 'tiffins' : 'meal dishes'}...`}
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'meals' && (
        <View style={styles.helperNotice}>
          <Ionicons name="information-circle-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
          <Text style={styles.helperNoticeText}>
            Meal dishes are baseline items. Final Thali package pricing is set during invoice creation.
          </Text>
        </View>
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    if (activeTab === 'tiffin') {
      return (
        <View style={styles.itemCard}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="cafe" size={20} color={theme.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.itemMetaRow}>
                <Text style={styles.itemPrice}>
                  ₹{item.price} <Text style={styles.itemUnit}>/ {item.unit || 'nos'}</Text>
                </Text>
                {item.stock !== undefined && (
                  <View style={styles.stockBadge}>
                    <Text style={styles.stockBadgeText}>Stock: {item.stock}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => confirmDelete(item, 'tiffin')} 
            style={styles.deleteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.itemCard}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2B1A3A' : '#F5F3FF' }]}>
              <Ionicons name="restaurant" size={20} color={theme.accentPurple} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemMetaText}>Standard Thali Dish</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => confirmDelete(item, 'meals')} 
            style={styles.deleteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      );
    }
  };

  const activeList = activeTab === 'tiffin' ? filteredTiffins : filteredMeals;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.headerPillText}>Menu Inventory</Text>
          </View>
          <Text style={styles.mainTitle}>
            Menu <Text style={{ color: theme.primary }}>Catalog.</Text>
          </Text>
          <Text style={styles.subtitle}>A la carte items & master banquet dishes</Text>
        </View>

        <TouchableOpacity
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
          style={styles.addBtnContainer}
        >
          <LinearGradient
            colors={theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addBtnGradient}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeList}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons 
                name={activeTab === 'tiffin' ? 'cafe-outline' : 'restaurant-outline'} 
                size={36} 
                color={theme.primary} 
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No dishes match your search' : 'No items added yet'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery 
                ? 'Try a different search term.' 
                : `Tap "+ Add" above to register your first ${activeTab === 'tiffin' ? 'tiffin item' : 'meal dish'}.`}
            </Text>
          </View>
        }
      />

      {/* ADD ITEM MODAL */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Add {activeTab === 'tiffin' ? 'Tiffin Item' : 'Meal Dish'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {activeTab === 'tiffin' 
                    ? 'Enter item name, pricing, and stock details' 
                    : 'Add dish to your master meal checklist'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {activeTab === 'tiffin' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ITEM NAME *</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="fast-food-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Masala Dosa, Ghee Idly"
                        placeholderTextColor={theme.textMuted}
                        value={tiffinName}
                        onChangeText={setTiffinName}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SELLING PRICE PER UNIT (₹) *</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="cash-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 50"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                        value={tiffinPrice}
                        onChangeText={setTiffinPrice}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>COST PRICE (OPTIONAL)</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="pricetag-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 25"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                        value={tiffinCostPrice}
                        onChangeText={setTiffinCostPrice}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>UNIT MEASUREMENT</Text>
                    <View style={styles.unitRow}>
                      {['nos', 'plate', 'kg', 'cup'].map(u => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.unitChip, tiffinUnit === u && styles.unitChipActive]}
                          onPress={() => setTiffinUnit(u)}
                        >
                          <Text style={[styles.unitChipText, tiffinUnit === u && styles.unitChipTextActive]}>
                            {u.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    activeOpacity={0.88}
                    onPress={handleAddTiffin}
                  >
                    <LinearGradient
                      colors={theme.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveBtnGradient}
                    >
                      <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.saveBtnText}>Add Tiffin Item</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>DISH NAME *</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="restaurant-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Paneer Butter Masala, Rasam"
                        placeholderTextColor={theme.textMuted}
                        value={mealDishName}
                        onChangeText={setMealDishName}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    activeOpacity={0.88}
                    onPress={handleAddMealDish}
                  >
                    <LinearGradient
                      colors={theme.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveBtnGradient}
                    >
                      <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.saveBtnText}>Add to Master Dishes</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginRight: 6,
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  addBtnContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  listHeaderContainer: {
    marginBottom: 12,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
  },
  segmentBtnActive: {
    backgroundColor: theme.text,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  segmentTextActive: {
    color: theme.background,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 2,
  },
  helperNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 10,
  },
  helperNoticeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
    lineHeight: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  itemCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  itemUnit: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  stockBadge: {
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  itemMetaText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 13,
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 3,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
  },
  unitChipActive: {
    backgroundColor: theme.text,
    borderColor: theme.text,
  },
  unitChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  unitChipTextActive: {
    color: theme.background,
  },
  saveBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: theme.primary,
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
  },
});
