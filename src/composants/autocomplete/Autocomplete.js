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
});

export default PlaceAutocomplete;