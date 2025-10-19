import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../hooks/useAuth';

const VehicleSummaryScreen = ({ navigation }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const { user, refreshUser } = useAuth(); // Ajout de refreshUser
  const [hasVehicle, setHasVehicle] = useState(false);

  const vehicles = user?.cars || []; 
  
  useEffect(() => {
    setHasVehicle(vehicles.length > 0);
  }, [vehicles]);

  useEffect(() => {
    const loadSelectedVehicle = async () => {
      const id = await AsyncStorage.getItem('selectedVehicleId');
      if (id) setSelectedVehicleId(id);
    };
    loadSelectedVehicle();
  }, []);

  // Écouter les changements de navigation pour rafraîchir les données
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Rafraîchir les données utilisateur quand l'écran reçoit le focus
      if (refreshUser) {
        refreshUser();
      }
    });

    return unsubscribe;
  }, [navigation, refreshUser]);

  const renderVehicleCard = ({ item }) => {
    const isSelected = item.id === selectedVehicleId;
    
    return (
      <TouchableOpacity
        style={[styles.vehicleCard, isSelected && styles.selectedCard]}
        onPress={() => navigation.navigate('VehicleDetails', { vehicle: item })}
      >
        <View style={styles.cardContent}>
          <View style={styles.vehicleIcon}>
            <Ionicons name="car" size={24} color="#003DA5" />
          </View>
          
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleTitle}>
              {item.brand} {item.model} {item.date_of_car}
            </Text>
            <Text style={styles.vehicleSubtitle}>
              {item.color} • {item.license_plate}
            </Text>
            {isSelected && (
              <Text style={styles.principalLabel}>Véhicule principal</Text>
            )}
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Véhicules</Text>
      </View>

      {vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>Aucun véhicule</Text>
          <Text style={styles.emptySubtitle}>
            Ajoutez votre premier véhicule pour commencer
          </Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleCard}
          keyExtractor={(item) => item.id.toString()}
          style={styles.vehicleList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, hasVehicle && styles.disabledButton]}
        onPress={() => {
          if (!hasVehicle) {
            navigation.navigate('VehicleDetails', { isEditing: false });
          }
        }}
        disabled={hasVehicle}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>
          {hasVehicle ? "Limite de véhicule atteinte" : "Ajouter un véhicule"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};


// Styles partagés
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
   disabledButton: {
    backgroundColor: '#CCCCCC',
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
    borderColor: '#003DA5',
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
    color: '#003DA5',
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
    backgroundColor: '#003DA5',
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
    backgroundColor: '#003DA5',
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
    backgroundColor: '#003DA5',
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
export default VehicleSummaryScreen;