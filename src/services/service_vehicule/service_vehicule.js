// services/service_vehicule/service_vehicule.js
import { API_URL } from '@env';

// Fallback local si la var ENV n'est pas dispo
const FALLBACK_BASE = "http://192.168.2.13:8001";
const BASE_URL = "http://192.168.2.13:8001";

/** UUID v4 */
export const isUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(val);

/** Normalisation d'un objet véhicule */
export const normalizeCar = (raw = {}, fallbackId = '') => ({
  id: raw.id || fallbackId || '',
  brand: raw.brand || raw.marque || '',
  model: raw.model || raw.modele || '',
  seats: Number(raw.seats || raw.places || 0) || undefined,
  color: raw.color || raw.couleur || '',
  license_plate: raw.license_plate || raw.plaque || '',
  date_of_car: raw.date_of_car || raw.year || raw.annee || '',
  type_of_car: raw.type_of_car || raw.type || '',
});

/** Strict: peut throw */
export const getCarById = async (carId) => {
  const id = String(carId || '').trim();
  const res = await fetch(`${BASE_URL}/identity/get_car_by_id/${id}`);
  if (!res.ok) {
    throw new Error('Erreur lors de la récupération des données du véhicule');
  }
  return await res.json();
};

/**
 * Sûr: ne throw JAMAIS
 * - Si l'id n'est pas un UUID, on renvoie fallback normalisé
 * - Si la requête échoue, on renvoie fallback normalisé
 */
export const safeGetCarById = async (carId, fallback = {}) => {
  const id = String(carId || '').trim();

  // Pas d'appel réseau si l'id n’est pas un UUID v4
  if (!isUuid(id)) {
    return normalizeCar(fallback, id);
  }

  try {
    const raw = await getCarById(id); // strict
    return normalizeCar(raw, id);
  } catch (e) {
    // On ne throw pas : on renvoie un objet normalisé minimal
    return normalizeCar(fallback, id);
  }
};

export const create_car = async (user_id, brand, model, seats, color, license_plate, date_of_car, type_of_car) => {
  try {
    const response = await fetch(`${BASE_URL}/identity/create_cars?user_id=${user_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, brand, model, seats, color, license_plate, date_of_car, type_of_car }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la création du véhicule");
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API create_car:', error);
    throw error;
  }
};



// Export par défaut pour compat avec les imports existants
export default {
  getCarById,
  safeGetCarById,
  create_car,
  isUuid,
  normalizeCar,
};
