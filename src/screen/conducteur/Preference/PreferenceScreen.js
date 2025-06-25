import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

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
    smoker: null, // null = non défini, true = autorisé, false = interdit
    pets: null,
    luggage: true, // Par défaut autorisé
    bikeRack: false,
    skiRack: false,
    ac: false,
    paymentMethod: null, // 'cash', 'card', ou null
  });

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setTriStatePreference = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const setPaymentMethod = (method) => {
    setPreferences((prev) => ({
      ...prev,
      paymentMethod: prev.paymentMethod === method ? null : method,
    }));
  };

  const resetPreferences = () => {
    setPreferences({
      smoker: null,
      pets: null,
      luggage: true,
      bikeRack: false,
      skiRack: false,
      ac: false,
      paymentMethod: null,
    });
  };

  const handleNext = () => {
    navigation.navigate('ReviewAndConfirm', {
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

  const PreferenceCard = ({ title, children }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const ToggleBadge = ({ active, onPress, icon, label }) => (
    <TouchableOpacity
      style={[styles.badge, active && styles.activeBadge]}
      onPress={onPress}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={active ? "#fff" : "#003366"}
      />
      {label && <Text style={[styles.badgeText, active && styles.activeBadgeText]}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#003366" />
          </TouchableOpacity>
          <Text style={styles.title}>Préférences de voyage</Text>
          <TouchableOpacity onPress={resetPreferences}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <PreferenceCard title="Tabac et animaux">
          <View style={styles.badgeRow}>
            <ToggleBadge
              active={preferences.smoker === true}
              onPress={() => setTriStatePreference('smoker', true)}
              icon="smoking-rooms"
            />
            <ToggleBadge
              active={preferences.smoker === false}
              onPress={() => setTriStatePreference('smoker', false)}
              icon="smoke-free"
            />
            <ToggleBadge
              active={preferences.pets === true}
              onPress={() => setTriStatePreference('pets', true)}
              icon="pets"
            />
            <ToggleBadge
              active={preferences.pets === false}
              onPress={() => setTriStatePreference('pets', false)}
              icon="block"
            />
          </View>
          <View style={styles.legendContainer}>
            <Text style={styles.legend}>
              Vert = Autorisé • Gris = Pas de préférence
            </Text>
          </View>
        </PreferenceCard>

        <PreferenceCard title="Confort et équipements">
          <View style={styles.badgeRow}>
            <ToggleBadge
              active={preferences.luggage}
              onPress={() => togglePreference('luggage')}
              icon="luggage"
              label="Bagages"
            />
            <ToggleBadge
              active={preferences.ac}
              onPress={() => togglePreference('ac')}
              icon="ac-unit"
              label="Clim"
            />
          </View>
        </PreferenceCard>

        <PreferenceCard title="Équipements sportifs">
          <View style={styles.badgeRow}>
            <ToggleBadge
              active={preferences.bikeRack}
              onPress={() => togglePreference('bikeRack')}
              icon="directions-bike"
              label="Support vélo"
            />
            <ToggleBadge
              active={preferences.skiRack}
              onPress={() => togglePreference('skiRack')}
              icon="downhill-skiing"
              label="Support ski"
            />
          </View>
        </PreferenceCard>

        <PreferenceCard title="Méthode de paiement préférée">
          <View style={styles.badgeRow}>
            <ToggleBadge
              active={preferences.paymentMethod === 'cash'}
              onPress={() => setPaymentMethod('cash')}
              icon="attach-money"
              label="Espèces"
            />
            <ToggleBadge
              active={preferences.paymentMethod === 'card'}
              onPress={() => setPaymentMethod('card')}
              icon="credit-card"
              label="Carte"
            />
          </View>
        </PreferenceCard>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Résumé de vos préférences</Text>
          <Text style={styles.summaryText}>
            {Object.entries(preferences).filter(([key, value]) => value === true || value === 'cash' || value === 'card').length} préférence(s) sélectionnée(s)
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Continuer</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PreferencesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    flex: 1,
    textAlign: 'center',
  },
  resetText: {
    color: '#FFCC00',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    minWidth: 50,
    justifyContent: 'center',
  },
  activeBadge: {
    backgroundColor: '#003366',
    borderColor: '#FFCC00',
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#003366',
  },
  activeBadgeText: {
    color: '#fff',
  },
  legendContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legend: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFCC00',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#003366',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003366',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
});