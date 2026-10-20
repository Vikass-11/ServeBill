import React, { useContext, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessContext } from '../../context/BusinessContext';
import { ThemeContext } from '../../context/ThemeContext';

export default function ShopDashboardScreen({ navigation }) {
  const { shopSales, shopExpenses } = useContext(BusinessContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

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

    const monthProfit = monthRevenue - monthExpenses;
    const profitMargin = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(1) : '0.0';

    return {
      todayMorning,
      todayNight,
      todayTotal: todayMorning + todayNight,
      monthRevenue,
      monthExpenses,
      monthProfit,
      profitMargin,
    };
  }, [shopSales, shopExpenses]);

  const recentSales = useMemo(() => {
    return [...shopSales]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
  }, [shopSales]);

  const morningRatio = stats.todayTotal > 0 ? (stats.todayMorning / stats.todayTotal) * 100 : 50;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.headerPillText}>Counter Ledger</Text>
            </View>
            <Text style={styles.mainTitle}>
              Shop <Text style={{ color: theme.primary }}>Counter.</Text>
            </Text>
            <Text style={styles.subtitle}>Daily shift cash flows & counter retail</Text>
          </View>
        </View>

        {/* TODAY'S SALES HERO CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardSubHeader}>TODAY'S GROSS SALES</Text>
              <Text style={styles.todayGrandTotal}>
                ₹{stats.todayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.todayIconBadge}>
              <Ionicons name="sunny" size={20} color={theme.primary} />
            </View>
          </View>

          {/* Shift Visual Split Bar */}
          <View style={styles.shiftBarContainer}>
            <View style={[styles.shiftBarMorning, { width: `${morningRatio}%` }]} />
            <View style={[styles.shiftBarNight, { width: `${100 - morningRatio}%` }]} />
          </View>

          {/* Shift Breakdown Row */}
          <View style={styles.shiftRow}>
            <View style={styles.shiftBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sunny-outline" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.shiftLabel}>Morning Shift</Text>
              </View>
              <Text style={styles.shiftValue}>₹{stats.todayMorning.toFixed(2)}</Text>
            </View>

            <View style={styles.shiftDivider} />

            <View style={styles.shiftBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="moon-outline" size={14} color="#6366F1" style={{ marginRight: 4 }} />
                <Text style={styles.shiftLabel}>Night Shift</Text>
              </View>
              <Text style={styles.shiftValue}>₹{stats.todayNight.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS ROW */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtnPrimary}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('AddShopSale')}
          >
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtnGradient}
            >
              <Ionicons name="cash" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnPrimaryText}>Record Sales</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtnSecondary}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddShopExpense')}
          >
            <Ionicons name="cart-outline" size={18} color={theme.text} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnSecondaryText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* MONTH PERFORMANCE CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Month-to-Date Financials</Text>
            </View>
            <View style={styles.marginPill}>
              <Text style={styles.marginPillText}>{stats.profitMargin}% Margin</Text>
            </View>
          </View>

          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Total Shop Revenue</Text>
            <Text style={styles.monthlyRevenue}>
              ₹{stats.monthRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Shop Operating Expenses</Text>
            <Text style={styles.monthlyExpense}>
              -₹{stats.monthExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.monthlyTotalBox}>
            <View>
              <Text style={styles.monthlyTotalLabel}>Net Shop Profit</Text>
              <Text style={styles.monthlyTotalSubtitle}>Cleared Counter Margin</Text>
            </View>
            <Text style={styles.monthlyTotalValue}>
              ₹{stats.monthProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* RECENT SHIFT HISTORY */}
        {recentSales.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Shift Logs</Text>
            </View>

            {recentSales.map((sale) => (
              <View key={sale.id} style={styles.recentSaleCard}>
                <View style={styles.recentSaleLeft}>
                  <View style={styles.recentSaleIconCircle}>
                    <Ionicons name="receipt-outline" size={16} color={theme.primary} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.recentSaleDate}>
                      {new Date(sale.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    <Text style={styles.recentSaleBreakdown}>
                      Morn: ₹{sale.morningSales || 0} • Night: ₹{sale.nightSales || 0}
                    </Text>
                  </View>
                </View>

                <Text style={styles.recentSaleTotal}>
                  ₹{((sale.morningSales || 0) + (sale.nightSales || 0)).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
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
  card: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.25 : 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardSubHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.2,
  },
  todayGrandTotal: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.8,
  },
  todayIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 16,
  },
  shiftBarMorning: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  shiftBarNight: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  shiftBox: {
    flex: 1,
    alignItems: 'center',
  },
  shiftLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  shiftValue: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.text,
    marginTop: 4,
  },
  shiftDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.border,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionBtnPrimary: {
    flex: 1.2,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBtnSecondaryText: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 13,
  },
  marginPill: {
    backgroundColor: theme.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  marginPillText: {
    color: theme.success,
    fontSize: 11,
    fontWeight: '800',
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthlyLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  monthlyRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  monthlyExpense: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.error,
  },
  monthlyTotalBox: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  monthlyTotalSubtitle: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  monthlyTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.success,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.3,
  },
  recentSaleCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.15 : 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  recentSaleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentSaleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSaleDate: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.text,
  },
  recentSaleBreakdown: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  recentSaleTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
});
