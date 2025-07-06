// service_trip.js
const BASE_URL = "http://192.168.2.13:8002/";

 const getTrips = async () => {
  try {
    const response = await fetch(`${BASE_URL}tp/get_all_trips`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des trips');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur de trips :', error.message);
    throw error;
  }
}
//avec filter

export const searchTrips = async (departure, destination, date, includeNearby = false) => {
  try {
    // Fonction pour nettoyer et normaliser les chaînes
    const cleanAndNormalize = (str) => {
      return str
        .trim() // Enlever les espaces en début/fin
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Enlever les caractères invisibles
        .replace(/\uFFFC/g, '') // Enlever le caractère de remplacement d'objet
        .normalize("NFD") // Normaliser les accents
        .replace(/[\u0300-\u036f]/g, "") // Enlever les diacritiques
        .toLowerCase(); // Mettre en minuscule
    };

    const normalizedDeparture = cleanAndNormalize(departure);
    const normalizedDestination = cleanAndNormalize(destination);

    // Vérifier que les chaînes ne sont pas vides après nettoyage
    if (!normalizedDeparture || !normalizedDestination) {
      throw new Error('Les villes de départ et destination ne peuvent pas être vides');
    }

    const params = new URLSearchParams();
    params.append('departure_city', normalizedDeparture);
    params.append('destination_city', normalizedDestination);
    params.append('departure_date', date);
    params.append('status', 'pending');

    const url = `${BASE_URL}tp/search_trips?${params.toString()}`;
    
    // Log pour déboggage
    console.log('URL de recherche:', url);
    console.log('Paramètres:', {
      departure: normalizedDeparture,
      destination: normalizedDestination,
      date,
      
    });

    const response = await fetch(url);

    if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);
    const data = await response.json();

    // Filtrage supplémentaire côté client
    if (includeNearby) {
      return data.filter(trip => {
        const tripDest = cleanAndNormalize(trip.destination_city);
        const stopsMatch = trip.stops?.some(stop =>
          cleanAndNormalize(stop.destination_city).includes(normalizedDestination)
        );
        return tripDest.includes(normalizedDestination) || stopsMatch;
      });
    }

    return data;
  } catch (error) {
    console.error('Erreur de recherche:', error);
    throw error;
  }
};
export default{
  searchTrips,getTrips
}