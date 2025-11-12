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

const update_booking_status = async (booking_id, new_status) => {
  const res = await fetch(`${BASE_URL}booking/${booking_id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: new_status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

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
    const now = new Date().toISOString(); // 👈 ajoute une date au format ISO
    const response = await fetch(`${base_url}/bk/${booking_id}/cancel`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cancelled_at: now, // 👈 correspond à BookingCancelRequest.cancelled_at
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Réponse serveur:", err);
      throw new Error("Erreur lors de l'annulation du booking");
    }

    const data = await response.json();
    console.log("✅ Réservation annulée:", data);
    return data;
  } catch (error) {
    console.error("Erreur annulation booking :", error.message);
    throw error;
  }
};

const create_booking_pending = async (bookingData) => {
  try {
    console.log('🟡 Création réservation PENDING...', bookingData);
    
    const response = await fetch(`${base_url}/bk/create-pending`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.detail || "Erreur création réservation pending";
      console.error('❌ Erreur création PENDING:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Réservation PENDING créée:', result.id);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur création réservation PENDING:', error);
    throw error;
  }
};

const confirm_booking_after_payment = async (bookingId) => {
  try {
    console.log('🟡 Confirmation réservation après paiement...', bookingId);
    
    const response = await fetch(`${base_url}/bk/${bookingId}/confirm-after-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.detail || "Erreur confirmation réservation";
      console.error('❌ Erreur confirmation:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Réservation CONFIRMÉE:', result.id);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur confirmation réservation:', error);
    throw error;
  }
};


export default { 
  create_booking, 
  get_bookings_by_user_id, 
  get_passengers_by_trip,
  cancel_booking ,
  update_booking_status,
  create_booking_pending,
  confirm_booking_after_payment
}