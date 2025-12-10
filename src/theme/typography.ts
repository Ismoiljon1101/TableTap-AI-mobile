import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text.primary,
        letterSpacing: 0.5,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        letterSpacing: 0.5,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text.primary,
    },
    body: {
        fontSize: 16,
        color: colors.text.secondary,
        lineHeight: 24,
    },
    caption: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
