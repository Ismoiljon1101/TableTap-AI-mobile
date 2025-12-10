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
    ScrollView
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

export default function RegisterScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [role, setRole] = useState<'owner' | 'waiter'>('waiter');
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantId, setRestaurantId] = useState('');
    const [loading, setLoadingState] = useState(false);

    const dispatch = useAppDispatch();

    const handleRegister = async () => {
        if (!email || !password || !nickname) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (role === 'owner' && !restaurantName) {
            Alert.alert('Error', 'Restaurant name is required for owners');
            return;
        }

        if (role === 'waiter' && !restaurantId) {
            Alert.alert('Error', 'Restaurant ID is required for waiters');
            return;
        }

        setLoadingState(true);
        dispatch(setLoading(true));

        try {
            const registerData: any = {
                email: email.trim().toLowerCase(),
                password,
                nickname,
                role,
            };

            if (role === 'owner') {
                registerData.restaurantName = restaurantName;
            } else {
                registerData.restaurantId = restaurantId;
            }

            const response = await api.post<AuthResponse>('/auth/register', registerData);
            const { user, restaurant, accessToken, refreshToken } = response.data;

            await AsyncStorage.multiSet([
                ['accessToken', accessToken],
                ['refreshToken', refreshToken],
                ['user', JSON.stringify(user)],
                ['restaurant', JSON.stringify(restaurant)],
            ]);

            dispatch(loginSuccess({ user, restaurant, accessToken, refreshToken }));

            if (role === 'owner') {
                Alert.alert(
                    'Success!',
                    `Restaurant "${restaurant.name}" created!\n\n📋 Restaurant ID: ${restaurant._id}\n\nShare this ID with your waiters so they can register.`,
                    [{ text: 'Got it!', style: 'default' }]
                );
            } else {
                Alert.alert('Success!', 'Account created! You can now start taking orders.');
            }
        } catch (error: any) {
            console.error('Register error:', error);
            let message = 'Registration failed';
            if (error.response?.data?.message) {
                const backendMessage = error.response.data.message;
                message = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
            }
            Alert.alert('Registration Failed', message);
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

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Account</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={{ flex: 1, marginRight: 10 }}
                        onPress={() => setRole('owner')}
                        activeOpacity={0.8}
                    >
                        <GlassView
                            style={styles.roleCard}
                            intensity={role === 'owner' ? 30 : 10}
                            gradient={role === 'owner' ? colors.gradients.primary : undefined}
                        >
                            <Text style={styles.roleEmoji}>👨‍💼</Text>
                            <Text style={[styles.roleLabel, role === 'owner' && styles.roleLabelActive]}>Owner</Text>
                        </GlassView>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flex: 1, marginLeft: 10 }}
                        onPress={() => setRole('waiter')}
                        activeOpacity={0.8}
                    >
                        <GlassView
                            style={styles.roleCard}
                            intensity={role === 'waiter' ? 30 : 10}
                            gradient={role === 'waiter' ? colors.gradients.primary : undefined}
                        >
                            <Text style={styles.roleEmoji}>🧑‍🍳</Text>
                            <Text style={[styles.roleLabel, role === 'waiter' && styles.roleLabelActive]}>Waiter</Text>
                        </GlassView>
                    </TouchableOpacity>
                </View>

                <GlassView style={styles.formCard} intensity={25}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor={colors.text.secondary}
                            value={nickname}
                            onChangeText={setNickname}
                            selectionColor={colors.accent.primary}
                        />
                    </View>

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
                            selectionColor={colors.accent.primary}
                        />
                    </View>

                    {role === 'owner' ? (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Restaurant Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="My Awesome Bistro"
                                    placeholderTextColor={colors.text.secondary}
                                    value={restaurantName}
                                    onChangeText={setRestaurantName}
                                    selectionColor={colors.accent.primary}
                                />
                            </View>
                            <Text style={styles.helpText}>
                                💡 Use the ⚙️ button later to add tables & menu
                            </Text>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Restaurant ID</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Paste ID from Owner"
                                    placeholderTextColor={colors.text.secondary}
                                    value={restaurantId}
                                    onChangeText={setRestaurantId}
                                    selectionColor={colors.accent.primary}
                                />
                            </View>
                            <Text style={styles.helpText}>
                                💡 Ask your manager for the Restaurant ID
                            </Text>
                        </>
                    )}

                    <Button
                        title={role === 'owner' ? "Register Restaurant" : "Apply as Waiter"}
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.registerButton}
                    />
                </GlassView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
        marginTop: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginTop: -2,
    },
    title: {
        ...typography.h2,
        color: '#fff',
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    roleCard: {
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    roleEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    roleLabel: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    roleLabelActive: {
        color: '#fff',
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
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
    helpText: {
        ...typography.caption,
        color: colors.accent.primary,
        marginBottom: 20,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    registerButton: {
        marginTop: 10,
    },
});
