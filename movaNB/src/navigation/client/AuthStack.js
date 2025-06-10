// 1. AuthStack.js - Stack pour l'authentification uniquement
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import IntroScreen from '../../screen/authentifaction/Intro/IntroScreen';
import LoginScreen from '../../screen/authentifaction/login/LoginScreen';
import RegisterScreen from '../../screen/authentifaction/register/RegisterScreen';
import EmailVerifiedScreen from '../../screen/authentifaction/EmailVerified/EmailVerifiedScreen';
import CodeReceivedScreen from '../../screen/authentifaction/CodeReceived/CodeReceivedScreen';
import PasswordResetScreen from '../../screen/authentifaction/PasswordReset/PasswordResetScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="intro"
    >
      <Stack.Screen name="intro" component={IntroScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailVerified" component={EmailVerifiedScreen} />
      <Stack.Screen name="CodeReceived" component={CodeReceivedScreen} />
      <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />

    </Stack.Navigator>
  );
};

export default AuthStack;