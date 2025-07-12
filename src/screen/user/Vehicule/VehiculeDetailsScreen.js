import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView, FlatList, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform,} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VehicleDatabase } from './vehicleDatabase';
import service_vehicule from '../../../services/service_vehicule/service_vehicule';

const VehicleDetailsScreen = ({ route, navigation }) => {
  const { vehicle, isEditing = true } = route.params || {};
  const { user, refreshUser } = useAuth(); // Ajout de refreshUser
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    user_id: user.id,
    brand: '',
    model: '',
    type_of_car: '',
    date_of_car: 0,
    color: '',
    license_plate: '',
    seats: '',
  });

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [colors, setColors] = useState([]);
  const [types, setTypes] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedTypeLabel, setSelectedTypeLabel] = useState('');
  const [selectedSeatLabel, setSelectedSeatLabel] = useState('');
  
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showManualBrandInput, setShowManualBrandInput] = useState(false);
  const [showManualModelInput, setShowManualModelInput] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showSeatDropdown, setShowSeatDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const [isNewVehicle, setIsNewVehicle] = useState(!vehicle);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Charger les données de base
    setBrands(VehicleDatabase.getBrands());
    setColors(VehicleDatabase.getVehicleColors());
    setTypes(VehicleDatabase.getVehicleTypes()); 
    setSeats(VehicleDatabase.getSeatingCapacities());
    
    if (vehicle) {
      console.log("Vehicle object:", vehicle);
      setFormData({
        user_id: user.id,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        date_of_car: vehicle.date_of_car ? vehicle.date_of_car.toString() : '', // Convertir en string
        type_of_car: vehicle.type_of_car || '',
        color: vehicle.color || '',
        seats: vehicle.seats || '',
        license_plate: vehicle.license_plate || '',
      });
      
      // Définir les labels pour l'affichage
      setSelectedTypeLabel(vehicle.type_of_car || '');
      setSelectedSeatLabel(vehicle.seats ? vehicle.seats.toString() : '');
      
      // Charger les modèles si la marque existe
      if (vehicle.brand) {
        setModels(VehicleDatabase.getModelsByBrand(vehicle.brand));
      }
    }

    // Écouter les événements du clavier
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [vehicle, user.id]);

  const handleBrandSelect = (selectedBrand) => {
    Keyboard.dismiss();
    
    setFormData(prev => ({
      ...prev,
      brand: selectedBrand.name,
      model: ''
    }));
    
    if (selectedBrand.name === 'Autre marque') {
      setShowManualBrandInput(true);
      setShowBrandDropdown(false);
      return;
    }

    setModels(VehicleDatabase.getModelsByBrand(selectedBrand.name));
    setShowBrandDropdown(false);
  };

  const handleModelSelect = (selectedModel) => {
    Keyboard.dismiss();
    
    if (selectedModel.name.includes('Autre')) {
      setShowManualModelInput(true);
      setShowModelDropdown(false);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      model: selectedModel.name
    }));
    setShowModelDropdown(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBrandInputFocus = () => {
    setShowBrandDropdown(true);
    setTimeout(() => {
      setShowBrandDropdown(true);
    }, 100);
  };

  const handleModelInputFocus = () => {
    setShowModelDropdown(true);
    setTimeout(() => {
      setShowModelDropdown(true);
    }, 100);
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
    if (!formData.date_of_car) {
      Alert.alert("Erreur", "L'année est obligatoire");
      return false;
    }
    return true;
  };

  const saveVehicle = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isNewVehicle) {
        // Créer le véhicule via l'API
        const response = await service_vehicule.create_car(
          formData.user_id,
          formData.brand,
          formData.model,
          formData.seats,
          formData.color,
          formData.license_plate,
          parseInt(formData.date_of_car),
          formData.type_of_car
        );
        
        console.log("Véhicule créé avec succès:", response);
        
        // Rafraîchir les données utilisateur pour récupérer le nouveau véhicule
        if (refreshUser) {
          await refreshUser();
        }
        
        Alert.alert(
          'Succès',
          'Véhicule ajouté avec succès',
          [{ 
            text: 'OK', 
            onPress: () => {
              navigation.goBack();
            }
          }]
        );
      } else {
        // Modifier le véhicule existant
        // Ici vous pourriez ajouter un service pour modifier le véhicule
        // await service_vehicule.update_car(vehicle.id, formData);
        
        Alert.alert(
          'Succès',
          'Véhicule modifié avec succès',
          [{ 
            text: 'OK', 
            onPress: () => {
              navigation.goBack();
            }
          }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le véhicule');
    } finally {
      setLoading(false);
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
              setLoading(true);
              
              // Ici vous pourriez ajouter un service pour supprimer le véhicule
              // await service_vehicule.delete_car(vehicle.id);
              
              // Rafraîchir les données utilisateur
              if (refreshUser) {
                await refreshUser();
              }
              
              Alert.alert('Succès', 'Véhicule supprimé avec succès', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le véhicule');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const setAsPrincipal = async () => {
    try {
      await AsyncStorage.setItem('selectedVehicleId', vehicle.id.toString());
      Alert.alert('Succès', 'Véhicule défini comme principal', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de définir le véhicule comme principal');
    }
  };

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(formData.brand.toLowerCase())
  );

  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(formData.model.toLowerCase())
  );

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

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          <View style={styles.form}>
            {/* Champ Marque avec auto-complétion */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Marque *</Text>
              {showManualBrandInput ? (
                <TextInput
                  style={styles.input}
                  value={formData.brand}
                  onChangeText={(value) => handleInputChange('brand', value)}
                  placeholder="Entrez la marque"
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowBrandDropdown(!showBrandDropdown)}
                  >
                    <TextInput
                      style={styles.dropdownInput}
                      value={formData.brand}
                      onChangeText={(value) => handleInputChange('brand', value)}
                      placeholder="Sélectionnez une marque"
                      onFocus={handleBrandInputFocus}
                    />
                    <Ionicons 
                      name={showBrandDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#8E8E93" 
                    />
                  </TouchableOpacity>
                  
                  {showBrandDropdown && (
                    <View style={[
                      styles.dropdown,
                      keyboardVisible && styles.dropdownWithKeyboard
                    ]}>
                      <FlatList
                        data={filteredBrands}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => handleBrandSelect(item)}
                          >
                            <Text style={styles.dropdownItemText}>{item.name}</Text>
                          </TouchableOpacity>
                        )}
                        style={styles.dropdownList}
                        keyboardShouldPersistTaps="always"
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      />
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Champ Modèle avec auto-complétion */}
            {formData.brand && !showManualBrandInput && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Modèle *</Text>
                {showManualModelInput ? (
                  <TextInput
                    style={styles.input}
                    value={formData.model}
                    onChangeText={(value) => handleInputChange('model', value)}
                    placeholder="Entrez le modèle"
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowModelDropdown(!showModelDropdown)}
                    >
                      <TextInput
                        style={styles.dropdownInput}
                        value={formData.model}
                        onChangeText={(value) => handleInputChange('model', value)}
                        placeholder="Sélectionnez un modèle"
                        onFocus={handleModelInputFocus}
                      />
                      <Ionicons 
                        name={showModelDropdown ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#8E8E93" 
                      />
                    </TouchableOpacity>
                    
                    {showModelDropdown && (
                      <View style={[
                        styles.dropdown,
                        keyboardVisible && styles.dropdownWithKeyboard
                      ]}>
                        <FlatList
                          data={filteredModels}
                          keyExtractor={(item) => item.id.toString()}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => handleModelSelect(item)}
                            >
                              <Text style={styles.dropdownItemText}>{item.name}</Text>
                            </TouchableOpacity>
                          )}
                          style={styles.dropdownList}
                          keyboardShouldPersistTaps="always"
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Champ Couleur */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Couleur</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowColorDropdown(!showColorDropdown)}
              >
                <TextInput
                  style={styles.dropdownInput}
                  value={formData.color}
                  placeholder="Sélectionnez une couleur"
                  editable={false}
                />
                <Ionicons 
                  name={showColorDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
              
              {showColorDropdown && (
                <View style={styles.dropdown}>
                  <FlatList
                    data={colors}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          handleInputChange('color', item.name);
                          setShowColorDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    style={styles.dropdownList}
                  />
                </View>
              )}
            </View>

            {/* Champ Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type de véhicule</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <TextInput
                  style={styles.dropdownInput}
                  value={selectedTypeLabel}
                  placeholder="Sélectionnez un type"
                  editable={false}
                />
                <Ionicons 
                  name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
              
              {showTypeDropdown && (
                <View style={styles.dropdown}>
                  <FlatList
                    data={types}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          handleInputChange('type_of_car', item.name);
                          setSelectedTypeLabel(item.name);
                          setShowTypeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    style={styles.dropdownList}
                  />
                </View>
              )}
            </View>

            {/* Champ Nombre de places */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de places</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSeatDropdown(!showSeatDropdown)}
              >
                <TextInput
                  style={styles.dropdownInput}
                  value={selectedSeatLabel}
                  placeholder="Sélectionnez un nombre"
                  editable={false}
                />
                <Ionicons 
                  name={showSeatDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
              
              {showSeatDropdown && (
                <View style={styles.dropdown}>
                  <FlatList
                    data={seats}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          handleInputChange('seats', item.id);
                          setSelectedSeatLabel(item.name);
                          setShowSeatDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    style={styles.dropdownList}
                  />
                </View>
              )}
            </View>

            {/* Champ Année */}
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

            {/* Champ Plaque */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plaque d'immatriculation</Text>
              <TextInput
                style={styles.input}
                value={formData.license_plate}
                onChangeText={(value) => handleInputChange('license_plate', value.toUpperCase())}
                placeholder="Ex: ABC-1234"
                autoCapitalize="characters"
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
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.7 }]} 
          onPress={saveVehicle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isNewVehicle ? 'Ajouter le véhicule' : 'Sauvegarder les modifications'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  }, 
   keyboardAvoidingView: {
    flex: 1,
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