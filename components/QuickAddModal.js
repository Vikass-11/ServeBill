import React, { useContext } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function QuickAddModal({ visible, onClose, navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);

  if (!visible) return null;

  const actions = [
    {
      id: 'new_bill',
      title: 'New Catering Bill',
      subtitle: 'Breakfast, Lunch & Dinner sessions',
      icon: 'receipt',
      bg: theme.pastelLavender || '#E9DFFF',
      textColor: theme.pastelLavenderDark || '#5E4B8B',
      onPress: () => {
        onClose();
        navigation.navigate('Catering', {
          screen: 'CreateCateringOrder',
          params: { editInvoice: null, newBill: true, timestamp: Date.now() },
        });
      },
    },
    {
      id: 'new_store',
      title: 'Add Grocery Store',
      subtitle: 'Track wholesale & market shops',
      icon: 'storefront',
      bg: theme.pastelBlue || '#DCEBFF',
      textColor: theme.pastelBlueDark || '#2C5A96',
      onPress: () => {
        onClose();
        navigation.navigate('Stores', {
          screen: 'StoreDirectory',
          params: { autoOpenAddStore: true },
        });
      },
    },
    {
      id: 'price_compare',
      title: 'Compare Store Prices',
      subtitle: 'Find cheapest shop for grocery items',
      icon: 'pricetags',
      bg: theme.pastelYellow || '#FFF0BD',
      textColor: theme.pastelYellowDark || '#7A6216',
      onPress: () => {
        onClose();
        navigation.navigate('Stores', {
          screen: 'StorePriceCompare',
        });
      },
    },
    {
      id: 'new_client',
      title: 'Add New Client',
      subtitle: 'Save customer contact & event notes',
      icon: 'person-add',
      bg: theme.pastelMint || '#D8F3E5',
      textColor: theme.pastelMintDark || '#1E6E4E',
      onPress: () => {
        onClose();
        navigation.navigate('Clients', {
          params: { autoOpenAddClient: true },
        });
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: isDarkMode ? '#1E1C2B' : '#FFFFFF' }]}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={[styles.title, { color: theme.text }]}>Quick Actions</Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    What would you like to create?
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Action Cards */}
              <View style={styles.grid}>
                {actions.map((act) => (
                  <TouchableOpacity
                    key={act.id}
                    style={[styles.card, { backgroundColor: act.bg }]}
                    activeOpacity={0.85}
                    onPress={act.onPress}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.65)' }]}>
                      <Ionicons name={act.icon} size={22} color={act.textColor} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.cardTitle, { color: act.textColor }]}>{act.title}</Text>
                      <Text style={[styles.cardSub, { color: act.textColor, opacity: 0.85 }]}>
                        {act.subtitle}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={act.textColor} style={{ opacity: 0.6 }} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 14, 23, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
});

