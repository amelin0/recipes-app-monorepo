import React from 'react';
import { Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../texts';

export type ChipSize = 'sm' | 'md';

export interface ChipProps {
    /** Chip copy (may include a leading emoji). */
    label: string;
    /** md — 40pt filter options (594:43425); sm — 36pt applied chips (594:44769). */
    size?: ChipSize;
    /** Selected style: light-positive fill + 2px accent border. */
    selected?: boolean;
    onPress?: () => void;
    /** Renders a trailing ✕ (applied-filter chips); fired on press of the ✕. */
    onRemove?: () => void;
}

/** Pill option chip — RFDS filter chips (default lightGrey / selected accent). */
export const Chip = ({ label, size = 'md', selected = false, onPress, onRemove }: ChipProps) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={onPress}
            style={styles.chip(selected, size)}
        >
            <AppText variant="bodyMediumBold" numberOfLines={1}>
                {label}
            </AppText>
            {onRemove ? (
                <Pressable accessibilityRole="button" hitSlop={8} onPress={onRemove}>
                    <Ionicons name="close-circle-outline" size={16} color={theme.colors.elements.primary} />
                </Pressable>
            ) : null}
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    chip: (selected: boolean, size: ChipSize) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        height: size === 'sm' ? 36 : 40,
        paddingLeft: theme.spacing[2],
        paddingRight: theme.spacing[3],
        paddingVertical: theme.spacing[1],
        borderRadius: theme.radius.full,
        backgroundColor: selected ? theme.colors.semantic.lightPositive : theme.colors.semantic.lightGrey,
        borderWidth: selected ? 2 : 0,
        borderColor: selected ? theme.colors.branding.accent : 'transparent',
    }),
}));
