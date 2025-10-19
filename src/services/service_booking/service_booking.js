const base_url = "http://192.168.2.13:8004"

const create_booking = async (bookingData) => {
  try {
    const response = await fetch(`${base_url}/bk/create_booking`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la création du booking');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur création booking :', error.message);
    throw error;
  }
}

const get_bookings_by_user_id = async (user_id) => {
  try {
    const response = await fetch(`${base_url}/bk/get_booking_by_user_id/${user_id}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du booking');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur de booking :', error.message);
    throw error;
  }
}

const get_passengers_by_trip = async (trip_id) => {
  try {
    const response = await fetch(`${base_url}/bk/get_passengers_by_trip/${trip_id}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du passanger du trip');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur de booking :', error.message);
    throw error;
  }
}

const cancel_booking = async (booking_id) => {
  try {
    const response = await fetch(`${base_url}/bk/cancel_booking/${booking_id}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de l\'annulation du booking');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur annulation booking :', error.message);
    throw error;
  }
}

export default { 
  create_booking, 
  get_bookings_by_user_id, 
  get_passengers_by_trip,
  cancel_booking 
}