import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';

const GOOGLE_API_KEY = 'AIzaSyBwx5yyNbJYbt_TLBEozRXPl3oZD4wH-DE';

const allowedTypes = [
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
  'point_of_interest'
];

const GooglePlacesInputPublicOnly = ({ placeholder, onSelect, style, baseLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);

  // 1. Récupère les coordonnées de la ville de base
  useEffect(() => {
    if (baseLocation) {
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(baseLocation)}&key=${GOOGLE_API_KEY}`)
        .then(res => res.json())
        .then(data => {
          if (data.results.length > 0) {
            setCoords(data.results[0].geometry.location);
          }
        });
    }
  }, [baseLocation]);

  // 2. Requête Autocomplete ciblée
  useEffect(() => {
    if (query.length > 2) {
      setLoading(true);
      const locationParams = coords ? `&location=${coords.lat},${coords.lng}&radius=30000` : '';
      fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_API_KEY}&language=fr&components=country:ca&types=establishment${locationParams}`
      )
        .then(res => res.json())
        .then(data => {
          setResults(data.predictions || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [query, coords]);

  // 3. Validation du lieu
  const handleSelect = (place) => {
    fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        const resultData = data.result;
        const types = resultData.types?.map(t => t.toLowerCase()) || [];
        const isValid = types.some(type => allowedTypes.includes(type));

        if (!isValid) {
          Alert.alert("Lieu non valide", "Veuillez sélectionner un lieu public reconnu.");
          onSelect(null);
          return;
        }

        const location = resultData.geometry.location;
        const result = {
          name: resultData.name,
          description: place.description,
          address: resultData.formatted_address,
          place_id: place.place_id,
          location,
        };

        setQuery(resultData.name);
        setResults([]);
        onSelect(result);
      })
      .catch(() => {
        Alert.alert("Erreur", "Impossible de valider ce lieu.");
        onSelect(null);
      });
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        placeholderTextColor="#888"
      />
      {loading && <ActivityIndicator size="small" color="#003366" style={{ marginTop: 5 }} />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

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
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default GooglePlacesInputPublicOnly;
