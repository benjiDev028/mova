import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GooglePlacesInputPublicOnly from '../../../composants/googleplacepublic/GooglePlacesInputPublicOnly';

const GOOGLE_API_KEY = 'AIzaSyBwx5yyNbJYbt_TLBEozRXPl3oZD4wH-DE';

const RouteSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    departure,
    arrival,
    date,
    stops,
    pickupLocation,
    dropoffLocation,
  } = route.params;

  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRouteOptions = async () => {
      try {
        const origin = `${pickupLocation.location.lat},${pickupLocation.location.lng}`;
        const destination = `${dropoffLocation.location.lat},${dropoffLocation.location.lng}`;

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&alternatives=true&key=${GOOGLE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        setRouteOptions(routes);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des itinéraires :', error);
        setLoading(false);
      }
    };

    fetchRouteOptions();
  }, []);

  const handleNext = () => {
    if (!selectedRoute) return;
    navigation.navigate('VehicleAndPrice', {
      departure,
      arrival,
      date,
      stops,
      pickupLocation,
      dropoffLocation,
      routeOption: selectedRoute,
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fffaf0" />

      <View style = {styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} >
          <Ionicons name="arrow-back" size={24} color="#003366" />
        
        </TouchableOpacity>
        <Text style={styles.title}> choisir route</Text>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={styles.placeholder}>
          Itinéraires disponibles
        </Text>
        <GooglePlacesInputPublicOnly
        placeholder="Rechercher une route ou un lieu">
       
</GooglePlacesInputPublicOnly>
      </View>
     

      


    
          
    </SafeAreaView>

  );
};

export default RouteSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,

   
  },
  backButton: {
    padding: 8,
   
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366',
    marginRight: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  placeholder: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 20,
    textAlign: 'center',
  },
});

