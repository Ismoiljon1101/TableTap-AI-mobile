import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loginSuccess, logout } from '../store/slices/authSlice';
import api from '../services/api';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';
import { Button } from '../components/Button';

export default function AccountSettingsScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);

    const [nickname, setNickname] = useState(user?.nickname || '');
    const [loading, setLoading] = useState(false);

    const handleUpdateProfile = async () => {
        if (!nickname.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const response = await api.patch(`/users/${user?._id}`, { nickname });

            // Update local storage
            const updatedUser = { ...user, nickname };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            // Update Redux
            const currentAuth = await AsyncStorage.multiGet(['accessToken', 'refreshToken', 'restaurant']);
            dispatch(loginSuccess({
                user: updatedUser as any,
                restaurant: currentAuth[2][1] ? JSON.parse(currentAuth[2][1]) : {},
                accessToken: currentAuth[0][1] || '',
                refreshToken: currentAuth[1][1] || '',
            }));

            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you absolutely sure? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.delete(`/users/${user?._id}`);
                            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'restaurant']);
                            dispatch(logout());
                            Alert.alert('Account Deleted', 'Your account has been permanently deleted');
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.background.primary, colors.background.secondary]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <GlassView style={styles.section} intensity={20}>
                        <Text style={styles.sectionTitle}>Profile Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.readonlyInput}>
                                <Text style={styles.readonlyText}>{user?.email}</Text>
                                <Text style={styles.lockIcon}>🔒</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Display Name</Text>
                            <TextInput
                                style={styles.input}
                                value={nickname}
                                onChangeText={setNickname}
                                placeholder="Your name"
                                placeholderTextColor={colors.text.secondary}
                                editable={!loading}
                                selectionColor={colors.accent.primary}
                            />
                        </View>

                        <Button
                            title="Save Changes"
                            onPress={handleUpdateProfile}
                            loading={loading}
                            style={styles.saveButton}
                        />
                    </GlassView>

                    <GlassView style={styles.section} intensity={20}>
                        <Text style={styles.sectionTitle}>Role & Access</Text>
                        <View style={styles.roleContainer}>
                            <Text style={styles.roleEmoji}>
                                {user?.role === 'owner' ? '👨‍💼' : '🧑‍🍳'}
                            </Text>
                            <View>
                                <Text style={styles.roleTitle}>
                                    {user?.role === 'owner' ? 'Owner Account' : 'Waiter Account'}
                                </Text>
                                <Text style={styles.roleDescription}>
                                    {user?.role === 'owner'
                                        ? 'Full access to menu, tables, and staff.'
                                        : 'Access to ordering and table management.'}
                                </Text>
                            </View>
                        </View>
                    </GlassView>

                    <GlassView style={StyleSheet.flatten([styles.section, styles.dangerZone])} intensity={10}>
                        <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
                        <Text style={styles.dangerDescription}>
                            Permanently delete your account and all associated data.
                        </Text>
                        <Button
                            title="Delete Account"
                            onPress={handleDeleteAccount}
                            loading={loading}
                            variant="danger"
                            style={styles.deleteButton}
                        />
                    </GlassView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
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
        color: colors.text.primary,
        fontWeight: 'bold',
        marginTop: -2,
    },
    headerTitle: {
        ...typography.h2,
        fontSize: 20,
    },
    content: {
        padding: 20,
    },
    section: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text.primary,
        marginBottom: 20,
    },
    inputGroup: {
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
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 15,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    readonlyInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    readonlyText: {
        color: colors.text.secondary,
        fontSize: 16,
    },
    lockIcon: {
        fontSize: 14,
        opacity: 0.5,
    },
    saveButton: {
        marginTop: 10,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 12,
    },
    roleEmoji: {
        fontSize: 32,
        marginRight: 15,
    },
    roleTitle: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 4,
    },
    roleDescription: {
        ...typography.caption,
        color: colors.text.secondary,
        maxWidth: 220,
    },
    dangerZone: {
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    dangerTitle: {
        ...typography.h3,
        color: colors.accent.error,
        marginBottom: 10,
    },
    dangerDescription: {
        ...typography.body,
        color: colors.text.secondary,
        marginBottom: 20,
    },
    deleteButton: {
        width: '100%',
    },
});
