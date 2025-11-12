// services/service_driver_earning/service_driver_earning.js


//const BASE_URL = `${API_BASE_URL}/api/earnings`;
const BASE_URL= "http://192.168.2.13:8005"

/**
 * Service pour gérer les earnings (gains) des chauffeurs
 */
const service_driver_earning = {
  
  /**
   * 📊 Récupère le résumé des earnings pour l'écran d'encaissement
   * @param {string} driverId - UUID du chauffeur
   * @returns {Promise} Résumé avec montants et listes d'earnings
   */
  getDriverEarningsSummary: async (driverId) => {
    try {
      const response = await fetch(`${BASE_URL}/driver/${driverId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur getDriverEarningsSummary:', error.message);
      throw error;
    }
  },

  /**
   * 💰 Demande l'encaissement (crée un payout request)
   * @param {string} driverId - UUID du chauffeur
   * @param {Array<string>} earningIds - Liste des IDs d'earnings à encaisser
   * @returns {Promise} Payout request créé
   */
  requestPayout: async (driverId, earningIds) => {
    try {
      const payload = {
        driver_id: driverId,
        earning_ids: earningIds
      };
      
      const response = await fetch(`${BASE_URL}/payout-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur requestPayout:', error.message);
      throw error;
    }
  },

  /**
   * 📋 Liste toutes les demandes de payout du chauffeur
   * @param {string} driverId - UUID du chauffeur
   * @returns {Promise} Liste des payout requests
   */
  getDriverPayouts: async (driverId) => {
    try {
      const response = await fetch(`${BASE_URL}/driver/${driverId}/payouts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur getDriverPayouts:', error.message);
      throw error;
    }
  },

  /**
   * 📄 Détails d'un payout request spécifique
   * @param {string} payoutId - UUID du payout
   * @returns {Promise} Détails du payout
   */
  getPayoutDetails: async (payoutId) => {
    try {
      const response = await fetch(`${BASE_URL}/payout/${payoutId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur getPayoutDetails:', error.message);
      throw error;
    }
  },

  /**
   * 🔄 Rafraîchir les données (équivalent pull-to-refresh)
   * @param {string} driverId
   * @returns {Promise} Données rafraîchies
   */
  refresh: async (driverId) => {
    try {
      return await service_driver_earning.getDriverEarningsSummary(driverId);
    } catch (error) {
      console.error('❌ Erreur refresh:', error);
      throw error;
    }
  }
};

export default service_driver_earning;