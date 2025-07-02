import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={styles.header}>
          <Image 
            source={require('../../../../assets/intro/ride.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={24} color="#003DA5" />
          </TouchableOpacity>
        </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          <Image
            source={require('../../../../assets/app/home.png')}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>Bienvenue sur Mova Ride</Text>
          <Text style={styles.subtitle}>
            Partagez vos trajets et économisez ensemble dans tout le Nouveau-Brunswick
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate('SearchTab')}
            >
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.buttonText}>Trouver un trajet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('AddTrajetTab')}
            >
              <Ionicons name="add" size={20} color="#003DA5" />
              <Text style={[styles.buttonText, { color: '#003DA5' }]}>Proposer un trajet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trajets populaires */}
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>Trajets populaires</Text>

          <View style={styles.popularRide}>
            <View style={styles.rideInfo}>
              <Text style={styles.rideRoute}>Moncton → Fredericton</Text>
              <Text style={styles.rideDetails}>Aujourd'hui • 8h30 • 3 places</Text>
            </View>
            <Text style={styles.ridePrice}>$15</Text>
          </View>

          <View style={styles.popularRide}>
            <View style={styles.rideInfo}>
              <Text style={styles.rideRoute}>Bathurst → Miramichi</Text>
              <Text style={styles.rideDetails}>Demain • 9h15 • 2 places</Text>
            </View>
            <Text style={styles.ridePrice}>$10</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  logo: {
    width: 120,
    height: 40,
  },
  notificationIcon: {
    padding: 5,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.6,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#003DA5',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#003DA5',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#003DA5',
  },
  buttonText: {
    marginLeft: 10,
    fontWeight: '600',
    fontSize: 16,
    color: 'white',
  },
  popularSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003DA5',
    marginBottom: 15,
  },
  popularRide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  rideInfo: {
    flex: 1,
  },
  rideRoute: {
    fontWeight: '600',
    marginBottom: 5,
  },
  rideDetails: {
    color: '#666',
    fontSize: 14,
  },
  ridePrice: {
    fontWeight: '700',
    color: '#003DA5',
    fontSize: 16,
  },
});

export default HomeScreen;
