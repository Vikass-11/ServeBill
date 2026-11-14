import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { BusinessContext } from '../context/BusinessContext';
import { InvoiceContext } from '../context/InvoiceContext';
import { ThemeContext } from '../context/ThemeContext';
import QuickAddModal from '../components/QuickAddModal';

// Mini Sparkline SVG Wave matching Screen 2
function MiniWave({ color = '#FF6B55', width = 64, height = 22 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 22">
      <Path
        d="M 2 16 C 14 20, 22 4, 34 12 C 44 18, 52 4, 62 8"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const gaugeStyles = StyleSheet.create({
  gaugeContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 5,
    borderColor: '#7C75C2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#554E96',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  gaugeInnerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeFlameBadge: {
    marginBottom: 1,
  },
  gaugeValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#232136',
    letterSpacing: -0.3,
  },
  gaugeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#767389',
    textTransform: 'uppercase',
  },
});

// Circular Progress Gauge Ring matching Screen 2
function CircularGauge({ progress = 0, valueText = '0', labelText = 'Plates' }) {
  return (
    <View style={gaugeStyles.gaugeContainer}>
      <View style={gaugeStyles.gaugeOuterRing}>
        <View style={gaugeStyles.gaugeInnerCircle}>
          <View style={gaugeStyles.gaugeFlameBadge}>
            <Ionicons name="flame" size={13} color="#FF6B55" />
          </View>
          <Text style={gaugeStyles.gaugeValue}>{valueText}</Text>
          <Text style={gaugeStyles.gaugeLabel}>{labelText}</Text>
        </View>
      </View>
    </View>
  );
}

export default function OverallDashboardScreen({ navigation }) {
  const { businessProfile, refreshBusinessData } = useContext(BusinessContext);
  const { invoices, refreshInvoices } = useContext(InvoiceContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [heroView, setHeroView] = useState('coral'); // 'coral' (Screen 1) or 'progress' (Screen 2)
  const [timeFilter, setTimeFilter] = useState('today'); // 'today', 'yesterday', or 'month'

  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isTimeFilterModalOpen, setIsTimeFilterModalOpen] = useState(false);

  const availableMonths = useMemo(() => {
    const list = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      list.push({
        offset: -i,
        label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }
    return list;
  }, []);

  const selectedMonth = useMemo(() => {
    return availableMonths.find((m) => m.offset === selectedMonthOffset) || availableMonths[0];
  }, [availableMonths, selectedMonthOffset]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshInvoices ? refreshInvoices() : Promise.resolve(),
      refreshBusinessData ? refreshBusinessData() : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (refreshInvoices) refreshInvoices();
      if (refreshBusinessData) refreshBusinessData();
    }, [refreshInvoices, refreshBusinessData])
  );

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-IN');

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-IN');

    let todayRevenue = 0;
    let todayCollected = 0;
    let todayOrdersCount = 0;

    let yesterdayRevenue = 0;
    let yesterdayCollected = 0;
    let yesterdayOrdersCount = 0;

    let monthRevenue = 0;
    let monthCollected = 0;
    let monthOrdersCount = 0;
    let monthPlatesCount = 0;
    let totalPending = 0;

    (invoices || []).forEach((inv) => {
      const rev = parseFloat(inv.grandTotal || inv.total || 0);
      const rec = parseFloat(inv.amountReceived || 0);
      const bal = Math.max(0, rev - rec);

      totalPending += bal;

      const d = new Date(inv.date);
      const isDateValid = !isNaN(d.getTime());
      const dateInStr = isDateValid ? d.toLocaleDateString('en-IN') : '';

      // Check Today
      const isToday = inv.date === todayStr || dateInStr === todayStr;
      if (isToday) {
        todayOrdersCount++;
        todayRevenue += rev;
        todayCollected += rec;
      }

      // Check Yesterday
      const isYesterday = inv.date === yesterdayStr || dateInStr === yesterdayStr;
      if (isYesterday) {
        yesterdayOrdersCount++;
        yesterdayRevenue += rev;
        yesterdayCollected += rec;
      }

      // Check Selected Month
      const isSelectedMonth =
        isDateValid &&
        d.getMonth() === selectedMonth.month &&
        d.getFullYear() === selectedMonth.year;

      if (isSelectedMonth) {
        monthOrdersCount++;
        monthRevenue += rev;
        monthCollected += rec;

        // Calculate actual plates for this invoice
        let invPlates = 0;
        if (Array.isArray(inv.events)) {
          inv.events.forEach((ev) => {
            if (ev?.sessions) {
              Object.values(ev.sessions).forEach((sess) => {
                if (sess?.meals && Array.isArray(sess.meals)) {
                  sess.meals.forEach((m) => {
                    invPlates += parseInt(m.quantity, 10) || 0;
                  });
                }
                if (sess?.items && Array.isArray(sess.items)) {
                  sess.items.forEach((it) => {
                    invPlates += parseInt(it.quantity, 10) || 0;
                  });
                }
              });
            }
            if (ev?.meals && Array.isArray(ev.meals)) {
              ev.meals.forEach((m) => {
                invPlates += parseInt(m.quantity, 10) || 0;
              });
            }
          });
        }
        if (invPlates === 0 && inv.items && Array.isArray(inv.items)) {
          inv.items.forEach((it) => {
            invPlates += parseInt(it.quantity, 10) || 0;
          });
        }
        if (invPlates === 0 && (parseInt(inv.guestCount, 10) || 0) > 0) {
          invPlates += parseInt(inv.guestCount, 10);
        }
        monthPlatesCount += invPlates;
      }
    });

    let activeRevenue = todayRevenue;
    let activeCollected = todayCollected;
    let activeOrders = todayOrdersCount;

    if (timeFilter === 'yesterday') {
      activeRevenue = yesterdayRevenue;
      activeCollected = yesterdayCollected;
      activeOrders = yesterdayOrdersCount;
    } else if (timeFilter === 'month') {
      activeRevenue = monthRevenue;
      activeCollected = monthCollected;
      activeOrders = monthOrdersCount;
    }

    const activeBalance = Math.max(0, activeRevenue - activeCollected);

    // Exact collection ratio: 0% if no revenue, never a fake 95% default
    const collectionRatio =
      monthRevenue > 0
        ? Math.min(100, Math.round((monthCollected / monthRevenue) * 100))
        : 0;

    return {
      activeRevenue,
      activeCollected,
      activeBalance,
      activeOrders,
      monthRevenue,
      monthCollected,
      totalPending,
      monthOrdersCount,
      monthPlatesCount,
      collectionRatio,
    };
  }, [invoices, timeFilter, selectedMonth]);

  const recentOrders = useMemo(() => {
    return [...(invoices || [])]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 4);
  }, [invoices]);

  const businessName = (businessProfile && businessProfile.name) || 'Rownok';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* ======================================================== */}
        {/* 1. TOP HEADER BAR (Exact layout from Screen 1 & 2)       */}
        {/* ======================================================== */}
        <View style={styles.header}>
          {/* Avatar + User Name */}
          <TouchableOpacity
            style={styles.profileRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PremiumProfile')}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {businessName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.greetingText}>Hello, {businessName}!</Text>
            </View>
          </TouchableOpacity>

          {/* Action Icons: Search + Notification Bell with Coral Badge Dot */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Bills')}
            >
              <Ionicons name="search-outline" size={19} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Bills')}
            >
              <Ionicons name="notifications-outline" size={19} color={theme.text} />
              {stats.totalPending > 0 && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. TOP HERO CARD (Screen 1 Coral Card / Screen 2 Progress)*/}
        {/* ======================================================== */}
        {heroView === 'coral' ? (
          /* SCREEN 1 CORAL / PEACH CARD (#FFD5CC) */
          <View style={styles.heroCoralCard}>
            {/* Top row of Hero card */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroTitleGroup}>
                <View style={styles.heroIconSquircle}>
                  <Ionicons name="restaurant" size={16} color="#FF6B55" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.heroCardTitle}>Today's Catering</Text>
                  <Text style={styles.heroCardSub}>
                    {stats.activeOrders > 0
                      ? `${stats.activeOrders} Events Booked`
                      : '0 Events Scheduled'}
                  </Text>
                </View>
              </View>

              {/* Action buttons (+ and Edit) */}
              <View style={styles.heroBtnGroup}>
                <TouchableOpacity
                  style={styles.heroCircleActionBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('CreateCateringOrder', {
                      editInvoice: null,
                      newBill: true,
                      timestamp: Date.now(),
                    })
                  }
                >
                  <Ionicons name="add" size={18} color="#232136" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroCircleActionBtn}
                  activeOpacity={0.85}
                  onPress={() => setHeroView((prev) => (prev === 'coral' ? 'progress' : 'coral'))}
                >
                  <Ionicons name="create-outline" size={16} color="#232136" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 4 Stats Spread Horizontally */}
            <View style={styles.heroStatsSpread}>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Revenue</Text>
                <Text style={styles.heroStatValue}>
                  ₹{(stats.activeRevenue / 1000).toFixed(1)}k
                </Text>
              </View>

              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Advance</Text>
                <Text style={styles.heroStatValue}>
                  ₹{(stats.activeCollected / 1000).toFixed(1)}k
                </Text>
              </View>

              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Balance</Text>
                <Text style={styles.heroStatValue}>
                  ₹{(stats.activeBalance / 1000).toFixed(1)}k
                </Text>
              </View>

              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Orders</Text>
                <Text style={styles.heroStatValue}>{stats.activeOrders}</Text>
              </View>
            </View>

            {/* Bottom Row: Filter Pill + "See Progress" link */}
            <View style={styles.heroBottomRow}>
              <TouchableOpacity
                style={styles.heroDropdownPill}
                activeOpacity={0.8}
                onPress={() => setIsTimeFilterModalOpen(true)}
              >
                <Text style={styles.heroDropdownText}>
                  {timeFilter === 'today'
                    ? 'Today'
                    : timeFilter === 'yesterday'
                    ? 'Yesterday'
                    : 'This Month'}
                </Text>
                <Ionicons name="chevron-down" size={12} color="#4A455A" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PremiumAnalytics')}
              >
                <Text style={styles.seeProgressLink}>See Progress →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* SCREEN 2 PERIWINKLE / PROGRESS CARD (#DCD9FF) */
          <View style={styles.heroProgressCard}>
            <View style={styles.progressCardLeft}>
              <View style={styles.progressHeaderRow}>
                <View style={styles.heroIconSquircle}>
                  <Ionicons name="trending-up" size={16} color="#554E96" />
                </View>
                <Text style={styles.progressCardTitle}>Your Progress</Text>
              </View>

              <Text style={styles.progressBigPercent}>
                {stats.collectionRatio}%
              </Text>

              {/* MONTH SELECTOR PILL - OPENS MONTH PICKER MODAL */}
              <TouchableOpacity
                style={styles.progressDatePill}
                activeOpacity={0.8}
                onPress={() => setIsMonthPickerOpen(true)}
              >
                <Text style={styles.progressDateText}>{selectedMonth.label}</Text>
                <Ionicons name="chevron-down" size={12} color="#554E96" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* Circular Gauge on Right & Toggle Button */}
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <TouchableOpacity
                style={[styles.heroCircleActionBtn, { marginBottom: 8 }]}
                activeOpacity={0.85}
                onPress={() => setHeroView('coral')}
                accessibilityLabel="Switch to Today's View"
              >
                <Ionicons name="swap-horizontal" size={16} color="#232136" />
              </TouchableOpacity>

              <CircularGauge
                progress={stats.collectionRatio / 100}
                valueText={`${stats.monthPlatesCount}`}
                labelText="Plates"
              />
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 3. 2x2 PASTEL FEATURE GRID (Exact layout from Screen 1)  */}
        {/* ======================================================== */}
        <View style={styles.featureGrid}>
          {/* Card 1: Sport Data -> Store Prices (Pastel Peach #FFE6D8) */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: '#FFE6D8' }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Stores', { screen: 'StorePriceCompare' })}
          >
            <View style={styles.featureCardTop}>
              <Text style={styles.featureCardTitle}>Store Prices</Text>
              <View style={styles.featureIconSquircle}>
                <Ionicons name="storefront" size={14} color="#A14F2B" />
              </View>
            </View>
            <Text style={styles.featureCardSub}>
              Compare Wholesale & Local Market Rates
            </Text>
            <View style={styles.featureCheckRow}>
              <Text style={styles.featureCheckText}>Check</Text>
              <Ionicons name="arrow-forward" size={14} color="#232136" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Hearth Health -> Bills & Vault (Pastel Lavender #DCD9FF) */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: '#DCD9FF' }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Bills')}
          >
            <View style={styles.featureCardTop}>
              <Text style={styles.featureCardTitle}>Bills & Vault</Text>
              <View style={styles.featureIconSquircle}>
                <Ionicons name="receipt" size={14} color="#554E96" />
              </View>
            </View>
            <Text style={styles.featureCardSub}>
              Track Paid, Partial & Pending Invoices
            </Text>
            <View style={styles.featureCheckRow}>
              <Text style={styles.featureCheckText}>Check</Text>
              <Ionicons name="arrow-forward" size={14} color="#232136" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          {/* Card 3: Sleep Quality -> Menu Catalog (Pastel Mint #D0F5E8) */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: '#D0F5E8' }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Menu')}
          >
            <View style={styles.featureCardTop}>
              <Text style={styles.featureCardTitle}>Menu Catalog</Text>
              <View style={styles.featureIconSquircle}>
                <Ionicons name="fast-food" size={14} color="#177A54" />
              </View>
            </View>
            <Text style={styles.featureCardSub}>
              Tiffins, Curries & Master Thali Packages
            </Text>
            <View style={styles.featureCheckRow}>
              <Text style={styles.featureCheckText}>Check</Text>
              <Ionicons name="arrow-forward" size={14} color="#232136" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          {/* Card 4: IBM -> Client Hub (Pastel Coral / Soft Red #FFB8B3) */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: '#FFB8B3' }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Clients')}
          >
            <View style={styles.featureCardTop}>
              <Text style={styles.featureCardTitle}>Client Hub</Text>
              <View style={styles.featureIconSquircle}>
                <Ionicons name="people" size={14} color="#A32F26" />
              </View>
            </View>
            <Text style={styles.featureCardSub}>
              Customer Directory & Instant Billing
            </Text>
            <View style={styles.featureCheckRow}>
              <Text style={styles.featureCheckText}>Check</Text>
              <Ionicons name="arrow-forward" size={14} color="#232136" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* 4. SPLIT ROW: RECAPS + 2 MINI SPARKLINE CARDS (Screen 2) */}
        {/* ======================================================== */}
        <View style={styles.splitRow}>
          {/* Left Tall Card: "My Activity Recaps" */}
          <View style={styles.recapsCard}>
            <Text style={styles.recapsTitle}>Catering Command</Text>
            <Text style={styles.recapsSub}>
              Everything you need to run your event catering business.
            </Text>

            {/* Banquet illustration card */}
            <View style={styles.recapsImagePlaceholder}>
              <View style={styles.recapsArtCircle}>
                <Ionicons name="restaurant-outline" size={32} color="#FF6B55" />
              </View>
              <Text style={styles.recapsArtCaption}>Banquet Master</Text>
            </View>

            <TouchableOpacity
              style={styles.recapsPillBtn}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('CreateCateringOrder', {
                  editInvoice: null,
                  newBill: true,
                  timestamp: Date.now(),
                })
              }
            >
              <Text style={styles.recapsPillBtnText}>+ Create Bill</Text>
            </TouchableOpacity>
          </View>

          {/* Right Column: 2 Compact White Cards with Mini Sparklines */}
          <View style={styles.sparklineCol}>
            {/* Top Compact Card: Current Month Revenue */}
            <TouchableOpacity
              style={styles.compactStatCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PremiumAnalytics')}
            >
              <View style={styles.compactStatHeader}>
                <Text style={styles.compactStatTitle}>Month Revenue</Text>
                <View style={styles.compactIconSquircle}>
                  <Ionicons name="trending-up" size={11} color="#1E1D2E" />
                </View>
              </View>
              <Text style={styles.compactStatValue}>
                ₹{stats.monthRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
              <View style={styles.compactStatFooter}>
                <View style={styles.deltaPill}>
                  <Text style={styles.deltaPillText}>▲ +12.4%</Text>
                </View>
                <MiniWave color="#2DD4BF" width={52} height={20} />
              </View>
            </TouchableOpacity>

            {/* Bottom Compact Card: Pending Dues */}
            <TouchableOpacity
              style={styles.compactStatCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Bills')}
            >
              <View style={styles.compactStatHeader}>
                <Text style={styles.compactStatTitle}>Pending Due</Text>
                <View style={styles.compactIconSquircle}>
                  <Ionicons name="alert-circle" size={11} color="#FF6B55" />
                </View>
              </View>
              <Text style={[styles.compactStatValue, { color: '#DC2626' }]}>
                ₹{stats.totalPending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
              <View style={styles.compactStatFooter}>
                <View style={[styles.deltaPill, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.deltaPillText, { color: '#DC2626' }]}>▼ To Collect</Text>
                </View>
                <MiniWave color="#FF6B55" width={52} height={20} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 5. TODAY'S EVENTS / RECOMMENDATIONS SECTION (Screen 1)   */}
        {/* ======================================================== */}
        <View style={styles.recommendationHeader}>
          <Text style={styles.recommendationTitle}>Recent Event Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bills')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyRecentCard}>
            <Ionicons name="receipt-outline" size={28} color={theme.textMuted} />
            <Text style={styles.emptyRecentText}>No recent catering orders recorded yet.</Text>
          </View>
        ) : (
          recentOrders.map((inv) => {
            const total = parseFloat(inv.grandTotal || inv.total || 0);
            const rec = parseFloat(inv.amountReceived || 0);
            const isPaid = rec >= total && total > 0;
            const isPartial = rec > 0 && rec < total;

            return (
              <TouchableOpacity
                key={inv.id}
                style={styles.recentOrderCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Bills', { screen: 'CateringOrderDetails', params: { invoiceId: inv.id } })}
              >
                <View style={styles.recentOrderLeft}>
                  <View style={styles.recentOrderAvatar}>
                    <Text style={styles.recentOrderAvatarText}>
                      {(inv.clientName || 'C').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.recentClientName} numberOfLines={1}>
                      {inv.clientName || 'Direct Client'}
                    </Text>
                    <Text style={styles.recentOrderDate}>{inv.date || 'Today'}</Text>
                  </View>
                </View>

                <View style={styles.recentOrderRight}>
                  <Text style={styles.recentOrderAmount}>
                    ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <View
                    style={[
                      styles.recentStatusPill,
                      isPaid
                        ? styles.statusPillPaid
                        : isPartial
                        ? styles.statusPillPartial
                        : styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.recentStatusText,
                        isPaid && { color: '#15803D' },
                        isPartial && { color: '#B45309' },
                        !isPaid && !isPartial && { color: '#DC2626' },
                      ]}
                    >
                      {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'DUE'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* GLOBAL QUICK ADD FAB & MODAL */}
      <QuickAddModal
        visible={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        navigation={navigation}
      />

      {/* MONTH PICKER MODAL (FOR PROGRESS HERO CARD) */}
      <Modal
        visible={isMonthPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsMonthPickerOpen(false)}
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Month</Text>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {availableMonths.map((m) => {
                const isSelected = selectedMonthOffset === m.offset;
                return (
                  <TouchableOpacity
                    key={m.offset}
                    style={[styles.sheetOptionRow, isSelected && styles.sheetOptionRowActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedMonthOffset(m.offset);
                      setIsMonthPickerOpen(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={isSelected ? theme.primary : theme.textSecondary}
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        style={[
                          styles.sheetOptionText,
                          isSelected && { fontWeight: '800', color: theme.primary },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* TIME FILTER MODAL (FOR TODAY HERO CARD) */}
      <Modal
        visible={isTimeFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTimeFilterModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsTimeFilterModalOpen(false)}
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Catering Overview</Text>

            {[
              { key: 'today', label: 'Today', icon: 'today-outline' },
              { key: 'yesterday', label: 'Yesterday', icon: 'time-outline' },
              { key: 'month', label: 'This Month', icon: 'calendar-outline' },
            ].map((opt) => {
              const isSelected = timeFilter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sheetOptionRow, isSelected && styles.sheetOptionRowActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setTimeFilter(opt.key);
                    setIsTimeFilterModalOpen(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={isSelected ? theme.primary : theme.textSecondary}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={[
                        styles.sheetOptionText,
                        isSelected && { fontWeight: '800', color: theme.primary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#0F0E17' : '#F7F6FB',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },

    // 1. HEADER BAR
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 2,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#E9DFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarInitials: {
      fontSize: 14,
      fontWeight: '800',
      color: '#554E96',
    },
    greetingText: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#F8F7FC' : '#1E1D2E',
      letterSpacing: -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDarkMode ? '#1E1D2E' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2E2D42' : 'rgba(0,0,0,0.05)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    notificationDot: {
      position: 'absolute',
      top: 9,
      right: 9,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#FF6B55',
    },

    // 2. HERO CORAL CARD (#FFD5CC)
    heroCoralCard: {
      backgroundColor: isDarkMode ? '#3B231B' : '#FFD5CC',
      borderRadius: 28,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.25 : 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    heroTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    heroIconSquircle: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    heroCardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#FFE2D5' : '#232136',
    },
    heroCardSub: {
      fontSize: 11,
      color: isDarkMode ? '#F7C6B6' : '#6A657A',
      marginTop: 2,
      fontWeight: '500',
    },
    heroBtnGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroCircleActionBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    heroStatsSpread: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
      paddingHorizontal: 4,
    },
    heroStatCol: {
      alignItems: 'flex-start',
    },
    heroStatLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: isDarkMode ? '#F7C6B6' : '#6A657A',
      marginBottom: 3,
    },
    heroStatValue: {
      fontSize: 21,
      fontWeight: '900',
      color: isDarkMode ? '#FFFFFF' : '#232136',
      letterSpacing: -0.4,
    },
    heroBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 6,
    },
    heroDropdownPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.55)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    heroDropdownText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#232136',
    },
    seeProgressLink: {
      fontSize: 12,
      fontWeight: '700',
      color: '#232136',
    },

    // HERO PROGRESS CARD (#DCD9FF)
    heroProgressCard: {
      backgroundColor: isDarkMode ? '#2E2445' : '#DCD9FF',
      borderRadius: 28,
      padding: 20,
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.25 : 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    progressCardLeft: {
      flex: 1,
    },
    progressHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    progressCardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDarkMode ? '#E9DFFF' : '#232136',
      marginLeft: 10,
    },
    progressBigPercent: {
      fontSize: 42,
      fontWeight: '900',
      color: isDarkMode ? '#FFFFFF' : '#232136',
      letterSpacing: -1,
      marginBottom: 8,
    },
    progressDatePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.55)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'flex-start',
    },
    progressDateText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#232136',
    },
    gaugeContainer: {
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gaugeOuterRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 5,
      borderColor: '#FF7E69',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    gaugeInnerCircle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    gaugeFlameBadge: {
      marginBottom: 1,
    },
    gaugeValue: {
      fontSize: 16,
      fontWeight: '900',
      color: '#232136',
      letterSpacing: -0.3,
    },
    gaugeLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: '#767389',
      textTransform: 'uppercase',
    },

    // 3. 2x2 FEATURE GRID
    featureGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    featureCard: {
      width: '48%',
      borderRadius: 22,
      padding: 16,
      minHeight: 125,
      justifyContent: 'space-between',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    featureCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    featureCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#232136',
      flex: 1,
      paddingRight: 6,
    },
    featureIconSquircle: {
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.65)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureCardSub: {
      fontSize: 11,
      color: '#555166',
      marginVertical: 8,
      lineHeight: 15,
      fontWeight: '500',
    },
    featureCheckRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    featureCheckText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#232136',
    },

    // 4. SPLIT ROW: RECAPS + 2 MINI SPARKLINE CARDS
    splitRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    recapsCard: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1E1D2E' : '#FFFFFF',
      borderRadius: 22,
      padding: 16,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2E2D42' : 'rgba(0,0,0,0.05)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.3 : 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    recapsTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 3,
    },
    recapsSub: {
      fontSize: 11,
      color: theme.textSecondary,
      lineHeight: 14,
      marginBottom: 10,
    },
    recapsImagePlaceholder: {
      backgroundColor: isDarkMode ? '#272538' : '#F7F6FB',
      borderRadius: 16,
      height: 90,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333148' : '#ECE9F4',
    },
    recapsArtCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFE6D8',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    recapsArtCaption: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    recapsPillBtn: {
      backgroundColor: '#1E1D2E',
      paddingVertical: 10,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recapsPillBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    sparklineCol: {
      flex: 1,
      gap: 12,
    },
    compactStatCard: {
      backgroundColor: isDarkMode ? '#1E1D2E' : '#FFFFFF',
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2E2D42' : 'rgba(0,0,0,0.05)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    compactStatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    compactStatTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    compactIconSquircle: {
      width: 22,
      height: 22,
      borderRadius: 7,
      backgroundColor: isDarkMode ? '#272538' : '#F4F3F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactStatValue: {
      fontSize: 17,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: -0.3,
      marginBottom: 6,
    },
    compactStatFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    deltaPill: {
      backgroundColor: isDarkMode ? '#132822' : '#D1FAE5',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    deltaPillText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#059669',
    },

    // 5. RECENT RECOMMENDATIONS
    recommendationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    recommendationTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    emptyRecentCard: {
      backgroundColor: isDarkMode ? '#1E1D2E' : '#FFFFFF',
      borderRadius: 18,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyRecentText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 8,
    },
    recentOrderCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1E1D2E' : '#FFFFFF',
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2E2D42' : 'rgba(0,0,0,0.05)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    recentOrderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    recentOrderAvatar: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: '#FFE6D8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recentOrderAvatarText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#A14F2B',
    },
    recentClientName: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    recentOrderDate: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    recentOrderRight: {
      alignItems: 'flex-end',
    },
    recentOrderAmount: {
      fontSize: 15,
      fontWeight: '900',
      color: theme.text,
      marginBottom: 3,
    },
    recentStatusPill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    statusPillPaid: {
      backgroundColor: '#DCFCE7',
    },
    statusPillPartial: {
      backgroundColor: '#FEF3C7',
    },
    statusPillPending: {
      backgroundColor: '#FEE2E2',
    },
    recentStatusText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.4,
    },

    // Bottom Sheet Modals (Month Picker & Time Filter)
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: isDarkMode ? '#1E1D2E' : '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 40 : 28,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 10,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDarkMode ? '#38354D' : '#E4E2ED',
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 16,
    },
    sheetOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 14,
      marginBottom: 6,
    },
    sheetOptionRowActive: {
      backgroundColor: isDarkMode ? '#2D2845' : '#F0EEF8',
    },
    sheetOptionText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
  });
