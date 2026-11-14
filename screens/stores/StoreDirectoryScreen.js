import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StoreContext } from '../../context/StoreContext';
import { ThemeContext } from '../../context/ThemeContext';

const STORE_CATEGORIES = [
  { label: 'All', icon: 'grid', color: '#6366F1', bg: '#EEF2FF' },
  { label: 'Provisions & Grocery', icon: 'cart', color: '#3B82F6', bg: '#DBEAFE' },
  { label: 'Vegetables & Fruits', icon: 'nutrition', color: '#10B981', bg: '#D1FAE5' },
  { label: 'Dairy & Milk', icon: 'water', color: '#06B6D4', bg: '#CFFAFE' },
  { label: 'Packaging & Disposables', icon: 'cube', color: '#8B5CF6', bg: '#EDE9FE' },
  { label: 'Wholesale Mandi', icon: 'business', color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'General Store', icon: 'storefront', color: '#6B7280', bg: '#F3F4F6' },
];

export default function StoreDirectoryScreen({ route, navigation }) {
  const { stores, refreshStores, addStore, deleteStore } = useContext(StoreContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Store Modal state
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Provisions & Grocery');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');

  useEffect(() => {
    if (route?.params?.autoOpenAddStore) {
      setAddModalVisible(true);
    }
  }, [route?.params]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshStores();
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      refreshStores();
    }, [refreshStores])
  );

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (s.category && s.category.toLowerCase() === selectedCategory.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [stores, selectedCategory, searchQuery]);

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      Alert.alert('Required', 'Please enter a store name.');
      return;
    }
    await addStore({
      name: newStoreName.trim(),
      category: newStoreCategory,
      phone: newStorePhone.trim(),
      address: newStoreAddress.trim(),
    });
    setNewStoreName('');
    setNewStorePhone('');
    setNewStoreAddress('');
    setAddModalVisible(false);
  };

  const handleDeleteStore = (store) => {
    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete "${store.name}"? All tracked prices for this store will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteStore(store.id) },
      ]
    );
  };

  const getCategoryConfig = (catName) => {
    return (
      STORE_CATEGORIES.find((c) => c.label.toLowerCase() === (catName || '').toLowerCase()) ||
      STORE_CATEGORIES[STORE_CATEGORIES.length - 1]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.pillBadge}>
            <Ionicons name="storefront" size={12} color={theme.pastelBlueDark || '#2C5A96'} />
            <Text style={styles.pillBadgeText}>Store & Purchase Directory</Text>
          </View>
          <Text style={styles.mainTitle}>
            Grocery <Text style={{ color: theme.primary }}>Stores</Text>
          </Text>
          <Text style={styles.subtitle}>Track shops, purchase history & price changes</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtnCircle}
          activeOpacity={0.85}
          onPress={() => setAddModalVisible(true)}
        >
          <LinearGradient colors={theme.primaryGradient || ['#FF7E69', '#FF5A40']} style={styles.addBtnGradient}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* PRICE COMPARISON PROMO CARD */}
      <TouchableOpacity
        style={styles.compareBanner}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('StorePriceCompare')}
      >
        <View style={[styles.compareBannerIcon, { backgroundColor: theme.pastelBlue || '#DCEBFF' }]}>
          <Ionicons name="pricetags" size={22} color={theme.pastelBlueDark || '#2C5A96'} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.compareBannerTitle}>Compare Prices Across Stores</Text>
          <Text style={styles.compareBannerSub}>Find lowest market rates for vegetables, oils & rice</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.primary} />
      </TouchableOpacity>

      {/* SEARCH BAR */}
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stores by name, area, category..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORY CHIPS */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {STORE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                  isSelected && { borderColor: theme.primary },
                ]}
                onPress={() => setSelectedCategory(cat.label)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : cat.color}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && { color: '#FFFFFF', fontWeight: '800' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* STORE LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {filteredStores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.pastelBlue || '#DCEBFF' }]}>
              <Ionicons name="storefront-outline" size={40} color={theme.pastelBlueDark || '#2C5A96'} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching stores' : 'No Stores Added Yet'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try searching with another keyword.'
                : 'Add stores where you regularly buy vegetables, provisions, or dairy to track prices.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              activeOpacity={0.85}
              onPress={() => setAddModalVisible(true)}
            >
              <Text style={styles.emptyActionText}>Add Your First Store</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredStores.map((store) => {
            const cfg = getCategoryConfig(store.category);
            return (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('StoreDetail', { store })}
              >
                <View style={[styles.storeIconBox, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                </View>

                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.storeName} numberOfLines={1}>
                      {store.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteStore(store)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={[styles.categoryBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.categoryBadgeText, { color: cfg.color }]}>
                        {store.category || 'General'}
                      </Text>
                    </View>
                    <Text style={styles.itemCountText}>
                      {store.itemCount || 0} {store.itemCount === 1 ? 'item' : 'items'} tracked
                    </Text>
                  </View>

                  {store.address ? (
                    <Text style={styles.addressText} numberOfLines={1}>
                      <Ionicons name="location-outline" size={11} color={theme.textSecondary} /> {store.address}
                    </Text>
                  ) : null}
                </View>

                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ADD STORE MODAL */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Grocery / Vendor Store</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Store / Vendor Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Sri Krishna Traders, Uzhavar Sandhai"
                placeholderTextColor={theme.textMuted}
                value={newStoreName}
                onChangeText={setNewStoreName}
              />

              <Text style={styles.inputLabel}>Store Category</Text>
              <View style={styles.categoryPickerWrap}>
                {STORE_CATEGORIES.filter((c) => c.label !== 'All').map((cat) => {
                  const isSel = newStoreCategory === cat.label;
                  return (
                    <TouchableOpacity
                      key={cat.label}
                      style={[
                        styles.catOptionPill,
                        isSel && { backgroundColor: cat.bg, borderColor: cat.color },
                      ]}
                      onPress={() => setNewStoreCategory(cat.label)}
                    >
                      <Ionicons name={cat.icon} size={14} color={isSel ? cat.color : theme.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.catOptionText, isSel && { color: cat.color, fontWeight: '700' }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9842235458"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                value={newStorePhone}
                onChangeText={setNewStorePhone}
              />

              <Text style={styles.inputLabel}>Address / Market Area (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Sulur Market, Shop #12"
                placeholderTextColor={theme.textMuted}
                value={newStoreAddress}
                onChangeText={setNewStoreAddress}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setAddModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleCreateStore}
                >
                  <Text style={styles.modalSaveText}>Save Store</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background || '#F8F7FC',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 12,
    },
    pillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.pastelBlue || '#DCEBFF',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      marginBottom: 4,
      gap: 5,
    },
    pillBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.pastelBlueDark || '#2C5A96',
    },
    mainTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    addBtnCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    addBtnGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    compareBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card || '#FFFFFF',
      marginHorizontal: 18,
      marginBottom: 12,
      padding: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    compareBannerIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    compareBannerTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    compareBannerSub: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    searchBarWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card || '#FFFFFF',
      marginHorizontal: 18,
      marginBottom: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      paddingVertical: 0,
    },
    categoryScroll: {
      paddingHorizontal: 18,
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor: theme.card || '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
    },
    categoryChipActive: {
      backgroundColor: theme.primary,
    },
    categoryChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 110,
      gap: 10,
    },
    storeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card || '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
    },
    storeIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    storeName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginRight: 8,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    itemCountText: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: '500',
    },
    addressText: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 4,
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
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 6,
    },
    emptySub: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
    },
    emptyActionBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 16,
    },
    emptyActionText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 14, 23, 0.55)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.card || '#FFFFFF',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 28,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    modalTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: theme.text,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 6,
      marginTop: 10,
    },
    modalInput: {
      backgroundColor: theme.inputBackground || '#F4F3F9',
      borderWidth: 1,
      borderColor: theme.inputBorder || '#E6E4EE',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: theme.text,
    },
    categoryPickerWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 6,
    },
    catOptionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
      backgroundColor: theme.card || '#FFFFFF',
    },
    catOptionText: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    modalSaveBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center',
    },
    modalSaveText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
