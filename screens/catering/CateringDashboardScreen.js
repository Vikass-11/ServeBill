import React, { useContext, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InvoiceContext } from '../../context/InvoiceContext';

export default function CateringDashboardScreen({ navigation }) {
  const { invoices } = useContext(InvoiceContext);

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let monthOrders = 0;
    let monthRevenue = 0;
    let monthExpenses = 0;
    let totalPending = 0;

    invoices.forEach(inv => {
      // Catering uses existing invoices
      if (inv.businessType === 'SHOP') return; // Just in case, though currently all invoices are catering

      const invDate = new Date(inv.date);
      const isThisMonth = !isNaN(invDate.getTime()) && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      
      const revenue = parseFloat(inv.grandTotal || inv.total || 0);
      const received = parseFloat(inv.amountReceived || 0);
      const pending = Math.max(0, revenue - received);
      
      let expensesForOrder = 0;
      if (inv.expenses && Array.isArray(inv.expenses)) {
        inv.expenses.forEach(e => expensesForOrder += parseFloat(e.amount || 0));
      }

      totalPending += pending;

      if (isThisMonth) {
        monthOrders++;
        monthRevenue += revenue;
        monthExpenses += expensesForOrder;
      }
    });

    return {
      monthOrders,
      monthRevenue,
      monthExpenses,
      monthProfit: monthRevenue - monthExpenses,
      totalPending
    };
  }, [invoices]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.mainTitle}>
            Catering <Text style={{ color: '#888' }}>Dashboard.</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Month's Catering</Text>
            <Ionicons name="restaurant" size={20} color="#a855f7" />
          </View>
          
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Orders</Text>
              <Text style={styles.statValue}>{stats.monthOrders}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>₹{stats.monthRevenue}</Text>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' }]}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>₹{stats.monthExpenses}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Profit</Text>
              <Text style={[styles.statValue, { color: '#4ade80' }]}>₹{stats.monthProfit}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: '#fff5f5', borderColor: '#fed7d7', borderWidth: 1 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: '#c53030' }]}>Pending Payments</Text>
            <Ionicons name="alert-circle" size={20} color="#c53030" />
          </View>
          <Text style={[styles.statValue, { color: '#c53030', fontSize: 28 }]}>₹{stats.totalPending}</Text>
          <Text style={{ color: '#c53030', marginTop: 5, fontSize: 13 }}>Across all active orders</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#f0fdf4', borderColor: '#4ade80', borderWidth: 1 }]}
            onPress={() => navigation.navigate('CreateCateringOrder')}
          >
            <Ionicons name="add-circle" size={24} color="#4ade80" />
            <Text style={[styles.actionBtnText, { color: '#4ade80' }]}>New Order</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#f3e8ff', borderColor: '#a855f7', borderWidth: 1 }]}
            onPress={() => navigation.navigate('CateringOrders')}
          >
            <Ionicons name="list" size={24} color="#a855f7" />
            <Text style={[styles.actionBtnText, { color: '#a855f7' }]}>Order History</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  header: { paddingTop: 20, marginBottom: 25 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#888', fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111' },
  divider: { width: 1, backgroundColor: '#eee', marginHorizontal: 15 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', marginHorizontal: 5 },
  actionBtnText: { marginTop: 8, fontWeight: '700', fontSize: 13, textAlign: 'center' }
});
