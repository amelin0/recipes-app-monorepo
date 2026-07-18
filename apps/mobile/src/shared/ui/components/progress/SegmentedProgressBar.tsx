import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface SegmentedProgressBarProps {
    /** Total number of segments. @default 10 */
    segments?: number;
    /** How many segments are filled (clamped to `segments`). */
    filled: number;
    /** Fill color. Defaults to Semantic/ocean. */
    color?: string;
    /** Segment height in px. @default 8 */
    height?: number;
    /** Extra styles merged onto the row. */
    style?: StyleProp<ViewStyle>;
}

/** Row of rounded segments — the water tracker bar on Home. */
export const SegmentedProgressBar = ({
    segments = 10,
    filled,
    color,
    height = 8,
    style,
}: SegmentedProgressBarProps) => {
    const { theme } = useUnistyles();
    const fillColor = color ?? theme.colors.semantic.ocean;
    const clamped = Math.min(Math.max(filled, 0), segments);

    return (
        <View style={[styles.row, style]}>
            {Array.from({ length: segments }).map((_, index) => (
                <View
                    key={index}
                    style={[styles.segment(height), index < clamped ? { backgroundColor: fillColor } : null]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        width: '100%',
    },
    segment: (height: number) => ({
        flex: 1,
        height,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
    }),
}));
