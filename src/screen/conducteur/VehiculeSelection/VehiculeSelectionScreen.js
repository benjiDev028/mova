import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
    destinationPrice
  } = route.params;

  // Liste des véhicules disponibles avec icônes
  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      name: 'Toyota Corolla',
      type: 'Sedan',
      seats: 4,
      icon: 'car-sedan',
      isDefault: true,
      year: 2022,
      comfort: 'Standard',
      color: '#4F46E5'
    },
    {
      id: 2,
      name: 'Honda CR-V',
      type: 'SUV',
      seats: 5,
      icon: 'car-suv',
      isDefault: false,
      year: 2021,
      comfort: 'Confort',
      color: '#10B981'
    },
    {
      id: 3,
      name: 'Dodge Grand Caravan',
      type: 'Minivan',
      seats: 7,
      icon: 'car-side',
      isDefault: false,
      year: 2020,
      comfort: 'Espace',
      color: '#EF4444'
    }
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(1);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  // Sélectionner le véhicule par défaut au chargement
  useEffect(() => {
    const defaultVehicle = vehicles.find(v => v.isDefault);
    if (defaultVehicle) {
      setSelectedVehicle(defaultVehicle);
      setAvailableSeats(Math.min(3, defaultVehicle.seats)); // Max 3 places par défaut
    }
  }, []);

  const handleConfirm = () => {
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
      availableSeats,
      totalSeats: selectedVehicle.seats
    });
  };

  const renderSeatButtons = () => {
    if (!selectedVehicle) return null;
    
    return (
      <View style={styles.seatsContainer}>
        <Text style={styles.seatsTitle}>Places disponibles</Text>
        <View style={styles.seatsGrid}>
          {[...Array(selectedVehicle.seats).keys()].map(i => (
            <TouchableOpacity
              key={i}
              style={[
                styles.seatButton,
                availableSeats === i + 1 && styles.selectedSeat
              ]}
              onPress={() => setAvailableSeats(i + 1)}
            >
              <MaterialCommunityIcons 
                name="seat" 
                size={24} 
                color={availableSeats === i + 1 ? '#FFFFFF' : '#003DA5'} 
              />
              <Text style={[
                styles.seatText,
                availableSeats === i + 1 && styles.selectedSeatText
              ]}>
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
      
      {/* En-tête personnalisée */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sélection du véhicule</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section véhicule sélectionné */}
        {selectedVehicle && (
          <View style={styles.selectedVehicleContainer}>
            <Text style={styles.sectionTitle}>Véhicule principal</Text>
            <View style={styles.vehicleCard}>
              <View style={[styles.vehicleIconContainer, { backgroundColor: selectedVehicle.color + '20' }]}>
                <MaterialCommunityIcons 
                  name={selectedVehicle.icon} 
                  size={48} 
                  color={selectedVehicle.color} 
                />
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
                <View style={styles.vehicleSpecs}>
                  <Text style={styles.vehicleSpec}>{selectedVehicle.type}</Text>
                  <Text style={styles.vehicleSpec}>{selectedVehicle.year}</Text>
                  <Text style={styles.vehicleSpec}>{selectedVehicle.comfort}</Text>
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

        {/* Liste des autres véhicules disponibles */}
        <View style={styles.availableVehiclesContainer}>
          <Text style={styles.sectionTitle}>Autres véhicules disponibles</Text>
          
          {vehicles
            .filter(v => !v.isDefault)
            .map(vehicle => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleOption,
                  selectedVehicle?.id === vehicle.id && styles.selectedVehicleOption
                ]}
                onPress={() => {
                  setSelectedVehicle(vehicle);
                  setAvailableSeats(1);
                }}
              >
                <View style={[styles.optionVehicleIcon, { backgroundColor: vehicle.color + '20' }]}>
                  <MaterialCommunityIcons 
                    name={vehicle.icon} 
                    size={32} 
                    color={vehicle.color} 
                  />
                </View>
                <View style={styles.optionVehicleDetails}>
                  <Text style={styles.optionVehicleName}>{vehicle.name}</Text>
                  <Text style={styles.optionVehicleSpec}>
                    {vehicle.type} • {vehicle.seats} places • {vehicle.comfort}
                  </Text>
                </View>
                {selectedVehicle?.id === vehicle.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}

          <TouchableOpacity 
            style={styles.addVehicleButton}
            onPress={() => setShowAddVehicle(true)}
          >
            <Ionicons name="add" size={24} color="#003DA5" />
            <Text style={styles.addVehicleText}>Ajouter un autre véhicule</Text>
          </TouchableOpacity>
        </View>

        {/* Sélection du nombre de places */}
        {renderSeatButtons()}
      </ScrollView>

      {/* Bouton de confirmation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedVehicle && styles.disabledButton
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
  container: {
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  selectedVehicleContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  vehicleIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  vehicleSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  vehicleSpec: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 10,
    marginBottom: 5,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 5,
  },
  availableVehiclesContainer: {
    marginBottom: 25,
  },
  vehicleOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedVehicleOption: {
    borderColor: '#003DA5',
    backgroundColor: '#F0F7FF',
  },
  optionVehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionVehicleDetails: {
    flex: 1,
  },
  optionVehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  optionVehicleSpec: {
    fontSize: 14,
    color: '#6B7280',
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  addVehicleText: {
    fontSize: 16,
    color: '#003DA5',
    marginLeft: 10,
    fontWeight: '500',
  },
  seatsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  seatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
  },
  seatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  seatButton: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginBottom: 15,
  },
  selectedSeat: {
    backgroundColor: '#003DA5',
  },
  seatText: {
    fontSize: 16,
    color: '#003DA5',
    marginTop: 5,
    fontWeight: 'bold',
  },
  selectedSeatText: {
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#003DA5',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default VehicleSelectionScreen;