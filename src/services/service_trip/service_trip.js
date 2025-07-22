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

const get_trip_by_driver_id = async  (user_id)=>{
  try{

    const response = await fetch(`${BASE_URL}tp/get_trip_by_driver_id/${user_id}`,{
    
    method:"GET",
    headers:{
      "content-type":"application/json",
    },

    });

    if(!response.ok)
    {
      throw new Error('Erreur lors de la récupération des trips by driver id');
    }
    const data = response.json()
    return data  

  }catch(error){
      console.error('Erreur de trips :', error.message);
    throw error;
  }
}
//avec filter

const update_trip_status_by_ongoing = async (trip_id,new_status)=>{
  try{
    const response = await fetch(`${BASE_URL}tp/trip/${trip_id}/status`,{
      method:"PUT",
      headers:{
        "contenT-type":"application/json"
      },
       body: JSON.stringify({
        new_status:new_status,
       })
    })
    if(!response.ok){
     const errorData =await response.json()
    
     const errorMessage =errorData
      console.log(errorMessage)
      throw new Error(errorMessage.detail);
    }
    return response

  }catch(error){
     console.error('Erreur du changement de stauts  :', error);
    throw error;
  }
} 

export const searchTrips = async (departure, destination, date, includeNearby = false) => {
  try {
    // Normaliser les chaînes (enlever accents et mettre en minuscule)
    const normalizeString = (str) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const normalizedDeparture = normalizeString(departure);
    const normalizedDestination = normalizeString(destination);

    const params = new URLSearchParams();
    params.append('departure_city', normalizedDeparture);
    params.append('destination_city', normalizedDestination);
    params.append('departure_date', date);
    params.append('status', 'pending');

    const url = `${BASE_URL}tp/search_trips?${params.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);

    const data = await response.json();
    
    // Filtrage supplémentaire côté client
    if (includeNearby) {
      return data.filter(trip => {
        const tripDest = normalizeString(trip.destination_city);
        const stopsMatch = trip.stops?.some(stop => 
          normalizeString(stop.destination_city).includes(normalizedDestination)
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
  searchTrips,getTrips,get_trip_by_driver_id,update_trip_status_by_ongoing
}