import React, { useContext, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { InvoiceContext } from '../context/InvoiceContext';
import { ThemeContext } from '../context/ThemeContext';
import { parseSafeDate, isSameDay } from '../services/dateUtils';

const { width } = Dimensions.get('window');

// Time filter tabs matching Screen 3: Days | Weeks | Months | Years
const TIME_TABS = ['Days', 'Weeks', 'Months', 'Years'];

export default function PremiumAnalyticsScreen({ navigation, onLogout }) {
  const { invoices, refreshInvoices } = useContext(InvoiceContext);
  const { theme, isDarkMode } = useContext(ThemeContext);

  const [selectedTab, setSelectedTab] = useState('Days');
  const [dayOffset, setDayOffset] = useState(0);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Compute reference date from dayOffset
  const displayDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const formattedDateStr = useMemo(() => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return displayDate.toLocaleDateString('en-GB', options);
  }, [displayDate]);

  // Comprehensive analytics calculation
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalReceived = 0;
    let totalOrders = 0;

    let periodRevenue = 0;
    let periodReceived = 0;
    let periodOrders = 0;

    const targetDate = displayDate;
    const targetDay = targetDate.getDate();
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    // Start and end of target week
    const dayOfWeek = targetDate.getDay();
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDay - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    (invoices || []).forEach((inv) => {
      const rev = parseFloat(inv.grandTotal || inv.total || 0);
      const rec = parseFloat(inv.amountReceived || 0);
      totalRevenue += rev;
      totalReceived += rec;
      totalOrders += 1;

      const d = parseSafeDate(inv.date);
      if (d) {
        if (selectedTab === 'Days') {
          if (isSameDay(d, targetDate)) {
            periodRevenue += rev;
            periodReceived += rec;
            periodOrders += 1;
          }
        } else if (selectedTab === 'Weeks') {
          if (d >= weekStart && d < weekEnd) {
            periodRevenue += rev;
            periodReceived += rec;
            periodOrders += 1;
          }
        } else if (selectedTab === 'Months') {
          if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
            periodRevenue += rev;
            periodReceived += rec;
            periodOrders += 1;
          }
        } else if (selectedTab === 'Years') {
          if (d.getFullYear() === targetYear) {
            periodRevenue += rev;
            periodReceived += rec;
            periodOrders += 1;
          }
        }
      }
    });

    const pendingBalance = Math.max(0, totalRevenue - totalReceived);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const collectionRate =
      totalRevenue > 0
        ? Math.min(100, Math.round((totalReceived / totalRevenue) * 100))
        : 0;

    let headlineAmount = periodRevenue;
    let headlineSubtitle = '0 Orders Recorded';

    if (selectedTab === 'Days') {
      headlineSubtitle = periodOrders > 0 ? `${periodOrders} Orders Recorded` : '0 Orders Recorded';
    } else if (selectedTab === 'Weeks') {
      headlineSubtitle = periodOrders > 0 ? `${periodOrders} Orders This Week` : '0 Weekly Orders';
    } else if (selectedTab === 'Months') {
      const monthName = targetDate.toLocaleDateString('en-GB', { month: 'short' });
      headlineSubtitle = periodOrders > 0 ? `${periodOrders} Orders in ${monthName}` : `0 Orders in ${monthName}`;
    } else {
      headlineSubtitle = periodOrders > 0 ? `${periodOrders} Orders in ${targetYear}` : `0 Orders in ${targetYear}`;
    }

    return {
      totalRevenue,
      totalReceived,
      totalOrders,
      pendingBalance,
      avgOrderValue,
      collectionRate,
      headlineAmount,
      headlineSubtitle,
    };
  }, [invoices, selectedTab, displayDate]);

  // Wave Chart dimensions
  const chartWidth = Math.min(width - 48, 380);
  const chartHeight = 175;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ============================================================== */}
        {/* 1. TOP HEADER (Exact Screen 3: Back, "Business Health", Cal, More) */}
        {/* ============================================================== */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerCircleBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (navigation && navigation.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation && navigation.navigate) {
                navigation.navigate('OverallDashboard');
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#25243A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Business Health</Text>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={styles.headerCircleBtn}
              activeOpacity={0.8}
              onPress={() => setIsCalendarOpen(true)}
            >
              <Ionicons name="calendar-outline" size={19} color="#25243A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerCircleBtn, { marginLeft: 10 }]}
              activeOpacity={0.8}
              onPress={() => setIsOptionsOpen(true)}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#25243A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* 2. TIME FILTER TABS: Days | Weeks | Months | Years             */}
        {/* ============================================================== */}
        <View style={styles.timeTabsContainer}>
          {TIME_TABS.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.timeTabItem, isActive && styles.timeTabItemActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.timeTabText,
                    isActive && styles.timeTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
                {isActive && <View style={styles.activeTabIndicatorDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ============================================================== */}
        {/* 3. PRIMARY METRIC & DATE NAVIGATOR (< 20 August 2026 >)        */}
        {/* ============================================================== */}
        <View style={styles.metricDateRow}>
          <View style={styles.metricTextGroup}>
            <Text style={styles.headlineMetric}>
              ₹{stats.headlineAmount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.headlineSub}>{stats.headlineSubtitle}</Text>
          </View>

          <View style={styles.dateNavigatorPill}>
            <TouchableOpacity
              style={styles.dateChevronBtn}
              activeOpacity={0.7}
              onPress={() => setDayOffset((prev) => prev - 1)}
            >
              <Ionicons name="chevron-back" size={14} color="#5C5870" />
            </TouchableOpacity>

            <Text style={styles.dateNavigatorText}>{formattedDateStr}</Text>

            <TouchableOpacity
              style={styles.dateChevronBtn}
              activeOpacity={0.7}
              onPress={() => setDayOffset((prev) => prev + 1)}
            >
              <Ionicons name="chevron-forward" size={14} color="#5C5870" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* 4. SMOOTH SVG WAVE CHART WITH CORAL INDICATOR LINE & PEAK DOT  */}
        {/* ============================================================== */}
        <View style={styles.chartCard}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#7CC7D6" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#7CC7D6" stopOpacity="0.00" />
              </LinearGradient>
            </Defs>

            {/* Y-Axis Guide Lines & Numeric Labels: 200, 160, 120, 80, 40 */}
            {[
              { label: '200', y: 22 },
              { label: '160', y: 52 },
              { label: '120', y: 82 },
              { label: '80', y: 112 },
              { label: '40', y: 142 },
            ].map((grid, idx) => (
              <React.Fragment key={idx}>
                <SvgText
                  x="2"
                  y={grid.y + 3}
                  fill="#A8A5B9"
                  fontSize="10"
                  fontWeight="600"
                >
                  {grid.label}
                </SvgText>
                <Line
                  x1="32"
                  y1={grid.y}
                  x2={chartWidth - 6}
                  y2={grid.y}
                  stroke="#F0EEF7"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </React.Fragment>
            ))}

            {/* Gradient fill under the smooth wave */}
            <Path
              d={`
                M 32 126
                C 75 142, 105 110, 138 126
                C 170 142, 195 86, 235 52
                C 265 24, 290 120, 318 116
                C 342 112, 362 92, ${chartWidth - 6} 104
                L ${chartWidth - 6} 160
                L 32 160
                Z
              `}
              fill="url(#waveGradient)"
            />

            {/* The Main Smooth Cyan Wave Path */}
            <Path
              d={`
                M 32 126
                C 75 142, 105 110, 138 126
                C 170 142, 195 86, 235 52
                C 265 24, 290 120, 318 116
                C 342 112, 362 92, ${chartWidth - 6} 104
              `}
              fill="none"
              stroke="#76C4D3"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* VERTICAL CORAL INDICATOR LINE AT THE PEAK (Screen 3 signature) */}
            <Line
              x1="235"
              y1="52"
              x2="235"
              y2="160"
              stroke="#FF6B55"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />

            {/* CIRCULAR CORAL PEAK DOT WITH CRISP WHITE RING */}
            <Circle
              cx="235"
              cy="52"
              r="5.5"
              fill="#FF6B55"
              stroke="#FFFFFF"
              strokeWidth="2.2"
            />
          </Svg>

          {/* X-Axis Time Markers: 00.00 | 06.00 | 12.00 | 18.00 | 00.00 */}
          <View style={styles.xAxisRow}>
            <Text style={styles.xAxisLabel}>00.00</Text>
            <Text style={styles.xAxisLabel}>06.00</Text>
            <Text style={styles.xAxisLabel}>12.00</Text>
            <Text style={styles.xAxisLabel}>18.00</Text>
            <Text style={styles.xAxisLabel}>00.00</Text>
          </View>
        </View>

        {/* ============================================================== */}
        {/* 5. 3 STAT CARDS ROW (Exact match to Screen 3)                  */}
        {/* ============================================================== */}
        <View style={styles.kpiRow}>
          {/* Card 1: Lavender Card (#DCD9FF) - Collection Rate */}
          <View style={[styles.kpiCard, styles.kpiCardLavender]}>
            <Text style={styles.kpiTitleDark} numberOfLines={2}>
              Collection Rate
            </Text>
            <View style={styles.kpiValueRow}>
              <Ionicons name="arrow-up" size={13} color="#25243A" style={{ marginRight: 2 }} />
              <Text style={styles.kpiValueDark}>{stats.collectionRate}%</Text>
            </View>
          </View>

          {/* Card 2: White Card - Avg Order Value */}
          <View style={[styles.kpiCard, styles.kpiCardWhite]}>
            <Text style={styles.kpiTitleMuted} numberOfLines={2}>
              Avg Order Value
            </Text>
            <View style={styles.kpiValueRow}>
              <Ionicons name="arrow-down" size={13} color="#77758B" style={{ marginRight: 2 }} />
              <Text style={styles.kpiValueRegular}>
                ₹{(stats.avgOrderValue / 1000).toFixed(1)}k
              </Text>
            </View>
          </View>

          {/* Card 3: White Card - Pending Balance */}
          <View style={[styles.kpiCard, styles.kpiCardWhite]}>
            <Text style={styles.kpiTitleMuted} numberOfLines={2}>
              Pending Balance
            </Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValueRegular}>
                ₹{(stats.pendingBalance / 1000).toFixed(1)}k
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================== */}
        {/* 6. BOTTOM 2x1 PASTEL GRID (Exact match to Screen 3)            */}
        {/* ============================================================== */}
        <View style={styles.featureGrid}>
          {/* Left Card: Sleep quality -> Menu Performance (#DCD9FF Lavender) */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: '#DCD9FF' }]}
            activeOpacity={0.85}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Menu');
              }
            }}
          >
            <View style={styles.featureCardTop}>
              <Text style={styles.featureCardTitle}>Menu Yield</Text>
              <View style={styles.featureIconSquircle}>
                <Ionicons name="restaurant" size={14} color="#554E96" />
              </View>
            </View>
            <Text style={styles.featureCardSub}>
              Evaluate Top Dishes & Plate Margins
            </Text>
            <View style={styles.featureCheckRow}>
              <Text style={styles.featureCheckText}>Check</Text>
              <Ionicons name="arrow-forward" size={14} color="#232136" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          {/* Right Card: IBM -> Client Ledger (#FFB8B3 Soft Red / Coral) */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: '#FFB8B3' }]}
            activeOpacity={0.85}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Clients');
              }
            }}
          >
            <View style={styles.featureCardTop}>
              <Text style={styles.featureCardTitle}>Client Vault</Text>
              <View style={styles.featureIconSquircle}>
                <Ionicons name="people" size={14} color="#A32F26" />
              </View>
            </View>
            <Text style={styles.featureCardSub}>
              Control Customer Credit & Ledger
            </Text>
            <View style={styles.featureCheckRow}>
              <Text style={styles.featureCheckText}>Check</Text>
              <Ionicons name="arrow-forward" size={14} color="#232136" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ============================================================== */}
      {/* 7. MORE OPTIONS MODAL (Export, Sync, Lock Workspace)           */}
      {/* ============================================================== */}
      <Modal
        visible={isOptionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOptionsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsOptionsOpen(false)}
        >
          <View style={styles.optionsSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Analytics & Actions</Text>

            <TouchableOpacity
              style={styles.sheetOptionRow}
              activeOpacity={0.7}
              onPress={() => {
                setIsOptionsOpen(false);
                if (refreshInvoices) refreshInvoices();
              }}
            >
              <Ionicons name="sync-outline" size={20} color="#25243A" />
              <Text style={styles.sheetOptionText}>Refresh Cloud Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOptionRow}
              activeOpacity={0.7}
              onPress={() => {
                setIsOptionsOpen(false);
                if (navigation && navigation.navigate) {
                  navigation.navigate('Bills');
                }
              }}
            >
              <Ionicons name="document-text-outline" size={20} color="#25243A" />
              <Text style={styles.sheetOptionText}>View Invoices & Receipts</Text>
            </TouchableOpacity>

            {onLogout && (
              <TouchableOpacity
                style={[styles.sheetOptionRow, { borderBottomWidth: 0, marginTop: 10 }]}
                activeOpacity={0.7}
                onPress={() => {
                  setIsOptionsOpen(false);
                  onLogout();
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#DC2626" />
                <Text style={[styles.sheetOptionText, { color: '#DC2626' }]}>
                  Lock Workspace
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================== */}
      {/* 8. CALENDAR DATE SELECTOR MODAL                                */}
      {/* ============================================================== */}
      <Modal
        visible={isCalendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsCalendarOpen(false)}
        >
          <View style={styles.optionsSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Jump to Period</Text>

            <TouchableOpacity
              style={styles.sheetOptionRow}
              activeOpacity={0.7}
              onPress={() => {
                setDayOffset(0);
                setIsCalendarOpen(false);
              }}
            >
              <Ionicons name="today-outline" size={20} color="#25243A" />
              <Text style={styles.sheetOptionText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOptionRow}
              activeOpacity={0.7}
              onPress={() => {
                setDayOffset(-1);
                setIsCalendarOpen(false);
              }}
            >
              <Ionicons name="time-outline" size={20} color="#25243A" />
              <Text style={styles.sheetOptionText}>Yesterday</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOptionRow}
              activeOpacity={0.7}
              onPress={() => {
                setDayOffset(-7);
                setIsCalendarOpen(false);
              }}
            >
              <Ionicons name="calendar-clear-outline" size={20} color="#25243A" />
              <Text style={styles.sheetOptionText}>Last Week</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetOptionRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => {
                setDayOffset(-30);
                setIsCalendarOpen(false);
              }}
            >
              <Ionicons name="archive-outline" size={20} color="#25243A" />
              <Text style={styles.sheetOptionText}>Last Month</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // 1. Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#25243A',
    letterSpacing: -0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 2. Time Tabs Switcher
  timeTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 22,
  },
  timeTabItem: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    position: 'relative',
  },
  timeTabItemActive: {
    backgroundColor: 'transparent',
  },
  timeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8F8CA3',
  },
  timeTabTextActive: {
    fontSize: 14,
    fontWeight: '800',
    color: '#25243A',
  },
  activeTabIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#25243A',
    marginTop: 3,
  },

  // 3. Metric & Date Navigator
  metricDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricTextGroup: {
    flex: 1,
  },
  headlineMetric: {
    fontSize: 28,
    fontWeight: '900',
    color: '#25243A',
    letterSpacing: -0.6,
  },
  headlineSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#77758B',
    marginTop: 2,
  },
  dateNavigatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dateChevronBtn: {
    padding: 4,
  },
  dateNavigatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25243A',
    marginHorizontal: 6,
  },

  // 4. Wave Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#25243A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  xAxisRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 34,
    paddingRight: 10,
    marginTop: 6,
  },
  xAxisLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A8A5B9',
  },

  // 5. 3 Stat Cards Row
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    minHeight: 84,
  },
  kpiCardLavender: {
    backgroundColor: '#DCD9FF',
  },
  kpiCardWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#25243A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  kpiTitleDark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#25243A',
    lineHeight: 14,
  },
  kpiTitleMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: '#77758B',
    lineHeight: 14,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  kpiValueDark: {
    fontSize: 17,
    fontWeight: '900',
    color: '#25243A',
  },
  kpiValueRegular: {
    fontSize: 17,
    fontWeight: '900',
    color: '#25243A',
  },

  // 6. Bottom 2x1 Pastel Grid
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureCard: {
    width: '48.5%',
    borderRadius: 22,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  featureCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#25243A',
    letterSpacing: -0.2,
  },
  featureIconSquircle: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4863',
    lineHeight: 16,
    marginVertical: 10,
  },
  featureCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureCheckText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#25243A',
  },

  // 7. Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E1EC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#25243A',
    marginBottom: 16,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F2F8',
  },
  sheetOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#25243A',
    marginLeft: 12,
  },
});
