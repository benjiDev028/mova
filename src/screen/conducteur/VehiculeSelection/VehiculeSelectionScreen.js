import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  } = route.params || {};

  // 👇 on prend tout depuis le contexte
  const { user, id: ctxUserId, isLoading, refreshUser } = useAuth();

  // voitures de l’utilisateur (toujours un array)
  const vehicles = useMemo(() => Array.isArray(user?.cars) ? user.cars : [], [user]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(1);
  const [loadingPick, setLoadingPick] = useState(false);

  // Récupère/choisit le véhicule principal (persisté) ou le 1er si absent
  const pickInitialVehicle = async () => {
    if (!vehicles.length) {
      setSelectedVehicle(null);
      return;
    }
    setLoadingPick(true);
    try {
      const storedId = await AsyncStorage.getItem('selectedVehicleId'); // string ou null
      let v = null;

      if (storedId) {
        v = vehicles.find(x => String(x.id) === String(storedId)) || null;
      }
      if (!v) {
        // pas de principal stocké → prend le premier
        v = vehicles[0];
      }
      setSelectedVehicle(v);

      // places proposées par défaut (max 3, mini 1)
      const seats = Number(v?.seats) || 4;
      setAvailableSeats(Math.max(1, Math.min(3, seats)));
    } finally {
      setLoadingPick(false);
    }
  };

  // Quand le user arrive/évolue → (re)choisir le véhicule
  useEffect(() => {
    if (!isLoading) {
      pickInitialVehicle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, vehicles.length]);

  // Rafraîchir quand on revient sur l’écran (utile si on a changé le principal ailleurs)
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        // Tente un refresh du profil (si AuthService.me existe), sinon ça ne casse rien
        await refreshUser?.(undefined, { silent: true });
        await pickInitialVehicle();
      })();
    }, [refreshUser, vehicles.length])
  );

  const handleConfirm = () => {
    if (!selectedVehicle) return;

    const driverId = user?.id ?? ctxUserId; // fallback si user.id pas encore présent
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
      userId: driverId,
      availableSeats,
      totalSeats: selectedVehicle.seats,
    });
  };

  const renderSeatButtons = () => {
    if (!selectedVehicle) return null;
    const seats = Number(selectedVehicle.seats) || 4;

    return (
      <View style={styles.seatsContainer}>
        <Text style={styles.seatsTitle}>Places disponibles</Text>
        <View style={styles.seatsGrid}>
          {Array.from({ length: seats }, (_, i) => i + 1).map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.seatButton,
                availableSeats === n && styles.selectedSeat,
              ]}
              onPress={() => setAvailableSeats(n)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="seat"
                size={24}
                color={availableSeats === n ? '#FFFFFF' : '#003DA5'}
              />
              <Text
                style={[
                  styles.seatText,
                  availableSeats === n && styles.selectedSeatText,
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderVehicleChoice = () => {
    if (!vehicles.length) return null;
    if (vehicles.length === 1) return null;

    return (
      <View style={{ marginTop: 10 }}>
        <Text style={styles.sectionTitle}>Choisir un autre véhicule</Text>
        {vehicles.map((v) => {
          const active = String(v.id) === String(selectedVehicle?.id);
          return (
            <TouchableOpacity
              key={v.id}
              style={[styles.vehicleRow, active && styles.vehicleRowActive]}
              onPress={() => {
                setSelectedVehicle(v);
                const s = Number(v.seats) || 4;
                setAvailableSeats(Math.max(1, Math.min(3, s)));
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="car" size={20} color={active ? '#003DA5' : '#6B7280'} />
              <Text style={[styles.vehicleRowText, active && { color: '#003DA5', fontWeight: '700' }]}>
                {v.brand} {v.model} · {v.date_of_car} · {v.seats} places
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // États de chargement
  if (isLoading || loadingPick) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#003DA5" />
          <Text style={{ marginTop: 10, color: '#374151' }}>Chargement du véhicule…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasNoCar = vehicles.length === 0;

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
        {hasNoCar ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun véhicule</Text>
            <Text style={styles.emptySubtitle}>Ajoute un véhicule pour publier le trajet.</Text>

            <TouchableOpacity
              style={[styles.confirmButton, { marginTop: 16 }]}
              onPress={() => navigation.navigate('VehiculeSummary')}
            >
              <Text style={styles.confirmButtonText}>Ajouter un véhicule</Text>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {selectedVehicle && (
              <View style={styles.selectedVehicleContainer}>
                <Text style={styles.sectionTitle}>Véhicule sélectionné</Text>
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

            {renderVehicleChoice()}
            {renderSeatButtons()}
          </>
        )}
      </ScrollView>

      {!hasNoCar && (
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
      )}
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

  scrollContent: { padding: 20, paddingBottom: 120 },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { marginTop: 10, fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySubtitle: { marginTop: 4, fontSize: 14, color: '#6B7280' },

  selectedVehicleContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },

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

  // mini sélecteur si plusieurs véhicules
  vehicleRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  vehicleRowActive: { borderColor: '#003DA5', backgroundColor: '#F3F6FC' },
  vehicleRowText: { marginLeft: 8, color: '#374151', flexShrink: 1 },

  seatsContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginTop: 12,
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
