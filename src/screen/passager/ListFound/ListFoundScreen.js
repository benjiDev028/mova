import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Image
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome
} from "@expo/vector-icons";
import service_vehicule from "../../../services/service_vehicule/service_vehicule";
import { searchTrips } from "../../../services/service_trip/service_trip";
import user_services from "../../../services/services_user/user_services";
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

// Configuration des préférences
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

export default function ListFoundScreen({ navigation, route }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    departure: '',
    arrival: '',
    date: null,
    includeNearby: true,
    filters: {}
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const params = route.params || {};
        
        setSearchParams({
          departure: params.departure || '',
          arrival: params.arrival || '',
          date: params.date || null,
          includeNearby: params.includeNearby !== false,
          filters: params.filters || {}
        });

        if (params.departure && params.arrival) {
          await fetchTripsWithDriverInfo(params.departure, params.arrival, params.date, params.filters);
        } else {
          setTrips([]);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [route.params]);

  const fetchTripsWithDriverInfo = async (departure, arrival, date, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const tripsData = await searchTrips(departure.trim(), arrival.trim(), date);
      
      if (!tripsData || tripsData.length === 0) {
        setTrips([]);
        return;
      }

      const tripsWithDetails = await Promise.all(
        tripsData.map(async (trip) => {
          try {
            const userData = await user_services.getUserById(trip.driver_id);
            
            if (!matchesFilters(trip, filters)) {
              return null;
            }

            // Calcul des places disponibles
            const totalSeats = trip.total_seats ?? trip.available_seats ?? 3;
            const availableSeats = trip.available_seats ?? totalSeats;
            const reservedSeats = totalSeats - availableSeats;

            // Construction des arrêts
            const stops = [];
            if (trip.stops && trip.stops.length > 0) {
              trip.stops.forEach(stop => {
                stops.push({
                  location: stop.destination_city || "Arrêt non spécifié",
                  price: stop.price || 0,
                  id : stop.id
                });
              });
            }
            
            stops.push({
              location: `${trip.destination_city} - ${trip.destination_place}`,
              price: trip.total_price,
              isFinalDestination: true
            });

            // const carInfo = userData.cars?.[0] || {};
            const carInfo = await service_vehicule.getCarById(trip.car_id)
            const carModel = carInfo.brand ? `${carInfo.brand} ${carInfo.model} ${carInfo.date_of_car} ` : "Information non disponible";
            
            return {
              id: trip.id,
              time: trip.departure_time?.substring(0, 5) || "--:--",
              date: trip.departure_date,
              departure: `${trip.departure_city} - ${trip.departure_place}`,
              arrival: `${trip.destination_city} - ${trip.destination_place}`,
              price: trip.total_price,
              rating: userData.rating || 4.5,
              reviews: userData.reviews_count || Math.floor(Math.random() * 100) + 50,
              availableSeats: availableSeats,
              reservedSeats: reservedSeats,
              totalSeats: totalSeats,
   
              driverName: `${userData.first_name || 'Prénom'} ${userData.last_name || 'Nom'}`,
              driverPhoto: userData.profile_picture || null,
              carModel: carModel,
              preferences: convertPreferencesToArray(trip.preferences),
              estimatedDuration: calculateEstimatedDuration(trip.departure_city, trip.destination_city),
              verified: userData.verified || false,
              stops: stops,
              message: trip.message || '',
              status: "pending",
              paymentMode: trip.preferences?.mode_payment || 'virement'
            };
          } catch (error) {
            console.error(`Error processing trip ${trip.id}:`, error);
            return null;
          }
        })
      );

      setTrips(tripsWithDetails.filter(trip => trip !== null));
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const matchesFilters = (trip, filters) => {
    if (!filters || Object.keys(filters).length === 0) return true;

    const prefs = trip.preferences || {};
    
    for (const [filterKey, filterValue] of Object.entries(filters)) {
      if (filterValue === null || filterValue === undefined) continue;

      switch (filterKey) {
        case 'priceRange':
          const maxPrice = typeof filterValue === 'object' ? filterValue.max : filterValue;
          if (maxPrice !== undefined && trip.total_price > maxPrice) return false;
          break;
        case 'minSeats':
          const availableSeats = (trip.available_seats || 0) - (trip.reserved_seats || 0);
          if (availableSeats < filterValue) return false;
          break;
        case 'smoking':
          if (prefs.smoking_allowed !== filterValue) return false;
          break;
        case 'airConditioning':
          if (filterValue && !prefs.air_conditioning) return false;
          break;
        case 'baggage':
          if (filterValue && !prefs.baggage) return false;
          break;
        case 'pets':
          if (filterValue && !prefs.pets_allowed) return false;
          break;
        case 'bikeSupport':
          if (filterValue && !prefs.bike_support) return false;
          break;
        case 'skiSupport':
          if (filterValue && !prefs.ski_support) return false;
          break;
        case 'paymentMode':
          if (filterValue && prefs.mode_payment !== filterValue) return false;
          break;
      }
    }
    
    return true;
  };

  const calculateEstimatedDuration = (departure, destination) => {
    const distances = {
      'montreal-gatineau': '2h',
      'montreal-quebec': '3h',
      'montreal-sherbrooke': '1h30',
      'quebec-montreal': '3h',
      'gatineau-montreal': '2h',
      'laval-montreal': '30min',
      'longueuil-montreal': '20min'
    };
    
    const key = `${departure.trim().toLowerCase()}-${destination.trim().toLowerCase()}`;
    return distances[key] || '2h';
  };

  const convertPreferencesToArray = (prefs) => {
    if (!prefs) return [];
    
    const preferencesArray = [];
    
    if (prefs.air_conditioning) preferencesArray.push("climatisation");
    if (prefs.baggage) preferencesArray.push("valise");
    if (prefs.bike_support) preferencesArray.push("vélo");
    if (prefs.ski_support) preferencesArray.push("ski");
    if (prefs.pets_allowed) preferencesArray.push("animaux");
    
    if (prefs.smoking_allowed) {
      preferencesArray.push("fumeur");
    } else {
      preferencesArray.push("nonFumeur");
    }
    
    if (prefs.mode_payment === "cash") {
      preferencesArray.push("paiementCash");
    } else if (prefs.mode_payment === "virement") {
      preferencesArray.push("virement");
    }
    
    return preferencesArray;
  };

  const renderTripCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.timeContainer}>
          <MaterialIcons name="access-time" size={16} color="#007BFF" />
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price}$</Text>
          <Text style={styles.priceLabel}>CAD</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>{item.departure}</Text>
        </View>
        <View style={styles.routeLine} />
        
        {item.stops.map((stop, index) => (
          <View key={`stop-${index}`}>
            <View style={styles.stopRow}>
              <View style={[
                styles.locationDot, 
                stop.isFinalDestination ? styles.destinationDot : styles.stopDot
              ]} />
              <View style={styles.stopInfo}>
                <Text style={styles.stopLocationText} numberOfLines={1}>{stop.location}</Text>
                <Text style={styles.stopPrice}>{stop.price}$ CAD</Text>
              </View>
            </View>
            {index < item.stops.length - 1 && <View style={styles.routeLine} />}
          </View>
        ))}
      </View>

      <View style={styles.driverInfo}>
        <View style={styles.driverDetails}>
          <View style={styles.driverNameContainer}>
            {item.driverPhoto ? (
              <Image source={{ uri: item.driverPhoto }} style={styles.driverAvatar} />
            ) : (
              <FontAwesome name="user-circle" size={16} color="#6B7280" />
            )}
            <Text style={styles.driverName}>{item.driverName}</Text>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={12} color="#059669" />
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            )}
          </View>
          <Text style={styles.carModel}>{item.carModel}</Text>
        </View>
        <View style={styles.durationContainer}>
          <Text style={styles.duration}>{item.estimatedDuration}</Text>
          <Text style={styles.paymentMode}>
            {item.paymentMode === 'cash' ? 'Espèces' : 'Virement'}
          </Text>
        </View>
      </View>

      {item.message && (
        <View style={styles.messageContainer}>
          <MaterialIcons name="message" size={14} color="#1E40AF" />
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={14} color="#FFC107" />
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({item.reviews}+ avis)</Text>
        </View>

        <View style={styles.seatsContainer}>
          <MaterialIcons name="airline-seat-recline-normal" size={16} color="#6B7280" />
          <Text style={styles.seatsText}>
             {item.totalSeats - item.availableSeats} / {item.totalSeats} places
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.preferencesScroll}
        contentContainerStyle={styles.preferencesContainer}
      >
        {item.preferences.map((pref, index) => {
          const config = PREFERENCES_CONFIG[pref] || { icon: "check-circle", label: pref, color: "#6B7280" };
          return (
            <View key={`pref-${index}`} style={[
              styles.preferenceChip,
              { borderColor: config.color }
            ]}>
              <MaterialIcons
                name={config.icon}
                size={12}
                color={config.color}
              />
              <Text style={[styles.preferenceText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.bookButton,
          item.availableSeats <= 0 && styles.disabledButton
        ]}
        onPress={() => navigation.navigate("DetailTrip", { trip: item })}
        activeOpacity={0.7}
        disabled={item.availableSeats <= 0}
      >
        <Text style={styles.bookButtonText}>
          {item.availableSeats <= 0 ? 'COMPLET' : 'Réserver'}
        </Text>
        <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Recherche des trajets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchTripsWithDriverInfo(
            searchParams.departure,
            searchParams.arrival,
            searchParams.date,
            searchParams.filters
          )}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.textHeader}>Trajets disponibles</Text>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {trips.length} résultat{trips.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.resultsDate}>
          {searchParams.date ? moment(searchParams.date).format('dddd D MMMM YYYY') : 'Date non spécifiée'}
          {searchParams.arrival && ` • ${searchParams.departure} → ${searchParams.arrival}`}
        </Text>
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Aucun trajet disponible</Text>
          <Text style={styles.emptySubText}>
            Essayez de modifier vos critères de recherche ou vos filtres
          </Text>
          <TouchableOpacity 
            style={styles.modifySearchButton}
            onPress={() => navigation.navigate('SearchTrajet', searchParams)}
          >
            <Text style={styles.modifySearchText}>Modifier la recherche</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTripCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  textHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
    flex: 1,
    textAlign: 'center',
    marginRight: 24
  },
  backButton: {
    padding: 8,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultsDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  time: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003366',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  routeContainer: {
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#003366',
    marginRight: 12,
  },
  stopDot: {
    backgroundColor: '#FFC107',
    width: 6,
    height: 6,
  },
  destinationDot: {
    backgroundColor: '#059669',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 3,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  stopInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopLocationText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  stopPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  driverDetails: {
    flex: 1,
  },
  driverNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  carModel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  durationContainer: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentMode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  messageContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 12,
    color: '#1E40AF',
    fontStyle: 'italic',
    marginLeft: 4,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  reviews: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 4,
  },
  preferencesScroll: {
    marginBottom: 12,
    maxHeight: 30,
  },
  preferencesContainer: {
    paddingRight: 16,
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
  },
  preferenceText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 3,
  },
  bookButton: {
    backgroundColor: '#003366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#003366',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  modifySearchButton: {
    marginTop: 20,
    backgroundColor: '#003366',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modifySearchText: {
    color: '#FFFFFF',
    fontWeight: '600',
  }
});