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
  ScrollView
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { searchTrips } from "../../../services/service_trip/service_trip";
import user_services from "../../../services/services_user/user_services";
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

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
        
        const { 
          departure = '', 
          arrival = '', 
          date = null, 
          includeNearby = true,
          filters = {}
        } = params;

        console.log('Paramètres reçus:', params);

        setSearchParams({
          departure,
          arrival,
          date,
          includeNearby,
          filters
        });

        if (departure && arrival) {
          await fetchTripsWithDriverInfo(departure, arrival, date, filters);
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
      
      const normalizedDeparture = departure.trim();
      const normalizedArrival = arrival.trim();
      
      console.log('Recherche avec:', { 
        departure: normalizedDeparture, 
        arrival: normalizedArrival, 
        date, 
        
        filters
      });
      
      const tripsData = await searchTrips(normalizedDeparture, normalizedArrival, date);
      
      console.log('Données brutes reçues:', tripsData);
      
      if (!tripsData || tripsData.length === 0) {
        console.log('Aucun trajet retourné par le service');
        setTrips([]);
        return;
      }

      const tripsWithDetails = await Promise.all(
        tripsData.map(async (trip) => {
          try {
            const userData = await user_services.getUserById(trip.driver_id);
            
            console.log('Traitement du trajet:', trip.id);
            console.log('Préférences du trajet:', trip.preferences);
            
            // Appliquer les filtres
            if (!matchesFilters(trip, filters)) {
              console.log('Trajet exclu par les filtres:', trip.id);
              return null;
            }

            // Construire la liste des arrêts
            const stops = [];
            
            // Ajouter les arrêts intermédiaires s'ils existent
            if (trip.stops && trip.stops.length > 0) {
              trip.stops.forEach(stop => {
                stops.push({
                  location: stop.destination_city || "Arrêt non spécifié",
                  price: stop.price || 0
                });
              });
            }
            
            // Ajouter la destination finale
            stops.push({
              location: `${trip.destination_city} - ${trip.destination_place}`,
              price: trip.total_price,
              isFinalDestination: true
            });

            const carInfo = userData.cars?.[0] || {};
            const carModel = carInfo.brand && carInfo.model 
              ? `${carInfo.brand} ${carInfo.model}` 
              : "Information non disponible";

            return {
              id: trip.id,
              time: trip.departure_time?.substring(0, 5) || "--:--",
              date: trip.departure_date,
              departure: `${trip.departure_city} - ${trip.departure_place}`,
              arrival: `${trip.destination_city} - ${trip.destination_place}`,
              price: trip.total_price,
              rating: 4.5, // Valeur par défaut - à remplacer par les vraies données
              reviews: Math.floor(Math.random() * 100) + 50, // Valeur par défaut
              availableSeats: trip.available_seats || 0,
              totalSeats: 4, // Valeur par défaut - à adapter selon les données réelles
              driverName: `${userData.first_name || 'Prénom'} ${userData.last_name || 'Nom'}`,
              driverPhoto: userData.profile_picture || null,
              carModel: carModel,
              preferences: convertPreferencesToArray(trip.preferences),
              estimatedDuration: calculateEstimatedDuration(trip.departure_city, trip.destination_city),
              verified: true, // À adapter selon les données réelles
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

      const validTrips = tripsWithDetails.filter(trip => trip !== null);
      console.log('Trajets valides après filtrage:', validTrips.length);
      setTrips(validTrips);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier si un trajet correspond aux filtres
  const matchesFilters = (trip, filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return true;
    }

    const prefs = trip.preferences || {};
    
    // Vérifier chaque filtre
    for (const [filterKey, filterValue] of Object.entries(filters)) {
      switch (filterKey) {
        case 'priceRange':
          if (filterValue && (trip.total_price < filterValue.min || trip.total_price > filterValue.max)) {
            return false;
          }
          break;
        case 'departureTime':
          if (filterValue && !isTimeInRange(trip.departure_time, filterValue)) {
            return false;
          }
          break;
        case 'smoking':
          if (filterValue !== undefined && prefs.smoking_allowed !== filterValue) {
            return false;
          }
          break;
        case 'airConditioning':
          if (filterValue && !prefs.air_conditioning) {
            return false;
          }
          break;
        case 'baggage':
          if (filterValue && !prefs.baggage) {
            return false;
          }
          break;
        case 'pets':
          if (filterValue && !prefs.pets_allowed) {
            return false;
          }
          break;
        case 'bikeSupport':
          if (filterValue && !prefs.bike_support) {
            return false;
          }
          break;
        case 'skiSupport':
          if (filterValue && !prefs.ski_support) {
            return false;
          }
          break;
        case 'paymentMode':
          if (filterValue && prefs.mode_payment !== filterValue) {
            return false;
          }
          break;
        case 'minSeats':
          if (filterValue && trip.available_seats < filterValue) {
            return false;
          }
          break;
        default:
          console.log('Filtre non reconnu:', filterKey);
      }
    }
    
    return true;
  };

  const isTimeInRange = (tripTime, timeRange) => {
    if (!tripTime || !timeRange) return true;
    
    const tripMinutes = timeToMinutes(tripTime);
    const startMinutes = timeToMinutes(timeRange.start);
    const endMinutes = timeToMinutes(timeRange.end);
    
    return tripMinutes >= startMinutes && tripMinutes <= endMinutes;
  };

  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculateEstimatedDuration = (departure, destination) => {
    // Calcul approximatif basé sur les villes communes du Québec
    const distances = {
      'montreal-gatineau': '2h',
      'montreal-quebec': '3h',
      'montreal-sherbrooke': '1h30',
      'quebec-montreal': '3h',
      'gatineau-montreal': '2h',
      'laval-montreal': '30min',
      'longueuil-montreal': '20min'
    };
    
    const key = `${departure.trim()}-${destination.trim()}`;
    return distances[key] || '2h'; // Valeur par défaut
  };

  const convertPreferencesToArray = (prefs) => {
    if (!prefs) return [];
    
    const preferencesArray = [];
    
    // Préférences basées sur les vraies données API
    if (prefs.air_conditioning) preferencesArray.push("climatisation");
    if (prefs.baggage) preferencesArray.push("valise");
    if (prefs.bike_support) preferencesArray.push("vélo");
    if (prefs.ski_support) preferencesArray.push("ski");
    if (prefs.pets_allowed) preferencesArray.push("animaux");
    
    // Gestion du tabac
    if (prefs.smoking_allowed) {
      preferencesArray.push("fumeur");
    } else {
      preferencesArray.push("nonFumeur");
    }
    
    // Mode de paiement
    if (prefs.mode_payment === "cash") {
      preferencesArray.push("paiementCash");
    } else if (prefs.mode_payment === "virement") {
      preferencesArray.push("virement");
    }
    
    return preferencesArray;
  };

  const getPreferenceIcon = (pref) => {
    const icons = {
      nonFumeur: "smoke-free",
      fumeur: "smoking-rooms",
      climatisation: "ac-unit",
      valise: "luggage",
      vélo: "directions-bike",
      ski: "downhill-skiing",
      paiementCash: "payments",
      virement: "account-balance",
      animaux: "pets",
    };
    return icons[pref] || "check-circle";
  };

  const getPreferenceColor = (pref) => {
    const colors = {
      nonFumeur: "#059669",
      fumeur: "#DC2626",
      climatisation: "#3B82F6",
      valise: "#8B5CF6",
      vélo: "#10B981",
      ski: "#06B6D4",
      paiementCash: "#F59E0B",
      virement: "#6366F1",
      animaux: "#EC4899",
    };
    return colors[pref] || "#6B7280";
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
            <FontAwesome5 name="user-circle" size={16} color="#6B7280" />
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
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.reviews}>({item.reviews}+ avis)</Text>
        </View>

        <View style={styles.seatsContainer}>
          <MaterialIcons name="airline-seat-recline-normal" size={16} color="#6B7280" />
          <Text style={styles.seatsText}>{item.availableSeats} places disponibles</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.preferencesScroll}
        contentContainerStyle={styles.preferencesContainer}
      >
        {item.preferences.map((pref, index) => (
          <View key={`pref-${index}`} style={[
            styles.preferenceChip,
            { borderColor: getPreferenceColor(pref) }
          ]}>
            <MaterialIcons
              name={getPreferenceIcon(pref)}
              size={12}
              color={getPreferenceColor(pref)}
            />
            <Text style={[styles.preferenceText, { color: getPreferenceColor(pref) }]}>
              {pref}
            </Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.bookButton}
        onPress={() => navigation.navigate("DetailTrip", { trip: item })}
        activeOpacity={0.7}
      >
        <Text style={styles.bookButtonText}>Réserver</Text>
        <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderAppliedFilters = () => {
    if (!searchParams.filters || Object.keys(searchParams.filters).length === 0) {
      return null;
    }

    return (
      <View style={styles.appliedFiltersContainer}>
        <Text style={styles.appliedFiltersTitle}>Filtres appliqués:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(searchParams.filters).map(([key, value], index) => (
            <View key={index} style={styles.appliedFilterChip}>
              <Text style={styles.appliedFilterText}>
                {getFilterDisplayName(key, value)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const getFilterDisplayName = (key, value) => {
    const displayNames = {
      priceRange: `Prix: ${value.min}$ - ${value.max}$`,
      smoking: value ? 'Fumeur autorisé' : 'Non-fumeur',
      airConditioning: 'Climatisation',
      baggage: 'Valises autorisées',
      pets: 'Animaux autorisés',
      bikeSupport: 'Support vélo',
      skiSupport: 'Support ski',
      paymentMode: value === 'cash' ? 'Paiement espèces' : 'Virement',
      minSeats: `Min ${value} places`,
    };
    return displayNames[key] || `${key}: ${value}`;
  };

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
            searchParams.time,
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
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => navigation.navigate('SearchTrajet', searchParams)}
        >
          <MaterialIcons name="tune" size={24} color="#007BFF" />
        </TouchableOpacity>
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

      {renderAppliedFilters()}

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  textHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
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
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
    marginRight: 4,
  },
  verifiedBadge: {
    marginLeft: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    borderRadius: 6
  },
  verifiedText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '600'
  },
  carModel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  messageContainer: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 12,
    color: '#1E40AF',
    fontStyle: 'italic',
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
  passengersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  passengers: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
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
    borderColor: '#E5E7EB',
  },
  preferenceText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 3,
    color: '#003366',
  },
  bookButton: {
    backgroundColor: '#003366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
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
  }
});