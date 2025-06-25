// FilterModal.js
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
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [maxTwoStops, setMaxTwoStops] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(null);
  const [petsAllowed, setPetsAllowed] = useState(null);
  const [acAvailable, setAcAvailable] = useState(false);
  const [bikeSpace, setBikeSpace] = useState(false);
  const [skiSpace, setSkiSpace] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [vehicleSize, setVehicleSize] = useState(null);

  const resetFilters = () => {
    setPassengerCount(1);
    setPriceLimit(50);
    setVerifiedOnly(false);
    setFavoritesOnly(false);
    setMaxTwoStops(false);
    setSmokingAllowed(null);
    setPetsAllowed(null);
    setAcAvailable(false);
    setBikeSpace(false);
    setSkiSpace(false);
    setPaymentMethod(null);
    setVehicleSize(null);
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
              thumbTintColor="#003366"
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
              thumbTintColor="#003366"
            />
            <Text style={styles.value}>{priceLimit > 0 ? `Moins de ${priceLimit}$` : "Pas de limite de prix"}</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Afficher uniquement les trajets vérifiés</Text>
              <Switch
                value={verifiedOnly}
                onValueChange={setVerifiedOnly}
                trackColor={{ false: "#ccc", true: "#FFCC00" }}
                thumbColor={verifiedOnly ? "#003366" : "#f4f3f4"}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Afficher mes conducteurs favoris</Text>
              <Switch
                value={favoritesOnly}
                onValueChange={setFavoritesOnly}
                trackColor={{ false: "#ccc", true: "#FFCC00" }}
                thumbColor={favoritesOnly ? "#003366" : "#f4f3f4"}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Ne pas inclure les trajets avec plus de 2 arrêts</Text>
              <Switch
                value={maxTwoStops}
                onValueChange={setMaxTwoStops}
                trackColor={{ false: "#ccc", true: "#FFCC00" }}
                thumbColor={maxTwoStops ? "#003366" : "#f4f3f4"}
              />
            </View>

            <Text style={styles.label}>Préférences</Text>
            <View style={styles.badgeRow}>
              <TouchableOpacity style={[styles.badge, smokingAllowed === true && styles.activeBadge]} onPress={() => setSmokingAllowed(true)}>
                <MaterialIcons name="smoking-rooms" size={20} color={smokingAllowed === true ? "#fff" : "#003366"} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.badge, smokingAllowed === false && styles.activeBadge]} onPress={() => setSmokingAllowed(false)}>
                <MaterialIcons name="smoke-free" size={20} color={smokingAllowed === false ? "#fff" : "#003366"} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.badge, petsAllowed === true && styles.activeBadge]} onPress={() => setPetsAllowed(true)}>
                <MaterialIcons name="pets" size={20} color={petsAllowed === true ? "#fff" : "#003366"} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.badge, petsAllowed === false && styles.activeBadge]} onPress={() => setPetsAllowed(false)}>
                <MaterialIcons name="block" size={20} color={petsAllowed === false ? "#fff" : "#003366"} />
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <TouchableOpacity style={[styles.badge, acAvailable && styles.activeBadge]} onPress={() => setAcAvailable(!acAvailable)}>
                <MaterialIcons name="ac-unit" size={20} color={acAvailable ? "#fff" : "#003366"} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.badge, bikeSpace && styles.activeBadge]} onPress={() => setBikeSpace(!bikeSpace)}>
                <MaterialIcons name="directions-bike" size={20} color={bikeSpace ? "#fff" : "#003366"} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.badge, skiSpace && styles.activeBadge]} onPress={() => setSkiSpace(!skiSpace)}>
                <MaterialIcons name="downhill-skiing" size={20} color={skiSpace ? "#fff" : "#003366"} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Paiement accepté</Text>
            <View style={styles.badgeRow}>
              <TouchableOpacity style={[styles.badge, paymentMethod === "cash" && styles.activeBadge]} onPress={() => setPaymentMethod("cash")}>
                <MaterialIcons name="attach-money" size={20} color={paymentMethod === "cash" ? "#fff" : "#003366"} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.badge, paymentMethod === "card" && styles.activeBadge]} onPress={() => setPaymentMethod("card")}>
                <MaterialIcons name="credit-card" size={20} color={paymentMethod === "card" ? "#fff" : "#003366"} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Taille du véhicule</Text>
            <View style={styles.badgeRow}>
              {["small", "medium", "large", "suv"].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.badge, vehicleSize === size && styles.activeBadge]}
                  onPress={() => setVehicleSize(size)}
                >
                  <MaterialIcons
                    name={size === "suv" ? "airport-shuttle" : "directions-car"}
                    size={20}
                    color={vehicleSize === size ? "#fff" : "#003366"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={() => {
            onApply({
              passengerCount,
              priceLimit,
              verifiedOnly,
              favoritesOnly,
              maxTwoStops,
              smokingAllowed,
              petsAllowed,
              acAvailable,
              bikeSpace,
              skiSpace,
              paymentMethod,
              vehicleSize,
            });
            onClose();
          }}>
            <Text style={styles.applyText}>Appliquer les filtres</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModalScreen;

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
  },
  value: {
    color: '#333',
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  switchLabel: {
    flex: 1,
    color: '#003366',
    marginRight: 10,
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  badge: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#003366',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  activeBadge: {
    backgroundColor: '#003366',
    borderColor: '#FFCC00',
  },
  applyBtn: {
    backgroundColor: '#FFCC00',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  applyText: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
