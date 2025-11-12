// EncaissementScreen.js
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import service_driver_earning from '../../../services/service_payment/service_driver_earning';

// --------- Utils d'affichage ---------
const fmtMoney = (n) => `${Number(n || 0).toFixed(2)}$`;

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' });
};

const badge = (status) => {
  switch (status) {
    case 'payable':   return { label: 'À encaisser', color: '#0ea5e9', bg: '#e0f2fe' };
    case 'requested': return { label: 'Demandé',     color: '#a16207', bg: '#fef9c3' };
    case 'processing':return { label: 'Transfert en cours', color: '#0284c7', bg: '#e0f2fe' };
    case 'paid':      return { label: 'Payé',        color: '#059669', bg: '#d1fae5' };
    case 'failed':    return { label: 'Échec',       color: '#dc2626', bg: '#fee2e2' };
    default:          return { label: status,        color: '#6b7280', bg: '#f3f4f6' };
  }
};

const EncaissementScreen = () => {
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    total_month: 0,
    amount_payable: 0,
    count_payable: 0,
    amount_processing: 0,
    count_processing: 0,
    amount_paid_total: 0,
    payable_earnings: [],
    processing_earnings: [],
  });

  // ========== CHARGEMENT INITIAL ==========
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await service_driver_earning.getDriverEarningsSummary(user.id);
      setSummary(data);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les données d\'encaissement. Vérifiez votre connexion.',
        [{ text: 'Réessayer', onPress: loadData }]
      );
    } finally {
      setLoading(false);
    }
  };

  // ========== REFRESH ==========
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await service_driver_earning.refresh(user.id);
      setSummary(data);
    } catch (error) {
      console.error('❌ Erreur refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  // ========== ENCAISSEMENT GLOBAL ==========
  const handleEncaisserTout = useCallback(async () => {
    if (summary.payable_earnings.length === 0) {
      Alert.alert('Info', 'Aucun montant éligible à encaisser pour le moment.');
      return;
    }

    Alert.alert(
      'Confirmer l\'encaissement',
      `Vous allez demander le transfert de ${fmtMoney(summary.amount_payable)}.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const earningIds = summary.payable_earnings.map(e => e.id);
              
              await service_driver_earning.requestPayout(user.id, earningIds);
              
              Alert.alert(
                'Transfert en cours',
                'Votre encaissement a été demandé. Le virement est en cours de traitement (2–5 jours ouvrables).',
                [{ text: 'OK', onPress: loadData }]
              );
            } catch (error) {
              console.error('❌ Erreur encaissement:', error);
              Alert.alert('Erreur', 'Impossible de traiter la demande. Veuillez réessayer.');
            }
          },
        },
      ]
    );
  }, [summary.payable_earnings, summary.amount_payable, user?.id]);

  // ========== ENCAISSEMENT INDIVIDUEL ==========
  const handleEncaisserOne = useCallback(async (earningId, amount) => {
    Alert.alert(
      'Encaisser cette course',
      `Demander le virement de ${fmtMoney(amount)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await service_driver_earning.requestPayout(user.id, [earningId]);
              
              Alert.alert(
                'Transfert en cours',
                'Virement demandé. 2–5 jours ouvrables.',
                [{ text: 'OK', onPress: loadData }]
              );
            } catch (error) {
              console.error('❌ Erreur encaissement:', error);
              Alert.alert('Erreur', 'Impossible de traiter la demande.');
            }
          },
        },
      ]
    );
  }, [user?.id]);

  // ========== COMPOSANTS UI ==========
  const Summary = () => (
    <View style={styles.summary}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total ce mois</Text>
        <Text style={styles.summaryValue}>{fmtMoney(summary.total_month)}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>À encaisser</Text>
        <Text style={styles.summaryValue}>{fmtMoney(summary.amount_payable)}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>En transfert</Text>
        <Text style={styles.summaryValue}>{fmtMoney(summary.amount_processing)}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Versé (total)</Text>
        <Text style={styles.summaryValue}>{fmtMoney(summary.amount_paid_total)}</Text>
      </View>
    </View>
  );

  const SectionHeader = ({ icon, title, count, right }) => (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name={icon} size={18} color="#003366" />
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!count && <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>}
      </View>
      {right}
    </View>
  );

  const Row = ({ item }) => {
    const b = badge(item.status);
    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowDate}>{fmtDate(item.trip_date)}</Text>
          <Text style={styles.rowCity}>{item.route || 'Trajet'}</Text>
          <Text style={styles.rowPassenger}>Passager: {item.passenger_name || '—'}</Text>
          <View style={[styles.chip, { backgroundColor: b.bg }]}>
            <Text style={[styles.chipText, { color: b.color }]}>{b.label}</Text>
          </View>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>{fmtMoney(item.amount)}</Text>
          <Text style={styles.rowMethod}>Virement</Text>

          {item.status === 'payable' && (
            <TouchableOpacity 
              style={styles.primaryBtnSm} 
              onPress={() => handleEncaisserOne(item.id, item.amount)}
            >
              <Text style={styles.primaryBtnSmText}>Encaisser</Text>
            </TouchableOpacity>
          )}

          {item.status === 'processing' && (
            <View style={styles.processingPill}>
              <MaterialIcons name="hourglass-bottom" size={14} color="#0284c7" />
              <Text style={styles.processingText}>En cours</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ========== ÉCRAN DE CHARGEMENT ==========
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003366" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ========== RENDU PRINCIPAL ==========
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Encaissement</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#003366" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <Summary />

            {/* Section À encaisser */}
            <SectionHeader
              icon="payments"
              title="À encaisser"
              count={summary.count_payable}
              right={
                <TouchableOpacity
                  onPress={handleEncaisserTout}
                  disabled={summary.count_payable === 0}
                  style={[
                    styles.primaryBtn, 
                    summary.count_payable === 0 && { backgroundColor: '#9CA3AF' }
                  ]}
                >
                  <MaterialIcons name="bolt" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Encaisser maintenant</Text>
                </TouchableOpacity>
              }
            />
            {summary.count_payable === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="info-outline" size={18} color="#6B7280" />
                <Text style={styles.emptyText}>Aucun montant éligible à l'encaissement.</Text>
              </View>
            ) : (
              <FlatList
                data={summary.payable_earnings}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => <Row item={item} />}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentContainerStyle={styles.listContent}
              />
            )}

            {/* Section Transferts en cours */}
            <SectionHeader 
              icon="local-shipping" 
              title="Transferts en cours" 
              count={summary.count_processing} 
            />
            {summary.count_processing === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="check-circle" size={18} color="#059669" />
                <Text style={styles.emptyText}>Aucun transfert en attente.</Text>
              </View>
            ) : (
              <FlatList
                data={summary.processing_earnings}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => <Row item={item} />}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentContainerStyle={styles.listContent}
              />
            )}

            {/* Note informative */}
            <View style={styles.noteBox}>
              <MaterialIcons name="lock" size={18} color="#059669" />
              <Text style={styles.noteText}>
                Les virements par banque prennent en général 2 à 5 jours ouvrables. Vous recevrez un email de
                confirmation avec la référence du transfert.
              </Text>
            </View>

            {/* Note paiements cash */}
            <View style={[styles.noteBox, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
              <MaterialIcons name="info-outline" size={18} color="#0284c7" />
              <Text style={[styles.noteText, { color: '#1E3A8A' }]}>
                💡 Les trajets payés en <Text style={{fontWeight: 'bold'}}>cash</Text> ne sont pas listés ici 
                car vous recevez directement l'argent du passager.
              </Text>
            </View>
          </>
        }
        renderItem={null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
};

/* ------------------- Styles (identiques) ------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
  refreshBtn: { padding: 6 },

  summary: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', margin: 16, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: '#EEF2F7',
  },
  summaryItem: { width: '50%', marginBottom: 10 },
  summaryLabel: { color: '#6B7280', marginBottom: 4, fontSize: 12 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

  sectionHeader: {
    marginTop: 8, marginHorizontal: 16, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sectionTitle: { marginLeft: 8, fontWeight: '700', color: '#003366' },
  badge: { backgroundColor: '#003366', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#003366', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },

  listContent: { paddingHorizontal: 16 },

  row: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EEF2F7',
    padding: 14, flexDirection: 'row', justifyContent: 'space-between',
  },
  rowLeft: { flex: 1, paddingRight: 10 },
  rowRight: { alignItems: 'flex-end', minWidth: 120 },
  rowDate: { fontWeight: '700', color: '#111827' },
  rowCity: { color: '#374151', marginTop: 2 },
  rowPassenger: { color: '#6B7280', marginTop: 2, fontSize: 12 },
  rowAmount: { color: '#059669', fontWeight: '800', fontSize: 16, marginBottom: 2 },
  rowMethod: { color: '#6B7280', fontSize: 12, marginBottom: 6 },

  chip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 6 },
  chipText: { fontSize: 11, fontWeight: '700' },

  primaryBtnSm: {
    backgroundColor: '#003366', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginTop: 6,
  },
  primaryBtnSmText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  processingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, marginTop: 6,
  },
  processingText: { color: '#0284c7', fontWeight: '700', fontSize: 12 },

  emptyBox: {
    marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: '#EEF2F7', flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  emptyText: { color: '#6B7280' },

  noteBox: {
    margin: 16, padding: 12, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 12,
    flexDirection: 'row', gap: 8,
  },
  noteText: { color: '#065F46', flex: 1, fontSize: 12 },
});

export default EncaissementScreen;