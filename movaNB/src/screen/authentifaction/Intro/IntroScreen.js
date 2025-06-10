// Installation recommandée :
// npm install react-native-app-intro-slider

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '0',
    title: 'Covoiturage simple',
    subtitle: 'pour tout le Nouveau-Brunswick',
    image: require('../../../../assets/intro/grocery.png'),
    accentColor: '#C41E3A', // Rouge N.-B.
    icon: '🛒',
  },
  {
    key: '1',
    title: 'Des trajets sécurisés',
    subtitle: 'Des chauffeurs vérifiés pour votre tranquillité',
    image: require('../../../../assets/intro/diversity.png'), 
    accentColor: '#008080', 
    icon: '🔒',
  },
  
  {
    key: '2',
    title: 'Connectez-vous',
    subtitle: 'avec votre communauté',
    image: require('../../../../assets/intro/friend.png'),
    accentColor: '#003DA5', 
    icon: '👥',
  },
  {
    key: '3',
    title: 'Partagez vos trajets',
    subtitle: 'à travers la province',
    image: require('../../../../assets/intro/driver.png'),
    accentColor: '#228B22', // Vert forêt N.-B.
    icon: '🚗',
  },
  {
    key: '4',
    title: 'Économisez',
    subtitle: 'Réduisez vos frais d’essence et de stationnement',
    image: require('../../../../assets/intro/eco.png'), // à créer
    accentColor: '#28A745', // Vert économie
    icon: '💸',
  },
  {
    key: '5',
    title: 'MOVA',
    subtitle: 'Covoiturage Provincial',
    description: 'Votre plateforme de confiance pour tous vos déplacements',
    image: require('../../../../assets/intro/ride.png'),
    accentColor: '#FFC72C', // Or - couleur principale
    icon: '🍁',
    isFinal: true,
  },
];

const IntroScreen = ({ navigation }) => {
  const handleDone = () => {
    navigation.navigate('Login');
  };

  const AnimatedSlide = ({ item }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const translateAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <View style={styles.slide}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header avec icône animée */}
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }]
            }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.accentColor + '15' }]}>
            <Text style={styles.iconText}>{item.icon}</Text>
          </View>
        </Animated.View>

        {/* Image avec animation */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={[styles.imageWrapper, { borderColor: item.accentColor + '20' }]}>
            <Image 
              source={item.image} 
              style={styles.image} 
              resizeMode="cover"
            />
            {/* Accent moderne */}
            <View style={[styles.imageAccent, { backgroundColor: item.accentColor }]} />
          </View>
        </Animated.View>

        {/* Contenu textuel animé */}
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }]
            }
          ]}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: item.accentColor }]}>
            {item.subtitle}
          </Text>
          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}
        </Animated.View>

        {/* Bouton final avec animation */}
        {item.isFinal && (
          <Animated.View 
            style={[
              styles.buttonWrapper,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: item.accentColor }]} 
              onPress={handleDone}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Commencer</Text>
              <Text style={styles.buttonIcon}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderItem = ({ item }) => <AnimatedSlide item={item} />;

  const renderPagination = (activeIndex) => (
    <View style={styles.paginationContainer}>
      {slides.map((slide, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex 
              ? [styles.activeDot, { backgroundColor: slides[activeIndex].accentColor }]
              : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppIntroSlider
        renderItem={renderItem}
        data={slides}
        showDoneButton={false}
        showNextButton={false}
        renderPagination={renderPagination}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: height * 0.08,
    paddingBottom: height * 0.08,
    paddingHorizontal: 24,
  },

  // Header avec icône
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: {
    fontSize: 36,
  },

 
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 4,
    borderBottomLeftRadius: 20,
  },

  // Contenu textuel
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },

  // Bouton moderne
  buttonWrapper: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
   paddingBottom: 15,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    
  },
  buttonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Pagination élégante
  paginationContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    marginHorizontal: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 32,
    height: 8,
  },
  inactiveDot: {
    width: 8,
    height: 8,
    backgroundColor: '#E0E0E0',
  },
});

export default IntroScreen;