// screen/conducteur/DropOffLocation/DropOffLocation.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import GooglePlacesInputPublicOnly from '../../../composants/googleplacepublic/GooglePlacesInputPublicOnly';
import { styles } from './styles';
import { EXPO_PUBLIC_GOOGLE_API_KEY } from '@env';

const API_KEY = EXPO_PUBLIC_GOOGLE_API_KEY || ''; // .env

// Types publics pertinents
const PUBLIC_PLACE_TYPES = [
  'transit_station',
  'bus_station',
  'train_station',
  'subway_station',
  'light_rail_station',
  'airport',
  'shopping_mall',
  'university',
  'library',
  'park',
  'city_hall',
];

const ICON_BY_TYPE = {
  transit_station: 'train',
  bus_station: 'bus',
  train_station: 'train',
  subway_station: 'subway',
  light_rail_station: 'train',
  airport: 'airplane',
  shopping_mall: 'bag-handle',
  university: 'school',
  library: 'book',
  park: 'leaf',
  city_hall: 'business',
};

const COMMON_FALLBACKS = (city) => ([
  { name: `Centre-ville de ${city}`, vicinity: city, _fallback: true },
  { name: `Gare routière de ${city}`, vicinity: city, _fallback: true },
  { name: `Centre commercial (${city})`, vicinity: city, _fallback: true },
]);

const MAX_RESULTS = 12;

const DropoffLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { departure, arrival, date, time, pickupLocation, stops } = route.params || {};

  // Dans ton flux, arrival est une string (ex: "Fredericton")
  const arrivalCity = typeof arrival === 'string' ? arrival : (arrival?.city || '');

  const inputRef = useRef(null);       // ref vers l'input pour setText/focus…
  const locationRef = useRef(null);    // valeur sélectionnée normalisée
  const [isValid, setIsValid] = useState(false);

  const [publicSuggestions, setPublicSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState(null);

  // “Ma position”
  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null); // { lat, lng }
  const [currentCityName, setCurrentCityName] = useState('');

  // -------- Helpers Google / distance --------
  const geocodeCity = useCallback(async (city) => {
    if (!API_KEY || !city) return null;
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(`${city}, Canada`)}` +
      `&region=ca&language=fr&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data?.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  }, []);

  const nearbySearch = useCallback(async ({ lat, lng }, type) => {
    if (!API_KEY) return [];
    const radius = 8000; // 8 km
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=${radius}&type=${type}` +
      `&language=fr&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  }, []);

  const placeToItem = (place, cityName) => ({
    place_id: place.place_id || place.id || `${place.name}-${place.vicinity || ''}`,
    name: place.name,
    address: place.vicinity || place.formatted_address || cityName,
    location: {
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
    },
    city: cityName,
    types: place.types || [],
    rating: place.rating || 0,
    total_ratings: place.user_ratings_total || 0,
  });

  const dedupeById = (arr) => {
    const map = new Map();
    arr.forEach((p) => {
      if (!map.has(p.place_id)) map.set(p.place_id, p);
    });
    return Array.from(map.values());
  };

  const haversine = (a, b) => {
    if (!a || !b) return Infinity;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000; // m
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  const sortByQualityOrDistance = (arr, center) => {
    const withDist = arr.map((p) => ({
      ...p,
      _dist: center
        ? haversine(
            { latitude: center.lat, longitude: center.lng },
            { latitude: p.location?.latitude, longitude: p.location?.longitude }
          )
        : null,
    }));

    if (center) {
      return withDist.sort((a, b) => (a._dist ?? Infinity) - (b._dist ?? Infinity));
    }
    return withDist.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if ((b.total_ratings || 0) !== (a.total_ratings || 0))
        return (b.total_ratings || 0) - (a.total_ratings || 0);
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  // -------- Chargement suggestions autour de la ville d'arrivée --------
  const fetchSuggestionsForCity = useCallback(async (city) => {
    if (!city) return;
    if (!API_KEY) {
      setPublicSuggestions(COMMON_FALLBACKS(city));
      setErrorSuggestions('Clé Google API manquante. Fallback affiché.');
      return;
    }
    try {
      setLoadingSuggestions(true);
      setErrorSuggestions(null);

      const center = await geocodeCity(city);
      if (!center) {
        setPublicSuggestions(COMMON_FALLBACKS(city));
        setErrorSuggestions('Ville introuvable, fallback proposé.');
        return;
      }

      const lists = await Promise.all(
        PUBLIC_PLACE_TYPES.map((t) => nearbySearch(center, t).catch(() => []))
      );
      const merged = lists.flat().map((p) => placeToItem(p, city));
      const unique = dedupeById(merged);
      const sorted = sortByQualityOrDistance(unique, center);
      setPublicSuggestions(sorted.slice(0, MAX_RESULTS));
    } catch (e) {
      setPublicSuggestions(COMMON_FALLBACKS(city));
      setErrorSuggestions('Erreur de recherche, fallback proposé.');
    } finally {
      setLoadingSuggestions(false);
    }
  }, [geocodeCity, nearbySearch]);

  useEffect(() => {
    if (arrivalCity && !usingMyLocation) {
      fetchSuggestionsForCity(arrivalCity);
    }
  }, [arrivalCity, usingMyLocation, fetchSuggestionsForCity]);

  // -------- Sélection d’un lieu (remplit la textbox) --------
  const selectPlace = (item) => {
    if (!item?.location?.latitude || !item?.location?.longitude) {
      Alert.alert('Lieu invalide', 'Ce lieu ne contient pas de coordonnées valides.');
      return;
    }

    locationRef.current = {
      name: item.name,
      address: item.address,
      latitude: item.location.latitude,
      longitude: item.location.longitude,
      city: item.city || arrivalCity || currentCityName,
      place_id: item.place_id,
      types: item.types || [],
    };
    setIsValid(true);

    // Afficher le libellé dans la textbox
    const display =
      item.address && item.address !== item.name
        ? `${item.name} — ${item.address}`
        : item.name;
    inputRef.current?.setText?.(display);
  };

  // -------- “Utiliser ma position” --------
  const useMyLocation = async () => {
    try {
      setLoadingLocation(true);
      setUsingMyLocation(false);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Autorise la localisation pour utiliser cette fonctionnalité.'
        );
        setLoadingLocation(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
      });

      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentCoords(coords);

      let cityLabel = '';
      try {
        const rev = await Location.reverseGeocodeAsync({
          latitude: coords.lat,
          longitude: coords.lng,
        });
        if (rev && rev[0]) {
          cityLabel = rev[0].city || rev[0].subregion || rev[0].region || '';
        }
      } catch {}

      if (!cityLabel) cityLabel = 'Votre position';
      setCurrentCityName(cityLabel);

      // Hint dans l’input (ce n’est PAS encore une sélection)
      inputRef.current?.setText?.(`Autour de : ${cityLabel}`);

      // Charger suggestions autour de la position
      if (API_KEY) {
        try {
          setLoadingSuggestions(true);
          const lists = await Promise.all(
            PUBLIC_PLACE_TYPES.map((t) => nearbySearch(coords, t).catch(() => []))
          );
          const merged = lists.flat().map((p) => placeToItem(p, cityLabel));
          const unique = dedupeById(merged);
          const sorted = sortByQualityOrDistance(unique, coords);
          setPublicSuggestions(sorted.slice(0, MAX_RESULTS));
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setPublicSuggestions(COMMON_FALLBACKS(cityLabel));
        setErrorSuggestions('Clé Google API manquante. Fallback affiché.');
      }

      setUsingMyLocation(true);
      setIsValid(false);
      locationRef.current = null;
    } catch (e) {
      Alert.alert('Erreur', e?.message || 'Impossible de récupérer votre position.');
    } finally {
      setLoadingLocation(false);
    }
  };

  // -------- Raccourcis (train/bus/métro) --------
  const handleShortcut = async (kind) => {
    const pickFrom = usingMyLocation && currentCoords
      ? { coords: currentCoords, city: currentCityName }
      : { coords: null, city: arrivalCity };

    try {
      setLoadingSuggestions(true);
      setErrorSuggestions(null);

      let center = pickFrom.coords;
      if (!center) {
        center = await geocodeCity(pickFrom.city);
        if (!center) throw new Error('Ville introuvable');
      }

      const typeByKind = { train: 'train_station', subway: 'subway_station', bus: 'bus_station' };
      const type = typeByKind[kind] || 'transit_station';

      const places = await nearbySearch(center, type);
      if (!places.length) {
        Alert.alert('Aucun résultat', `Aucun lieu trouvé à proximité pour “${kind}”.`);
        return;
      }

      const items = places.map((p) => placeToItem(p, pickFrom.city));
      const sorted = sortByQualityOrDistance(items, center);
      selectPlace(sorted[0]); // sélection + remplit l’input
    } catch (e) {
      Alert.alert('Erreur', e?.message || 'Recherche impossible.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleConfirm = () => {
    if (!locationRef.current) {
      Alert.alert('Erreur', 'Veuillez sélectionner un lieu public valide.');
      return;
    }

    navigation.navigate('Preferences', {
      departure,
      arrival,
      date,
      time,
      stops,
      pickupLocation,
      dropoffLocation: locationRef.current,
    });
  };

  const renderSuggestionPill = (item) => {
    const mainType = (item.types || []).find((t) => ICON_BY_TYPE[t]) || 'transit_station';
    const iconName = ICON_BY_TYPE[mainType] || 'location';

    return (
      <TouchableOpacity
        key={item.place_id}
        style={styles.suggestionButton}
        onPress={() => selectPlace(item)}
        accessibilityLabel={`Sélectionner ${item.name}`}
      >
        <Ionicons name={iconName} size={18} color="#003366" />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.suggestionText} numberOfLines={1}>{item.name}</Text>
          {!!item.address && (
            <Text style={{ fontSize: 11, color: '#6B7280' }} numberOfLines={1}>
              {item.address}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lieu de destination</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.title}>Lieu de point de chute</Text>
      <Text style={styles.subtitle}>Choisissez un point de chute public</Text>

      {/* “Utiliser ma position” */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 }}>
        <TouchableOpacity
          onPress={useMyLocation}
          style={[styles.suggestionButton, { flex: 0 }]}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#003366" />
          ) : (
            <>
              <Ionicons name="locate" size={18} color="#003366" />
              <Text style={styles.suggestionText}>Utiliser ma position</Text>
            </>
          )}
        </TouchableOpacity>
        {!!usingMyLocation && !!currentCityName && (
          <Text style={{ marginLeft: 10, color: '#003366' }}>
            {`Autour de : ${currentCityName}`}
          </Text>
        )}
      </View>

      {/* Champ de recherche (contrôlé via ref) */}
      <GooglePlacesInputPublicOnly
        ref={inputRef}
        placeholder="Rechercher une station, gare, aéroport, etc."
        baseLocation={usingMyLocation ? (currentCityName || arrivalCity) : arrivalCity}
        onSelect={(place) => {
          if (!place) {
            setIsValid(false);
            locationRef.current = null;
            return;
          }
          // Normalisation vers notre format interne
          const item = {
            place_id: place.place_id,
            name: place.name,
            address: place.address,
            location: { latitude: place.latitude, longitude: place.longitude },
            city: usingMyLocation ? currentCityName : arrivalCity,
            types: place.types || [],
          };

          // Afficher dans la textbox
          const label =
            item.address && item.address !== item.name
              ? `${item.name} — ${item.address}`
              : item.name;
          inputRef.current?.setText?.(label);

          // Sélection
          selectPlace(item);
        }}
      />

      {/* Raccourcis & Suggestions */}
      <ScrollView contentContainerStyle={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggestions :</Text>

        {/* Raccourcis */}
        <View style={styles.suggestionButtons}>
          <TouchableOpacity style={styles.suggestionButton} onPress={() => handleShortcut('train')}>
            <Ionicons name="train" size={18} color="#003366" />
            <Text style={styles.suggestionText}>Gare la plus proche</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionButton} onPress={() => handleShortcut('bus')}>
            <Ionicons name="bus" size={18} color="#003366" />
            <Text style={styles.suggestionText}>Terminus bus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionButton} onPress={() => handleShortcut('subway')}>
            <Ionicons name="subway" size={18} color="#003366" />
            <Text style={styles.suggestionText}>Station de métro</Text>
          </TouchableOpacity>
        </View>

        {/* Liste suggestions */}
        {loadingSuggestions ? (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator size="small" color="#003366" />
            <Text style={{ textAlign: 'center', marginTop: 8, color: '#666' }}>
              Recherche de lieux publics...
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            {publicSuggestions.map(renderSuggestionPill)}
            {!!errorSuggestions && (
              <Text style={{ color: '#B91C1C', marginTop: 8 }}>{errorSuggestions}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.button, !isValid && styles.disabledButton]}
        onPress={handleConfirm}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default DropoffLocationScreen;
