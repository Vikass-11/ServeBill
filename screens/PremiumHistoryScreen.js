import React, { useContext, useState, useMemo, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { InvoiceContext } from '../context/InvoiceContext';
import { ThemeContext } from '../context/ThemeContext';

export default function PremiumHistoryScreen({ navigation }) {
  const { invoices, deleteInvoice, refreshInvoices } = useContext(InvoiceContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'PARTIAL' | 'PAID'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshInvoices) await refreshInvoices();
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (refreshInvoices) refreshInvoices();
    }, [refreshInvoices])
  );

  // Financial aggregates
  const totals = useMemo(() => {
    let billed = 0;
    let received = 0;
    let pending = 0;

    (invoices || []).forEach((inv) => {
      const g = parseFloat(inv.grandTotal || inv.total || 0);
      const r = parseFloat(inv.amountReceived || 0);
      billed += g;
      received += r;
      pending += Math.max(0, g - r);
    });

    return { billed, received, pending };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (inv.clientName || inv.customerName || '').toLowerCase().includes(q) ||
        (inv.clientPhone || '').includes(q) ||
        (inv.date || '').includes(q) ||
        (inv.id || '').includes(q);

      const total = parseFloat(inv.grandTotal || inv.total || 0);
      const rec = parseFloat(inv.amountReceived || 0);
      const isPaid = rec >= total && total > 0;
      const isPartial = rec > 0 && rec < total;
      const isPending = rec === 0 && total > 0;

      let matchesStatus = true;
      if (statusFilter === 'PAID') matchesStatus = isPaid;
      if (statusFilter === 'PARTIAL') matchesStatus = isPartial;
      if (statusFilter === 'PENDING') matchesStatus = isPending || isPartial;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const confirmDelete = (id, clientName) => {
    Alert.alert(
      'Delete Invoice',
      `Permanently delete the bill for "${clientName || 'Client'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteInvoice(id) },
      ]
    );
  };

  const exportCSV = async () => {
    try {
      if (!invoices || invoices.length === 0) {
        Alert.alert('No Data', 'There are no invoices to export.');
        return;
      }
      const header = 'Invoice ID,Client Name,Phone,Date,SubTotal,GrandTotal,Amount Received,Balance Due\n';
      const rows = invoices
        .map((inv) => {
          const total = parseFloat(inv.grandTotal || inv.total || 0);
          const rec = parseFloat(inv.amountReceived || 0);
          const bal = Math.max(0, total - rec);
          return `"${inv.id}","${inv.clientName || ''}","${inv.clientPhone || ''}","${inv.date || ''}",${inv.subTotal || 0},${total},${rec},${bal}`;
        })
        .join('\n');

      const csvContent = header + rows;
      const fileUri = FileSystem.documentDirectory + 'catering_invoices.csv';

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Invoices CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('CSV Ready', 'Saved to documents folder.');
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Unable to export CSV right now.');
      console.log(e);
    }
  };

  const formatDateSafe = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-GB');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.pillBadge}>
            <Ionicons name="receipt" size={12} color={theme.pastelLavenderDark || '#5E4B8B'} />
            <Text style={styles.pillBadgeText}>Invoice & Payment Ledger</Text>
          </View>
          <Text style={styles.mainTitle}>
            All <Text style={{ color: theme.primary }}>Bills</Text>
          </Text>
          <Text style={styles.subtitle}>Track client orders, balances & official receipts</Text>
        </View>

        <TouchableOpacity onPress={exportCSV} style={styles.exportBtn} activeOpacity={0.85}>
          <Ionicons name="share-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
          <Text style={styles.exportBtnText}>CSV</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY METRIC STRIP (PASTEL) */}
      <View style={styles.summaryStrip}>
        <View style={[styles.summaryBox, { backgroundColor: theme.pastelLavender || '#E9DFFF' }]}>
          <Text style={[styles.summaryBoxLabel, { color: theme.pastelLavenderDark || '#5E4B8B' }]}>
            TOTAL BILLED
          </Text>
          <Text style={[styles.summaryBoxVal, { color: theme.pastelLavenderDark || '#5E4B8B' }]}>
            ₹{totals.billed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>

        <View style={[styles.summaryBox, { backgroundColor: theme.pastelMint || '#D8F3E5' }]}>
          <Text style={[styles.summaryBoxLabel, { color: theme.pastelMintDark || '#1E6E4E' }]}>
            COLLECTED
          </Text>
          <Text style={[styles.summaryBoxVal, { color: theme.pastelMintDark || '#1E6E4E' }]}>
            ₹{totals.received.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>

        <View style={[styles.summaryBox, { backgroundColor: theme.pastelPeach || '#FFE2D5' }]}>
          <Text style={[styles.summaryBoxLabel, { color: theme.pastelPeachDark || '#8F4E34' }]}>
            BALANCE DUE
          </Text>
          <Text style={[styles.summaryBoxVal, { color: theme.pastelPeachDark || '#8F4E34' }]}>
            ₹{totals.pending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search client name, phone or date..."
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

      {/* STATUS FILTER CHIPS */}
      <View style={styles.filterRow}>
        {[
          { key: 'ALL', label: `All (${invoices.length})` },
          { key: 'PENDING', label: 'Balance Due' },
          { key: 'PARTIAL', label: 'Partially Paid' },
          { key: 'PAID', label: 'Fully Settled' },
        ].map((f) => {
          const isSel = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, isSel && styles.filterChipActive]}
              onPress={() => setStatusFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* INVOICES LIST */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => String(item.id)}
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
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.pastelLavender || '#E9DFFF' }]}>
              <Ionicons name="receipt-outline" size={40} color={theme.pastelLavenderDark || '#5E4B8B'} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching bills found' : 'No Invoices Found'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try a different client name or search query.'
                : 'Create your first catering bill to start tracking event orders.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('CreateCateringOrder', {
                  editInvoice: null,
                  newBill: true,
                  timestamp: Date.now(),
                })
              }
            >
              <Text style={styles.emptyBtnText}>Create New Bill</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const total = parseFloat(item.grandTotal || item.total || 0);
          const rec = parseFloat(item.amountReceived || 0);
          const balance = Math.max(0, total - rec);

          const isFullyPaid = rec >= total && total > 0;
          const isPartial = rec > 0 && rec < total;
          const isPending = rec === 0;

          const clientName = item.clientName || item.customerName || 'Direct Client';
          const displayDate = formatDateSafe(item.date);

          return (
            <TouchableOpacity
              style={styles.invoiceCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('CateringOrderDetails', { invoiceId: item.id })}
            >
              {/* Top Row: Client & Status */}
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.cardClientName} numberOfLines={1}>
                    {clientName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.cardDate}>{displayDate}</Text>
                    {item.clientPhone ? (
                      <>
                        <Text style={styles.cardDot}>•</Text>
                        <Text style={styles.cardPhone}>{item.clientPhone}</Text>
                      </>
                    ) : null}
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusPill,
                    isFullyPaid && styles.statusPillPaid,
                    isPartial && styles.statusPillPartial,
                    isPending && styles.statusPillPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isFullyPaid && { color: '#15803D' },
                      isPartial && { color: '#B45309' },
                      isPending && { color: '#DC2626' },
                    ]}
                  >
                    {isFullyPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING'}
                  </Text>
                </View>
              </View>

              {/* Financial Breakdown Row */}
              <View style={styles.financialRow}>
                <View style={styles.financialBox}>
                  <Text style={styles.financialBoxLabel}>Total Bill</Text>
                  <Text style={styles.financialBoxVal}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                </View>

                <View style={styles.financialDivider} />

                <View style={styles.financialBox}>
                  <Text style={styles.financialBoxLabel}>Advance</Text>
                  <Text style={[styles.financialBoxVal, { color: '#10B981' }]}>
                    ₹{rec.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </View>

                <View style={styles.financialDivider} />

                <View style={styles.financialBox}>
                  <Text style={styles.financialBoxLabel}>Balance Due</Text>
                  <Text style={[styles.financialBoxVal, { color: balance > 0 ? '#DC2626' : theme.textMuted }]}>
                    ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardFooterActions}>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() =>
                    navigation.navigate('InvoicePreview', {
                      clientName,
                      clientPhone: item.clientPhone || '',
                      events: item.events || [],
                      subTotal: item.subTotal || total,
                      taxAmount: item.taxAmount || 0,
                      grandTotal: total.toFixed(2),
                      transportCharge: item.transportCharge || 0,
                      advanceAmount: item.advanceAmount || 0,
                      extraItems: item.extraItems || [],
                      isPreviewOnly: true,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-text-outline" size={15} color={theme.primary} style={{ marginRight: 5 }} />
                  <Text style={styles.actionBtnSecondaryText}>View Bill</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => navigation.navigate('CreateCateringOrder', { editInvoice: item })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={15} color={theme.textSecondary} style={{ marginRight: 5 }} />
                  <Text style={[styles.actionBtnSecondaryText, { color: theme.textSecondary }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnDelete}
                  onPress={() => confirmDelete(item.id, clientName)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
      backgroundColor: theme.pastelLavender || '#E9DFFF',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      marginBottom: 4,
      gap: 5,
    },
    pillBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.pastelLavenderDark || '#5E4B8B',
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
    exportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: theme.card || '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
    },
    exportBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    summaryStrip: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 18,
      marginBottom: 12,
    },
    summaryBox: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    summaryBoxLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    summaryBoxVal: {
      fontSize: 15,
      fontWeight: '900',
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
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      paddingVertical: 0,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 18,
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.card || '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.border || '#F0EEF6',
    },
    filterChipActive: {
      backgroundColor: theme.text,
      borderColor: theme.text,
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    listContent: {
      paddingHorizontal: 18,
      paddingBottom: 110,
      gap: 12,
    },
    invoiceCard: {
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
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    cardClientName: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
    },
    cardDate: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    cardDot: {
      marginHorizontal: 5,
      color: theme.textMuted,
      fontSize: 10,
    },
    cardPhone: {
      fontSize: 11,
      color: theme.textMuted,
    },
    statusPill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusPillPaid: {
      backgroundColor: '#DCFCE7',
    },
    statusPillPartial: {
      backgroundColor: '#FEF3C7',
    },
    statusPillPending: {
      backgroundColor: '#FEE2E2',
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.4,
    },
    financialRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1E1D2D' : '#F9F8FD',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      marginBottom: 14,
    },
    financialBox: {
      flex: 1,
      alignItems: 'center',
    },
    financialDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.border || '#F0EEF6',
    },
    financialBoxLabel: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '600',
      marginBottom: 2,
    },
    financialBoxVal: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    cardFooterActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    actionBtnSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: theme.inputBackground || '#F4F3F9',
    },
    actionBtnSecondaryText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    actionBtnDelete: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#3B1E1E' : '#FEE2E2',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
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
    emptyBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 16,
    },
    emptyBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
