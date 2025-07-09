import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../../screen/user/Home/HomeScreen';
import SearchTrajetScreen from '../../screen/user/SearchTrajet/SearchTrajetScreen';
import AddTrajetScreen from '../../screen/user/AddTrajet/AddTrajetScreen';
import MesTrajetsScreen from '../../screen/user/MesTrajets/MesTrajetsScreen';
import ProfileScreen from '../../screen/user/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const ClientTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'AddTrajetTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'MesTrajetsTab') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#003DA5',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 5 : 10,
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Accueil', headerShown: true }} />
      <Tab.Screen name="SearchTab" component={SearchTrajetScreen} options={{ tabBarLabel: 'Rechercher', headerShown: true }} />
      <Tab.Screen name="AddTrajetTab" component={AddTrajetScreen} options={{ tabBarLabel: 'Ajouter' }} />
      <Tab.Screen name="MesTrajetsTab" component={MesTrajetsScreen} options={{ tabBarLabel: 'Mes trajets' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
};

export default ClientTabs;
