import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import FeedScreen from './screens/FeedScreen';
import MapScreen from './screens/MapScreen';
import RideScreen from './screens/RideScreen';
import BattlesScreen from './screens/BattlesScreen';
import ProfileScreen from './screens/ProfileScreen';

import { RidesProvider } from './store/ridesStore';

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <RidesProvider>
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: { backgroundColor: '#111' },
                        tabBarActiveTintColor: '#FF7A00',
                        tabBarInactiveTintColor: '#999',
                    }}
                >
                    <Tab.Screen name="Feed" component={FeedScreen} />
                    <Tab.Screen name="Map" component={MapScreen} />
                    <Tab.Screen name="Ride" component={RideScreen} />
                    <Tab.Screen name="Battles" component={BattlesScreen} />
                    <Tab.Screen name="Profile" component={ProfileScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        </RidesProvider>
    );
}