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

const GooglePlacesInput = ({ 
  placeholder, 
  onSelect, 
  style, 
  types = '(cities)', 
  country = 'ca',
  initialValue = '' 
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Mettre à jour la valeur quand initialValue change
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Fonction debounce pour limiter les appels API
  const fetchSuggestionsDebounced = (searchText) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      if (searchText.length > 2) {
        fetchSuggestions(searchText);
      } else {
        setResults([]);
      }
    }, 500); // Délai de 500ms
    
    setDebounceTimer(timer);
  };

  const fetchSuggestions = async (searchText) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchText)}&key=${GOOGLE_API_KEY}&language=fr&types=${types}&components=country:${country}`
      );
      const data = await res.json();
      setResults(data.predictions || []);
    } catch (err) {
      console.error("Erreur API Places:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (place) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      const location = data.result.geometry.location;

      // Extraction du nom de la ville uniquement depuis structured_formatting.main_text
      const cityName = place.structured_formatting?.main_text;

      const result = {
        city: cityName,
        description: cityName,
        latitude: location.lat,
        longitude: location.lng
      };

      setQuery(cityName);
      setResults([]); // Ferme immédiatement la liste des suggestions
      onSelect(result);
    } catch (err) {
      console.error("Erreur lors de la sélection:", err);
    }
  };

  const handleChangeText = (text) => {
    setQuery(text);
    fetchSuggestionsDebounced(text);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={handleChangeText}
        placeholderTextColor="#999"
        autoCapitalize="words"
      />
      {loading && <ActivityIndicator size="small" color="#003366" style={styles.loader} />}
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.resultItem} 
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.mainText}>{item.structured_formatting.main_text}</Text>
              <Text style={styles.secondaryText}>{item.structured_formatting.secondary_text}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="always"
          style={styles.resultsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1000, // Z-index élevé pour que les suggestions s'affichent au-dessus
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0, // Enlever le padding vertical pour s'aligner avec le design existant
    paddingHorizontal: 0,
    margin: 0,
  },
  resultsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#FFF',
    zIndex: 1001,
    elevation: 5, // Pour Android
    shadowColor: '#000', // Pour iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mainText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#333',
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loader: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});

export default GooglePlacesInput;