// 4. MainNavigator.js - Navigateur principal qui gère Auth vs App
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import AuthStack from './client/AuthStack';
import ClientStack from './client/ClientStack';

const RootStack = createStackNavigator();

export default function MainNavigator() {
  const isLoading = false;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFC72C" />
      </View>
    );
  }

  return (
    <RootStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="AuthStack"
    >
      <RootStack.Screen name="AuthStack" component={AuthStack} />
      <RootStack.Screen name="ClientStack" component={ClientStack} />
    </RootStack.Navigator>
  );
}
