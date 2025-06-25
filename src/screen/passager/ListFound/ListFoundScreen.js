import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  Entypo,
  FontAwesome5,
} from "@expo/vector-icons";

export default function ListFoundScreen({ navigation }) {
  const dummyTrips = [
    {
      id: 1,
      time: "18:15",
      departure: "Montréal - Côte-Vertu",
      arrival: "Gatineau - McDonald's, St-Raymond / St-Joseph",
      price: 25,
      rating: 4.9,
      reviews: 312,
      passengers: 0,
      maxPassengers: 4,
      driverName: "Marie-Claire",
      carModel: "Honda Civic 2020",
      preferences: ["nonFumeur", "climatisation", "valise", "chargeur", "animaux", "musique", "discussion", "silence"],
      estimatedDuration: "2h 15min",
      verified: true,
      stops: [
        { location: "Laval - Métro Montmorency", price: 15 },
        { location: "Saint-Jérôme Centre", price: 18 },
        { location: "Gatineau - McDonald's, St-Raymond / St-Joseph", price: 25 }
      ],
    },
    {
      id: 2,
      time: "18:15",
      departure: "Montréal - Côte-Vertu",
      arrival: "Ottawa - 140 George St, K1N 5W4",
      price: 25,
      rating: 4.9,
      reviews: 305,
      passengers: 2,
      maxPassengers: 4,
      driverName: "Alexandre",
      carModel: "Toyota Corolla 2019",
      preferences: ["nonFumeur", "climatisation", "valise", "chargeur"],
      estimatedDuration: "2h 30min",
      verified: true,
      stops: [
        { location: "Laval - Terminus", price: 12 },
        { location: "Gatineau Centre", price: 20 },
        { location: "Ottawa - 140 George St, K1N 5W4", price: 25 }
      ],
    },
    {
      id: 3,
      time: "18:45",
      departure: "Montréal - Station Namur (Burger King)",
      arrival: "Gatineau - McDonald's Allumettières / Maisonneuve",
      price: 23,
      rating: 5.0,
      reviews: 520,
      passengers: 1,
      maxPassengers: 3,
      driverName: "Jean-François",
      carModel: "Mazda CX-5 2021",
      preferences: ["climatisation", "fumeur", "vélo", "paiementCash"],
      estimatedDuration: "2h 05min",
      verified: false,
      stops: [
        { location: "Laval - Carrefour", price: 14 },
        { location: "Gatineau - McDonald's Allumettières / Maisonneuve", price: 23 }
      ],
    },
    {
      id: 4,
      time: "19:30",
      departure: "Montréal - Station Berri-UQAM",
      arrival: "Trois-Rivières - Université UQTR",
      price: 18,
      rating: 4.7,
      reviews: 89,
      passengers: 2,
      maxPassengers: 4,
      driverName: "Sophie",
      carModel: "Nissan Sentra 2018",
      preferences: ["nonFumeur", "musique", "chargeur"],
      estimatedDuration: "1h 45min",
      verified: true,
      stops: [
        { location: "Berthierville", price: 12 },
        { location: "Trois-Rivières - Université UQTR", price: 18 }
      ],
    },
    {
      id: 5,
      time: "10:30",
      departure: "Montréal - Station Berri-UQAM",
      arrival: "Trois-Rivières - Université UQTR",
      price: 18,
      rating: 4.7,
      reviews: 89,
      passengers: 2,
      maxPassengers: 4,
      driverName: "Sophie",
      carModel: "Nissan Sentra 2018",
      preferences: ["nonFumeur", "musique", "chargeur"],
      estimatedDuration: "1h 45min",
      verified: true,
      stops: [
        { location: "Berthierville", price: 12 },
        { location: "Trois-Rivières - Université UQTR", price: 18 }
      ],
    },
  ];

  const getPreferenceIcon = (pref) => {
    const icons = {
      nonFumeur: "smoke-free",
      fumeur: "smoking-rooms",
      climatisation: "ac-unit",
      valise: "luggage",
      chargeur: "battery-charging-full",
      vélo: "directions-bike",
      musique: "music-note",
      paiementCash: "payments",
      animaux: "pets",
      discussion: "chat",
      silence: "volume-off",
    };
    return icons[pref] || "check-circle";
  };

  const renderTripCard = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.timeContainer}>
          <MaterialIcons name="access-time" size={16} color="#007BFF" />
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price}$</Text>
          <Text style={styles.priceLabel}>CAD</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>{item.departure}</Text>
        </View>
        <View style={styles.routeLine} />
        
        {/* Affichage des arrêts multiples */}
        {item.stops && item.stops.map((stop, index) => (
          <View key={index}>
            <View style={styles.stopRow}>
              <View style={[styles.locationDot, index === item.stops.length - 1 ? styles.destinationDot : styles.stopDot]} />
              <View style={styles.stopInfo}>
                <Text style={styles.stopLocationText} numberOfLines={1}>{stop.location}</Text>
                <Text style={styles.stopPrice}>{stop.price}$ CAD</Text>
              </View>
            </View>
            {index < item.stops.length - 1 && <View style={styles.routeLine} />}
          </View>
        ))}
      </View>

      <View style={styles.driverInfo}>
        <View style={styles.driverDetails}>
          <View style={styles.driverNameContainer}>
            <FontAwesome5 name="user-circle" size={16} color="#6B7280" />
            <Text style={styles.driverName}>{item.driverName}</Text>
            {item.verified && (
              <View style={{ marginLeft: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 6, borderRadius: 6 }}>
                <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '600' }}>Vérifié</Text>
              </View>
            )}
          </View>
          <Text style={styles.carModel}>{item.carModel}</Text>
        </View>
        <Text style={styles.duration}>{item.estimatedDuration}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={14} color="#FFC107" />
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.reviews}>({item.reviews}+ avis)</Text>
        </View>

        <View style={styles.passengersContainer}>
          <MaterialIcons name="people" size={16} color="#6B7280" />
          <Text style={styles.passengers}>{item.passengers} sur {item.maxPassengers}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.preferencesScroll}
        contentContainerStyle={styles.preferencesContainer}
      >
        {item.preferences.map((pref, index) => (
          <View key={index} style={styles.preferenceChip}>
            <MaterialIcons
              name={getPreferenceIcon(pref)}
              size={12}
              color="#003366"
            />
            <Text style={[styles.preferenceText, { color: "#003366" }]}> {pref} </Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.bookButton} 
      onPress={() => navigation.navigate("DetailTrip", { trip: item })}
      >
        <Text style={styles.bookButtonText}>Réserver</Text>
        <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.textHeader}>Trajets disponibles</Text>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="tune" size={24} color="#007BFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{dummyTrips.length} résultat(s)</Text>
        <Text style={styles.resultsDate}>Dimanche 15 juin 2025</Text>
      </View>

      <FlatList
        data={dummyTrips}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTripCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  textHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultsDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  time: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003366',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  routeContainer: {
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#003366',
    marginRight: 12,
  },
  stopDot: {
    backgroundColor: '#FFC107',
    width: 6,
    height: 6,
  },
  destinationDot: {
    backgroundColor: '#059669',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 3,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  stopInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopLocationText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  stopPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  driverDetails: {
    flex: 1,
  },
  driverNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
    marginRight: 4,
  },
  carModel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  passengersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  passengers: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 4,
  },
  preferencesScroll: {
    marginBottom: 12,
    maxHeight: 30,
  },
  preferencesContainer: {
    paddingRight: 16,
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  preferenceText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 3,
  },
  bookButton: {
    backgroundColor: '#003366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
});