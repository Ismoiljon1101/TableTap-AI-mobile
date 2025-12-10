import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Dimensions,
    Modal,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setTables } from '../store/slices/tablesSlice'; // Assuming we want to update local state too
import api from '../services/api';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GlassView } from '../components/GlassView';
import { Button } from '../components/Button';
import { DraggableTable } from '../components/DraggableTable';
import { GridBackground } from '../components/GridBackground';
import { Section, Table } from '../types';

const { width } = Dimensions.get('window');
// Fixed canvas size for layout editor - ensures consistency
const CANVAS_WIDTH = width - 30;
const CANVAS_HEIGHT = 500;

export default function TableManagementScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const [mode, setMode] = useState<'create' | 'layout'>('create');
    const [tableName, setTableName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [capacity, setCapacity] = useState('4');

    // Store selected section ID
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');

    const [loading, setLoading] = useState(false);

    // We need to fetch tables for the layout editor
    const [tables, setLocalTables] = useState<Table[]>([]);
    const [sections, setSections] = useState<Section[]>([]); // Fetched from API

    const [layoutChanged, setLayoutChanged] = useState(false);

    // For layout filtering
    const [filterSectionId, setFilterSectionId] = useState<string | null>(null);

    const [sectionModalVisible, setSectionModalVisible] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    // Edge Warning Logic
    const [edgeWarning, setEdgeWarning] = useState(false);
    const blinkAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (edgeWarning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(blinkAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(blinkAnim, { toValue: 0.3, duration: 300, useNativeDriver: true })
                ])
            ).start();
        } else {
            blinkAnim.stopAnimation();
            blinkAnim.setValue(0);
        }
    }, [edgeWarning]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tablesRes, sectionsRes] = await Promise.all([
                api.get('/tables'),
                api.get('/sections')
            ]);

            setLocalTables(tablesRes.data);
            setSections(sectionsRes.data);

            const fetchedSections = sectionsRes.data as Section[];
            let effectiveSections = fetchedSections;

            // COLD START: Removed forced 'Main' section.
            // if (fetchedSections.length === 0 && tablesRes.data.length === 0) {
            //     effectiveSections = [{ _id: 'Main', name: 'Main', restaurantId: 'virtual' }];
            //     setSections(effectiveSections);
            // }
            // Fallback: If no strict sections exist, but we have legacy tables with string sections,
            // derive virtual sections so users can see/edit them.
            if (fetchedSections.length === 0 && tablesRes.data.length > 0) {
                const legacyNames = Array.from(new Set(
                    tablesRes.data
                        .filter((t: Table) => typeof t.section === 'string')
                        .map((t: Table) => t.section as string)
                ));

                if (legacyNames.length > 0) {
                    const virtualSections = legacyNames.map(name => ({
                        _id: name, // Use name as ID for legacy (strings match)
                        name: name,
                        restaurantId: 'legacy'
                    }));
                    effectiveSections = virtualSections as Section[]; // Cast as Section
                    setSections(effectiveSections);
                }
            }

            if (effectiveSections.length > 0) {
                if (!selectedSectionId) setSelectedSectionId(effectiveSections[0]._id);
                if (!filterSectionId) setFilterSectionId(effectiveSections[0]._id);
            } else {
                // Truly empty
                if (!selectedSectionId) setSelectedSectionId('');
                setFilterSectionId(null);
            }
        } catch (error) {
            console.error('Failed to load data', error);
            Alert.alert('Error', 'Failed to load tables and sections');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get section name from ID or object
    const getSectionName = (sec: string | Section | undefined): string => {
        if (!sec) return 'Main'; // Default if section is undefined
        if (typeof sec === 'string') {
            // If it's an ID, try to find it in our list
            const found = sections.find(s => s._id === sec);
            return found ? found.name : 'Unknown Section';
        }
        return sec.name;
    };

    // Helper to get section ID safely
    const getSectionId = (sec: string | Section | undefined): string | undefined => {
        if (!sec) return undefined;
        if (typeof sec === 'string') return sec;
        return sec._id;
    }

    // Filter tables by selected section
    const filteredTables = filterSectionId
        ? tables.filter(t => {
            const secId = getSectionId(t.section);
            // 1. Direct match by ID
            if (secId === filterSectionId) return true;

            // 2. Legacy fallback: Match by Name if table has string section
            // Find the currently selected section object
            const activeSection = sections.find(s => s._id === filterSectionId);
            if (activeSection && typeof t.section === 'string' && t.section === activeSection.name) {
                return true;
            }

            return false;
        })
        : [];

    const handleAddSection = async () => {
        const trimmedName = newSectionName.trim();
        if (!trimmedName) {
            Alert.alert('Error', 'Please enter a section name');
            return;
        }

        // Check local duplicate based on name
        if (sections.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
            Alert.alert('Error', 'Section already exists');
            return;
        }

        try {
            const res = await api.post('/sections', { name: trimmedName });
            const newSection = res.data;

            setSections(prev => [...prev, newSection]);
            setSelectedSectionId(newSection._id); // Auto-select in form
            setFilterSectionId(newSection._id); // Auto-select in layout filter

            setNewSectionName('');
            setSectionModalVisible(false);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create section');
        }
    };

    const handleDeleteSection = async (sectionId: string, sectionName: string) => {
        // Check if used
        const used = tables.some(t => getSectionId(t.section) === sectionId);
        if (used) {
            Alert.alert('Cannot Delete', `Section "${sectionName}" contains tables. Please move or delete them first.`);
            return;
        }

        try {
            await api.delete(`/sections/${sectionId}`);
            setSections(prev => prev.filter(s => s._id !== sectionId));
            Alert.alert('Success', `Section "${sectionName}" deleted.`);

            // If we deleted the selected one, switch to another
            if (selectedSectionId === sectionId) {
                const remaining = sections.filter(s => s._id !== sectionId);
                if (remaining.length > 0) setSelectedSectionId(remaining[0]._id);
                else setSelectedSectionId(''); // No sections left
            }
            if (filterSectionId === sectionId) {
                const remaining = sections.filter(s => s._id !== sectionId);
                if (remaining.length > 0) setFilterSectionId(remaining[0]._id);
                else setFilterSectionId(null); // No sections left
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to delete section');
        }
    };



    const handleCreateTable = async () => {
        if (!tableName || !capacity || !selectedSectionId) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Capacity, Section)');
            return;
        }

        const capacityNum = parseInt(capacity, 10);
        if (isNaN(capacityNum) || capacityNum <= 0) {
            Alert.alert('Error', 'Please enter a valid capacity number');
            return;
        }

        // Check for duplicate name
        const duplicate = tables.find(t => t.name.toLowerCase() === tableName.trim().toLowerCase());
        if (duplicate) {
            Alert.alert('Error', 'A table with this name already exists. Please choose a unique name.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/tables', {
                name: tableName,
                displayName: displayName || tableName,
                capacity: capacityNum,
                section: selectedSectionId, // Include the selected section ID
            });
            Alert.alert('Success', 'Table created successfully!');
            resetForm();
            loadData(); // Reload to get everything fresh
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create table');
            setLoading(false); // Only set loading false here if we don't reload
        }
    };

    const [editingTableId, setEditingTableId] = useState<string | null>(null);

    const resetForm = () => {
        setTableName('');
        setDisplayName('');
        setCapacity('4');
        // Don't reset section, keep last selected
        setEditingTableId(null);
    };

    const handleEdit = (table: Table) => {
        setTableName(table.name);
        setDisplayName(table.displayName || '');
        setCapacity(String(table.capacity));

        const secId = getSectionId(table.section);
        if (secId) setSelectedSectionId(secId);

        setEditingTableId(table._id);
        Alert.alert('Edit Mode', `Editing ${table.displayName || table.name}`);
    };

    const handleUpdateTable = async () => {
        if (!editingTableId || !tableName || !capacity || !selectedSectionId) return;

        setLoading(true);
        try {
            await api.put(`/tables/${editingTableId}`, {
                name: tableName,
                displayName: displayName || tableName,
                capacity: parseInt(capacity),
                section: selectedSectionId
            });
            Alert.alert('Success', 'Table updated');
            resetForm();
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to update table');
            setLoading(false);
        }
    };

    const handleDelete = (table: Table) => {
        Alert.alert(
            'Delete Table',
            `Are you sure you want to delete ${table.displayName || table.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.delete(`/tables/${table._id}`);
                            loadData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete table');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDragEnd = (id: string, x: number, y: number) => {
        setLocalTables(prev => prev.map(t =>
            t._id === id ? { ...t, position: { x, y } } : t
        ));
        setLayoutChanged(true);
    };

    const handleRotate = (id: string, newRotation: number) => {
        setLocalTables(prev => prev.map(t =>
            t._id === id ? { ...t, rotation: newRotation } : t
        ));
        setLayoutChanged(true);
    }

    const saveLayout = async () => {
        setLoading(true);
        try {
            await Promise.all(tables.map(t =>
                api.put(`/tables/${t._id}`, {
                    position: t.position || { x: 0, y: 0 },
                    rotation: t.rotation || 0
                })
            ));

            Alert.alert('Success', 'Floor plan saved!');
            setLayoutChanged(false);
            dispatch(setTables(tables));
        } catch (error) {
            Alert.alert('Error', 'Failed to save layout');
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
                    <Text style={styles.headerTitle}>Manage Tables</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Mode Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, mode === 'create' && styles.toggleActive]}
                        onPress={() => setMode('create')}
                    >
                        <Text style={[styles.toggleText, mode === 'create' && styles.toggleTextActive]}>Create Tables</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, mode === 'layout' && styles.toggleActive]}
                        onPress={() => setMode('layout')}
                    >
                        <Text style={[styles.toggleText, mode === 'layout' && styles.toggleTextActive]}>Edit Layout</Text>
                    </TouchableOpacity>
                </View>

                {mode === 'create' ? (
                    <ScrollView contentContainerStyle={styles.content}>
                        <GlassView style={styles.section} intensity={20}>
                            <Text style={styles.sectionTitle}>Add New Table</Text>

                            <Text style={styles.label}>Table Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., A1, Patio1"
                                placeholderTextColor={colors.text.secondary}
                                value={tableName}
                                onChangeText={setTableName}
                                editable={!loading}
                            />

                            <Text style={styles.label}>Display Name (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Table A1"
                                placeholderTextColor={colors.text.secondary}
                                value={displayName}
                                onChangeText={setDisplayName}
                                editable={!loading}
                            />

                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>Section / Room *</Text>
                                <TouchableOpacity
                                    style={styles.manageSectionsBtn}
                                    onPress={() => setSectionModalVisible(true)}
                                >
                                    <Text style={styles.manageSectionsBtnText}>+ Manage Sections</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.sectionRow}
                            >
                                {sections.length === 0 && (
                                    <Text style={{ color: colors.text.secondary, fontStyle: 'italic', marginLeft: 5 }}>
                                        No sections. Create one first!
                                    </Text>
                                )}
                                {sections.map(sec => (
                                    <TouchableOpacity
                                        key={sec._id}
                                        style={[
                                            styles.sectionButton,
                                            selectedSectionId === sec._id && styles.sectionButtonActive,
                                        ]}
                                        onPress={() => setSelectedSectionId(sec._id)}
                                        disabled={loading}
                                    >
                                        <Text
                                            style={[
                                                styles.sectionText,
                                                selectedSectionId === sec._id && styles.sectionTextActive,
                                            ]}
                                        >
                                            {sec.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>Seating Capacity *</Text>
                            <View style={styles.capacityRow}>
                                {[2, 4, 6, 8].map(num => (
                                    <TouchableOpacity
                                        key={num}
                                        style={[
                                            styles.capacityButton,
                                            capacity === String(num) && styles.capacityButtonActive,
                                        ]}
                                        onPress={() => setCapacity(String(num))}
                                        disabled={loading}
                                    >
                                        <LinearGradient
                                            colors={capacity === String(num) ? colors.gradients.primary : ['transparent', 'transparent']}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Text
                                            style={[
                                                styles.capacityText,
                                                capacity === String(num) && styles.capacityTextActive,
                                            ]}
                                        >
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={[styles.input, styles.capacityInput]}
                                placeholder="Or enter custom capacity..."
                                placeholderTextColor={colors.text.secondary}
                                value={capacity}
                                onChangeText={setCapacity}
                                keyboardType="number-pad"
                                editable={!loading}
                            />

                            <View style={styles.formActions}>
                                {editingTableId ? (
                                    <>
                                        <Button
                                            title="Update Table"
                                            onPress={handleUpdateTable}
                                            loading={loading}
                                            style={styles.actionButton}
                                        />
                                        <Button
                                            title="Cancel"
                                            onPress={resetForm}
                                            variant="secondary"
                                            style={styles.actionButton}
                                        />
                                    </>
                                ) : (
                                    <Button
                                        title="Create Table"
                                        onPress={handleCreateTable}
                                        loading={loading}
                                        style={styles.actionButton}
                                    />
                                )}
                            </View>
                        </GlassView>

                        {/* Existing Tables List */}
                        <GlassView style={styles.section} intensity={20}>
                            <Text style={styles.sectionTitle}>📋 Existing Tables</Text>
                            {tables.map(table => (
                                <View key={table._id} style={styles.tableListItem}>
                                    <View style={styles.tableInfo}>
                                        <Text style={styles.listItemName}>{table.displayName || table.name}</Text>
                                        <Text style={styles.listItemDetails}>
                                            {getSectionName(table.section)} • 👥 {table.capacity}
                                        </Text>
                                    </View>
                                    <View style={styles.listActions}>
                                        <TouchableOpacity
                                            style={[styles.listBtn, styles.editBtn]}
                                            onPress={() => handleEdit(table)}
                                        >
                                            <Text style={styles.btnText}>✏️</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.listBtn, styles.deleteBtn]}
                                            onPress={() => handleDelete(table)}
                                        >
                                            <Text style={styles.btnText}>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </GlassView>
                    </ScrollView>
                ) : (
                    <View style={styles.layoutContainer}>
                        <View style={styles.layoutHeader}>
                            <Text style={styles.layoutInstructions}>Drag to move. Double-tap to rotate.</Text>
                            {layoutChanged && (
                                <Text style={styles.unsavedChanges}>Unsaved changes</Text>
                            )}
                        </View>

                        {/* Section Filter */}
                        <View style={styles.sectionFilterContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionFilterScroll}>
                                {sections.map(sec => (
                                    <TouchableOpacity
                                        key={sec._id}
                                        style={[
                                            styles.sectionFilterButton,
                                            filterSectionId === sec._id && styles.sectionFilterButtonActive,
                                        ]}
                                        onPress={() => setFilterSectionId(sec._id)}
                                    >
                                        <Text
                                            style={[
                                                styles.sectionFilterText,
                                                filterSectionId === sec._id && styles.sectionFilterTextActive,
                                            ]}
                                        >
                                            {sec.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.canvasContainer}>
                            <View style={[styles.canvasBoundary, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]}>
                                {filteredTables.map(table => (
                                    <DraggableTable
                                        key={table._id}
                                        table={table}
                                        onDragEnd={handleDragEnd}
                                        onRotate={handleRotate}
                                        onEdgeHover={setEdgeWarning}
                                        containerWidth={CANVAS_WIDTH}
                                        containerHeight={CANVAS_HEIGHT}
                                    />
                                ))}
                                {/* Grid Background - Rendered first to be behind */}
                                <GridBackground width={CANVAS_WIDTH} height={CANVAS_HEIGHT} step={20} />

                                {/* Red Blinking Border Overlay */}
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        styles.edgeWarningOverlay,
                                        { opacity: blinkAnim }
                                    ]}
                                />
                            </View>
                        </View>

                        <View style={styles.layoutFooter}>
                            <Button
                                title="Save Layout"
                                onPress={saveLayout}
                                loading={loading}
                                disabled={!layoutChanged && !loading}
                                gradient={layoutChanged ? colors.gradients.primary : ['#475569', '#334155']}
                            />
                        </View>
                    </View>
                )}
            </SafeAreaView>

            {/* Section Management Modal */}
            <Modal
                visible={sectionModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSectionModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassView style={styles.modalContent} intensity={40}>
                        <Text style={styles.modalTitle}>Manage Sections</Text>

                        <Text style={styles.modalLabel}>Add New Section</Text>
                        <View style={styles.modalInputRow}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g., Main Hall, Patio"
                                placeholderTextColor={colors.text.secondary}
                                value={newSectionName}
                                onChangeText={setNewSectionName}
                            />
                            <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddSection}>
                                <Text style={styles.modalAddBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Existing Sections</Text>
                        {sections.map(sec => (
                            <View key={sec._id} style={styles.sectionItem}>
                                <Text style={styles.sectionItemName}>{sec.name}</Text>
                                <TouchableOpacity
                                    style={styles.sectionDeleteBtn}
                                    onPress={() => handleDeleteSection(sec._id, sec.name)}
                                >
                                    <Text style={styles.sectionDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        {sections.length === 0 && (
                            <Text style={styles.noSectionsText}>No sections yet. Add one above!</Text>
                        )}

                        <Button
                            title="Close"
                            onPress={() => setSectionModalVisible(false)}
                            style={styles.modalCloseBtn}
                        />
                    </GlassView>
                </View>
            </Modal>
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
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleActive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    toggleText: {
        color: colors.text.secondary,
        fontWeight: 'bold',
    },
    toggleTextActive: {
        color: '#fff',
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
    capacityRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    capacityButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    capacityButtonActive: {
        borderColor: colors.accent.primary,
    },
    capacityText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.secondary,
        zIndex: 1,
    },
    capacityTextActive: {
        color: '#fff',
    },
    capacityInput: {
        marginTop: 5,
    },
    sectionRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
        paddingRight: 20, // Add padding for scroll end
    },
    sectionButton: {
        paddingHorizontal: 15, // Dynamic width
        height: 42,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    sectionButtonActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: colors.accent.primary,
    },
    sectionText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    sectionTextActive: {
        color: '#fff',
    },
    customSectionInput: {
        marginTop: 0,
    },
    createButton: {
        marginTop: 10,
    },
    sectionFilterContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    sectionFilterScroll: {
        gap: 8,
        paddingVertical: 5,
    },
    sectionFilterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sectionFilterButtonActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderColor: colors.accent.primary,
    },
    sectionFilterText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    sectionFilterTextActive: {
        color: '#fff',
    },
    layoutContainer: {
        flex: 1,
    },
    layoutHeader: {
        paddingHorizontal: 20,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    layoutInstructions: {
        color: colors.text.secondary,
        fontSize: 14,
    },
    unsavedChanges: {
        color: colors.accent.warning,
        fontSize: 12,
        fontWeight: 'bold',
    },
    canvasContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    canvasBoundary: {
        backgroundColor: 'rgba(0,0,0,0.2)', // Matched to TableGridScreen
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderRadius: 20,
    },
    layoutFooter: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    formActions: {
        gap: 10,
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
    },
    tableListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    tableInfo: {
        flex: 1,
    },
    listItemName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listItemDetails: {
        color: colors.text.secondary,
        fontSize: 12,
        marginTop: 2,
    },
    listActions: {
        flexDirection: 'row',
        gap: 10,
    },
    listBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    editBtn: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue tint
    },
    deleteBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)', // Red tint
    },
    btnText: {
        fontSize: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    manageSectionsBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 1,
        borderColor: colors.accent.primary,
    },
    manageSectionsBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    noSectionsText: {
        color: colors.text.secondary,
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalLabel: {
        ...typography.label,
        color: colors.text.secondary,
        marginBottom: 8,
        marginTop: 12,
    },
    modalInputRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    modalInput: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        height: 45,
        borderRadius: 10,
        paddingHorizontal: 15,
        color: '#fff',
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalAddBtn: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalAddBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    sectionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    sectionItemName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    sectionDeleteBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    sectionDeleteText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '600',
    },
    modalCloseBtn: {
        marginTop: 20,
    },
    edgeWarningOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 4,
        borderColor: '#ef4444', // Red 500
        borderRadius: 20,
        zIndex: 999,
        elevation: 10,
    },
});
