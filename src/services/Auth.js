import { API_URL } from '@env'
// AdminService.js
//const url = API_URL
const url =  "http://192.168.2.13:8001";


export const login = async (email, password) => {
  try {
    const response = await fetch(url + '/identity/login', {
      method: 'POST',
      headers: {  
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log('Réponse de login:', data);

    if (response.ok && data.access_token) {
      return data; // Succès
    } else {
      throw new Error(data.detail || 'Identifiants incorrects');
    }

  } catch (error) {
    console.error('Erreur de login :', error.message);
    throw error;
  }
};

function decodeJWT(token) {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token invalide ou manquant');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Format JWT invalide');
    }

    // Décoder la partie payload (index 1)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // ✅ Correction: utiliser atob directement sur base64
    const jsonPayload = atob(base64);
    
    const decoded = JSON.parse(jsonPayload);
    console.log('🔐 JWT décodé:', decoded);
    
    // ✅ Normaliser le format user_id si nécessaire
    if (decoded['user/id'] && !decoded.user_id) {
      decoded.user_id = decoded['user/id'];
    }
    
    return decoded;
  } catch (error) {
    console.error('❌ Erreur de décodage JWT:', error);
    throw new Error(`Impossible de décoder le JWT: ${error.message}`);
  }
}

export default { login ,decodeJWT};
