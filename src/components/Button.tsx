import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    icon?: string; // Emoji or icon component
    style?: ViewStyle;
    textStyle?: TextStyle;
    gradient?: readonly [string, string, ...string[]];
}

export const Button = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    icon,
    style,
    textStyle,
    gradient,
}: ButtonProps) => {

    const getColors = () => {
        if (disabled) return ['#475569', '#334155'];
        if (gradient) return gradient;
        switch (variant) {
            case 'primary': return colors.gradients.primary;
            case 'danger': return ['#EF4444', '#B91C1C'];
            case 'secondary': return ['#334155', '#1E293B'];
            case 'ghost': return ['transparent', 'transparent'];
            default: return colors.gradients.primary;
        }
    };

    const content = (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                variant === 'ghost' && styles.ghostButton,
                style
            ]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={colors.text.primary} />
            ) : (
                <>
                    {icon && <Text style={styles.icon}>{icon}</Text>}
                    <Text style={[
                        styles.text,
                        variant === 'ghost' && styles.ghostText,
                        textStyle
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );

    if (variant === 'ghost') return content;

    return (
        <LinearGradient
            colors={getColors() as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.container, style]}
        >
            {content}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    ghostText: {
        color: colors.text.secondary,
    },
    icon: {
        marginRight: 8,
        fontSize: 18,
    }
});
