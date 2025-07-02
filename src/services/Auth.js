const url = 'http://192.168.2.13:8001/';

export const login = async (email, password) => {
  try {
    const response = await fetch(url + 'identity/login', {
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

export default { login };
