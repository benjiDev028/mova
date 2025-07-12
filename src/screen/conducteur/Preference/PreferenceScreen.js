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
import {styles} from "./styles";

const PreferencesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    departure,
    arrival,
    date,
    time,
    pickupLocation,
    dropoffLocation,
    stops,
  } = route.params;

  const [preferences, setPreferences] = useState({
    smoker: false, // null = non défini, true = autorisé, false = interdit
    pets: false,
    luggage: true, // Par défaut autorisé
    bikeRack: false,
    skiRack: false,
    ac: false,
    paymentMethod: "cash", // 'cash', 'card', ou null
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
      smoker: false,
      pets: false,
      luggage: true,
      bikeRack: false,
      skiRack: false,
      ac: true,
      paymentMethod: 'cash',
    });
  };

  const handleNext = () => {
    navigation.navigate('VehiculeAndPrice', {
      departure,
      arrival,
      date,
      time,
      pickupLocation,
      dropoffLocation,
      stops,
      preferences,
    });
    console.log("preference screen ",{
      departure,
      arrival,
      date,
      time,
      pickupLocation,
      dropoffLocation,
      stops,
      preferences,
    })
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
              label="cash"
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

