import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InvoiceContext } from '../context/InvoiceContext';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
  const { invoices, deleteInvoice } = useContext(InvoiceContext);
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const renderInvoice = ({ item }) => (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={styles.clientInfo}>
          <Ionicons name="person-circle" size={24} color="#3498db" />
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        <Text style={styles.invoiceDate}>{item.date}</Text>
      </View>
      
      <View style={styles.invoiceFooter}>
        <Text style={styles.grandTotal}>Rs. {item.grandTotal}</Text>
        <TouchableOpacity 
          onPress={() => deleteInvoice(item.id)} 
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* WRAPPER TO CENTER EVERYTHING */}
      <View style={styles.centerWrapper}>
        
        {/* 1. FLOATING GRADIENT HEADER */}
        <LinearGradient colors={['#2980b9', '#2c3e50']} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>SM Catering</Text>
          <Text style={styles.headerSubtitle}>Business Dashboard</Text>
        </LinearGradient>

        {/* 2. PREMIUM ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('CreateInvoice')}
          >
            <LinearGradient colors={['#27ae60', '#2ecc71']} style={styles.iconCircle}>
              <Ionicons name="document-text" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>New Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Menu')}
          >
            <LinearGradient colors={['#e67e22', '#f39c12']} style={styles.iconCircle}>
              <Ionicons name="restaurant" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Manage Menu</Text>
          </TouchableOpacity>
        </View>

        {/* 3. FLOATING INVOICE CARDS */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          
          {invoices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={60} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No saved invoices yet.</Text>
              <Text style={styles.emptyStateSubText}>Tap "New Bill" to get started!</Text>
            </View>
          ) : (
            <FlatList
              data={invoices}
              keyExtractor={(item) => item.id}
              renderItem={renderInvoice}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

// --- STYLES ---
const getStyles = (theme) => StyleSheet.create({
  // FIX APPLIED: Added justifyContent: 'center' to push everything to the middle
  container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center' },
  
  // FIX APPLIED: Controls the width of the centered content
  centerWrapper: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  
  headerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20, // Rounded all corners so it floats like a card
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    alignItems: 'center', // Centers the text inside the header
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', letterSpacing: 1, textAlign: 'center' },
  headerSubtitle: { fontSize: 16, color: '#ecf0f1', marginTop: 5, opacity: 0.9, textAlign: 'center' },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20, // Added space since it's no longer overlapping the top header
  },
  actionCard: {
    backgroundColor: theme.card,
    width: '47%',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: { fontSize: 16, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  
  listContainer: { flex: 1, marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.textSecondary, marginBottom: 15, textAlign: 'center' },
  
  invoiceCard: {
    backgroundColor: theme.card,
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clientInfo: { flexDirection: 'row', alignItems: 'center' },
  clientName: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginLeft: 8 },
  invoiceDate: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
  
  invoiceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 },
  grandTotal: { fontSize: 20, fontWeight: 'bold', color: theme.success },
  deleteButton: { padding: 5 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  emptyStateText: { fontSize: 18, color: theme.textSecondary, fontWeight: 'bold', marginTop: 15 },
  emptyStateSubText: { fontSize: 14, color: theme.textMuted, marginTop: 5 },
});
