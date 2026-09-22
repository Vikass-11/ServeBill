import React, { useContext, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomerContext } from '../context/CustomerContext';
import { ThemeContext } from '../context/ThemeContext';

export default function PremiumCustomersScreen() {
  const { customers, addCustomer, deleteCustomer } = useContext(CustomerContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleSaveCustomer = () => {
    if (!newName.trim()) {
      Alert.alert('Missing Name', 'Please provide a customer name.');
      return;
    }

    const newCustomer = {
      id: Date.now().toString(),
      name: newName,
      phone: newPhone || 'N/A',
      address: newAddress || 'N/A',
    };

    addCustomer(newCustomer);

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setAddModalVisible(false);
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Remove Customer',
      'Are you sure you want to remove this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomer(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.mainTitle}>
            Manage <Text style={{ color: theme.textMuted }}>Clients.</Text>
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.addCustomerCard}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.addCustomerContent}>
            <Ionicons name="person-add" size={24} color={theme.primary} style={{ marginBottom: 10 }} />
            <Text style={styles.addCustomerTitle}>Add New Client</Text>
            <Text style={styles.addCustomerSub}>Save details for faster billing</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Client Roster</Text>
          
          {customers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No clients saved yet.</Text>
            </View>
          ) : (
            customers.map(c => (
              <View key={c.id} style={styles.customerCard}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  <View style={styles.customerDetailRow}>
                    <Ionicons name="call-outline" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.customerDetailText}>{c.phone}</Text>
                  </View>
                  <View style={styles.customerDetailRow}>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.customerDetailText} numberOfLines={2}>{c.address}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => confirmDelete(c.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* ADD CUSTOMER MODAL */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Client</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#ccc" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name / Company</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Acme Corp"
                  placeholderTextColor={theme.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. +1 555-0199"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  value={newPhone}
                  onChangeText={setNewPhone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Billing Address</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Full Address"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  value={newAddress}
                  onChangeText={setNewAddress}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCustomer}>
                <Text style={styles.saveBtnText}>Save Client</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  
  scrollContent: { paddingBottom: 100, paddingHorizontal: 24 },
  
  addCustomerCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: isDarkMode ? '#2A1A14' : '#FFF0EA',
    borderStyle: 'dashed',
    marginBottom: 30,
  },
  addCustomerContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  addCustomerSub: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
  
  listSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 15 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: theme.textSecondary, marginTop: 10, fontSize: 15 },
  
  customerCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 17, fontWeight: '700', color: theme.text, marginBottom: 8 },
  customerDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  customerDetailText: { fontSize: 13, color: theme.textSecondary, flexShrink: 1 },
  
  deleteBtn: { padding: 10, marginLeft: 10, backgroundColor: isDarkMode ? '#2A1A14' : '#FFF0EA', borderRadius: 12 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: theme.text },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: theme.inputBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  
  saveBtn: {
    backgroundColor: theme.text,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveBtnText: { color: theme.background, fontSize: 16, fontWeight: '700' },
});
