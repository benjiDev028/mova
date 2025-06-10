
import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const PreferencesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    departure,
    arrival,
    date,
    pickupLocation,
    dropoffLocation,
    routeOption,
    vehicle,
    seats,
    stops,
  } = route.params;

  const [preferences, setPreferences] = useState({
    smoker: false,
    pets: false,
    luggage: false,
    bikeRack: false,
    skiRack: false,
  });

  const toggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNext = () => {
    navigation.navigate('ReviewAndConfirmScreen', {
      departure,
      arrival,
      date,
      pickupLocation,
      dropoffLocation,
      routeOption,
      vehicle,
      seats,
      stops,
      preferences,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Préférences</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Fumeur autorisé</Text>
        <Switch
          value={preferences.smoker}
          onValueChange={() => toggle('smoker')}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Animaux autorisés</Text>
        <Switch
          value={preferences.pets}
          onValueChange={() => toggle('pets')}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Bagages autorisés</Text>
        <Switch
          value={preferences.luggage}
          onValueChange={() => toggle('luggage')}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Support vélo</Text>
        <Switch
          value={preferences.bikeRack}
          onValueChange={() => toggle('bikeRack')}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Support ski</Text>
        <Switch
          value={preferences.skiRack}
          onValueChange={() => toggle('skiRack')}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default PreferencesScreen;

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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#003366',
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
