import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
  FlatList,
  KeyboardAvoidingView,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import ClientTabs from '../../../navigation/client/ClientTabs';

const ReviewAndConfirmScreen = ({ navigation, route }) => {
  // Extract all parameters from route.params
  const {
    departure,
    arrival,
    pickupLocation,
    dropoffLocation,
    date,
    time,
    preferences = {},
    stops = [],
    destinationPrice,
    vehicle,
    availableSeats,
    totalSeats,
  } = route.params;

    const { user } = useAuth();
  // Utility function to safely handle strings
  const safeString = (value, fallback = '') => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value?.description) return value.description;
    return fallback;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
      return dateString;
    }
  };

  // Normalize vehicle data
  const normalizeVehicle = (vehicleData) => {
    if (!vehicleData) return {
      brand: 'Marque inconnue',
      model: 'Modèle inconnu',
      type: 'Type inconnu',
      seats: 4,
      color: 'Couleur inconnue',
      year: 'Année inconnue',
      licensePlate: 'Non spécifiée'
    };

    return {
      brand: safeString(vehicleData.brand, 'Marque inconnue'),
      model: safeString(vehicleData.model, 'Modèle inconnu'),
      type: safeString(vehicleData.type, 'Type inconnu'),
      seats: vehicleData.seats || 4,
      color: safeString(vehicleData.color, 'Couleur inconnue'),
      year: vehicleData.date_of_car ? safeString(vehicleData.date_of_car) : 'Année inconnue',
      licensePlate: safeString(vehicleData.license_plate, 'Non spécifiée')
    };
  };

  // Normalize stops data
  const normalizeStops = (stops) => {
    if (!Array.isArray(stops)) return [];
    return stops.map((stop, index) => ({
      id: stop.id || index + 1,
      location: safeString(stop.location, `Arrêt ${index + 1}`),
      city: safeString(stop.city, `Arrêt ${index + 1}`),
      price: typeof stop.price === 'number' ? stop.price : 0,
      time: safeString(stop.time, '--:--')
    }));
  };


  const [tripData, setTripData] = useState(() => {
    // Initialiser avec toutes les données reçues ou mises à jour
    const initialData = route.params?.updatedData || {};
    
    return {
      departure: safeString(initialData.departure || departure, 'Départ inconnu'),
      arrival: safeString(initialData.arrival || arrival, 'Destination inconnue'),
      pickupLocation: safeString(initialData.pickupLocation || pickupLocation, 'Point de prise en charge non spécifié'),
      dropoffLocation: safeString(initialData.dropoffLocation || dropoffLocation, 'Point de dépôt non spécifié'),
      date: safeString(initialData.date || date, 'Date non spécifiée'),
      time: safeString(initialData.time || time, 'Heure non spécifiée'),
      vehicle: normalizeVehicle(initialData.vehicle || vehicle),
      originalVehicle: initialData.vehicle || vehicle, // Garder l'objet original
      seats: typeof (initialData.availableSeats || availableSeats) === 'number' ? (initialData.availableSeats || availableSeats) : 1,
      stops: normalizeStops(initialData.stops || stops),
      originalStops: initialData.stops || stops, // Garder les arrêts originaux
      preferences: {
        smoker: !!(initialData.preferences?.smoker || preferences?.smoker),
        pets: !!(initialData.preferences?.pets || preferences?.pets),
        luggage: !!(initialData.preferences?.luggage || preferences?.luggage),
        bikeRack: !!(initialData.preferences?.bikeRack || preferences?.bikeRack),
        skiRack: !!(initialData.preferences?.skiRack || preferences?.skiRack),
        ac: !!(initialData.preferences?.ac || preferences?.ac),
        paymentMethod: safeString(initialData.preferences?.paymentMethod || preferences?.paymentMethod, 'card')
      },
      finalPrice: typeof (initialData.destinationPrice || destinationPrice) === 'number' ? (initialData.destinationPrice || destinationPrice) : 0,
      driverMessage: initialData.driverMessage || '',
      totalSeats: initialData.totalSeats || totalSeats
    };
  });

  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [tempMessage, setTempMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // AMÉLIORATION: Fonction pour créer un package complet des données
  const createCompleteDataPackage = useCallback(() => {
    return {
      // Données principales
      departure: tripData.departure,
      arrival: tripData.arrival,
      pickupLocation: tripData.pickupLocation,
      dropoffLocation: tripData.dropoffLocation,
      date: tripData.date,
      time: tripData.time,
      
      // Données véhicule
      vehicle: tripData.originalVehicle,
      availableSeats: tripData.seats,
      totalSeats: tripData.totalSeats,
      
      // Données arrêts et prix
      stops: tripData.originalStops,
      destinationPrice: tripData.finalPrice,
      
      // Préférences
      preferences: tripData.preferences,
      
      // Message
      driverMessage: tripData.driverMessage,
      
      // Métadonnées pour la navigation
      returnScreen: 'ReviewAndConfirmScreen',
      editMode: true,
      preserveAllData: true // Flag pour indiquer de préserver toutes les données
    };
  }, [tripData]);

  // Handle edit navigation avec conservation complète des données
  const handleEdit = useCallback((section) => {
    const completeData = createCompleteDataPackage();

    switch (section) {
      case 'route':
        Alert.alert(
          "Modifier l'itinéraire",
          "Pour modifier l'itinéraire, vous devez retourner à l'écran principal et refaire la sélection.",
          [
            { text: "Annuler", style: "cancel" },
            { 
              text: "Continuer", 
              onPress: () => {
                navigation.navigate('ClientTabs', { 
                  screen: 'AddTrajetTab',
                  params: { 
                    ...completeData,
                    editingSection: 'route'
                  }
                });
              }
            }
          ]
        );
        break;

      case 'vehicle':
        navigation.navigate('VehiculeSelection', {
          ...completeData,
          editingSection: 'vehicle'
        });
        break;

      case 'preferences':
        navigation.navigate('Preferences', {
          ...completeData,
          editingSection: 'preferences'
        });
        break;

      default:
        Alert.alert("Erreur", "Section de modification non reconnue");
    }
  }, [createCompleteDataPackage, navigation]);

  // AMÉLIORATION: Mise à jour robuste des données lors du retour
  useEffect(() => {
    if (route.params?.updatedData) {
      const updatedData = route.params.updatedData;
      
      setTripData(prevData => {
        const newData = { ...prevData };
        
        // Mise à jour sélective selon la section éditée
        if (updatedData.editingSection === 'vehicle') {
          newData.vehicle = normalizeVehicle(updatedData.vehicle);
          newData.originalVehicle = updatedData.vehicle;
          newData.seats = updatedData.availableSeats || prevData.seats;
          newData.totalSeats = updatedData.totalSeats || prevData.totalSeats;
        }
        
        if (updatedData.editingSection === 'preferences') {
          newData.preferences = {
            ...prevData.preferences,
            ...updatedData.preferences
          };
        }
        
        if (updatedData.editingSection === 'route') {
          newData.departure = safeString(updatedData.departure, prevData.departure);
          newData.arrival = safeString(updatedData.arrival, prevData.arrival);
          newData.pickupLocation = safeString(updatedData.pickupLocation, prevData.pickupLocation);
          newData.dropoffLocation = safeString(updatedData.dropoffLocation, prevData.dropoffLocation);
          newData.date = safeString(updatedData.date, prevData.date);
          newData.time = safeString(updatedData.time, prevData.time);
          newData.stops = normalizeStops(updatedData.stops || []);
          newData.originalStops = updatedData.stops || [];
          newData.finalPrice = typeof updatedData.destinationPrice === 'number' ? updatedData.destinationPrice : prevData.finalPrice;
        }
        
        // Toujours préserver le message du conducteur
        if (updatedData.driverMessage !== undefined) {
          newData.driverMessage = updatedData.driverMessage;
        }
        
        return newData;
      });
      
      // Nettoyer les paramètres après utilisation
      navigation.setParams({ updatedData: null });
    }
  }, [route.params?.updatedData, navigation]);

  // AMÉLIORATION: Vérifier l'intégrité des données avant publication
  const validateTripData = useCallback(() => {
    const errors = [];
    
    if (!tripData.departure || tripData.departure === 'Départ inconnu') {
      errors.push('Point de départ manquant');
    }
    
    if (!tripData.arrival || tripData.arrival === 'Destination inconnue') {
      errors.push('Destination manquante');
    }
    
    if (!tripData.date || tripData.date === 'Date non spécifiée') {
      errors.push('Date manquante');
    }
    
    if (!tripData.time || tripData.time === 'Heure non spécifiée') {
      errors.push('Heure manquante');
    }
    
    if (tripData.seats < 1) {
      errors.push('Nombre de places invalide');
    }
    
    if (tripData.finalPrice < 0) {
      errors.push('Prix invalide');
    }
    
    return errors;
  }, [tripData]);
const formatDateForDatabase = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    // Format YYYY-MM-DD pour la base de données
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return dateString;
  }
};
  // Preference icon component
  const PreferenceIcon = React.memo(({ type, active }) => {
    const icons = {
      smoker: active ? 'smoking-rooms' : 'smoke-free',
      pets: 'pets',
      luggage: 'luggage',
      bikeRack: 'directions-bike',
      skiRack: 'downhill-skiing',
      ac: 'ac-unit',
      paymentMethod: tripData.preferences.paymentMethod === 'card' ? 'credit-card' : 'attach-money'
    };

    return (
      <View style={[styles.preferenceIcon, active && styles.activePreferenceIcon]}>
        <MaterialIcons 
          name={icons[type]} 
          size={18} 
          color={active ? "#fff" : "#666"} 
        />
      </View>
    );
  });
function convertFrenchDateToISO(frenchDateStr) {
  const mois = {
    janvier: '01',
    février: '02',
    fevrier: '02',
    mars: '03',
    avril: '04',
    mai: '05',
    juin: '06',
    juillet: '07',
    août: '08',
    aout: '08',
    septembre: '09',
    octobre: '10',
    novembre: '11',
    décembre: '12',
    decembre: '12',
  };

  try {
    const parts = frenchDateStr
      .toLowerCase()
      .replace(',', '')
      .split(' ')
      .filter(Boolean);

    if (parts.length < 3) throw new Error('Format invalide');

    const day = parts[1].padStart(2, '0');
    const month = mois[parts[2]];
    const year = parts[3];

    if (!month) throw new Error(`Mois invalide: ${parts[2]}`);

    return `${year}-${month}-${day}`;
  } catch (err) {
    console.error('Erreur de conversion de date:', err.message);
    return null;
  }
}

  // Message modal handlers
  const openMessageModal = useCallback(() => {
    setTempMessage(tripData.driverMessage || '');
    setMessageModalVisible(true);
  }, [tripData.driverMessage]);

  const saveMessage = useCallback(() => {
    setTripData(prev => ({ ...prev, driverMessage: tempMessage }));
    setMessageModalVisible(false);
  }, [tempMessage]);

  // Confirm and publish trip avec validation
const confirmTrip = useCallback(async () => {
  // Valider les données avant publication
  const validationErrors = validateTripData();
  
  if (validationErrors.length > 0) {
    Alert.alert(
      "Données incomplètes",
      `Veuillez corriger les erreurs suivantes :\n• ${validationErrors.join('\n• ')}`,
      [{ text: "OK" }]
    );
    return;
  }

  Alert.alert(
    "Confirmer le trajet",
    "Voulez-vous publier ce trajet de covoiturage ?",
    [
      { text: "Annuler", style: "cancel" },
      { 
        text: "Confirmer", 
        onPress: async () => {
          setIsPublishing(true);
          try {
            // Préparer les données pour l'API
            const tripDataForApi = {
              driver_id: user.id, // Supposons que vous avez l'ID de l'utilisateur
              car_id: tripData.originalVehicle.id,
              departure_city: tripData.departure,
              destination_city: tripData.arrival,
              departure_place: tripData.pickupLocation,
              destination_place: tripData.dropoffLocation,
              departure_time: tripData.time,
              departure_date: convertFrenchDateToISO(date),
              total_price: tripData.finalPrice,
              available_seats: tripData.seats,
              message: tripData.driverMessage || '',
              status: "pending",
              preferences: {
                baggage: tripData.preferences.luggage,
                pets_allowed: tripData.preferences.pets,
                smoking_allowed: tripData.preferences.smoker,
                air_conditioning: tripData.preferences.ac,
                bike_support: tripData.preferences.bikeRack,
                ski_support: tripData.preferences.skiRack,
                mode_payment: tripData.preferences.paymentMethod === 'card' ? 'virement' : 'cash'
              },
              stops: tripData.stops.map(stop => ({
                destination_city: stop.location,
                price: stop.price
              }))
            };

            console.log('Data being sent to API:', tripDataForApi);

            // Envoyer les données à l'API
            const response = await fetch('http://192.168.2.13:8002/tp/create_trip', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Si vous utilisez l'authentification
              },
              body: JSON.stringify(tripDataForApi)
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.message || 'Erreur lors de la publication');
            }

            Alert.alert(
              "Succès!", 
              "Votre trajet a été publié avec succès!",
              [{ text: "OK", onPress: () => navigation.navigate(ClientTabs,'HomeTab') }]
            );
          } catch (error) {
            console.error('Publication error:', error);
            Alert.alert(
              "Erreur", 
              error.message || "Une erreur s'est produite lors de la publication"
            );
          } finally {
            setIsPublishing(false);
          }
        }
      }
    ]
  );
}, [navigation, tripData, validateTripData, user]);
  // Render stop item

  const renderStopItem = useCallback(({ item }) => (
    <View style={styles.routePoint}>
      <View style={styles.routeLine} />
      <View style={[styles.routeDot, styles.stopDot]} />
      <View style={styles.routeInfo}>
        <Text style={styles.routeCity}>{item.city}</Text>
        <Text style={styles.routeLocation}>{item.location}</Text>
        <Text style={styles.stopPrice}>
          {item.price > 0 ? `${item.price}$ • ` : ''}{item.time}
        </Text>
      </View>
    </View>
  ), []);

  // Render message modal
  const renderMessageModal = () => (
    <Modal
      visible={messageModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setMessageModalVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={() => setMessageModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.messageModalContainer}>
          <View style={styles.messageModalHeader}>
            <Text style={styles.messageModalTitle}>Message aux passagers</Text>
            <TouchableOpacity 
              onPress={() => setMessageModalVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#003DA5" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.messageInput}
            value={tempMessage}
            onChangeText={setTempMessage}
            placeholder="Écrivez un message personnalisé pour vos passagers..."
            multiline
            numberOfLines={4}
            maxLength={200}
            placeholderTextColor="#999"
          />
          
          <Text style={styles.characterCount}>
            {tempMessage.length}/200 caractères
          </Text>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={saveMessage}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.wrapper}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#003DA5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vérification</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Subtitle */}
        <View style={styles.headerContent}>
          <Text style={styles.subtitle}>Dernière étape!</Text>
          <Text style={styles.description}>
            Vérifiez que les détails ci-dessous sont exacts avant d'annoncer.
          </Text>
        </View>

        {/* Main content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Route Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="route" size={22} color="#003DA5" />
                <Text style={styles.cardTitle}>Itinéraire</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleEdit('route')}
                style={styles.editButton}
              >
                <MaterialIcons name="edit" size={20} color="#003DA5" />
              </TouchableOpacity>
            </View>
            
            {/* Date and time */}
            <View style={styles.datetimeContainer}>
              <View style={styles.datetimeItem}>
                <MaterialIcons name="calendar-today" size={16} color="#666" />
                <Text style={styles.datetimeText}>{formatDateForDisplay(tripData.date)}</Text>
              </View>
              <View style={styles.datetimeItem}>
                <MaterialIcons name="access-time" size={16} color="#666" />
                <Text style={styles.datetimeText}>{tripData.time}</Text>
              </View>
            </View>
            
            <View style={styles.routeContainer}>
              {/* Departure point */}
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.startDot]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeCity}>{tripData.departure}</Text>
                  <Text style={styles.routeLocation}>{tripData.pickupLocation}</Text>
                </View>
              </View>
              
              {/* Stops */}
              <FlatList
                data={tripData.stops}
                renderItem={renderStopItem}
                keyExtractor={item => `stop-${item.id}`}
                scrollEnabled={false}
              />
              
              {/* Arrival point */}
              <View style={styles.routePoint}>
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, styles.endDot]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeCity}>{tripData.arrival}</Text>
                  <Text style={styles.routeLocation}>{tripData.dropoffLocation}</Text>
                  <View style={styles.finalPriceContainer}>
                    <Text style={styles.finalPrice}>{tripData.finalPrice}$</Text>
                    <Text style={styles.finalPriceLabel}>Destination finale</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Vehicle Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="directions-car" size={22} color="#003DA5" />
                <Text style={styles.cardTitle}>Véhicule</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleEdit('vehicle')}
                style={styles.editButton}
              >
                <MaterialIcons name="edit" size={20} color="#003DA5" />
              </TouchableOpacity>
            </View>
            <View style={styles.vehicleContainer}>
              <Text style={styles.vehicleName}>
                {tripData.vehicle.brand} {tripData.vehicle.model}
              </Text>
              
              <View style={styles.vehicleDetailsRow}>
                <Text style={styles.vehicleDetail}>Type: {tripData.vehicle.type}</Text>
                <Text style={styles.vehicleDetail}>Année: {tripData.vehicle.year}</Text>
              </View>
              
              <View style={styles.vehicleDetailsRow}>
                <Text style={styles.vehicleDetail}>Couleur: {tripData.vehicle.color}</Text>
                <Text style={styles.vehicleDetail}>Plaque: {tripData.vehicle.licensePlate}</Text>
              </View>
              
              <View style={styles.seatsContainer}>
                <MaterialIcons name="airline-seat-recline-normal" size={16} color="#666" />
                <Text style={styles.seatsText}>
                  {tripData.seats} place{tripData.seats > 1 ? 's' : ''} disponible{tripData.seats > 1 ? 's' : ''} sur {tripData.vehicle.seats}
                </Text>
              </View>
            </View>
          </View>

          {/* Preferences Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="settings" size={22} color="#003DA5" />
                <Text style={styles.cardTitle}>Préférences</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleEdit('preferences')}
                style={styles.editButton}
              >
                <MaterialIcons name="edit" size={20} color="#003DA5" />
              </TouchableOpacity>
            </View>
            <View style={styles.preferencesContainer}>
              {Object.entries(tripData.preferences).map(([key, value]) => {
                if (key === 'paymentMethod') return (
                  <View key={key} style={styles.preferenceItem}>
                    <PreferenceIcon type={key} active={true} />
                    <Text style={styles.preferenceText}>
                      Paiement: {value === 'card' ? 'Carte' : 'cash'}
                    </Text>
                  </View>
                );
                
                return (
                  <View key={key} style={styles.preferenceItem}>
                    <PreferenceIcon type={key} active={value} />
                    <Text style={styles.preferenceText}>
                      {{
                        smoker: 'Fumeur',
                        pets: 'Animaux acceptés',
                        luggage: 'Bagages',
                        bikeRack: 'Porte-vélo',
                        skiRack: 'Porte-skis',
                        ac: 'Climatisation'
                      }[key]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Passenger Message */}
          <TouchableOpacity 
            style={styles.messageCard}
            onPress={openMessageModal}
            activeOpacity={0.7}
          >
            <View style={styles.messageHeader}>
              <MaterialIcons name="message" size={20} color="#003DA5" />
              <Text style={styles.messageLabel}>Message aux passagers</Text>
              <MaterialIcons name="edit" size={18} color="#003DA5" />
            </View>
            <Text style={styles.messageText}>
              {tripData.driverMessage || 'Ajouter un message personnalisé pour vos passagers...'}
            </Text>
          </TouchableOpacity>

          {/* Spacing for fixed button */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.confirmButton, isPublishing && styles.confirmButtonDisabled]} 
            onPress={confirmTrip}
            activeOpacity={0.7}
            disabled={isPublishing}
          >
            <MaterialIcons name="check-circle" size={24} color="#fff" />
            <Text style={styles.confirmButtonText}>
              {isPublishing ? 'Publication en cours...' : 'Annoncer le trajet'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Message edit modal */}
        {renderMessageModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003DA5',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003DA5',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003DA5',
    marginLeft: 8,
  },
  editButton: {
    padding: 4,
  },
  // Nouveaux styles pour la date et heure
  datetimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingLeft: 8,
  },
  datetimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  datetimeText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  routeContainer: {
    paddingLeft: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  startDot: {
    backgroundColor: '#4CAF50',
  },
  stopDot: {
    backgroundColor: '#FFCC00',
  },
  endDot: {
    backgroundColor: '#FF6B6B',
  },
  routeLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
  },
  routeInfo: {
    flex: 1,
    paddingBottom: 8,
  },
  routeCity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  routeTime: {
    fontSize: 14,
    color: '#003DA5',
    marginTop: 4,
  },
  stopPrice: {
    fontSize: 14,
    color: '#003DA5',
    marginTop: 4,
  },
  finalPriceContainer: {
    marginTop: 4,
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003DA5',
  },
  finalPriceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  vehicleContainer: {
    paddingLeft: 8,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  vehicleDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  seatsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  preferencesContainer: {
    paddingLeft: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  preferenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activePreferenceIcon: {
    backgroundColor: '#003DA5',
  },
  preferenceText: {
    fontSize: 14,
    color: '#333',
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003DA5',
    marginLeft: 8,
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  confirmButton: {
    backgroundColor: '#003DA5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  // Styles pour la modale
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  messageModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  messageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003DA5',
  },
  closeButton: {
    padding: 4,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    backgroundColor: '#f8f9fa',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#003DA5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ReviewAndConfirmScreen;