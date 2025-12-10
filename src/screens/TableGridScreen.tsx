import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Alert,
    ActivityIndicator,
    ImageBackground,
    Dimensions,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setTables, selectTable, setLoading } from '../store/slices/tablesSlice';
import { clearCurrentOrder } from '../store/slices/ordersSlice';
import { logout } from '../store/slices/authSlice';
import api from '../services/api';
import { Table } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';
import { GridBackground } from '../components/GridBackground';
import { TABLE_UNIT_SIZE } from '../constants/layout';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 15;
const ITEM_WIDTH = (width - (GAP * 3)) / COLUMN_COUNT;

export default function TableGridScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { user, restaurant } = useAppSelector(state => state.auth);
    const { tables, isLoading } = useAppSelector(state => state.tables);
    const [refreshing, setRefreshing] = useState(false);
    // Initialize with first available section if possible, otherwise null
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const isOwner = user?.role === 'owner';

    const [sectionsList, setSectionsList] = useState<{ _id: string, name: string }[]>([]);

    // Fetch Sections explicitly
    useEffect(() => {
        const loadSections = async () => {
            try {
                const res = await api.get('/sections');
                setSectionsList(res.data);
            } catch (e) {
                console.log('Failed to load sections', e);
            }
        };
        loadSections();
    }, []);

    // Get unique sections from tables  
    const sections = React.useMemo(() => {
        const unique = new Map<string, string>(); // Map ID -> Name

        // Helper to find name by ID
        const getSectionName = (id: string) => {
            const found = sectionsList.find(s => s._id === id);
            return found ? found.name : 'Unknown Section';
        };

        tables.forEach(t => {
            if (t.section && typeof t.section === 'object' && (t.section as any).name) {
                // Already populated (legacy case or if populate worked)
                unique.set((t.section as any)._id, (t.section as any).name);
            } else if (typeof t.section === 'string') {
                // Check if it's an ObjectID (length 24 hex)
                // If it is, look it up in sectionsList
                // If not (e.g. "Main"), treat as name
                if (t.section.match(/^[0-9a-fA-F]{24}$/)) {
                    unique.set(t.section, getSectionName(t.section));
                } else {
                    unique.set(t.section, t.section);
                }
            } else {
                // Undefined/Null -> 'Main'
                unique.set('main', 'Main');
            }
        });

        const result: { id: string, name: string }[] = [];
        unique.forEach((name, id) => {
            result.push({ id, name });
        });
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [tables, sectionsList]);

    // Set default section on load if none selected
    useEffect(() => {
        if (!selectedSectionId && sections.length > 0) {
            setSelectedSectionId(sections[0].id);
        }
    }, [sections, selectedSectionId]);

    // Filter tables by selected section
    const displayTables = React.useMemo(() => {
        if (!selectedSectionId) return [];
        return tables.filter(t => {
            const tSec = t.section;
            let tSecId = 'main';

            if (tSec && typeof tSec === 'object') tSecId = tSec._id;
            else if (typeof tSec === 'string') tSecId = tSec;

            return tSecId === selectedSectionId;
        });
    }, [tables, selectedSectionId]);

    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        try {
            dispatch(setLoading(true));
            const response = await api.get<Table[]>('/tables');
            console.log('DEBUG: LoadTables Response:', JSON.stringify(response.data, null, 2));
            dispatch(setTables(response.data));
        } catch (error: any) {
            console.error('Error loading tables:', error);
            Alert.alert('Error', 'Failed to load tables');
        } finally {
            dispatch(setLoading(false));
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTables();
        setRefreshing(false);
    };

    const handleTablePress = (table: Table) => {
        dispatch(clearCurrentOrder());
        dispatch(selectTable(table));
        navigation.navigate('MenuSelection');
    };

    const getStatusColor = (status: Table['status']) => {
        switch (status) {
            case 'available': return colors.accent.success;
            case 'occupied': return colors.accent.error;
            case 'reserved': return colors.accent.warning;
            default: return colors.text.secondary;
        }
    };

    const renderTable = ({ item }: { item: Table }) => (
        <TouchableOpacity
            onPress={() => handleTablePress(item)}
            activeOpacity={0.8}
            style={{ width: ITEM_WIDTH, marginBottom: GAP }}
        >
            <GlassView style={styles.tableCard} intensity={item.status === 'available' ? 30 : 15}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />

                <Text style={styles.tableName} numberOfLines={1}>
                    {item.displayName || item.name}
                </Text>

                <View style={styles.tableRef}>
                    <Text style={styles.capacityText}>👥 {item.capacity} Seats</Text>
                </View>

                <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </GlassView>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <GlassView style={styles.header} intensity={80}>
            <View style={styles.headerTop}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('RestaurantInfo')}
                >
                    <Text style={styles.iconText}>☰</Text>
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.restaurantName}>{restaurant?.name}</Text>
                    <Text style={styles.welcomeText}>Hello, {user?.nickname}</Text>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.iconButton, styles.ml2]}
                        onPress={() => navigation.navigate('OrderHistory')}
                    >
                        <Text style={styles.iconText}>📋</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </GlassView>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.background.primary, colors.background.secondary]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {renderHeader()}

                {tables.length > 0 && sections.length > 0 && (
                    <View style={styles.sectionTabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionsFilterScroll}>
                            {sections.map(sec => (
                                <TouchableOpacity
                                    key={sec.id}
                                    style={[
                                        styles.sectionTabButton,
                                        selectedSectionId === sec.id && styles.sectionTabButtonActive,
                                    ]}
                                    onPress={() => setSelectedSectionId(sec.id)}
                                >
                                    <Text
                                        style={[
                                            styles.sectionTabText,
                                            selectedSectionId === sec.id && styles.sectionTabTextActive,
                                        ]}
                                    >
                                        {sec.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Floor Plan View */}
                {tables.length > 0 && tables.some(t => (t.position?.x || 0) > 0 || (t.position?.y || 0) > 0) ? (
                    <View style={styles.floorPlanContainer}>
                        <ScrollView
                            horizontal
                            contentContainerStyle={{ width: width - 30 }}
                            showsHorizontalScrollIndicator={false}
                        >
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ minHeight: '100%' }}>
                                <GridBackground width={width - 30} height={1000} step={20} />
                                {displayTables.map((item) => {
                                    const units = Math.max(1, Math.ceil((item.capacity || 2) / 2));
                                    const baseWidth = units * TABLE_UNIT_SIZE;
                                    const baseHeight = TABLE_UNIT_SIZE;

                                    // Rotation Logic: SWAP dimensions if Vertical
                                    const rotation = item.rotation || 0;
                                    const isVertical = Math.abs(rotation % 180) > 45;

                                    const tableWidth = isVertical ? baseHeight : baseWidth;
                                    const tableHeight = isVertical ? baseWidth : baseHeight;

                                    const left = (item.position?.x || 0);
                                    const top = (item.position?.y || 0);

                                    return (
                                        <TouchableOpacity
                                            key={item._id}
                                            onPress={() => handleTablePress(item)}
                                            style={[
                                                styles.absoluteTable,
                                                {
                                                    left,
                                                    top,
                                                    width: tableWidth,
                                                    height: tableHeight,
                                                    // No transform rotate needed because we swapped w/h
                                                    zIndex: 1,
                                                }
                                            ]}
                                        >
                                            <View style={[
                                                styles.tableShape,
                                                {
                                                    backgroundColor: getStatusColor(item.status),
                                                    opacity: item.status === 'available' ? 1 : 0.8
                                                }
                                            ]}>
                                                <Text style={styles.absoluteTableName} numberOfLines={1}>{item.displayName || item.name}</Text>
                                                <View style={styles.capacityBadge}>
                                                    <Text style={styles.absoluteCapacity}>👥 {item.capacity}</Text>
                                                </View>
                                                <View style={[styles.orientationMarker, { height: '80%', width: 2, backgroundColor: 'rgba(255,255,255,0.2)', position: 'absolute', right: 5 }]} />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </ScrollView>
                    </View>
                ) : (
                    /* Default Grid View for Legacy/Unset Tables */
                    isLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.accent.primary} />
                            <Text style={styles.loadingText}>Loading tables...</Text>
                        </View>
                    ) : displayTables.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>
                                {tables.length === 0
                                    ? "No tables found. Add some in Management."
                                    : "No tables in this section."}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayTables}
                            renderItem={renderTable}
                            keyExtractor={(item) => item._id}
                            numColumns={2}
                            columnWrapperStyle={styles.columnWrapper}
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
                                    <Text style={styles.emptyIcon}>🍽️</Text>
                                    <Text style={styles.emptyTitle}>No Tables Found</Text>
                                    <Text style={styles.emptyText}>
                                        {isOwner ? 'Add tables in Management settings' : 'Ask your manager to setup tables'}
                                    </Text>
                                </View>
                            }
                        />
                    )
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
        marginTop: 10,
        marginBottom: 20,
        marginHorizontal: 15,
        borderRadius: 20,
        padding: 15,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    restaurantName: {
        ...typography.h3,
        color: colors.text.primary,
    },
    welcomeText: {
        ...typography.caption,
        color: colors.text.accent,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    iconText: {
        fontSize: 18,
    },
    headerActions: {
        flexDirection: 'row',
    },
    ml2: {
        marginLeft: 8,
    },
    listContent: {
        paddingHorizontal: GAP,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    tableCard: {
        borderRadius: 24,
        padding: 20,
        height: 160,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        position: 'absolute',
        top: 15,
        right: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5,
    },
    tableName: {
        ...typography.h1,
        fontSize: 36,
        color: colors.text.primary,
        marginTop: 10,
    },
    tableRef: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    capacityText: {
        ...typography.caption,
        color: colors.text.secondary,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        overflow: 'hidden',
    },
    statusBadge: {
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    statusText: {
        ...typography.label,
        fontSize: 10,
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
        padding: 20,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyTitle: {
        ...typography.h2,
        marginBottom: 10,
        color: colors.text.secondary,
    },
    emptyText: {
        ...typography.body,
        textAlign: 'center',
        color: colors.text.secondary,
        opacity: 0.7,
    },
    floorPlanContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    absoluteTable: {
        position: 'absolute',
    },
    tableShape: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        padding: 4,
    },
    absoluteTableName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2,
        textAlign: 'center',
    },
    absoluteCapacity: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 10,
        fontWeight: '600',
    },
    capacityBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    orientationMarker: {
        // Just a detail
    },
    sectionTabsContainer: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    sectionsFilterScroll: {
        gap: 8,
    },
    sectionTabButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sectionTabButtonActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderColor: colors.accent.primary,
        borderWidth: 2,
    },
    sectionTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    sectionTabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
