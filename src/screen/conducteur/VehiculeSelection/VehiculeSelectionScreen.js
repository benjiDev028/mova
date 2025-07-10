import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../hooks/useAuth';

const VehicleSelectionScreen = ({ route }) => {
  const navigation = useNavigation();
  const {
    departure,
    arrival,
    pickupLocation,
    dropoffLocation,
    date,
    time,
    preferences,
    stops,
    destinationPrice,
  } = route.params;

  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(1);

  useEffect(() => {
    const fetchVehicle = async () => {
      const selectedId = await AsyncStorage.getItem('selectedVehicleId');
      if (selectedId && user?.cars?.length > 0) {
        const vehicle = user.cars.find((v) => v.id === selectedId);
        if (vehicle) {
          setSelectedVehicle(vehicle);
          setAvailableSeats(Math.min(3, vehicle.seats || 4)); // max 3 places par défaut
        }
      }
    };

    fetchVehicle();
  }, [user]);

  const handleConfirm = () => {
    if (!selectedVehicle) return;

    navigation.navigate('ReviewAndConfirm', {
      departure,
      arrival,
      pickupLocation,
      dropoffLocation,
      preferences,
      date,
      time,
      stops,
      destinationPrice,
      vehicle: selectedVehicle,
      vehicleId: selectedVehicle.id,
      userId: user.id,
      availableSeats,
      totalSeats: selectedVehicle.seats,
    });
  };

  const renderSeatButtons = () => {
    if (!selectedVehicle) return null;

    return (
      <View style={styles.seatsContainer}>
        <Text style={styles.seatsTitle}>Places disponibles</Text>
        <View style={styles.seatsGrid}>
          {[...Array(selectedVehicle.seats).keys()].map((i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.seatButton,
                availableSeats === i + 1 && styles.selectedSeat,
              ]}
              onPress={() => setAvailableSeats(i + 1)}
            >
              <MaterialCommunityIcons
                name="seat"
                size={24}
                color={availableSeats === i + 1 ? '#FFFFFF' : '#003DA5'}
              />
              <Text
                style={[
                  styles.seatText,
                  availableSeats === i + 1 && styles.selectedSeatText,
                ]}
              >
                {i + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sélection du véhicule</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {selectedVehicle && (
          <View style={styles.selectedVehicleContainer}>
            <Text style={styles.sectionTitle}>Véhicule principal</Text>
            <View style={styles.vehicleCard}>
              <View style={[styles.vehicleIconContainer, { backgroundColor: '#E5E7EB' }]}>
                <MaterialCommunityIcons name="car" size={48} color="#003DA5" />
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>
                  {selectedVehicle.brand} {selectedVehicle.model}
                </Text>
                <View style={styles.vehicleSpecs}>
                  <Text style={styles.vehicleSpec}>Année : {selectedVehicle.date_of_car}</Text>
                  <Text style={styles.vehicleSpec}>Couleur : {selectedVehicle.color}</Text>
                  <Text style={styles.vehicleSpec}>Plaque : {selectedVehicle.license_plate}</Text>
                </View>
                <View style={styles.capacityInfo}>
                  <MaterialCommunityIcons name="seat" size={16} color="#6B7280" />
                  <Text style={styles.capacityText}>
                    {selectedVehicle.seats} places max
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {renderSeatButtons()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedVehicle && styles.disabledButton,
          ]}
          onPress={handleConfirm}
          disabled={!selectedVehicle}
        >
          <Text style={styles.confirmButtonText}>
            Confirmer {selectedVehicle && `(${availableSeats} place${availableSeats > 1 ? 's' : ''})`}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#003366', textAlign: 'center', flex: 1,
  },
  placeholder: { width: 24 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  selectedVehicleContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 15 },
  vehicleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  vehicleIconContainer: {
    width: 80, height: 80, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  vehicleDetails: { flex: 1 },
  vehicleName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  vehicleSpecs: { flexDirection: 'column', marginBottom: 5 },
  vehicleSpec: {
    fontSize: 14, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 10, marginBottom: 4,
  },
  capacityInfo: { flexDirection: 'row', alignItems: 'center' },
  capacityText: { fontSize: 14, color: '#6B7280', marginLeft: 5 },
  seatsContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 6, elevation: 3,
  },
  seatsTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 15 },
  seatsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  seatButton: {
    width: '30%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 10, marginBottom: 15,
  },
  selectedSeat: { backgroundColor: '#003DA5' },
  seatText: { fontSize: 16, color: '#003DA5', marginTop: 5, fontWeight: 'bold' },
  selectedSeatText: { color: '#FFFFFF' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', padding: 15, borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#003DA5', borderRadius: 10, padding: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  disabledButton: { backgroundColor: '#9CA3AF' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
});

export default VehicleSelectionScreen;
