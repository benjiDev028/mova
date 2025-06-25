import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const StatsScreen = () => {
  const data = [
    {
      name: "Québec-Montréal",
      population: 45,
      color: "#3498db",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Montréal-Ottawa",
      population: 30,
      color: "#2ecc71",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Ottawa-Toronto",
      population: 75,
      color: "#e74c3c",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Statistiques du mois</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Trajets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>32</Text>
            <Text style={styles.statLabel}>Passagers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
        </View>
        
        <View style={styles.chartContainer}>
          <PieChart
            data={data}
            width={300}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        
        <View style={styles.earnings}>
          <Text style={styles.earningsLabel}>Revenu total:</Text>
          <Text style={styles.earningsValue}>150$</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    color: '#7f8c8d',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  earnings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  earningsLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
});

export default StatsScreen;