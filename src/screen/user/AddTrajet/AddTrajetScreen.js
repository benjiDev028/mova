import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  FlatList
} from 'react-native';
import {styles} from "./styles";
import DateTimePicker from '@react-native-community/datetimepicker';
import GooglePlacesInput from '../../../composants/googleplace/GooglePlaceInputScreen';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const AddTrajetScreen = ({ navigation }) => {
  const [departure, setDeparture] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [stops, setStops] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [multiStopMode, setMultiStopMode] = useState(false);
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');

  const API_KEY = 'AIzaSyBwx5yyNbJYbt_TLBEozRXPl3oZD4wH-DE';

  const getRouteInfo = async (origin, destination, waypoints = []) => {
    try {
      const waypointsParam =
        waypoints.length > 0
          ? `&waypoints=${waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|')}`
          : '';

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsParam}&key=${API_KEY}`
      );

      const data = await response.json();

      if (data.routes.length > 0) {
        const totalDuration = data.routes[0].legs
          .map(leg => leg.duration.text)
          .join(' + ');
        const totalDistance = data.routes[0].legs
          .map(leg => leg.distance.text)
          .join(' + ');

        setDuration(totalDuration);
        setDistance(totalDistance);
      }
    } catch (error) {
      console.error('Erreur lors du calcul de la route:', error);
    }
  };

  useEffect(() => {
    if (departure && arrival) {
      const waypoints = stops.filter(stop => stop.location).map(stop => stop.location);
      getRouteInfo(departure, arrival, waypoints);
    }
  }, [departure, arrival, stops]);

  const addStop = () => {
    if (stops.length < 5) {
      setStops([...stops, { id: Date.now(), location: null }]);
    }
  };

  const updateStop = (index, location) => {
    const updated = [...stops];
    updated[index].location = location;
    setStops(updated);
  };

  const removeStop = (index) => {
    const updated = stops.filter((_, i) => i !== index);
    setStops(updated);
  };

  const toggleMultiStopMode = () => {
    setMultiStopMode(previousState => !previousState);
    if (!multiStopMode) {
      setStops([]);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) {
        setDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setDate(selectedDate);
      }
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (selectedTime) {
        const updated = new Date(date);
        updated.setHours(selectedTime.getHours());
        updated.setMinutes(selectedTime.getMinutes());
        setDate(updated);
      }
    } else {
      if (selectedTime) {
        const updated = new Date(date);
        updated.setHours(selectedTime.getHours());
        updated.setMinutes(selectedTime.getMinutes());
        setDate(updated);
      }
    }
  };

  const isValid = departure && arrival && date;

  const formatDate = (date) => {
    return moment(date).format('dddd D MMMM YYYY');
  };

  const formatTime = (date) => {
    return moment(date).format('HH:mm');
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'android') {
      return (
        showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )
      );
    }

    return (
      <Modal
        transparent
        animationType="slide"
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.datePickerButton}>Valider</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
            locale="fr-FR"
            textColor="#003366"
            style={styles.datePicker}
          />
        </View>
      </Modal>
    );
  };

  const renderTimePicker = () => {
    if (Platform.OS === 'android') {
      return (
        showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )
      );
    }

    return (
      <Modal
        transparent
        animationType="slide"
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Text style={styles.datePickerButton}>Valider</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
            locale="fr-FR"
            textColor="#003366"
            style={styles.datePicker}
          />
        </View>
      </Modal>
    );
  };

  const renderRoutePreview = () => {
    if (!departure || !arrival) return null;
  
    const getCityName = (loc) => loc?.city || loc?.name || loc?.description || "Lieu inconnu";
  
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
              <Text style={styles.stopText}>Arrêt {index + 1} ({getCityName(stop.location)})</Text>
            </View>
          ))}
  
          <Text style={styles.arrowSymbol}>===</Text>
          <Ionicons name="flag" size={14} color="#FF5722" />
          <Text style={styles.cityText}>{getCityName(arrival)}</Text>
        </View>
  
        {(duration || distance) ? (
          <View style={styles.routeInfo}>
            {duration && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color="#003366" />
                <Text style={styles.infoText}>{duration}</Text>
              </View>
            )}
            {distance && (
              <View style={styles.infoItem}>
                <Ionicons name="speedometer-outline" size={16} color="#003366" />
                <Text style={styles.infoText}>{distance}</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.infoText}>Calcul du trajet en cours...</Text>
        )}
      </View>
    );
  };

  const renderStopItem = ({ item, index }) => (
    <View>
      <View style={styles.inputGroup}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.routeDotStop]} />
          <Text style={styles.inputLabel}>Arrêt {index + 1}</Text>
        </View>
        <View style={styles.stopInputWrapper}>
          <View style={styles.stopInput}>
            <GooglePlacesInput
              placeholder={`Ville d'arrêt`}
              onSelect={(location) => updateStop(index, location)}
              style={styles.placeInput}
              types={['(cities)']}
              country="ca"
            />
          </View>
          <TouchableOpacity 
            onPress={() => removeStop(index)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.connectionLine} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
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
            <View style={styles.inputGroup}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.routeDotStart]} />
                <Text style={styles.inputLabel}>Point de départ</Text>
              </View>
              <View style={styles.inputWrapper}>
                <GooglePlacesInput
                  placeholder="Ville de départ"
                  onSelect={setDeparture}
                  style={styles.placeInput}
                  types={['(cities)']}
                  country="ca"
                />
              </View>
            </View>

            <View style={styles.connectionLine} />

            {multiStopMode && (
              <FlatList
                data={stops}
                renderItem={renderStopItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}

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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#003366" />
            <Text style={styles.sectionTitle}>Date et heure de départ</Text>
          </View>

          <View style={styles.dateTimeContainer}>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)} 
              style={styles.dateTimeButton}
            >
              <Ionicons name="calendar-outline" size={20} color="#003366" />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowTimePicker(true)} 
              style={styles.dateTimeButton}
            >
              <Ionicons name="time-outline" size={20} color="#003366" />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Heure</Text>
                <Text style={styles.dateTimeValue}>{formatTime(date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {renderRoutePreview()}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Vous pourrez définir le nombre de places et le prix à l'étape suivante
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { opacity: isValid ? 1 : 0.5 }]}
          disabled={!isValid}
          onPress={() =>
            navigation.navigate('PickupLocation', {
              departure,
              arrival,
              date: formatDate(date),
              time: formatTime(date),
              stops: stops || [],
            })
          }
        >
          <Text style={styles.nextButtonText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderDatePicker()}
      {renderTimePicker()}
    </SafeAreaView>
  );
};

export default AddTrajetScreen;