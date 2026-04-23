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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuProvider } from './context/MenuContext';
import { InvoiceProvider } from './context/InvoiceContext';
import CreateInvoiceScreen from './screens/CreateInvoice';
import ManageMenuScreen from './screens/ManageMenu';
import HistoryScreen from './screens/HistoryScreen';
import InvoicePreviewScreen from './screens/InvoicePreview';

const APP_PIN = '7977';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PARTICLES = [
  { id: 'p1', size: 16, left: '8%', top: '14%', color: 'rgba(52, 152, 219, 0.24)', x: 28, y: 42, duration: 6200 },
  { id: 'p2', size: 12, left: '18%', top: '70%', color: 'rgba(39, 174, 96, 0.2)', x: -20, y: -36, duration: 5400 },
  { id: 'p3', size: 22, left: '82%', top: '22%', color: 'rgba(241, 196, 15, 0.17)', x: -26, y: 44, duration: 6800 },
  { id: 'p4', size: 10, left: '74%', top: '62%', color: 'rgba(52, 152, 219, 0.16)', x: 18, y: -30, duration: 5000 },
  { id: 'p5', size: 18, left: '26%', top: '36%', color: 'rgba(46, 204, 113, 0.16)', x: 24, y: -24, duration: 7200 },
  { id: 'p6', size: 14, left: '90%', top: '78%', color: 'rgba(243, 156, 18, 0.18)', x: -22, y: -40, duration: 6400 },
  { id: 'p7', size: 24, left: '6%', top: '46%', color: 'rgba(155, 89, 182, 0.12)', x: 26, y: 24, duration: 7600 },
  { id: 'p8', size: 12, left: '56%', top: '18%', color: 'rgba(39, 174, 96, 0.17)', x: -16, y: 34, duration: 5800 },
  { id: 'p9', size: 20, left: '60%', top: '82%', color: 'rgba(52, 152, 219, 0.18)', x: 20, y: -34, duration: 7000 },
  { id: 'p10', size: 8, left: '42%', top: '60%', color: 'rgba(241, 196, 15, 0.2)', x: -12, y: 20, duration: 4600 },
];

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

function InvoiceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateInvoiceMain" component={CreateInvoiceScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
    </Stack.Navigator>
  );
}

function MainApp() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'ellipse';

            if (route.name === 'New Bill') {
              iconName = focused ? 'receipt' : 'receipt-outline';
            } else if (route.name === 'My Menu') {
              iconName = focused ? 'restaurant' : 'restaurant-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'time' : 'time-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3498db',
          tabBarInactiveTintColor: 'gray',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: 'bold', color: '#2c3e50' },
          tabBarStyle: { height: 60, paddingBottom: 10 },
        })}
      >
        <Tab.Screen
          name="New Bill"
          component={InvoiceStack}
          options={{ title: 'Create Invoice', headerShown: false }}
        />
        <Tab.Screen
          name="My Menu"
          component={ManageMenuScreen}
          options={{ title: 'Manage Menu' }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Past Bills' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AnimatedBackground() {
  const particleAnimations = useRef(
    PARTICLES.map(() => ({
      drift: new Animated.Value(0),
      pulse: new Animated.Value(0),
    }))
  ).current;

  const orbOne = useRef(new Animated.Value(0)).current;
  const orbTwo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const particleLoops = particleAnimations.map((animation, index) => {
      const driftLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animation.drift, {
            toValue: 1,
            duration: PARTICLES[index].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animation.drift, {
            toValue: 0,
            duration: PARTICLES[index].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animation.pulse, {
            toValue: 1,
            duration: 1700 + index * 110,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animation.pulse, {
            toValue: 0,
            duration: 1700 + index * 110,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      driftLoop.start();
      pulseLoop.start();

      return { driftLoop, pulseLoop };
    });

    const orbOneLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbOne, {
          toValue: 1,
          duration: 6800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbOne, {
          toValue: 0,
          duration: 6800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const orbTwoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbTwo, {
          toValue: 1,
          duration: 7600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbTwo, {
          toValue: 0,
          duration: 7600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    orbOneLoop.start();
    orbTwoLoop.start();

    return () => {
      particleLoops.forEach(({ driftLoop, pulseLoop }) => {
        driftLoop.stop();
        pulseLoop.stop();
      });
      orbOneLoop.stop();
      orbTwoLoop.stop();
    };
  }, [orbOne, orbTwo, particleAnimations]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.glowOrb,
          styles.glowOrbLeft,
          {
            transform: [
              {
                translateY: orbOne.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 28],
                }),
              },
              {
                translateX: orbOne.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -18],
                }),
              },
              {
                scale: orbOne.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.15],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb,
          styles.glowOrbRight,
          {
            transform: [
              {
                translateY: orbTwo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -24],
                }),
              },
              {
                translateX: orbTwo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 16],
                }),
              },
              {
                scale: orbTwo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.12],
                }),
              },
            ],
          },
        ]}
      />

      {PARTICLES.map((particle, index) => {
        const drift = particleAnimations[index].drift;
        const pulse = particleAnimations[index].pulse;

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                left: particle.left,
                top: particle.top,
                backgroundColor: particle.color,
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 0.95],
                }),
                transform: [
                  {
                    translateX: drift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, particle.x],
                    }),
                  },
                  {
                    translateY: drift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, particle.y],
                    }),
                  },
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function PinKey({ label, accent, hidden, onPress }) {
  const press = useRef(new Animated.Value(0)).current;

  if (hidden) {
    return <View style={styles.keyTouch} />;
  }

  const handlePressIn = () => {
    Animated.timing(press, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(press, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.keyTouch}
    >
      <Animated.View
        style={[
          styles.keyShell,
          accent && styles.keyShellAccent,
          {
            transform: [
              {
                scale: press.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.94],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.keyGlow,
            accent && styles.keyGlowAccent,
            {
              opacity: press.interpolate({
                inputRange: [0, 1],
                outputRange: [0.18, 0.52],
              }),
              transform: [
                {
                  scale: press.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1.08],
                  }),
                },
              ],
            },
          ]}
        />
        <LinearGradient
          colors={
            accent
              ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.04)']
              : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']
          }
          style={styles.keyFace}
        >
          <Text style={[styles.keyLabel, accent && styles.keyLabelAccent]}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

function LandingGate({ onUnlock }) {
  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState('');

  const closePinPad = () => {
    setPin('');
    setPinModalVisible(false);
  };

  const validatePin = (nextPin) => {
    if (nextPin.length < 4) {
      return;
    }

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
      if (current.length >= 4) {
        return current;
      }

      const nextPin = `${current}${value}`;
      validatePin(nextPin);
      return nextPin;
    });
  };

  return (
    <SafeAreaView style={styles.landingContainer}>
      <LinearGradient colors={['#0c1622', '#142536', '#0f1b2b']} style={styles.landingGradient}>
        <AnimatedBackground />

        {!isPinModalVisible ? (
          <View style={styles.heroContent}>
            <View style={styles.logoCircle}>
              <Ionicons name="restaurant" size={42} color="#ffffff" />
            </View>
            <Text style={styles.heroTitle}>SM Catering</Text>
            <Text style={styles.heroSubtitle}>
              Billing made simple for everyday catering work.
            </Text>

            <TouchableOpacity
              style={styles.launchButton}
              activeOpacity={0.9}
              onPress={() => setPinModalVisible(true)}
            >
              <LinearGradient colors={['rgba(46, 204, 113, 0.95)', 'rgba(39, 174, 96, 0.95)']} style={styles.launchGradient}>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.launchButtonText}> Open App</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}
      </LinearGradient>

      <Modal visible={isPinModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pinPadContent}>
            <Text style={styles.modalTitle}>Enter PIN</Text>
            <Text style={styles.modalSubtitle}>Tap the glowing keys to unlock SM Catering.</Text>

            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.pinDot,
                    index < pin.length && styles.pinDotFilled,
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
              <Text style={styles.closePadButtonText}>Close</Text>
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
    <MenuProvider>
      <InvoiceProvider>
        {isUnlocked ? <MainApp /> : <LandingGate onUnlock={() => setIsUnlocked(true)} />}
      </InvoiceProvider>
    </MenuProvider>
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
});
