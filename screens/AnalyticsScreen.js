import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InvoiceContext } from '../context/InvoiceContext';
import { MenuContext } from '../context/MenuContext';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { invoices } = useContext(InvoiceContext);
  const { tiffinItems } = useContext(MenuContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [selectedDayIdx, setSelectedDayIdx] = useState(null);

  const { labels, data, totalRevenue, topItemName, topItemCount, avgOrderValue } = useMemo(() => {
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
      const gTotal = parseFloat(inv.grandTotal) || 0;
      if (revenueMap[inv.date] !== undefined) {
        revenueMap[inv.date] += gTotal;
      }
      total += gTotal;

      // Calculate top items
      if (inv.events) {
        inv.events.forEach(ev => {
          if (ev.tiffinQuantities) {
            Object.keys(ev.tiffinQuantities).forEach(itemId => {
              const qty = Number(ev.tiffinQuantities[itemId]) || 0;
              itemMap[itemId] = (itemMap[itemId] || 0) + qty;
            });
          }
        });
      }
    });

    const lbls = Object.keys(revenueMap).map(d => {
      const parts = d.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : d.substring(0, 5);
    });
    const dt = Object.values(revenueMap);

    let topItemId = null;
    let maxCount = 0;
    Object.keys(itemMap).forEach(id => {
      if (itemMap[id] > maxCount) {
        maxCount = itemMap[id];
        topItemId = id;
      }
    });

    let topName = 'No sales logged yet';
    if (topItemId) {
      const found = tiffinItems.find(t => t.id === topItemId);
      topName = found ? found.name : `Item #${topItemId.slice(-4)}`;
    }

    const aov = invoices.length > 0 ? total / invoices.length : 0;

    return {
      labels: lbls,
      data: dt,
      totalRevenue: total,
      topItemName: topName,
      topItemCount: maxCount,
      avgOrderValue: aov,
    };
  }, [invoices, tiffinItems]);

  const maxVal = Math.max(...data, 1);
  const hasVelocity = data.some(v => v > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.headerPillText}>Intelligence Hub</Text>
          </View>
          <Text style={styles.mainTitle}>
            Business <Text style={{ color: theme.primary }}>Insights.</Text>
          </Text>
          <Text style={styles.subtitle}>Revenue trajectory, order volume & dish popularity</Text>
        </View>

        {/* HERO REVENUE SUMMARY CARD */}
        <View style={styles.summaryCardShadow}>
          <LinearGradient
            colors={isDarkMode ? ['#131B2E', '#0B101D'] : ['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryLabel}>ALL-TIME INVOICED REVENUE</Text>
                <Text style={styles.summaryValue}>
                  ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.summaryIconBadge}>
                <Ionicons name="stats-chart" size={22} color="#34D399" />
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.statSubLabel}>Total Invoices</Text>
                <Text style={styles.statSubValue}>{invoices.length}</Text>
              </View>

              <View style={styles.statVerticalDivider} />

              <View style={styles.summaryStatItem}>
                <Text style={styles.statSubLabel}>Avg. Order Value</Text>
                <Text style={[styles.statSubValue, { color: '#34D399' }]}>
                  ₹{avgOrderValue.toFixed(0)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 7-DAY REVENUE TREND */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>7-Day Revenue Velocity</Text>
              <Text style={styles.chartSubtitle}>Past week billing momentum</Text>
            </View>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={12} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={styles.trendBadgeText}>{hasVelocity ? 'Active' : 'Standby'}</Text>
            </View>
          </View>

          {/* Interactive Tooltip & Details Banner */}
          <View style={styles.chartInspectRow}>
            <Text style={styles.chartInspectDate}>
              {selectedDayIdx !== null ? `Date: ${labels[selectedDayIdx]}` : 'Tap a bar to inspect'}
            </Text>
            <Text style={styles.chartInspectValue}>
              {selectedDayIdx !== null 
                ? `₹${data[selectedDayIdx].toLocaleString('en-IN')}` 
                : (hasVelocity ? `Peak: ₹${Math.max(...data).toLocaleString('en-IN')}` : '₹0')}
            </Text>
          </View>

          {/* Bars Visualization */}
          <View style={styles.barsContainer}>
            {/* Horizontal Guide Lines */}
            <View style={styles.gridContainer}>
              <View style={[styles.gridLine, { borderColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />
              <View style={[styles.gridLine, { borderColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />
              <View style={[styles.gridLine, { borderColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />
            </View>

            <View style={styles.barsRow}>
              {data.map((val, idx) => {
                const isSelected = selectedDayIdx === idx;
                const ratio = val / maxVal;
                const heightPct = Math.max(Math.min(ratio * 100, 100), val > 0 ? 12 : 6);

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.75}
                    onPress={() => setSelectedDayIdx(isSelected ? null : idx)}
                    style={styles.barColumn}
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: isSelected 
                              ? theme.primary 
                              : (val > 0 
                                  ? (isDarkMode ? '#FF6B4A' : theme.primary) 
                                  : (isDarkMode ? '#232D3F' : '#E2E8F0')),
                            opacity: selectedDayIdx !== null && !isSelected ? 0.4 : 1,
                            shadowColor: val > 0 ? theme.primary : 'transparent',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: val > 0 ? 0.35 : 0,
                            shadowRadius: 5,
                            elevation: val > 0 ? 2 : 0,
                          }
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabelText,
                        {
                          color: isSelected ? theme.primary : theme.textSecondary,
                          fontWeight: isSelected ? '800' : '600'
                        }
                      ]}
                    >
                      {labels[idx]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* INSIGHTS GRID */}
        <View style={styles.insightsGrid}>
          {/* Top Selling Item */}
          <View style={styles.insightBox}>
            <View style={[styles.insightIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="trophy" size={20} color="#D97706" />
            </View>
            <Text style={styles.insightText}>Top Selling Dish</Text>
            <Text style={styles.insightValue} numberOfLines={1}>{topItemName}</Text>
            {topItemCount > 0 && (
              <Text style={styles.insightCountText}>{topItemCount} units served</Text>
            )}
          </View>

          {/* Average Turnaround / Reliability */}
          <View style={styles.insightBox}>
            <View style={[styles.insightIconBadge, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="receipt" size={20} color="#6366F1" />
            </View>
            <Text style={styles.insightText}>Completed Orders</Text>
            <Text style={styles.insightValue}>{invoices.length} Bills</Text>
            <Text style={styles.insightCountText}>100% recorded</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    paddingTop: 8,
  },
  header: {
    paddingTop: 12,
    marginBottom: 20,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginRight: 6,
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  summaryCardShadow: {
    borderRadius: 26,
    marginBottom: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDarkMode ? 0.4 : 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  summaryCard: {
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  summaryIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 18,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
  },
  statVerticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 16,
  },
  statSubLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  chartCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.25 : 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trendBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.primary,
  },
  chartInspectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#131B2E' : '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  chartInspectDate: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  chartInspectValue: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.primary,
  },
  barsContainer: {
    height: 170,
    justifyContent: 'flex-end',
    position: 'relative',
    marginTop: 6,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 26,
    zIndex: 0,
  },
  gridLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    width: '100%',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    zIndex: 1,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  barFill: {
    width: 22,
    borderRadius: 11,
    minHeight: 6,
  },
  barLabelText: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightBox: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  insightIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightText: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.text,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  insightCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 2,
  },
});
