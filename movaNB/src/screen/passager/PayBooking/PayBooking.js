import React, { useState } from 'react';
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
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const CARD_TYPES = {
  visa: require('../../../../assets/visa.png'),
  mastercard: require('../../../../assets/mastercard.png'),
  amex: require('../../../../assets/amex.png'),
  discover: require('../../../../assets/discover.png')
};

const PayBookingScreen = ({ route, navigation }) => {
  const { trip, seats, selectedStop } = route.params;
  const [cardNumber, setCardNumber] = useState('');
  const [formattedCardNumber, setFormattedCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [cardType, setCardType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 16);
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(limited);
    setFormattedCardNumber(formatted);
    detectCardType(limited);
  };

  const detectCardType = (number) => {
    if (/^4/.test(number)) {
      setCardType('visa');
    } else if (/^5[1-5]/.test(number)) {
      setCardType('mastercard');
    } else if (/^3[47]/.test(number)) {
      setCardType('amex');
    } else if (/^6(?:011|5)/.test(number)) {
      setCardType('discover');
    } else {
      setCardType(null);
    }
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{2})(?=\d)/g, '$1/');
    setExpiry(formatted.slice(0, 5));
  };

  const formatCvv = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const maxLength = cardType === 'amex' ? 4 : 3;
    setCvv(cleaned.slice(0, maxLength));
  };

  const formatPostalCode = (text) => {
    // Format canadien: A1A 1A1
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 6) {
      const formatted = cleaned.replace(/^([A-Z]\d[A-Z])(\d[A-Z]\d)$/, '$1 $2');
      setPostalCode(formatted);
    }
  };

  // Calculs des prix
  const pricePerSeat = selectedStop ? selectedStop.price : trip.price;
  const subtotal = pricePerSeat * seats;
  const bookingFee = 3.5 * seats; // Frais par personne
  const annualFee = 7;
  const pretaxTotal = subtotal + bookingFee + annualFee;
  const nbTax = pretaxTotal * 0.15;
  const total = pretaxTotal + nbTax;

  const handlePayment = async () => {
    // Validation des champs
    if (!cardNumber || cardNumber.length < 15) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de carte valide');
      return;
    }
    if (!expiry || expiry.length < 5) {
      Alert.alert('Erreur', 'Veuillez entrer une date d\'expiration valide');
      return;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert('Erreur', 'Veuillez entrer un CVV valide');
      return;
    }
    if (!postalCode) {
      Alert.alert('Erreur', 'Veuillez entrer votre code postal');
      return;
    }

    setIsProcessing(true);
    
    // Simulation du traitement
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Paiement réussi! 🎉',
        'Votre réservation a été confirmée. Vous recevrez un email de confirmation sous peu.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('BookingConfirmation', { 
              trip, 
              seats, 
              selectedStop, 
              total: total.toFixed(2),
              bookingId: 'RES' + Math.random().toString(36).substr(2, 9).toUpperCase()
            })
          }
        ]
      );
    }, 2000);
  };

  const getPaymentType = () => {
    if (trip.preferences.includes('paiementCash')) {
      return {
        type: 'cash',
        description: `Paiement en espèces : ${pricePerSeat}$ par passager à remettre au chauffeur`,
        icon: 'payments'
      };
    } else if (trip.preferences.includes('virement')) {
      return {
        type: 'transfer',
        description: 'Paiement par virement bancaire à effectuer avant le départ',
        icon: 'account-balance'
      };
    } else {
      return {
        type: 'card',
        description: 'Préautorisation sur carte de crédit',
        icon: 'credit-card'
      };
    }
  };

  const paymentMethod = getPaymentType();
  const isFormValid = cardNumber.length >= 15 && expiry.length === 5 && cvv.length >= 3 && postalCode.length > 0;

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
            <Text style={styles.tripTime}>{trip.time}</Text>
            <View style={styles.seatsInfo}>
              <MaterialIcons name="person" size={16} color="#6B7280" />
              <Text style={styles.seatsText}>{seats} place{seats > 1 ? 's' : ''}</Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.locationRow}>
              <View style={styles.dot} />
              <Text style={styles.locationText}>{trip.departure}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, styles.dotDest]} />
              <Text style={[styles.locationText, styles.destinationText]}>
                {selectedStop ? selectedStop.location : trip.arrival}
              </Text>
            </View>
          </View>

          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              <FontAwesome name="user" size={16} color="#fff" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{trip.driverName}</Text>
              <Text style={styles.carModel}>{trip.carModel}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.rating}>{trip.rating}</Text>
            </View>
          </View>

          <View style={styles.paymentTypeContainer}>
            <MaterialIcons name={paymentMethod.icon} size={18} color="#003366" />
            <Text style={styles.paymentTypeText}>{paymentMethod.description}</Text>
          </View>
        </View>

        {/* Détails de facturation */}
        <View style={styles.billingCard}>
          <Text style={styles.sectionTitle}>Détails de facturation</Text>
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Places ({seats}x {pricePerSeat}$)</Text>
            <Text style={styles.billingValue}>{subtotal.toFixed(2)}$</Text>
          </View>
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Frais de réservation ({seats}x 3.50$)</Text>
            <Text style={styles.billingValue}>{bookingFee.toFixed(2)}$</Text>
          </View>
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Abonnement passager annuel</Text>
            <Text style={styles.billingValue}>{annualFee.toFixed(2)}$</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Sous-total</Text>
            <Text style={styles.billingValue}>{pretaxTotal.toFixed(2)}$</Text>
          </View>
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Taxes NB (15%)</Text>
            <Text style={styles.billingValue}>{nbTax.toFixed(2)}$</Text>
          </View>
          
          <View style={[styles.billingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)}$</Text>
          </View>
        </View>

        {/* Informations de carte */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Informations de paiement</Text>
          
          <View style={styles.cardInputContainer}>
            <TextInput
              style={styles.cardInput}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={formattedCardNumber}
              onChangeText={formatCardNumber}
              maxLength={19}
            />
            {cardType && (
              <Image source={CARD_TYPES[cardType]} style={styles.cardLogo} />
            )}
          </View>

          <View style={styles.cardRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date d'expiration</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={expiry}
                onChangeText={formatExpiry}
                maxLength={5}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder={cardType === 'amex' ? '1234' : '123'}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={cvv}
                onChangeText={formatCvv}
                secureTextEntry
                maxLength={cardType === 'amex' ? 4 : 3}
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Code postal</Text>
            <TextInput
              style={styles.input}
              placeholder="A1A 1A1"
              placeholderTextColor="#9CA3AF"
              value={postalCode}
              onChangeText={formatPostalCode}
              autoCapitalize="characters"
              maxLength={7}
            />
          </View>
        </View>

        {/* Notice de sécurité */}
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
            En confirmant ce paiement, vous acceptez nos conditions d'utilisation. 
            La préautorisation sera effectuée immédiatement. Le paiement au chauffeur 
            sera libéré après validation du trajet.
          </Text>
        </View>
      </ScrollView>

      {/* Bouton de paiement fixe */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.payButton, 
            (!isFormValid || isProcessing) && styles.disabledButton
          ]} 
          onPress={handlePayment}
          disabled={!isFormValid || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
              <Text style={styles.payButtonText}>Traitement en cours...</Text>
            </View>
          ) : (
            <View style={styles.payButtonContainer}>
              <Text style={styles.payButtonText}>Confirmer le paiement</Text>
              <View style={styles.payButtonAmount}>
                <Text style={styles.payButtonAmountText}>{total.toFixed(2)}$</Text>
                <Ionicons name="lock-closed" size={18} color="#fff" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    flex: 1,
  },
  tripSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seatsText: {
    fontSize: 14,
    color: '#003366',
    marginLeft: 4,
    fontWeight: '600',
  },
  routeContainer: {
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#003366',
    marginRight: 12,
  },
  dotDest: {
    backgroundColor: '#059669',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  destinationText: {
    fontWeight: '600',
    color: '#059669',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  carModel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: -4,
  },
  paymentTypeText: {
    fontSize: 13,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  billingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billingValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: '#003366',
    fontWeight: 'bold',
  },
  cardSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
    paddingRight: 12,
  },
  cardInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  cardLogo: {
    width: 40,
    height: 25,
    resizeMode: 'contain',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
    color: '#111827',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  conditionsBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  conditionsText: {
    fontSize: 12,
    color: '#1E3A8A',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#003366',
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  payButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payButtonAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButtonAmountText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default PayBookingScreen;