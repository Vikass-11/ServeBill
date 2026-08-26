import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
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
import { MenuProvider } from './context/MenuContext';
import { InvoiceProvider } from './context/InvoiceContext';
import InvoicePreviewScreen from './screens/InvoicePreview';
import PremiumProfileScreen from './screens/PremiumProfileScreen';
import PremiumCreateInvoiceScreen from './screens/PremiumCreateInvoice';
import PremiumManageMenuScreen from './screens/PremiumManageMenu';
import PremiumHistoryScreen from './screens/PremiumHistoryScreen';

const APP_PIN = '7977';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();



const KEYPAD_ROWS = [
  [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
  ],
  [
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
  ],
  [
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
  ],
  [
    { label: '', value: 'empty', hidden: true },
    { label: '0', value: '0' },
    { label: '⌫', value: 'backspace', accent: true },
  ],
];



function PremiumInvoiceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PremiumCreateInvoiceMain" component={PremiumCreateInvoiceScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
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
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Orders') iconName = 'pricetag';
          else if (route.name === 'Cart') iconName = 'cart';
          else if (route.name === 'Profile') iconName = 'person';

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
        <Tab.Screen name="Home" component={PremiumManageMenuScreen} />
        <Tab.Screen name="Orders" component={PremiumHistoryScreen} />
        <Tab.Screen name="Cart" component={PremiumInvoiceStack} />
        <Tab.Screen name="Profile">
          {(props) => <PremiumProfileScreen {...props} onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
// ----------------------------------------

function PremiumLandingGate({ onUnlock }) {
  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState('');

  const closePinPad = () => {
    setPin('');
    setPinModalVisible(false);
  };

  const validatePin = (nextPin) => {
    if (nextPin.length < 4) return;
    if (nextPin === APP_PIN) {
      setPin('');
      setPinModalVisible(false);
      onUnlock();
      return;
    }
    setTimeout(() => {
      Alert.alert('Incorrect PIN', 'Please enter the correct 4-digit PIN.');
      setPin('');
    }, 120);
  };

  const handleKeyPress = (value) => {
    if (value === 'backspace') {
      setPin((current) => current.slice(0, -1));
      return;
    }
    setPin((current) => {
      if (current.length >= 4) return current;
      const nextPin = `${current}${value}`;
      validatePin(nextPin);
      return nextPin;
    });
  };

  return (
    <SafeAreaView style={styles.premiumContainer}>
      <LinearGradient colors={['#1a1005', '#000000', '#0a0a0a']} style={styles.premiumGradient}>
        
        <View style={[styles.premiumGlowOrb, styles.premiumGlowOrbTop]} />
        <View style={[styles.premiumGlowOrb, styles.premiumGlowOrbBottom]} />

        {!isPinModalVisible ? (
          <View style={styles.premiumHero}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumIconWrap}>
                <Ionicons name="receipt" size={28} color="#FF7F50" />
              </View>
              <View style={styles.premiumProfile}>
                <Ionicons name="person-circle" size={42} color="#555" />
                <View style={styles.premiumNotificationDot} />
              </View>
            </View>

            <View style={styles.premiumTextWrap}>
              <Text style={styles.premiumGreeting}>Hi, Admin 👋</Text>
              <Text style={styles.premiumTitle}>Smart <Text style={{color: '#FF7F50'}}>Billing!</Text></Text>
              <Text style={styles.premiumTitle}>Smooth Business.</Text>
            </View>

            <View style={styles.premiumGlassCard}>
              <View style={styles.premiumCardHeader}>
                <Text style={styles.premiumCardTitle}>Daily Overview</Text>
                <Ionicons name="trending-up" size={20} color="#FF7F50" />
              </View>
              <View style={styles.premiumStatsRow}>
                <View style={styles.premiumStat}>
                  <Text style={styles.premiumStatValue}>$0.00</Text>
                  <Text style={styles.premiumStatLabel}>Today's Sales</Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStat}>
                  <Text style={styles.premiumStatValue}>0</Text>
                  <Text style={styles.premiumStatLabel}>Invoices</Text>
                </View>
              </View>
            </View>
            
            <View style={{flex: 1}} />

            <TouchableOpacity
              style={styles.premiumUnlockButton}
              activeOpacity={0.8}
              onPress={() => setPinModalVisible(true)}
            >
              <LinearGradient 
                colors={['#FF8C00', '#FF4500']} 
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                style={styles.premiumUnlockGradient}
              >
                <Text style={styles.premiumUnlockText}>Access Workspace</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

          </View>
        ) : null}
      </LinearGradient>

      <Modal visible={isPinModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <View style={styles.pinPadContent}>
            <Text style={styles.modalTitle}>Enter PIN</Text>
            <Text style={styles.modalSubtitle}>Unlock your billing workspace.</Text>

            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.pinDot,
                    index < pin.length && { backgroundColor: '#FF7F50', borderColor: '#FF7F50', shadowColor: '#FF7F50' },
                  ]}
                />
              ))}
            </View>

            <View style={styles.keypadWrap}>
              {KEYPAD_ROWS.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                  {row.map((keyItem) => (
                    <PinKey
                      key={`${rowIndex}-${keyItem.value}`}
                      label={keyItem.label}
                      accent={keyItem.accent}
                      hidden={keyItem.hidden}
                      onPress={() => handleKeyPress(keyItem.value)}
                    />
                  ))}
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.closePadButton} onPress={closePinPad}>
              <Text style={[styles.closePadButtonText, { color: '#FF7F50' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <SafeAreaProvider>
      <MenuProvider>
        <InvoiceProvider>
          {isUnlocked ? <PremiumMainApp onLogout={() => setIsUnlocked(false)} /> : <PremiumLandingGate onUnlock={() => setIsUnlocked(true)} />}
        </InvoiceProvider>
      </MenuProvider>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 10, 18, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pinPadContent: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f9fbff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(228, 237, 247, 0.72)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  pinDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 7,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pinDotFilled: {
    backgroundColor: '#5bc0ff',
    borderColor: 'rgba(160, 225, 255, 0.72)',
    shadowColor: '#5bc0ff',
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  keypadWrap: {
    marginTop: 2,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keyTouch: {
    width: '30%',
    alignItems: 'center',
  },
  keyShell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  keyShellAccent: {
    borderColor: 'rgba(124, 208, 255, 0.25)',
  },
  keyGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  keyGlowAccent: {
    backgroundColor: 'rgba(91, 192, 255, 0.32)',
  },
  keyFace: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyLabel: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  keyLabelAccent: {
    fontSize: 21,
    color: '#eaf7ff',
  },
  closePadButton: {
    marginTop: 4,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  closePadButtonText: {
    color: 'rgba(229, 238, 247, 0.84)',
    fontSize: 15,
    fontWeight: '600',
  },
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
    shadowColor: '#FF7F50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumContainer: { 
    flex: 1, 
    backgroundColor: '#000',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    overflow: 'hidden',
  },
  premiumGradient: { flex: 1 },
  premiumGlowOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  premiumGlowOrbTop: {
    width: 300,
    height: 300,
    top: -50,
    right: -100,
    backgroundColor: '#FF7F50',
    shadowColor: '#FF7F50',
    shadowRadius: 50,
  },
  premiumGlowOrbBottom: {
    width: 250,
    height: 250,
    bottom: -50,
    left: -50,
    backgroundColor: '#FF4500',
    shadowColor: '#FF4500',
    shadowRadius: 50,
  },
  premiumHero: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  premiumIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumProfile: {
    position: 'relative',
  },
  premiumNotificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: '#000',
  },
  premiumTextWrap: {
    marginBottom: 40,
  },
  premiumGreeting: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  premiumGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  premiumCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumCardTitle: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  premiumStatLabel: {
    color: '#888',
    fontSize: 12,
  },
  premiumStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  },
  premiumUnlockButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  premiumUnlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  premiumUnlockText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
});
