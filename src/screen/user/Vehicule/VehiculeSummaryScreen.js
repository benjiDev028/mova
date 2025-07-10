// VehicleDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../hooks/useAuth';

// API Service pour les données des véhicules
const VehicleAPI = {
  async getBrands() {
    try {
      const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response was not JSON');
      }
      const data = await response.json();
      return data.Results.map(item => ({
        id: item.Make_ID,
        name: item.Make_Name
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Erreur lors de la récupération des marques:', error);
      return [];
    }
  },

  async getModelsByBrand(brandName) {
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(brandName)}?format=json`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data.Results.map(item => ({
        id: item.Model_ID,
        name: item.Model_Name
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles:', error);
      return [];
    }
  },

  getSeatingCapacities() {
    return [
      { id: 1, name: '2 places' },
      { id: 2, name: '4 places' },
      { id: 3, name: '5 places' },
      { id: 4, name: '6 places' },
      { id: 5, name: '7 places' },
      { id: 6, name: '8 places' },
      { id: 7, name: '9 places' },
    ];
  }
};

// Composant AutoComplete réutilisable
const AutoCompleteInput = ({ 
  label, 
  value, 
  onSelect, 
  placeholder, 
  data, 
  loading = false,
  onTextChange 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      const filtered = data.filter(item => 
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [data, value]);

  const handleSelect = (item) => {
    onSelect(item);
    setShowDropdown(false);
  };

  const handleTextChange = (text) => {
    onTextChange && onTextChange(text);
    setShowDropdown(text.length > 0);
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <TextInput
          style={styles.dropdownInput}
          value={value}
          placeholder={placeholder}
          onChangeText={handleTextChange}
          onFocus={() => setShowDropdown(true)}
        />
        <Ionicons 
          name={showDropdown ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#8E8E93" 
        />
      </TouchableOpacity>
      
      {showDropdown && (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFC72C" />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.dropdownItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.dropdownList}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              windowSize={5}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={false}
            />
          )}
        </View>
      )}
    </View>
  );
};

const VehicleDetailsScreen = ({ navigation, route }) => {
  const { vehicle, isEditing = true } = route.params || {};
  const { user } = useAuth();
  
  // États pour les données du véhicule
  const [brand, setBrand] = useState(vehicle?.brand || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [year, setYear] = useState(vehicle?.date_of_car || '');
  const [color, setColor] = useState(vehicle?.color || '');
  const [licensePlate, setLicensePlate] = useState(vehicle?.license_plate || '');
  const [seatingCapacity, setSeatingCapacity] = useState(vehicle?.seating_capacity || '');
  
  // États pour l'auto-complétion
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [seatingCapacities, setSeatingCapacities] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    loadBrands();
    loadSeatingCapacities();
  }, []);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const brandsData = await VehicleAPI.getBrands();
      setBrands(brandsData);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les marques de véhicules');
      console.error('Error loading brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadSeatingCapacities = () => {
    const capacities = VehicleAPI.getSeatingCapacities();
    setSeatingCapacities(capacities);
  };

  const handleBrandSelect = async (selectedBrand) => {
    setBrand(selectedBrand.name);
    setModel(''); // Réinitialiser le modèle
    setModels([]); // Vider les modèles
    
    // Charger les modèles pour cette marque
    setLoadingModels(true);
    try {
      const modelsData = await VehicleAPI.getModelsByBrand(selectedBrand.name);
      setModels(modelsData);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les modèles pour cette marque');
      console.error('Error loading models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelSelect = (selectedModel) => {
    setModel(selectedModel.name);
  };

  const handleSeatingCapacitySelect = (selectedCapacity) => {
    setSeatingCapacity(selectedCapacity.name);
  };

  const handleSave = async () => {
    if (!brand || !model || !year || !color || !licensePlate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const vehicleData = {
      id: vehicle?.id || Date.now().toString(),
      brand,
      model,
      date_of_car: year,
      color,
      license_plate: licensePlate,
      seating_capacity: seatingCapacity,
    };

    try {
      // Ici, vous devrez implémenter la logique de sauvegarde
      // selon votre système de gestion des données utilisateur
      console.log('Données du véhicule à sauvegarder:', vehicleData);
      
      Alert.alert('Succès', 'Véhicule sauvegardé avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le véhicule');
      console.error('Error saving vehicle:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le véhicule',
      'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            // Implémenter la logique de suppression
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <AutoCompleteInput
              label="Marque *"
              value={brand}
              onSelect={handleBrandSelect}
              placeholder="Sélectionnez une marque"
              data={brands}
              loading={loadingBrands}
              onTextChange={setBrand}
            />

            <AutoCompleteInput
              label="Modèle *"
              value={model}
              onSelect={handleModelSelect}
              placeholder="Sélectionnez un modèle"
              data={models}
              loading={loadingModels}
              onTextChange={setModel}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Année *</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="2024"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Couleur *</Text>
              <TextInput
                style={styles.input}
                value={color}
                onChangeText={setColor}
                placeholder="Blanc"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plaque d'immatriculation *</Text>
              <TextInput
                style={styles.input}
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="ABC-1234"
                autoCapitalize="characters"
              />
            </View>

            <AutoCompleteInput
              label="Nombre de places"
              value={seatingCapacity}
              onSelect={handleSeatingCapacitySelect}
              placeholder="Sélectionnez le nombre de places"
              data={seatingCapacities}
              onTextChange={setSeatingCapacity}
            />

            {isEditing && vehicle && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash" size={20} color="white" />
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Sauvegarder</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ... (keep your existing styles)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingRight: 12,
  },
  dropdownInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  actionButtons: {
    marginTop: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  saveButton: {
    backgroundColor: '#FFC72C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VehicleDetailsScreen;