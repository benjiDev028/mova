import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MesTrajetsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const savedBookings = await AsyncStorage.getItem('userBookings');
      if (savedBookings) {
        const parsedBookings = JSON.parse(savedBookings);
        // Trier par date (plus récent en premier)
        const sortedBookings = parsedBookings.sort((a, b) => 
          new Date(b.bookingDate) - new Date(a.bookingDate)
        );
        setBookings(sortedBookings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadBookings().finally(() => setRefreshing(false));
  }, []);

  const isUpcoming = (booking) => {
    const tripDate = new Date(booking.trip.date || new Date());
    const today = new Date();
    return tripDate >= today;
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(booking => !isUpcoming(booking));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#059669';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#DC2626';
      case 'completed':
        return '#6B7280';
      default:
        return '#059669';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      default:
        return 'Confirmé';
    }
  };

  const BookingCard = ({ booking, isUpcoming = false }) => (
    <TouchableOpacity 
      style={[styles.bookingCard, isUpcoming && styles.upcomingCard]}
      onPress={() => navigation.navigate('BookingDetails', { booking })}
    >
      {isUpcoming && (
        <View style={styles.upcomingBadge}>
          <MaterialIcons name="schedule" size={12} color="#fff" />
          <Text style={styles.upcomingText}>À venir</Text>
        </View>
      )}

      <View style={styles.bookingHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.bookingDate}>
            {formatDate(booking.trip.date || booking.bookingDate)}
          </Text>
          <Text style={styles.bookingTime}>{booking.trip.time}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <View style={styles.dot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {booking.trip.departure}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.locationRow}>
          <View style={[styles.dot, styles.dotDest]} />
          <Text style={[styles.locationText, styles.destinationText]} numberOfLines={1}>
            {booking.selectedStop ? booking.selectedStop.location : booking.trip.arrival}
          </Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={12} color="#fff" />
          </View>
          <Text style={styles.driverName}>{booking.trip.driverName}</Text>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.seatsInfo}>
            <MaterialIcons name="person" size={14} color="#6B7280" />
            <Text style={styles.seatsText}>{booking.seats} place{booking.seats > 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.totalAmount}>{booking.total}$</Text>
        </View>
      </View>

      <View style={styles.bookingId}>
        <Text style={styles.bookingIdText}>Réf: {booking.bookingId}</Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = ({ title, subtitle, icon }) => (
    <View style={styles.emptyState}>
      <MaterialIcons name={icon} size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Trajets</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#003366" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Trajets à venir */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="upcoming" size={20} color="#003366" />
            <Text style={styles.sectionTitle}>Trajets à venir</Text>
            {upcomingBookings.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{upcomingBookings.length}</Text>
              </View>
            )}
          </View>

          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking, index) => (
              <BookingCard key={booking.bookingId || index} booking={booking} isUpcoming={true} />
            ))
          ) : (
            <EmptyState 
              title="Aucun trajet à venir"
              subtitle="Vos prochaines réservations apparaîtront ici"
              icon="schedule"
            />
          )}
        </View>

        {/* Historique */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={20} color="#003366" />
            <Text style={styles.sectionTitle}>Historique</Text>
            {pastBookings.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pastBookings.length}</Text>
              </View>
            )}
          </View>

          {pastBookings.length > 0 ? (
            pastBookings.map((booking, index) => (
              <BookingCard key={booking.bookingId || index} booking={booking} />
            ))
          ) : (
            <EmptyState 
              title="Aucun historique"
              subtitle="Vos trajets passés apparaîtront ici"
              icon="history"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    backgroundColor: '#003366',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  upcomingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    textTransform: 'capitalize',
  },
  bookingTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  routeContainer: {
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#003366',
    marginRight: 12,
  },
  dotDest: {
    backgroundColor: '#059669',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 3,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  destinationText: {
    fontWeight: '600',
    color: '#059669',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  bookingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  seatsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
  },
  bookingId: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  bookingIdText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MesTrajetsScreen;