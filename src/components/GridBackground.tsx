import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface GridBackgroundProps {
    width: number;
    height: number;
    step?: number;
}

export const GridBackground = React.memo(({ width, height, step = 20 }: GridBackgroundProps) => {
    // Generate lines
    const verticalLines = [];
    const horizontalLines = [];

    // Vertical
    for (let i = step; i < width; i += step) {
        verticalLines.push(
            <View
                key={`v-${i}`}
                style={{
                    position: 'absolute',
                    left: i,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: colors.accent.primary, // Sky Blue
                    opacity: 0.1,
                }}
            />
        );
    }

    // Horizontal
    for (let i = step; i < height; i += step) {
        horizontalLines.push(
            <View
                key={`h-${i}`}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: i,
                    height: 1,
                    backgroundColor: colors.accent.primary, // Sky Blue
                    opacity: 0.1,
                }}
            />
        );
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {verticalLines}
            {horizontalLines}
        </View>
    );
});
