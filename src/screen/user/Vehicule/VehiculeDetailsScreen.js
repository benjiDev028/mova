// VehicleDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VehicleDetailsScreen = ({ route, navigation }) => {
  const { vehicle, isEditing = true } = route.params || {};
  
  const [formData, setFormData] = useState({
    id: '',
    brand: '',
    model: '',
    date_of_car: '',
    color: '',
    license_plate: '',
    options: '',
  });

  const [isNewVehicle, setIsNewVehicle] = useState(!vehicle);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        id: vehicle.id,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        date_of_car: vehicle.date_of_car || '',
        color: vehicle.color || '',
        license_plate: vehicle.license_plate || '',
        options: vehicle.options || '',
      });
    } else {
      // Générer un ID unique pour un nouveau véhicule
      setFormData(prev => ({
        ...prev,
        id: Date.now().toString()
      }));
    }
  }, [vehicle]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.brand.trim()) {
      Alert.alert('Erreur', 'La marque est obligatoire');
      return false;
    }
    if (!formData.model.trim()) {
      Alert.alert('Erreur', 'Le modèle est obligatoire');
      return false;
    }
    if (!formData.date_of_car.trim()) {
      Alert.alert('Erreur', 'L\'année est obligatoire');
      return false;
    }
    return true;
  };

  const saveVehicle = async () => {
    if (!validateForm()) return;

    try {
      const storedVehicles = await AsyncStorage.getItem('vehicles');
      let vehicles = storedVehicles ? JSON.parse(storedVehicles) : [];

      if (isNewVehicle) {
        vehicles.push(formData);
        
        // Si c'est le premier véhicule, le définir comme principal
        if (vehicles.length === 1) {
          await AsyncStorage.setItem('selectedVehicleId', formData.id);
        }
      } else {
        // Modifier le véhicule existant
        const index = vehicles.findIndex(v => v.id === formData.id);
        if (index !== -1) {
          vehicles[index] = formData;
        }
      }

      await AsyncStorage.setItem('vehicles', JSON.stringify(vehicles));
      
      Alert.alert(
        'Succès',
        isNewVehicle ? 'Véhicule ajouté avec succès' : 'Véhicule modifié avec succès',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le véhicule');
      console.error('Erreur sauvegarde:', error);
    }
  };

  const deleteVehicle = async () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedVehicles = await AsyncStorage.getItem('vehicles');
              let vehicles = storedVehicles ? JSON.parse(storedVehicles) : [];
              
              vehicles = vehicles.filter(v => v.id !== formData.id);
              await AsyncStorage.setItem('vehicles', JSON.stringify(vehicles));
              
              // Si c'était le véhicule principal, effacer la sélection
              const selectedId = await AsyncStorage.getItem('selectedVehicleId');
              if (selectedId === formData.id) {
                await AsyncStorage.removeItem('selectedVehicleId');
              }
              
              Alert.alert('Succès', 'Véhicule supprimé avec succès', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le véhicule');
            }
          }
        }
      ]
    );
  };

  const setAsPrincipal = async () => {
    try {
      await AsyncStorage.setItem('selectedVehicleId', formData.id);
      Alert.alert('Succès', 'Véhicule défini comme principal', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de définir le véhicule comme principal');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNewVehicle ? 'Nouveau Véhicule' : 'Détails du Véhicule'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marque *</Text>
            <TextInput
              style={styles.input}
              value={formData.brand}
              onChangeText={(value) => handleInputChange('brand', value)}
              placeholder="Ex: Toyota, Honda, BMW..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modèle *</Text>
            <TextInput
              style={styles.input}
              value={formData.model}
              onChangeText={(value) => handleInputChange('modele', value)}
              placeholder="Ex: Corolla, Civic, X3..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Année *</Text>
            <TextInput
              style={styles.input}
              value={formData.date_of_car}
              onChangeText={(value) => handleInputChange('date_of_car', value)}
              placeholder="Ex: 2021"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Couleur</Text>
            <TextInput
              style={styles.input}
              value={formData.color}
              onChangeText={(value) => handleInputChange('couleur', value)}
              placeholder="Ex: Blanc, Noir, Rouge..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plaque d'immatriculation</Text>
            <TextInput
              style={styles.input}
              value={formData.license_plate}
              onChangeText={(value) => handleInputChange('plaque', value.toUpperCase())}
              placeholder="Ex: ABC-1234"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Options / Équipements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.options}
              onChangeText={(value) => handleInputChange('options', value)}
              placeholder="Ex: Climatisation, GPS, Bluetooth..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {!isNewVehicle && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.principalButton} onPress={setAsPrincipal}>
              <Ionicons name="star" size={20} color="white" />
              <Text style={styles.principalButtonText}>Définir comme principal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={deleteVehicle}>
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Supprimer ce véhicule</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveVehicle}>
          <Text style={styles.saveButtonText}>
            {isNewVehicle ? 'Ajouter le véhicule' : 'Sauvegarder les modifications'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
// Styles partagés
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
  // Styles pour VehicleSummaryScreen
  vehicleList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  vehicleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#FFC72C',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  principalLabel: {
    fontSize: 12,
    color: '#FFC72C',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC72C',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Styles pour VehicleDetailsScreen
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  principalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC72C',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  principalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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