import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../hooks/useAuth';
import service_trip from '../../../services/service_trip/service_trip';
import service_vehicule from "../../../services/service_vehicule/service_vehicule";

const MesTrajetsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Configuration des préférences
  const PREFERENCES_CONFIG = {
    air_conditioning: { icon: "ac-unit", label: "Climatisation", color: "#3B82F6" },
    baggage: { icon: "luggage", label: "Bagages", color: "#8B5CF6" },
    bike_support: { icon: "directions-bike", label: "Support vélo", color: "#10B981" },
    pets_allowed: { icon: "pets", label: "Animaux", color: "#F59E0B" },
    ski_support: { icon: "downhill-skiing", label: "Support ski", color: "#06B6D4" },
    smoking_allowed: { icon: "smoking-rooms", label: "Fumeur", color: "#EF4444" }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les trajets du conducteur
      const driverTrips = await service_trip.get_trip_by_driver_id(user.id);
      if (driverTrips && driverTrips.length > 0) {
        // Enrichir les données avec les détails des voitures
        const enrichedTrips = await Promise.all(
          driverTrips.map(async (trip) => {
            try {
              const carDetails = await service_vehicule.getCarById(trip.car_id);
              return {
                ...trip,
                carDetails: carDetails
              };
            } catch (error) {
              console.error('Erreur lors de la récupération des détails de la voiture:', error);
              return trip;
            }
          })
        );
        setTrips(enrichedTrips);
      }

      // Charger les bookings (pour les passagers)
      // Cette partie devrait être adaptée selon votre logique de récupération des bookings
      // const userBookings = await service_booking.get_bookings_by_user_id(user.id);
      // setBookings(userBookings || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, []);

  const isUpcoming = (item) => {
    const itemDate = new Date(`${item.departure_date} ${item.departure_time}`);
    const now = new Date();
    return itemDate >= now;
  };

  const sortByDateTime = (items) => {
    return items.sort((a, b) => {
      const dateA = new Date(`${a.departure_date} ${a.departure_time}`);
      const dateB = new Date(`${b.departure_date} ${b.departure_time}`);
      return dateA - dateB;
    });
  };

  const upcomingTrips = sortByDateTime(trips.filter(isUpcoming));
  const pastTrips = sortByDateTime(trips.filter(trip => !isUpcoming(trip)));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // Affiche HH:MM
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#059669';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#DC2626';
      case 'completed':
        return '#6B7280';
      case 'ongoing':
        return '#3B82F6';
      default:
        return '#F59E0B';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      case 'ongoing':
        return 'En cours';
      default:
        return 'En attente';
    }
  };

  const handleTripLongPress = (trip) => {
    Alert.alert(
      'Actions du trajet',
      'Que souhaitez-vous faire avec ce trajet ?',
      [
        {
          text: 'Voir les détails',
          onPress: () => navigation.navigate('TripDetails', { trip })
        },
        {
          text: 'Marquer comme en cours',
          onPress: () => updateTripStatus(trip.id, 'ongoing')
        },
        {
          text: 'Marquer comme terminé',
          onPress: () => updateTripStatus(trip.id, 'completed')
        },
        {
          text: 'Annuler le trajet',
          onPress: () => updateTripStatus(trip.id, 'cancelled'),
          style: 'destructive'
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  const updateTripStatus = async (tripId, newStatus) => {
    try {
      // Ici vous devriez appeler votre service pour mettre à jour le statut
      // await service_trip.updateTripStatus(tripId, newStatus);
      
      // Mettre à jour l'état local
      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === tripId ? { ...trip, status: newStatus } : trip
        )
      );
      
      Alert.alert('Succès', `Le trajet a été marqué comme ${getStatusText(newStatus).toLowerCase()}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut du trajet');
    }
  };

  const renderTripCard = ({ item, isUpcoming = false }) => (
    <TouchableOpacity
      style={[styles.card, isUpcoming && styles.upcomingCard]}
      onLongPress={() => handleTripLongPress(item)}
      onPress={() => navigation.navigate('TripDetails', { trip: item })}
    >

      <View style={styles.cardHeader}>
        <View style={styles.timeContainer}>
          <MaterialIcons name="access-time" size={16} color="#007BFF" />
          <Text style={styles.time}>{formatTime(item.departure_time)}</Text>
        </View>
        <View style={styles.priceContainer}>
       
          <Text style={styles.time}>{formatDate(item.departure_date)}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>{item.departure_city} - {item.departure_place}</Text>
        </View>
        <View style={styles.routeLine} />
        
        {item.stops && item.stops.map((stop, index) => (
          <View key={`stop-${index}`}>
            <View style={styles.stopRow}>
              <View style={[styles.locationDot, styles.stopDot]} />
              <View style={styles.stopInfo}>
                <Text style={styles.stopPrice}>{stop.destination_city} {stop.price}$ CAD</Text>
              </View>
              
            
              
            </View>
            <View style={styles.routeLine} />
            {index < item.stops.length - 1 && <View style={styles.routeLine} />}
          </View>
        ))}

        <View style={styles.stopRow}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <Text style={styles.destinationText} numberOfLines={1}>{item.destination_city} - {item.destination_place} - {item.total_price}</Text>
           <Text style={styles.price}>{item.total_price}$</Text>

        </View>
      </View>

      <View style={styles.driverInfo}>
        <View style={styles.driverDetails}>
          <View style={styles.driverNameContainer}>
            <FontAwesome name="user-circle" size={16} color="#6B7280" />
            <Text style={styles.driverName}>Vous (Conducteur)</Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={12} color="#059669" />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          </View>
          <Text style={styles.carModel}>
            {item.carDetails ? `${item.carDetails.brand} ${item.carDetails.model} ${item.carDetails.date_of_car}` : 'Véhicule'}
          </Text>
        </View>
        <View style={styles.durationContainer}>
          <Text style={styles.paymentMode}>
            {item.preferences?.mode_payment === 'cash' ? 'Cash' : 
             item.preferences?.mode_payment === 'espèces' ? 'Espèces' : 'Virement'}
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
        <View style={styles.seatsContainer}>
          <MaterialIcons name="airline-seat-recline-normal" size={16} color="#6B7280" />
          <Text style={styles.seatsText}>
            {item.available_seats} places disponibles
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.preferencesScroll}
        contentContainerStyle={styles.preferencesContainer}
      >
        {item.preferences && Object.entries(item.preferences).map(([key, value]) => {
          if (key === 'mode_payment' || key === 'id' || !value) return null;
          
          const config = PREFERENCES_CONFIG[key] || { icon: "check-circle", label: key, color: "#6B7280" };
          return (
            <View key={key} style={[
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

      <View style={styles.actionHint}>
        <Text style={styles.actionHintText}>Appuyez longuement pour plus d'actions</Text>
      </View>
    </TouchableOpacity>
  );

  const BookingCard = ({ booking, isUpcoming = false }) => (
    <TouchableOpacity 
      style={[styles.bookingCard, isUpcoming && styles.upcomingCard]}
      onPress={() => navigation.navigate('BookingDetails', { booking })}
    >
      {isUpcoming && (
        <View style={styles.upcomingBadge}>
          <MaterialIcons name="schedule" size={12} color="#fff" />
          <Text style={styles.upcomingText}>À venir</Text>
        </View>
      )}

      <View style={styles.bookingHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.bookingDate}>
            {formatDate(booking.trip.date || booking.bookingDate)}
          </Text>
          <Text style={styles.bookingTime}>{booking.trip.time}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <View style={styles.dot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {booking.trip.departure}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.locationRow}>
          <View style={[styles.dot, styles.dotDest]} />
          <Text style={[styles.locationText, styles.destinationText]} numberOfLines={1}>
            {booking.selectedStop ? booking.selectedStop.location : booking.trip.arrival}
          </Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={12} color="#fff" />
          </View>
          <Text style={styles.driverName}>{booking.trip.driverName}</Text>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.seatsInfo}>
            <MaterialIcons name="person" size={14} color="#6B7280" />
            <Text style={styles.seatsText}>{booking.seats} place{booking.seats > 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.totalAmount}>{booking.total}$</Text>
        </View>
      </View>

      <View style={styles.bookingId}>
        <Text style={styles.bookingIdText}>Réf: {booking.bookingId}</Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = ({ title, subtitle, icon }) => (
    <View style={styles.emptyState}>
      <MaterialIcons name={icon} size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Trajets</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#003366" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Trajets à venir */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="upcoming" size={20} color="#003366" />
            <Text style={styles.sectionTitle}>Trajets à venir</Text>
            {upcomingTrips.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{upcomingTrips.length}</Text>
              </View>
            )}
          </View>

          {upcomingTrips.length > 0 ? (
            upcomingTrips.map((trip, index) => (
              renderTripCard({ item: trip, isUpcoming: true })
            ))
          ) : (
            <EmptyState 
              title="Aucun trajet à venir"
              subtitle="Vos prochains trajets apparaîtront ici"
              icon="schedule"
            />
          )}
        </View>

        {/* Historique */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={20} color="#003366" />
            <Text style={styles.sectionTitle}>Historique</Text>
            {pastTrips.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pastTrips.length}</Text>
              </View>
            )}
          </View>

          {pastTrips.length > 0 ? (
            pastTrips.map((trip, index) => (
              renderTripCard({ item: trip, isUpcoming: false })
            ))
          ) : (
            <EmptyState 
              title="Aucun historique"
              subtitle="Vos trajets passés apparaîtront ici"
              icon="history"
            />
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    backgroundColor: '#003366',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Styles pour les cartes de trajets
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  upcomingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  upcomingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginLeft: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  routeContainer: {
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#003366',
    marginRight: 12,
  },
  stopDot: {
    backgroundColor: '#F59E0B',
  },
  destinationDot: {
    backgroundColor: '#059669',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 3,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  stopInfo: {
    flex: 1,
  },
  stopLocationText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  stopPrice: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  destinationText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    flex: 1,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    color: '#059669',
    marginLeft: 2,
  },
  carModel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 24,
  },
  durationContainer: {
    alignItems: 'flex-end',
  },
  paymentMode: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1E40AF',
  },
  messageText: {
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  preferencesScroll: {
    marginTop: 12,
  },
  preferencesContainer: {
    paddingHorizontal: 0,
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#FAFAFA',
  },
  preferenceText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionHint: {
    alignItems: 'center',
    marginTop: 8,
  },
  actionHintText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Styles pour les cartes de booking (conservés pour compatibilité)
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    textTransform: 'capitalize',
  },
  bookingTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#003366',
    marginRight: 12,
  },
  dotDest: {
    backgroundColor: '#059669',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
  },
  bookingId: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  bookingIdText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MesTrajetsScreen;