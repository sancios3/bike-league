import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis } from 'victory-native';
import { useRides } from '../store/ridesStore';

// Временное имя пользователя — потом сделаем редактируемым
const USER_NAME = 'Alex Rider';

type Period = '7D' | '1M' | '3M' | '6M' | '1Y';

type ChartDataPoint = {
  x: number; // day index or timestamp
  y: number; // distance in km
  label: string; // for display
};

// Форматируем общее время в чч:мм
function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  if (hrs === 0) {
    return `${mins} мин`;
  }
  return `${hrs} ч ${mins} мин`;
}

// Агрегируем данные поездок по дням для выбранного периода
function aggregateRidesForPeriod(
  rides: any[],
  period: Period
): ChartDataPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysCount = 7;
  if (period === '1M') daysCount = 30;
  else if (period === '3M') daysCount = 90;
  else if (period === '6M') daysCount = 180;
  else if (period === '1Y') daysCount = 365;

  // Создаем массив дней от старых к новым
  const days: Date[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  // Агрегируем дистанцию по дням
  const dataPoints: ChartDataPoint[] = days.map((day, index) => {
    const dayStart = day.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const sumForDay = (rides || []).reduce((sum: number, ride: any) => {
      const rideDate = new Date(ride.date).getTime();
      if (rideDate >= dayStart && rideDate < dayEnd) {
        return sum + (ride.distanceKm || 0);
      }
      return sum;
    }, 0);

    // Форматируем label для оси X
    let label = '';
    if (period === '7D') {
      const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      label = weekdays[day.getDay()];
    } else {
      // Для более длинных периодов показываем дату
      const dayNum = day.getDate();
      const month = day.getMonth() + 1;
      label = `${dayNum}/${month}`;
    }

    return {
      x: index,
      y: sumForDay,
      label,
    };
  });

  return dataPoints;
}

export default function ProfileScreen() {
  const { rides, stats, isLoading } = useRides() as any;
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7D');

  // Безопасные значения по-умолчанию
  const totalDistance = stats?.totalDistance ?? 0; // км
  const totalTime = stats?.totalTime ?? 0;         // сек
  const avgSpeed = stats?.avgSpeed ?? 0;
  const ridesCount = stats?.ridesCount ?? (rides?.length ?? 0);
  const maxSpeed = stats?.maxSpeed ?? 0;
  const maxDistance = stats?.maxDistance ?? 0;

  // Агрегируем данные для текущего периода
  const chartData = useMemo(() => {
    return aggregateRidesForPeriod(rides || [], selectedPeriod);
  }, [rides, selectedPeriod]);

  // Проверяем, есть ли данные для отображения
  const hasData = chartData.some((point) => point.y > 0);

  const periods: Period[] = ['7D', '1M', '3M', '6M', '1Y'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Шапка профиля */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AR</Text>
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={styles.userName}>{USER_NAME}</Text>
          <Text style={styles.userSubtitle}>
            RideBattle пилот · {ridesCount} поездок
          </Text>
        </View>
      </View>

      {/* Основная статистика */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Общая статистика</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Километраж</Text>
            <Text style={styles.statValue}>
              {totalDistance.toFixed(1)} <Text style={styles.statUnit}>км</Text>
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Время в седле</Text>
            <Text style={styles.statValue}>
              {formatDuration(totalTime)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ср. скорость</Text>
            <Text style={styles.statValue}>
              {avgSpeed.toFixed(1)}{' '}
              <Text style={styles.statUnit}>км/ч</Text>
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Макс. скорость</Text>
            <Text style={styles.statValue}>
              {maxSpeed.toFixed(1)}{' '}
              <Text style={styles.statUnit}>км/ч</Text>
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Самая длинная</Text>
            <Text style={styles.statValue}>
              {maxDistance.toFixed(1)}{' '}
              <Text style={styles.statUnit}>км</Text>
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Поездок всего</Text>
            <Text style={styles.statValue}>{ridesCount}</Text>
          </View>
        </View>
      </View>

      {/* График километража с переключателем периодов */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Километраж</Text>

        {/* Переключатель периодов */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* График или сообщение о пустых данных */}
        {!hasData ? (
          <View style={styles.emptyChartContainer}>
            <Text style={styles.emptyText}>
              Нет данных для выбранного периода. Попробуй прокатиться 🚴‍♂️
            </Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <VictoryChart
              width={350}
              height={200}
              padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: '#374151' },
                  tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                  grid: { stroke: '#1F2937', strokeWidth: 0.5 },
                }}
                tickFormat={(t) => {
                  const point = chartData[Math.floor(t)];
                  if (!point) return '';
                  // Показываем только некоторые метки для длинных периодов
                  if (selectedPeriod === '7D') return point.label;
                  if (selectedPeriod === '1M' && t % 5 === 0) return point.label;
                  if ((selectedPeriod === '3M' || selectedPeriod === '6M') && t % 15 === 0) return point.label;
                  if (selectedPeriod === '1Y' && t % 30 === 0) return point.label;
                  return '';
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: '#374151' },
                  tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                  grid: { stroke: '#1F2937', strokeWidth: 0.5 },
                }}
                tickFormat={(t) => `${t.toFixed(0)}`}
              />
              <VictoryLine
                data={chartData}
                style={{
                  data: {
                    stroke: '#F97316',
                    strokeWidth: 2.5,
                  },
                }}
                interpolation="monotoneX"
              />
            </VictoryChart>
          </View>
        )}
      </View>

      {/* Небольшой футер */}
      <Text style={styles.footerText}>
        Все данные пока хранятся локально на устройстве. Позже добавим аккаунт,
        синхронизацию и онлайн-рейтинг.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  avatarText: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
  },
  headerTextBlock: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  periodButtonActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyChartContainer: {
    backgroundColor: '#020617',
    borderRadius: 16,
    padding: 40,
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    backgroundColor: '#020617',
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});