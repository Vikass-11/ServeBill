import React, { useContext } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InvoiceContext } from '../context/InvoiceContext';

export default function ViewInvoicesScreen() {
  const { invoices } = useContext(InvoiceContext);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Invoice History</Text>

      {invoices.length === 0 ? (
        <Text style={styles.emptyText}>No invoices saved yet.</Text>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const dayCount = item.events?.length || 0;

            return (
              <View style={styles.invoiceCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.clientName}>{item.clientName}</Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.itemsCount}>{dayCount} day(s)</Text>
                  <Text style={styles.total}>Rs. {item.grandTotal}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 20 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 40,
    fontSize: 16,
  },
  invoiceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  date: { color: '#7f8c8d' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 10,
  },
  itemsCount: { color: '#95a5a6' },
  total: { fontSize: 16, fontWeight: 'bold', color: '#27ae60' },
});
