import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
    clearCurrentOrder,
    removeFromCurrentOrder,
    updateOrderQuantity,
} from '../store/slices/ordersSlice';
import { clearSelectedTable, updateTableStatus } from '../store/slices/tablesSlice';
import api from '../services/api';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';
import { Button } from '../components/Button';

export default function OrderReviewScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { currentOrder } = useAppSelector(state => state.orders);
    const { selectedTable } = useAppSelector(state => state.tables);
    const { user } = useAppSelector(state => state.auth);
    const [loading, setLoading] = useState(false);

    const calculateSubtotal = () => {
        return currentOrder.reduce((sum, item) => {
            const modifiersTotal = (item.modifiers || []).reduce((mSum, mod) => mSum + mod.price, 0);
            return sum + ((item.unitPrice + modifiersTotal) * item.quantity);
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const handleQuantityChange = (menuItemId: string, delta: number) => {
        const item = currentOrder.find(i => i.menuItemId === menuItemId);
        if (item) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) {
                dispatch(removeFromCurrentOrder(menuItemId));
            } else {
                dispatch(updateOrderQuantity({ menuItemId, quantity: newQuantity }));
            }
        }
    };

    const handleSendToKitchen = async () => {
        if (!selectedTable) {
            Alert.alert('Error', 'No table selected');
            return;
        }

        Alert.alert(
            'Confirm Order',
            `Send ${currentOrder.length} items to kitchen for Table ${selectedTable.displayName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const orderData = {
                                tableId: selectedTable._id,
                                items: currentOrder,
                            };

                            const response = await api.post('/orders', orderData);

                            dispatch(updateTableStatus({
                                tableId: selectedTable._id,
                                status: 'occupied',
                            }));

                            Alert.alert(
                                'Success!',
                                `Order #${response.data.orderNumber} sent to kitchen`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            dispatch(clearCurrentOrder());
                                            dispatch(clearSelectedTable());
                                            navigation.navigate('TableGrid');
                                        },
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error('Order error:', error);
                            let message = 'Failed to create order';
                            if (error.response?.data?.message) {
                                const backendMessage = error.response.data.message;
                                message = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage;
                            }
                            Alert.alert('Error', message);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const renderOrderItem = ({ item }: { item: typeof currentOrder[0] }) => {
        const modifiersTotal = (item.modifiers || []).reduce((sum, mod) => sum + mod.price, 0);
        const itemTotal = (item.unitPrice + modifiersTotal) * item.quantity;

        return (
            <GlassView style={styles.orderItem} intensity={20}>
                <View style={styles.itemContent}>
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemUnitPrice}>${item.unitPrice.toFixed(2)}</Text>
                    </View>

                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(item.menuItemId, -1)}
                        >
                            <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantity}>{item.quantity}</Text>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(item.menuItemId, 1)}
                        >
                            <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.itemTotal}>${itemTotal.toFixed(2)}</Text>
                </View>

                {item.modifiers && item.modifiers.length > 0 && (
                    <Text style={styles.modifiers}>
                        {item.modifiers.map(m => `${m.name}: ${m.option}`).join(', ')}
                    </Text>
                )}
            </GlassView>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.background.primary, colors.background.secondary]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Order</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <GlassView style={styles.tableInfoCard} intensity={10}>
                    <Text style={styles.tableLabel}>TABLE</Text>
                    <Text style={styles.tableName}>
                        {selectedTable?.displayName || selectedTable?.name}
                    </Text>
                    <View style={styles.waiterRow}>
                        <Text style={styles.waiterLabel}>Server:</Text>
                        <Text style={styles.waiterName}>{user?.nickname}</Text>
                    </View>
                </GlassView>

                <View style={styles.listContainer}>
                    {currentOrder.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📝</Text>
                            <Text style={styles.emptyText}>Order is empty</Text>
                        </View>
                    ) : (
                        currentOrder.map(item => (
                            <View key={item.menuItemId}>
                                {renderOrderItem({ item })}
                            </View>
                        ))
                    )}
                </View>

                {currentOrder.length > 0 && (
                    <GlassView style={styles.summaryCard} intensity={15}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax (10%)</Text>
                            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                        </View>
                    </GlassView>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Send to Kitchen"
                    onPress={handleSendToKitchen}
                    loading={loading}
                    disabled={currentOrder.length === 0}
                    icon="🍳"
                    style={styles.sendButton}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    tableInfoCard: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    tableLabel: {
        ...typography.label,
        color: colors.text.secondary,
        marginBottom: 5,
    },
    tableName: {
        ...typography.h1,
        fontSize: 40,
        color: colors.text.primary,
        marginBottom: 10,
    },
    waiterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    waiterLabel: {
        ...typography.caption,
        marginRight: 5,
    },
    waiterName: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    listContainer: {
        marginBottom: 20,
    },
    orderItem: {
        marginBottom: 10,
        padding: 15,
        borderRadius: 16,
    },
    itemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        ...typography.h3,
        fontSize: 16,
        color: colors.text.primary,
        marginBottom: 4,
    },
    itemUnitPrice: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: 4,
    },
    quantityButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    quantityButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    quantity: {
        color: '#fff',
        fontWeight: 'bold',
        marginHorizontal: 12,
        fontSize: 16,
    },
    itemTotal: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.accent.success,
        width: 70,
        textAlign: 'right',
    },
    modifiers: {
        ...typography.caption,
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    summaryCard: {
        padding: 20,
        borderRadius: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        ...typography.body,
        color: colors.text.secondary,
    },
    summaryValue: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
    },
    totalLabel: {
        ...typography.h2,
        fontSize: 20,
    },
    totalValue: {
        ...typography.h2,
        fontSize: 24,
        color: colors.accent.success,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 30,
        backgroundColor: colors.background.primary, // Opaque background for footer
    },
    sendButton: {
        width: '100%',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    emptyText: {
        color: colors.text.secondary,
        fontSize: 16,
    }
});
