import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
} from 'react-native';
import { useRides } from '../store/ridesStore';

function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }

    return `${pad(mins)}:${pad(secs)}`;
}

function formatDate(dateIso: string): string {
    const date = new Date(dateIso);
    return date.toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function FeedScreen() {
    const { rides, isLoading } = useRides();

    if (isLoading) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Загрузка поездок…</Text>
            </View>
        );
    }

    if (!rides || rides.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyTitle}>Пока нет ни одной поездки</Text>
                <Text style={styles.emptyText}>
                    Начни с вкладки <Text style={styles.accent}>Ride</Text>, чтобы
                    записать свою первую поездку 🚴
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.screenTitle}>Мои поездки</Text>
            <FlatList
                data={rides}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.date}>{formatDate(item.date)}</Text>
                            <Text style={styles.distance}>
                                {item.distanceKm.toFixed(2)} км
                            </Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>Время</Text>
                            <Text style={styles.value}>
                                {formatDuration(item.durationSec)}
                            </Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>Ср. скорость</Text>
                            <Text style={styles.value}>
                                {item.avgSpeedKmh.toFixed(1)} км/ч
                            </Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05060A',
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#F9FAFB',
        marginBottom: 12,
    },
    listContent: {
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#0B1120',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    date: {
        color: '#9CA3AF',
        fontSize: 13,
    },
    distance: {
        color: '#F97316',
        fontSize: 16,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    label: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    value: {
        color: '#E5E7EB',
        fontSize: 14,
        fontWeight: '500',
    },
    center: {
        flex: 1,
        backgroundColor: '#05060A',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    loadingText: {
        color: '#E5E7EB',
        fontSize: 16,
    },
    emptyTitle: {
        color: '#F9FAFB',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 15,
        textAlign: 'center',
    },
    accent: {
        color: '#F97316',
        fontWeight: '600',
    },
});