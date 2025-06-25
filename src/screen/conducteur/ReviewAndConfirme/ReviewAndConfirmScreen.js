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
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ReviewAndConfirmScreen = ({ navigation, route }) => {
  // Fonction utilitaire pour sécuriser les chaînes de caractères
  const safeString = (value, fallback = '') => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value?.description) return value.description;
    return fallback;
  };

  // Fonction pour normaliser les données des étapes
  const normalizeStops = (stops) => {
    if (!Array.isArray(stops)) {
      return [
        {
          id: 1,
          location: 'À côté de l\'arribus (station Jules-Dallaire)',
          city: 'Québec',
          price: 15,
          time: '12:30 PM'
        }
      ];
    }

    return stops.map((stop, index) => ({
      id: stop.id || index + 1,
      location: safeString(stop.location, 'Adresse non spécifiée'),
      city: safeString(stop.city, 'Ville inconnue'),
      price: typeof stop.price === 'number' ? stop.price : 0,
      time: safeString(stop.time, '--:--')
    }));
  };

  // Initialisation des données du trajet
  const [tripData, setTripData] = useState({
    departure: safeString(route.params?.departure, 'Québec'),
    arrival: safeString(route.params?.arrival, 'Montréal'),
    date: safeString(route.params?.date, new Date().toLocaleDateString('fr-FR')),
    time: safeString(route.params?.time, '12:00 PM'),
    pickupLocation: safeString(route.params?.pickupLocation, 'Gare du Palais, Québec'),
    dropoffLocation: safeString(route.params?.dropoffLocation, 'Station Saint-Michel - Esso, Montréal'),
    vehicle: route.params?.vehicle || {
      type: 'Honda Civic 2021',
      color: 'Bleu',
      plate: 'JUM 832'
    },
    seats: typeof route.params?.seats === 'number' ? route.params.seats : 3,
    stops: normalizeStops(route.params?.stops),
    preferences: {
      smoker: !!route.params?.preferences?.smoker,
      pets: !!route.params?.preferences?.pets,
      luggage: !!route.params?.preferences?.luggage,
      bikeRack: !!route.params?.preferences?.bikeRack,
      skiRack: !!route.params?.preferences?.skiRack,
      ac: !!route.params?.preferences?.ac,
      paymentMethod: safeString(route.params?.preferences?.paymentMethod, 'card')
    },
    driverMessage: safeString(route.params?.driverMessage),
    finalPrice: typeof route.params?.finalPrice === 'number' ? route.params.finalPrice : 25
  });

  const [activeModal, setActiveModal] = useState(null);
  const [tempValue, setTempValue] = useState('');

  // Vérification des données à l'arrivée
  useEffect(() => {
    console.log('Trip data initialized:', JSON.stringify(tripData, null, 2));
  }, []);

  // Composant Modal pour les éditions
  const EditModal = React.memo(({ visible, title, onClose, onSave, children }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#003366" />
            </TouchableOpacity>
          </View>
          {children}
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  ));

  // Composant pour les icônes de préférences
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
          size={16} 
          color={active ? "#fff" : "#666"} 
        />
      </View>
    );
  });

  // Gestion des modales
  const openEditModal = useCallback((modalType, initialValue = '') => {
    setTempValue(initialValue);
    setActiveModal(modalType);
  }, []);

  const saveChanges = useCallback(() => {
    if (activeModal === 'message') {
      setTripData(prev => ({ ...prev, driverMessage: tempValue }));
    }
    setActiveModal(null);
  }, [activeModal, tempValue]);

  // Confirmation du trajet
  const confirmTrip = useCallback(() => {
    Alert.alert(
      "Confirmer le trajet",
      "Voulez-vous publier ce trajet de covoiturage ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: () => {
            console.log('Trip published:', tripData);
            Alert.alert(
              "Succès!", 
              "Votre trajet a été publié avec succès!",
              [{ text: "OK", onPress: () => navigation.navigate('DriverHome') }]
            );
          }
        }
      ]
    );
  }, [navigation, tripData]);

  // Rendu d'un point d'arrêt
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E53E3E', '#C53030']}
        style={styles.gradientBackground}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vérification</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Contenu principal */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Dernière étape!</Text>
          <Text style={styles.description}>
            Vérifiez que les détails ci-dessous sont exacts avant d'annoncer.
          </Text>

          {/* Carte Itinéraire */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="route" size={20} color="#003366" />
              <Text style={styles.cardTitle}>Itinéraire</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('EditItinerary', { tripData })}
              >
                <MaterialIcons name="edit" size={20} color="#FFCC00" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.routeContainer}>
              {/* Point de départ */}
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.startDot]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeCity}>{tripData.departure}</Text>
                  <Text style={styles.routeLocation}>{tripData.pickupLocation}</Text>
                </View>
              </View>
              
              {/* Points d'arrêt */}
              <FlatList
                data={tripData.stops}
                renderItem={renderStopItem}
                keyExtractor={item => `stop-${item.id}`}
                scrollEnabled={false}
              />
              
              {/* Point d'arrivée */}
              <View style={styles.routePoint}>
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, styles.endDot]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeCity}>{tripData.arrival}</Text>
                  <Text style={styles.routeLocation}>{tripData.dropoffLocation}</Text>
                  <Text style={styles.finalPrice}>
                    {tripData.finalPrice}$ • Destination finale
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Carte Véhicule (exemple) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="directions-car" size={20} color="#003366" />
              <Text style={styles.cardTitle}>Véhicule</Text>
            </View>
            <Text style={styles.vehicleText}>{tripData.vehicle.type}</Text>
            <Text style={styles.vehicleDetail}>
              {tripData.vehicle.color} • {tripData.vehicle.plate}
            </Text>
            <Text style={styles.vehicleDetail}>
              {tripData.seats} place{tripData.seats > 1 ? 's' : ''} disponible{tripData.seats > 1 ? 's' : ''}
            </Text>
          </View>

          {/* Carte Préférences (exemple) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="settings" size={20} color="#003366" />
              <Text style={styles.cardTitle}>Préférences</Text>
            </View>
            <View style={styles.preferencesContainer}>
              {Object.entries(tripData.preferences).map(([key, value]) => {
                if (key === 'paymentMethod') return (
                  <View key={key} style={styles.preferenceItem}>
                    <PreferenceIcon type={key} active={true} />
                    <Text style={styles.preferenceText}>
                      Paiement: {value === 'card' ? 'Carte' : 'Espèces'}
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

          {/* Message au conducteur */}
          <TouchableOpacity 
            style={styles.messageCard}
            onPress={() => openEditModal('message', tripData.driverMessage)}
          >
            <Text style={styles.messageLabel}>Message aux passagers:</Text>
            <Text style={styles.messageText}>
              {tripData.driverMessage || 'Ajouter un message...'}
            </Text>
            <MaterialIcons 
              name="edit" 
              size={18} 
              color="#FFCC00" 
              style={styles.messageEditIcon}
            />
          </TouchableOpacity>
        </ScrollView>

        {/* Bouton de confirmation */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={confirmTrip}
          >
            <Text style={styles.confirmButtonText}>Annoncer le trajet</Text>
            <MaterialIcons name="check-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Modale pour éditer le message */}
      <EditModal
        visible={activeModal === 'message'}
        title="Message aux passagers"
        onClose={() => setActiveModal(null)}
        onSave={saveChanges}
      >
        <TextInput
          style={styles.messageInput}
          value={tempValue}
          onChangeText={setTempValue}
          placeholder="Écrivez un message personnalisé..."
          multiline
          numberOfLines={4}
          maxLength={200}
        />
        <Text style={styles.characterCount}>
          {tempValue.length}/200 caractères
        </Text>
      </EditModal>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 20,
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    flex: 1,
    marginLeft: 8,
  },
  routeContainer: {
    paddingLeft: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    backgroundColor: '#FF9800',
  },
  endDot: {
    backgroundColor: '#E53E3E',
  },
  routeLine: {
    position: 'absolute',
    left: 5,
    top: -12,
    width: 2,
    height: 24,
    backgroundColor: '#e0e0e0',
  },
  routeInfo: {
    flex: 1,
  },
  routeCity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
  },
  routeLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  stopPrice: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 4,
  },
  finalPrice: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: '600',
    marginTop: 4,
  },
  vehicleText: {
    fontSize: 16,
    color: '#003366',
    fontWeight: '600',
    marginBottom: 4,
  },
  vehicleDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  preferenceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePreferenceIcon: {
    backgroundColor: '#003366',
  },
  messageCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFCC00',
  },
  messageLabel: {
    fontSize: 14,
    color: '#003366',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  messageEditIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E53E3E',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  confirmButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonText: {
    color: '#E53E3E',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#003366',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ReviewAndConfirmScreen;