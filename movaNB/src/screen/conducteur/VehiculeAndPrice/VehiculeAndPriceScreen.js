
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const VehicleAndPriceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    departure,
    arrival,
    date,
    stops,
    pickupLocation,
    dropoffLocation,
    routeOption,
  } = route.params;

  const [vehicle, setVehicle] = useState('');
  const [seats, setSeats] = useState('');
  const [stopPrices, setStopPrices] = useState(stops.map(stop => ({
    location: stop.location,
    price: stop.price || '',
  })));

  const handlePriceChange = (index, value) => {
    const updated = [...stopPrices];
    updated[index].price = value;
    setStopPrices(updated);
  };

  const handleNext = () => {
    navigation.navigate('PreferencesScreen', {
      departure,
      arrival,
      date,
      pickupLocation,
      dropoffLocation,
      routeOption,
      vehicle,
      seats,
      stops: stopPrices,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Véhicule & Prix</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du véhicule (ex: Toyota Corolla)"
        value={vehicle}
        onChangeText={setVehicle}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre de places disponibles"
        value={seats}
        onChangeText={setSeats}
        keyboardType="numeric"
      />

      {stopPrices.length > 0 && (
        <View style={styles.stopsSection}>
          <Text style={styles.sectionTitle}>Prix par arrêt</Text>
          <FlatList
            data={stopPrices}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.stopRow}>
                <Text style={styles.stopLabel}>{item.location}</Text>
                <TextInput
                  style={styles.stopInput}
                  placeholder="Prix"
                  value={item.price}
                  onChangeText={(value) => handlePriceChange(index, value)}
                  keyboardType="numeric"
                />
              </View>
            )}
          />
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default VehicleAndPriceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf0',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  stopsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 10,
  },
  stopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stopLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  stopInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#003366',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
