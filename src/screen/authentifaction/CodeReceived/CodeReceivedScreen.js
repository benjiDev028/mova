import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import {styles} from "./styles";
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import password_service from '../../../services/service_pwd/password_service';

const CodeReceivedScreen = ({ route, navigation }) => {
  const [code, setCode] = useState(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);

  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return '';
  
    const [localPart, domain] = email.split('@');
    const visiblePart = localPart.charAt(0);
    const maskedPart = '*'.repeat(localPart.length - 1);
  
    return `${visiblePart}${maskedPart}@${domain}`;
  };

  const email = route?.params?.email || 'exemple@email.com';
  const maskedEmail = maskEmail(email);

  // Timer pour le countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleChangeText = (text, index) => {
    // Accepter seulement les chiffres
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Focus automatique sur le champ suivant
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Vérification automatique quand tous les champs sont remplis
    if (newCode.every(num => num !== '')) {
      handleVerification(newCode.join(''));
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerification = async (finalCode = code.join('')) => {
    Keyboard.dismiss();
    setIsLoading(true);
  
    try {
      const isValid = await password_service.CheckCode(email, finalCode);
  
      if (isValid) {
        Alert.alert('Code vérifié', 'Votre code a été vérifié avec succès');
        navigation.navigate('PasswordReset', { email });
      } else {
        Alert.alert('Erreur', 'Le code de vérification est incorrect ou expiré.');
        // Clear the code inputs on error
        setCode(Array(6).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Erreur dans handleVerification :', error.message);
      Alert.alert('Erreur', 'Une erreur est survenue pendant la vérification.');
      // Clear the code inputs on error
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };


  const handleResendCode = async () => {
    setResendLoading(true);
    
    try {
      // Appel au service pour renvoyer le code
      await password_service.ResendCode(email);
      
      setIsResendDisabled(true);
      setCountdown(60);
      setCode(Array(6).fill('')); // Réinitialiser le code
      inputRefs.current[0]?.focus();
      
      Alert.alert('Code envoyé', 'Un nouveau code a été envoyé à votre adresse email');
    } catch (error) {
      console.error('Erreur lors du renvoi :', error);
      Alert.alert('Erreur', 'Impossible de renvoyer le code. Réessayez.');
    } finally {
      setResendLoading(false);
    }
  };

  const isCodeComplete = code.every(num => num !== '');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#003DA5" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="mail-open" size={60} color="#FFC72C" />
            <Text style={styles.title}>Vérification</Text>
            <Text style={styles.subtitle}>
              Entrez le code à 6 chiffres envoyé à {'\n'}
              <Text style={styles.emailText}>{maskedEmail}</Text>
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={`digit-${index}`}
                ref={ref => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  isLoading && styles.codeInputDisabled
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={text => handleChangeText(text, index)}
                onKeyPress={e => handleKeyPress(index, e.nativeEvent)}
                selectTextOnFocus
                editable={!isLoading}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.button, 
              (!isCodeComplete || isLoading) && styles.buttonDisabled
            ]}
            onPress={() => handleVerification()}
            disabled={!isCodeComplete || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Vérifier</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResendCode}
            disabled={isResendDisabled || resendLoading}
          >
            <Text style={styles.resendText}>
              Vous n'avez pas reçu de code ?{' '}
              {resendLoading ? (
                <ActivityIndicator size="small" color="#003DA5" />
              ) : (
                <Text style={[
                  styles.resendLink, 
                  isResendDisabled && styles.resendDisabled
                ]}>
                  {isResendDisabled ? `Renvoyer (${countdown}s)` : 'Renvoyer'}
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};


export default CodeReceivedScreen;