import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CateringStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CateringDashboard" component={CateringDashboardScreen} />
      <Stack.Screen name="CateringOrders" component={PremiumHistoryScreen} />
      <Stack.Screen name="CateringOrderDetails" component={CateringOrderDetailsScreen} />
      <Stack.Screen name="CreateCateringOrder" component={PremiumCreateInvoiceScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
    </Stack.Navigator>
  );
}

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShopDashboard" component={ShopDashboardScreen} />
      <Stack.Screen name="AddShopSale" component={AddShopSaleScreen} />
      <Stack.Screen name="AddShopExpense" component={AddShopExpenseScreen} />
    </Stack.Navigator>
  );
}

function OverviewStack({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OverallDashboard" component={OverallDashboardScreen} />
      <Stack.Screen name="PremiumProfile">
        {props => <PremiumProfileScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// --- NEW EXECUTIVE TAB BAR ---
const TAB_CONFIG = {
  Overview: { label: 'Home', activeIcon: 'grid', inactiveIcon: 'grid-outline' },
  Shop: { label: 'Shop', activeIcon: 'storefront', inactiveIcon: 'storefront-outline' },
  Catering: { label: 'Catering', activeIcon: 'restaurant', inactiveIcon: 'restaurant-outline' },
  Menu: { label: 'Menu', activeIcon: 'fast-food', inactiveIcon: 'fast-food-outline' },
  Clients: { label: 'Clients', activeIcon: 'people', inactiveIcon: 'people-outline' },
  Analytics: { label: 'Insights', activeIcon: 'stats-chart', inactiveIcon: 'stats-chart-outline' },
};

function CustomTabBar({ state, descriptors, navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);

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
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <View style={[styles.tabContent, isFocused && styles.tabContentActive]}>
                <Ionicons
                  name={isFocused ? config.activeIcon : config.inactiveIcon}
                  size={19}
                  color={isFocused ? theme.primary : theme.tabBarInactive}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? theme.primary : theme.tabBarInactive },
                    isFocused && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </View>
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
        <Tab.Screen name="Shop" component={ShopStack} />
        <Tab.Screen name="Catering" component={CateringStack} />
        <Tab.Screen name="Menu" component={PremiumManageMenuScreen} />
        <Tab.Screen name="Clients" component={PremiumCustomersScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
// ----------------------------------------

function PremiumLandingGate({ onUnlock }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  const { invoices } = useContext(InvoiceContext);

  const todayStr = new Date().toLocaleDateString('en-IN');
  const todayInvoices = invoices.filter(i => {
    if (i.date === todayStr) return true;
    try { return new Date(i.date).toLocaleDateString('en-IN') === todayStr; } catch { return false; }
  });
  const todaysSales = todayInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);
  const todaysCount = todayInvoices.length;

  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(40);
  
  const text1Opacity = useSharedValue(0);
  const text1Y = useSharedValue(20);
  const text2Opacity = useSharedValue(0);
  const text2Y = useSharedValue(20);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(30);

  const btnScale = useSharedValue(1);

  // Floating Orbs
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);

  useEffect(() => {
    // Entrance Animations
    heroOpacity.value = withDelay(100, withTiming(1, { duration: 800 }));
    heroTranslateY.value = withDelay(100, withSpring(0, { damping: 14, stiffness: 90 }));

    text1Opacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    text1Y.value = withDelay(300, withSpring(0, { damping: 14, stiffness: 90 }));

    text2Opacity.value = withDelay(450, withTiming(1, { duration: 800 }));
    text2Y.value = withDelay(450, withSpring(0, { damping: 14, stiffness: 90 }));

    cardOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    cardY.value = withDelay(600, withSpring(0, { damping: 14, stiffness: 90 }));

    // Button Pulse
    btnScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Floating Orbs
    orb1X.value = withRepeat(withTiming(50, { duration: 6000, easing: Easing.inOut(Easing.ease) }), -1, true);
    orb1Y.value = withRepeat(withTiming(-40, { duration: 5500, easing: Easing.inOut(Easing.ease) }), -1, true);
    
    orb2X.value = withRepeat(withTiming(-60, { duration: 7000, easing: Easing.inOut(Easing.ease) }), -1, true);
    orb2Y.value = withRepeat(withTiming(50, { duration: 6500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animatedHero = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const animatedText1 = useAnimatedStyle(() => ({
    opacity: text1Opacity.value,
    transform: [{ translateY: text1Y.value }],
  }));

  const animatedText2 = useAnimatedStyle(() => ({
    opacity: text2Opacity.value,
    transform: [{ translateY: text2Y.value }],
  }));

  const animatedCard = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const animatedBtn = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const animatedOrb1 = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));

  const animatedOrb2 = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));

  const handleBiometricAuth = async () => {
    if (Platform.OS === 'web') {
      onUnlock();
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert('No Security Setup', 'Please set up a screen lock or fingerprint on your device to use this app securely.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Workspace',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      onUnlock();
    } else if (result.error !== 'user_cancel') {
      Alert.alert('Authentication Failed', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.premiumContainer, { backgroundColor: theme.background }]}>
      <LinearGradient 
        colors={isDarkMode ? ['#090D16', '#141D30', '#090D16'] : ['#F8FAFC', '#FFF4ED', '#F8FAFC']} 
        style={styles.premiumGradient}
      >
        {/* Dynamic Ambient Orbs */}
        <Animated.View style={[styles.premiumGlowOrb, styles.premiumGlowOrbTop, animatedOrb1]} />
        <Animated.View style={[styles.premiumGlowOrb, styles.premiumGlowOrbBottom, animatedOrb2]} />

        <Animated.View style={[styles.premiumHero, animatedHero]}>
          <View style={styles.premiumHeader}>
            <View style={styles.brandBadge}>
              <LinearGradient colors={theme.primaryGradient} style={styles.brandIconCircle}>
                <Ionicons name="flash" size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.brandName}>ServeBill</Text>
                <Text style={styles.brandTag}>BUSINESS SUITE</Text>
              </View>
            </View>

            <View style={styles.securityStatusPill}>
              <View style={styles.securityDot} />
              <Text style={styles.securityStatusText}>Secured</Text>
            </View>
          </View>

          <View style={styles.premiumTextWrap}>
            <Text style={styles.premiumGreeting}>Welcome Back 👋</Text>
            <Animated.View style={animatedText1}>
              <Text style={[styles.premiumTitle, { color: theme.text }]}>
                Smart <Text style={{ color: theme.primary }}>Billing.</Text>
              </Text>
            </Animated.View>
            <Animated.View style={animatedText2}>
              <Text style={[styles.premiumTitle2, { color: theme.text }]}>Smooth Business.</Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.premiumGlassCard, animatedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.premiumCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={styles.premiumCardTitle}>Today's Snapshot</Text>
              </View>
              <View style={styles.trendPill}>
                <View style={styles.liveIndicator} />
                <Text style={styles.trendText}>Live Vault</Text>
              </View>
            </View>

            <View style={styles.premiumStatsRow}>
              <View style={styles.premiumStat}>
                <Text style={[styles.premiumStatValue, { color: theme.text }]}>
                  ₹{todaysSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.premiumStatLabel}>Today's Revenue</Text>
              </View>
              <View style={[styles.premiumStatDivider, { backgroundColor: theme.border }]} />
              <View style={styles.premiumStat}>
                <Text style={[styles.premiumStatValue, { color: theme.text }]}>{todaysCount}</Text>
                <Text style={styles.premiumStatLabel}>Invoices Created</Text>
              </View>
            </View>

            <View style={[styles.cardFooterNotice, { borderTopColor: theme.border }]}>
              <Ionicons name="shield-checkmark-outline" size={14} color={theme.success} />
              <Text style={styles.cardFooterNoticeText}>Offline First • Encrypted Storage</Text>
            </View>
          </Animated.View>

          <View style={{ flex: 1 }} />

          <Animated.View style={[animatedBtn, { width: '100%' }]}>
            <TouchableOpacity
              style={styles.premiumUnlockButton}
              activeOpacity={0.88}
              onPress={handleBiometricAuth}
            >
              <LinearGradient 
                colors={theme.primaryGradient} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }}
                style={styles.premiumUnlockGradient}
              >
                <Ionicons name="finger-print" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.premiumUnlockText}>Unlock Workspace</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      </LinearGradient>
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
                {isUnlocked ? <PremiumMainApp onLogout={() => setIsUnlocked(false)} /> : <PremiumLandingGate onUnlock={() => setIsUnlocked(true)} />}
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
    backgroundColor: theme.tabBar,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 7,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 440,
    justifyContent: 'space-between',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDarkMode ? 0.4 : 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 16,
    minWidth: 50,
  },
  tabContentActive: {
    backgroundColor: theme.primaryLight,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  premiumContainer: { 
    flex: 1, 
    backgroundColor: theme.background,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    overflow: 'hidden',
  },
  premiumGradient: { flex: 1 },
  premiumGlowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  premiumGlowOrbTop: {
    width: 380,
    height: 380,
    top: -120,
    right: -100,
    backgroundColor: isDarkMode ? 'rgba(255, 106, 70, 0.12)' : 'rgba(255, 127, 80, 0.16)',
  },
  premiumGlowOrbBottom: {
    width: 360,
    height: 360,
    bottom: -100,
    left: -100,
    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.10)' : 'rgba(255, 220, 205, 0.55)',
  },
  premiumHero: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 36,
    zIndex: 10,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 44,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 1,
    marginTop: 1,
  },
  securityStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  securityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.success,
    marginRight: 6,
  },
  securityStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  premiumTextWrap: {
    marginBottom: 36,
  },
  premiumGreeting: {
    color: theme.textSecondary,
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  premiumTitle: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 48,
  },
  premiumTitle2: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 44,
  },
  premiumGlassCard: {
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDarkMode ? 0.3 : 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  premiumCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumCardTitle: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginRight: 5,
  },
  trendText: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  premiumStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumStat: {
    flex: 1,
  },
  premiumStatValue: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  premiumStatLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  premiumStatDivider: {
    width: 1,
    height: 44,
    marginHorizontal: 16,
  },
  cardFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  cardFooterNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    marginLeft: 6,
  },
  premiumUnlockButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumUnlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  premiumUnlockText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginRight: 6,
  },
});
