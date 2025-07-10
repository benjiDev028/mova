// PickupLocationScreen.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import GooglePlacesInputPublicOnly from '../../../composants/googleplacepublic/GooglePlacesInputPublicOnly';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from './styles';

const PickupLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { departure, arrival, date, time, stops } = route.params;

  const locationRef = useRef(null);
  const [isValid, setIsValid] = useState(false);

  const handleConfirm = () => {
    if (!locationRef.current) {
      Alert.alert('Erreur', 'Veuillez sélectionner un lieu public valide.');
      return;
    }

    navigation.navigate('DropoffLocation', {
      departure,
      arrival,
      date,
      time,
      stops,
      pickupLocation: locationRef.current,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lieu de rencontre</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.title}>Lieu de rendez-vous</Text>
      <Text style={styles.subtitle}>Choisissez un point de rencontre public</Text>

      <GooglePlacesInputPublicOnly
        placeholder="Rechercher un lieu public"
        baseLocation={departure.city}
        onSelect={(location) => {
          locationRef.current = location;
          setIsValid(!!location);
        }}
      />

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggestions :</Text>
        <View style={styles.suggestionButtons}>
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={() => {/* Implémenter suggestion */}}
          >
            <Ionicons name="train" size={18} color="#003366" />
            <Text style={styles.suggestionText}>Gare la plus proche</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={() => {/* Implémenter suggestion */}}
          >
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

export default PickupLocationScreen;
