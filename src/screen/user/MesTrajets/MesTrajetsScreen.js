import React, { useState, useCallback, useMemo, useRef } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,SafeAreaView,StatusBar,RefreshControl,Alert,FlatList,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../hooks/useAuth';
import service_trip from '../../../services/service_trip/service_trip';
import service_vehicule from '../../../services/service_vehicule/service_vehicule';
import service_booking from '../../../services/service_booking/service_booking';
import user_services from '../../../services/services_user/user_services';

// Configuration des préférences de trajet avec icônes et couleurs
const PREFERENCES_CONFIG = {
  air_conditioning: { icon: 'ac-unit', label: 'Climatisation', color: '#3B82F6' },
  baggage: { icon: 'luggage', label: 'Bagages', color: '#8B5CF6' },
  bike_support: { icon: 'directions-bike', label: 'Support vélo', color: '#10B981' },
  pets_allowed: { icon: 'pets', label: 'Animaux', color: '#F59E0B' },
  ski_support: { icon: 'downhill-skiing', label: 'Support ski', color: '#06B6D4' },
  smoking_allowed: { icon: 'smoking-rooms', label: 'Fumeur', color: '#EF4444' },
};

const MesTrajetsScreen = ({ navigation }) => {
  // États principaux
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('driver');
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // États pour la gestion des passagers
  const [passengersByTrip, setPassengersByTrip] = useState({});
  const [expandedTrips, setExpandedTrips] = useState({});

  // Cache pour les voitures
  const carCacheRef = useRef(new Map());

  /**
   * Récupère les informations d'une voiture avec cache
   */
  const getCarInfo = useCallback(async (carId) => {
    if (!carId) return null;
    
    const cacheKey = String(carId).trim();
    
    if (carCacheRef.current.has(cacheKey)) {
      return carCacheRef.current.get(cacheKey);
    }

    try {
      const carData = await service_vehicule.getCarById(encodeURIComponent(cacheKey));
      
      const normalizedCar = carData && typeof carData === 'object' ? {
        id: carData.id || cacheKey,
        brand: carData.brand || carData.marque || '',
        model: carData.model || carData.modele || '',
        date_of_car: carData.date_of_car || carData.year || carData.annee || '',
        color: carData.color || carData.couleur || '',
      } : null;

      carCacheRef.current.set(cacheKey, normalizedCar);
      return normalizedCar;
    } catch (error) {
      console.warn('Erreur chargement voiture:', error);
      carCacheRef.current.set(cacheKey, null);
      return null;
    }
  }, []);

  /**
   * Vérifie si un trajet est à venir
   */
  const isTripUpcoming = useCallback((trip) => {
    if (!trip?.departure_date) return false;
    
    const time = (trip?.departure_time || '').slice(0, 5);
    const [hours, minutes] = time.split(':').map(Number);
    const [year, month, day] = trip.departure_date.split('-').map(Number);
    
    const tripDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
    const now = new Date();
    
    return tripDate >= now;
  }, []);

  /**
   * Trie les trajets par date et heure
   */
  const sortTripsByDateTime = useCallback((tripsList) => {
    return tripsList.slice().sort((a, b) => {
      const getLocalDate = (trip) => {
        if (!trip?.departure_date) return new Date(0);
        
        const time = (trip?.departure_time || '').slice(0, 5);
        const [hours, minutes] = time.split(':').map(Number);
        const [year, month, day] = trip.departure_date.split('-').map(Number);
        
        return new Date(year, month - 1, day, hours || 0, minutes || 0);
      };
      
      const dateA = getLocalDate(a);
      const dateB = getLocalDate(b);
      
      return dateA - dateB;
    });
  }, []);

  /**
   * Formate une date en français
   */
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '--';
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    } catch (error) {
      console.warn('Erreur formatage date:', error);
      return dateString;
    }
  }, []);

  /**
   * Formate l'heure (HH:MM)
   */
  const formatTime = useCallback((timeString) => {
    return (timeString || '--:--').substring(0, 5);
  }, []);

  /**
   * Couleurs et textes pour les statuts
   */
  const getStatusInfo = (status) => {
    const statusConfig = {
      confirmed: { color: '#059669', text: 'Confirmé' },
      pending: { color: '#F59E0B', text: 'En attente' },
      cancelled: { color: '#DC2626', text: 'Annulé' },
      completed: { color: '#6B7280', text: 'Terminé' },
      ongoing: { color: '#3B82F6', text: 'En cours' },
    };
    
    return statusConfig[status] || { color: '#F59E0B', text: 'En attente' };
  };

  /**
   * NOUVEAU : Charge les passagers pour un trajet spécifique
   * Filtre automatiquement les réservations annulées
   */
  const loadPassengersForTrip = useCallback(async (trip) => {
    const tripId = trip?.id;
    if (!tripId) return [];

    try {
      console.log(`Chargement des passagers pour le trajet ${tripId}`);
      
      const passengersResponse = await service_booking.get_passengers_by_trip(tripId);
      
      let passengers = [];
      if (Array.isArray(passengersResponse)) {
        passengers = passengersResponse;
      } else if (passengersResponse && typeof passengersResponse === 'object') {
        passengers = passengersResponse.data || passengersResponse.passengers || passengersResponse.items || [];
      }
      
      // FILTRE : Exclure les réservations annulées
      const activePassengers = passengers.filter(passenger => 
        passenger.status !== 'cancelled'
      );
      
      console.log(`Passagers actifs trouvés: ${activePassengers.length} (total: ${passengers.length})`);

      // Enrichissement des passagers
      const enrichedPassengers = await Promise.all(
        activePassengers.map(async (passenger) => {
          try {
            let userData = null;
            if (passenger?.id_user) {
              try {
                userData = await user_services.getUserById(passenger.id_user);
              } catch (userError) {
                console.warn(`Erreur récupération utilisateur ${passenger.id_user}:`, userError.message);
                userData = {
                  first_name: passenger.first_name,
                  last_name: passenger.last_name,
                  phone_number: passenger.phone_number
                };
              }
            }
            
            let stopInfo = null;
            if (passenger?.id_stop && Array.isArray(trip.stops)) {
              stopInfo = trip.stops.find(stop => 
                String(stop.id) === String(passenger.id_stop) ||
                String(stop._id) === String(passenger.id_stop)
              );
            }
            
            return { 
              ...passenger, 
              user: userData,
              stop: stopInfo,
              first_name: passenger.first_name || userData?.first_name,
              last_name: passenger.last_name || userData?.last_name,
              phone_number: passenger.phone_number || userData?.phone_number
            };
          } catch (error) {
            console.error(`Erreur enrichissement passager ${passenger?.id}:`, error);
            return { 
              ...passenger, 
              user: null,
              stop: null,
              first_name: passenger.first_name,
              last_name: passenger.last_name,
              phone_number: passenger.phone_number
            };
          }
        })
      );

      return enrichedPassengers;
    } catch (error) {
      console.error(`Erreur chargement passagers pour trajet ${tripId}:`, error);
      return [];
    }
  }, []);

  /**
   * MODIFIÉ : Charge les trajets où l'utilisateur est conducteur
   * Charge automatiquement les passagers pour chaque trajet
   */
  const loadDriverTrips = useCallback(async () => {
    if (!user?.id) return [];
    
    try {
      const driverTrips = await service_trip.get_trip_by_driver_id(user.id);
      if (!driverTrips || driverTrips.length === 0) return [];

      // Enrichit chaque trajet avec les infos de la voiture ET les passagers
      const enrichedTrips = await Promise.all(
        driverTrips.map(async (trip) => {
          const [carInfo, passengers] = await Promise.all([
            getCarInfo(trip.car_id),
            loadPassengersForTrip(trip)
          ]);
          
          // Stocke les passagers dans l'état
          setPassengersByTrip(prev => ({
            ...prev,
            [trip.id]: {
              loading: false,
              error: null,
              items: passengers
            }
          }));
          
          return { ...trip, carInfo };
        })
      );
      
      return enrichedTrips;
    } catch (error) {
      console.error('Erreur chargement trajets conducteur:', error);
      return [];
    }
  }, [user?.id, getCarInfo, loadPassengersForTrip]);

  /**
   * Charge les réservations où l'utilisateur est passager
   */
  const loadPassengerBookings = useCallback(async () => {
    if (!user?.id) return [];
    
    try {
      const userBookings = await service_booking.get_bookings_by_user_id(user.id);
      
      const enrichedBookings = await Promise.all(
        (userBookings || []).map(async (booking) => {
          if (!booking?.id_trip) return booking;

          try {
            const tripDetails = await service_trip.get_trip_by_id(booking.id_trip);
            let driverInfo = null;
            
            if (tripDetails?.driver_id) {
              driverInfo = await user_services.getUserById(tripDetails.driver_id);
            }
            
            return { ...booking, trip: tripDetails, driver: driverInfo };
          } catch (error) {
            console.warn(`Erreur enrichissement réservation ${booking.id}:`, error);
            return booking;
          }
        })
      );
      
      return enrichedBookings;
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      return [];
    }
  }, [user?.id]);

  /**
   * Charge toutes les données
   */
  const loadAllData = useCallback(async () => {
    setLoading(true);
    
    try {
      const [driverTrips, passengerBookings] = await Promise.all([
        loadDriverTrips(),
        loadPassengerBookings(),
      ]);
      
      setTrips(driverTrips || []);
      setBookings(passengerBookings || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erreur chargement général:', error);
    } finally {
      setLoading(false);
    }
  }, [loadDriverTrips, loadPassengerBookings]);

  // Recharge les données quand l'écran est focus
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  /**
   * Gestion du pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData().finally(() => setRefreshing(false));
  }, [loadAllData]);

  /**
   * MODIFIÉ : Toggle pour déplier/replier la liste des passagers
   * Les passagers sont déjà chargés, on fait juste afficher/masquer
   */
  const toggleTripExpansion = useCallback((tripId) => {
    setExpandedTrips(prev => ({ 
      ...prev, 
      [tripId]: !prev[tripId] 
    }));
  }, []);

  /**
   * Fonctions de contact
   */
  const callPhone = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Erreur', 'Numéro de téléphone indisponible');
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`).catch(() => 
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application téléphone')
    );
  };

  const sendSMS = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Erreur', 'Numéro de téléphone indisponible');
      return;
    }
    Linking.openURL(`sms:${phoneNumber}`).catch(() => 
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application messages')
    );
  };

  /**
   * Composant pour afficher un passager
   */
  const PassengerItem = ({ passenger, trip }) => {
    const fullName = `${passenger?.first_name || ''} ${passenger?.last_name || ''}`.trim() || 'Passager';
    const phone = passenger?.phone_number || passenger?.user?.phone_number || '';
    const seats = passenger?.number_of_seats || 1;
    
    const getPassengerDestination = () => {
      if (passenger?.stop) {
        return passenger.stop.destination_city;
      }
      return trip?.destination_city || 'Destination inconnue';
    };

    const passengerDestination = getPassengerDestination();

    return (
      <TouchableOpacity
        onLongPress={() => Alert.alert(
          `Contacter ${fullName}`,
          `Destination: ${passengerDestination}\nSièges réservés: ${seats}`,
          [
            { text: '📞 Appeler', onPress: () => callPhone(phone) },
            { text: '💬 SMS', onPress: () => sendSMS(phone) },
            { text: 'Fermer', style: 'cancel' }
          ]
        )}
        style={styles.passengerItem}
      >
        <View style={styles.passengerAvatar}>
          <FontAwesome name="user" size={12} color="#fff" />
        </View>
        
        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>{fullName}</Text>
          <Text style={styles.passengerDetails}>
            → {passengerDestination} • {seats} siège{seats > 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.passengerStatus}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusInfo(passenger.status).color }
          ]} />
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Affiche les préférences sous forme de chips
   */
  const renderPreferenceChips = (preferences) => {
    if (!preferences || typeof preferences !== 'object') return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.preferencesContainer}
        contentContainerStyle={styles.preferencesContent}
      >
        {Object.entries(preferences).map(([key, value]) => {
          if (key === 'mode_payment' || key === 'id' || !value) return null;
          
          const config = PREFERENCES_CONFIG[key] || { 
            icon: 'check-circle', 
            label: key, 
            color: '#6B7280' 
          };

          return (
            <View key={key} style={[styles.preferenceChip, { borderColor: config.color }]}>
              <MaterialIcons name={config.icon} size={12} color={config.color} />
              <Text style={[styles.preferenceText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  /**
   * Met à jour le statut d'un trajet
   */
  const updateTripStatus = async (tripId, newStatus) => {
    try {
      await service_trip.update_trip_status_by_ongoing(tripId, newStatus);
      setTrips(prev => prev.map(trip => 
        trip.id === tripId ? { ...trip, status: newStatus } : trip
      ));
      
      const statusInfo = getStatusInfo(newStatus);
      Alert.alert('Succès', `Le trajet a été marqué comme ${statusInfo.text.toLowerCase()}`);
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de mettre à jour le statut');
    }
  };

  /**
   * Carte d'un trajet (conducteur)
   */
  const TripCard = ({ trip }) => {
    const isUpcomingTrip = isTripUpcoming(trip);
    const isExpanded = !!expandedTrips[trip.id];
    const statusInfo = getStatusInfo(trip.status);
    const stops = Array.isArray(trip.stops) ? trip.stops : [];
    
    // Récupère les passagers depuis l'état
    const passengersData = passengersByTrip[trip.id] || { loading: false, error: null, items: [] };
    const activePassengersCount = passengersData.items.length;

    return (
      <TouchableOpacity
        style={[styles.card, isUpcomingTrip && styles.upcomingCard]}
        onLongPress={() => {
          Alert.alert(
            'Actions du trajet',
            'Que souhaitez-vous faire ?',
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
              { text: 'Annuler', style: 'cancel' },
            ]
          );
        }}
        onPress={() => navigation.navigate('TripDetails', { trip })}
      >
        {/* En-tête avec heure et date */}
        <View style={styles.cardHeader}>
          <View style={styles.timeContainer}>
            <MaterialIcons name="access-time" size={16} color="#007BFF" />
            <Text style={styles.timeText}>{formatTime(trip.departure_time)}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(trip.departure_date)}</Text>
        </View>

        {/* Itinéraire */}
        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <View style={styles.departureDot} />
            <Text style={styles.locationText}>
              {trip.departure_city} - {trip.departure_place}
            </Text>
          </View>
          <View style={styles.routeLine} />

          {stops.map((stop, index) => (
            <View key={stop.id || `stop-${index}`}>
              <View style={styles.stopRow}>
                <View style={styles.stopDot} />
                <View style={styles.stopInfo}>
                  <Text style={styles.stopText}>{stop.destination_city}</Text>
                  <Text style={styles.stopPrice}>
                    {Number(stop.price || 0).toFixed(2)}$ CAD
                  </Text>
                </View>
              </View>
              <View style={styles.routeLine} />
            </View>
          ))}

          <View style={styles.locationRow}>
            <View style={styles.destinationDot} />
            <Text style={styles.destinationText}>
              {trip.destination_city} - {trip.destination_place}
            </Text>
            <Text style={styles.totalPrice}>
              {Number(trip.total_price || 0).toFixed(2)}$
            </Text>
          </View>
        </View>

        {/* Informations conducteur et voiture */}
        <View style={styles.driverSection}>
          <View style={styles.driverInfo}>
            <View style={styles.driverHeader}>
              <FontAwesome name="user-circle" size={16} color="#6B7280" />
              <Text style={styles.driverName}>Vous (Conducteur)</Text>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={12} color="#059669" />
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            </View>
            <Text style={styles.carText}>
              {trip.carInfo 
                ? `${trip.carInfo.brand} ${trip.carInfo.model} ${trip.carInfo.date_of_car || ''}`.trim()
                : 'Véhicule non spécifié'
              }
            </Text>
          </View>
          
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentText}>
              {trip.preferences?.mode_payment === 'cash' ? 'Cash' : 'Virement'}
            </Text>
          </View>
        </View>

        {/* Message du conducteur */}
        {trip.message && (
          <View style={styles.messageContainer}>
            <MaterialIcons name="message" size={14} color="#1E40AF" />
            <Text style={styles.messageText}>{trip.message}</Text>
          </View>
        )}

        {/* Places et statut */}
        <View style={styles.cardFooter}>
          <View style={styles.seatsContainer}>
            <MaterialIcons name="airline-seat-recline-normal" size={16} color="#6B7280" />
            <Text style={styles.seatsText}>
              {trip.available_seats} place{trip.available_seats > 1 ? 's' : ''} disponible{trip.available_seats > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>

        {/* Préférences */}
        {renderPreferenceChips(trip.preferences)}

        {/* Section passagers - MODIFIÉE */}
        <View style={styles.passengersSection}>
          <TouchableOpacity
            style={styles.passengersToggle}
            onPress={() => toggleTripExpansion(trip.id)}
          >
            <MaterialIcons name="group" size={18} color="#003366" />
            <Text style={styles.passengersToggleText}>
              Passagers ({activePassengersCount})
            </Text>
            <MaterialIcons 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={20} 
              color="#003366" 
            />
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.passengersList}>
              {passengersData.loading ? (
                <View style={styles.loadingContainer}>
                  <MaterialIcons name="autorenew" size={16} color="#6B7280" />
                  <Text style={styles.loadingText}>Chargement des passagers…</Text>
                </View>
              ) : passengersData.error ? (
                <Text style={styles.errorText}>{passengersData.error}</Text>
              ) : activePassengersCount === 0 ? (
                <Text style={styles.emptyText}>Aucun passager actif pour ce trajet</Text>
              ) : (
                passengersData.items.map((passenger) => (
                  <PassengerItem 
                    key={passenger.id} 
                    passenger={passenger}
                    trip={trip}
                  />
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Appuyez longuement pour plus d'actions</Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Carte d'une réservation (passager)
   */
  const BookingCard = ({ booking }) => {
    const trip = booking.trip;
    const driver = booking.driver;
    const statusInfo = getStatusInfo(booking.status);

    const cancelBooking = async () => {
      try {
        await service_booking.cancel_booking(booking.id);
        console.log('Réservation annulée:', booking.id);
        loadAllData();
        Alert.alert('Succès', 'Votre réservation a été annulée');
      } catch (error) {
        console.error('Erreur annulation réservation:', error);
        Alert.alert('Erreur', booking.id);
      }
    };

    const showBookingDetails = () => {
      Alert.alert(
        'Détails de la réservation',
        `📍 Trajet: ${trip?.departure_city} → ${trip?.destination_city}\n` +
        `👥 Places réservées: ${booking.number_of_seats || 1}\n` +
        `💰 Montant total: ${Number(booking.base_total || 0).toFixed(2)}$ CAD\n` +
        `💳 Paiement: ${trip?.preferences?.mode_payment === 'cash' ? 'Cash' : 'Virement'}\n` +
        `👤 Chauffeur: ${driver?.first_name || ''} ${driver?.last_name || ''}\n` +
        `📱 Contact: ${driver?.phone_number || 'Non disponible'}\n` +
        `📊 Statut: ${statusInfo.text}`,
        [{ text: 'Fermer', style: 'cancel' }]
      );
    };

    const handleBookingActions = () => {
      const actions = [
        { 
          text: '📋 Voir détails', 
          onPress: showBookingDetails 
        },
      ];

      if (booking.status === 'pending' || booking.status === 'confirmed') {
        actions.push({
          text: '❌ Annuler', 
          onPress: () => {
            Alert.alert(
              'Confirmer l\'annulation',
              'Êtes-vous sûr de vouloir annuler cette réservation ?',
              [
                { text: 'Non', style: 'cancel' },
                { text: 'Oui', onPress: cancelBooking, style: 'destructive' }
              ]
            );
          },
          style: 'destructive'
        });
      }

      actions.push({ text: 'Fermer', style: 'cancel' });

      Alert.alert(
        'Actions réservation',
        'Que souhaitez-vous faire ?',
        actions
      );
    };

    const getDestinationDisplay = () => {
      if (booking?.id_stop && Array.isArray(trip?.stops)) {
        const matchedStop = trip.stops.find(stop => stop.id === booking.id_stop);
        if (matchedStop) {
          return `${trip?.departure_city} → ${matchedStop.destination_city}`;
        }
      }
      return `${trip?.departure_city} → ${trip?.destination_city}`;
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={handleBookingActions}
        onPress={showBookingDetails}
      >
        <Text style={styles.routeTitle}>
          {getDestinationDisplay()}
        </Text>
        
        <Text style={styles.departureText}>
          Départ: {trip ? formatDate(trip.departure_date) : '--'} à {trip ? formatTime(trip.departure_time) : '--:--'}
        </Text>
        
        <Text style={styles.driverText}>
          Chauffeur: {driver ? `${driver.first_name} ${driver.last_name}` : 'Non spécifié'}
        </Text>
        
        <View style={styles.bookingQuickInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Places:</Text>
            <Text style={styles.infoValue}>{booking.number_of_seats || 1}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Montant:</Text>
            <Text style={styles.infoValue}>{Number(booking.base_total || 0).toFixed(2)}$ CAD</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paiement:</Text>
            <Text style={styles.infoValue}>
              {trip?.preferences?.mode_payment === 'cash' ? 'Cash' : 'Virement'}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
          
          <Text style={styles.actionHint}>
            Tap pour détails • Long press pour actions
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * État vide
   */
  const EmptyState = ({ title, description, icon }) => (
    <View style={styles.emptyState}>
      <MaterialIcons name={icon} size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );

  // Filtrage des trajets
  const upcomingTrips = useMemo(() => 
    sortTripsByDateTime(trips.filter(isTripUpcoming)), 
    [trips, sortTripsByDateTime, isTripUpcoming]
  );
  
  const pastTrips = useMemo(() => 
    sortTripsByDateTime(trips.filter(trip => !isTripUpcoming(trip))), 
    [trips, sortTripsByDateTime, isTripUpcoming]
  );

  /**
   * Section conducteur
   */
  const DriverSection = () => (
    <View style={styles.section}>
      {/* Trajets à venir */}
      <View style={styles.subsection}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="upcoming" size={20} color="#003366" />
          <Text style={styles.sectionTitle}>Trajets à venir</Text>
          {upcomingTrips.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{upcomingTrips.length}</Text>
            </View>
          )}
        </View>

        {upcomingTrips.length === 0 ? (
          <EmptyState 
            title="Aucun trajet à venir" 
            description="Vos prochains trajets apparaîtront ici"
            icon="schedule"
          />
        ) : (
          <FlatList
            data={upcomingTrips}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <TripCard trip={item} />}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Historique */}
      <View style={styles.subsection}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="history" size={20} color="#003366" />
          <Text style={styles.sectionTitle}>Historique</Text>
          {pastTrips.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{pastTrips.length}</Text>
            </View>
          )}
        </View>

        {pastTrips.length === 0 ? (
          <EmptyState 
            title="Aucun trajet passé" 
            description="Vos trajets terminés apparaîtront ici"
            icon="history"
          />
        ) : (
          <FlatList
            data={pastTrips}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <TripCard trip={item} />}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );

  /**
   * Section passager
   */
  const PassengerSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="confirmation-number" size={20} color="#003366" />
        <Text style={styles.sectionTitle}>Mes réservations</Text>
        {bookings.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{bookings.length}</Text>
          </View>
        )}
      </View>

      {bookings.length === 0 ? (
        <EmptyState 
          title="Aucune réservation" 
          description="Vos trajets réservés apparaîtront ici"
          icon="confirmation-number"
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <BookingCard booking={item} />}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Trajets</Text>
        <View style={styles.headerActions}>
          {lastUpdated && (
            <Text style={styles.updateTime}>
              MAJ {lastUpdated.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          )}
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color="#003366" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'driver' && styles.activeTab
          ]}
          onPress={() => setActiveTab('driver')}
        >
          <MaterialIcons 
            name="directions-car" 
            size={18} 
            color={activeTab === 'driver' ? '#fff' : '#003366'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'driver' && styles.activeTabText
          ]}>
            Je conduis
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'passenger' && styles.activeTab
          ]}
          onPress={() => setActiveTab('passenger')}
        >
          <MaterialIcons 
            name="event-seat" 
            size={18} 
            color={activeTab === 'passenger' ? '#fff' : '#003366'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'passenger' && styles.activeTabText
          ]}>
            Je voyage
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <EmptyState 
            title="Chargement..." 
            description="Récupération de vos trajets"
            icon="hourglass-empty"
          />
        ) : activeTab === 'driver' ? (
          <DriverSection />
        ) : (
          <PassengerSection />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateTime: {
    color: '#6B7280',
    fontSize: 12,
    marginRight: 8,
  },
  refreshButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    margin: 12,
    padding: 4,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#003366',
  },
  tabText: {
    marginLeft: 6,
    color: '#003366',
    fontWeight: '700',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  subsection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginLeft: 8,
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#003366',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  upcomingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
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
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeContainer: {
    marginVertical: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  departureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#003366',
    marginRight: 12,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: 12,
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginRight: 12,
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
    marginVertical: 4,
  },
  stopInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
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
  totalPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
  },
  driverSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverHeader: {
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
  carText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 24,
  },
  paymentContainer: {
    alignItems: 'flex-end',
  },
  paymentText: {
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
    padding: 12,
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
  preferencesContainer: {
    marginTop: 12,
  },
  preferencesContent: {
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
  passengersSection: {
    marginTop: 12,
  },
  passengersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
  },
  passengersToggleText: {
    color: '#003366',
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  passengersList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  passengerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  passengerDetails: {
    color: '#6B7280',
    fontSize: 12,
  },
  passengerStatus: {
    marginLeft: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    padding: 8,
    fontSize: 14,
  },
  emptyText: {
    color: '#6B7280',
    padding: 8,
    fontStyle: 'italic',
    fontSize: 14,
  },
  hintContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  hintText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 8,
  },
  departureText: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 4,
  },
  driverText: {
    color: '#059669',
    fontSize: 14,
    marginBottom: 8,
  },
  bookingQuickInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionHint: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MesTrajetsScreen;