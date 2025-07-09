import React, { useState ,useMemo} from "react";
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, ScrollView, Image, Alert} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons";

export default function TripDetailScreen({ route, navigation }) {
  const { trip: initialTrip } = route.params || {};
  
  const trip = useMemo(()=>({
    ...initialTrip,
    stops: Array.isArray(initialTrip?.stops) ? initialTrip.stops : [],
    preferences: Array.isArray(initialTrip?.preferences) ? initialTrip.preferences : [],
    availableSeats: initialTrip?.availableSeats || 0,
    totalSeats: initialTrip?.totalSeats || 4,
    time: initialTrip?.time || "--:--",
    estimatedDuration: initialTrip?.estimatedDuration || "2h",
    departure: initialTrip?.departure || "Départ non spécifié",
    arrival: initialTrip?.arrival || "Destination non spécifiée",
    driverName: initialTrip?.driverName || "Conducteur inconnu",
    carModel: initialTrip?.carModel || "Véhicule non spécifié",
    rating: initialTrip?.rating || 4.5,
    price: initialTrip?.price ?? 0
  }),[])

  const PREFERENCES_CONFIG = {
  nonFumeur: { icon: "smoke-free", label: "Non fumeur", color: "#059669" },
  fumeur: { icon: "smoking-rooms", label: "Fumeur", color: "#DC2626" },
  climatisation: { icon: "ac-unit", label: "Climatisation", color: "#3B82F6" },
  valise: { icon: "luggage", label: "Coffre à bagages", color: "#8B5CF6" },
  vélo: { icon: "directions-bike", label: "Transport vélo", color: "#10B981" },
  ski: { icon: "downhill-skiing", label: "Transport ski", color: "#06B6D4" },
  paiementCash: { icon: "payments", label: "Paiement cash", color: "#F59E0B" },
  virement: { icon: "account-balance", label: "Virement", color: "#6366F1" },
  animaux: { icon: "pets", label: "Animaux acceptés", color: "#EC4899" }
};


  const [seats, setSeats] = useState(1);
const lastStop = trip.stops.at(-1) || null;

  const [selectedStop, setSelectedStop] = useState(lastStop || { 
    location: trip.arrival, 
    price: trip.price,
    
    
    
  });
  
const totalPrice = useMemo(() => {
  return (selectedStop?.price * seats + 3.5).toFixed(2);
}, [selectedStop, seats]);

const handleConfirm = () => {
  if (!selectedStop || trip.availableSeats === 0) return;
  if (seats > trip.availableSeats) return;
  const newReservedSeats = (trip.totalSeats - trip.availableSeats) + seats;
  
  navigation.navigate("PayBooking", { 
    trip: {
      ...trip,
      selectedStop,
      seats,
      totalPrice,
      availableSeats: trip.availableSeats - seats,
      reservedSeats: newReservedSeats
    }
  });
};
  const renderStopOption = (stop, index) => {
    const isSelected = selectedStop?.id === stop.id;
    const isDestination = index === trip.stops.length - 1;
    
    return (
      <TouchableOpacity
        key={`stop-${index}`}
        style={[styles.stopOption, isSelected && styles.selectedStop]}
        onPress={() => setSelectedStop(stop)}
      >
        <View style={styles.stopHeader}>
          <View style={styles.stopIndicator}>
            <View style={[
              styles.stopDot, 
              isDestination ? styles.destinationDot : styles.intermediateDot,
              isSelected && styles.selectedDot
            ]} />
            <Text style={[styles.stopLabel, isSelected && styles.selectedStopText]}>
              {isDestination ? 'Destination' : `Arrêt ${index + 1}`}
            </Text>
          </View>
          <View style={[styles.priceTag, isSelected && styles.selectedPriceTag]}>
            <Text style={[styles.stopPrice, isSelected && styles.selectedPriceText]}>
              {stop.price.toFixed(2)}$
            </Text>
          </View>
        </View>
        
        <Text style={[styles.stopLocation, isSelected && styles.selectedStopText]}>
          {stop.location}
        </Text>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <MaterialIcons name="check-circle" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSeatOptions = () => {
    const options = [];
    const maxSeatsToShow = Math.min(trip.availableSeats, 6);
    
    for (let i = 0; i < maxSeatsToShow; i++) {
      const seatNumber = i + 1;
      options.push(
        <TouchableOpacity
          key={`seat-${seatNumber}`}
          style={[
            styles.seatOption,
            seats === seatNumber && styles.selectedSeat
          ]}
          onPress={() => setSeats(seatNumber)}
        >
          <Text style={[
            styles.seatNumber,
            seats === seatNumber && styles.selectedSeatText
          ]}>
            {seatNumber}
          </Text>
          <Text style={[
            styles.seatLabel,
            seats === seatNumber && styles.selectedSeatText
          ]}>
            place{seatNumber > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return options;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#003366" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du trajet</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripTime}>{trip.time}</Text>
            <View style={styles.estimatedTime}>
              <MaterialIcons name="access-time" size={16} color="#6B7280" />
              <Text style={styles.duration}>{trip.estimatedDuration}</Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.locationRow}>
              <View style={styles.dot} />
              <Text style={styles.locationText}>{trip.departure}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, styles.dotDest]} />
              <Text style={[styles.locationText, styles.selectedDestination]}>
                {selectedStop?.location || trip.arrival}
              </Text>
            </View>
          </View>

          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              {trip.driverPhoto ? (
                <Image source={{ uri: trip.driverPhoto }} style={styles.avatarImage} />
              ) : (
                <FontAwesome name="user" size={20} color="#fff" />
              )}
            </View>
            <View style={styles.driverText}>
              <Text style={styles.driverName}>
                {trip.driverName}
                {trip.verified && (
                  <MaterialIcons name="verified" size={16} color="#10B981" style={{ marginLeft: 5 }} />
                )}
              </Text>
              <Text style={styles.carModel}>{trip.carModel}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.rating}>{trip.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choisissez votre destination</Text>
        <View style={styles.stopsContainer}>
          {trip.stops.length > 0 ? (
            trip.stops.map((stop, index) => renderStopOption(stop, index))
          ) : (
            <Text style={styles.noStopsText}>Aucun arrêt intermédiaire</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Options du trajet</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.preferencesContainer}
        >
          {trip.preferences.length > 0 ? (
            trip.preferences.map((pref, index) => {
              const config = PREFERENCES_CONFIG[pref] || { icon: "check-circle", label: pref, color: "#6B7280" };
              return (
                <View key={`pref-${index}`} style={[
                  styles.preferenceBadge,
                  { borderColor: config.color }
                ]}>
                  <MaterialIcons
                    name={config.icon}
                    size={16}
                    color={config.color}
                  />
                  <Text style={[styles.preferenceText, { color: config.color }]}>
                    {config.label}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noPreferencesText}>Aucune préférence spécifiée</Text>
          )}
        </ScrollView>

        <Text style={styles.sectionTitle}>
          Places disponibles: {trip.availableSeats}
        </Text>
        <View style={styles.seatsContainer}>
          {trip.availableSeats > 0 ? (
            renderSeatOptions()
          ) : (
            <Text style={styles.noSeatsText}>Plus de places disponibles</Text>
          )}
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Prix des places:</Text>
            <Text style={styles.paymentValue}>
              {(selectedStop?.price * seats).toFixed(2)}$
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Frais de service (3.50$) :</Text>
            <Text style={styles.paymentValue}>{seats* 3.50}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {((selectedStop?.price * seats) + 3.50).toFixed(2)}$
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={20} color="#003366" />
          <Text style={styles.infoText}>
            Le paiement sera préautorisé. Frais non remboursables en cas d'annulation.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.confirmButton, 
            (!selectedStop || trip.availableSeats === 0) && styles.disabledButton
          ]} 
          onPress={handleConfirm}
          disabled={!selectedStop || trip.availableSeats === 0}
        >
          <Text style={styles.confirmButtonText}>
            {trip.availableSeats === 0 ? 'COMPLET' : `Réserver (${seats} place${seats > 1 ? 's' : ''})`}
          </Text>
          <Text style={styles.confirmButtonPrice}>
            {(selectedStop?.price * seats + 3.5).toFixed(2)}$
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    flex: 1,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  routeContainer: {
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#003366',
    marginRight: 12,
  },
  dotDest: {
    backgroundColor: '#059669',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  selectedDestination: {
    fontWeight: '600',
    color: '#059669',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  driverText: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  carModel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  stopsContainer: {
    marginBottom: 20,
  },
  stopOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  selectedStop: {
    borderColor: '#003366',
    backgroundColor: '#003366',
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  intermediateDot: {
    backgroundColor: '#FFC107',
  },
  destinationDot: {
    backgroundColor: '#059669',
  },
  selectedDot: {
    backgroundColor: '#fff',
  },
  stopLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedStopText: {
    color: '#fff',
  },
  priceTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedPriceTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stopPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  selectedPriceText: {
    color: '#fff',
  },
  stopLocation: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  noStopsText: {
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
  preferencesContainer: {
    paddingBottom: 8,
  },
  preferenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  preferenceText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  noPreferencesText: {
    color: '#6B7280',
    fontStyle: 'italic',
    padding: 8,
  },
  seatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  seatOption: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSeat: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  seatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  seatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedSeatText: {
    color: '#fff',
  },
  noSeatsText: {
    color: '#EF4444',
    fontWeight: '500',
    padding: 12,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    color: '#003366',
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#1E3A8A',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#003366',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});