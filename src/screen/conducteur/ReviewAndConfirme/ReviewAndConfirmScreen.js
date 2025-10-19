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
  TouchableWithoutFeedback,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';

const API_BASE = 'http://192.168.2.13:8003';
const CREATE_TRIP_URL = `${API_BASE}/tp/create_trip`;

/* ============================== Helpers ============================== */
const safeString = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value?.description) return value.description;
  if (value?.name) return value.name;
  return fallback;
};

// CORRECTION : Simplifier la conversion de date - utiliser directement le format YYYY-MM-DD
function convertFrenchDateToISO(frenchDateStr) {
  if (!frenchDateStr) return null;
  
  // Si c'est déjà au format YYYY-MM-DD, le retourner directement
  if (/^\d{4}-\d{2}-\d{2}$/.test(frenchDateStr)) {
    return frenchDateStr;
  }
  
  const mois = {
    janvier: '01', février: '02', fevrier: '02',
    mars: '03', avril: '04', mai: '05', juin: '06',
    juillet: '07', août: '08', aout: '08',
    septembre: '09', octobre: '10', novembre: '11',
    décembre: '12', decembre: '12',
  };
  
  try {
    const parts = frenchDateStr
      .toLowerCase()
      .replace(',', '')
      .split(' ')
      .filter(Boolean);

    const year = parts[parts.length - 1];
    const monthLabel = parts[parts.length - 2];
    const dayRaw = parts[parts.length - 3];
    const day = String(parseInt(dayRaw, 10)).padStart(2, '0');
    const month = mois[monthLabel];
    
    if (!month) throw new Error(`Mois invalide: ${monthLabel}`);
    
    return `${year}-${month}-${day}`;
  } catch {
    // Si échec, essayer de parser avec Date
    try {
      const date = new Date(frenchDateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      return null;
    }
    return null;
  }
}

// CORRECTION : Utiliser la date locale pour l'affichage
const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'Date non spécifiée';
  
  try {
    // Si c'est déjà au format YYYY-MM-DD, le parser directement
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // CORRECTION : Utiliser la date locale pour l'affichage
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
      });
    }
    
    // Essayer la conversion française
    const iso = convertFrenchDateToISO(dateString);
    if (iso) {
      const [year, month, day] = iso.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
      });
    }
    
    return dateString;
  } catch {
    return dateString;
  }
};

const normalizeVehicle = (vehicleData) => {
  if (!vehicleData) {
    return {
      brand: 'Marque inconnue',
      model: 'Modèle inconnu',
      type: 'Type inconnu',
      seats: 4,
      color: 'Couleur inconnue',
      year: 'Année inconnue',
      licensePlate: 'Non spécifiée',
      id: undefined, // UUID attendu
    };
  }
  return {
    brand: safeString(vehicleData.brand, 'Marque inconnue'),
    model: safeString(vehicleData.model, 'Modèle inconnu'),
    type: safeString(vehicleData.type_of_car ?? vehicleData.type, 'Type inconnu'),
    seats: Number(vehicleData.seats) || 4,
    color: safeString(vehicleData.color, 'Couleur inconnue'),
    year: vehicleData.date_of_car ? safeString(vehicleData.date_of_car) : 'Année inconnue',
    licensePlate: safeString(vehicleData.license_plate, 'Non spécifiée'),
    id: vehicleData.id, // UUID
  };
};

const normalizeStops = (stops) => {
  if (!Array.isArray(stops)) return [];
  return stops.map((stop, index) => {
    const city = safeString(stop?.city ?? stop?.location, `Arrêt ${index + 1}`);
    const place = safeString(stop?.location, city);
    const price = typeof stop?.price === 'number' ? stop.price : Number(stop?.price || 0);
    const time = safeString(stop?.time, '--:--');
    return {
      id: stop?.id ?? index + 1,
      city,
      place,
      price,
      time,
    };
  });
};

/** UI -> Backend payload (car_id est un UUID string) */
const buildStopsForApi = (stops, finalArrivalCity) => {
  const arr = Array.isArray(stops) ? stops : [];
  const arrivalNorm = (finalArrivalCity || '').trim().toLowerCase();

  // Normalise et filtre
  const cleaned = arr
    .map((s, i) => ({
      destination_city: safeString(s.city ?? s.location, '').trim(),
      price: Number(s.price || 0),
    }))
    .filter(s =>
      s.destination_city &&
      s.price > 0 &&                              // évite 0 / NaN
      s.destination_city.toLowerCase() !== arrivalNorm // évite la destination finale
    );

  // dédup simple par nom de ville
  const seen = new Set();
  const unique = [];
  for (const s of cleaned) {
    const k = s.destination_city.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      unique.push(s);
    }
  }
  return unique;
};

const toApiPayload = ({ ui, userId }) => {
  // CORRECTION : Utiliser directement la date au format YYYY-MM-DD
  const dateISO = ui.date; // Déjà au bon format depuis AddTrajetScreen
  const carId = ui.carId; // UUID string
  
  if (!carId || typeof carId !== 'string') {
    throw new Error('Véhicule invalide : car_id (UUID) manquant');
  }

  const payload = {
    driver_id: userId,
    car_id: carId,
    departure_city: ui.departure,
    destination_city: ui.arrival,
    departure_place: ui.pickupLocation,
    destination_place: ui.dropoffLocation,
    departure_date: dateISO,                // 'YYYY-MM-DD' (OK pour Pydantic Date)
    departure_time: ui.time,                // 'HH:mm' (OK pour Pydantic Time)
    total_price: Number(ui.finalPrice || 0),
    available_seats: Number(ui.seats || 1),
    message: ui.driverMessage || '',
    status: 'pending',
    preferences: {
      baggage: !!ui.preferences.luggage,
      ski_support: !!ui.preferences.skiRack,
      bike_support: !!ui.preferences.bikeRack,
      air_conditioning: !!ui.preferences.ac,
      pets_allowed: !!ui.preferences.pets,
      smoking_allowed: !!ui.preferences.smoker,
      mode_payment: ui.preferences.paymentMethod === 'card' ? 'virement' : 'cash',
    },
  };

  const stopsForApi = buildStopsForApi(ui.originalStops, ui.arrival);
  if (stopsForApi.length > 0) {
    payload.stops = stopsForApi; // [{ destination_city, price }]
  }

  return payload;
};

/* ============================== Component ============================== */
const ReviewAndConfirmScreen = ({ navigation, route }) => {
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
  } = route.params || {};

  const { user, id: ctxUserId, authToken } = useAuth();

  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [tempMessage, setTempMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [tripData, setTripData] = useState(() => {
    const initialData = route.params?.updatedData || {};
    const normalizedVehicle = normalizeVehicle(initialData.vehicle || vehicle);

    // UUID conservé tel quel
    const initialCarId =
      (initialData.vehicle && initialData.vehicle.id) ||
      (vehicle && vehicle.id) ||
      (route?.params?.vehicleId); // au cas où on passe un id séparé

    return {
      // itinéraire
      departure: safeString(initialData.departure || departure, 'Départ inconnu'),
      arrival: safeString(initialData.arrival || arrival, 'Destination inconnue'),
      pickupLocation: safeString(initialData.pickupLocation || pickupLocation, 'Point de prise en charge non spécifié'),
      dropoffLocation: safeString(initialData.dropoffLocation || dropoffLocation, 'Point de dépôt non spécifié'),
      date: safeString(initialData.date || date, 'Date non spécifiée'),
      time: safeString(initialData.time || time, 'Heure non spécifiée'),

      // véhicule
      vehicle: normalizedVehicle,               // pour l'affichage
      originalVehicle: initialData.vehicle || vehicle, // brut
      carId: initialCarId,                      // <- UUID string, source de vérité pour le POST

      // places
      seats: typeof (initialData.availableSeats ?? availableSeats) === 'number'
        ? (initialData.availableSeats ?? availableSeats)
        : 1,
      totalSeats: initialData.totalSeats ?? totalSeats ?? normalizedVehicle.seats,

      // arrêts / prix
      stops: normalizeStops(initialData.stops || stops),
      originalStops: initialData.stops || stops,
      finalPrice: typeof (initialData.destinationPrice ?? destinationPrice) === 'number'
        ? (initialData.destinationPrice ?? destinationPrice)
        : Number(initialData.destinationPrice ?? destinationPrice ?? 0),

      // préférences
      preferences: {
        smoker: !!(initialData.preferences?.smoker ?? preferences?.smoker),
        pets: !!(initialData.preferences?.pets ?? preferences?.pets),
        luggage: !!(initialData.preferences?.luggage ?? preferences?.luggage),
        bikeRack: !!(initialData.preferences?.bikeRack ?? preferences?.bikeRack),
        skiRack: !!(initialData.preferences?.skiRack ?? preferences?.skiRack),
        ac: !!(initialData.preferences?.ac ?? preferences?.ac),
        paymentMethod: safeString(initialData.preferences?.paymentMethod ?? preferences?.paymentMethod, 'card'),
      },

      driverMessage: initialData.driverMessage || '',
    };
  });

  // Retour d'un écran d'édition
  useEffect(() => {
    if (route.params?.updatedData) {
      const updatedData = route.params.updatedData;

      setTripData(prev => {
        const next = { ...prev };

        if (updatedData.editingSection === 'vehicle') {
          const nv = normalizeVehicle(updatedData.vehicle);
          next.vehicle = nv;
          next.originalVehicle = updatedData.vehicle;
          next.seats = updatedData.availableSeats ?? prev.seats;
          next.totalSeats = updatedData.totalSeats ?? prev.totalSeats;
          // MAJ de l'UUID ici
          next.carId = (updatedData.vehicle && updatedData.vehicle.id) || prev.carId;
        }

        if (updatedData.editingSection === 'preferences') {
          next.preferences = { ...prev.preferences, ...updatedData.preferences };
        }

        if (updatedData.editingSection === 'route') {
          next.departure = safeString(updatedData.departure, prev.departure);
          next.arrival = safeString(updatedData.arrival, prev.arrival);
          next.pickupLocation = safeString(updatedData.pickupLocation, prev.pickupLocation);
          next.dropoffLocation = safeString(updatedData.dropoffLocation, prev.dropoffLocation);
          next.date = safeString(updatedData.date, prev.date);
          next.time = safeString(updatedData.time, prev.time);
          next.stops = normalizeStops(updatedData.stops || []);
          next.originalStops = updatedData.stops || [];
          if (typeof updatedData.destinationPrice === 'number') {
            next.finalPrice = updatedData.destinationPrice;
          }
        }

        if (updatedData.driverMessage !== undefined) {
          next.driverMessage = updatedData.driverMessage;
        }

        return next;
      });

      navigation.setParams({ updatedData: null });
    }
  }, [route.params?.updatedData, navigation]);

  /* ============================== Validation ============================== */
  const validateTripData = useCallback(() => {
    const errs = [];
    if (!tripData.departure || tripData.departure === 'Départ inconnu') errs.push('Point de départ manquant');
    if (!tripData.arrival || tripData.arrival === 'Destination inconnue') errs.push('Destination manquante');
    if (!tripData.date || tripData.date === 'Date non spécifiée') errs.push('Date manquante');
    if (!tripData.time || tripData.time === 'Heure non spécifiée') errs.push('Heure manquante');
    if (Number(tripData.seats) < 1) errs.push('Nombre de places invalide');
    if (Number(tripData.finalPrice) < 0) errs.push('Prix invalide');
    if (!tripData.carId || typeof tripData.carId !== 'string') errs.push('Véhicule manquant (UUID)');
    return errs;
  }, [tripData]);

  /* ========== Packaging pour nav quand on édite une section ========== */
  const createCompleteDataPackage = useCallback(() => ({
    departure: tripData.departure,
    arrival: tripData.arrival,
    pickupLocation: tripData.pickupLocation,
    dropoffLocation: tripData.dropoffLocation,
    date: tripData.date,
    time: tripData.time,
    vehicle: tripData.originalVehicle,
    availableSeats: tripData.seats,
    totalSeats: tripData.totalSeats,
    stops: tripData.originalStops,
    destinationPrice: tripData.finalPrice,
    preferences: tripData.preferences,
    driverMessage: tripData.driverMessage,
    carId: tripData.carId, // on garde l'UUID pour les écrans suivants
    returnScreen: 'ReviewAndConfirmScreen',
    editMode: true,
    preserveAllData: true,
  }), [tripData]);

  const handleEdit = useCallback((section) => {
    const completeData = createCompleteDataPackage();
    switch (section) {
      case 'route':
        Alert.alert(
          "Modifier l'itinéraire",
          "Pour modifier l'itinéraire, vous allez revenir à la sélection.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Continuer",
              onPress: () => {
                navigation.navigate('ClientTabs', {
                  screen: 'AddTrajetTab',
                  params: { ...completeData, editingSection: 'route' },
                });
              },
            },
          ]
        );
        break;
      case 'vehicle':
        navigation.navigate('VehiculeSelection', { ...completeData, editingSection: 'vehicle' });
        break;
      case 'preferences':
        navigation.navigate('Preferences', { ...completeData, editingSection: 'preferences' });
        break;
      default:
        Alert.alert("Erreur", "Section de modification non reconnue");
    }
  }, [createCompleteDataPackage, navigation]);

  /* ============================== Modale message ============================== */
  const openMessageModal = useCallback(() => {
    setTempMessage(tripData.driverMessage || '');
    setMessageModalVisible(true);
  }, [tripData.driverMessage]);

  const saveMessage = useCallback(() => {
    setTripData(prev => ({ ...prev, driverMessage: tempMessage }));
    setMessageModalVisible(false);
  }, [tempMessage]);

  /* ============================== Publication ============================== */
  const confirmTrip = useCallback(() => {
    const validationErrors = validateTripData();
    if (validationErrors.length) {
      Alert.alert(
        "Données incomplètes",
        `Veuillez corriger :\n• ${validationErrors.join('\n• ')}`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Confirmer le trajet",
      "Voulez-vous publier ce trajet ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setIsPublishing(true);
            try {
              const driverId = user?.id ?? ctxUserId; // string/number OK selon ton backend
              const payload = toApiPayload({ ui: tripData, userId: driverId });

              // Debug utile
              console.log('[CREATE_TRIP] payload ->:', JSON.stringify(payload));

              const res = await fetch(CREATE_TRIP_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify(payload),
              });

              const result = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(result?.message || 'Erreur lors de la publication');
              }

              Alert.alert(
                "Succès",
                "Votre trajet a été publié avec succès !",
                [{
                  text: "OK",
                  onPress: () => navigation.navigate('ClientTabs', { screen: 'MesTrajetsTab' }),
                }]
              );
            } catch (e) {
              Alert.alert("Erreur", e?.message || "Une erreur s'est produite");
            } finally {
              setIsPublishing(false);
            }
          },
        },
      ]
    );
  }, [validateTripData, tripData, user, ctxUserId, authToken, navigation]);

  /* ============================== UI ============================== */
  const renderStopItem = useCallback(({ item }) => (
    <View style={styles.routePoint}>
      <View style={styles.routeLine} />
      <View style={[styles.routeDot, styles.stopDot]} />
      <View style={styles.routeInfo}>
        <Text style={styles.routeCity}>{item.city}</Text>
        <Text style={styles.routeLocation}>{item.place}</Text>
        <Text style={styles.stopPrice}>
          {item.price > 0 ? `${item.price}$ • ` : ''}{item.time}
        </Text>
      </View>
    </View>
  ), []);

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
            <TouchableOpacity onPress={() => setMessageModalVisible(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#003DA5" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.messageInput}
            value={tempMessage}
            onChangeText={setTempMessage}
            placeholder="Écrivez un message personnalisé pour vos passagers…"
            multiline
            numberOfLines={4}
            maxLength={200}
            placeholderTextColor="#999"
          />

          <Text style={styles.characterCount}>{tempMessage.length}/200 caractères</Text>

          <TouchableOpacity style={styles.saveButton} onPress={saveMessage} activeOpacity={0.7}>
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#003DA5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vérification</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Intro */}
        <View style={styles.headerContent}>
          <Text style={styles.subtitle}>Dernière étape !</Text>
          <Text style={styles.description}>Vérifiez que tout est correct avant d'annoncer.</Text>
        </View>

        {/* Contenu */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Itinéraire */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="route" size={22} color="#003DA5" />
                <Text style={styles.cardTitle}>Itinéraire</Text>
              </View>
              <TouchableOpacity onPress={() => handleEdit('route')} style={styles.editButton}>
                <MaterialIcons name="edit" size={20} color="#003DA5" />
              </TouchableOpacity>
            </View>

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
              {/* Départ */}
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.startDot]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeCity}>{tripData.departure}</Text>
                  <Text style={styles.routeLocation}>{tripData.pickupLocation}</Text>
                </View>
              </View>

              {/* Arrêts */}
              <FlatList
                data={tripData.stops}
                renderItem={renderStopItem}
                keyExtractor={(item) => `stop-${item.id}`}
                scrollEnabled={false}
              />

              {/* Arrivée */}
              <View style={styles.routePoint}>
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, styles.endDot]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeCity}>{tripData.arrival}</Text>
                  <Text style={styles.routeLocation}>{tripData.dropoffLocation}</Text>
                  <View style={styles.finalPriceContainer}>
                    <Text style={styles.finalPrice}>{Number(tripData.finalPrice).toFixed(2)}$</Text>
                    <Text style={styles.finalPriceLabel}>Destination finale</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Véhicule */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="directions-car" size={22} color="#003DA5" />
                <Text style={styles.cardTitle}>Véhicule</Text>
              </View>
              <TouchableOpacity onPress={() => handleEdit('vehicle')} style={styles.editButton}>
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

          {/* Préférences */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="settings" size={22} color="#003DA5" />
                <Text style={styles.cardTitle}>Préférences</Text>
              </View>
              <TouchableOpacity onPress={() => handleEdit('preferences')} style={styles.editButton}>
                <MaterialIcons name="edit" size={20} color="#003DA5" />
              </TouchableOpacity>
            </View>

            <View style={styles.preferencesContainer}>
              {Object.entries(tripData.preferences).map(([key, value]) => {
                if (key === 'paymentMethod') {
                  return (
                    <View key={key} style={styles.preferenceItem}>
                      <View style={[styles.preferenceIcon, styles.activePreferenceIcon]}>
                        <MaterialIcons name={value === 'card' ? 'credit-card' : 'attach-money'} size={18} color="#fff" />
                      </View>
                      <Text style={styles.preferenceText}>Paiement: {value === 'card' ? 'Carte' : 'cash'}</Text>
                    </View>
                  );
                }
                const labelMap = {
                  smoker: 'Fumeur',
                  pets: 'Animaux acceptés',
                  luggage: 'Bagages',
                  bikeRack: 'Porte-vélo',
                  skiRack: 'Porte-skis',
                  ac: 'Climatisation',
                };
                const iconMap = {
                  smoker: value ? 'smoking-rooms' : 'smoke-free',
                  pets: 'pets',
                  luggage: 'luggage',
                  bikeRack: 'directions-bike',
                  skiRack: 'downhill-skiing',
                  ac: 'ac-unit',
                };
                return (
                  <View key={key} style={styles.preferenceItem}>
                    <View style={[styles.preferenceIcon, value && styles.activePreferenceIcon]}>
                      <MaterialIcons name={iconMap[key]} size={18} color={value ? '#fff' : '#666'} />
                    </View>
                    <Text style={styles.preferenceText}>{labelMap[key]}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Message passagers */}
          <TouchableOpacity style={styles.messageCard} onPress={openMessageModal} activeOpacity={0.7}>
            <View style={styles.messageHeader}>
              <MaterialIcons name="message" size={20} color="#003DA5" />
              <Text style={styles.messageLabel}>Message aux passagers</Text>
              <MaterialIcons name="edit" size={18} color="#003DA5" />
            </View>
            <Text style={styles.messageText}>
              {tripData.driverMessage || 'Ajouter un message personnalisé pour vos passagers…'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* CTA */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, isPublishing && styles.confirmButtonDisabled]}
            onPress={confirmTrip}
            activeOpacity={0.7}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialIcons name="check-circle" size={24} color="#fff" />
            )}
            <Text style={styles.confirmButtonText}>
              {isPublishing ? 'Publication en cours…' : 'Annoncer le trajet'}
            </Text>
          </TouchableOpacity>
        </View>

        {renderMessageModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ============================== Styles ============================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  wrapper: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 10,
    backgroundColor: '#fff',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#003DA5' },

  headerContent: {
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#003DA5', marginBottom: 4 },
  description: { fontSize: 14, color: '#666', lineHeight: 20 },

  scrollContainer: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#003DA5', marginLeft: 8 },
  editButton: { padding: 4 },

  datetimeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingLeft: 8 },
  datetimeItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
  },
  datetimeText: { fontSize: 14, color: '#333', marginLeft: 8 },

  routeContainer: { paddingLeft: 8 },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12, marginTop: 4 },
  startDot: { backgroundColor: '#4CAF50' },
  stopDot: { backgroundColor: '#FFCC00' },
  endDot: { backgroundColor: '#FF6B6B' },
  routeLine: { position: 'absolute', left: 5, top: 16, width: 2, height: 40, backgroundColor: '#ddd' },
  routeInfo: { flex: 1, paddingBottom: 8 },
  routeCity: { fontSize: 16, fontWeight: '600', color: '#333' },
  routeLocation: { fontSize: 14, color: '#666', marginTop: 2 },
  routeTime: { fontSize: 14, color: '#003DA5', marginTop: 4 },
  stopPrice: { fontSize: 14, color: '#003DA5', marginTop: 4 },

  finalPriceContainer: { marginTop: 4 },
  finalPrice: { fontSize: 18, fontWeight: 'bold', color: '#003DA5' },
  finalPriceLabel: { fontSize: 12, color: '#666', marginTop: 2 },

  vehicleContainer: { paddingLeft: 8 },
  vehicleName: { fontSize: 16, fontWeight: '600', color: '#333' },
  vehicleDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  vehicleDetail: { fontSize: 14, color: '#666' },
  seatsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  seatsText: { fontSize: 14, color: '#666', marginLeft: 6 },

  preferencesContainer: { paddingLeft: 8 },
  preferenceItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  preferenceIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  activePreferenceIcon: { backgroundColor: '#003DA5' },
  preferenceText: { fontSize: 14, color: '#333' },

  messageCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  messageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  messageLabel: { fontSize: 16, fontWeight: '600', color: '#003DA5', marginLeft: 8, flex: 1 },
  messageText: { fontSize: 14, color: '#666', lineHeight: 20, fontStyle: 'italic' },

  buttonContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: -2 },
  },
  confirmButton: {
    backgroundColor: '#003DA5', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  confirmButtonDisabled: { backgroundColor: '#ccc' },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginLeft: 8 },

  bottomSpacing: { height: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  messageModalContainer: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  messageModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  messageModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#003DA5' },
  closeButton: { padding: 4 },
  messageInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 16,
    textAlignVertical: 'top', minHeight: 120, backgroundColor: '#f8f9fa',
  },
  characterCount: { textAlign: 'right', fontSize: 12, color: '#666', marginTop: 8, marginBottom: 20 },
  saveButton: {
    backgroundColor: '#003DA5', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default ReviewAndConfirmScreen;