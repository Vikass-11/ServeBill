import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { StoreContext } from '../../context/StoreContext';
import { BusinessContext } from '../../context/BusinessContext';
import { ThemeContext } from '../../context/ThemeContext';
import { getAutoProductImage } from '../../services/productImages';

const STANDARD_UNITS = ['kg', 'g', 'Litre', 'ml', 'Packet', 'Box', 'Piece', 'Bag'];

export default function StoreDetailScreen({ route, navigation }) {
  const { store } = route.params;
  const { stores, addStore, storeItems, fetchStoreItems, logPurchase, deleteStoreItem, uploadPhoto } = useContext(StoreContext);
  const { addShopExpense } = useContext(BusinessContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Purchase Modal State
  const [isPurchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(store?.id);
  const [selectedStoreName, setSelectedStoreName] = useState(store?.name);
  const [itemName, setItemName] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('kg');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [chargeTo, setChargeTo] = useState('CATERING'); // 'CATERING' or 'SHOP'
  const [notes, setNotes] = useState('');
  const [productImage, setProductImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Inline Add New Store State
  const [isAddingNewStoreInline, setIsAddingNewStoreInline] = useState(false);
  const [inlineStoreName, setInlineStoreName] = useState('');

  // History Modal State
  const [historyModalItem, setHistoryModalItem] = useState(null);

  const loadItems = async () => {
    setIsLoading(true);
    const data = await fetchStoreItems(store.id);
    if (data) setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [store.id]);

  useEffect(() => {
    if (storeItems[store.id]) {
      setItems(storeItems[store.id]);
    }
  }, [storeItems, store.id]);

  // Auto-suggest product image as user types item name
  useEffect(() => {
    if (itemName.trim().length > 1 && !productImage.startsWith('data:') && !productImage.includes('cloudinary')) {
      const suggested = getAutoProductImage(itemName);
      setProductImage(suggested);
    }
  }, [itemName]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((i) => i.name && i.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  // Camera & Gallery Image Picker
  const handlePickImage = async (useCamera = false) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera / media library permission is required to attach product photos.');
        return;
      }

      const pickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = `data:image/jpeg;base64,${asset.base64}`;

        setIsUploadingImage(true);
        // Upload directly to Cloudinary
        const cloudUrl = await uploadPhoto(base64Data);
        setIsUploadingImage(false);

        if (cloudUrl) {
          setProductImage(cloudUrl);
        } else {
          // Fallback to local base64 if upload offline
          setProductImage(base64Data);
        }
      }
    } catch (e) {
      setIsUploadingImage(false);
      console.warn('Image picker error:', e);
      Alert.alert('Image Error', 'Failed to capture or upload image.');
    }
  };

  const handleOpenPurchaseModal = (existingItem = null) => {
    if (existingItem) {
      setItemName(existingItem.name);
      setSelectedUnit(existingItem.unit || 'kg');
      setUnitPrice(existingItem.currentPrice ? existingItem.currentPrice.toString() : '');
      setQuantity('1');
      setProductImage(existingItem.imageUrl || getAutoProductImage(existingItem.name));
    } else {
      setItemName('');
      setSelectedUnit('kg');
      setUnitPrice('');
      setQuantity('1');
      setProductImage('');
    }
    setSelectedStoreId(store.id);
    setSelectedStoreName(store.name);
    setChargeTo('CATERING');
    setNotes('');
    setIsAddingNewStoreInline(false);
    setInlineStoreName('');
    setPurchaseModalVisible(true);
  };

  const handleSavePurchase = async () => {
    let targetStoreId = selectedStoreId;
    let targetStoreName = selectedStoreName;

    // If father typed a new store name inline
    if (isAddingNewStoreInline && inlineStoreName.trim()) {
      const createdStore = await addStore({
        name: inlineStoreName.trim(),
        category: 'Grocery',
      });
      targetStoreId = createdStore.id;
      targetStoreName = createdStore.name;
    }

    if (!itemName.trim()) {
      Alert.alert('Required', 'Please enter a product name.');
      return;
    }

    const price = parseFloat(unitPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price per unit.');
      return;
    }

    const qty = parseFloat(quantity) || 1;
    const totalAmount = price * qty;
    const finalImage = productImage || getAutoProductImage(itemName);

    const purchasePayload = {
      name: itemName.trim(),
      storeName: targetStoreName,
      unit: selectedUnit,
      price,
      quantity: qty,
      total: totalAmount,
      chargeTo,
      notes: notes.trim(),
      imageUrl: finalImage,
      date: new Date().toISOString(),
    };

    await logPurchase(targetStoreId, purchasePayload);

    // Also automatically log into the chosen business expense ledger!
    if (chargeTo === 'SHOP' && addShopExpense) {
      addShopExpense({
        id: Date.now().toString(),
        type: 'PURCHASE',
        item: `${itemName.trim()} (${qty} ${selectedUnit} @ ₹${price})`,
        category: 'Store Inventory',
        amount: totalAmount,
        date: new Date().toISOString(),
        notes: notes ? `${notes} (Store: ${targetStoreName})` : `Store: ${targetStoreName}`,
      });
    }

    setPurchaseModalVisible(false);
    Alert.alert('Purchase Recorded', `Saved ${itemName.trim()} @ ₹${price}/${selectedUnit} to ${targetStoreName}.`);
  };

  const handleDeleteItem = (item) => {
    Alert.alert('Delete Item', `Remove "${item.name}" from ${store.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteStoreItem(store.id, item.id) },
    ]);
  };

  const calculatedTotal = (parseFloat(unitPrice) || 0) * (parseFloat(quantity) || 1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* STORE HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.storeTitle} numberOfLines={1}>
            {store.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={styles.categoryBadgeText}>{store.category || 'Store'}</Text>
            {store.phone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${store.phone}`)}
                style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}
              >
                <Ionicons name="call" size={12} color="#10B981" />
                <Text style={styles.phoneText}>{store.phone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtnCircle}
          activeOpacity={0.88}
          onPress={() => handleOpenPurchaseModal()}
        >
          <LinearGradient colors={theme.primaryGradient} style={styles.addBtnGradient}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Log Item</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${items.length} items in ${store.name}...`}
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

      {/* PRODUCT SHELF */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.emptySub, { marginTop: 12 }]}>Loading items...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bag-check-outline" size={42} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching items found' : 'No Items Logged Yet'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try searching with another product name.'
                : `Tap "Log Item" above to record products you buy from ${store.name} and track their price changes.`}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              activeOpacity={0.88}
              onPress={() => handleOpenPurchaseModal()}
            >
              <LinearGradient colors={theme.primaryGradient} style={styles.emptyActionGradient}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionText}>Log First Item</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map((item) => {
            const hasPrev = item.previousPrice && item.previousPrice > 0;
            const diff = hasPrev ? item.currentPrice - item.previousPrice : 0;
            const isIncrease = diff > 0;
            const isDecrease = diff < 0;

            const photoUri = item.imageUrl || getAutoProductImage(item.name);

            return (
              <View key={item.id} style={styles.productCard}>
                <Image source={{ uri: photoUri }} style={styles.productImage} resizeMode="cover" />

                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={15} color={theme.error} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.unitText}>Unit: {item.unit || 'kg'}</Text>

                  {/* PRICE & DELTA PILL */}
                  <View style={styles.priceRow}>
                    <Text style={styles.currentPriceText}>
                      ₹{item.currentPrice}
                      <Text style={styles.perUnitText}> / {item.unit || 'kg'}</Text>
                    </Text>

                    {hasPrev && (
                      <View
                        style={[
                          styles.deltaBadge,
                          isIncrease
                            ? styles.deltaBadgeIncrease
                            : isDecrease
                            ? styles.deltaBadgeDecrease
                            : styles.deltaBadgeSame,
                        ]}
                      >
                        <Ionicons
                          name={isIncrease ? 'arrow-up' : isDecrease ? 'arrow-down' : 'remove'}
                          size={11}
                          color={isIncrease ? '#DC2626' : isDecrease ? '#15803D' : '#64748B'}
                          style={{ marginRight: 2 }}
                        />
                        <Text
                          style={[
                            styles.deltaBadgeText,
                            { color: isIncrease ? '#DC2626' : isDecrease ? '#15803D' : '#64748B' },
                          ]}
                        >
                          {isIncrease ? `+₹${diff.toFixed(0)}` : isDecrease ? `-₹${Math.abs(diff).toFixed(0)}` : 'Same'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* LAST PURCHASED DATE */}
                  {item.lastPurchasedDate ? (
                    <Text style={styles.dateText}>
                      <Ionicons name="calendar-outline" size={11} color={theme.textMuted} /> Last bought:{' '}
                      {new Date(item.lastPurchasedDate).toLocaleDateString('en-IN')}
                    </Text>
                  ) : null}

                  {/* CARD ACTIONS */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenPurchaseModal(item)}
                    >
                      <Ionicons name="cart-outline" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.cardActionBtnText}>Buy / Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cardActionBtn, { marginLeft: 8 }]}
                      activeOpacity={0.8}
                      onPress={() => setHistoryModalItem(item)}
                    >
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.cardActionBtnText, { color: theme.textSecondary }]}>Price History</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ========================================= */}
      {/* LOG PURCHASE / ADD ITEM MODAL */}
      {/* ========================================= */}
      <Modal visible={isPurchaseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Purchase & Price</Text>
              <TouchableOpacity onPress={() => setPurchaseModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* STORE SELECTOR / INLINE ADD */}
              <Text style={styles.inputLabel}>Purchased From Store *</Text>
              {!isAddingNewStoreInline ? (
                <View style={styles.storeSelectorRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    {stores.map((s) => {
                      const isSelected = selectedStoreId === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.storeChip,
                            isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                          ]}
                          onPress={() => {
                            setSelectedStoreId(s.id);
                            setSelectedStoreName(s.name);
                          }}
                        >
                          <Ionicons
                            name="storefront"
                            size={13}
                            color={isSelected ? '#FFFFFF' : theme.textSecondary}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.storeChipText, isSelected && { color: '#FFFFFF', fontWeight: '800' }]}>
                            {s.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.addStoreInlineBtn}
                    onPress={() => setIsAddingNewStoreInline(true)}
                  >
                    <Ionicons name="add" size={14} color={theme.primary} />
                    <Text style={styles.addStoreInlineText}>New Shop</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                    placeholder="Enter new shop name..."
                    placeholderTextColor={theme.textMuted}
                    value={inlineStoreName}
                    onChangeText={setInlineStoreName}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => setIsAddingNewStoreInline(false)} style={styles.cancelInlineBtn}>
                    <Text style={{ fontSize: 12, color: theme.error, fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* PRODUCT NAME & IMAGE PREVIEW */}
              <Text style={styles.inputLabel}>Product / Item Name *</Text>
              <View style={styles.productInputRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.modalInputWrapper}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. Tomato, Sunflower Oil, Basmati Rice"
                      placeholderTextColor={theme.textMuted}
                      value={itemName}
                      onChangeText={setItemName}
                    />
                  </View>
                </View>

                {/* PRODUCT PHOTO PREVIEW & CAMERA UPLOAD */}
                <View style={styles.imageActionBox}>
                  {isUploadingImage ? (
                    <View style={styles.photoThumbLoading}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={{ fontSize: 8, color: theme.textMuted, marginTop: 2 }}>Uploading</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: productImage || getAutoProductImage(itemName) }}
                      style={styles.photoThumb}
                    />
                  )}

                  <View style={styles.photoBtnGroup}>
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={() => handlePickImage(true)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="camera" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.photoBtn, { backgroundColor: '#3B82F6' }]}
                      onPress={() => handlePickImage(false)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="images" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* UNIT SELECTOR */}
              <Text style={styles.inputLabel}>Unit of Measurement</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {STANDARD_UNITS.map((u) => {
                  const isSel = selectedUnit === u;
                  return (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitPill,
                        isSel && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                      onPress={() => setSelectedUnit(u)}
                    >
                      <Text style={[styles.unitPillText, isSel && { color: '#FFFFFF', fontWeight: '800' }]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* RATE & QUANTITY ROW */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Rate / Price (₹) *</Text>
                  <View style={[styles.modalInputWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, marginRight: 4 }}>₹</Text>
                    <TextInput
                      style={[styles.modalInput, { flex: 1 }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={unitPrice}
                      onChangeText={setUnitPrice}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Quantity ({selectedUnit})</Text>
                  <View style={styles.modalInputWrapper}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="1"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                  </View>
                </View>
              </View>

              {/* CALCULATED TOTAL BOX */}
              <View style={styles.totalBox}>
                <Text style={styles.totalBoxLabel}>Total Amount:</Text>
                <Text style={styles.totalBoxValue}>₹{calculatedTotal.toFixed(2)}</Text>
              </View>

              {/* LEDGER SELECTOR (PROMPT REQUIREMENT #2) */}
              <Text style={styles.inputLabel}>Record Expense Into *</Text>
              <View style={styles.ledgerRow}>
                <TouchableOpacity
                  style={[
                    styles.ledgerBtn,
                    chargeTo === 'CATERING' && { borderColor: '#8B5CF6', backgroundColor: isDarkMode ? '#2E1065' : '#F5F3FF' },
                  ]}
                  onPress={() => setChargeTo('CATERING')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={chargeTo === 'CATERING' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={chargeTo === 'CATERING' ? '#8B5CF6' : theme.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.ledgerBtnText, chargeTo === 'CATERING' && { color: '#8B5CF6', fontWeight: '800' }]}>
                    Catering Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.ledgerBtn,
                    chargeTo === 'SHOP' && { borderColor: '#10B981', backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' },
                  ]}
                  onPress={() => setChargeTo('SHOP')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={chargeTo === 'SHOP' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={chargeTo === 'SHOP' ? '#10B981' : theme.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.ledgerBtnText, chargeTo === 'SHOP' && { color: '#10B981', fontWeight: '800' }]}>
                    Shop Counter Expense
                  </Text>
                </TouchableOpacity>
              </View>

              {/* OPTIONAL NOTES */}
              <Text style={styles.inputLabel}>Notes / Brand (Optional)</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Fortune brand, Grade A quality"
                  placeholderTextColor={theme.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* SAVE BUTTON */}
              <TouchableOpacity style={styles.saveBtn} activeOpacity={0.88} onPress={handleSavePurchase}>
                <LinearGradient colors={theme.primaryGradient} style={styles.saveGradient}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save & Record Purchase</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================= */}
      {/* PRICE HISTORY TIMELINE MODAL */}
      {/* ========================================= */}
      <Modal visible={Boolean(historyModalItem)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={{ uri: historyModalItem?.imageUrl || getAutoProductImage(historyModalItem?.name) }}
                  style={{ width: 36, height: 36, borderRadius: 10, marginRight: 10 }}
                />
                <View>
                  <Text style={styles.modalTitle}>{historyModalItem?.name}</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                    Price History @ {store.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalItem(null)}>
                <Ionicons name="close-circle" size={26} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              {!historyModalItem?.priceHistory || historyModalItem.priceHistory.length === 0 ? (
                <Text style={[styles.emptySub, { paddingVertical: 20 }]}>No previous price records found.</Text>
              ) : (
                historyModalItem.priceHistory.map((rec, rIdx) => {
                  const isCatering = rec.chargeTo === 'CATERING';
                  return (
                    <View key={rec.id || rIdx} style={styles.timelineRow}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.timelinePrice}>
                            ₹{rec.price}
                            <Text style={styles.timelinePerUnit}> / {rec.unit || historyModalItem.unit}</Text>
                          </Text>
                          <View
                            style={[
                              styles.chargeTag,
                              { backgroundColor: isCatering ? (isDarkMode ? '#2E1065' : '#F5F3FF') : (isDarkMode ? '#064E3B' : '#ECFDF5') },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chargeTagText,
                                { color: isCatering ? '#8B5CF6' : '#10B981' },
                              ]}
                            >
                              {isCatering ? 'Catering' : 'Shop'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.timelineMeta}>
                          Qty: {rec.quantity} {rec.unit || historyModalItem.unit} (Total: ₹{rec.total}) •{' '}
                          {new Date(rec.date).toLocaleDateString('en-IN')}
                        </Text>
                        {rec.notes ? <Text style={styles.timelineNotes}>"{rec.notes}"</Text> : null}
                      </View>
                    </View>
                  );
                })
              )}
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
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 10,
    },
    backBtn: {
      padding: 8,
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
    },
    storeTitle: { fontSize: 20, fontWeight: '900', color: theme.text },
    categoryBadgeText: { fontSize: 11, color: theme.primary, fontWeight: '700' },
    phoneText: { fontSize: 11, color: '#10B981', fontWeight: '700', marginLeft: 3 },
    addBtnCircle: { borderRadius: 14, overflow: 'hidden' },
    addBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
    addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginLeft: 4 },

    searchBarWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 12,
      marginTop: 4,
      paddingHorizontal: 14,
      height: 44,
      backgroundColor: theme.inputBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: { flex: 1, fontSize: 13, color: theme.text },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

    // Product Card
    productCard: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    productImage: {
      width: 76,
      height: 76,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    },
    productName: { fontSize: 16, fontWeight: '800', color: theme.text },
    unitText: { fontSize: 11, color: theme.textMuted, marginTop: 1 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    currentPriceText: { fontSize: 17, fontWeight: '900', color: theme.text },
    perUnitText: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },

    deltaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 8,
    },
    deltaBadgeIncrease: { backgroundColor: '#FEE2E2' },
    deltaBadgeDecrease: { backgroundColor: '#DCFCE7' },
    deltaBadgeSame: { backgroundColor: '#F1F5F9' },
    deltaBadgeText: { fontSize: 10, fontWeight: '800' },

    dateText: { fontSize: 10, color: theme.textMuted, marginTop: 4 },

    cardActionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    cardActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardActionBtnText: { fontSize: 11, fontWeight: '700', color: theme.primary },

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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 35,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    inputLabel: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 6, marginTop: 4 },

    storeSelectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    storeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 9,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 6,
    },
    storeChipText: { fontSize: 12, color: theme.textSecondary },
    addStoreInlineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
      marginLeft: 6,
    },
    addStoreInlineText: { fontSize: 11, fontWeight: '700', color: theme.primary, marginLeft: 2 },
    cancelInlineBtn: { padding: 8 },

    productInputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    imageActionBox: { alignItems: 'center' },
    photoThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' },
    photoThumbLoading: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoBtnGroup: { flexDirection: 'row', gap: 4, marginTop: 4 },
    photoBtn: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
    },

    modalInputWrapper: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    modalInput: { height: 44, fontSize: 14, color: theme.text },

    unitPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 9,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 6,
    },
    unitPillText: { fontSize: 12, color: theme.textSecondary },

    totalBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
      padding: 12,
      borderRadius: 12,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    totalBoxLabel: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },
    totalBoxValue: { fontSize: 18, fontWeight: '900', color: '#10B981' },

    ledgerRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    ledgerBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
    },
    ledgerBtnText: { fontSize: 11, color: theme.textSecondary },

    saveBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
    saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

    // Timeline styles
    timelineRow: { flexDirection: 'row', marginBottom: 14, paddingLeft: 6 },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.primary,
      marginTop: 4,
      marginRight: 12,
    },
    timelineContent: { flex: 1, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10 },
    timelinePrice: { fontSize: 15, fontWeight: '800', color: theme.text },
    timelinePerUnit: { fontSize: 11, color: theme.textMuted, fontWeight: '400' },
    chargeTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    chargeTagText: { fontSize: 10, fontWeight: '800' },
    timelineMeta: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
    timelineNotes: { fontSize: 11, fontStyle: 'italic', color: theme.textMuted, marginTop: 2 },
  });

