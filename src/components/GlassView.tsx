import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface GlassViewProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
    gradient?: readonly [string, string, ...string[]];
}

export const GlassView = ({
    children,
    style,
    intensity = 50,
    gradient = colors.gradients.glass
}: GlassViewProps) => {

    // Android often struggles with real-time blur, so we use a stronger gradient fallback
    // or a simplified transparency if performance is an issue.
    const isAndroid = Platform.OS === 'android';

    return (
        <View style={[styles.container, style]}>
            <BlurView
                intensity={isAndroid ? 0 : intensity}
                tint="dark"
                style={StyleSheet.absoluteFill}
            />
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.gradient]}
            />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        backgroundColor: Platform.OS === 'android' ? 'rgba(30, 41, 59, 0.9)' : 'transparent',
    },
    gradient: {
        opacity: 0.8,
    },
    content: {
        zIndex: 1,
    }
});
