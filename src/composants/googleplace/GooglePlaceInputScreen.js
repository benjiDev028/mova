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

const GooglePlacesInput = ({ placeholder, onSelect, style, types = '(cities)', country = 'ca' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
 const [isSelected, setIsSelected] = useState(false);

useEffect(() => {
  if (typeof onValidityChange === 'function') {
    onValidityChange(isSelected);
  }
}, [isSelected]);


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
        // description: place.description,
        description: cityName,
        latitude: location.lat,
        longitude: location.lng
      };

      setQuery(cityName);
      setResults([]); // Ferme immédiatement la liste des suggestions
      setIsSelected(true);
      onSelect(result);
      
      console.log("resssss",)
    } catch (err) {
      console.error("Erreur lors de la sélection:", err);
    }
  };

  const handleChangeText = (text) => {
    setQuery(text);
    setIsSelected(false); 
    fetchSuggestionsDebounced(text);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={handleChangeText}
        placeholderTextColor="#888"
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
    marginBottom: 8,
    zIndex: 1, // Important pour que la liste des suggestions s'affiche au-dessus des autres éléments
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
  resultsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#FFF',
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mainText: {
    fontWeight: '500',
    fontSize: 16,
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loader: {
    marginTop: 5,
  },
});

export default GooglePlacesInput;