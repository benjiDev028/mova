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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003DA5',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#003DA5',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FFC72C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EmailVerifiedScreen;