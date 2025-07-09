import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import {styles} from "./styles"
import { Ionicons } from '@expo/vector-icons';

import password_service from '../../../services/service_pwd/password_service';

const EmailVerifiedScreen = ({ navigation }) => {
  // États
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef(null);

  // Validation de l'email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Envoyer le code de vérification
  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide');
      emailInputRef.current.focus();
      return;
    }
  
    try {
      setIsLoading(true);
  
      // Appel API pour envoyer le code
      const response = await password_service.CheckEmail(email);
  
      // Optionnel : tu peux afficher la réponse de l’API ici
      // console.log('Réponse CheckEmail:', response);
  
      Alert.alert('Code envoyé', `Un code de vérification a été envoyé à ${email}`);
      navigation.navigate('CodeReceived', { email });
    } catch (error) {
      console.error('Erreur lors de l’envoi du code :', error.message);
      Alert.alert('Erreur', 'Impossible d’envoyer le code. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* En-tête */}
        <View style={styles.header}>
          <Ionicons name="mail-outline" size={60} color="#FFC72C" />
          <Text style={styles.title}>Vérification d'email</Text>
          <Text style={styles.subtitle}>
            Entrez votre adresse email pour recevoir un code de vérification
          </Text>
        </View>

        {/* Champ email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Adresse email</Text>
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleSendCode}
          />
        </View>

        {/* Bouton d'envoi */}
        <TouchableOpacity
          style={[styles.button, (!email || isLoading) && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={!email || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Envoyer le code</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En cliquant sur "Envoyer le code", vous acceptez nos conditions d'utilisation
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};



export default EmailVerifiedScreen;