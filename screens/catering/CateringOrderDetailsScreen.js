import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InvoiceContext } from '../../context/InvoiceContext';

export default function CateringOrderDetailsScreen({ route, navigation }) {
  const { invoiceId } = route.params;
  const { invoices, updateInvoice } = useContext(InvoiceContext);
  
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  if (!invoice) return <Text>Order not found</Text>;

  const revenue = parseFloat(invoice.grandTotal || invoice.total || 0);
  const received = parseFloat(invoice.amountReceived || 0);
  const pending = Math.max(0, revenue - received);
  
  let totalExpenses = 0;
  if (invoice.expenses) {
    invoice.expenses.forEach(e => totalExpenses += parseFloat(e.amount || 0));
  }
  const profit = revenue - totalExpenses;

  const handleAddPayment = () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid', 'Enter a valid payment amount.');
      return;
    }
    const newReceived = received + amt;
    updateInvoice(invoice.id, { amountReceived: newReceived });
    setPaymentAmount('');
    setPaymentModalVisible(false);
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expenseAmount);
    if (!amt || amt <= 0 || !expenseCategory.trim()) {
      Alert.alert('Invalid', 'Enter valid expense category and amount.');
      return;
    }
    const newExpense = {
      id: Date.now().toString(),
      category: expenseCategory,
      amount: amt,
      notes: ''
    };
    const updatedExpenses = [...(invoice.expenses || []), newExpense];
    updateInvoice(invoice.id, { expenses: updatedExpenses });
    setExpenseCategory('');
    setExpenseAmount('');
    setExpenseModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>Order <Text style={{ color: '#a855f7' }}>Details</Text></Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Customer & Order Basic Info */}
        <View style={styles.card}>
          <Text style={styles.customerName}>{invoice.customerName}</Text>
          <Text style={styles.orderDate}>{new Date(invoice.date).toLocaleDateString('en-GB')}</Text>
        </View>

        {/* Financial Summary */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={[styles.summaryValue, { color: '#111' }]}>₹{revenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>₹{totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.profitRow]}>
            <Text style={styles.summaryLabelBold}>Order Profit</Text>
            <Text style={[styles.summaryValueBold, { color: '#4ade80' }]}>₹{profit.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payments Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <TouchableOpacity onPress={() => setPaymentModalVisible(true)} style={styles.addBtn}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Receive</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount Received</Text>
            <Text style={[styles.summaryValue, { color: '#4ade80' }]}>₹{received.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending Payment</Text>
            <Text style={[styles.summaryValue, { color: pending > 0 ? '#c53030' : '#888' }]}>₹{pending.toFixed(2)}</Text>
          </View>
        </View>

        {/* Expenses Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Order Expenses</Text>
          <TouchableOpacity onPress={() => setExpenseModalVisible(true)} style={styles.addBtn}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Expense</Text>
          </TouchableOpacity>
        </View>
        {(!invoice.expenses || invoice.expenses.length === 0) ? (
          <Text style={styles.emptyText}>No expenses logged yet.</Text>
        ) : (
          invoice.expenses.map((exp, idx) => (
            <View key={idx} style={styles.expenseItem}>
              <Text style={styles.expenseCategory}>{exp.category}</Text>
              <Text style={styles.expenseAmount}>₹{exp.amount}</Text>
            </View>
          ))
        )}

      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={isPaymentModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Receive Payment</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Amount (₹)"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddPayment} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Expense Modal */}
      <Modal visible={isExpenseModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Order Expense</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category (e.g. Labour, Transport)"
              value={expenseCategory}
              onChangeText={setExpenseCategory}
            />
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Amount (₹)"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setExpenseModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddExpense} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 20 },
  backBtn: { marginRight: 15 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  customerName: { fontSize: 22, fontWeight: '800', color: '#111' },
  orderDate: { fontSize: 14, color: '#888', marginTop: 4, fontWeight: '500' },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  summaryLabel: { fontSize: 15, color: '#666', fontWeight: '500' },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  profitRow: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 10, paddingTop: 15 },
  summaryLabelBold: { fontSize: 16, fontWeight: '800', color: '#111' },
  summaryValueBold: { fontSize: 20, fontWeight: '800' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  addBtn: { backgroundColor: '#111', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 4 },

  expenseItem: { 
    backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', 
    padding: 16, borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 5, elevation: 1
  },
  expenseCategory: { fontSize: 15, fontWeight: '600', color: '#111' },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  emptyText: { color: '#888', fontStyle: 'italic', marginBottom: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#888', fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: '#111', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' }
});
