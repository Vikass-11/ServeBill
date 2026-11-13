import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { getProductImage } from '../../services/productImages';

export default function StorePriceCompareScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonList, setComparisonList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadComparison = async (query = searchQuery) => {
    try {
      setIsLoading(true);
      const data = await api.getStorePriceComparison(query);
      if (data && Array.isArray(data)) {
        setComparisonList(data);
      }
    } catch (e) {
      console.warn('Comparison error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadComparison();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadComparison(searchQuery);
    setIsRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    loadComparison(text);
  };

  const filteredItems = comparisonList.filter((item) =>
    (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.pillBadge}>
              <Ionicons name="pricetags" size={12} color={theme.pastelBlueDark || '#2C5A96'} />
              <Text style={styles.pillBadgeText}>Live Cross-Store Intelligence</Text>
            </View>
            <Text style={styles.mainTitle}>
              Price <Text style={{ color: theme.primary }}>Comparison</Text>
            </Text>
            <Text style={styles.subtitle}>Find the cheapest store for every raw material</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search product (e.g. Basmati Rice, Toor Dal, Oil)..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Comparison List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Analyzing market prices across stores...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item.productName}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.pastelBlue || '#DCEBFF' }]}>
                <Ionicons name="cart-outline" size={38} color={theme.pastelBlueDark || '#2C5A96'} />
              </View>
              <Text style={styles.emptyTitle}>No Product Prices Yet</Text>
              <Text style={styles.emptySub}>
                Add items to your stores to automatically compare rates and find the lowest price.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('StoreDirectory')}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>Go to Stores</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const hasMultipleStores = item.stores && item.stores.length > 1;
            const fallbackImg = getProductImage(item.productName);

            // Compute savings if multiple stores exist
            let maxPrice = 0;
            let minPrice = Infinity;
            (item.stores || []).forEach((s) => {
              const p = parseFloat(s.pricePerUnit || s.price || 0);
              if (p > maxPrice) maxPrice = p;
              if (p < minPrice) minPrice = p;
            });
            const potentialSavings = maxPrice > minPrice && minPrice > 0 ? maxPrice - minPrice : 0;

            return (
              <View style={styles.compareCard}>
                {/* Header Row */}
                <View style={styles.compareCardHeader}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.compareThumb} />
                  ) : fallbackImg ? (
                    <Image source={{ uri: fallbackImg }} style={styles.compareThumb} />
                  ) : (
                    <View style={[styles.compareThumbPlaceholder, { backgroundColor: theme.pastelBlue || '#DCEBFF' }]}>
                      <Ionicons name="basket" size={20} color={theme.pastelBlueDark || '#2C5A96'} />
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.compareProductName}>{item.productName}</Text>
                    <Text style={styles.compareUnitText}>
                      Comparing rates per {item.standardUnit || 'unit'}
                    </Text>
                  </View>

                  {potentialSavings > 0 && (
                    <View style={styles.savingsPill}>
                      <Ionicons name="trending-down" size={12} color="#15803D" style={{ marginRight: 3 }} />
                      <Text style={styles.savingsPillText}>Save ₹{potentialSavings.toFixed(0)}</Text>
                    </View>
                  )}
                </View>

                {/* Divider */}
                <View style={styles.compareDivider} />

                {/* Stores Breakdown */}
                <View style={styles.storeRowsWrap}>
                  {(item.stores || []).map((storeEntry, sIdx) => {
                    const isCheapest = storeEntry.isLowestPrice;
                    const priceVal = parseFloat(storeEntry.pricePerUnit || storeEntry.price || 0);

                    return (
                      <View
                        key={sIdx}
                        style={[
                          styles.storeRow,
                          isCheapest && hasMultipleStores && styles.storeRowCheapest,
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.storeRowName} numberOfLines={1}>
                              {storeEntry.storeName}
                            </Text>
                            {isCheapest && hasMultipleStores && (
                              <View style={styles.cheapestBadge}>
                                <Ionicons name="checkmark-circle" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                                <Text style={styles.cheapestBadgeText}>BEST PRICE</Text>
                              </View>
                            )}
                          </View>
                          {storeEntry.purchaseDate && (
                            <Text style={styles.storeRowDate}>
                              Recorded: {new Date(storeEntry.purchaseDate).toLocaleDateString('en-GB')}
                            </Text>
                          )}
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.storeRowPrice, isCheapest && hasMultipleStores && { color: '#16A34A' }]}>
                            ₹{priceVal.toFixed(2)}
                          </Text>
                          <Text style={styles.storeRowPerUnit}>/{item.standardUnit || 'unit'}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          }}
        />
      )}
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
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 14,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.card || '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
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
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card || '#FFFFFF',
      marginHorizontal: 18,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
      paddingVertical: 0,
    },
    listContent: {
      paddingHorizontal: 18,
      paddingBottom: 40,
      gap: 14,
    },
    compareCard: {
      backgroundColor: theme.card || '#FFFFFF',
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    compareCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    compareThumb: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#F1F5F9',
    },
    compareThumbPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    compareProductName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    compareUnitText: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    savingsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#86EFAC',
    },
    savingsPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#15803D',
    },
    compareDivider: {
      height: 1,
      backgroundColor: theme.border || '#F0EEF6',
      marginVertical: 12,
    },
    storeRowsWrap: {
      gap: 6,
    },
    storeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    storeRowCheapest: {
      backgroundColor: isDarkMode ? '#13281E' : '#F0FDF4',
    },
    storeRowName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    cheapestBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#16A34A',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    cheapestBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    storeRowDate: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 2,
    },
    storeRowPrice: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
    },
    storeRowPerUnit: {
      fontSize: 10,
      color: theme.textMuted,
    },
    loadingContainer: {
      paddingVertical: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 12,
      fontWeight: '500',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
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
    emptyBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 14,
    },
    emptyBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
  });

