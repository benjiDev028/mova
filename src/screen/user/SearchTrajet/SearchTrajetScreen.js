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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  wrapper: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 20,
    paddingBottom: 40,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  clearText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginVertical: -8,
    zIndex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 5,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  switchLabel: {
    fontSize: 14,
    color: '#003366',
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFCC00',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowColor: '#FFCC00',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  filterText: {
    color: '#003366',
    fontWeight: '600',
    fontSize: 16,
  },
  filterBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchBtn: {
    backgroundColor: '#FFCC00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  searchBtnDisabled: {
    backgroundColor: '#ccc',
  },
  searchText: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 18,
  },
  suggestionsContainer: {
    marginTop: 30,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 12,
  },
  suggestionChip: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#B3D9F7',
  },
  suggestionText: {
    color: '#003366',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  datePickerButton: {
    color: '#003366',
    fontSize: 16,
    fontWeight: '600',
  },
  datePicker: {
    width: '100%',
  },
});

export default SearchTrajetScreen;