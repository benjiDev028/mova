import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';

const GOOGLE_API_KEY = 'AIzaSyBwx5yyNbJYbt_TLBEozRXPl3oZD4wH-DE';

const PlaceAutocomplete = ({ placeholder, onSelect, value, onChangeText, style }) => {
  const [predictions, setPredictions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value && value.length > 2) {
      fetchPredictions(value);
    } else {
      setPredictions([]);
    }
  }, [value]);

  const fetchPredictions = async (input) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&language=fr&components=country:ca`
      );
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handleSelect = (prediction) => {
    onChangeText(prediction.description);
    onSelect({
      description: prediction.description,
      city: prediction.structured_formatting.main_text,
      placeId: prediction.place_id
    });
    setShowSuggestions(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setShowSuggestions(true);
        }}
        style={styles.input}
        placeholderTextColor="#999"
        autoCapitalize="words"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      
      {showSuggestions && predictions.length > 0 && (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.mainText}>{item.structured_formatting.main_text}</Text>
              <Text style={styles.secondaryText}>{item.structured_formatting.secondary_text}</Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
          keyboardShouldPersistTaps="always"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  suggestionsList: {
    maxHeight: 150,
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: 5,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mainText: {
    fontWeight: 'bold',
  },
  secondaryText: {
    color: '#666',
    fontSize: 12,
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 16,
  },
  
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1001,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  
  suggestionsList: {
    maxHeight: 200,
  },
  
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  
  secondaryText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default PlaceAutocomplete;