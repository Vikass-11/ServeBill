import React, { useContext, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BusinessContext } from '../../context/BusinessContext';

export default function ShopDashboardScreen({ navigation }) {
  const { shopSales, shopExpenses } = useContext(BusinessContext);

  const stats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-GB');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let todayMorning = 0;
    let todayNight = 0;
    let monthRevenue = 0;
    let monthExpenses = 0;

    shopSales.forEach(sale => {
      const d = new Date(sale.date);
      if (isNaN(d.getTime())) return;

      const saleTotal = (sale.morningSales || 0) + (sale.nightSales || 0);

      if (d.toLocaleDateString('en-GB') === todayStr) {
        todayMorning += (sale.morningSales || 0);
        todayNight += (sale.nightSales || 0);
      }

      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthRevenue += saleTotal;
      }
    });

    shopExpenses.forEach(exp => {
      const d = new Date(exp.date);
      if (isNaN(d.getTime())) return;

      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthExpenses += (exp.amount || 0);
      }
    });

    return {
      todayMorning,
      todayNight,
      todayTotal: todayMorning + todayNight,
      monthRevenue,
      monthExpenses,
      monthProfit: monthRevenue - monthExpenses
    };
  }, [shopSales, shopExpenses]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.mainTitle}>
            Shop <Text style={{ color: '#888' }}>Dashboard.</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Sales</Text>
            <Ionicons name="today" size={20} color="#FF7F50" />
          </View>
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Morning</Text>
              <Text style={styles.statValue}>₹{stats.todayMorning}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Night</Text>
              <Text style={styles.statValue}>₹{stats.todayNight}</Text>
            </View>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Today</Text>
            <Text style={styles.totalValue}>₹{stats.todayTotal}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Month</Text>
            <Ionicons name="calendar" size={20} color="#4ade80" />
          </View>
          
          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Revenue</Text>
            <Text style={styles.monthlyRevenue}>₹{stats.monthRevenue}</Text>
          </View>
          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Expenses</Text>
            <Text style={styles.monthlyExpense}>₹{stats.monthExpenses}</Text>
          </View>
          
          <View style={styles.monthlyTotalBox}>
            <Text style={styles.monthlyTotalLabel}>Profit</Text>
            <Text style={styles.monthlyTotalValue}>₹{stats.monthProfit}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#FFF0EA', borderColor: '#FF7F50', borderWidth: 1 }]}
            onPress={() => navigation.navigate('AddShopSale')}
          >
            <Ionicons name="cash" size={24} color="#FF7F50" />
            <Text style={[styles.actionBtnText, { color: '#FF7F50' }]}>Add Sales</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#f0fdf4', borderColor: '#4ade80', borderWidth: 1 }]}
            onPress={() => navigation.navigate('AddShopExpense')}
          >
            <Ionicons name="cart" size={24} color="#4ade80" />
            <Text style={[styles.actionBtnText, { color: '#4ade80' }]}>Add Purchase/Expense</Text>
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
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111' },
  divider: { width: 1, backgroundColor: '#eee', marginHorizontal: 15 },
  
  totalBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#FF7F50' },

  monthlyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  monthlyLabel: { fontSize: 15, color: '#666', fontWeight: '500' },
  monthlyRevenue: { fontSize: 16, fontWeight: '700', color: '#111' },
  monthlyExpense: { fontSize: 16, fontWeight: '700', color: '#ef4444' },

  monthlyTotalBox: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthlyTotalLabel: { fontSize: 16, fontWeight: '800', color: '#111' },
  monthlyTotalValue: { fontSize: 28, fontWeight: '800', color: '#4ade80' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', marginHorizontal: 5 },
  actionBtnText: { marginTop: 8, fontWeight: '700', fontSize: 13, textAlign: 'center' }
});
