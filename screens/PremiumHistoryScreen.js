import React, { useContext, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InvoiceContext } from '../context/InvoiceContext';

export default function PremiumHistoryScreen({ navigation }) {
  const { invoices, deleteInvoice } = useContext(InvoiceContext);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter invoices based on search (Client Name)
  const filteredInvoices = invoices.filter((inv) =>
    inv.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate Total Business Done
  const totalBusiness = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to remove this invoice from history?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteInvoice(id) }
      ]
    );
  };

  const renderInvoiceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.invoiceCard}
      onPress={() => navigation.navigate('CateringOrderDetails', { invoiceId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardInfo}>
        <View style={styles.clientRow}>
          <Ionicons name="person-circle-outline" size={20} color="#111" />
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        <Text style={styles.dateLabel}>
          <Ionicons name="calendar-outline" size={14} color="#888" /> {item.date}
        </Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.amountText}>
           <Text style={{color: '#FF7F50', fontSize: 14}}>₹</Text>{item.grandTotal}
        </Text>
        <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#aaa" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
          <Text style={styles.mainTitle}>
            Past <Text style={{color: '#888'}}>Orders.</Text>
          </Text>
      </View>

      {/* TOTAL SUMMARY WIDGET */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
            <Text style={styles.statsLabel}>Total Revenue</Text>
            <Text style={styles.statsValue}>₹{totalBusiness.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryRight}>
            <View style={styles.iconCircle}>
                <Ionicons name="stats-chart" size={24} color="#FF7F50" />
            </View>
            <Text style={styles.invoiceCount}>{invoices.length} Bills</Text>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#aaa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer name..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#aaa" />
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
                <Ionicons name="receipt-outline" size={40} color="#ccc" />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery ? "No matching records found." : "No invoices saved yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  summaryLeft: { justifyContent: 'center' },
  statsLabel: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 5 },
  statsValue: { color: '#fff', fontSize: 32, fontWeight: '800' },
  summaryRight: { alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#222',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
  },
  invoiceCount: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#111' },
  
  listContent: { paddingHorizontal: 24, paddingBottom: 120 }, // 120 padding for floating tab bar
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#111', marginLeft: 8 },
  dateLabel: { fontSize: 12, color: '#888', marginLeft: 2 },
  
  cardRight: { alignItems: 'flex-end', justifyContent: 'center' },
  amountText: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8 },
  deleteBtn: { padding: 4 },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIconCircle: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff',
      justifyContent: 'center', alignItems: 'center', marginBottom: 15,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  emptyText: { color: '#888', fontSize: 15, fontWeight: '500' }
});
