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
  Dimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import GooglePlacesInput from '../../../composants/googleplace/GooglePlaceInputScreen';
import { Ionicons } from '@expo/vector-icons';

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
      const waypointsParam = waypoints.length > 0 
        ? `&waypoints=${waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|')}` 
        : '';
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsParam}&key=${API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.routes.length > 0) {
        setDuration(data.routes[0].legs.reduce((acc, leg) => 
          acc + leg.duration.text, ''));
        setDistance(data.routes[0].legs.reduce((acc, leg) => 
          acc + leg.distance.text, ''));
      }
    } catch (error) {
      console.error('Error fetching route:', error);
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

  const isValid = departure && arrival && date;

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
                trackColor={{ false: '#E5E7EB', true: '#FFCC00' }}
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

            {multiStopMode && stops.map((stop, index) => (
              <View key={stop.id}>
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
            ))}

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
              <Ionicons name="add-circle-outline" size={20} color="#FFCC00" />
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
              date,
              stops: stops || [],
            })
          }
        >
          <Text style={styles.nextButtonText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color="#003366" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(new Date(selected));
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(event, selected) => {
            setShowTimePicker(false);
            if (selected) {
              const updated = new Date(date);
              updated.setHours(selected.getHours());
              updated.setMinutes(selected.getMinutes());
              setDate(updated);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginLeft: 8,
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
    color: '#003366',
    fontSize: 14,
  },
  routeContainer: {
    position: 'relative',
  },
  inputGroup: {
    marginBottom: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  routeDotStart: {
    backgroundColor: '#4CAF50',
  },
  routeDotStop: {
    backgroundColor: '#2196F3',
  },
  routeDotEnd: {
    backgroundColor: '#FF5722',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inputWrapper: {
    marginLeft: 24,
  },
  stopInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
  },
  stopInput: {
    flex: 1,
    marginRight: 12,
  },
  placeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  removeButton: {
    padding: 4,
  },
  connectionLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginBottom: 8,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFCC00',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addStopText: {
    marginLeft: 8,
    color: '#FFCC00',
    fontWeight: '500',
  },
  dateTimeContainer: {
    gap: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dateTimeContent: {
    flex: 1,
    marginLeft: 12,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#003366',
  },
  routePreviewContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routePreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 12,
  },
  routePath: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#003366',
  },
  stopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  arrowSymbol: {
    color: '#003366',
    marginHorizontal: 4,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  infoText: {
    marginLeft: 8,
    color: '#003366',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFCC00',
    padding: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginRight: 8,
  },
});

export default AddTrajetScreen;