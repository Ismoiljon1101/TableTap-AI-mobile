import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setOrders, setLoading } from '../store/slices/ordersSlice';
import api from '../services/api';
import { Order } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';

export default function OrderHistoryScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { orders, isLoading } = useAppSelector(state => state.orders);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            dispatch(setLoading(true));
            const response = await api.get<Order[]>('/orders/today');
            dispatch(setOrders(response.data));
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            dispatch(setLoading(false));
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'pending': return colors.accent.warning;
            case 'confirmed': return colors.accent.primary;
            case 'preparing': return '#8B5CF6'; // Violet
            case 'ready': return '#EC4899'; // Pink
            case 'served': return colors.accent.success;
            default: return colors.text.secondary;
        }
    };

    const getStatusEmoji = (status: Order['status']) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'confirmed': return '👍';
            case 'preparing': return '🍳';
            case 'ready': return '🔔';
            case 'served': return '✅';
            default: return '❓';
        }
    };

    const renderOrder = ({ item }: { item: Order }) => {
        const itemsCount = item.items.reduce((sum, i) => sum + i.quantity, 0);

        // Extract table and waiter info
        const tableName = typeof item.tableId === 'object' && item.tableId
            ? (item.tableId as any).displayName || (item.tableId as any).name
            : 'N/A';

        const waiterName = typeof item.waiterId === 'object' && item.waiterId
            ? (item.waiterId as any).nickname
            : 'N/A';

        return (
            <GlassView style={styles.orderCard} intensity={15}>
                <View style={styles.orderHeader}>
                    <View style={styles.orderIdContainer}>
                        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                        <Text style={styles.orderTime}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.status) + '30' },
                            { borderColor: getStatusColor(item.status), borderWidth: 1 }
                        ]}
                    >
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {getStatusEmoji(item.status)} {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.orderDetails}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoChip}>
                            <Text style={styles.infoIcon}>📍</Text>
                            <Text style={styles.infoText}>{tableName}</Text>
                        </View>
                        <View style={styles.infoChip}>
                            <Text style={styles.infoIcon}>👤</Text>
                            <Text style={styles.infoText}>{waiterName}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.itemsList}>
                    {item.items.slice(0, 3).map((orderItem, idx) => (
                        <Text key={idx} style={styles.itemText} numberOfLines={1}>
                            <Text style={styles.itemQty}>{orderItem.quantity}x</Text> {orderItem.name}
                        </Text>
                    ))}
                    {item.items.length > 3 && (
                        <Text style={styles.moreItems}>+ {item.items.length - 3} more items...</Text>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>${item.total.toFixed(2)}</Text>
                </View>
            </GlassView>
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
                    <Text style={styles.headerTitle}>Order History</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoading && orders.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={colors.accent.primary} />
                        <Text style={styles.loadingText}>Loading orders...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrder}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.accent.primary}
                                colors={[colors.accent.primary]}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyEmoji}>📅</Text>
                                <Text style={styles.emptyText}>No orders yet today</Text>
                                <Text style={styles.emptySubtext}>
                                    Orders will appear here after you create them
                                </Text>
                            </View>
                        }
                    />
                )}
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
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: colors.text.secondary,
        fontSize: 16,
    },
    orderCard: {
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderIdContainer: {
        flexDirection: 'column',
    },
    orderNumber: {
        ...typography.h3,
        fontSize: 18,
        color: colors.text.primary,
    },
    orderTime: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 12,
    },
    orderDetails: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 10,
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    infoIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    infoText: {
        color: colors.text.secondary,
        fontSize: 12,
        fontWeight: '600',
    },
    itemsList: {
        marginBottom: 12,
    },
    itemText: {
        color: colors.text.secondary,
        fontSize: 14,
        marginBottom: 4,
    },
    itemQty: {
        color: colors.text.primary,
        fontWeight: 'bold',
    },
    moreItems: {
        color: colors.text.accent,
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        marginTop: 5,
    },
    totalLabel: {
        color: colors.text.secondary,
        fontSize: 14,
    },
    totalAmount: {
        ...typography.h3,
        color: colors.accent.success,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyText: {
        ...typography.h3,
        color: colors.text.primary,
        marginBottom: 8,
    },
    emptySubtext: {
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
