import React, { useState, useRef, useEffect,useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import styles from './styles'; // Assurez-vous d'avoir le bon chemin vers votre fichier de styles
 // Assurez-vous d'avoir un service d'authentification
import { AuthContext } from '../../../context/AuthContext';



const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {login} = useContext(AuthContext);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // const handleLogin = async () => {
  //   if (!email || !password) {
  //     Alert.alert('Erreur', 'Veuillez remplir tous les champs');
  //     return;
  //   }
  
  //   setIsLoading(true);
  
  //   try {
  //     const response = await login(email, password);
  
  //     // Stockage du token (si tu veux)
  //     // await AsyncStorage.setItem('access_token', response.access_token);
  //     // await AsyncStorage.setItem('user_id', response.user_id);
  
  //     console.log("Login réussi:", response);
  
  //     // navigation.reset({
  //     //   index: 0,
  //     //   routes: [{ name: 'ClientStack' }],
  //     // });
  
  //   } catch (error) {
  //     Alert.alert('Erreur', error.message || 'Erreur de connexion');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  
  const handleLogin = async () => {
  if (!email || !password) return Alert.alert('Erreur', 'Veuillez remplir tous les champs');
  setIsLoading(true);
  try {
    await login(email, password);   // <- met isAuthenticated=true dans le AuthContext
    // 🚫 pas de navigation.reset ici
  } catch (e) {
    Alert.alert('Erreur', e.message || 'Erreur de connexion');
  } finally {
    setIsLoading(false);
  }
};
  const handleForgotPassword = () => {
    navigation.navigate('EmailVerified');
    
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec logo */}
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoAnim }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🍁</Text>
              <Text style={styles.logoText}>N.-B.</Text>
              <Text style={styles.logoSubtext}>Covoiturage</Text>
            </View>
            <Text style={styles.welcomeText}>Bienvenue</Text>
            <Text style={styles.subtitleText}>Connectez-vous à votre compte</Text>
          </Animated.View>

          {/* Formulaire de connexion */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Champ Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.labelText}>Adresse email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="votre@email.com"
                  placeholderTextColor="#999999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Champ Mot de passe */}
            <View style={styles.inputContainer}>
              <Text style={styles.labelText}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Votre mot de passe"
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mot de passe oublié */}
            <TouchableOpacity 
              onPress={handleForgotPassword}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton de connexion */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Text>
              {!isLoading && <Text style={styles.loginButtonIcon}>→</Text>}
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>ou</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Inscription */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Pas encore de compte ?</Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signupLink}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footerContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.footerText}>
              Service de covoiturage pour tout le Nouveau-Brunswick
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};



export default LoginScreen;