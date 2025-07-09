import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VehicleAndPriceScreen = ({ route, navigation }) => {
  const { departure, arrival,pickupLocation,dropoffLocation,date,time, preferences, stops = [], destinationPrice = '' } = route.params;

  const [localStops, setLocalStops] = useState(stops);
  const [arrivalPrice, setArrivalPrice] = useState(destinationPrice.toString());
  const [isFormValid, setIsFormValid] = useState(false);

  // Validation du formulaire
  useEffect(() => {
    const allPricesFilled = localStops.every(stop => stop.price && !isNaN(parseFloat(stop.price)));
    const arrivalPriceValid = arrivalPrice && !isNaN(parseFloat(arrivalPrice));
    setIsFormValid(allPricesFilled && arrivalPriceValid);
  }, [localStops, arrivalPrice]);

  const handleStopPriceChange = (index, value) => {
    const updated = [...localStops];
    updated[index].price = value;
    setLocalStops(updated);
  };

  const validateAndContinue = () => {
    if (!isFormValid) {
      Alert.alert(
        "Prix invalides",
        "Veuillez entrer des valeurs numériques valides pour tous les arrêts et la destination finale."
      );
      return;
    }

    navigation.navigate('VehiculeSelection', {
      departure,
      arrival,
      date,
      time,
      pickupLocation,
      dropoffLocation,
      preferences,
      stops: localStops.map(stop => ({
        ...stop,
        price: parseFloat(stop.price)
      })),
      destinationPrice: parseFloat(arrivalPrice)
    });
  };

  const getCityName = (location) => {
    if (!location) return 'Arrêt inconnu';
    if (typeof location === 'string') return location;
    return location.city || location.name || location.description || 'Arrêt inconnu';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* En-tête personnalisée comme demandé */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuration des prix</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subHeader}>Définissez le prix pour chaque arrêt</Text>

          <View style={styles.priceSection}>
            <Text style={styles.sectionTitle}>Arrêts intermédiaires</Text>
            {localStops.map((stop, index) => (
              <View key={`stop-${index}`} style={styles.priceInputContainer}>
                <Text style={styles.stopLabel}>
                  {getCityName(stop.location || stop)}
                </Text>
                <View style={styles.priceInputWrapper}>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    value={stop.price?.toString()}
                    onChangeText={(value) => handleStopPriceChange(index, value)}
                  />
                  <Text style={styles.currency}>$</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.sectionTitle}>Destination finale</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.stopLabel}>
                {getCityName(arrival)}
              </Text>
              <View style={styles.priceInputWrapper}>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  value={arrivalPrice}
                  onChangeText={setArrivalPrice}
                />
                <Text style={styles.currency}>$</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, !isFormValid && styles.disabledButton]} 
            onPress={validateAndContinue}
            disabled={!isFormValid}
          >
            <Text style={styles.buttonText}>Continuer vers la sélection du véhicule</Text>
            <Ionicons name="car-sport" size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 24,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  subHeader: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 25,
    textAlign: 'center',
  },
  priceSection: {
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  priceInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  stopLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  priceInput: {
    width: 80,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  currency: {
    fontSize: 16,
    color: '#6B7280',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003DA5',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
});

export default VehicleAndPriceScreen;