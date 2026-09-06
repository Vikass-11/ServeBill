import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { InvoiceContext } from '../context/InvoiceContext';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { invoices } = useContext(InvoiceContext);

  const { labels, data, totalRevenue, topItem } = useMemo(() => {
    // Process last 7 days of revenue
    const revenueMap = {};
    const itemMap = {};
    let total = 0;

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN');
      revenueMap[dateStr] = 0;
    }

    invoices.forEach(inv => {
      if (revenueMap[inv.date] !== undefined) {
        revenueMap[inv.date] += inv.grandTotal;
      }
      total += inv.grandTotal;

      // Calculate top items
      if (inv.events) {
        inv.events.forEach(ev => {
          if (ev.tiffinQuantities) {
            Object.keys(ev.tiffinQuantities).forEach(itemId => {
              itemMap[itemId] = (itemMap[itemId] || 0) + ev.tiffinQuantities[itemId];
            });
          }
        });
      }
    });

    const lbls = Object.keys(revenueMap).map(d => d.substring(0, 5));
    const dt = Object.values(revenueMap);

    return {
      labels: lbls,
      data: dt,
      totalRevenue: total,
      topItem: Object.keys(itemMap).length > 0 ? Object.keys(itemMap).reduce((a, b) => itemMap[a] > itemMap[b] ? a : b) : 'None'
    };
  }, [invoices]);

  const chartConfig = {
    backgroundGradientFrom: '#111',
    backgroundGradientTo: '#111',
    color: (opacity = 1) => `rgba(255, 127, 80, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726'
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
            <Text style={styles.mainTitle}>
              Analytics <Text style={{color: '#888'}}>Dashboard.</Text>
            </Text>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>${totalRevenue.toLocaleString()}</Text>
          </View>
          <Ionicons name="trending-up" size={32} color="#FF7F50" />
        </View>

        <Text style={styles.chartTitle}>7-Day Revenue Trend</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels,
              datasets: [{ data: data.length > 0 ? data : [0,0,0,0,0,0,0] }]
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 16 }}
          />
        </View>

        <View style={styles.insightsGrid}>
          <View style={styles.insightBox}>
            <Ionicons name="star" size={24} color="#f1c40f" />
            <Text style={styles.insightText}>Top Selling Item ID</Text>
            <Text style={styles.insightValue}>{topItem}</Text>
          </View>
          <View style={styles.insightBox}>
            <Ionicons name="receipt" size={24} color="#3498db" />
            <Text style={styles.insightText}>Total Invoices</Text>
            <Text style={styles.insightValue}>{invoices.length}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  scroll: { paddingBottom: 120 },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  summaryCard: {
    backgroundColor: '#111',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  summaryLabel: { color: '#888', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  summaryValue: { color: '#fff', fontSize: 36, fontWeight: '800' },
  chartTitle: { fontSize: 20, fontWeight: '800', marginHorizontal: 24, marginBottom: 15, color: '#111' },
  chartContainer: { marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  insightsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  insightBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  insightText: { fontSize: 13, color: '#888', marginTop: 10, fontWeight: '600' },
  insightValue: { fontSize: 20, fontWeight: '800', color: '#111', marginTop: 4 }
});
