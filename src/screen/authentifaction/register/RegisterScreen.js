import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { styles } from './styles';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../../../services/Register';
import GooglePlacesInput from '../../../composants/googleplaceSeach/GoogleplaceSearch';
import { normalize } from '../../../composants/normalise/normalize';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepte formats courants (+1, (506) 123-4567, 506-123-4567, etc.)
const PHONE_REGEX =
  /^\+?\d{0,3}?[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3}[\s.-]?\d{3,4}$/;
// YYYY-MM-DD uniquement
const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const RegisterScreen = ({ navigation }) => {
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

  // -- Helpers de validation simples et lisibles --
  const isEmailValid = useMemo(() => EMAIL_REGEX.test(formData.email.trim()), [formData.email]);
  const isPasswordValid = useMemo(() => formData.password.trim().length >= 8, [formData.password]);
  const isConfirmValid = useMemo(
    () => formData.password.trim() === formData.confirmPassword.trim() && formData.confirmPassword.trim().length > 0,
    [formData.password, formData.confirmPassword]
  );
  const isPhoneValid = useMemo(() => PHONE_REGEX.test(formData.phone_number.trim()), [formData.phone_number]);
  const isDobValid = useMemo(() => DOB_REGEX.test(formData.date_of_birth.trim()), [formData.date_of_birth]);

  const allFilled = useMemo(() => {
    const { first_name, last_name, city, email, password, confirmPassword, phone_number, date_of_birth } = formData;
    return (
      first_name.trim() &&
      last_name.trim() &&
      city.trim() &&
      email.trim() &&
      password.trim() &&
      confirmPassword.trim() &&
      phone_number.trim() &&
      date_of_birth.trim()
    );
  }, [formData]);

  const isFormValid = useMemo(
    () => allFilled && isEmailValid && isPasswordValid && isConfirmValid && isPhoneValid && isDobValid && termsAccepted,
    [allFilled, isEmailValid, isPasswordValid, isConfirmValid, isPhoneValid, isDobValid, termsAccepted]
  );

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleRegister = useCallback(async () => {
    if (isLoading) return;

    if (!isFormValid) {
      // Message court et clair : indique les points les plus courants
      let msg = 'Veuillez corriger les champs invalides :\n';
      if (!formData.first_name.trim()) msg += '• Prénom\n';
      if (!formData.last_name.trim()) msg += '• Nom\n';
      if (!formData.city.trim()) msg += '• Ville\n';
      if (!isEmailValid) msg += '• Courriel invalide\n';
      if (!isPhoneValid) msg += '• Numéro de téléphone invalide\n';
      if (!isDobValid) msg += '• Date de naissance (format YYYY-MM-DD)\n';
      if (!isPasswordValid) msg += '• Mot de passe (min 8 caractères)\n';
      if (!isConfirmValid) msg += '• Confirmation du mot de passe\n';
      if (!termsAccepted) msg += '• Accepter les conditions d’utilisation';
      Alert.alert('Formulaire incomplet', msg.trim());
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        city: formData.city.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim(),
        date_of_birth: formData.date_of_birth.trim(), // attendu: YYYY-MM-DD
        password: formData.password.trim(),
      };

      const res = await register(
        payload.first_name,
        payload.last_name,
        payload.city,
        payload.email,
        payload.phone_number,
        payload.date_of_birth,
        payload.password
      );

      // Selon ton service, 'res' peut contenir { success, error, message, data... }
      if (res?.success === false) {
        const apiMsg =
          res?.error ||
          res?.message ||
          'Une erreur est survenue lors de la création du compte. Réessayez.';
        Alert.alert('Inscription échouée', apiMsg);
        return;
      }

      Alert.alert('Bienvenue !', 'Votre compte a été créé avec succès.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login', { emailPrefill: payload.email }),
        },
      ]);
    } catch (err) {
      console.error('Register error:', err);
      Alert.alert(
        'Erreur serveur',err?.message
        
      );
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, isLoading, formData, navigation, isEmailValid, isPhoneValid, isDobValid, isPasswordValid, isConfirmValid, termsAccepted]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* En-tête */}
        <View style={styles.header}>
          <Image source={require('../../../../assets/intro/ride.png')} style={styles.logo} />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté de covoiturage</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {/* Prénom & Nom */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean"
                value={formData.first_name}
                onChangeText={text => handleChange('first_name', text)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Dupont"
                value={formData.last_name}
                onChangeText={text => handleChange('last_name', text)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Ville */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ville</Text>
            <GooglePlacesInput
              style={styles.input}
              placeholder="Ville de résidence"
              onSelect={place => handleChange('city', normalize(place.city))}
              initialValue={formData.city}
              types={['(cities)']}
              country="ca"
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
              returnKeyType="next"
            />
          </View>

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (506) 123-4567"
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={formData.phone_number}
              onChangeText={text => handleChange('phone_number', text)}
              returnKeyType="next"
            />
          </View>

          {/* Date de naissance */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de naissance (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="1999-12-12"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              value={formData.date_of_birth}
              onChangeText={text => handleChange('date_of_birth', text)}
              returnKeyType="next"
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
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(prev => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Afficher ou masquer le mot de passe"
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {/* Petit hint optionnel sans toucher au style : contenu seulement */}
            <Text style={styles.label}>
              8 caractères minimum.
            </Text>
          </View>

          {/* Confirmation */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmez le mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={formData.confirmPassword}
              onChangeText={text => handleChange('confirmPassword', text)}
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          {/* Conditions d'utilisation */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setTermsAccepted(prev => !prev)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checked]}>
              {termsAccepted && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text style={styles.termsText}>J'accepte les conditions d'utilisation</Text>
          </TouchableOpacity>

          {/* Bouton d'inscription */}
          <TouchableOpacity
            style={[styles.button, (isLoading || !isFormValid) && styles.buttonLoading]}
            onPress={handleRegister}
            disabled={isLoading || !isFormValid}
            activeOpacity={0.8}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
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
