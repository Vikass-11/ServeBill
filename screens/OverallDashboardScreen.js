import React, { useContext, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessContext } from '../context/BusinessContext';
import { InvoiceContext } from '../context/InvoiceContext';
import { ThemeContext } from '../context/ThemeContext';

export default function OverallDashboardScreen({ navigation }) {
  const { shopSales, shopExpenses, businessProfile } = useContext(BusinessContext);
  const { invoices } = useContext(InvoiceContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

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
    let cateringOrdersCount = 0;
    let totalPendingReceivables = 0;

    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const isThisMonth = !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const rev = parseFloat(inv.grandTotal || inv.total || 0);
      const rec = parseFloat(inv.amountReceived || 0);

      totalPendingReceivables += Math.max(0, rev - rec);

      if (isThisMonth) {
        cateringOrdersCount++;
        cateringMonthRevenue += rev;
        if (inv.expenses && Array.isArray(inv.expenses)) {
          inv.expenses.forEach(e => cateringMonthExpenses += parseFloat(e.amount || 0));
        }
      }
    });

    const cateringProfit = cateringMonthRevenue - cateringMonthExpenses;
    const totalRevenue = shopMonthRevenue + cateringMonthRevenue;
    const totalProfit = shopProfit + cateringProfit;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    return {
      shopMonthRevenue,
      shopMonthExpenses,
      shopProfit,
      cateringMonthRevenue,
      cateringMonthExpenses,
      cateringProfit,
      cateringOrdersCount,
      totalPendingReceivables,
      totalRevenue,
      totalProfit,
      profitMargin,
    };
  }, [shopSales, shopExpenses, invoices]);

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const recentInvoices = useMemo(() => invoices.slice(0, 3), [invoices]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* EXECUTIVE HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.headerBadgeText}>{currentMonthName}</Text>
            </View>
            <Text style={styles.mainTitle} numberOfLines={1}>
              {businessProfile?.name || 'ServeBill'}
            </Text>
            <Text style={styles.subtitle}>Executive Command Center</Text>
          </View>

          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('PremiumProfile')}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-sharp" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* HERO TOTAL PERFORMANCE CARD */}
        <View style={styles.heroCardShadow}>
          <LinearGradient
            colors={isDarkMode ? ['#131B2E', '#0B101D'] : ['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroPreLabel}>TOTAL NET REVENUE</Text>
                <Text style={styles.heroValue}>
                  ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={styles.marginPill}>
                <Ionicons name="trending-up" size={14} color="#34D399" style={{ marginRight: 4 }} />
                <Text style={styles.marginPillText}>{stats.profitMargin}% Margin</Text>
              </View>
            </View>

            {/* Health Bar */}
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.barFill, 
                  { width: `${Math.min(100, Math.max(10, (stats.totalProfit / (stats.totalRevenue || 1)) * 100))}%` }
                ]} 
              />
            </View>

            <View style={styles.heroBottomRow}>
              <View>
                <Text style={styles.heroSubLabel}>Estimated Net Profit</Text>
                <Text style={styles.heroSubValueProfit}>
                  ₹{stats.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.heroSubLabel}>Total Operating Cost</Text>
                <Text style={styles.heroSubValueExpense}>
                  ₹{(stats.shopMonthExpenses + stats.cateringMonthExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* QUICK ACTIONS COMMAND TILES */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Catering', { screen: 'CreateCateringOrder' });
              }
            }}
          >
            <LinearGradient colors={theme.primaryGradient} style={styles.actionIconCircle}>
              <Ionicons name="receipt" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionTileTitle}>New Bill</Text>
            <Text style={styles.actionTileSub}>Catering Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Shop', { screen: 'AddShopSale' });
              }
            }}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: isDarkMode ? '#1E3A2F' : '#ECFDF5' }]}>
              <Ionicons name="cash" size={20} color={theme.success} />
            </View>
            <Text style={styles.actionTileTitle}>Shop Sales</Text>
            <Text style={styles.actionTileSub}>Daily Shift</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Shop', { screen: 'AddShopExpense' });
              }
            }}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: isDarkMode ? '#3B1A1A' : '#FEF2F2' }]}>
              <Ionicons name="cart" size={20} color={theme.error} />
            </View>
            <Text style={styles.actionTileTitle}>Expense</Text>
            <Text style={styles.actionTileSub}>Log Cost</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Clients')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: isDarkMode ? '#222744' : '#EEF2FF' }]}>
              <Ionicons name="people" size={20} color={theme.secondary} />
            </View>
            <Text style={styles.actionTileTitle}>Clients</Text>
            <Text style={styles.actionTileSub}>Directory</Text>
          </TouchableOpacity>
        </View>

        {/* DIVISION COMPARISON SECTION */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Business Divisions</Text>
        </View>

        {/* SHOP DIVISION CARD */}
        <TouchableOpacity
          style={styles.divisionCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Shop')}
        >
          <View style={styles.divisionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.divisionIconWrap, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="storefront" size={20} color={theme.primary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.divisionTitle}>Shop Counter</Text>
                <Text style={styles.divisionSubtitle}>Daily Counter Sales & Retail</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </View>

          <View style={styles.divisionStatsRow}>
            <View style={styles.divisionStatCol}>
              <Text style={styles.divisionStatLabel}>Revenue</Text>
              <Text style={styles.divisionStatValue}>₹{stats.shopMonthRevenue.toFixed(0)}</Text>
            </View>
            <View style={styles.divisionDivider} />
            <View style={styles.divisionStatCol}>
              <Text style={styles.divisionStatLabel}>Expenses</Text>
              <Text style={[styles.divisionStatValue, { color: theme.error }]}>₹{stats.shopMonthExpenses.toFixed(0)}</Text>
            </View>
            <View style={styles.divisionDivider} />
            <View style={styles.divisionStatCol}>
              <Text style={styles.divisionStatLabel}>Profit</Text>
              <Text style={[styles.divisionStatValue, { color: theme.success }]}>₹{stats.shopProfit.toFixed(0)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* CATERING DIVISION CARD */}
        <TouchableOpacity
          style={styles.divisionCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Catering')}
        >
          <View style={styles.divisionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.divisionIconWrap, { backgroundColor: isDarkMode ? '#2B1A3A' : '#F5F3FF' }]}>
                <Ionicons name="restaurant" size={20} color={theme.accentPurple} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.divisionTitle}>Catering & Events</Text>
                <Text style={styles.divisionSubtitle}>{stats.cateringOrdersCount} Orders This Month</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </View>

          <View style={styles.divisionStatsRow}>
            <View style={styles.divisionStatCol}>
              <Text style={styles.divisionStatLabel}>Revenue</Text>
              <Text style={styles.divisionStatValue}>₹{stats.cateringMonthRevenue.toFixed(0)}</Text>
            </View>
            <View style={styles.divisionDivider} />
            <View style={styles.divisionStatCol}>
              <Text style={styles.divisionStatLabel}>Expenses</Text>
              <Text style={[styles.divisionStatValue, { color: theme.error }]}>₹{stats.cateringMonthExpenses.toFixed(0)}</Text>
            </View>
            <View style={styles.divisionDivider} />
            <View style={styles.divisionStatCol}>
              <Text style={styles.divisionStatLabel}>Profit</Text>
              <Text style={[styles.divisionStatValue, { color: theme.success }]}>₹{stats.cateringProfit.toFixed(0)}</Text>
            </View>
          </View>

          {stats.totalPendingReceivables > 0 && (
            <View style={styles.pendingBanner}>
              <Ionicons name="alert-circle" size={14} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.pendingBannerText}>
                Pending Receivables: <Text style={{ fontWeight: '800' }}>₹{stats.totalPendingReceivables.toFixed(0)}</Text>
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* RECENT INVOICES SECTION */}
        {recentInvoices.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Recent Invoices</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Catering', { screen: 'CateringOrders' })}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentInvoices.map((inv) => (
              <TouchableOpacity
                key={inv.id}
                style={styles.recentItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Catering', { screen: 'CateringOrderDetails', params: { invoiceId: inv.id } })}
              >
                <View style={styles.recentItemLeft}>
                  <View style={styles.recentAvatar}>
                    <Ionicons name="document-text" size={18} color={theme.primary} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.recentClientName}>{inv.clientName}</Text>
                    <Text style={styles.recentDate}>{inv.date}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.recentAmount}>
                    ₹{parseFloat(inv.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.recentStatus}>Completed</Text>
                </View>
              </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerBadge: {
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
  headerBadgeText: {
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
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroCardShadow: {
    borderRadius: 26,
    marginBottom: 24,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDarkMode ? 0.4 : 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  heroCard: {
    borderRadius: 26,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroPreLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  marginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  marginPillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  barContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 3,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroSubLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroSubValueProfit: {
    color: '#34D399',
    fontSize: 18,
    fontWeight: '800',
  },
  heroSubValueExpense: {
    color: '#F87171',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
  },
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionTile: {
    width: '23%',
    backgroundColor: theme.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTileTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  actionTileSub: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  divisionCard: {
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.25 : 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  divisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  divisionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divisionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.2,
  },
  divisionSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  divisionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  divisionStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  divisionStatLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  divisionStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  divisionDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.border,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2D2005' : '#FFFBEB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#4D3605' : '#FDE68A',
  },
  pendingBannerText: {
    fontSize: 12,
    color: isDarkMode ? '#FCD34D' : '#B45309',
    fontWeight: '600',
  },
  recentItem: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
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
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentClientName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  recentDate: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
  recentStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.success,
    marginTop: 2,
  },
});
