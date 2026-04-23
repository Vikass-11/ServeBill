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
import { LinearGradient } from 'expo-linear-gradient';
import { InvoiceContext } from '../context/InvoiceContext';

export default function HistoryScreen() {
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
    <View style={styles.invoiceCard}>
      <View style={styles.cardInfo}>
        <View style={styles.clientRow}>
          <Ionicons name="person-circle-outline" size={20} color="#3498db" />
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        <Text style={styles.dateLabel}>
          <Ionicons name="calendar-outline" size={14} color="#95a5a6" /> {item.date}
        </Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.amountText}>₹{item.grandTotal}</Text>
        <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* TOTAL SUMMARY HEADER */}
      <LinearGradient colors={['#2c3e50', '#34495e']} style={styles.headerStats}>
        <Text style={styles.statsLabel}>Lifetime Business Volume</Text>
        <Text style={styles.statsValue}>₹{totalBusiness.toLocaleString('en-IN')}</Text>
        <Text style={styles.invoiceCount}>{invoices.length} Total Invoices</Text>
      </LinearGradient>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#bdc3c7" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#bdc3c7" />
          </TouchableOpacity>
        )}
      </View>

      {/* INVOICE LIST */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ecf0f1" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No matching records found" : "No invoices saved yet"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerStats: {
    padding: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  statsLabel: { color: '#bdc3c7', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  statsValue: { color: '#fff', fontSize: 36, fontWeight: '900', marginVertical: 5 },
  invoiceCount: { color: '#3498db', fontSize: 14, fontWeight: 'bold' },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#2c3e50' },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
    elevation: 2,
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  clientName: { fontSize: 17, fontWeight: 'bold', color: '#2c3e50', marginLeft: 8 },
  dateLabel: { fontSize: 13, color: '#95a5a6' },
  
  cardRight: { alignItems: 'flex-end' },
  amountText: { fontSize: 18, fontWeight: '900', color: '#27ae60', marginBottom: 5 },
  deleteBtn: { padding: 5 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#bdc3c7', fontSize: 16, marginTop: 10, fontWeight: '600' }
});