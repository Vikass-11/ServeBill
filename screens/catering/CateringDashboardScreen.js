import React, { useContext, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { InvoiceContext } from '../../context/InvoiceContext';
import { ThemeContext } from '../../context/ThemeContext';

export default function CateringDashboardScreen({ navigation }) {
  const { invoices } = useContext(InvoiceContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let monthOrders = 0;
    let monthRevenue = 0;
    let monthExpenses = 0;
    let totalPending = 0;

    invoices.forEach(inv => {
      if (inv.businessType === 'SHOP') return;

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

    const monthProfit = monthRevenue - monthExpenses;
    const profitMargin = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(1) : '0.0';

    return {
      monthOrders,
      monthRevenue,
      monthExpenses,
      monthProfit,
      profitMargin,
      totalPending
    };
  }, [invoices]);

  const recentOrders = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
  }, [invoices]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.headerPillText}>Events & Banquets</Text>
            </View>
            <Text style={styles.mainTitle}>
              Catering <Text style={{ color: theme.accentPurple }}>Hub.</Text>
            </Text>
            <Text style={styles.subtitle}>Order pipeline, event prep & payment tracking</Text>
          </View>
        </View>

        {/* MONTH'S PERFORMANCE HERO CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardSubHeader}>THIS MONTH'S REVENUE</Text>
              <Text style={styles.revenueTotal}>
                ₹{stats.monthRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.cateringIconBadge, { backgroundColor: isDarkMode ? '#2B1A3A' : '#F5F3FF' }]}>
              <Ionicons name="restaurant" size={20} color={theme.accentPurple} />
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Booked Orders</Text>
              <Text style={styles.kpiValue}>{stats.monthOrders}</Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Event Costs</Text>
              <Text style={[styles.kpiValue, { color: theme.error }]}>
                ₹{stats.monthExpenses.toFixed(0)}
              </Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Net Margin</Text>
              <Text style={[styles.kpiValue, { color: theme.success }]}>
                {stats.profitMargin}%
              </Text>
            </View>
          </View>

          <View style={styles.netProfitRow}>
            <View>
              <Text style={styles.netProfitLabel}>Estimated Event Profit</Text>
              <Text style={styles.netProfitSubtitle}>Cleared after food & prep expenses</Text>
            </View>
            <Text style={styles.netProfitValue}>
              ₹{stats.monthProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* PENDING RECEIVABLES ALERT */}
        {stats.totalPending > 0 ? (
          <View style={styles.pendingCard}>
            <View style={styles.pendingCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="alert-circle" size={18} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.pendingCardTitle}>Outstanding Receivables</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('CateringOrders')}>
                <Text style={styles.pendingFollowUp}>Follow Up →</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.pendingAmount}>
              ₹{stats.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.pendingSub}>Unpaid balances across all active invoices</Text>
          </View>
        ) : (
          <View style={styles.allPaidCard}>
            <Ionicons name="checkmark-circle" size={18} color={theme.success} style={{ marginRight: 8 }} />
            <Text style={styles.allPaidText}>All customer invoice payments are fully cleared!</Text>
          </View>
        )}

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtnPrimary}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('CreateCateringOrder')}
          >
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtnGradient}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnPrimaryText}>Create New Order</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtnSecondary}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CateringOrders')}
          >
            <Ionicons name="receipt-outline" size={18} color={theme.text} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnSecondaryText}>Order History</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT CATERING ORDERS */}
        {recentOrders.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Event Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CateringOrders')}>
                <Text style={styles.viewAllText}>View All ({invoices.length})</Text>
              </TouchableOpacity>
            </View>

            {recentOrders.map((inv) => {
              const rev = parseFloat(inv.grandTotal || inv.total || 0);
              const rec = parseFloat(inv.amountReceived || 0);
              const isFullyPaid = rec >= rev && rev > 0;
              const isPartial = rec > 0 && rec < rev;

              return (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.recentOrderCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('CateringOrderDetails', { invoiceId: inv.id })}
                >
                  <View style={styles.recentOrderLeft}>
                    <View style={styles.recentOrderIcon}>
                      <Ionicons name="restaurant-outline" size={16} color={theme.accentPurple} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.recentClientName}>{inv.clientName || inv.customerName || 'Direct Client'}</Text>
                      <Text style={styles.recentEventDate}>{inv.date ? (isNaN(new Date(inv.date).getTime()) ? inv.date : new Date(inv.date).toLocaleDateString('en-IN')) : ''}</Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.recentOrderAmount}>
                      ₹{rev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                    
                    <View style={[
                      styles.statusPill,
                      isFullyPaid && styles.statusPillPaid,
                      isPartial && styles.statusPillPartial,
                      !isFullyPaid && !isPartial && styles.statusPillPending
                    ]}>
                      <Text style={[
                        styles.statusText,
                        isFullyPaid && { color: theme.success },
                        isPartial && { color: '#D97706' },
                        !isFullyPaid && !isPartial && { color: theme.error }
                      ]}>
                        {isFullyPaid ? 'Paid' : isPartial ? 'Partial' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    backgroundColor: isDarkMode ? '#2B1A3A' : '#F5F3FF',
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
    backgroundColor: theme.accentPurple,
    marginRight: 6,
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accentPurple,
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
  revenueTotal: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.8,
  },
  cateringIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.inputBackground,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  kpiDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.border,
  },
  netProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  netProfitLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  netProfitSubtitle: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  netProfitValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.success,
  },
  pendingCard: {
    backgroundColor: isDarkMode ? '#2D2005' : '#FFFBEB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#4D3605' : '#FDE68A',
  },
  pendingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pendingCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: isDarkMode ? '#FCD34D' : '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingFollowUp: {
    fontSize: 12,
    fontWeight: '800',
    color: isDarkMode ? '#FCD34D' : '#B45309',
  },
  pendingAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: isDarkMode ? '#FCD34D' : '#B45309',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  pendingSub: {
    fontSize: 11,
    color: isDarkMode ? '#D4B13B' : '#92400E',
    fontWeight: '500',
  },
  allPaidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.successLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  allPaidText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.success,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
  },
  recentOrderCard: {
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
  recentOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentOrderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#2B1A3A' : '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentClientName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  recentEventDate: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  recentOrderAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 3,
  },
  statusPillPaid: {
    backgroundColor: theme.successLight,
  },
  statusPillPartial: {
    backgroundColor: isDarkMode ? '#2D2005' : '#FFFBEB',
  },
  statusPillPending: {
    backgroundColor: theme.errorLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
