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


export const create_car = async (user_id, brand, model, seats, color, license_plate, date_of_car, type_of_car) => {
  try {
    const response = await fetch(`${API_URL}identity/create_cars?user_id=${user_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        brand,
        model,
        seats,
        color,
        license_plate,
        date_of_car,
        type_of_car,
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la création du véhicule");
    }

    const data = await response.json(); // si l'API retourne un JSON
    return data;
  } catch (error) {
    console.error('Erreur API create_car:', error);
    throw error;
  }
};

export default{getCarById,create_car}