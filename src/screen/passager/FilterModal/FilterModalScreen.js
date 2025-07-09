import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';

const FilterModalScreen = ({ visible, onClose, onApply }) => {
  const [passengerCount, setPassengerCount] = useState(1);
  const [priceLimit, setPriceLimit] = useState(50);
  const [smokingAllowed, setSmokingAllowed] = useState(null);
  const [petsAllowed, setPetsAllowed] = useState(null);
  const [acAvailable, setAcAvailable] = useState(false);
  const [bikeSpace, setBikeSpace] = useState(false);
  const [skiSpace, setSkiSpace] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const resetFilters = () => {
    setPassengerCount(1);
    setPriceLimit(50);
    setSmokingAllowed(null);
    setPetsAllowed(null);
    setAcAvailable(false);
    setBikeSpace(false);
    setSkiSpace(false);
    setPaymentMethod(null);
  };

  const handleApply = () => {
    const filters = {
      priceRange: { max: priceLimit },
      minSeats: passengerCount,
      smoking: smokingAllowed,
      pets: petsAllowed,
      airConditioning: acAvailable,
      bikeSupport: bikeSpace,
      skiSupport: skiSpace,
      paymentMode: paymentMethod
    };
    
    onApply(filters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
              <Text style={styles.title}>Filtres de recherche</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#003366" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Nombre de places</Text>
            <Slider
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={passengerCount}
              onValueChange={setPassengerCount}
              minimumTrackTintColor="#FFCC00"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#003366"
              style={styles.slider}
            />
            <Text style={styles.value}>{passengerCount} passager(s)</Text>

            <Text style={styles.label}>Prix maximum</Text>
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={priceLimit}
              onValueChange={setPriceLimit}
              minimumTrackTintColor="#FFCC00"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#003366"
              style={styles.slider}
            />
            <Text style={styles.value}>
              {priceLimit > 0 ? `Moins de ${priceLimit}$` : "Pas de limite de prix"}
            </Text>

            <Text style={styles.label}>Préférences</Text>
            <View style={styles.badgeRow}>
              <TouchableOpacity 
                style={[styles.badge, smokingAllowed === true && styles.activeBadge]} 
                onPress={() => setSmokingAllowed(smokingAllowed === true ? null : true)}
              >
                <MaterialIcons name="smoking-rooms" size={20} color={smokingAllowed === true ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, smokingAllowed === true && styles.activeBadgeText]}>Fumeur</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.badge, smokingAllowed === false && styles.activeBadge]} 
                onPress={() => setSmokingAllowed(smokingAllowed === false ? null : false)}
              >
                <MaterialIcons name="smoke-free" size={20} color={smokingAllowed === false ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, smokingAllowed === false && styles.activeBadgeText]}>Non-fumeur</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <TouchableOpacity 
                style={[styles.badge, petsAllowed === true && styles.activeBadge]} 
                onPress={() => setPetsAllowed(petsAllowed === true ? null : true)}
              >
                <MaterialIcons name="pets" size={20} color={petsAllowed === true ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, petsAllowed === true && styles.activeBadgeText]}>Animaux OK</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.badge, petsAllowed === false && styles.activeBadge]} 
                onPress={() => setPetsAllowed(petsAllowed === false ? null : false)}
              >
                <MaterialIcons name="block" size={20} color={petsAllowed === false ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, petsAllowed === false && styles.activeBadgeText]}>Pas d'animaux</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <TouchableOpacity 
                style={[styles.badge, acAvailable && styles.activeBadge]} 
                onPress={() => setAcAvailable(!acAvailable)}
              >
                <MaterialIcons name="ac-unit" size={20} color={acAvailable ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, acAvailable && styles.activeBadgeText]}>Climatisation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.badge, bikeSpace && styles.activeBadge]} 
                onPress={() => setBikeSpace(!bikeSpace)}
              >
                <MaterialIcons name="directions-bike" size={20} color={bikeSpace ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, bikeSpace && styles.activeBadgeText]}>Vélo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.badge, skiSpace && styles.activeBadge]} 
                onPress={() => setSkiSpace(!skiSpace)}
              >
                <MaterialIcons name="downhill-skiing" size={20} color={skiSpace ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, skiSpace && styles.activeBadgeText]}>Ski</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Paiement accepté</Text>
            <View style={styles.badgeRow}>
              <TouchableOpacity 
                style={[styles.badge, paymentMethod === "cash" && styles.activeBadge]} 
                onPress={() => setPaymentMethod(paymentMethod === "cash" ? null : "cash")}
              >
                <MaterialIcons name="attach-money" size={20} color={paymentMethod === "cash" ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, paymentMethod === "cash" && styles.activeBadgeText]}>Espèces</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.badge, paymentMethod === "virement" && styles.activeBadge]} 
                onPress={() => setPaymentMethod(paymentMethod === "virement" ? null : "virement")}
              >
                <MaterialIcons name="credit-card" size={20} color={paymentMethod === "virement" ? "#fff" : "#003366"} />
                <Text style={[styles.badgeText, paymentMethod === "virement" && styles.activeBadgeText]}>Virement</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>Appliquer les filtres</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000044',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  scroll: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  resetBtn: {
    alignSelf: 'flex-end',
    padding: 6,
    paddingHorizontal: 12,
    borderColor: '#FFCC00',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
  },
  resetText: {
    color: '#003366',
    fontWeight: '500',
  },
  label: {
    color: '#003366',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    height: 40,
    marginVertical: 5,
  },
  value: {
    color: '#333',
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#003366',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: '#003366',
    borderColor: '#FFCC00',
  },
  badgeText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#003366',
    fontWeight: '500',
  },
  activeBadgeText: {
    color: '#fff',
  },
  applyBtn: {
    backgroundColor: '#003DA5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  applyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FilterModalScreen;