import React, { useState, useEffect } from 'react';
import FilterModalScreen from '../../passager/FilterModal/FilterModalScreen';
import GooglePlacesInput from '../../../composants/googleplaceSeach/GoogleplaceSearch';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import {styles} from "./styles";

// Styles additionnels pour l'intégration
const additionalStyles = StyleSheet.create({
  googleInput: {
    flex: 1,
    marginBottom: 0,
    zIndex: 9999,
  },
  // Ajout de styles pour les containers d'input
  departureContainer: {
    zIndex: 9999,
  },
  arrivalContainer: {
    zIndex: 9998,
  },
});

// Fusionner les styles
const combinedStyles = { ...styles, ...additionalStyles };
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const SearchTrajetScreen = ({ navigation, route }) => {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [departureData, setDepartureData] = useState(null);
  const [arrivalData, setArrivalData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [includeNearby, setIncludeNearby] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  
  // Keys pour forcer la re-création des composants GooglePlacesInput
  const [departureKey, setDepartureKey] = useState(0);
  const [arrivalKey, setArrivalKey] = useState(0);

  // Pré-remplir les champs si on revient de la page de résultats
  useEffect(() => {
    if (route.params) {
      const { departure: prevDeparture, arrival: prevArrival, date: prevDate } = route.params;
      if (prevDeparture) setDeparture(prevDeparture);
      if (prevArrival) setArrival(prevArrival);
      if (prevDate) setSelectedDate(new Date(prevDate));
    }
  }, [route.params]);

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const handleFilterApply = (filters) => {
    console.log("Filtres appliqués :", filters);
    setAppliedFilters(filters);
    setFilterVisible(false);
  };

  const handleDepartureSelect = (place) => {
    setDeparture(place.city);
    setDepartureData(place);
    console.log("Départ sélectionné:", place);
  };

  const handleArrivalSelect = (place) => {
    setArrival(place.city);
    setArrivalData(place);
    console.log("Arrivée sélectionnée:", place);
  };

  const validateInputs = () => {
    if (!departure.trim()) {
      Alert.alert("Erreur", "Veuillez saisir une ville de départ");
      return false;
    }
    if (!arrival.trim()) {
      Alert.alert("Erreur", "Veuillez saisir une ville d'arrivée");
      return false;
    }
    if (departure.trim().toLowerCase() === arrival.trim().toLowerCase()) {
      Alert.alert("Erreur", "La ville de départ et d'arrivée ne peuvent pas être identiques");
      return false;
    }
    return true;
  };

  const handleSearch = async () => {
    if (!validateInputs()) return;

    setIsSearching(true);
    
    try {
      // Nettoyer les chaînes avant de les envoyer
      const cleanString = (str) => {
        return str
          .trim()
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // Enlever les caractères invisibles
          .replace(/\uFFFC/g, '') // Enlever le caractère de remplacement d'objet
          .replace(/[^\w\s\-àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/g, ''); // Garder seulement les caractères valides
      };

      const cleanDeparture = cleanString(departure);
      const cleanArrival = cleanString(arrival);
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

      const searchParams = {
        departure: cleanDeparture,
        arrival: cleanArrival,
        date: formattedDate,
        includeNearby,
        filters: appliedFilters,
        departureData,
        arrivalData,
      };

      console.log('🔍 Recherche avec paramètres nettoyés:', searchParams);
      
      navigation.navigate('ListFound', {
        departure: cleanDeparture,
        arrival: cleanArrival,
        date: formattedDate,
        includeNearby,
        filters: appliedFilters,
        departureData,
        arrivalData
      });
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const swapLocations = () => {
    const tempDeparture = departure;
    const tempDepartureData = departureData;
    
    setDeparture(arrival);
    setDepartureData(arrivalData);
    setArrival(tempDeparture);
    setArrivalData(tempDepartureData);
    
    // Forcer la re-création des composants GooglePlacesInput
    setDepartureKey(prev => prev + 1);
    setArrivalKey(prev => prev + 1);
  };

  const clearForm = () => {
    setDeparture('');
    setArrival('');
    setDepartureData(null);
    setArrivalData(null);
    setSelectedDate(new Date());
    setIncludeNearby(true);
    setAppliedFilters({});
    
    // Forcer la re-création des composants GooglePlacesInput
    setDepartureKey(prev => prev + 1);
    setArrivalKey(prev => prev + 1);
  };

  const handleSuggestionPress = (suggestion) => {
    setDeparture(suggestion.from);
    setArrival(suggestion.to);
    // Réinitialiser les données de géolocalisation car ce sont des suggestions simples
    setDepartureData(null);
    setArrivalData(null);
    
    // Forcer la re-création des composants GooglePlacesInput
    setDepartureKey(prev => prev + 1);
    setArrivalKey(prev => prev + 1);
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'android') {
      return (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate}
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
          <View style={combinedStyles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={combinedStyles.datePickerContainer}>
          <View style={combinedStyles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={combinedStyles.datePickerButton}>Valider</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
            locale="fr-FR"
            textColor="#003366"
            style={combinedStyles.datePicker}
          />
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={combinedStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={combinedStyles.wrapper}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={combinedStyles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec bouton clear */}
          <View style={combinedStyles.headerActions}>
            <TouchableOpacity onPress={clearForm} style={combinedStyles.clearButton}>
              <MaterialIcons name="clear" size={16} color="#666" />
              <Text style={combinedStyles.clearText}>Effacer</Text>
            </TouchableOpacity>
          </View>

          {/* Départ avec GooglePlacesInput */}
          <View style={[combinedStyles.inputContainer, combinedStyles.departureContainer]}>
            <Entypo name="location-pin" size={20} color="#003366" style={combinedStyles.icon} />
            <GooglePlacesInput
              key={departureKey}
              placeholder="Ville de départ (ex: Montréal)"
              onSelect={handleDepartureSelect}
              style={combinedStyles.googleInput}
              initialValue={departure}
            />
          </View>

          {/* Bouton swap */}
          <TouchableOpacity style={combinedStyles.swapButton} onPress={swapLocations}>
            <MaterialIcons name="swap-vert" size={24} color="#003366" />
          </TouchableOpacity>

          {/* Arrivée avec GooglePlacesInput */}
          <View style={[combinedStyles.inputContainer, combinedStyles.arrivalContainer]}>
            <Ionicons name="flag-outline" size={20} color="#003366" style={combinedStyles.icon} />
            <GooglePlacesInput
              key={arrivalKey}
              placeholder="Ville d'arrivée (ex: Gatineau)"
              onSelect={handleArrivalSelect}
              style={combinedStyles.googleInput}
              initialValue={arrival}
            />
          </View>

          {/* Date */}
          <TouchableOpacity
            style={combinedStyles.inputContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="date-range" size={20} color="#003366" style={combinedStyles.icon} />
            <Text style={[combinedStyles.input, { color: '#333' }]}>
              {moment(selectedDate).format('dddd D MMMM YYYY')}
            </Text>
          </TouchableOpacity>

          {/* Switch pour arrêts proches */}
          <View style={combinedStyles.switchRow}>
            <Text style={combinedStyles.switchLabel}>
              Inclure les trajets passant par cette destination
            </Text>
            <Switch
              value={includeNearby}
              onValueChange={setIncludeNearby}
              trackColor={{ false: "#ccc", true: "#FFCC00" }}
              thumbColor={includeNearby ? "#003366" : "#f4f3f4"}
            />
          </View>

          {/* Filtres */}
          <TouchableOpacity
            style={combinedStyles.filterBtn}
            activeOpacity={0.7}
            onPress={() => setFilterVisible(true)}
          >
            <MaterialIcons name="tune" size={20} color="#003366" style={{ marginRight: 8 }} />
            <Text style={combinedStyles.filterText}>Filtres de recherche</Text>
            {Object.keys(appliedFilters).length > 0 && (
              <View style={combinedStyles.filterBadge}>
                <Text style={combinedStyles.filterBadgeText}>{Object.keys(appliedFilters).length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Rechercher */}
          <TouchableOpacity
            style={[combinedStyles.searchBtn, isSearching && combinedStyles.searchBtnDisabled]}
            activeOpacity={0.7}
            onPress={handleSearch}
            disabled={isSearching}
          >
            <Text style={combinedStyles.searchText}>
              {isSearching ? "Recherche en cours..." : "Trouver un trajet"}
            </Text>
          </TouchableOpacity>

          {/* Suggestions rapides */}
          <View style={combinedStyles.suggestionsContainer}>
            <Text style={combinedStyles.suggestionsTitle}>Recherches populaires</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { from: "Montréal", to: "Gatineau" },
                { from: "Québec", to: "Montréal" },
                { from: "Laval", to: "Sherbrooke" },
              ].map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={combinedStyles.suggestionChip}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={combinedStyles.suggestionText}>
                    {suggestion.from} → {suggestion.to}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderDatePicker()}

      {/* Modal filtres */}
      <FilterModalScreen
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleFilterApply}
      />
    </SafeAreaView>
  );
};

export default SearchTrajetScreen;