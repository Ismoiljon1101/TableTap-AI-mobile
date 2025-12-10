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
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';
import { Button } from '../components/Button';



import { Category } from '../types';

export default function MenuManagementScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isPopular, setIsPopular] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

    // Fetch existing categories on mount
    React.useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);

            // Auto select first if available
            if (response.data.length > 0 && !selectedCategoryId) {
                setSelectedCategoryId(response.data[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleCreateMenuItem = async () => {
        if (!name || !price) {
            Alert.alert('Error', 'Please fill in name and price');
            return;
        }

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            Alert.alert('Error', 'Please enter a valid price');
            return;
        }

        setLoading(true);
        try {
            let finalCategoryId = selectedCategoryId;

            // If creating a new category
            if (showNewCategoryInput && newCategoryName.trim()) {
                // Check if already exists locally
                const existing = categories.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase());
                if (existing) {
                    finalCategoryId = existing._id;
                } else {
                    // Create it
                    const catRes = await api.post('/categories', { name: newCategoryName.trim() });
                    const newCat = catRes.data;
                    setCategories(prev => [...prev, newCat]);
                    finalCategoryId = newCat._id;
                }
            } else if (!finalCategoryId) {
                Alert.alert('Error', 'Please select or create a category');
                setLoading(false);
                return;
            }

            await api.post('/menu', {
                name,
                price: priceNum,
                category: finalCategoryId, // Send ID
                isAvailable: true,
                isPopular,
            });

            // Reset certain fields
            setName('');
            setPrice('');
            setIsPopular(false);
            setNewCategoryName('');
            setShowNewCategoryInput(false);
            setSelectedCategoryId(finalCategoryId); // Keep selection on the (new) category

            Alert.alert('Success', 'Menu item created!', [
                { text: 'Add Another', onPress: () => { } },
                { text: 'Done', onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create menu item');
        } finally {
            setLoading(false);
        }
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
                    <Text style={styles.headerTitle}>Add Menu Items</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <GlassView style={styles.section} intensity={20}>
                        <Text style={styles.sectionTitle}>New Item Details</Text>

                        <Text style={styles.label}>Item Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Truffle Burger"
                            placeholderTextColor={colors.text.secondary}
                            value={name}
                            onChangeText={setName}
                            editable={!loading}
                        />

                        <Text style={styles.label}>Price ($) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 18.50"
                            placeholderTextColor={colors.text.secondary}
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="decimal-pad"
                            editable={!loading}
                        />

                        <Text style={styles.label}>Category *</Text>

                        {/* Category Selector */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat._id}
                                    style={[
                                        styles.categoryChip,
                                        selectedCategoryId === cat._id && !showNewCategoryInput && styles.categoryChipActive
                                    ]}
                                    onPress={() => {
                                        setSelectedCategoryId(cat._id);
                                        setShowNewCategoryInput(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.categoryChipText,
                                        selectedCategoryId === cat._id && !showNewCategoryInput && styles.categoryChipTextActive
                                    ]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    styles.addCategoryChip,
                                    showNewCategoryInput && styles.categoryChipActive
                                ]}
                                onPress={() => setShowNewCategoryInput(true)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    showNewCategoryInput && styles.categoryChipTextActive
                                ]}>
                                    + New
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* New Category Input */}
                        {showNewCategoryInput && (
                            <View style={styles.newCategoryContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter new category name..."
                                    placeholderTextColor={colors.text.secondary}
                                    value={newCategoryName}
                                    onChangeText={setNewCategoryName}
                                    autoFocus
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setIsPopular(!isPopular)}
                            disabled={loading}
                        >
                            <View style={[styles.checkbox, isPopular && styles.checkboxActive]}>
                                {isPopular && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.checkboxLabel}>⭐ Mark as Popular</Text>
                        </TouchableOpacity>

                        <Button
                            title="Create Menu Item"
                            onPress={handleCreateMenuItem}
                            loading={loading}
                            style={styles.createButton}
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
        marginBottom: 5,
    },
    sectionDescription: {
        ...typography.caption,
        color: colors.text.secondary,
        marginBottom: 15,
    },
    quickButton: {
        marginTop: 5,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerText: {
        marginHorizontal: 15,
        color: colors.text.secondary,
        fontWeight: 'bold',
        fontSize: 12,
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
        marginBottom: 15,
    },
    categoryScroll: {
        marginBottom: 20,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    addCategoryChip: {
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    categoryChipActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderColor: colors.accent.primary,
        borderWidth: 1,
    },
    categoryChipText: {
        color: colors.text.secondary,
        fontWeight: '600',
        fontSize: 14,
    },
    categoryChipTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    newCategoryContainer: {
        marginBottom: 10,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingLeft: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.text.secondary,
        backgroundColor: 'transparent',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 16,
        color: colors.text.primary,
    },
    createButton: {
        marginTop: 5,
    },
});
