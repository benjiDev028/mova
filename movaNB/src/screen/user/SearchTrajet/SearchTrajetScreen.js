import React, { useState } from 'react';
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
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import 'moment/locale/fr'; // Pour avoir les dates en français

moment.locale('fr');

const SearchTrajetScreen = ({navigation}) => {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [includeNearby, setIncludeNearby] = useState(true);
  const [radius, setRadius] = useState('5');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios'); // On garde le picker ouvert sur iOS
    if (date) {
      setSelectedDate(date);
    }
  };

  
const handleFilterApply = (filters) => {
    console.log("Filtres appliqués :", filters);
    // Tu peux ensuite utiliser ces données pour faire ta requête de recherche
    setFilterVisible(false);
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

    // Pour iOS - Date Picker Modal
    return (
      <Modal
        transparent={true}
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
          {/* Départ */}
          <View style={styles.inputContainer}>
            <Entypo name="location-pin" size={20} color="#003366" style={styles.icon} />
            <TextInput
              placeholder="Départ"
              value={departure}
              onChangeText={setDeparture}
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Arrivée */}
          <View style={styles.inputContainer}>
            <Ionicons name="flag-outline" size={20} color="#003366" style={styles.icon} />
            <TextInput
              placeholder="Arrivée"
              value={arrival}
              onChangeText={setArrival}
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Date (via calendrier) */}
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

          {/* Inclure arrêts proches */}
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

          {includeNearby && (
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>Rayon autour de la destination (km)</Text>
              <TextInput
                keyboardType="numeric"
                value={radius}
                onChangeText={setRadius}
                placeholder="ex: 5"
                style={styles.radiusInput}
                placeholderTextColor="#aaa"
              />
            </View>
          )}

          {/* Filtres */}
          <TouchableOpacity 
            style={styles.filterBtn} 
            activeOpacity={0.7}
            onPress={() => setFilterVisible(true)}
          >
            <MaterialIcons name="tune" size={20} color="#003366" style={{ marginRight: 8 }} />
            <Text style={styles.filterText}>Filtres de recherche</Text>
          </TouchableOpacity>

          {/* Rechercher */}
          <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7}   onPress={() => navigation.navigate('ListFound')}>
            <Text style={styles.searchText}>Trouver un trajet</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {renderDatePicker()}

      {/* Filter Modal - Placé ici, en dehors des autres modals */}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 30,
    textAlign: 'center',
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
  radiusContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  radiusLabel: {
    fontSize: 14,
    color: '#003366',
    marginBottom: 8,
    fontWeight: '500',
  },
  radiusInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  searchText: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 18,
  },
  // Styles pour le date picker iOS
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