import React, { useContext, useState, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomerContext } from '../context/CustomerContext';
import { ThemeContext } from '../context/ThemeContext';

const AVATAR_PALETTES = [
  { bg: '#EFF6FF', text: '#2563EB', darkBg: '#1E293B', darkText: '#60A5FA' },
  { bg: '#F5F3FF', text: '#7C3AED', darkBg: '#2E1065', darkText: '#A78BFA' },
  { bg: '#ECFDF5', text: '#059669', darkBg: '#064E3B', darkText: '#34D399' },
  { bg: '#FFF7ED', text: '#EA580C', darkBg: '#431407', darkText: '#FB923C' },
  { bg: '#FFF1F2', text: '#E11D48', darkBg: '#4C0519', darkText: '#FB7185' },
  { bg: '#F0FDF4', text: '#15803D', darkBg: '#14532D', darkText: '#4ADE80' },
];

function getInitials(name) {
  if (!name) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name, isDarkMode) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  const p = AVATAR_PALETTES[index];
  return {
    bg: isDarkMode ? p.darkBg : p.bg,
    text: isDarkMode ? p.darkText : p.text,
  };
}

export default function PremiumCustomersScreen({ navigation }) {
  const { customers, addCustomer, deleteCustomer } = useContext(CustomerContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' or 'WITH_PHONE'
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;
      if (filterType === 'WITH_PHONE') {
        return c.phone && c.phone !== 'N/A' && c.phone.trim().length > 3;
      }
      return true;
    });
  }, [customers, searchQuery, filterType]);

  const handleSaveCustomer = () => {
    if (!newName.trim()) {
      Alert.alert('Missing Name', 'Please provide a client or company name.');
      return;
    }

    const newCustomer = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim() || 'N/A',
      address: newAddress.trim() || 'N/A',
      createdAt: new Date().toISOString(),
    };

    addCustomer(newCustomer);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setAddModalVisible(false);
  };

  const handleCall = (phone) => {
    if (!phone || phone === 'N/A') {
      Alert.alert('No Number', 'This client does not have a saved phone number.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  };

  const handleWhatsApp = (phone) => {
    if (!phone || phone === 'N/A') {
      Alert.alert('No Number', 'This client does not have a saved phone number.');
      return;
    }
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${clean}`);
  };

  const confirmDelete = (c) => {
    Alert.alert(
      'Remove Client',
      `Are you sure you want to remove "${c.name}" from your portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteCustomer(c.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.mainTitle}>
              Client <Text style={{ color: theme.primary }}>Hub.</Text>
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{customers.length}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Direct client directory for instant billing</Text>
        </View>

        <TouchableOpacity
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
          style={styles.addClientHeaderBtn}
        >
          <LinearGradient
            colors={theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addClientHeaderGradient}
          >
            <Ionicons name="person-add" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addClientHeaderText}>New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* SEARCH AND FILTERS */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, address..."
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

        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilterType('ALL')}
          >
            <Text style={[styles.filterPillText, filterType === 'ALL' && styles.filterPillTextActive]}>
              All ({customers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'WITH_PHONE' && styles.filterPillActive]}
            onPress={() => setFilterType('WITH_PHONE')}
          >
            <Ionicons
              name="call-outline"
              size={12}
              color={filterType === 'WITH_PHONE' ? theme.primary : theme.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterPillText, filterType === 'WITH_PHONE' && styles.filterPillTextActive]}>
              With Phone
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CLIENT LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={38} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching clients found' : 'Your Client Hub is Empty'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try a different search keyword or filter.'
                : 'Add clients once and auto-populate their billing info on invoices.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              activeOpacity={0.85}
              onPress={() => setAddModalVisible(true)}
            >
              <LinearGradient colors={theme.primaryGradient} style={styles.emptyActionGradient}>
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionText}>Add First Client</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          filteredCustomers.map((c) => {
            const avatarColor = getAvatarColor(c.name, isDarkMode);
            const initials = getInitials(c.name);
            const hasPhone = c.phone && c.phone !== 'N/A' && c.phone.trim().length > 3;

            return (
              <View key={c.id} style={styles.customerCard}>
                {/* Top Row: Avatar + Name + Delete */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.avatarBox, { backgroundColor: avatarColor.bg }]}>
                    <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initials}</Text>
                  </View>

                  <View style={styles.nameContainer}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <View style={styles.clientTagRow}>
                      <View style={styles.verifiedDot} />
                      <Text style={styles.verifiedLabel}>Active Account</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => confirmDelete(c)}
                    style={styles.deleteIconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Details Section */}
                <View style={styles.cardDetails}>
                  {hasPhone && (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
                      <Text style={styles.detailText}>{c.phone}</Text>
                    </View>
                  )}

                  {c.address && c.address !== 'N/A' && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {c.address}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Quick Action Bar */}
                <View style={styles.cardActionBar}>
                  {hasPhone && (
                    <>
                      <TouchableOpacity
                        style={styles.quickActionChip}
                        onPress={() => handleCall(c.phone)}
                      >
                        <Ionicons name="call" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.quickActionChipText}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickActionChip}
                        onPress={() => handleWhatsApp(c.phone)}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={[styles.quickActionChipText, { color: '#10B981' }]}>WhatsApp</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.billNowChip}
                    onPress={() => {
                      if (navigation && navigation.navigate) {
                        navigation.navigate('Catering', {
                          screen: 'CreateCateringOrder',
                          params: { editInvoice: { clientName: c.name, clientPhone: c.phone !== 'N/A' ? c.phone : '' } }
                        });
                      }
                    }}
                  >
                    <Ionicons name="receipt-outline" size={14} color={theme.text} style={{ marginRight: 4 }} />
                    <Text style={styles.billNowChipText}>Create Bill</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ADD CLIENT MODAL */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add New Client</Text>
                <Text style={styles.modalSubtitle}>Save to your directory for fast billing</Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME / CLIENT NAME *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ramesh Kumar / Grand Hotel"
                    placeholderTextColor={theme.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="call-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. +91 98765 43210"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                    value={newPhone}
                    onChangeText={setNewPhone}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BILLING ADDRESS</Text>
                <View style={[styles.inputWrap, { height: 90, alignItems: 'flex-start', paddingTop: 12 }]}>
                  <Ionicons name="location-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="Street, Area, City, Pin code"
                    placeholderTextColor={theme.textMuted}
                    multiline
                    value={newAddress}
                    onChangeText={setNewAddress}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                activeOpacity={0.88}
                onPress={handleSaveCustomer}
              >
                <LinearGradient
                  colors={theme.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Save Client</Text>
                </LinearGradient>
              </TouchableOpacity>
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
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.6,
  },
  countBadge: {
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  countBadgeText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  addClientHeaderBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addClientHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  addClientHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  searchSection: {
    paddingHorizontal: 22,
    marginBottom: 12,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 2,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  filterPillTextActive: {
    color: theme.primary,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 110,
    paddingTop: 4,
  },
  customerCard: {
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.25 : 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nameContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.2,
  },
  clientTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.success,
    marginRight: 5,
  },
  verifiedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  deleteIconButton: {
    padding: 6,
  },
  cardDetails: {
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  cardActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  quickActionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  billNowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  billNowChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 20,
  },
  emptyActionBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
    maxHeight: '90%',
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
    fontSize: 16,
    fontWeight: '800',
  },
});
