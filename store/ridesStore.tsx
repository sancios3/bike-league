import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'RIDE_BATTLE_RIDES';

export interface Ride {
    id: string;
    date: string;
    durationSec: number;
    distanceKm: number;
    avgSpeedKmh: number;
}

export interface RideStats {
    totalDistance: number;
    totalTime: number;
    avgSpeed: number;
    ridesCount: number;
    maxDistance: number;
    maxSpeed: number;
}

interface RidesContextType {
    rides: Ride[];
    addRide: (ride: Omit<Ride, 'id'>) => Promise<void>;
    stats: RideStats;
    isLoading: boolean;
}

const RidesContext = createContext<RidesContextType | undefined>(undefined);

export function RidesProvider({ children }: { children: ReactNode }): React.JSX.Element {
    const [rides, setRides] = useState<Ride[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Загрузка поездок из AsyncStorage при старте
    useEffect(() => {
        loadRides();
    }, []);

    const loadRides = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Ride[];
                // Сортируем по дате (новые первыми)
                const sorted = parsed.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setRides(sorted);
            }
        } catch (error) {
            console.error('Error loading rides from storage:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveRides = async (newRides: Ride[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRides));
        } catch (error) {
            console.error('Error saving rides to storage:', error);
        }
    };

    const addRide = async (rideData: Omit<Ride, 'id'>) => {
        const newRide: Ride = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...rideData,
        };

        const updatedRides = [newRide, ...rides];
        setRides(updatedRides);
        await saveRides(updatedRides);
    };

    // Вычисление статистики
    const stats: RideStats = React.useMemo(() => {
        if (rides.length === 0) {
            return {
                totalDistance: 0,
                totalTime: 0,
                avgSpeed: 0,
                ridesCount: 0,
                maxDistance: 0,
                maxSpeed: 0,
            };
        }

        const totalDistance = rides.reduce((sum, ride) => sum + ride.distanceKm, 0);
        const totalTime = rides.reduce((sum, ride) => sum + ride.durationSec, 0);
        const maxDistance = Math.max(...rides.map(ride => ride.distanceKm));
        const maxSpeed = Math.max(...rides.map(ride => ride.avgSpeedKmh));
        const avgSpeed = totalTime > 0 ? (totalDistance / (totalTime / 3600)) : 0;

        return {
            totalDistance,
            totalTime,
            avgSpeed,
            ridesCount: rides.length,
            maxDistance,
            maxSpeed,
        };
    }, [rides]);

    return (
        <RidesContext.Provider value={{ rides, addRide, stats, isLoading }}>
            {children}
        </RidesContext.Provider>
    );
}

export function useRides(): RidesContextType {
    const context = useContext(RidesContext);
    if (!context) {
        throw new Error('useRides must be used within a RidesProvider');
    }
    return context;
}