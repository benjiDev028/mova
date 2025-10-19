import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { EXPO_PUBLIC_GOOGLE_API_KEY } from '@env';

// ✅ Utilise ta clé depuis .env (évite de la hardcoder)
const GOOGLE_API_KEY = EXPO_PUBLIC_GOOGLE_API_KEY || '';

const DEFAULT_ALLOWED_TYPES = [
  'train_station',
  'subway_station',
  'bus_station',
  'transit_station',
  'airport',
  'park',
  'library',
  'university',
  'shopping_mall',
  'stadium',
  'museum',
  'church',
  'mosque',
  'restaurant',
  'cafe',
  'school',
  'establishment',
  'point_of_interest',
];

// Petite utilitaire pour annuler les fetchs précédents
const useAbortController = () => {
  const ref = useRef(null);
  useEffect(() => () => ref.current?.abort(), []);
  const next = () => {
    ref.current?.abort();
    ref.current = new AbortController();
    return ref.current.signal;
  };
  return next;
};

const GooglePlacesInputPublicOnly = forwardRef(
  (
    {
      placeholder = 'Rechercher un lieu public',
      onSelect,
      style,
      baseLocation,         // string: bias ville
      value,                // si fourni => input contrôlé par le parent
      initialValue = '',    // valeur initiale si non contrôlé
      onChangeText,         // callback de saisie
      country = 'ca',
      radius = 30000,       // 30 km
      minLength = 3,
      allowedTypes = DEFAULT_ALLOWED_TYPES,
    },
    ref
  ) => {
    // --- État interne (si non contrôlé) ---
    const [query, setQuery] = useState(initialValue);
    const isControlled = value !== undefined && value !== null;
    const inputValue = isControlled ? value : query;

    const [coords, setCoords] = useState(null); // { lat, lng }
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    const geocodeAbortSignal = useAbortController();
    const autoAbortSignal = useAbortController();
    const detailsAbortSignal = useAbortController();

    // Token de session pour l’autocomplete (meilleure facturation/résultats)
    const sessionToken = useMemo(
      () => Math.random().toString(36).slice(2) + Date.now().toString(36),
      []
    );

    // --- Impératif API via ref ---
    const inputRef = useRef(null);
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        if (isControlled) {
          onChangeText?.('');
        } else {
          setQuery('');
        }
        setResults([]);
      },
      setText: (text) => {
        if (isControlled) {
          onChangeText?.(text);
        } else {
          setQuery(text);
        }
      },
      getValue: () => (isControlled ? value : query),
    }), [isControlled, onChangeText, value, query]);

    // --- 1) Géocoder la ville de base pour biaiser les résultats ---
    useEffect(() => {
      if (!baseLocation || !GOOGLE_API_KEY) {
        setCoords(null);
        return;
      }
      const run = async () => {
        try {
          setError(null);
          const signal = geocodeAbortSignal();
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            `${baseLocation}, Canada`
          )}&region=${country}&language=fr&key=${GOOGLE_API_KEY}`;
          const res = await fetch(url, { signal });
          const data = await res.json();
          const loc = data?.results?.[0]?.geometry?.location;
          setCoords(loc ? { lat: loc.lat, lng: loc.lng } : null);
        } catch (e) {
          if (e.name !== 'AbortError') setCoords(null);
        }
      };
      run();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseLocation, country, GOOGLE_API_KEY]);

    // --- 2) Autocomplete avec debounce + annulation ---
    useEffect(() => {
      if (!GOOGLE_API_KEY) {
        setResults([]);
        return;
      }
      const q = (inputValue || '').trim();
      if (q.length < minLength) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      const timer = setTimeout(async () => {
        try {
          const signal = autoAbortSignal();
          const locationParam = coords
            ? `&location=${coords.lat},${coords.lng}&radius=${radius}`
            : '';

          const url =
            `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
            `?input=${encodeURIComponent(q)}` +
            `&key=${GOOGLE_API_KEY}` +
            `&language=fr` +
            `&components=country:${country}` +
            `&types=establishment` +
            `&sessiontoken=${sessionToken}` +
            locationParam;

          const res = await fetch(url, { signal });
          const data = await res.json();
          setResults(Array.isArray(data?.predictions) ? data.predictions : []);
        } catch (e) {
          if (e.name !== 'AbortError') {
            setError('Impossible de récupérer les suggestions.');
            setResults([]);
          }
        } finally {
          setLoading(false);
        }
      }, 250); // debounce 250ms

      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue, coords, country, radius, minLength, GOOGLE_API_KEY, sessionToken]);

    // --- 3) Sélection d’un item -> Place Details + validation types ---
    const handleSelect = async (prediction) => {
      if (!GOOGLE_API_KEY) return;

      try {
        const signal = detailsAbortSignal();
        const url =
          `https://maps.googleapis.com/maps/api/place/details/json` +
          `?place_id=${prediction.place_id}` +
          `&fields=place_id,name,formatted_address,geometry,types` +
          `&language=fr` +
          `&key=${GOOGLE_API_KEY}` +
          `&sessiontoken=${sessionToken}`;

        const res = await fetch(url, { signal });
        const data = await res.json();
        const place = data?.result;

        if (!place?.geometry?.location) {
          Alert.alert('Lieu invalide', "Ce lieu n'a pas de coordonnées.");
          return;
        }

        const placeTypes = (place.types || []).map((t) => t.toLowerCase());
        const isValid = placeTypes.some((t) => allowedTypes.includes(t));
        if (!isValid) {
          Alert.alert('Lieu non valide', 'Veuillez sélectionner un lieu public reconnu.');
          onSelect?.(null);
          return;
        }

        const latitude = place.geometry.location.lat;
        const longitude = place.geometry.location.lng;

        const normalized = {
          name: place.name,
          address: place.formatted_address,
          place_id: place.place_id,
          latitude,
          longitude,
          location: { latitude, longitude }, // compat
          types: placeTypes,
          description: prediction.description,
        };

        // ✅ Afficher dans la textbox
        const display =
          normalized.address && normalized.address !== normalized.name
            ? `${normalized.name} — ${normalized.address}`
            : normalized.name;

        if (isControlled) {
          onChangeText?.(display);
        } else {
          setQuery(display);
        }
        setResults([]);

        onSelect?.(normalized);
      } catch (e) {
        if (e.name === 'AbortError') return;
        Alert.alert('Erreur', "Impossible de valider ce lieu.");
        onSelect?.(null);
      }
    };

    // --- Saisie (contrôlé ou non) ---
    const handleChangeText = (text) => {
      if (isControlled) {
        onChangeText?.(text);
      } else {
        setQuery(text);
      }
    };

    return (
      <View style={[styles.container, style]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={inputValue}
          onChangeText={handleChangeText}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />

        {loading && (
          <ActivityIndicator size="small" color="#003366" style={{ marginTop: 6 }} />
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <FlatList
          data={results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelect(item)}
            >
              <Text numberOfLines={2} style={styles.resultText}>
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            inputValue?.length >= minLength && !loading ? (
              <Text style={styles.emptyText}>Aucune suggestion</Text>
            ) : null
          }
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  input: {
    height: 45,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F9FAFB',
  },
  resultItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  resultText: {
    color: '#111827',
    fontSize: 14,
  },
  emptyText: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  errorText: {
    paddingHorizontal: 12,
    paddingTop: 6,
    color: '#DC2626',
    fontSize: 12,
  },
});

export default GooglePlacesInputPublicOnly;
