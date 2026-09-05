import React, { useContext, useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { InvoiceContext } from '../context/InvoiceContext';

const { width } = Dimensions.get('window');

export default function PremiumAnalyticsScreen({ onLogout }) {
  const { invoices } = useContext(InvoiceContext);

  const stats = useMemo(() => {
    // 1. Prepare an array for the last 7 days (including today)
    const labels = [];
    const dataPoints = [0, 0, 0, 0, 0, 0, 0];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' })); // Mon, Tue, etc.
    }

    let totalRevenue = 0;
    let totalOrders = 0;

    // 2. Iterate through invoices and group them by the past 7 days
    invoices.forEach(inv => {
      // Safely parse date
      const d = new Date(inv.date);
      if (isNaN(d.getTime())) {
        // Fallback for custom formats like DD/MM/YYYY if any
        return;
      }
      
      const today = new Date();
      const diffTime = Math.abs(today.setHours(0,0,0,0) - d.setHours(0,0,0,0));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 6) {
        // It belongs to one of our last 7 days
        const index = 6 - diffDays; 
        const amount = parseFloat(inv.grandTotal || 0);
        
        dataPoints[index] += amount;
        totalRevenue += amount;
        totalOrders += 1;
      }
    });

    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    return {
      labels,
      dataPoints,
      totalRevenue,
      totalOrders,
      avgOrderValue
    };
  }, [invoices]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>
            Business <Text style={{ color: '#888' }}>Insights.</Text>
          </Text>
        </View>

        {/* Chart Section */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Past 7 Days Revenue</Text>
            <Ionicons name="stats-chart" size={20} color="#FF7F50" />
          </View>
          <LineChart
            data={{
              labels: stats.labels,
              datasets: [{ data: stats.dataPoints.length > 0 ? stats.dataPoints : [0,0,0,0,0,0,0] }]
            }}
            width={width - 88} // Padding adjustments
            height={220}
            yAxisLabel="₹"
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 127, 80, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa887'
              }
            }}
            bezier
            style={styles.chartStyle}
          />
        </View>

        {/* KPI Cards */}
        <Text style={styles.sectionTitle}>Weekly Summary</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconWrap}>
              <Ionicons name="wallet-outline" size={22} color="#4ade80" />
            </View>
            <Text style={styles.kpiLabel}>Revenue</Text>
            <Text style={styles.kpiValue}>₹{stats.totalRevenue.toFixed(2)}</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiIconWrap}>
              <Ionicons name="receipt-outline" size={22} color="#60a5fa" />
            </View>
            <Text style={styles.kpiLabel}>Orders</Text>
            <Text style={styles.kpiValue}>{stats.totalOrders}</Text>
          </View>
        </View>

        <View style={[styles.kpiCard, { width: '100%', marginTop: 15, flexDirection: 'row', alignItems: 'center' }]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="trending-up-outline" size={22} color="#a855f7" />
          </View>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.kpiLabel}>Average Order Value</Text>
            <Text style={styles.kpiValue}>₹{stats.avgOrderValue.toFixed(2)}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="lock-closed" size={20} color="#fff" />
          <Text style={styles.logoutBtnText}>Lock Workspace</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  
  header: { paddingTop: 20, marginBottom: 25 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  chartStyle: { marginVertical: 8, borderRadius: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 15 },
  
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  kpiIconWrap: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12
  },
  kpiLabel: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#111' },

  logoutBtn: {
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 40,
    marginBottom: 20,
  },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 10 },
});
