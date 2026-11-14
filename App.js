import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing, withSpring } from 'react-native-reanimated';
import { MenuProvider } from './context/MenuContext';
import { InvoiceProvider, InvoiceContext } from './context/InvoiceContext';
import InvoicePreviewScreen from './screens/InvoicePreview';
import PremiumAnalyticsScreen from './screens/PremiumAnalyticsScreen';
import PremiumCreateInvoiceScreen from './screens/PremiumCreateInvoice';
import PremiumManageMenuScreen from './screens/PremiumManageMenu';
import PremiumHistoryScreen from './screens/PremiumHistoryScreen';
import PremiumCustomersScreen from './screens/PremiumCustomersScreen';
import PremiumProfileScreen from './screens/PremiumProfileScreen';
import { CustomerProvider } from './context/CustomerContext';
import { BusinessProvider } from './context/BusinessContext';
import OverallDashboardScreen from './screens/OverallDashboardScreen';
import ShopDashboardScreen from './screens/shop/ShopDashboardScreen';
import AddShopSaleScreen from './screens/shop/AddShopSaleScreen';
import AddShopExpenseScreen from './screens/shop/AddShopExpenseScreen';
import CateringDashboardScreen from './screens/catering/CateringDashboardScreen';
import CateringOrderDetailsScreen from './screens/catering/CateringOrderDetailsScreen';
import * as LocalAuthentication from 'expo-local-authentication';
import AnalyticsScreen from './screens/AnalyticsScreen';
import { StoreProvider } from './context/StoreContext';
import StoreDirectoryScreen from './screens/stores/StoreDirectoryScreen';
import StoreDetailScreen from './screens/stores/StoreDetailScreen';
import StorePriceCompareScreen from './screens/stores/StorePriceCompareScreen';
import { parseSafeDate, isSameDay } from './services/dateUtils';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function OverviewStack({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OverallDashboard" component={OverallDashboardScreen} />
      <Stack.Screen name="PremiumAnalytics" component={PremiumAnalyticsScreen} />
      <Stack.Screen name="CreateCateringOrder" component={PremiumCreateInvoiceScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
      <Stack.Screen name="CateringOrderDetails" component={CateringOrderDetailsScreen} />
      <Stack.Screen name="StorePriceCompare" component={StorePriceCompareScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="StoreDirectory" component={StoreDirectoryScreen} />
      <Stack.Screen name="PremiumProfile">
        {props => <PremiumProfileScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function BillsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BillsList" component={PremiumHistoryScreen} />
      <Stack.Screen name="CateringOrders" component={PremiumHistoryScreen} />
      <Stack.Screen name="CateringOrderDetails" component={CateringOrderDetailsScreen} />
      <Stack.Screen name="CreateCateringOrder" component={PremiumCreateInvoiceScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
    </Stack.Navigator>
  );
}

function StoresStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StoreDirectory" component={StoreDirectoryScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="StorePriceCompare" component={StorePriceCompareScreen} />
    </Stack.Navigator>
  );
}

function CateringStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CateringDashboard" component={CateringDashboardScreen} />
      <Stack.Screen name="CateringOrders" component={PremiumHistoryScreen} />
      <Stack.Screen name="CateringOrderDetails" component={CateringOrderDetailsScreen} />
      <Stack.Screen name="CreateCateringOrder" component={PremiumCreateInvoiceScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
      <Stack.Screen name="StoreDirectory" component={StoreDirectoryScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="StorePriceCompare" component={StorePriceCompareScreen} />
    </Stack.Navigator>
  );
}

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShopDashboard" component={ShopDashboardScreen} />
      <Stack.Screen name="AddShopSale" component={AddShopSaleScreen} />
      <Stack.Screen name="AddShopExpense" component={AddShopExpenseScreen} />
      <Stack.Screen name="StoreDirectory" component={StoreDirectoryScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
}

// --- REFERENCE-INSPIRED 5-MODULE CATERING PRO TAB BAR ---
const TAB_CONFIG = {
  Overview: { label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  Bills: { label: 'Bills', activeIcon: 'bar-chart', inactiveIcon: 'bar-chart-outline' },
  Stores: { label: 'Stores', activeIcon: 'storefront', inactiveIcon: 'storefront-outline' },
  Menu: { label: 'Menu', activeIcon: 'restaurant', inactiveIcon: 'restaurant-outline' },
  Clients: { label: 'Clients', activeIcon: 'person', inactiveIcon: 'person-outline' },
};

const SUB_SCREENS_WITHOUT_TABBAR = [
  'CreateCateringOrder',
  'InvoicePreview',
  'CateringOrderDetails',
  'StoreDetail',
  'StorePriceCompare',
  'PremiumProfile',
  'PremiumAnalytics',
  'AddShopSale',
  'AddShopExpense',
];

function CustomTabBar({ state, descriptors, navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

  // Auto-hide floating tab bar on full-screen sub-flows to avoid overlapping action buttons
  const currentRoute = state.routes[state.index];
  const focusedChildName = getFocusedRouteNameFromRoute(currentRoute);

  if (focusedChildName && SUB_SCREENS_WITHOUT_TABBAR.includes(focusedChildName)) {
    return null;
  }

  return (
    <View style={styles.floatingTabBarWrapper} pointerEvents="box-none">
      <View style={styles.floatingTabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            label: route.name,
            activeIcon: 'ellipse',
            inactiveIcon: 'ellipse-outline',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.75}
              style={styles.tabItem}
            >
              {isFocused ? (
                <View style={styles.tabActiveSquircle}>
                  <Ionicons name={config.activeIcon} size={20} color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.tabInactiveContent}>
                  <Ionicons name={config.inactiveIcon} size={22} color={isDarkMode ? '#8A879D' : '#767389'} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function PremiumMainApp({ onLogout }) {
  const { isDarkMode } = useContext(ThemeContext);
  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Overview">
          {props => <OverviewStack {...props} onLogout={onLogout} />}
        </Tab.Screen>
        <Tab.Screen name="Bills" component={BillsStack} />
        <Tab.Screen name="Stores" component={StoresStack} />
        <Tab.Screen name="Menu" component={PremiumManageMenuScreen} />
        <Tab.Screen name="Clients" component={PremiumCustomersScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
// ----------------------------------------

function PremiumLandingGate({ onUnlock }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  const { invoices } = useContext(InvoiceContext);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-IN');
  const todayInvoices = (invoices || []).filter(i => {
    if (i.date === todayStr) return true;
    const d = parseSafeDate(i.date);
    return d ? isSameDay(d, today) : false;
  });
  const todaysSales = todayInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);
  const todaysCount = todayInvoices.length;

  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(30);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(25);
  const gridOpacity = useSharedValue(0);
  const gridY = useSharedValue(20);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    heroOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    heroTranslateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 100 }));

    cardOpacity.value = withDelay(220, withTiming(1, { duration: 600 }));
    cardY.value = withDelay(220, withSpring(0, { damping: 15, stiffness: 100 }));

    gridOpacity.value = withDelay(360, withTiming(1, { duration: 600 }));
    gridY.value = withDelay(360, withSpring(0, { damping: 15, stiffness: 100 }));

    btnScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedHero = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const animatedCard = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const animatedGrid = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
    transform: [{ translateY: gridY.value }],
  }));

  const animatedBtn = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleBiometricAuth = async () => {
    if (Platform.OS === 'web') {
      onUnlock();
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        onUnlock();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Catering Workspace',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onUnlock();
      } else if (result.error !== 'user_cancel') {
        Alert.alert('Authentication Failed', 'Please try again.');
      }
    } catch (err) {
      console.warn('Auth error:', err);
      onUnlock();
    }
  };

  return (
    <SafeAreaView style={styles.gateContainer} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.gateScrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Row matching Main Dashboard */}
        <Animated.View style={[styles.gateHeader, animatedHero]}>
          <View style={styles.gateBrandGroup}>
            <View style={styles.gateBrandSquircle}>
              <Ionicons name="restaurant" size={20} color="#FF6B55" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.gateBrandTitle}>ServeBill</Text>
              <Text style={styles.gateBrandSubtitle}>CATERING PRO</Text>
            </View>
          </View>

          <View style={styles.gateStatusPill}>
            <View style={styles.gateStatusDot} />
            <Text style={styles.gateStatusText}>Secured</Text>
          </View>
        </Animated.View>

        {/* Hero Card matching Screen 1 Coral Card (#FFD5CC) */}
        <Animated.View style={[styles.gateHeroCard, animatedCard]}>
          <View style={styles.gateHeroTopRow}>
            <View style={styles.gateHeroBadge}>
              <Ionicons name="lock-closed" size={13} color="#A14F2B" />
              <Text style={styles.gateHeroBadgeText}>Workspace Protected</Text>
            </View>
            <View style={styles.gateHeroCircleIcon}>
              <Ionicons name="shield-checkmark" size={16} color="#232136" />
            </View>
          </View>

          <Text style={styles.gateHeroHeading}>
            Manage Events.{'\n'}Serve with Ease.
          </Text>
          <Text style={styles.gateHeroSub}>
            Private business ledger, multi-day invoices & store pricing.
          </Text>

          {/* 4 Stats Spread Horizontally matching Screen 1 */}
          <View style={styles.gateStatsSpread}>
            <View style={styles.gateStatCol}>
              <Text style={styles.gateStatLabel}>Today</Text>
              <Text style={styles.gateStatValue}>
                ₹{(todaysSales / 1000).toFixed(1)}k
              </Text>
            </View>
            <View style={styles.gateStatCol}>
              <Text style={styles.gateStatLabel}>Orders</Text>
              <Text style={styles.gateStatValue}>{todaysCount}</Text>
            </View>
            <View style={styles.gateStatCol}>
              <Text style={styles.gateStatLabel}>Storage</Text>
              <Text style={styles.gateStatValue}>Encrypted</Text>
            </View>
            <View style={styles.gateStatCol}>
              <Text style={styles.gateStatLabel}>Mode</Text>
              <Text style={styles.gateStatValue}>Offline</Text>
            </View>
          </View>

          {/* Bottom row: Today's Date pill */}
          <View style={styles.gateHeroBottomRow}>
            <View style={styles.gateDatePill}>
              <Ionicons name="calendar-outline" size={12} color="#4A455A" style={{ marginRight: 4 }} />
              <Text style={styles.gateDatePillText}>
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.gateLiveTag}>● Live Vault</Text>
          </View>
        </Animated.View>

        {/* 2x1 Feature Cards Preview matching Screen 1 & 3 Pastel Theme */}
        <Animated.View style={[styles.gateFeatureRow, animatedGrid]}>
          <View style={[styles.gateFeatureCard, { backgroundColor: '#DCD9FF' }]}>
            <View style={styles.gateFeatureCardTop}>
              <Text style={styles.gateFeatureTitle}>Bills & Vault</Text>
              <View style={styles.gateFeatureIconSquircle}>
                <Ionicons name="receipt" size={14} color="#554E96" />
              </View>
            </View>
            <Text style={styles.gateFeatureSub}>Multi-Day Event Bills & PDF Export</Text>
          </View>

          <View style={[styles.gateFeatureCard, { backgroundColor: '#FFE6D8' }]}>
            <View style={styles.gateFeatureCardTop}>
              <Text style={styles.gateFeatureTitle}>Store Prices</Text>
              <View style={styles.gateFeatureIconSquircle}>
                <Ionicons name="storefront" size={14} color="#A14F2B" />
              </View>
            </View>
            <Text style={styles.gateFeatureSub}>Compare Local Wholesale Rates</Text>
          </View>
        </Animated.View>

        <View style={{ flex: 1, minHeight: 20 }} />

        {/* Unlock Action Button matching the Dark Squircle `#1E1D2E` from reference dock */}
        <Animated.View style={[styles.gateBtnWrap, animatedBtn]}>
          <TouchableOpacity
            style={styles.gateUnlockButton}
            activeOpacity={0.88}
            onPress={handleBiometricAuth}
          >
            <View style={styles.gateUnlockIconCircle}>
              <Ionicons name="finger-print" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.gateUnlockButtonText}>Unlock Workspace</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.gateSecurityCaption}>
            Biometric authentication or device passcode
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BusinessProvider>
          <MenuProvider>
            <InvoiceProvider>
              <CustomerProvider>
                <StoreProvider>
                  {isUnlocked ? <PremiumMainApp onLogout={() => setIsUnlocked(false)} /> : <PremiumLandingGate onUnlock={() => setIsUnlocked(true)} />}
                </StoreProvider>
              </CustomerProvider>
            </InvoiceProvider>
          </MenuProvider>
        </BusinessProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  floatingTabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  floatingTabBar: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#1E1D2E' : '#FFFFFF',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2E2D42' : 'rgba(0,0,0,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 380,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDarkMode ? 0.35 : 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActiveSquircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: isDarkMode ? '#FF7E69' : '#1E1D2E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: isDarkMode ? '#FF7E69' : '#1E1D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tabInactiveContent: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Premium Landing Gate (Reference Pastel Style)
  gateContainer: {
    flex: 1,
    backgroundColor: isDarkMode ? '#13111C' : '#F8F7FC',
  },
  gateScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  gateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 10 : 4,
  },
  gateBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gateBrandSquircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: isDarkMode ? '#2A283E' : '#FFE6D8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  gateBrandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.3,
  },
  gateBrandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: 1,
    marginTop: 1,
  },
  gateStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E1D2E' : '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2E2D42' : 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  gateStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  gateStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDarkMode ? '#C5C3D4' : '#5E5B72',
  },

  // Hero Card (#FFD5CC)
  gateHeroCard: {
    backgroundColor: isDarkMode ? '#2D222A' : '#FFD5CC',
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#FF6B55',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.2 : 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  gateHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  gateHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  gateHeroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A3B18',
    marginLeft: 5,
  },
  gateHeroCircleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateHeroHeading: {
    fontSize: 26,
    fontWeight: '900',
    color: '#232136',
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 6,
  },
  gateHeroSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#554E60',
    lineHeight: 18,
    marginBottom: 18,
  },
  gateStatsSpread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  gateStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  gateStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#766F85',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  gateStatValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#232136',
  },
  gateHeroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  gateDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  gateDatePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A455A',
  },
  gateLiveTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },

  // Feature Row
  gateFeatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gateFeatureCard: {
    width: '48.5%',
    borderRadius: 22,
    padding: 16,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  gateFeatureCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gateFeatureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#25243A',
  },
  gateFeatureIconSquircle: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateFeatureSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B4863',
    lineHeight: 15,
    marginTop: 8,
  },

  // Unlock Button
  gateBtnWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  gateUnlockButton: {
    width: '100%',
    height: 58,
    borderRadius: 22,
    backgroundColor: isDarkMode ? '#FF7E69' : '#1E1D2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: isDarkMode ? '#FF7E69' : '#1E1D2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  gateUnlockIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateUnlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  gateSecurityCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? '#8E8BA0' : '#8C899F',
    marginTop: 12,
    textAlign: 'center',
  },
});
