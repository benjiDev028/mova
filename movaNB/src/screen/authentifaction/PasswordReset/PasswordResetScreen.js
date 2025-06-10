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

const { width } = Dimensions.get('window');

const PasswordResetScreen = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = () => {
    Keyboard.dismiss();

    if (newPassword !== confirmPassword) {
      return Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
    }

    if (newPassword.length < 6) {
      return Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
    }

    setIsLoading(true);

    // Simulation d'une API de reset
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès.');
      navigation.reset({
        index:0,
        routes:[{name:'Login'}]
      })
    }, 1500);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },

  // Scroll container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Content
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: {
    fontSize: 32,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },

  // Form
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeButton: {
    padding: 16,
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },

  // Strength indicator
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    flex: 1,
    height: 4,
    marginRight: 12,
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Tips
  tipsContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#0369A1',
    marginBottom: 2,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  button: {
    backgroundColor: '#FFC72C',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFC72C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PasswordResetScreen;