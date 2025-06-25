import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import GooglePlacesInputPublicOnly from '../../../composants/googleplacepublic/GooglePlacesInputPublicOnly';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

const PickupLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { departure, arrival, date, stops } = route.params;

  const locationRef = useRef(null);
  const [isValid, setIsValid] = useState(false);

  const handleConfirm = () => {
    if (!locationRef.current) {
      Alert.alert("Erreur", "Veuillez sélectionner un lieu public valide.");
      return;
    }

    navigation.navigate('DropoffLocation', {
      departure,
      arrival,
      date,
      stops,
      pickupLocation: locationRef.current,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lieu de rencontre</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.title}>Lieu de rendez-vous</Text>
      <Text style={styles.subtitle}>Choisissez un point de rencontre public</Text>

      <GooglePlacesInputPublicOnly
        placeholder="Rechercher une station, gare, aéroport, etc."
        onSelect={(location) => {
          locationRef.current = location;
          setIsValid(!!location); // Active ou désactive le bouton suivant
        }}
      />

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggestions :</Text>
        <View style={styles.suggestionButtons}>
          <TouchableOpacity style={styles.suggestionButton}>
            <Ionicons name="train" size={18} color="#003366" />
            <Text style={styles.suggestionText}>Gare la plus proche</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionButton}>
            <Ionicons name="subway" size={18} color="#003366" />
            <Text style={styles.suggestionText}>Station de métro</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, !isValid && styles.disabledButton]} 
        onPress={handleConfirm}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366',
  },
  placeholder: {
    width: 40,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 8,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#003366',
    marginBottom: 12,
  },
  suggestionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  suggestionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  suggestionText: {
    marginLeft: 8,
    color: '#003366',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#FFCC00',
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PickupLocationScreen;
