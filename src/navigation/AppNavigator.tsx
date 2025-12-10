import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector } from '../store/hooks';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TableGridScreen from '../screens/TableGridScreen';
import MenuSelectionScreen from '../screens/MenuSelectionScreen';
import OrderReviewScreen from '../screens/OrderReviewScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ManagementScreen from '../screens/ManagementScreen';
import TableManagementScreen from '../screens/TableManagementScreen';
import MenuManagementScreen from '../screens/MenuManagementScreen';
import RestaurantInfoScreen from '../screens/RestaurantInfoScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { isAuthenticated } = useAppSelector(state => state.auth);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="TableGrid" component={TableGridScreen} />
                        <Stack.Screen name="MenuSelection" component={MenuSelectionScreen} />
                        <Stack.Screen name="OrderReview" component={OrderReviewScreen} />
                        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                        <Stack.Screen name="RestaurantInfo" component={RestaurantInfoScreen} />
                        <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
                        <Stack.Screen name="Management" component={ManagementScreen} />
                        <Stack.Screen name="TableManagement" component={TableManagementScreen} />
                        <Stack.Screen name="MenuManagement" component={MenuManagementScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
