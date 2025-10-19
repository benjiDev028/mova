// StatsScreen.js
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';

const THEME = {
  primary: '#003366',
  accent: '#059669',
  text: '#111827',
  subtext: '#6B7280',
  cardBorder: '#EEF2F7',
};
const screenWidth = Dimensions.get('window').width;
const chartWidth = Math.max(260, screenWidth - 32);

const monthName = (d) =>
  d.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

/** ========= DONNÉES FACTICES =========
 * Remplace quand tu auras tes endpoints:
 * // TODO: brancher service_stats.get_driver_stats(userId, month)
 * // TODO: brancher service_stats.get_passenger_stats(userId, month)
 */
const mockDriverTrips = [
  { id: 'd1', date: '2025-08-01', route: 'Montréal → Ottawa', passengers: 2, price: 70 },
  { id: 'd2', date: '2025-08-03', route: 'Québec → Montréal', passengers: 3, price: 75 },
  { id: 'd3', date: '2025-08-07', route: 'Montréal → Gatineau', passengers: 1, price: 45 },
  { id: 'd4', date: '2025-08-08', route: 'Montréal → Ottawa', passengers: 2, price: 70 },
  { id: 'd5', date: '2025-08-12', route: 'Laval → Montréal', passengers: 1, price: 25 },
  { id: 'd6', date: '2025-08-15', route: 'Montréal → Ottawa', passengers: 3, price: 90 },
  { id: 'd7', date: '2025-08-22', route: 'Québec → Montréal', passengers: 2, price: 60 },
];
const mockPassengerBookings = [
  { id: 'p1', date: '2025-08-02', route: 'Montréal → Ottawa', seats: 1, paid: 35, driver: 'Alex P.' },
  { id: 'p2', date: '2025-08-06', route: 'Laval → Montréal', seats: 1, paid: 12, driver: 'Sophie L.' },
  { id: 'p3', date: '2025-08-20', route: 'Québec → Montréal', seats: 2, paid: 50, driver: 'Marc D.' },
];

/** Agrégations communes */
const sameMonth = (iso, monthDate) => {
  const d = new Date(iso);
  return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth();
};

const groupByRoute = (items, key = 'route') => {
  const map = new Map();
  items.forEach((it) => {
    const r = it[key] || '—';
    map.set(r, (map.get(r) || 0) + 1);
  });
  // Top 5 + "Autres"
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 5);
  const rest = entries.slice(5).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) top.push(['Autres', rest]);
  return top;
};

const daysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

const StatsScreen = ({ navigation }) => {
  const [role, setRole] = useState('driver'); // 'driver' | 'passenger'
  const [month, setMonth] = useState(() => new Date()); // mois courant
  const [refreshing, setRefreshing] = useState(false);

  const prevMonth = useCallback(() => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    setMonth(d);
  }, [month]);

  const nextMonth = useCallback(() => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    setMonth(d);
  }, [month]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: remplacer par fetch réel des stats
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  /** Filtrage des jeux de données par mois */
  const driverThisMonth = useMemo(
    () => mockDriverTrips.filter((t) => sameMonth(t.date, month)),
    [month]
  );
  const passengerThisMonth = useMemo(
    () => mockPassengerBookings.filter((b) => sameMonth(b.date, month)),
    [month]
  );

  /** KPIs */
  const kpis = useMemo(() => {
    if (role === 'driver') {
      const trips = driverThisMonth.length;
      const pax = driverThisMonth.reduce((s, t) => s + (t.passengers || 0), 0);
      const revenue = driverThisMonth.reduce((s, t) => s + (t.price || 0), 0);
      const rating = 4.8; // fictif
      return { trips, pax, revenue, rating };
    } else {
      const trips = passengerThisMonth.length;
      const seats = passengerThisMonth.reduce((s, b) => s + (b.seats || 0), 0);
      const spent = passengerThisMonth.reduce((s, b) => s + (b.paid || 0), 0);
      const rating = 4.9; // fictif
      return { trips, seats, spent, rating };
    }
  }, [role, driverThisMonth, passengerThisMonth]);

  /** Pie: part des itinéraires (par nombre de trajets) */
  const pieData = useMemo(() => {
    const items = role === 'driver' ? driverThisMonth : passengerThisMonth;
    const grouped = groupByRoute(items);
    const palette = ['#3498db', '#2ecc71', '#e74c3c', '#8e44ad', '#f39c12', '#16a085'];
    return grouped.map(([name, count], i) => ({
      name,
      population: count,
      color: palette[i % palette.length],
      legendFontColor: THEME.subtext,
      legendFontSize: 12,
    }));
  }, [role, driverThisMonth, passengerThisMonth]);

  /** Bar: trajets par jour du mois */
  const barData = useMemo(() => {
    const items = role === 'driver' ? driverThisMonth : passengerThisMonth;
    const dim = daysInMonth(month);
    const counts = Array(dim).fill(0);
    items.forEach((it) => {
      const d = new Date(it.date).getDate();
      counts[d - 1] += 1;
    });
    const labels = counts.map((_, i) => (i + 1) % 5 === 0 ? String(i + 1) : ''); // allège l’axe X
    return {
      labels,
      datasets: [{ data: counts }],
    };
  }, [role, driverThisMonth, passengerThisMonth, month]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 51, 102, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    propsForLabels: { fontSize: 10 },
    propsForBackgroundLines: { stroke: '#E5E7EB' },
  };

  const empty = role === 'driver' ? driverThisMonth.length === 0 : passengerThisMonth.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header + Rôle switch */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <View style={styles.roleSwitch}>
          <TouchableOpacity
            onPress={() => setRole('driver')}
            style={[styles.roleBtn, role === 'driver' && styles.roleBtnActive]}
          >
            <MaterialIcons name="directions-car" size={16} color={role === 'driver' ? '#fff' : THEME.primary} />
            <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Conducteur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRole('passenger')}
            style={[styles.roleBtn, role === 'passenger' && styles.roleBtnActive]}
          >
            <MaterialIcons name="event-seat" size={16} color={role === 'passenger' ? '#fff' : THEME.primary} />
            <Text style={[styles.roleText, role === 'passenger' && styles.roleTextActive]}>Passager</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sélecteur de mois */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
          <MaterialIcons name="chevron-left" size={22} color={THEME.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName(month)}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
          <MaterialIcons name="chevron-right" size={22} color={THEME.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Trajets</Text>
            <Text style={styles.kpiValue}>{kpis.trips || 0}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{role === 'driver' ? 'Passagers' : 'Sièges'}</Text>
            <Text style={styles.kpiValue}>{(role === 'driver' ? kpis.pax : kpis.seats) || 0}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Note</Text>
            <Text style={styles.kpiValue}>{kpis.rating?.toFixed ? kpis.rating.toFixed(1) : kpis.rating}</Text>
          </View>
        </View>

        {/* Revenu / Dépenses */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            {role === 'driver' ? 'Recette du mois' : 'Dépenses du mois'}
          </Text>
          <Text style={styles.totalValue}>
            {role === 'driver' ? `${(kpis.revenue || 0).toFixed(2)}$` : `${(kpis.spent || 0).toFixed(2)}$`}
          </Text>
        </View>

        {/* Graphiques */}
        {empty ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="info-outline" size={18} color={THEME.subtext} />
            <Text style={styles.emptyText}>Aucune donnée ce mois-ci.</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Répartition par itinéraire</Text>
              <View style={styles.chartCenter}>
                <PieChart
                  data={pieData}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="8"
                  hasLegend
                  absolute
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Trajets par jour</Text>
              <BarChart
                data={barData}
                width={chartWidth}
                height={220}
                fromZero
                showValuesOnTopOfBars={false}
                withInnerLines
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{ ...chartConfig, decimalPlaces: 0 }}
                style={{ borderRadius: 12 }}
              />
            </View>
          </>
        )}

        {/* Lien vers Encaissement (utile côté conducteur) */}
        {role === 'driver' && (
          <TouchableOpacity
            onPress={() => navigation?.navigate && navigation.navigate('Encaissement')}
            style={styles.actionBtn}
            activeOpacity={0.8}
          >
            <MaterialIcons name="payments" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Voir mes encaissements</Text>
          </TouchableOpacity>
        )}

        {/* Notes d’intégration */}
        <View style={styles.noteBox}>
          <MaterialIcons name="info" size={18} color={THEME.accent} />
          <Text style={styles.noteText}>
            Ces données sont fictives. Lorsque tes services seront prêts, remplace les jeux de données
            par les réponses API et conserve les mêmes agrégations.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ================== Styles ================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.primary },

  roleSwitch: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 10, padding: 4 },
  roleBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  roleBtnActive: { backgroundColor: THEME.primary },
  roleText: { marginLeft: 6, color: THEME.primary, fontWeight: '700' },
  roleTextActive: { color: '#fff' },

  monthSelector: {
    marginTop: 8, marginHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  monthBtn: { padding: 6 },
  monthLabel: { fontWeight: '700', color: THEME.text, textTransform: 'capitalize' },

  kpiRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  kpiCard: {
    flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: THEME.cardBorder,
  },
  kpiLabel: { color: THEME.subtext, fontSize: 12, marginBottom: 4 },
  kpiValue: { color: THEME.text, fontSize: 20, fontWeight: '800' },

  totalCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: THEME.cardBorder,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { color: THEME.subtext, fontSize: 14 },
  totalValue: { color: THEME.accent, fontSize: 22, fontWeight: '800' },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: THEME.cardBorder,
  },
  cardTitle: { fontWeight: '700', color: THEME.text, marginBottom: 8 },
  chartCenter: { alignItems: 'center' },

  actionBtn: {
    marginTop: 14, marginHorizontal: 16, backgroundColor: THEME.primary, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: '700' },

  emptyBox: {
    marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: THEME.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  emptyText: { color: THEME.subtext },

  noteBox: {
    marginHorizontal: 16, marginTop: 14, padding: 12, backgroundColor: '#F0FDF4',
    borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0', flexDirection: 'row', gap: 8,
  },
  noteText: { color: '#065F46', flex: 1, fontSize: 12 },
});

export default StatsScreen;
