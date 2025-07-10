export default function extractCity(place) {
  if (!place) return null;

  // Si l'objet est déjà formaté
  if (place.description) {
    return {
      description: place.description,
      city: place.structured_formatting?.main_text || place.description.split(',')[0].trim(),
      latitude: place.latitude ?? place.geometry?.location?.lat ?? null,
      longitude: place.longitude ?? place.geometry?.location?.lng ?? null
    };
  }

  // Extraction depuis les composants Google Places
  const cityName = place?.structured_formatting?.main_text || 
                 place.name || 
                 (typeof place.description === "string" ? place.description.split(",")[0].trim() : null);

  const description = place.description || 
                    (place.structured_formatting ? 
                      `${place.structured_formatting.main_text}, ${place.structured_formatting.secondary_text}` : 
                      cityName);

  // Extraction des coordonnées
  const latitude = place.geometry?.location?.lat ?? place.latitude ?? null;
  const longitude = place.geometry?.location?.lng ?? place.longitude ?? null;

  return cityName ? { 
    
    city: cityName,
   
  } : null;
}