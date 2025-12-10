import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';
import { Button } from '../components/Button';

export default function RestaurantInfoScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { user, restaurant } = useAppSelector(state => state.auth);
    const isOwner = user?.role === 'owner';

    const handleCopyId = async () => {
        if (restaurant?._id) {
            await Clipboard.setStringAsync(restaurant._id);
            Alert.alert('Copied!', 'Restaurant ID copied to clipboard');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'restaurant']);
                        dispatch(logout());
                    },
                },
            ]
        );
    };

    const menuItems = [
        ...(isOwner ? [
            {
                icon: '🪑',
                title: 'Manage Tables',
                subtitle: 'Layout & Status',
                screen: 'TableManagement',
                gradient: colors.gradients.success,
            },
            {
                icon: '🍽️',
                title: 'Manage Menu',
                subtitle: 'Products & Prices',
                screen: 'MenuManagement',
                gradient: colors.gradients.accent,
            },
            {
                icon: '🏢',
                title: 'Restaurant Info',
                subtitle: 'View ID & Details',
                onPress: () => {
                    Alert.alert(
                        restaurant?.name || 'Restaurant',
                        `📋 ID: ${restaurant?._id}\n\nTap Copy ID below to share with waiters.`,
                        [
                            { text: 'Copy ID', onPress: handleCopyId },
                            { text: 'Close', style: 'cancel' },
                        ]
                    );
                },
                gradient: colors.gradients.primary,
            },
        ] : []),
        {
            icon: '👤',
            title: 'My Profile',
            subtitle: 'Account Settings',
            screen: 'AccountSettings',
            gradient: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
        },
        {
            icon: '📜',
            title: 'Order History',
            subtitle: 'Past Transactions',
            screen: 'OrderHistory',
            gradient: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
        },
    ];

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
                    <Text style={styles.headerTitle}>Restaurant Hub</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Profile Card */}
                    <GlassView style={styles.profileCard} intensity={25}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatarText}>
                                    {user?.nickname?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.userName}>{user?.nickname}</Text>
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleText}>
                                        {isOwner ? '👑 Owner' : '🧑‍🍳 Waiter'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.restaurantRow}>
                            <Text style={styles.restaurantLabel}>Restaurant</Text>
                            <Text style={styles.restaurantName}>{restaurant?.name}</Text>
                        </View>
                    </GlassView>

                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <View style={styles.grid}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.gridItem}
                                onPress={() => item.onPress ? item.onPress() : navigation.navigate(item.screen)}
                                activeOpacity={0.8}
                            >
                                <GlassView
                                    style={styles.menuCard}
                                    intensity={15}
                                    gradient={item.gradient as any}
                                >
                                    <Text style={styles.menuIcon}>{item.icon}</Text>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                </GlassView>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Button
                        title="Sign Out"
                        onPress={handleLogout}
                        style={styles.logoutButton}
                        variant="ghost"
                        textStyle={{ color: colors.accent.error }}
                    />
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
        paddingBottom: 40,
    },
    profileCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        ...typography.h2,
        marginBottom: 4,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        ...typography.caption,
        fontWeight: 'bold',
        color: colors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 15,
    },
    restaurantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restaurantLabel: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    restaurantName: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text.secondary,
        marginBottom: 15,
        marginLeft: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
        marginBottom: 15,
    },
    menuCard: {
        borderRadius: 20,
        padding: 15,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: {
        fontSize: 32,
        marginBottom: 10,
    },
    menuTitle: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 4,
        textAlign: 'center',
    },
    menuSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        fontSize: 11,
    },
    logoutButton: {
        marginTop: 20,
    },
});
