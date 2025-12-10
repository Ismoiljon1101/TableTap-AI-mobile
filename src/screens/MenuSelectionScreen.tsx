import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setMenuItems, setLoading as setMenuLoading } from '../store/slices/menuSlice';
import { addToCurrentOrder } from '../store/slices/ordersSlice';
import api from '../services/api';
import { MenuItem, Category } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';
import { Button } from '../components/Button';

const { width } = Dimensions.get('window');



export default function MenuSelectionScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { items: menuItems, isLoading } = useAppSelector(state => state.menu);
    const { selectedTable } = useAppSelector(state => state.tables);
    const { currentOrder } = useAppSelector(state => state.orders);
    const [categoriesData, setCategoriesData] = useState<Category[]>([]);
    const [categoryError, setCategoryError] = useState<string | null>(null);

    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        try {
            dispatch(setMenuLoading(true));
            const response = await api.get<MenuItem[]>('/menu');
            dispatch(setMenuItems(response.data));
        } catch (error) {
            console.error('Error loading menu:', error);
            Alert.alert('Error', 'Failed to load menu');
        } finally {
            dispatch(setMenuLoading(false));
        }
    };

    const loadCategories = async () => {
        try {
            setCategoryError(null);
            console.log('Fetching categories...');
            const response = await api.get<Category[]>('/categories');
            console.log('Categories fetched:', response.data.length);
            setCategoriesData(response.data);
        } catch (error) {
            console.error('Failed to load categories', error);
            setCategoryError('Failed to load categories');
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    // Dynamically derive categories from items
    const categories = React.useMemo(() => {
        const cats: { id: string; label: string; emoji: string }[] = categoriesData.map(cat => {
            const label = cat.name;
            let emoji = '🍽️';
            const lowerLabel = label.toLowerCase();
            if (lowerLabel.includes('drink') || lowerLabel.includes('beverage')) emoji = '🥤';
            else if (lowerLabel.includes('burger')) emoji = '🍔';
            else if (lowerLabel.includes('dessert') || lowerLabel.includes('sweet')) emoji = '🍰';
            else if (lowerLabel.includes('coffee')) emoji = '☕';
            else if (lowerLabel.includes('alcohol') || lowerLabel.includes('beer') || lowerLabel.includes('wine')) emoji = '🍺';
            else if (lowerLabel.includes('pizza')) emoji = '🍕';
            else if (lowerLabel.includes('salad')) emoji = '🥗';

            return { id: cat._id, label, emoji };
        });

        // Ensure we strictly return the correct structure
        const result: { id: string; label: string; emoji: string }[] = [
            { id: 'all', label: 'All', emoji: '♾️' },
            ...cats
        ];
        return result;
    }, [categoriesData]);

    const filteredItems = selectedCategory === 'all'
        ? menuItems.filter(item => item.isAvailable)
        : menuItems.filter(item => {
            if (!item.isAvailable) return false;
            // Check ID match
            const catId = typeof item.category === 'string' ? item.category : item.category._id;
            return catId === selectedCategory;
        });

    const handleAddItem = (item: MenuItem) => {
        dispatch(addToCurrentOrder({
            menuItemId: item._id,
            name: item.name,
            quantity: 1,
            unitPrice: item.price,
            modifiers: [],
        }));
    };

    const getTotalItems = () => {
        return currentOrder.reduce((sum, item) => sum + item.quantity, 0);
    };

    const getTotalPrice = () => {
        return currentOrder.reduce((sum, item) => {
            const modifiersTotal = (item.modifiers || []).reduce((mSum, mod) => mSum + mod.price, 0);
            return sum + ((item.unitPrice + modifiersTotal) * item.quantity);
        }, 0);
    };

    const renderCategory = ({ item }: { item: { id: string, label: string, emoji: string } }) => {
        const isSelected = selectedCategory === item.id;
        return (
            <TouchableOpacity
                onPress={() => setSelectedCategory(item.id)}
                activeOpacity={0.8}
                style={{ marginRight: 10 }}
            >
                <GlassView
                    style={styles.categoryPill}
                    intensity={isSelected ? 40 : 10}
                    gradient={isSelected ? colors.gradients.primary : undefined}
                >
                    <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                    <Text style={[
                        styles.categoryText,
                        isSelected && { color: '#fff', fontWeight: 'bold' }
                    ]}>
                        {item.label}
                    </Text>
                </GlassView>
            </TouchableOpacity>
        );
    };

    const renderMenuItem = ({ item }: { item: MenuItem }) => (
        <TouchableOpacity
            onPress={() => handleAddItem(item)}
            activeOpacity={0.8}
            style={styles.menuItemCardWrapper}
        >
            <GlassView style={styles.menuItemCard} intensity={20}>
                <View style={styles.menuItemContent}>
                    {item.isPopular && (
                        <View style={styles.popularBadgeLeft}>
                            <Text style={styles.popularText}>⭐</Text>
                        </View>
                    )}
                    <View style={styles.menuItemInfo}>
                        <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                    </View>
                </View>
            </GlassView>
        </TouchableOpacity>
    );

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
                <Text style={styles.headerTitle}>
                    Table {selectedTable?.displayName || selectedTable?.name}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.categoriesWrapper}>
                {categoryError ? (
                    <TouchableOpacity onPress={loadCategories} style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠ Categories failed. Tap to retry.</Text>
                    </TouchableOpacity>
                ) : (
                    <FlatList
                        horizontal
                        data={categories}
                        renderItem={renderCategory}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContent}
                    />
                )}
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                    <Text style={styles.loadingText}>Loading menu...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderMenuItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.menuList}
                    showsVerticalScrollIndicator={false}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    key={'menu-grid-2'}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🥬</Text>
                            <Text style={styles.emptyText}>No items found</Text>
                        </View>
                    }
                />
            )}

            {currentOrder.length > 0 && (
                <View style={styles.floatingCartContainer}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('OrderReview')}
                    >
                        <LinearGradient
                            colors={colors.gradients.success}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cartButton}
                        >
                            <View style={styles.cartInfo}>
                                <View style={styles.cartCountBadge}>
                                    <Text style={styles.cartCountText}>{getTotalItems()}</Text>
                                </View>
                                <Text style={styles.cartTotalText}>${getTotalPrice().toFixed(2)}</Text>
                            </View>
                            <View style={styles.cartAction}>
                                <Text style={styles.cartActionText}>View Order</Text>
                                <Text style={styles.cartArrow}>→</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
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
        paddingBottom: 15,
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
    categoriesWrapper: {
        height: 70,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    categoryEmoji: {
        fontSize: 18,
        marginRight: 8,
    },
    categoryText: {
        ...typography.label,
        color: colors.text.secondary,
        fontSize: 12,
    },
    menuList: {
        padding: 20,
        paddingBottom: 120, // Space for cart
    },
    menuItemCard: {
        borderRadius: 16,
        padding: 8,
        height: 100, // Reduced height
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    menuItemCardWrapper: {
        width: (width - 60) / 2, // 20px padding * 2 sides + 20px gap
        marginBottom: 20,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center', // Align star and text
        height: '100%',
    },
    menuItemInfo: {
        flex: 1,
        justifyContent: 'center', // Center text vertically
    },
    popularBadgeLeft: {
        marginRight: 4,
    },
    popularText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    menuItemName: {
        ...typography.h3,
        fontSize: 18,
        marginBottom: 4,
    },
    menuItemPrice: {
        ...typography.body,
        color: colors.text.accent,
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: colors.text.secondary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyIcon: {
        fontSize: 50,
        marginBottom: 10,
    },
    emptyText: {
        color: colors.text.secondary,
        fontSize: 16,
    },
    floatingCartContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    cartButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        shadowColor: colors.accent.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    cartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cartCountBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cartCountText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cartTotalText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cartAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cartActionText: {
        color: '#fff',
        fontWeight: '600',
        marginRight: 8,
    },
    cartArrow: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: colors.accent.error,
        fontWeight: 'bold',
    },
});
