import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../store/hooks';

export default function ManagementScreen({ navigation }: any) {
    const { restaurant } = useAppSelector(state => state.auth);

    const menuItems = [
        {
            title: '🪑 Manage Tables',
            description: 'Add, edit, or remove tables',
            screen: 'TableManagement',
            icon: '🪑',
        },
        {
            title: '🍽️ Manage Menu',
            description: 'Add, edit menu items',
            screen: 'MenuManagement',
            icon: '🍽️',
        },
        {
            title: '📊 View Analytics',
            description: 'Sales and performance',
            screen: 'Analytics',
            icon: '📊',
            disabled: true,
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Management</Text>
                    <Text style={styles.subtitle}>{restaurant?.name}</Text>
                </View>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.card, item.disabled && styles.cardDisabled]}
                        onPress={() => !item.disabled && navigation.navigate(item.screen)}
                        disabled={item.disabled}
                    >
                        <View style={styles.cardIcon}>
                            <Text style={styles.icon}>{item.icon}</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDescription}>{item.description}</Text>
                            {item.disabled && (
                                <Text style={styles.comingSoon}>Coming Soon</Text>
                            )}
                        </View>
                        {!item.disabled && (
                            <Text style={styles.arrow}>→</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#3498db',
        fontWeight: '600',
    },
    content: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardDisabled: {
        opacity: 0.5,
    },
    cardIcon: {
        marginRight: 15,
    },
    icon: {
        fontSize: 40,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    comingSoon: {
        fontSize: 12,
        color: '#e67e22',
        fontStyle: 'italic',
        marginTop: 4,
    },
    arrow: {
        fontSize: 24,
        color: '#3498db',
        marginLeft: 10,
    },
});
