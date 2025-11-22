import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRides } from '../store/ridesStore';

type Leader = {
  id: string;
  name: string;
  distance: number; // км
  isYou?: boolean;
};

export default function BattlesScreen() {
  const { stats } = useRides();

  const youDistanceKm = Number(stats.totalDistance.toFixed(1));
  const youRidesCount = stats.ridesCount;

  const baseLeaders: Leader[] = [
    { id: '1', name: 'Fast Fox', distance: 120 },
    { id: '2', name: 'Night Rider', distance: 95 },
    { id: '3', name: 'Urban Rocket', distance: 68 },
    { id: '4', name: 'Gravel Ghost', distance: 42 },
  ];

  const leaders: Leader[] = [
    ...baseLeaders,
    {
      id: 'you',
      name: 'You',
      distance: youDistanceKm,
      isYou: true,
    },
  ];

  const sortedLeaders = [...leaders].sort((a, b) => b.distance - a.distance);
  const yourIndex = sortedLeaders.findIndex((l) => l.isYou);
  const yourPlace = yourIndex === -1 ? null : yourIndex + 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Битвы и рейтинг</Text>
      <Text style={styles.subtitle}>
        Пока что это демо-рейтинг на основе твоего общего километража.
      </Text>

      <View style={styles.youCard}>
        <Text style={styles.youLabel}>Твоя позиция</Text>
        <View style={styles.youRow}>
          <Text style={styles.youPlace}>
            {yourPlace ? `#${yourPlace}` : '—'}
          </Text>
          <View>
            <Text style={styles.youDistance}>{youDistanceKm.toFixed(1)} км</Text>
            <Text style={styles.youRides}>{youRidesCount} поездок всего</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Локальный лидерборд (демо)</Text>

      <FlatList
        data={sortedLeaders}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.row,
              item.isYou && styles.rowYou,
            ]}
          >
            <Text style={[styles.rowPlace, item.isYou && styles.rowPlaceYou]}>
              #{index + 1}
            </Text>
            <View style={styles.rowCenter}>
              <Text
                style={[styles.rowName, item.isYou && styles.rowNameYou]}
                numberOfLines={1}
              >
                {item.isYou ? 'Вы' : item.name}
              </Text>
            </View>
            <Text style={[styles.rowDistance, item.isYou && styles.rowDistanceYou]}>
              {item.distance.toFixed(1)} км
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050608',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  youCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#FF7A00',
  },
  youLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  youRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  youPlace: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF7A00',
    marginRight: 12,
  },
  youDistance: {
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '600',
  },
  youRides: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  rowYou: {
    borderWidth: 1,
    borderColor: '#FF7A00',
  },
  rowPlace: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    width: 40,
  },
  rowPlaceYou: {
    color: '#FF7A00',
  },
  rowCenter: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    color: '#E5E7EB',
  },
  rowNameYou: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rowDistance: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  rowDistanceYou: {
    color: '#FF7A00',
    fontWeight: '700',
  },
  separator: {
    height: 8,
  },
});