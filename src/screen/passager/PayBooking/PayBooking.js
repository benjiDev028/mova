import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useStripe } from "@stripe/stripe-react-native";
import { useAuth } from '../../../hooks/useAuth'; // Import du hook d'authentification
import service_booking from '../../../services/service_booking/service_booking'; // Import du service
import service_trip from '../../../services/service_trip/service_trip';
import service_payment from '../../../services/service_payment/service_payment';

// Logos cartes (garde ces assets)
const CARD_TYPES = {
  visa: require('../../../../assets/visa.png'),
  mastercard: require('../../../../assets/mastercard.png'),
  amex: require('../../../../assets/amex.png'),
  discover: require('../../../../assets/discover.png'),
};

const TAX_RATE_NB = 0.15;       // Taxes NB 15%
const BOOKING_FEE_PER_SEAT = 3.50; // Frais plateforme fixes par place

export default function PayBookingScreen({ route, navigation }) {
  const { trip,booking } = route.params || {};
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  console.log("trip ",trip)
  const { user } = useAuth(); // Récupère l'utilisateur connecté
  
  // paramètres venant de l'écran précédent
  const seats = Number(trip?.seats ?? 1);
  const selectedStop = trip?.selectedStop ?? null;

  /* ============================== État formulaire CB ============================== */
  const [cardNumber, setCardNumber] = useState('');
  const [formattedCardNumber, setFormattedCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [cardType, setCardType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  

  /* ============================== Helpers UI ============================== */
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 16);
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(limited);
    setFormattedCardNumber(formatted);
    detectCardType(limited);
  };

  const detectCardType = (number) => {
    if (/^4/.test(number)) setCardType('visa');
    else if (/^5[1-5]/.test(number)) setCardType('mastercard');
    else if (/^3[47]/.test(number)) setCardType('amex');
    else if (/^6(?:011|5)/.test(number)) setCardType('discover');
    else setCardType(null);
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    const formatted = cleaned.replace(/(\d{2})(?=\d)/, '$1/');
    setExpiry(formatted);
  };

  const formatCvv = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const maxLength = cardType === 'amex' ? 4 : 3;
    setCvv(cleaned.slice(0, maxLength));
  };

  const formatPostalCode = (text) => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    const formatted =
      cleaned.length === 6 ? cleaned.replace(/^([A-Z]\d[A-Z])(\d[A-Z]\d)$/, '$1 $2') : cleaned;
    setPostalCode(formatted);
  };

  /* ============================== Logique de paiement ============================== */
  // Détermination robuste du mode de paiement chauffeur
  const paymentMode = useMemo(() => {
    if (trip?.paymentMode === 'cash') return 'cash';
    if (trip?.paymentMode === 'virement') return 'transfer';
    if (Array.isArray(trip?.preferences)) {
      if (trip.preferences.includes('paiementCash')) return 'cash';
      if (trip.preferences.includes('virement')) return 'transfer';
    }
    return 'transfer'; // défaut : la plateforme encaisse les places + frais
  }, [trip]);

  // Calculs centralisés
  const pricePerSeat = Number(selectedStop?.price ?? trip?.price ?? 0);
  const base = seats * pricePerSeat;               // prix total des places
  const fee = seats * BOOKING_FEE_PER_SEAT;        // frais plateforme (toujours)
  const chargedNowPretax = paymentMode === 'cash' ? fee : base + fee;
  const tax = chargedNowPretax * TAX_RATE_NB;
  const chargedNow = chargedNowPretax + tax;
  const dueToDriverOnSite = paymentMode === 'cash' ? base : 0;

  // Bannière explicative
  const paymentBanner = useMemo(() => {
    if (paymentMode === 'cash') {
      return {
        icon: 'payments',
        text: `Paiement en espèces : ${pricePerSeat.toFixed(2)}$ / passager à remettre au chauffeur`,
        tint: '#059669',
      };
    }
    return {
      icon: 'account-balance',
      text:
        'Le montant des places est encaissé maintenant. Un virement sera effectué au chauffeur après validation du trajet.',
      tint: '#059669',
    };
  }, [paymentMode, pricePerSeat]);

  const isFormValid =
    cardNumber.length >= 15 && expiry.length === 5 && cvv.length >= 3 && postalCode.length >= 6;

  /* ============================== Paiement (API réelle) ============================== */

const handlePayment = async () => {
  try {
    setIsProcessing(true);

    // 1️⃣ Vérification utilisateur
    if (!user?.id) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    // 2️⃣ Vérifier qu'on a bien un booking pending
    const booking_id = booking?.id;
    
    if (!booking_id) {
      Alert.alert("Erreur", "Réservation introuvable. Veuillez recommencer.");
      navigation.goBack();
      return;
    }

    console.log("💳 Paiement pour booking:", booking_id);
    
    // 3️⃣ Calcul du driver_payable selon la méthode de paiement
    const driver_payable = paymentMode === 'cash' ? 0 : base; // Si cash, driver reçoit en main propre
    
    // 4️⃣ Construire la route
    const departure_city = trip?.departure || "Ville départ";
    const destination_city = selectedStop?.location || trip?.arrival || "Ville arrivée";
    
    // 5️⃣ Date/heure du trip (format ISO)
    let trip_departure_date = null;
    if (trip?.date && trip?.time) {
      // Combiner date et heure : "2025-11-15" + "16:13" -> "2025-11-15T16:13:00"
      trip_departure_date = `${trip.date}T${trip.time}:00`;
    } else if (trip?.date) {
      trip_departure_date = `${trip.date}T00:00:00`;
    }

    // 6️⃣ Nom du passager
    const passenger_name = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user.first_name || user.last_name || `User ${user.id}`;




    // 3️⃣ Préparation des données pour Stripe
    const totalAmount = chargedNow.toFixed(2);

    const paymentPayload = {
      user_id: user.id,
      driver_id: trip.driver_id,
      trip_id: trip.id,
      booking_id: booking_id,
      
      // Montants
      amount: parseFloat(chargedNow.toFixed(2)), // Total à capturer par Stripe
      currency: "CAD",
      fee: parseFloat((seats * BOOKING_FEE_PER_SEAT).toFixed(2)),
      tax_rate: TAX_RATE_NB,
      tax_region: "HST-NB",
      payment_method: "card",
      
      // 🆕 DÉNORMALISATION : Infos du booking
      chauffeur_payment_method: paymentMode === 'cash' ? 'cash' : 'virement',
      driver_payable: parseFloat(driver_payable.toFixed(2)),
      
      // 🆕 DÉNORMALISATION : Infos du trip
      trip_departure_city: departure_city,
      trip_destination_city: destination_city,
      trip_departure_date: trip_departure_date,
      
      // 🆕 DÉNORMALISATION : Info passager
      passenger_name: passenger_name,
    };

    // 4️⃣ Appel backend -> création du PaymentIntent Stripe
    console.log("📡 Création PaymentIntent Stripe...");
    const response = await service_payment.createPaymentIntent(paymentPayload);

    if (!response?.client_secret) {
      throw new Error("Impossible d'obtenir le client_secret Stripe");
    }

    console.log("✅ PaymentIntent créé");

    // 5️⃣ Initialisation de la PaymentSheet Stripe
    const initResponse = await initPaymentSheet({
      paymentIntentClientSecret: response.client_secret,
      merchantDisplayName: "MoVa by Core Technologies",
      defaultBillingDetails: {
        name: user.first_name || user.last_name,
        email: user.email,
      },
      style: "automatic",
    });

    if (initResponse.error) {
      throw new Error(`Erreur initPaymentSheet: ${initResponse.error.message}`);
    }

    console.log("✅ PaymentSheet initialisée");

    // 6️⃣ Présentation de la PaymentSheet
    const paymentResult = await presentPaymentSheet();

    if (paymentResult.error) {
      // L'utilisateur a annulé ou le paiement a échoué
      console.log("❌ Paiement annulé/échoué:", paymentResult.error.message);
      throw new Error(paymentResult.error.message);
    }

    console.log("✅ Paiement Stripe réussi");

    // 7️⃣ MAINTENANT : Confirmer la réservation (status: pending -> confirmed)
    console.log("🔄 Confirmation de la réservation...");
    
    const confirmedBooking = await service_booking.confirm_booking_after_payment(booking_id);
    
    console.log("✅ Réservation confirmée:", confirmedBooking);

    // 8️⃣ Succès total
    Alert.alert(
      "Paiement réussi 🎉",
      "Votre réservation est confirmée. Un reçu a été envoyé par email.",
      [
        {
          text: "OK",
          onPress: () => {
           navigation.navigate("ClientTabs", {screen:"MesTrajetsTab"}, {
  trip,
  seats,
  selectedStop,
  total: totalAmount,
  bookingId: confirmedBooking.id,
  bookingData: confirmedBooking,
});

          },
        },
      ]
    );

  } catch (error) {
    console.error("❌ Erreur paiement:", error);
    
    let errorMessage = "Le paiement a échoué. Veuillez réessayer.";
    
    if (error.message?.includes("canceled")) {
      errorMessage = "Paiement annulé";
    } else if (error.message?.includes("network")) {
      errorMessage = "Erreur de connexion. Vérifiez votre internet.";
    } else if (error.response?.status === 409) {
      errorMessage = "Cette réservation a déjà été confirmée";
    }
    
    Alert.alert("Erreur", errorMessage);
    
  } finally {
    setIsProcessing(false);
  }
};

 
// const handlePayment = async () => {
//   try {
//     setIsProcessing(true);

//     // 1️⃣ Vérification utilisateur
//     if (!user?.id) {
//       Alert.alert("Erreur", "Utilisateur non connecté");
//       return;
//     }

//     // 2️⃣ Vérifier qu'on a bien un booking pending
//     const booking_id = booking?.id;
    
//     if (!booking_id) {
//       Alert.alert("Erreur", "Réservation introuvable. Veuillez recommencer.");
//       navigation.goBack();
//       return;
//     }

//     console.log("💳 Paiement pour booking:", booking_id);

//     // 3️⃣ Calcul du driver_payable selon la méthode de paiement
//     const driver_payable = paymentMode === 'cash' ? 0 : base; // Si cash, driver reçoit en main propre
    
//     // 4️⃣ Construire la route
//     const departure_city = trip?.departure || "Ville départ";
//     const destination_city = selectedStop?.location || trip?.arrival || "Ville arrivée";
    
//     // 5️⃣ Date/heure du trip (format ISO)
//     let trip_departure_date = null;
//     if (trip?.date && trip?.time) {
//       // Combiner date et heure : "2025-11-15" + "16:13" -> "2025-11-15T16:13:00"
//       trip_departure_date = `${trip.date}T${trip.time}:00`;
//     } else if (trip?.date) {
//       trip_departure_date = `${trip.date}T00:00:00`;
//     }

//     // 6️⃣ Nom du passager
//     const passenger_name = user.first_name && user.last_name 
//       ? `${user.first_name} ${user.last_name}` 
//       : user.first_name || user.last_name || `User ${user.id}`;

//     // 7️⃣ Préparation du payload COMPLET (Solution 2)
//     const paymentPayload = {
//       user_id: user.id,
//       driver_id: trip.driver_id,
//       trip_id: trip.id,
//       booking_id: booking_id,
      
//       // Montants
//       amount: parseFloat(chargedNow.toFixed(2)), // Total à capturer par Stripe
//       currency: "CAD",
//       fee: parseFloat((seats * BOOKING_FEE_PER_SEAT).toFixed(2)),
//       tax_rate: TAX_RATE_NB,
//       tax_region: "HST-NB",
//       payment_method: "card",
      
//       // 🆕 DÉNORMALISATION : Infos du booking
//       chauffeur_payment_method: paymentMode === 'cash' ? 'cash' : 'virement',
//       driver_payable: parseFloat(driver_payable.toFixed(2)),
      
//       // 🆕 DÉNORMALISATION : Infos du trip
//       trip_departure_city: departure_city,
//       trip_destination_city: destination_city,
//       trip_departure_date: trip_departure_date,
      
//       // 🆕 DÉNORMALISATION : Info passager
//       passenger_name: passenger_name,
//     };

//     console.log("📦 Payload envoyé:", JSON.stringify(paymentPayload, null, 2));

//     // 8️⃣ Appel backend -> création du PaymentIntent Stripe
//     console.log("📡 Création PaymentIntent Stripe...");
//     const response = await service_payment.createPaymentIntent(paymentPayload);

//     if (!response?.client_secret) {
//       throw new Error("Impossible d'obtenir le client_secret Stripe");
//     }

//     console.log("✅ PaymentIntent créé");

//     // 9️⃣ Initialisation de la PaymentSheet Stripe
//     const initResponse = await initPaymentSheet({
//       paymentIntentClientSecret: response.client_secret,
//       merchantDisplayName: "MoVa by Core Technologies",
//       defaultBillingDetails: {
//         name: passenger_name,
//         email: user.email,
//       },
//       style: "automatic",
//     });

//     if (initResponse.error) {
//       throw new Error(`Erreur initPaymentSheet: ${initResponse.error.message}`);
//     }

//     console.log("✅ PaymentSheet initialisée");

//     // 🔟 Présentation de la PaymentSheet
//     const paymentResult = await presentPaymentSheet();

//     if (paymentResult.error) {
//       console.log("❌ Paiement annulé/échoué:", paymentResult.error.message);
//       throw new Error(paymentResult.error.message);
//     }

//     console.log("✅ Paiement Stripe réussi");

//     // 1️⃣1️⃣ MAINTENANT : Confirmer la réservation (pending -> confirmed)
//     console.log("🔄 Confirmation de la réservation...");
    
//     const confirmedBooking = await service_booking.confirm_booking_after_payment(booking_id);
    
//     console.log("✅ Réservation confirmée:", confirmedBooking);

//     // 1️⃣2️⃣ Succès total
//     Alert.alert(
//       "Paiement réussi 🎉",
//       paymentMode === 'cash' 
//         ? `Votre réservation est confirmée. N'oubliez pas de remettre ${base.toFixed(2)}$ en espèces au chauffeur.`
//         : "Votre réservation est confirmée. Un reçu a été envoyé par email.",
//       [
//         {
//           text: "OK",
//           onPress: () => {
//             navigation.navigate("ClientTabs", {
//               screen: "MesTrajetsTab"
//             }, {
//               trip,
//               seats,
//               selectedStop,
//               total: chargedNow.toFixed(2),
//               bookingId: confirmedBooking.id,
//               bookingData: confirmedBooking,
//             });
//           },
//         },
//       ]
//     );

//   } catch (error) {
//     console.error("❌ Erreur paiement:", error);
    
//     let errorMessage = "Le paiement a échoué. Veuillez réessayer.";
    
//     if (error.message?.includes("canceled")) {
//       errorMessage = "Paiement annulé";
//     } else if (error.message?.includes("network")) {
//       errorMessage = "Erreur de connexion. Vérifiez votre internet.";
//     } else if (error.response?.status === 409) {
//       errorMessage = "Cette réservation a déjà été confirmée";
//     } else if (error.response?.status === 422) {
//       // Erreur de validation côté backend
//       errorMessage = "Données invalides. Veuillez vérifier les informations.";
//       console.error("Détails 422:", error.response?.data);
//     }
    
//     Alert.alert("Erreur", errorMessage);
    
//   } finally {
//     setIsProcessing(false);
//   }
// };



  /* ============================== Rendu ============================== */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#003366" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Résumé du trajet */}
        <View style={styles.tripSummaryCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripTime}>{trip?.time || trip?.date || '--:--'}</Text>
            <View style={styles.seatsInfo}>
              <MaterialIcons name="person" size={16} color="#6B7280" />
              <Text style={styles.seatsText}>
                {seats} place{seats > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.locationRow}>
              <View className="dot" style={styles.dot} />
              <Text style={styles.locationText}>{trip?.departure || 'Départ'}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, styles.dotDest]} />
              <Text style={[styles.locationText, styles.destinationText]}>
                {selectedStop ? selectedStop.location : trip?.arrival || 'Destination'}
              </Text>
            </View>
          </View>

          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              <FontAwesome name="user" size={16} color="#fff" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{trip?.driverName || 'Conducteur'}</Text>
              <Text style={styles.carModel}>{trip?.carModel || 'Véhicule'}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.rating}>{Number(trip?.rating ?? 4.5).toFixed(1)}</Text>
            </View>
          </View>

          <View style={[styles.paymentTypeContainer, { backgroundColor: '#F0FDF4' }]}>
            <MaterialIcons name={paymentBanner.icon} size={18} color="#003366" />
            <Text style={[styles.paymentTypeText, { color: paymentBanner.tint }]}>
              {paymentBanner.text}
            </Text>
          </View>
        </View>

        {/* Détails de facturation */}
        <View style={styles.billingCard}>
          <Text style={styles.sectionTitle}>Détails de facturation</Text>

          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>
              Places ({seats} × {pricePerSeat.toFixed(2)}$)
            </Text>
            <Text style={styles.billingValue}>{base.toFixed(2)}$</Text>
          </View>

          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>
              Frais de service ({seats} × {BOOKING_FEE_PER_SEAT.toFixed(2)}$)
            </Text>
            <Text style={styles.billingValue}>{fee.toFixed(2)}$</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>
              {paymentMode === 'cash'
                ? 'Sous-total (frais uniquement)'
                : 'Sous-total (places + frais)'}
            </Text>
            <Text style={styles.billingValue}>{chargedNowPretax.toFixed(2)}$</Text>
          </View>

          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Taxes NB (15%)</Text>
            <Text style={styles.billingValue}>{tax.toFixed(2)}$</Text>
          </View>

          <View style={[styles.billingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              {paymentMode === 'cash' ? 'Total à payer maintenant' : 'Total'}
            </Text>
            <Text style={styles.totalValue}>{chargedNow.toFixed(2)}$</Text>
          </View>

          {paymentMode === 'cash' && (
            <View style={{ marginTop: 8 }}>
              <View style={styles.billingRow}>
                <Text style={[styles.billingLabel, { fontWeight: '600' }]}>
                  À remettre au chauffeur (sur place)
                </Text>
                <Text style={[styles.billingValue, { fontWeight: '700' }]}>
                  {base.toFixed(2)}$
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Informations carte */}
<TouchableOpacity
  style={[styles.payButton, isProcessing && styles.disabledButton]}
  onPress={handlePayment}
  disabled={isProcessing}
>
  <Text style={styles.payButtonText}>
    {isProcessing ? "Paiement en cours..." : `Payer ${chargedNow.toFixed(2)} $`}
  </Text>
</TouchableOpacity> 


        {/* Sécurité */}
        <View style={styles.securityNotice}>
          <MaterialIcons name="lock" size={20} color="#059669" />
          <Text style={styles.securityText}>
            Vos informations de paiement sont sécurisées et cryptées selon les standards PCI DSS.
          </Text>
        </View>

        {/* Conditions */}
        <View style={styles.conditionsBox}>
          <MaterialIcons name="info-outline" size={20} color="#003366" />
          <Text style={styles.conditionsText}>
            En confirmant ce paiement, vous acceptez nos conditions d'utilisation. La
            préautorisation sera effectuée immédiatement. Le paiement au chauffeur sera libéré
            après validation du trajet.
          </Text>
        </View>
      </ScrollView>

      {/* Footer bouton */}

    </SafeAreaView>
  );
}

// Les styles restent identiques...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 16, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366', textAlign: 'center', flex: 1 },

  tripSummaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripTime: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
  seatsInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  seatsText: { fontSize: 14, color: '#003366', marginLeft: 4, fontWeight: '600' },

  routeContainer: { marginVertical: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#003366', marginRight: 12 },
  dotDest: { backgroundColor: '#059669' },
  routeLine: { width: 2, height: 20, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: 2 },
  locationText: { fontSize: 15, color: '#374151', flex: 1 },
  destinationText: { fontWeight: '600', color: '#059669' },

  driverInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  carModel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 4 },

  paymentTypeContainer: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#F0FDF4',
    padding: 12, borderRadius: 8, marginHorizontal: -4,
  },
  paymentTypeText: { fontSize: 13, marginLeft: 8, flex: 1, fontWeight: '500' },

  billingCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 },
  billingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  billingLabel: { fontSize: 14, color: '#6B7280' },
  billingValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { fontSize: 16, color: '#111827', fontWeight: '600' },
  totalValue: { fontSize: 18, color: '#003366', fontWeight: 'bold' },

  cardSection: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  cardInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 16, paddingRight: 12,
  },
  cardInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, fontSize: 16, color: '#111827' },
  cardLogo: { width: 40, height: 25, resizeMode: 'contain' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  inputContainer: { flex: 1, marginHorizontal: 4 },
  inputLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 14, borderRadius: 8,
    borderWidth: 1, borderColor: '#D1D5DB', fontSize: 16, color: '#111827',
  },

  securityNotice: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4',
    padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#BBF7D0',
  },
  securityText: { fontSize: 12, color: '#059669', marginLeft: 8, flex: 1, fontWeight: '500' },

  conditionsBox: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8,
    marginBottom: 20, borderWidth: 1, borderColor: '#DBEAFE',
  },
  conditionsText: { fontSize: 12, color: '#1E3A8A', marginLeft: 8, flex: 1, lineHeight: 16 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
    padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  payButton: { backgroundColor: '#003366', borderRadius: 12, padding: 16, minHeight: 56, justifyContent: 'center' },
  disabledButton: { backgroundColor: '#9CA3AF' },
  payButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  payButtonAmount: { flexDirection: 'row', alignItems: 'center' },
  payButtonAmountText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  processingContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});