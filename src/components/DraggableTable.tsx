import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert, Vibration, PanResponder, Animated } from 'react-native';
import { Table } from '../types';
import { colors } from '../theme/colors';

import { TABLE_UNIT_SIZE } from '../constants/layout';

interface DraggableTableProps {
    table: Table;
    onDragEnd: (id: string, x: number, y: number) => void;
    onRotate?: (id: string, newRotation: number) => void;
    onEdgeHover?: (isEdge: boolean) => void;
    containerWidth: number;
    containerHeight: number;
}

// Memoize carefully to avoid re-renders during parent state updates (like edge warning)
export const DraggableTable = React.memo(({ table, onDragEnd, onRotate, onEdgeHover, containerWidth, containerHeight }: DraggableTableProps) => {
    // 1. Dimensions Logic (Swap if Vertical)
    // Rotation is 0 or 90.
    const rotation = table.rotation || 0;
    const isVertical = Math.abs(rotation % 180) > 45;

    const units = Math.max(1, Math.ceil((table.capacity || 2) / 2));
    const baseWidth = units * TABLE_UNIT_SIZE;
    const baseHeight = TABLE_UNIT_SIZE;

    // Rendered Size
    const width = isVertical ? baseHeight : baseWidth;
    const height = isVertical ? baseWidth : baseHeight;

    // 2. State & Animations
    // Position (Animated for smooth snap, but driven directly by PanResponder)
    const pan = useRef(new Animated.ValueXY({ x: table.position?.x || 0, y: table.position?.y || 0 })).current;

    // Visual Feedback
    const scale = useRef(new Animated.Value(1)).current;
    const zIndex = useRef(new Animated.Value(1)).current;

    // Logic Ref
    const isDragActive = useRef(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const tapTimestamp = useRef<number>(0);
    const lastEdgeState = useRef<boolean>(false);

    // Sync Props
    useEffect(() => {
        // Only update if absolute difference is meaningful to prevent loops if parent rounds values
        const currentVal = { x: (pan.x as any)._value + (pan.x as any)._offset, y: (pan.y as any)._value + (pan.y as any)._offset };
        if (Math.abs(currentVal.x - (table.position?.x || 0)) > 1 || Math.abs(currentVal.y - (table.position?.y || 0)) > 1) {
            pan.setOffset({ x: 0, y: 0 });
            pan.setValue({ x: table.position?.x || 0, y: table.position?.y || 0 });
        }
    }, [table.position?.x, table.position?.y]);

    // 3. PanResponder (Pure Native)
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onPanResponderGrant: (evt, gestureState) => {
                // Reset Logic State
                isDragActive.current = false;
                tapTimestamp.current = Date.now();
                lastEdgeState.current = false;

                // Extract Offset: Moves value to offset, sets value to 0.
                pan.extractOffset();

                // START HOLD TIMER
                longPressTimer.current = setTimeout(() => {
                    // Activate Drag
                    isDragActive.current = true;
                    Vibration.vibrate(50);

                    // Visual Pop
                    Animated.parallel([
                        Animated.spring(scale, { toValue: 1.1, useNativeDriver: true }),
                        Animated.timing(zIndex, { toValue: 100, duration: 0, useNativeDriver: true })
                    ]).start();
                }, 500); // 500ms Hold
            },

            onPanResponderMove: (evt, gestureState) => {
                // If Timer is running (waiting for Hold), check for "Wiggle"
                if (longPressTimer.current && !isDragActive.current) {
                    const moved = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
                    if (moved > 10) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                    }
                }

                if (isDragActive.current) {
                    // Actual Drag Movement
                    // Since we extracted offset, Value starts at 0.
                    // gestureState.dx is accumulation from start.
                    pan.x.setValue(gestureState.dx);
                    pan.y.setValue(gestureState.dy);

                    // Check Edges for Warning
                    if (onEdgeHover) {
                        const currentX = (pan.x as any)._value + (pan.x as any)._offset;
                        const currentY = (pan.y as any)._value + (pan.y as any)._offset;

                        // If center is within 20px of edge
                        const centerX = currentX + width / 2;
                        const centerY = currentY + height / 2;

                        const minCX = width / 2;
                        const maxCX = containerWidth - width / 2;
                        const minCY = height / 2;
                        const maxCY = containerHeight - height / 2;

                        const gap = 20;
                        const atEdge = (
                            centerX < minCX + gap ||
                            centerX > maxCX - gap ||
                            centerY < minCY + gap ||
                            centerY > maxCY - gap
                        );

                        // DEBOUNCE / DEDUPE: Only call if changed
                        if (atEdge !== lastEdgeState.current) {
                            lastEdgeState.current = atEdge;
                            onEdgeHover(atEdge);
                        }
                    }
                }
            },

            onPanResponderRelease: (evt, gestureState) => {
                // Clear Edge Warning
                if (onEdgeHover && lastEdgeState.current) {
                    onEdgeHover(false);
                    lastEdgeState.current = false;
                }

                // Clear Timer
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }

                if (isDragActive.current) {
                    // === DRAG END ===
                    // Commits the current position (Offset + Value) into Value, and resets Offset to 0.
                    pan.flattenOffset();

                    // Reset Visuals
                    Animated.parallel([
                        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
                        Animated.timing(zIndex, { toValue: 1, duration: 0, useNativeDriver: true })
                    ]).start();

                    // Clamping
                    const currentX = (pan.x as any)._value; // Already flattened
                    const currentY = (pan.y as any)._value;

                    // Clamp top-left based on dimensions
                    // Max X = Container - Table Width
                    // Max Y = Container - Table Height
                    const minX = 0;
                    const maxX = containerWidth - width;
                    const minY = 0;
                    const maxY = containerHeight - height;

                    const clampedX = Math.max(minX, Math.min(currentX, maxX));
                    const clampedY = Math.max(minY, Math.min(currentY, maxY));

                    // Snap to grid/clamped position
                    Animated.spring(pan, { toValue: { x: clampedX, y: clampedY }, useNativeDriver: true }).start();

                    onDragEnd(table._id, clampedX, clampedY);
                } else {
                    // === TAP / CANCEL ===

                    // We moved the Value (via dx/dy) maybe slightly? 
                    // Or if we just tapped, dx is 0.
                    // We want to return to Origin.
                    // Origin is represented by the Offset (since we extracted).
                    // So we set Value to 0.
                    pan.setValue({ x: 0, y: 0 });

                    // CRITICAL: We MUST flatten offset so next time we are clean.
                    pan.flattenOffset();

                    // Check for Tap
                    const duration = Date.now() - tapTimestamp.current;
                    const moved = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);

                    if (duration < 500 && moved < 10) {
                        Alert.alert(
                            "Orientation",
                            "Change table orientation?",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Horizontal (0°)",
                                    onPress: () => onRotate && onRotate(table._id, 0)
                                },
                                {
                                    text: "Vertical (90°)",
                                    onPress: () => onRotate && onRotate(table._id, 90)
                                }
                            ]
                        );
                    }
                }

                isDragActive.current = false;
            },

            onPanResponderTerminate: () => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
                isDragActive.current = false;

                // Clear warning
                if (onEdgeHover && lastEdgeState.current) {
                    onEdgeHover(false);
                    lastEdgeState.current = false;
                }

                // Snap back to start state (reset logic)
                // We likely want to revert to the last committed position (useEffect will handle this if we trigger re-render, 
                // but local animation needs to settle).
                pan.extractOffset(); // ? No, flatten.
                pan.flattenOffset();
                // If terminated, we probably didn't update state.
                // Reset directly to props.
                pan.setValue({ x: table.position?.x || 0, y: table.position?.y || 0 });

                Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
            }
        })
    ).current;

    // Interpolate zIndex? No, standard Animated doesn't support zIndex well on Android < some version.
    // We use a View wrapper for zIndex if needed, or rely on the Animated.View style prop update.
    // For Native Driver, direct style prop manipulation is limited.
    // But 'elevation' works for zIndex on Android.

    // We pass zIndex via style. The Animated.Value mapping needs to be to a number? 
    // Animated.View style supports zIndex as Animated.Value in newer RN. 
    // Safe fallback: Just use elevation change on drag start (ref) or forced re-render?
    // We'll trust Animated.Value for now, or just elevation.

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    width,
                    height,
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale }
                    ],
                    // @ts-ignore
                    zIndex: zIndex, // Animated zIndex
                    elevation: zIndex // Android zIndex equivalent
                }
            ]}
            {...panResponder.panHandlers}
        >
            <View style={[
                styles.table,
                {
                    backgroundColor: table.status === 'available' ? colors.accent.success :
                        table.status === 'occupied' ? colors.accent.error :
                            table.status === 'reserved' ? colors.accent.warning :
                                colors.background.tertiary,
                }
            ]}>
                <View style={{ alignItems: 'center', pointerEvents: 'none' }}>
                    <Text style={styles.tableName} numberOfLines={1}>{table.displayName}</Text>
                    <View style={styles.capacityBadge}>
                        <Text style={styles.capacityText}>👥 {table.capacity}</Text>
                    </View>
                </View>

                {/* Orientation Marker */}
                <View style={[styles.orientationMarker, { height: '80%', width: 2, backgroundColor: 'rgba(255,255,255,0.2)', position: 'absolute', right: 5 }]} />
            </View>
        </Animated.View>
    );
}, (prevProps, nextProps) => {
    // Custom Comparison for React.memo
    // Re-render if table props change (position, name, etc)
    // Or if container dimensions change
    // Or if callbacks change (unlikely to change often)

    // We explicitly IGNORE onEdgeHover changes if the function ref changes but is functionally same from same parent component.
    // However, usually function init changes every render.
    // We assume onDragEnd, onRotate are stable or harmless to re-render.
    // The main offender is parent state update triggering ALL tables to re-render.

    // Check key props
    const posChanged =
        prevProps.table.position?.x !== nextProps.table.position?.x ||
        prevProps.table.position?.y !== nextProps.table.position?.y;

    const rotChanged = prevProps.table.rotation !== nextProps.table.rotation;
    const sizeChanged = prevProps.containerWidth !== nextProps.containerWidth;
    const nameChanged = prevProps.table.displayName !== nextProps.table.displayName;

    return !posChanged && !rotChanged && !sizeChanged && !nameChanged;
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
    },
    table: {
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
    tableName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2,
        textAlign: 'center',
    },
    capacityBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    capacityText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 10,
        fontWeight: '600',
    },
    orientationMarker: {},
});
