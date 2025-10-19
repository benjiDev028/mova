import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VehicleAndPriceScreen = ({ route, navigation }) => {
  const {
    departure,
    arrival,
    pickupLocation,
    dropoffLocation,
    date,
    time,
    preferences,
    stops = [],
    destinationPrice = '',
  } = route.params || {};

  /** ---------- Helpers ---------- */
  const getCityName = (location) => {
    if (!location) return 'Arrêt';
    if (typeof location === 'string') return location;
    return (
      location.city ||
      location.name ||
      location.description ||
      location.vicinity ||
      'Arrêt'
    );
  };

  // Normalise chaque stop vers { id, label, price, raw }
  const normalisedStops = useMemo(() => {
    return (stops || []).map((stop, idx) => {
      const label = getCityName(stop?.location ?? stop);
      const price = typeof stop?.price === 'number' ? stop.price.toString() : (stop?.price || '');
      return {
        id: stop?.id ?? `stop-${idx}`,
        label,
        price: price?.toString() ?? '',
        raw: stop,
      };
    });
  }, [stops]);

  // Nettoie la saisie utilisateur -> chaîne utilisable dans state
  const sanitisePriceInput = (text) => {
    // remplace virgule par point & supprime tout le reste sauf chiffres/point
    let v = (text || '').replace(',', '.').replace(/[^0-9.]/g, '');

    // empêche plusieurs points
    const parts = v.split('.');
    if (parts.length > 2) {
      v = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    // limite à 2 décimales
    if (v.includes('.')) {
      const [a, b] = v.split('.');
      v = `${a}.${b.slice(0, 2)}`;
    }

    // supprime zéros de tête inutiles (sauf "0." et "0")
    if (v.length > 1 && v[0] === '0' && v[1] !== '.') {
      v = String(Number(v)); // "0005" -> "5"
    }

    return v;
  };

  const toNumber = (s) => {
    const n = parseFloat(String(s).replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  };

  const isValidPrice = (s) => {
    const n = toNumber(s);
    return Number.isFinite(n) && n > 0;
  };

  /** ---------- State ---------- */
  const [localStops, setLocalStops] = useState(normalisedStops);
  const [arrivalPrice, setArrivalPrice] = useState(
    destinationPrice ? String(destinationPrice) : ''
  );
  const [isFormValid, setIsFormValid] = useState(false);
  const [basePrice, setBasePrice] = useState(''); // pour "appliquer à tous"

  // Si la liste initiale change (rare), resynchronise
  useEffect(() => {
    setLocalStops(normalisedStops);
  }, [normalisedStops]);

  /** ---------- Validation globale ---------- */
  useEffect(() => {
    const allStopsOk = localStops.every((s) => isValidPrice(s.price));
    const arrivalOk = isValidPrice(arrivalPrice);
    setIsFormValid(allStopsOk && arrivalOk);
  }, [localStops, arrivalPrice]);

  /** ---------- Handlers ---------- */
  const handleStopPriceChange = (index, text) => {
    const value = sanitisePriceInput(text);
    setLocalStops((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], price: value };
      return next;
    });
  };

  const handleArrivalChange = (text) => {
    setArrivalPrice(sanitisePriceInput(text));
  };

  const handleApplyAll = () => {
    if (!isValidPrice(basePrice)) {
      Alert.alert('Prix de base invalide', 'Saisis un prix (> 0) avant d’appliquer.');
      return;
    }
    setLocalStops((prev) => prev.map((s) => ({ ...s, price: sanitisePriceInput(basePrice) })));
  };

  const validateAndContinue = () => {
    if (!isFormValid) {
      Alert.alert(
        'Prix invalides',
        'Entre des valeurs numériques valides (> 0) pour tous les arrêts et la destination.'
      );
      return;
    }

    // On renvoie les stops en préservant la forme d’origine (raw)
    const nextStops = localStops.map(({ raw, price }) => ({
      ...(raw || {}),
      price: toNumber(price),
    }));

    navigation.navigate('VehiculeSelection', {
      departure,
      arrival,
      date,
      time,
      pickupLocation,
      dropoffLocation,
      preferences,
      stops: nextStops,
      destinationPrice: toNumber(arrivalPrice),
    });
  };

  /** ---------- Rendu ---------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuration des prix</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.subHeader}>
            Définis le prix pour chaque arrêt (montant par passager).
          </Text>

          {/* Barre d’action rapide */}
          {localStops.length > 0 && (
            <View style={styles.quickBar}>
              <View style={styles.basePriceWrapper}>
                <Text style={styles.quickLabel}>Prix de base</Text>
                <View style={[styles.priceInputWrapper, !isValidPrice(basePrice) && basePrice !== '' && styles.errorBorder]}>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    placeholder="0.00"
                    value={basePrice}
                    onChangeText={(t) => setBasePrice(sanitisePriceInput(t))}
                  />
                  <Text style={styles.currency}>$</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.applyAllBtn} onPress={handleApplyAll}>
                <Ionicons name="copy" size={16} color="#fff" />
                <Text style={styles.applyAllText}>Appliquer à tous</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Arrêts */}
          <View style={styles.priceSection}>
            <Text style={styles.sectionTitle}>Arrêts intermédiaires</Text>

            {localStops.length === 0 ? (
              <Text style={{ color: '#6B7280' }}>Aucun arrêt intermédiaire.</Text>
            ) : (
              localStops.map((stop, index) => {
                const invalid = !isValidPrice(stop.price);
                return (
                  <View key={stop.id} style={styles.priceRow}>
                    <Text style={styles.stopLabel} numberOfLines={1}>
                      {stop.label}
                    </Text>
                    <View
                      style={[
                        styles.priceInputWrapper,
                        invalid && styles.errorBorder,
                      ]}
                    >
                      <TextInput
                        style={styles.priceInput}
                        keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                        placeholder="0.00"
                        value={stop.price}
                        onChangeText={(v) => handleStopPriceChange(index, v)}
                      />
                      <Text style={styles.currency}>$</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Destination */}
          <View style={styles.priceSection}>
            <Text style={styles.sectionTitle}>Destination finale</Text>
            <View style={styles.priceRow}>
              <Text style={styles.stopLabel} numberOfLines={1}>
                {getCityName(arrival)}
              </Text>
              <View
                style={[
                  styles.priceInputWrapper,
                  !isValidPrice(arrivalPrice) && styles.errorBorder,
                ]}
              >
                <TextInput
                  style={styles.priceInput}
                  keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                  placeholder="0.00"
                  value={arrivalPrice}
                  onChangeText={handleArrivalChange}
                />
                <Text style={styles.currency}>$</Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.button, !isFormValid && styles.disabledButton]}
            onPress={validateAndContinue}
            disabled={!isFormValid}
          >
            <Text style={styles.buttonText}>Continuer vers la sélection du véhicule</Text>
            <Ionicons name="car-sport" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Hint validation */}
          {!isFormValid && (
            <Text style={styles.hint}>
              Tous les prix doivent être&nbsp;{'\u003E'}&nbsp;0 (utilise “Appliquer à tous” pour aller plus vite).
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/** ---------- Styles ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366', textAlign: 'center', flex: 1 },
  placeholder: { width: 24 },

  scrollContent: { padding: 20, paddingBottom: 120 },
  subHeader: { fontSize: 16, color: '#6B7280', marginBottom: 20, textAlign: 'center' },

  quickBar: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  basePriceWrapper: { flex: 1, marginRight: 12 },
  quickLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8 },

  applyAllBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#003DA5',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  applyAllText: { color: '#fff', fontWeight: '600', marginLeft: 6 },

  priceSection: {
    marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 6, elevation: 3,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 14,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },

  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  stopLabel: { fontSize: 15, color: '#374151', flex: 1, paddingRight: 12 },

  priceInputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12,
  },
  priceInput: { width: 90, paddingVertical: 10, fontSize: 16, color: '#111827' },
  currency: { fontSize: 16, color: '#6B7280', marginLeft: 4 },

  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#003DA5', padding: 16, borderRadius: 12, marginTop: 20,
  },
  disabledButton: { backgroundColor: '#9CA3AF' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginRight: 10 },

  errorBorder: { borderColor: '#EF4444' },

  hint: {
    marginTop: 10, textAlign: 'center', color: '#EF4444',
  },
});

export default VehicleAndPriceScreen;
