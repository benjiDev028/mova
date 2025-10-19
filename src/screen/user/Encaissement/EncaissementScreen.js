// EncaissementScreen.js
import React, { useMemo, useState, useCallback } from 'react';
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
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

// --------- Utils d'affichage ---------
const fmtMoney = (n) => `${Number(n || 0).toFixed(2)}$`;
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' });
};
const addBusinessDays = (date, days) => {
  let d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (!isWeekend) added++;
  }
  return d;
};
const randomRef = () => 'TRF-' + Math.random().toString(36).slice(2, 8).toUpperCase();

// --------- Données factices (exemples) ---------
const seedPayments = [
  // Payables (méthode virement => encaisser possible)
  { id: 't1', trip_id: 'f3cf...', date: '2025-08-29T17:00:00Z', amount: 70, method: 'virement', status: 'payable', passenger: 'Alex P.', city: 'Montréal → Ottawa' },
  { id: 't2', trip_id: 'e48...',  date: '2025-08-30T13:00:00Z', amount: 45, method: 'virement', status: 'payable', passenger: 'Yara C.', city: 'Montréal → Gatineau' },

  // En transfert (processing)
  { id: 't3', trip_id: 'a12...', date: '2025-08-22T10:00:00Z', amount: 60, method: 'virement', status: 'processing', requested_at: '2025-08-23T09:00:00Z', eta: '2025-08-28T09:00:00Z', transfer_ref: 'TRF-9J4K2X', passenger: 'Marc D.', city: 'Québec → Montréal' },

  // Payés (historique)
  { id: 't4', trip_id: 'b77...', date: '2025-08-12T18:00:00Z', amount: 30, method: 'virement', status: 'paid', paid_at: '2025-08-15T11:22:00Z', transfer_ref: 'TRF-7AD1QH', passenger: 'Sofia M.', city: 'Laval → Montréal' },

  // Non éligibles (cash / carte versé instant à toi, donc pas d'encaissement via app)
  { id: 't5', trip_id: 'c55...', date: '2025-08-20T19:00:00Z', amount: 25, method: 'cash', status: 'paid', passenger: 'Invité', city: 'Longueuil → Montréal' },
];

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
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState(seedPayments);
  const now = useMemo(() => new Date(), []);

  // Agrégats
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rowsThisMonth = useMemo(
    () => rows.filter(r => {
      const d = new Date(r.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return k === monthKey;
    }),
    [rows, monthKey]
  );

  const totalMonth = useMemo(
    () => rowsThisMonth.reduce((s, r) => s + (r.amount || 0), 0),
    [rowsThisMonth]
  );

  const payableRows = useMemo(
    () => rows.filter(r => r.method === 'virement' && r.status === 'payable'),
    [rows]
  );
  const processingRows = useMemo(
    () => rows.filter(r => r.method === 'virement' && (r.status === 'requested' || r.status === 'processing')),
    [rows]
  );
  const historyRows = useMemo(
    () => rows
      .filter(r => r.method === 'virement' && (r.status === 'paid' || r.status === 'failed'))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [rows]
  );

  const amountToTransfer = useMemo(
    () => payableRows.reduce((s, r) => s + (r.amount || 0), 0),
    [payableRows]
  );

  const amountProcessing = useMemo(
    () => processingRows.reduce((s, r) => s + (r.amount || 0), 0),
    [processingRows]
  );

  const amountPaidTotal = useMemo(
    () => rows.filter(r => r.status === 'paid' && r.method === 'virement').reduce((s, r) => s + (r.amount || 0), 0),
    [rows]
  );

  // Simule un encaissement "bulk" (toutes les lignes payables)
  const handleEncaisserTout = useCallback(() => {
    if (payableRows.length === 0) {
      Alert.alert('Info', 'Aucun montant éligible à encaisser pour le moment.');
      return;
    }

    Alert.alert(
      'Confirmer l\'encaissement',
      `Vous allez demander le transfert de ${fmtMoney(amountToTransfer)} (virement).`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            const now = new Date();
            const eta = addBusinessDays(now, Math.floor(Math.random() * 4) + 2);
            const ref = randomRef();

            setRows(prev =>
              prev.map(r =>
                r.method === 'virement' && r.status === 'payable'
                  ? { ...r, status: 'processing', requested_at: now.toISOString(), eta: eta.toISOString(), transfer_ref: ref }
                  : r
              )
            );

            Alert.alert(
              'Transfert en cours',
              'Votre encaissement a été demandé. Le virement est en cours de traitement (2–5 jours ouvrables).'
            );
          },
        },
      ]
    );
  }, [payableRows, amountToTransfer]);

  // Simule un encaissement ligne par ligne
  const handleEncaisserOne = useCallback((id, amount) => {
    Alert.alert(
      'Encaisser cette course',
      `Demander le virement de ${fmtMoney(amount)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            const now = new Date();
            const eta = addBusinessDays(now, Math.floor(Math.random() * 4) + 2);
            const ref = randomRef();

            setRows(prev =>
              prev.map(r =>
                r.id === id
                  ? { ...r, status: 'processing', requested_at: now.toISOString(), eta: eta.toISOString(), transfer_ref: ref }
                  : r
              )
            );

            Alert.alert('Transfert en cours', 'Virement demandé. 2–5 jours ouvrables.');
          },
        },
      ]
    );
  }, []);

  // Simule la réception (pour démo)
  const markAsPaid = useCallback((id) => {
    const paidAt = new Date().toISOString();
    setRows(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: 'paid', paid_at: paidAt } : r
      )
    );
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const Summary = () => (
    <View style={styles.summary}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total ce mois</Text>
        <Text style={styles.summaryValue}>{fmtMoney(totalMonth)}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>À encaisser</Text>
        <Text style={styles.summaryValue}>{fmtMoney(amountToTransfer)}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>En transfert</Text>
        <Text style={styles.summaryValue}>{fmtMoney(amountProcessing)}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Versé (total)</Text>
        <Text style={styles.summaryValue}>{fmtMoney(amountPaidTotal)}</Text>
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
          <Text style={styles.rowDate}>{fmtDate(item.date)}</Text>
          <Text style={styles.rowCity}>{item.city}</Text>
          <Text style={styles.rowPassenger}>Passager: {item.passenger || '—'}</Text>
          <View style={[styles.chip, { backgroundColor: b.bg }]}>
            <Text style={[styles.chipText, { color: b.color }]}>{b.label}</Text>
          </View>
          {item.status === 'processing' && (
            <Text style={styles.rowEta}>
              Réf: {item.transfer_ref || '—'} • Arrivée estimée: {item.eta ? fmtDate(item.eta) : '2–5 jours ouvrables'}
            </Text>
          )}
          {item.status === 'paid' && (
            <Text style={styles.rowEta}>
              Réf: {item.transfer_ref || '—'} • Reçu le {item.paid_at ? fmtDate(item.paid_at) : '—'}
            </Text>
          )}
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>{fmtMoney(item.amount)}</Text>
          <Text style={styles.rowMethod}>{item.method === 'virement' ? 'Virement' : item.method}</Text>

          {item.status === 'payable' && (
            <TouchableOpacity style={styles.primaryBtnSm} onPress={() => handleEncaisserOne(item.id, item.amount)}>
              <Text style={styles.primaryBtnSmText}>Encaisser</Text>
            </TouchableOpacity>
          )}

          {item.status === 'processing' && (
            <View style={styles.processingPill}>
              <MaterialIcons name="hourglass-bottom" size={14} color="#0284c7" />
              <Text style={styles.processingText}>En cours</Text>
            </View>
          )}

          {/* Bouton démo pour marquer payé */}
          {item.status === 'processing' && (
            <TouchableOpacity style={styles.linkBtn} onPress={() => markAsPaid(item.id)}>
              <Text style={styles.linkBtnText}>Marquer "reçu" (démo)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
              count={payableRows.length}
              right={
                <TouchableOpacity
                  onPress={handleEncaisserTout}
                  disabled={payableRows.length === 0}
                  style={[styles.primaryBtn, payableRows.length === 0 && { backgroundColor: '#9CA3AF' }]}
                >
                  <MaterialIcons name="bolt" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Encaisser maintenant</Text>
                </TouchableOpacity>
              }
            />
            {payableRows.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="info-outline" size={18} color="#6B7280" />
                <Text style={styles.emptyText}>Aucun montant éligible à l'encaissement.</Text>
              </View>
            ) : (
              <FlatList
                data={payableRows}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => <Row item={item} />}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentContainerStyle={styles.listContent}
              />
            )}

            {/* Section Transferts en cours */}
            <SectionHeader icon="local-shipping" title="Transferts en cours" count={processingRows.length} />
            {processingRows.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="check-circle" size={18} color="#059669" />
                <Text style={styles.emptyText}>Aucun transfert en attente.</Text>
              </View>
            ) : (
              <FlatList
                data={processingRows}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => <Row item={item} />}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentContainerStyle={styles.listContent}
              />
            )}

            {/* Section Historique (payés/échoués) */}
            <SectionHeader icon="history" title="Historique des virements" count={historyRows.length} />
            {historyRows.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="hourglass-empty" size={18} color="#6B7280" />
                <Text style={styles.emptyText}>Aucun virement pour le moment.</Text>
              </View>
            ) : (
              <FlatList
                data={historyRows}
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
          </>
        }
        renderItem={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
};

/* ------------------- Styles ------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

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
  rowEta: { color: '#6B7280', fontSize: 12, marginTop: 6 },

  primaryBtnSm: {
    backgroundColor: '#003366', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginTop: 6,
  },
  primaryBtnSmText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  processingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, marginTop: 6,
  },
  processingText: { color: '#0284c7', fontWeight: '700', fontSize: 12 },

  linkBtn: { marginTop: 8 },
  linkBtnText: { color: '#2563eb', fontSize: 12, textDecorationLine: 'underline' },

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