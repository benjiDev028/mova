const url ="http://192.168.2.13:8001/";


export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${url}identity/get_user_by_id/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des informations de l utilisateur');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Erreur de récupération des statistiques utilisateur :', error.message);
    throw error;
  }
}

export default { getUserById };