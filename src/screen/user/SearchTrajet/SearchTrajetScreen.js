import React, { useState, useEffect } from 'react';
import FilterModalScreen from '../../passager/FilterModal/FilterModalScreen';
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
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const SearchTrajetScreen = ({ navigation, route }) => {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [includeNearby, setIncludeNearby] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isSearching, setIsSearching] = useState(false);

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
    };

    console.log('🔍 Recherche avec paramètres nettoyés:', searchParams);
    
    navigation.navigate('ListFound', {
      departure: cleanDeparture,
      arrival: cleanArrival,
      date: formattedDate,
      includeNearby,
      filters: appliedFilters
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    Alert.alert("Erreur", "Une erreur s'est produite lors de la recherche");
  } finally {
    setIsSearching(false);
  }
};

  const swapLocations = () => {
    const temp = departure;
    setDeparture(arrival);
    setArrival(temp);
  };

  const clearForm = () => {
    setDeparture('');
    setArrival('');
    setSelectedDate(new Date());
    setIncludeNearby(true);
    setRadius('5');
    setAppliedFilters({});
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
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.datePickerButton}>Valider</Text>
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
            style={styles.datePicker}
          />
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.wrapper}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec bouton clear */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={clearForm} style={styles.clearButton}>
              <MaterialIcons name="clear" size={16} color="#666" />
              <Text style={styles.clearText}>Effacer</Text>
            </TouchableOpacity>
          </View>

          {/* Départ */}
          <View style={styles.inputContainer}>
            <Entypo name="location-pin" size={20} color="#003366" style={styles.icon} />
            <TextInput
              placeholder="Ville de départ (ex: Montréal)"
              value={departure}
              onChangeText={setDeparture}
              style={styles.input}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Bouton swap */}
          <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
            <MaterialIcons name="swap-vert" size={24} color="#003366" />
          </TouchableOpacity>

          {/* Arrivée */}
          <View style={styles.inputContainer}>
            <Ionicons name="flag-outline" size={20} color="#003366" style={styles.icon} />
            <TextInput
              placeholder="Ville d'arrivée (ex: Gatineau)"
              value={arrival}
              onChangeText={setArrival}
              style={styles.input}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Date */}
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="date-range" size={20} color="#003366" style={styles.icon} />
            <Text style={[styles.input, { color: '#333' }]}>
              {moment(selectedDate).format('dddd D MMMM YYYY')}
            </Text>
          </TouchableOpacity>

          {/* Switch pour arrêts proches */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
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
            style={styles.filterBtn}
            activeOpacity={0.7}
            onPress={() => setFilterVisible(true)}
          >
            <MaterialIcons name="tune" size={20} color="#003366" style={{ marginRight: 8 }} />
            <Text style={styles.filterText}>Filtres de recherche</Text>
            {Object.keys(appliedFilters).length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{Object.keys(appliedFilters).length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Rechercher */}
          <TouchableOpacity
            style={[styles.searchBtn, isSearching && styles.searchBtnDisabled]}
            activeOpacity={0.7}
            onPress={handleSearch}
            disabled={isSearching}
          >
            <Text style={styles.searchText}>
              {isSearching ? "Recherche en cours..." : "Trouver un trajet"}
            </Text>
          </TouchableOpacity>

          {/* Suggestions rapides */}
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Recherches populaires</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { from: "Montréal", to: "Gatineau" },
                { from: "Québec", to: "Montréal" },
                { from: "Laval", to: "Sherbrooke" },
              ].map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setDeparture(suggestion.from);
                    setArrival(suggestion.to);
                  }}
                >
                  <Text style={styles.suggestionText}>
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