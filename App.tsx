import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from './src/store';
import { useAppDispatch } from './src/store/hooks';
import { loginSuccess } from './src/store/slices/authSlice';
import AppNavigator from './src/navigation/AppNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function AppContent() {
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [accessToken, refreshToken, userStr, restaurantStr] = await AsyncStorage.multiGet([
        'accessToken',
        'refreshToken',
        'user',
        'restaurant',
      ]);

      if (accessToken[1] && refreshToken[1] && userStr[1] && restaurantStr[1]) {
        const user = JSON.parse(userStr[1]);
        const restaurant = JSON.parse(restaurantStr[1]);

        dispatch(loginSuccess({
          user,
          restaurant,
          accessToken: accessToken[1],
          refreshToken: refreshToken[1],
        }));
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return <AppNavigator />;
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
