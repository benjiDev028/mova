import { createContext, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from "../services/Auth";
import UserService from "../services/services_user/user_services";
import { Buffer } from "buffer";

export const AuthContext = createContext();

// --- Utils ---
const decodeJWT = (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Token invalide ou inexistant");
  }

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) throw new Error("Format de token invalide");

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const jsonPayload = Buffer.from(padded, 'base64').toString('utf-8');

    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Erreur lors du décodage du token :", err.message);
    return null;
  }
};

// --- Provider ---
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: '',
    userRole: '',
    user_id: '',
    user: null,
    isLoading: true
  });

  // 🔐 Clear session = logout
  const clearSession = async () => {
    await AsyncStorage.multiRemove(['authToken', 'userRole', 'id']);
    setAuthState({ token: null, userRole: null, user_id: null, isLoading: false });
  };

  // 🔑 Login
  const login = async (email, password) => {
    try {
      const response = await AuthService.login(email, password);
      console.log('Login response:', response);

      const { access_token: token } = response;
      if (!token) throw new Error('Token manquant dans la réponse');

      const decoded = decodeJWT(token);
      const role = decoded?.userRole;
      const id = decoded?.user_id;

        const UserInfo = await UserService.getUserById(id);

      if (!role || !id) throw new Error('Rôle ou ID manquant dans le token');

      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userRole', role],
        ['id', id]
      ]);

      setAuthState({
        token,
        userRole: role,
        user_id: id,
        user : UserInfo,
        isLoading: false
      });

      return { token, role };
    } catch (error) {
      console.error('Erreur pendant le login :', error.message);
      await clearSession();
      throw error;
    }
  };

  // 🚀 Load token on startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const role = await AsyncStorage.getItem('userRole');
        const user_id = await AsyncStorage.getItem('id');
  
        if (token && role && user_id) {
          // 🧠 On récupère les infos complètes de l'utilisateur
          const userInfo = await UserService.getUserById(user_id);
  
          setAuthState({
            token,
            userRole: role,
            user_id,
            user: userInfo, 
            isLoading: false,
          });
        } else {
          await clearSession();
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la session :', error.message);
        await clearSession();
      }
    };
  
    loadSession();
  }, []);
  
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout: clearSession,
        isAuthenticated: !!authState.token
      }}
    >
      {!authState.isLoading && children}
    </AuthContext.Provider>
  );
};
