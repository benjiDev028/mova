// vehicule_service.js
const API_URL="http://192.168.2.13:8001/"


export const getCarById = async (carId) => {
  try {
    const response = await fetch(`${API_URL}identity/get_car_by_id/${carId}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données du véhicule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching car details:', error);
    throw error;
  }
};

export default{getCarById}