import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useRides } from '../store/ridesStore';

interface Coordinate {
    latitude: number;
    longitude: number;
    timestamp: number;
}

export default function RideScreen() {
    const { addRide, rides } = useRides();
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [distance, setDistance] = useState(0);
    const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning) {
            interval = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds + 1);
            }, 1000);
        } else if (interval) {
            clearInterval(interval);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isRunning]);

    const formatTime = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Haversine formula для расчета дистанции между двумя координатами
    const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
        const R = 6371; // Радиус Земли в километрах
        const dLat = toRadians(coord2.latitude - coord1.latitude);
        const dLon = toRadians(coord2.longitude - coord1.longitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(coord1.latitude)) *
                Math.cos(toRadians(coord2.latitude)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Дистанция в километрах
    };

    const toRadians = (degrees: number): number => {
        return degrees * (Math.PI / 180);
    };

    const calculateAverageSpeed = (distanceKm: number, timeSeconds: number): number => {
        if (timeSeconds === 0) return 0;
        const hours = timeSeconds / 3600;
        return distanceKm / hours; // км/ч
    };

    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setPermissionError('Разрешение на геолокацию не предоставлено');
                Alert.alert(
                    'Нет доступа к геолокации',
                    'Для отслеживания поездки необходимо разрешить доступ к вашему местоположению.',
                    [{ text: 'OK' }]
                );
                return false;
            }

            setPermissionError(null);

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 5,
                },
                (location) => {
                    const newCoord: Coordinate = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        timestamp: location.timestamp,
                    };

                    setCoordinates((prevCoords) => {
                        const updatedCoords = [...prevCoords, newCoord];

                        // Вычисляем дистанцию от предыдущей точки
                        if (prevCoords.length > 0) {
                            const lastCoord = prevCoords[prevCoords.length - 1];
                            const segmentDistance = calculateDistance(lastCoord, newCoord);
                            setDistance((prevDistance) => prevDistance + segmentDistance);
                        }

                        return updatedCoords;
                    });
                }
            );

            return true;
        } catch (error) {
            console.error('Error starting location tracking:', error);
            setPermissionError('Ошибка при запуске отслеживания');
            Alert.alert('Ошибка', 'Не удалось начать отслеживание местоположения');
            return false;
        }
    };

    const stopLocationTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
    };

    const handleButtonPress = async () => {
        if (isRunning) {
            // Stop the ride
            setIsRunning(false);
            stopLocationTracking();

            // Сохраняем поездку в хранилище
            const avgSpeed = calculateAverageSpeed(distance, seconds);
            await addRide({
                date: new Date().toISOString(),
                durationSec: seconds,
                distanceKm: distance,
                avgSpeedKmh: avgSpeed,
            });
        } else {
            // Start the ride
            setSeconds(0);
            setDistance(0);
            setCoordinates([]);
            setPermissionError(null);

            const success = await startLocationTracking();
            if (success) {
                setIsRunning(true);
            }
        }
    };

    // Cleanup при размонтировании компонента
    useEffect(() => {
        return () => {
            stopLocationTracking();
        };
    }, []);

    const currentSpeed = calculateAverageSpeed(distance, seconds);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Таймер */}
                <Text style={styles.timer}>{formatTime(seconds)}</Text>

                {/* Дистанция и скорость во время поездки */}
                {isRunning && (
                    <View style={styles.metricsContainer}>
                        <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>Дистанция</Text>
                            <Text style={styles.metricValue}>
                                {distance.toFixed(2)} км
                            </Text>
                        </View>
                        <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>Скорость</Text>
                            <Text style={styles.metricValue}>
                                {currentSpeed.toFixed(1)} км/ч
                            </Text>
                        </View>
                    </View>
                )}

                {/* Кнопка Start/Stop */}
                <TouchableOpacity
                    style={[styles.button, isRunning && styles.buttonStop]}
                    onPress={handleButtonPress}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {isRunning ? 'Stop Ride' : 'Start Ride'}
                    </Text>
                </TouchableOpacity>

                {/* Сообщение об ошибке разрешений */}
                {permissionError && !isRunning && (
                    <Text style={styles.errorText}>{permissionError}</Text>
                )}

                {/* Статистика последней поездки */}
                {rides.length > 0 && !isRunning && (
                    <View style={styles.lastRideContainer}>
                        <Text style={styles.lastRideTitle}>Последняя поездка:</Text>
                        <Text style={styles.lastRideStat}>
                            Время: {formatTime(rides[0].durationSec)}
                        </Text>
                        <Text style={styles.lastRideStat}>
                            Дистанция: {rides[0].distanceKm.toFixed(2)} км
                        </Text>
                        <Text style={styles.lastRideStat}>
                            Средняя скорость: {rides[0].avgSpeedKmh.toFixed(1)} км/ч
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05060A',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    timer: {
        fontSize: 72,
        fontWeight: '700',
        color: '#F5F5F5',
        marginBottom: 20,
        fontVariant: ['tabular-nums'],
    },
    metricsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 30,
    },
    metricBox: {
        alignItems: 'center',
        backgroundColor: '#111827',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 12,
        minWidth: 140,
    },
    metricLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 5,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#F5F5F5',
        fontVariant: ['tabular-nums'],
    },
    button: {
        backgroundColor: '#F97316',
        paddingVertical: 20,
        paddingHorizontal: 60,
        borderRadius: 16,
        minWidth: 200,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonStop: {
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
    },
    buttonText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    errorText: {
        marginTop: 20,
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
        maxWidth: '80%',
    },
    lastRideContainer: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#111827',
        borderRadius: 12,
        alignItems: 'center',
    },
    lastRideTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F97316',
        marginBottom: 10,
    },
    lastRideStat: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
});