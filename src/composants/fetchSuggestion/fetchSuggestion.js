const fetchSuggestionsForCity = async (cityName) => {
  const apiKey = 'AIzaSyBwx5yyNbJYbt_TLBEozRXPl3oZD4wH-DE';
  const query = `lieux publics à ${cityName}`;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=establishment&key=${apiKey}&language=fr`
    );
    const data = await response.json();
    const results = data.results.slice(0, 3).map(item => ({
      name: item.name,
      address: item.formatted_address,
      latitude: item.geometry.location.lat,
      longitude: item.geometry.location.lng,
    }));
    setPublicSuggestions(results);
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions :', error);
  }
};
