
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const ReviewAndConfirmScreen = () => {
  const departure = { latitude: 45.4001, longitude: -71.8998 };
  const arrival = { latitude: 45.5101, longitude: -71.6501 };
  const stops = [
    { latitude: 45.4301, longitude: -71.8001 },
    { latitude: 45.4601, longitude: -71.7501 }
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Résumé de votre trajet</Text>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: departure.latitude,
            longitude: departure.longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2,
          }}
        >
          <Marker coordinate={departure} title="Départ" pinColor="green" />
          {stops.map((stop, index) => (
            <Marker
              key={index}
              coordinate={stop}
              title={`Arrêt ${index + 1}`}
              pinColor="orange"
            />
          ))}
          <Marker coordinate={arrival} title="Arrivée" pinColor="red" />

          <Polyline
            coordinates={[departure, ...stops, arrival]}
            strokeColor="#003366"
            strokeWidth={3}
          />
        </MapView>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Départ :</Text>
        <Text>Bathurst</Text>
        <Text style={styles.sectionTitle}>Arrêts :</Text>
        {stops.map((stop, i) => (
          <Text key={i}>Arrêt {i + 1}</Text>
        ))}
        <Text style={styles.sectionTitle}>Arrivée :</Text>
        <Text>Destination Finale</Text>
      </View>
    </ScrollView>
  );
};

export default ReviewAndConfirmScreen;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fffaf0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#003366',
    marginTop: 10,
  },
});
