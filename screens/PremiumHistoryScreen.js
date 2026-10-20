import React, { useContext, useState, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { InvoiceContext } from '../context/InvoiceContext';
import { ThemeContext } from '../context/ThemeContext';

export default function PremiumHistoryScreen({ navigation }) {
  const { invoices, deleteInvoice } = useContext(InvoiceContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter invoices based on search (Client Name)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) =>
      (inv.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.date || '').includes(searchQuery)
    );
  }, [invoices, searchQuery]);

  // Calculate Total Business Done
  const totalBusiness = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);
  }, [invoices]);

  const confirmDelete = (id, clientName) => {
    Alert.alert(
      "Delete Invoice",
      `Are you sure you want to permanently delete the invoice for "${clientName || 'Client'}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteInvoice(id) }
      ]
    );
  };

  const exportCSV = async () => {
    try {
      if (invoices.length === 0) {
        Alert.alert('No Data', 'There are no invoices to export.');
        return;
      }
      const header = 'ID,Client Name,Phone,Date,SubTotal,TaxAmount,GrandTotal\n';
      const rows = invoices.map(inv => 
        `${inv.id},"${inv.clientName || ''}","${inv.clientPhone || ''}","${inv.date || ''}",${inv.subTotal || inv.grandTotal || 0},${inv.taxAmount || 0},${inv.grandTotal || 0}`
      ).join('\n');
      
      const csvContent = header + rows;
      const fileUri = FileSystem.documentDirectory + 'invoices.csv';
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Invoices',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('CSV Ready', 'File saved to documents directory.');
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Unable to export CSV right now.');
      console.log(e);
    }
  };

  const renderInvoiceItem = ({ item }) => {
    const total = parseFloat(item.grandTotal || 0);

    return (
      <TouchableOpacity 
        style={styles.invoiceCard}
        onPress={() => navigation.navigate('CateringOrderDetails', { invoiceId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardInfo}>
          <View style={styles.clientRow}>
            <View style={styles.invoiceAvatar}>
              <Ionicons name="document-text" size={18} color={theme.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={1}>{item.clientName}</Text>
              <Text style={styles.dateLabel}>
                <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} /> {item.date}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.amountText}>
            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('CreateCateringOrder', { editInvoice: item })} 
              style={[styles.actionBtn, { backgroundColor: theme.primaryLight }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('InvoicePreview', {
                clientName: item.clientName,
                clientPhone: item.clientPhone,
                events: item.events,
                subTotal: item.subTotal,
                taxAmount: item.taxAmount,
                grandTotal: item.grandTotal,
                transportCharge: item.transportCharge || 0,
                advanceAmount: item.advanceAmount || 0,
                extraItems: item.extraItems || [],
                isPreviewOnly: true,
                autoDownload: true
              })} 
              style={[styles.actionBtn, { backgroundColor: theme.successLight }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="download-outline" size={16} color={theme.success} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => confirmDelete(item.id, item.clientName)} 
              style={[styles.actionBtn, { backgroundColor: theme.errorLight }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {navigation.canGoBack && navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
          )}
          <View style={{ marginLeft: navigation.canGoBack && navigation.canGoBack() ? 10 : 0 }}>
            <Text style={styles.mainTitle}>
              Order <Text style={{ color: theme.primary }}>Archive.</Text>
            </Text>
            <Text style={styles.subtitle}>Historical invoices & export</Text>
          </View>
        </View>

        <TouchableOpacity onPress={exportCSV} style={styles.exportBtn} activeOpacity={0.85}>
          <Ionicons name="share-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
          <Text style={styles.exportBtnText}>CSV Export</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY WIDGET */}
      <View style={styles.summaryCardShadow}>
        <LinearGradient
          colors={isDarkMode ? ['#131B2E', '#0B101D'] : ['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryLeft}>
            <Text style={styles.statsLabel}>TOTAL INVOICED REVENUE</Text>
            <Text style={styles.statsValue}>
              ₹{totalBusiness.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <View style={styles.iconCircle}>
              <Ionicons name="stats-chart" size={22} color="#34D399" />
            </View>
            <Text style={styles.invoiceCount}>{invoices.length} Invoices</Text>
          </View>
        </LinearGradient>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by client or date..."
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

      {/* INVOICE LIST */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={38} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matching records found" : "No invoices created yet"}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try searching another client name or date." : "Invoices you generate will be automatically recorded here."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 14,
  },
  backBtn: { 
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: theme.text, 
    letterSpacing: -0.6 
  },
  subtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  exportBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.card, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.text,
  },
  summaryCardShadow: {
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDarkMode ? 0.35 : 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
  },
  summaryLeft: { 
    justifyContent: 'center',
    flex: 1,
  },
  statsLabel: { 
    color: '#94A3B8', 
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statsValue: { 
    color: '#FFFFFF', 
    fontSize: 26, 
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  summaryRight: { 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceCount: { 
    color: '#CBD5E1', 
    fontSize: 11, 
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 10,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { 
    marginRight: 10 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    color: theme.text,
    paddingVertical: 2,
  },
  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 110 
  },
  invoiceCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInfo: { 
    flex: 1,
    marginRight: 10,
  },
  clientRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  invoiceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientName: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: theme.text,
    letterSpacing: -0.2,
  },
  dateLabel: { 
    fontSize: 12, 
    color: theme.textSecondary, 
    marginTop: 2,
    fontWeight: '500',
  },
  cardRight: { 
    alignItems: 'flex-end', 
    justifyContent: 'center' 
  },
  amountText: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: theme.text, 
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: { 
    padding: 7, 
    borderRadius: 10, 
    marginLeft: 6 
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 50,
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
    color: theme.text, 
    fontSize: 16, 
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: theme.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
