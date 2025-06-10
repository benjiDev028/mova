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
import { Ionicons } from '@expo/vector-icons';

const EmailVerifiedScreen = ({ route, navigation }) => {
  const [code, setCode] = useState(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const inputRefs = useRef([]);

  const email = route?.params?.email || 'exemple@email.com';

  useEffect(() => {
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
  }, []);

  const handleChangeText = (text, index) => {
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(num => num !== '')) {
      handleVerification(newCode.join(''));
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerification = (finalCode = code.join('')) => {
    Keyboard.dismiss();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (finalCode === '123456') {
        navigation.navigate('PasswordReset');
      } else {
        Alert.alert('Erreur', 'Le code de vérification est incorrect');
      }
    }, 1500);
  };

  const handleResendCode = () => {
    setIsResendDisabled(true);
    setCountdown(60);

    Alert.alert('Code envoyé', 'Un nouveau code a été envoyé à votre adresse email');
  };

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
              Entrez le code envoyé à {'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {Array.isArray(code) && code.map((digit, index) => (
              <TextInput
                key={`digit-${index}`}
                ref={ref => (inputRefs.current[index] = ref)}
                style={styles.codeInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={text => handleChangeText(text, index)}
                onKeyPress={e => handleKeyPress(index, e.nativeEvent)}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, (isLoading || code.some(num => num === '')) && styles.buttonDisabled]}
            onPress={() => handleVerification()}
            disabled={isLoading || code.some(num => num === '')}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Vérifier</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResendCode}
            disabled={isResendDisabled}
          >
            <Text style={styles.resendText}>
              Vous n'avez pas reçu de code ?{' '}
              <Text style={[styles.resendLink, isResendDisabled && styles.resendDisabled]}>
                {isResendDisabled ? `Renvoyer (${countdown}s)` : 'Renvoyer'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 25, justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
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
  },
  emailText: {
    fontWeight: '600',
    color: '#003DA5',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  codeInput: {
    width: 45,
    height: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003DA5',
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
  resendContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  resendText: {
    color: '#666',
    textAlign: 'center',
  },
  resendLink: {
    color: '#003DA5',
    fontWeight: '500',
  },
  resendDisabled: {
    color: '#999',
  },
});

export default EmailVerifiedScreen;
