import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

export interface PageDotsProps {
    count: number;
    activeIndex: number;
    style?: StyleProp<ViewStyle>;
}

/** Carousel pagination dots — active dot stretches into a dark pill. */
export const PageDots = ({ count, activeIndex, style }: PageDotsProps) => {
    return (
        <View style={[styles.row, style]}>
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={styles.dot(index === activeIndex)} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
    },
    dot: (active: boolean) => ({
        width: active ? 24 : 8,
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: active ? theme.colors.branding.primary : theme.colors.active.tertiary,
    }),
}));
