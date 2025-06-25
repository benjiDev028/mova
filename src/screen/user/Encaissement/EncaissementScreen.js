import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const EncaissementScreen = () => {
  const payments = [
    { id: '1', date: '24 juin 2024', amount: 45, method: 'Carte', status: 'Payé' },
    { id: '2', date: '20 juin 2024', amount: 60, method: 'Espèces', status: 'Payé' },
    { id: '3', date: '15 juin 2024', amount: 30, method: 'Carte', status: 'Payé' },
    { id: '4', date: '10 juin 2024', amount: 75, method: 'Carte', status: 'Payé' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total ce mois</Text>
          <Text style={styles.summaryValue}>210$</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>À transférer</Text>
          <Text style={styles.summaryValue}>210$</Text>
        </View>
      </View>
      
      <FlatList
        data={payments}
        renderItem={({ item }) => (
          <View style={styles.paymentItem}>
            <View style={styles.paymentLeft}>
              <Text style={styles.paymentDate}>{item.date}</Text>
              <Text style={styles.paymentMethod}>{item.method}</Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{item.amount}$</Text>
              <Text style={styles.paymentStatus}>{item.status}</Text>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#7f8c8d',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  listContent: {
    padding: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentDate: {
    fontWeight: '600',
    marginBottom: 5,
  },
  paymentMethod: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#27ae60',
  },
  paymentStatus: {
    color: '#27ae60',
    fontSize: 14,
  },
});

export default EncaissementScreen;