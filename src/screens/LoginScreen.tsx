import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch } from '../store/hooks';
import { loginSuccess, setLoading } from '../store/slices/authSlice';
import api from '../services/api';
import { AuthResponse } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';
import { Button } from '../components/Button';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('owner@tabletap.com');
    const [password, setPassword] = useState('password123');
    const [loading, setLoadingState] = useState(false);
    const dispatch = useAppDispatch();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoadingState(true);
        dispatch(setLoading(true));

        try {
            const response = await api.post<AuthResponse>('/auth/login', {
                email: email.trim().toLowerCase(),
                password,
            });

            const { user, restaurant, accessToken, refreshToken } = response.data;

            await AsyncStorage.multiSet([
                ['accessToken', accessToken],
                ['refreshToken', refreshToken],
                ['user', JSON.stringify(user)],
                ['restaurant', JSON.stringify(restaurant)],
            ]);

            dispatch(loginSuccess({ user, restaurant, accessToken, refreshToken }));

        } catch (error: any) {
            console.error('Login error:', error);
            let message = 'Invalid email or password';
            if (error.response?.data?.message) {
                const backendMessage = error.response.data.message;
                message = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
            }
            Alert.alert('Login Failed', message);
        } finally {
            setLoadingState(false);
            dispatch(setLoading(false));
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={[colors.background.primary, colors.background.secondary]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>🍽️</Text>
                    <Text style={styles.title}>TabletTap</Text>
                    <Text style={styles.subtitle}>Restaurant Order Management</Text>
                </View>

                <GlassView style={styles.formCard} intensity={25}>
                    <Text style={styles.cardTitle}>Welcome Back</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="name@restaurant.com"
                            placeholderTextColor={colors.text.secondary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                            selectionColor={colors.accent.primary}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={colors.text.secondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                            selectionColor={colors.accent.primary}
                        />
                    </View>

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                    />

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Register')}
                        disabled={loading}
                    >
                        <Text style={styles.linkText}>New here? <Text style={styles.linkHighlight}>Create an Account</Text></Text>
                    </TouchableOpacity>
                </GlassView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    title: {
        ...typography.h1,
        fontSize: 42,
        color: '#fff',
        textShadowColor: 'rgba(56, 189, 248, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    subtitle: {
        ...typography.body,
        color: colors.text.secondary,
        marginTop: 5,
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
    },
    cardTitle: {
        ...typography.h2,
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        ...typography.label,
        color: colors.text.secondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 20,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    loginButton: {
        marginTop: 10,
        marginBottom: 20,
    },
    linkButton: {
        alignItems: 'center',
    },
    linkText: {
        ...typography.body,
        color: colors.text.secondary,
        fontSize: 14,
    },
    linkHighlight: {
        color: colors.accent.primary,
        fontWeight: 'bold',
    },
});
