// screen/user/AddTrajet/AddTrajetScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { styles } from './styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import GooglePlacesInput from '../../../composants/googleplace/GooglePlaceInputScreen';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { normalize } from '../../../composants/normalise/normalize';
import 'moment/locale/fr';
import { EXPO_PUBLIC_GOOGLE_API_KEY } from '@env';

moment.locale('fr');

const AddTrajetScreen = ({ navigation }) => {
  const [departure, setDeparture] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [stops, setStops] = useState([]);

  // Date + heure dans un seul objet
  const [date, setDate] = useState(new Date());

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); // 'date' | 'time'
  const [tempDate, setTempDate] = useState(new Date());

  const [multiStopMode, setMultiStopMode] = useState(false);
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');

  const API_KEY = EXPO_PUBLIC_GOOGLE_API_KEY || ''; // ⚠️ .env

  // --- Helpers de format ---
  const formatDateHuman = (d) => {
    // CORRECTION : Utiliser la date locale pour l'affichage, pas UTC
    return moment(d).format('dddd D MMMM YYYY');
  };

  const formatTimeHuman = (d) => moment(d).format('HH:mm'); // ex: 08:30

  // CORRECTION : Fonction corrigée pour éviter les décalages
  const toISODate = (d) => {
    // Utiliser les composants locaux mais formater en ISO
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const toHHmm = (d) => moment(d).format('HH:mm');

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.round((totalSeconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h} h ${m} min`;
    if (h > 0) return `${h} h`;
    return `${m} min`;
  };

  const formatDistance = (meters) => {
    if (!meters || meters <= 0) return '';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  };

  // --- Directions API (durée/distance) ---
  const getRouteInfo = async (origin, dest, waypoints = []) => {
    try {
      const encode = (lat, lng) => `${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;
      const wpParam =
        waypoints.length > 0
          ? `&waypoints=${waypoints
              .map((wp) => `${wp.latitude},${wp.longitude}`)
              .map(encodeURIComponent)
              .join('|')}`
          : '';

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encode(
        origin.latitude,
        origin.longitude
      )}&destination=${encode(dest.latitude, dest.longitude)}${wpParam}&language=fr&region=ca&mode=driving&units=metric&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data.routes) && data.routes.length > 0) {
        const legs = data.routes[0].legs || [];
        const totalSeconds = legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);
        const totalMeters = legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
        setDuration(formatDuration(totalSeconds));
        setDistance(formatDistance(totalMeters));
      } else {
        setDuration('');
        setDistance('');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setDuration('');
      setDistance('');
    }
  };

  // Recalculer durée/distance quand points changent
  useEffect(() => {
    if (departure?.latitude && arrival?.latitude) {
      const waypoints = stops
        .filter((s) => s.location?.latitude)
        .map((s) => s.location);
      getRouteInfo(departure, arrival, waypoints);
    }
  }, [departure, arrival, stops]);

  // --- Stops ---
  const addStop = () => {
    if (stops.length <= 15) {
      setStops((prev) => [...prev, { id: Date.now(), location: null }]);
    }
  };
  const updateStop = (index, location) => {
    setStops((prev) => {
      const next = [...prev];
      next[index].location = location;
      return next;
    });
  };
  const removeStop = (index) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };
  const toggleMultiStopMode = () => {
    setMultiStopMode((prev) => !prev);
    if (!multiStopMode) setStops([]); // on efface quand on active
  };

  // --- Gestion unique du Picker (date/heure) ---
  const openDatePicker = () => {
    setTempDate(date);
    setPickerMode('date');
    setPickerVisible(true);
  };
  const openTimePicker = () => {
    setTempDate(date);
    setPickerMode('time');
    setPickerVisible(true);
  };
  const onPickerChange = (event, selected) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setPickerVisible(false);
        return;
      }
      if (selected) setTempDate(selected);
    } else {
      if (selected) setTempDate(selected);
    }
  };
  
  // CORRECTION : Fonction confirmPicker corrigée
  const confirmPicker = () => {
    if (pickerMode === 'date') {
      // CORRECTION : Utiliser setFullYear au lieu de setUTCFullYear
      const next = new Date(date);
      next.setFullYear(
        tempDate.getFullYear(),
        tempDate.getMonth(), 
        tempDate.getDate()
      );
      setDate(next);
    } else {
      // Pour l'heure, on garde la même logique
      const next = new Date(date);
      next.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
      setDate(next);
    }
    setPickerVisible(false);
  };

  const isValid = !!departure && !!arrival && !!date;

  // --- Aperçu itinéraire ---
  const renderRoutePreview = () => {
    if (!departure || !arrival) return null;

    const getCityName = (loc) => loc?.city || loc?.name || loc?.description || 'Lieu inconnu';

    return (
      <View style={styles.routePreviewContainer}>
        <Text style={styles.routePreviewTitle}>Itinéraire sélectionné</Text>

        <View style={styles.routePath}>
          <Ionicons name="location-sharp" size={14} color="#4CAF50" />
          <Text style={styles.cityText}>{getCityName(departure)}</Text>

          {stops.map((stop, index) => (
            <View key={stop.id} style={styles.stopContainer}>
              <Text style={styles.arrowSymbol}>===</Text>
              <Ionicons name="car" size={14} color="#2196F3" />
              <Text style={styles.stopText}>
                Arrêt {index + 1} ({getCityName(stop.location)})
              </Text>
            </View>
          ))}

          <Text style={styles.arrowSymbol}>===</Text>
          <Ionicons name="flag" size={14} color="#FF5722" />
          <Text style={styles.cityText}>{getCityName(arrival)}</Text>
        </View>

        {duration || distance ? (
          <View style={styles.routeInfo}>
            {duration ? (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color="#003366" />
                <Text style={styles.infoText}>{duration}</Text>
              </View>
            ) : null}
            {distance ? (
              <View style={styles.infoItem}>
                <Ionicons name="speedometer-outline" size={16} color="#003366" />
                <Text style={styles.infoText}>{distance}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.infoText}>Calcul du trajet en cours...</Text>
        )}
      </View>
    );
  };

  // --- Validation avant "Continuer" : > maintenant + 10 min ---
  const canProceed = () => {
    const selectedDateTime = new Date(date);
    const now = new Date();
    const minDateTime = new Date(now.getTime() + 10 * 60000); // +10 minutes
    
    if (selectedDateTime <= minDateTime) {
      Alert.alert(
        'Heure invalide',
        "L'heure de départ doit être ultérieure d'au moins 10 minutes."
      );
      return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un trajet</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#003366" />
            <Text style={styles.sectionTitle}>Itinéraire</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Multi-arrêts</Text>
              <Switch
                value={multiStopMode}
                onValueChange={toggleMultiStopMode}
                trackColor={{ false: '#E5E7EB', true: '#003DA5' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.routeContainer}>
            {/* Départ */}
            <View style={styles.inputGroup}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.routeDotStart]} />
                <Text style={styles.inputLabel}>Point de départ</Text>
              </View>
              <View style={styles.inputWrapper}>
                <GooglePlacesInput
                  placeholder="Ville de départ"
                  onSelect={setDeparture}
                  initialValue={departure?.city}
                  style={styles.placeInput}
                  types={['(cities)']}
                  country="ca"
                />
              </View>
            </View>

            <View style={styles.connectionLine} />

            {/* Arrêts */}
            {multiStopMode &&
              stops.map((stop, index) => (
                <View key={stop.id}>
                  <View style={styles.inputGroup}>
                    <View style={styles.routePoint}>
                      <View style={[styles.routeDot, styles.routeDotStop]} />
                      <Text style={styles.inputLabel}>Arrêt {index + 1}</Text>
                    </View>
                    <View style={styles.stopInputWrapper}>
                      <View style={styles.stopInput}>
                        <GooglePlacesInput
                          placeholder="Ville d'arrêt"
                          onSelect={(location) => updateStop(index, location)}
                          style={styles.placeInput}
                          types={['(cities)']}
                          country="ca"
                        />
                      </View>
                      <TouchableOpacity onPress={() => removeStop(index)} style={styles.removeButton}>
                        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.connectionLine} />
                </View>
              ))}

            {/* Destination */}
            <View style={styles.inputGroup}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.routeDotEnd]} />
                <Text style={styles.inputLabel}>Destination</Text>
              </View>
              <View style={styles.inputWrapper}>
                <GooglePlacesInput
                  placeholder="Ville de destination"
                  onSelect={setArrival}
                  style={styles.placeInput}
                  initialValue={arrival?.city}
                  types={['(cities)']}
                  country="ca"
                />
              </View>
            </View>
          </View>

          {multiStopMode && (
            <TouchableOpacity style={styles.addStopButton} onPress={addStop}>
              <Ionicons name="add-circle-outline" size={20} color="#003DA5" />
              <Text style={styles.addStopText}>Ajouter un arrêt</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date / Heure */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#003366" />
            <Text style={styles.sectionTitle}>Date et heure de départ</Text>
          </View>

          <View style={styles.dateTimeContainer}>
            <TouchableOpacity onPress={openDatePicker} style={styles.dateTimeButton}>
              <Ionicons name="calendar-outline" size={20} color="#003366" />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatDateHuman(date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity onPress={openTimePicker} style={styles.dateTimeButton}>
              <Ionicons name="time-outline" size={20} color="#003366" />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Heure</Text>
                <Text style={styles.dateTimeValue}>{formatTimeHuman(date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {renderRoutePreview()}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>Vous pourrez définir le nombre de places et le prix à l'étape suivante</Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { opacity: isValid ? 1 : 0.5 }]}
          disabled={!isValid}
          onPress={() => {
            if (!canProceed()) return;
            
            // CORRECTION : Utiliser directement la date locale
            navigation.navigate('PickupLocation', {
              departure: normalize(departure.city),
              arrival: normalize(arrival.city),
              date: toISODate(date), // Format YYYY-MM-DD
              time: toHHmm(date),
              stops: stops || [],
            });
          }}
        >
          <Text style={styles.nextButtonText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Picker Modal (iOS & Android) */}
      <Modal
        transparent
        animationType="slide"
        visible={pickerVisible}
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={confirmPicker}>
              <Text style={styles.datePickerButton}>Valider</Text>
            </TouchableOpacity>
          </View>

          <DateTimePicker
            value={tempDate}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onPickerChange}
            minimumDate={pickerMode === 'date' ? new Date() : undefined}
            locale="fr-FR"

            // 👇 FIX: forcer le thème clair sur iOS pour que le texte soit noir
            {...(Platform.OS === 'ios' ? { themeVariant: 'light', textColor: '#000000' } : {})}

            style={styles.datePicker}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddTrajetScreen;