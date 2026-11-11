import React, { useState, useContext, useMemo, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StoreContext } from '../../context/StoreContext';
import { ThemeContext } from '../../context/ThemeContext';
import { api } from '../../services/api';

const STORE_CATEGORIES = [
  { label: 'Vegetables & Fruits', icon: 'nutrition', color: '#10B981', bg: '#D1FAE5' },
  { label: 'Provisions & Grocery', icon: 'cart', color: '#3B82F6', bg: '#DBEAFE' },
  { label: 'Dairy & Milk', icon: 'water', color: '#06B6D4', bg: '#CFFAFE' },
  { label: 'Packaging & Disposables', icon: 'cube', color: '#8B5CF6', bg: '#EDE9FE' },
  { label: 'Meat & Poultry', icon: 'restaurant', color: '#EF4444', bg: '#FEE2E2' },
  { label: 'Wholesale Mandi', icon: 'business', color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'General Store', icon: 'storefront', color: '#6B7280', bg: '#F3F4F6' },
];

export default function StoreDirectoryScreen({ navigation }) {
  const { stores, refreshStores, addStore, deleteStore } = useContext(StoreContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [activeTab, setActiveTab] = useState('stores'); // 'stores' or 'compare'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Store Modal state
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Provisions & Grocery');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');

  // Comparison State
  const [comparisonList, setComparisonList] = useState([]);
  const [isCompareLoading, setIsCompareLoading] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshStores();
    if (activeTab === 'compare') {
      await loadComparison();
    }
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      refreshStores();
      if (activeTab === 'compare') {
        loadComparison();
      }
    }, [activeTab, refreshStores])
  );

  const loadComparison = async (query = searchQuery) => {
    try {
      setIsCompareLoading(true);
      const data = await api.getStorePriceComparison(query);
      if (data && Array.isArray(data)) {
        setComparisonList(data);
      }
    } catch (e) {
      console.warn('Comparison error:', e);
    } finally {
      setIsCompareLoading(false);
    }
  };

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const q = searchQuery.toLowerCase().trim();
    return stores.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
    );
  }, [stores, searchQuery]);

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
      `Are you sure you want to delete "${store.name}" and all its price history?`,
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.mainTitle}>
            Store <Text style={{ color: theme.primary }}>Prices.</Text>
          </Text>
          <Text style={styles.subtitle}>Track purchase history & compare shop rates</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtnCircle}
          activeOpacity={0.85}
          onPress={() => setAddModalVisible(true)}
        >
          <LinearGradient colors={theme.primaryGradient} style={styles.addBtnGradient}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* TOP SEGMENTED SWITCH */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'stores' && styles.segmentBtnActive]}
          onPress={() => {
            setActiveTab('stores');
            setSearchQuery('');
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="storefront"
            size={16}
            color={activeTab === 'stores' ? '#FFFFFF' : theme.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'stores' && styles.segmentTextActive]}>
            My Stores ({stores.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'compare' && styles.segmentBtnActive]}
          onPress={() => {
            setActiveTab('compare');
            setSearchQuery('');
            loadComparison('');
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="analytics"
            size={16}
            color={activeTab === 'compare' ? '#FFFFFF' : theme.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'compare' && styles.segmentTextActive]}>
            Compare Prices
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === 'stores'
              ? 'Search stores by name, category...'
              : 'Search product to compare (e.g. Tomato, Oil)...'
          }
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={(txt) => {
            setSearchQuery(txt);
            if (activeTab === 'compare') {
              loadComparison(txt);
            }
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              if (activeTab === 'compare') loadComparison('');
            }}
          >
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

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
        {/* TAB 1: MY STORES */}
        {activeTab === 'stores' && (
          <>
            {filteredStores.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="storefront-outline" size={42} color={theme.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No matching stores found' : 'No Stores Added Yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? 'Try searching with another keyword.'
                    : 'Add stores where you regularly buy vegetables, provisions, or dairy.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.85}
                  onPress={() => setAddModalVisible(true)}
                >
                  <LinearGradient colors={theme.primaryGradient} style={styles.emptyActionGradient}>
                    <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyActionText}>Add Your First Store</Text>
                  </LinearGradient>
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
                    <View style={[styles.storeIconBox, { backgroundColor: isDarkMode ? '#1E293B' : cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={24} color={cfg.color} />
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
                        <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? '#1E293B' : cfg.bg }]}>
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
                          <Ionicons name="location-outline" size={12} color={theme.textSecondary} /> {store.address}
                        </Text>
                      ) : null}
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* TAB 2: CROSS-STORE PRICE COMPARISON */}
        {activeTab === 'compare' && (
          <>
            {isCompareLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptySub}>Analyzing prices across stores...</Text>
              </View>
            ) : comparisonList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="analytics-outline" size={42} color={theme.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No price matches found' : 'Compare Rates Across Stores'}
                </Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? 'Try another item name like "Tomato", "Rice", or "Oil".'
                    : 'Items you purchase will automatically show price rankings here so you always find the cheapest shop.'}
                </Text>
              </View>
            ) : (
              comparisonList.map((comp, idx) => {
                const bestPrice = comp.stores[0]?.currentPrice || 0;
                const worstPrice = comp.stores[comp.stores.length - 1]?.currentPrice || 0;
                const priceDiff = worstPrice - bestPrice;

                return (
                  <View key={idx} style={styles.compareCard}>
                    <View style={styles.compareCardHeader}>
                      {comp.imageUrl ? (
                        <Image source={{ uri: comp.imageUrl }} style={styles.compareThumb} />
                      ) : (
                        <View style={styles.compareThumbPlaceholder}>
                          <Ionicons name="pricetag" size={18} color={theme.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.compareProductName}>{comp.name}</Text>
                        <Text style={styles.compareUnitText}>Tracked per {comp.unit || 'kg'}</Text>
                      </View>
                      {priceDiff > 0 && comp.stores.length > 1 && (
                        <View style={styles.saveBadge}>
                          <Text style={styles.saveBadgeText}>Save ₹{priceDiff.toFixed(0)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.compareDivider} />

                    {comp.stores.map((st, sIdx) => {
                      const isCheapest = sIdx === 0 && comp.stores.length > 1;
                      return (
                        <View key={sIdx} style={styles.compareStoreRow}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.compareStoreName}>{st.storeName}</Text>
                              {isCheapest && (
                                <View style={styles.cheapestPill}>
                                  <Ionicons name="star" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                                  <Text style={styles.cheapestPillText}>Best Price</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.compareDateText}>
                              {st.lastPurchasedDate
                                ? `Last: ${new Date(st.lastPurchasedDate).toLocaleDateString('en-IN')}`
                                : 'Recent purchase'}
                            </Text>
                          </View>
                          <Text style={[styles.comparePriceText, isCheapest && { color: '#10B981', fontWeight: '900' }]}>
                            ₹{st.currentPrice}
                            <Text style={styles.comparePerUnit}> / {comp.unit || 'kg'}</Text>
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* ADD STORE MODAL */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Store</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Store Name *</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Annapoorna Supermarket, Veg Mandi"
                  placeholderTextColor={theme.textMuted}
                  value={newStoreName}
                  onChangeText={setNewStoreName}
                />
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {STORE_CATEGORIES.map((cat) => {
                  const isSelected = newStoreCategory === cat.label;
                  return (
                    <TouchableOpacity
                      key={cat.label}
                      style={[
                        styles.catSelectPill,
                        isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                      onPress={() => setNewStoreCategory(cat.label)}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={14}
                        color={isSelected ? '#FFFFFF' : cat.color}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[styles.catSelectText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Phone (Optional)</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  value={newStorePhone}
                  onChangeText={setNewStorePhone}
                />
              </View>

              <Text style={styles.inputLabel}>Address / Landmark (Optional)</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Near Bus Stand, Main Market"
                  placeholderTextColor={theme.textMuted}
                  value={newStoreAddress}
                  onChangeText={setNewStoreAddress}
                />
              </View>

              <TouchableOpacity style={styles.saveStoreBtn} activeOpacity={0.88} onPress={handleCreateStore}>
                <LinearGradient colors={theme.primaryGradient} style={styles.saveStoreGradient}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveStoreText}>Create Store</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      width: '100%',
      maxWidth: 580,
      alignSelf: 'center',
    },
    backBtn: {
      padding: 8,
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
    },
    mainTitle: { fontSize: 24, fontWeight: '900', color: theme.text, letterSpacing: -0.4 },
    subtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    addBtnCircle: { borderRadius: 14, overflow: 'hidden' },
    addBtnGradient: { padding: 9, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    segmentContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      borderRadius: 14,
      padding: 4,
      maxWidth: 580,
      alignSelf: 'center',
      width: '92%',
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 11,
    },
    segmentBtnActive: {
      backgroundColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    segmentTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },

    searchBarWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 14,
      height: 44,
      backgroundColor: theme.inputBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      maxWidth: 580,
      alignSelf: 'center',
      width: '92%',
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      color: theme.text,
    },

    scrollContent: { 
      paddingHorizontal: 16, 
      paddingBottom: 60,
      width: '100%',
      maxWidth: 580,
      alignSelf: 'center',
    },

    storeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.05,
      shadowRadius: 6,
    },
    storeIconBox: {
      width: 48,
      height: 48,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storeName: { fontSize: 16, fontWeight: '800', color: theme.text, flex: 1 },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 7,
      marginRight: 8,
    },
    categoryBadgeText: { fontSize: 10, fontWeight: '800' },
    itemCountText: { fontSize: 11, color: theme.textMuted },
    addressText: { fontSize: 11, color: theme.textSecondary, marginTop: 5 },

    // Compare Card styles
    compareCard: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    compareCardHeader: { flexDirection: 'row', alignItems: 'center' },
    compareThumb: { width: 44, height: 44, borderRadius: 12 },
    compareThumbPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    compareProductName: { fontSize: 16, fontWeight: '800', color: theme.text },
    compareUnitText: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    saveBadge: {
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#86EFAC',
    },
    saveBadgeText: { fontSize: 11, fontWeight: '800', color: '#15803D' },
    compareDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    compareStoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 7,
    },
    compareStoreName: { fontSize: 13, fontWeight: '700', color: theme.text },
    cheapestPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#10B981',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    cheapestPillText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
    compareDateText: { fontSize: 10, color: theme.textMuted, marginTop: 1 },
    comparePriceText: { fontSize: 15, fontWeight: '700', color: theme.text },
    comparePerUnit: { fontSize: 11, color: theme.textMuted, fontWeight: '400' },

    // Empty state
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 6 },
    emptySub: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 18 },
    emptyActionBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
    emptyActionGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    emptyActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    inputLabel: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 6, marginTop: 4 },
    modalInputWrapper: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    modalInput: { height: 46, fontSize: 14, color: theme.text },
    catSelectPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 8,
    },
    catSelectText: { fontSize: 12, color: theme.textSecondary },
    saveStoreBtn: { marginTop: 14, borderRadius: 14, overflow: 'hidden' },
    saveStoreGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    saveStoreText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  });

