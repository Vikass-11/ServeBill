import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { InvoiceContext } from '../../context/InvoiceContext';
import { ThemeContext } from '../../context/ThemeContext';

export default function CateringOrderDetailsScreen({ route, navigation }) {
  const { invoiceId } = route.params;
  const { invoices, updateInvoice } = useContext(InvoiceContext);
  const { theme, isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(theme, isDarkMode);
  
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
          <Text style={styles.notFoundText}>Order not found or deleted.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnPill}>
            <Text style={styles.backBtnPillText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const revenue = parseFloat(invoice.grandTotal || invoice.total || 0);
  const received = parseFloat(invoice.amountReceived || 0);
  const pending = Math.max(0, revenue - received);
  
  let totalExpenses = 0;
  if (invoice.expenses) {
    invoice.expenses.forEach(e => totalExpenses += parseFloat(e.amount || 0));
  }
  const profit = revenue - totalExpenses;
  const paymentRatio = revenue > 0 ? Math.min(100, (received / revenue) * 100) : 100;
  const isFullyPaid = received >= revenue && revenue > 0;

  const handleAddPayment = () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid', 'Please enter a valid payment amount.');
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
      Alert.alert('Invalid', 'Please enter valid expense category and amount.');
      return;
    }
    const newExpense = {
      id: Date.now().toString(),
      category: expenseCategory.trim(),
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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.mainTitle}>Order Details</Text>
          <Text style={styles.orderIdText}>Order #{invoice.id ? invoice.id.slice(-6) : 'N/A'}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          isFullyPaid ? styles.statusBadgePaid : styles.statusBadgePending
        ]}>
          <Text style={[
            styles.statusBadgeText,
            isFullyPaid ? { color: theme.success } : { color: '#D97706' }
          ]}>
            {isFullyPaid ? 'Fully Paid' : 'Pending'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* CUSTOMER & EVENT BANNER */}
        <View style={styles.card}>
          <View style={styles.customerTopRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color={theme.accentPurple} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.customerName}>{invoice.clientName || invoice.customerName || 'Direct Client'}</Text>
              <Text style={styles.orderDate}>
                <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} /> {invoice.date}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.viewBillBtn} 
            activeOpacity={0.88}
            onPress={() => navigation.navigate('InvoicePreview', {
              clientName: invoice.clientName || invoice.customerName,
              clientPhone: invoice.clientPhone,
              events: invoice.events,
              subTotal: invoice.subTotal,
              taxAmount: invoice.taxAmount,
              grandTotal: invoice.grandTotal,
              transportCharge: invoice.transportCharge || 0,
              advanceAmount: invoice.advanceAmount || 0,
              extraItems: invoice.extraItems || [],
              isPreviewOnly: true
            })}
          >
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewBillGradient}
            >
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.viewBillBtnText}>View / Export Official Bill</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* FINANCIAL HEALTH BREAKDOWN */}
        <View style={styles.card}>
          <Text style={styles.cardSectionHeader}>ORDER FINANCIALS</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Order Value</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>₹{revenue.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Event Production Expenses</Text>
            <Text style={[styles.summaryValue, { color: theme.error }]}>-₹{totalExpenses.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.profitRow]}>
            <View>
              <Text style={styles.summaryLabelBold}>Net Cleared Margin</Text>
              <Text style={styles.summarySub}>Revenue minus logged costs</Text>
            </View>
            <Text style={[styles.summaryValueBold, { color: theme.success }]}>
              ₹{profit.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* PAYMENT COLLECTION SECTION */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardSectionHeader}>PAYMENT SETTLEMENT</Text>
            <TouchableOpacity onPress={() => setPaymentModalVisible(true)} style={styles.actionPillBtn}>
              <Ionicons name="add" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.actionPillBtnText}>Receive</Text>
            </TouchableOpacity>
          </View>

          {/* Collection Health Bar */}
          <View style={styles.collectionBarContainer}>
            <View style={[styles.collectionBarFill, { width: `${paymentRatio}%` }]} />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount Received</Text>
            <Text style={[styles.summaryValue, { color: theme.success }]}>₹{received.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Balance Receivable</Text>
            <Text style={[styles.summaryValue, { color: pending > 0 ? '#D97706' : theme.textMuted }]}>
              ₹{pending.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* EVENT EXPENSES SECTION */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardSectionHeader}>LOGGED COSTS & PURCHASES</Text>
            <TouchableOpacity onPress={() => setExpenseModalVisible(true)} style={styles.actionPillBtn}>
              <Ionicons name="add" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.actionPillBtnText}>Add Cost</Text>
            </TouchableOpacity>
          </View>

          {(!invoice.expenses || invoice.expenses.length === 0) ? (
            <Text style={styles.emptyText}>No food or labour expenses logged for this order.</Text>
          ) : (
            invoice.expenses.map((exp, idx) => (
              <View key={idx} style={styles.expenseItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.expenseDot} />
                  <Text style={styles.expenseCategory}>{exp.category}</Text>
                </View>
                <Text style={styles.expenseAmount}>₹{parseFloat(exp.amount || 0).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* PAYMENT MODAL */}
      <Modal visible={isPaymentModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Receive Payment</Text>
            <Text style={styles.modalSub}>Balance Due: ₹{pending.toFixed(2)}</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Payment Amount (₹)"
              placeholderTextColor={theme.textMuted}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddPayment} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveBtnText}>Confirm Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXPENSE MODAL */}
      <Modal visible={isExpenseModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Order Cost</Text>
            <Text style={styles.modalSub}>Labour, raw materials, or transport</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Cost Category (e.g. Vegetables, Chef Fee)"
              placeholderTextColor={theme.textMuted}
              value={expenseCategory}
              onChangeText={setExpenseCategory}
            />
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Amount (₹)"
              placeholderTextColor={theme.textMuted}
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setExpenseModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddExpense} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveBtnText}>Save Cost</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 14, 
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: { 
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: theme.text, 
    letterSpacing: -0.4 
  },
  orderIdText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgePaid: {
    backgroundColor: theme.successLight,
  },
  statusBadgePending: {
    backgroundColor: isDarkMode ? '#2D2005' : '#FFFBEB',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 16,
    paddingBottom: 110 
  },
  card: {
    backgroundColor: theme.card, 
    borderRadius: 22, 
    padding: 18, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: isDarkMode ? 0.2 : 0.03, 
    shadowRadius: 10, 
    elevation: 2,
  },
  customerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: isDarkMode ? '#2B1A3A' : '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: theme.text,
    letterSpacing: -0.3,
  },
  orderDate: { 
    fontSize: 12, 
    color: theme.textSecondary, 
    marginTop: 3, 
    fontWeight: '500' 
  },
  viewBillBtn: { 
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  viewBillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  viewBillBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '800',
    fontSize: 14,
  },
  cardSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 8 
  },
  summaryLabel: { 
    fontSize: 13, 
    color: theme.textSecondary, 
    fontWeight: '500' 
  },
  summaryValue: { 
    fontSize: 14, 
    fontWeight: '800' 
  },
  profitRow: { 
    borderTopWidth: 1, 
    borderTopColor: theme.border, 
    marginTop: 8, 
    paddingTop: 12 
  },
  summaryLabelBold: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: theme.text 
  },
  summarySub: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  summaryValueBold: { 
    fontSize: 18, 
    fontWeight: '900' 
  },
  sectionHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  actionPillBtn: { 
    backgroundColor: theme.text, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  actionPillBtnText: { 
    color: theme.background, 
    fontSize: 11, 
    fontWeight: '800' 
  },
  collectionBarContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.inputBackground,
    overflow: 'hidden',
    marginBottom: 12,
  },
  collectionBarFill: {
    height: '100%',
    backgroundColor: theme.success,
  },
  expenseItem: { 
    backgroundColor: theme.inputBackground, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 12, 
    borderRadius: 14, 
    marginBottom: 8,
  },
  expenseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.error,
    marginRight: 8,
  },
  expenseCategory: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: theme.text 
  },
  expenseAmount: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: theme.error 
  },
  emptyText: { 
    color: theme.textMuted, 
    fontSize: 12,
    fontStyle: 'italic', 
    paddingVertical: 10,
    textAlign: 'center',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.55)', 
    justifyContent: 'center', 
    padding: 24 
  },
  modalContent: { 
    backgroundColor: theme.card, 
    borderRadius: 24, 
    padding: 22,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: theme.text, 
    textAlign: 'center' 
  },
  modalSub: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  modalInput: { 
    backgroundColor: theme.inputBackground, 
    color: theme.text, 
    borderRadius: 14, 
    padding: 14, 
    fontSize: 14, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 8 
  },
  cancelBtn: { 
    flex: 1, 
    padding: 14, 
    alignItems: 'center' 
  },
  cancelBtnText: { 
    color: theme.textSecondary, 
    fontWeight: '700' 
  },
  modalSaveBtn: { 
    flex: 1.2, 
    backgroundColor: theme.primary, 
    padding: 14, 
    borderRadius: 14, 
    alignItems: 'center' 
  },
  modalSaveBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '800' 
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textSecondary,
    marginVertical: 14,
  },
  backBtnPill: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  backBtnPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
