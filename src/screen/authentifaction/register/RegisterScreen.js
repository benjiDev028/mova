import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  ActivityIndicator,Alert
} from 'react-native';
import {styles} from "./styles"
import { Ionicons } from '@expo/vector-icons';
import {register} from '../../../services/Register'; // Assurez-vous d'avoir un service d'authentification


const RegisterScreen = ({ navigation }) => {
  // États du formulaire
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    city: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    date_of_birth: '',
   
  });
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Gestion de l'inscription
  const handleRegister = async() => {
    const {
      first_name,
      last_name,
      city,
      email,
      phone_number,
      date_of_birth,
      password,
    } = formData;
    if (!email || !password || !first_name || !last_name || !city || !phone_number || !date_of_birth) {
          Alert.alert('Erreur', 'Veuillez remplir tous les champs');
          return;
     }

    if (password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (!termsAccepted) {
      Alert.alert('Erreur', 'Veuillez accepter les conditions d\'utilisation');
      return;
    }
    setIsLoading(true);
    const response = await register(first_name, last_name,city,email,phone_number,date_of_birth,password);
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('Login');
    }, 1500);
  };

  // Mise à jour des champs
  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
}

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête */}
        <View style={styles.header}>
          <Image 
            source={require('../../../../assets/intro/ride.png')} 
            style={styles.logo}
          />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté de covoiturage</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {/* Prénom et Nom */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean"
                value={formData.first_name}
                onChangeText={text => handleChange('first_name', text)}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Dupont"
                value={formData.last_name}
                onChangeText={text => handleChange('last_name', text)}
              />
            </View>
          </View>

          {/* Ville */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              placeholder="Moncton"
              value={formData.city}
              onChangeText={text => handleChange('city', text)}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Courriel</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={text => handleChange('email', text)}
            />
          </View>

          {/* phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (506) 123-4567"
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={formData.phone_number}
              onChangeText={text => handleChange('phone_number', text)}
            />
          </View>
           {/* birth */}
           <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of birth</Text>
            <TextInput
              style={styles.input}
              placeholder="xxxx"
              keyboardType="default"
              autoCapitalize="none"
              value={formData.date_of_birth}
              onChangeText={text => handleChange('date_of_birth', text)}
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={text => handleChange('password', text)}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmation mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmez le mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={formData.confirmPassword}
              onChangeText={text => handleChange('confirmPassword', text)}
            />
          </View>

          {/* Conditions d'utilisation */}
          <TouchableOpacity 
            style={styles.termsRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checked]}>
              {termsAccepted && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text style={styles.termsText}>
              J'accepte les conditions d'utilisation
            </Text>
          </TouchableOpacity>

          {/* Bouton d'inscription */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonLoading]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          {/* Lien vers connexion */}
          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Déjà un compte? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginAction}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


export default RegisterScreen;