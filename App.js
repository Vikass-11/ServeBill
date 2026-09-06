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
import { NavigationContainer } from '@react-navigation/native';
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

// --- NEW PREMIUM MAIN APP (LIGHT THEME) ---
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.floatingTabBarWrapper}>
      <View style={styles.floatingTabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

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

          let iconName = 'ellipse';
          if (route.name === 'Overview') iconName = 'briefcase';
          else if (route.name === 'Shop') iconName = 'storefront';
          else if (route.name === 'Catering') iconName = 'restaurant';
          else if (route.name === 'Menu') iconName = 'fast-food';
          else if (route.name === 'Clients') iconName = 'people';
          else if (route.name === 'Analytics') iconName = 'bar-chart';

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                <Ionicons 
                  name={iconName + (isFocused ? '' : '-outline')} 
                  size={20} 
                  color={isFocused ? '#fff' : '#666'} 
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function PremiumMainApp({ onLogout }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Overview" component={OverallDashboardScreen} />
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
    <SafeAreaView style={styles.premiumContainer}>
      <LinearGradient colors={['#FAF9F6', '#FAF9F6']} style={styles.premiumGradient}>
        
        {/* Dynamic Orbs */}
        <Animated.View style={[styles.premiumGlowOrb, styles.premiumGlowOrbTop, animatedOrb1]} />
        <Animated.View style={[styles.premiumGlowOrb, styles.premiumGlowOrbBottom, animatedOrb2]} />

        <Animated.View style={[styles.premiumHero, animatedHero]}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumIconWrap}>
                <Ionicons name="flash" size={24} color="#FF7F50" />
              </View>
              <View style={styles.premiumProfile}>
                <Ionicons name="person-circle" size={42} color="#111" />
                <View style={styles.premiumNotificationDot} />
              </View>
            </View>

            <View style={styles.premiumTextWrap}>
              <Text style={styles.premiumGreeting}>Hi, Admin 👋</Text>
              
              <Animated.View style={animatedText1}>
                <Text style={styles.premiumTitle}>
                  Smart <Text style={{color: '#FF7F50'}}>Billing.</Text>
                </Text>>
              </Animated.View>
              
              <Animated.View style={animatedText2}>
                <Text style={styles.premiumTitle2}>Smooth Business.</Text>
              </Animated.View>
            </View>

            <Animated.View style={[styles.premiumGlassCard, animatedCard]}>
              <View style={styles.premiumCardHeader}>
                <Text style={styles.premiumCardTitle}>Daily Overview</Text>
                <View style={styles.trendPill}>
                  <Ionicons name="trending-up" size={14} color="#FF7F50" />
                  <Text style={styles.trendText}>Active</Text>
                </View>
              </View>
              <View style={styles.premiumStatsRow}>
                <View style={styles.premiumStat}>
                  <Text style={styles.premiumStatValue}>₹{todaysSales.toFixed(2)}</Text>
                  <Text style={styles.premiumStatLabel}>Today's Revenue</Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStat}>
                  <Text style={styles.premiumStatValue}>{todaysCount}</Text>
                  <Text style={styles.premiumStatLabel}>Invoices Generated</Text>
                </View>
              </View>
            </Animated.View>
            
            <View style={{flex: 1}} />

            <Animated.View style={[animatedBtn, { width: '100%' }]}>
              <TouchableOpacity
                style={styles.premiumUnlockButton}
                activeOpacity={0.9}
                onPress={handleBiometricAuth}
              >
                <LinearGradient 
                  colors={['#111', '#111']} 
                  start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                  style={styles.premiumUnlockGradient}
                >
                  <Text style={styles.premiumUnlockText}>Unlock Workspace</Text>
                  <Ionicons name="lock-open-outline" size={22} color="#fff" />
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
      <BusinessProvider>
        <MenuProvider>
          <InvoiceProvider>
            <CustomerProvider>
              {isUnlocked ? <PremiumMainApp onLogout={() => setIsUnlocked(false)} /> : <PremiumLandingGate onUnlock={() => setIsUnlocked(true)} />}
            </CustomerProvider>
          </InvoiceProvider>
        </MenuProvider>
      </BusinessProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  landingContainer: { flex: 1, backgroundColor: '#0c1622' },
  landingGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOrbLeft: {
    width: 220,
    height: 220,
    left: -60,
    top: 100,
    backgroundColor: 'rgba(73, 168, 255, 0.18)',
  },
  glowOrbRight: {
    width: 260,
    height: 260,
    right: -70,
    bottom: 120,
    backgroundColor: 'rgba(89, 255, 191, 0.12)',
  },
  particle: {
    position: 'absolute',
  },
  heroContent: {
    width: '100%',
    maxWidth: 420,
    paddingVertical: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(52, 152, 219, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    shadowColor: '#46b2ff',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f7fbff',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(233, 243, 255, 0.82)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.22)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  launchButton: { width: '100%', maxWidth: 280, marginTop: 30 },
  launchGradient: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#2ecc71',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  launchButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  floatingTabBarWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTabBar: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#FF7F50', // Orange active circle
    borderRadius: 22,
    shadowColor: '#FF7F50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumContainer: { 
    flex: 1, 
    backgroundColor: '#FAF9F6', // Light mode
    height: Platform.OS === 'web' ? '100vh' : '100%',
    overflow: 'hidden',
  },
  premiumGradient: { flex: 1 },
  premiumGlowOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.6,
  },
  premiumGlowOrbTop: {
    width: 350,
    height: 350,
    top: -100,
    right: -100,
    backgroundColor: 'rgba(255, 127, 80, 0.15)', // Light orange orb
    shadowColor: '#FF7F50',
    shadowRadius: 60,
  },
  premiumGlowOrbBottom: {
    width: 350,
    height: 350,
    bottom: -80,
    left: -120,
    backgroundColor: 'rgba(255, 240, 234, 0.8)', // Peach orb
    shadowColor: '#FFF0EA',
    shadowRadius: 60,
  },
  premiumHero: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 40,
    zIndex: 10,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 50,
  },
  premiumIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF0EA',
    borderWidth: 1,
    borderColor: '#FEE0D2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7F50',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  premiumProfile: {
    position: 'relative',
  },
  premiumNotificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: '#FAF9F6',
  },
  premiumTextWrap: {
    marginBottom: 45,
  },
  premiumGreeting: {
    color: '#888',
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  premiumTitle: {
    color: '#111',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 52,
  },
  premiumTitle2: {
    color: '#111',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 48,
  },
  premiumGlassCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 8,
  },
  premiumCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumCardTitle: {
    color: '#888',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    color: '#FF7F50',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
    color: '#111',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  premiumStatLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  premiumStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#eee',
    marginHorizontal: 24,
  },
  premiumUnlockButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  premiumUnlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  premiumUnlockText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 12,
    letterSpacing: 0.5,
  },
});
