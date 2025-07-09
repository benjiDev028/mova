import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,

} from 'react-native';
import {styles} from "./styles";
import { useRoute } from '@react-navigation/native';
import password_service from '../../../services/service_pwd/password_service';

const { width } = Dimensions.get('window');

const PasswordResetScreen = ({ route,navigation }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const email = route?.params?.email || '';


  const handleSubmit = async () => {
    Keyboard.dismiss();

    // Validation des mots de passe
    if (newPassword !== confirmPassword) {
        return Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
    }

    if (newPassword.length < 6) {
        return Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
    }

    setIsLoading(true);

    try {
        const result = await password_service.NewPassword(email, newPassword);
        
        if (result.ok) {
            Alert.alert(
                'Succès', 
                'Votre mot de passe a été modifié avec succès.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }]
                            });
                        }
                    }
                ]
            );
        } else {
            Alert.alert(
                'Erreur', 
                result.error || 'Impossible de modifier le mot de passe. Veuillez réessayer.'
            );
        }
    } catch (error) {
        console.error('Erreur dans handleSubmit :', error);
        Alert.alert(
            'Erreur', 
            'Une erreur est survenue lors de la modification du mot de passe.'
        );
    } finally {
        setIsLoading(false);
    }
};

  const isFormValid = () =>
    oldPassword.length > 0 && newPassword.length >= 6 && confirmPassword.length >= 6;

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 0, text: '', color: '#E0E0E0' };
    if (password.length < 8) return { strength: 1, text: 'Faible', color: '#FF6B6B' };
    if (password.length < 12) return { strength: 2, text: 'Moyen', color: '#FFB84D' };
    return { strength: 3, text: 'Fort', color: '#51CF66' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Modifier le mot de passe</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>🔒</Text>
                </View>
              </View>

              <Text style={styles.title}>Sécurisez votre compte</Text>
              <Text style={styles.subtitle}>
                Choisissez un mot de passe fort pour protéger vos informations
              </Text>

              <View style={styles.formContainer}>
                {/* Ancien mot de passe */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Ancien mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      placeholder="Entrez votre ancien mot de passe"
                      secureTextEntry={!showOldPassword}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowOldPassword(!showOldPassword)}
                    >
                      <Text style={styles.eyeText}>{showOldPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Nouveau mot de passe */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      placeholder="Choisissez un nouveau mot de passe"
                      secureTextEntry={!showNewPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Text style={styles.eyeText}>{showNewPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Indicateur de force du mot de passe */}
                  {newPassword.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBar}>
                        {[1, 2, 3].map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.strengthSegment,
                              {
                                backgroundColor:
                                  level <= passwordStrength.strength
                                    ? passwordStrength.color
                                    : '#E5E7EB',
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.text}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirmer mot de passe */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      placeholder="Confirmez votre nouveau mot de passe"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={[
                        styles.input,
                        confirmPassword.length > 0 && newPassword !== confirmPassword && styles.inputError,
                      ]}
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
                  )}
                </View>
              </View>

              {/* Conseils sécurité */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Conseils pour un mot de passe sécurisé :</Text>
                <Text style={styles.tipText}>• Au moins 8 caractères</Text>
                <Text style={styles.tipText}>• Mélangez lettres, chiffres et symboles</Text>
                <Text style={styles.tipText}>• Évitez les informations personnelles</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid() || isLoading) && styles.buttonDisabled,
              ]}
              disabled={!isFormValid() || isLoading}
              onPress={handleSubmit}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.loadingText}>Modification en cours...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Modifier le mot de passe</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};


export default PasswordResetScreen;