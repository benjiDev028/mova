import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

const GOOGLE_API_KEY = 'AIzaSyBwx5yyNbJYbt_TLBEozRXPl3oZD4wH-DE';

const GooglePlacesInput = ({ placeholder, onSelect, style }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 2) {
        setLoading(true);
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&language=fr&types=(cities)&components=country:ca`
          );
          const data = await res.json();
          setResults(data.predictions || []);
        } catch (err) {
          console.error("Erreur API Places:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    };

    fetchSuggestions();
  }, [query]);

const handleSelect = async (place) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      const location = data.result.geometry.location;

      // Extraire seulement le nom de la ville (première partie avant la virgule)
      const cityName = place.structured_formatting?.main_text || 
                      place.description.split(',')[0].trim();

      const result = {
        city: cityName, // Utilisation du nom de ville seulement
        description: place.description,
        latitude: location.lat,
        longitude: location.lng
      };

      setQuery(cityName); // Afficher seulement le nom de la ville dans l'input
      setResults([]);
      onSelect(result);
    } catch (err) {
      console.error("Erreur lors de la sélection:", err);
    }
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
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
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

export default GooglePlacesInput;
