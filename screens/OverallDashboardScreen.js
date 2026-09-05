import React, { useContext, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BusinessContext } from '../context/BusinessContext';
import { InvoiceContext } from '../context/InvoiceContext';

export default function OverallDashboardScreen() {
  const { shopSales, shopExpenses } = useContext(BusinessContext);
  const { invoices } = useContext(InvoiceContext);

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // SHOP STATS
    let shopMonthRevenue = 0;
    let shopMonthExpenses = 0;

    shopSales.forEach(sale => {
      const d = new Date(sale.date);
      if (!isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        shopMonthRevenue += (sale.morningSales || 0) + (sale.nightSales || 0);
      }
    });

    shopExpenses.forEach(exp => {
      const d = new Date(exp.date);
      if (!isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        shopMonthExpenses += (exp.amount || 0);
      }
    });

    const shopProfit = shopMonthRevenue - shopMonthExpenses;

    // CATERING STATS
    let cateringMonthRevenue = 0;
    let cateringMonthExpenses = 0;

    invoices.forEach(inv => {
      const d = new Date(inv.date);
      if (!isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        cateringMonthRevenue += parseFloat(inv.grandTotal || inv.total || 0);
        
        if (inv.expenses && Array.isArray(inv.expenses)) {
          inv.expenses.forEach(e => cateringMonthExpenses += parseFloat(e.amount || 0));
        }
      }
    });

    const cateringProfit = cateringMonthRevenue - cateringMonthExpenses;

    return {
      shopMonthRevenue,
      shopProfit,
      cateringMonthRevenue,
      cateringProfit,
      totalRevenue: shopMonthRevenue + cateringMonthRevenue,
      totalProfit: shopProfit + cateringProfit
    };
  }, [shopSales, shopExpenses, invoices]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.mainTitle}>
            Business <Text style={{ color: '#888' }}>Overview.</Text>
          </Text>
        </View>

        {/* SHOP SUMMARY */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="storefront" size={20} color="#FF7F50" style={{marginRight: 8}} />
              <Text style={styles.cardTitle}>SHOP</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.statLabel}>Monthly Revenue</Text>
            <Text style={styles.statValue}>₹{stats.shopMonthRevenue}</Text>
          </View>
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={styles.statLabel}>Estimated Profit</Text>
            <Text style={[styles.statValue, { color: '#4ade80' }]}>₹{stats.shopProfit}</Text>
          </View>
        </View>

        {/* CATERING SUMMARY */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="restaurant" size={20} color="#a855f7" style={{marginRight: 8}} />
              <Text style={styles.cardTitle}>CATERING</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.statLabel}>Monthly Revenue</Text>
            <Text style={styles.statValue}>₹{stats.cateringMonthRevenue}</Text>
          </View>
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={styles.statLabel}>Estimated Profit</Text>
            <Text style={[styles.statValue, { color: '#4ade80' }]}>₹{stats.cateringProfit}</Text>
          </View>
        </View>

        {/* TOTAL BUSINESS SUMMARY */}
        <View style={styles.totalCard}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: '#fff' }]}>TOTAL BUSINESS</Text>
            <Ionicons name="briefcase" size={20} color="#fff" />
          </View>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Revenue</Text>
            <Text style={styles.totalValue}>₹{stats.totalRevenue}</Text>
          </View>
          <View style={[styles.row, styles.totalDivider]}>
            <Text style={styles.totalLabel}>Total Profit</Text>
            <Text style={[styles.totalValue, { color: '#4ade80', fontSize: 32 }]}>₹{stats.totalProfit}</Text>
          </View>
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
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111', letterSpacing: 1 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 15, color: '#666', fontWeight: '600' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111' },

  totalCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  totalLabel: { fontSize: 15, color: '#aaa', fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  totalDivider: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#333' }
});
