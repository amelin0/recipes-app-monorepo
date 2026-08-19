import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import CheckIcon from '../../../../assets/icons/onboarding/check-small.svg';

/** `sm` — units step (56/16); `lg` — goal step, whose copy runs to two lines (80/12). */
export type OptionRowSize = 'sm' | 'lg';

const SIZES: Record<OptionRowSize, { minHeight: number; padding: number }> = {
    sm: { minHeight: 56, padding: 16 },
    lg: { minHeight: 80, padding: 12 },
};

export interface OptionRowProps {
    title: string;
    /** Short explanation under the title. */
    description?: string;
    selected: boolean;
    onPress: () => void;
    /** @default 'sm' */
    size?: OptionRowSize;
}

/**
 * Full-width option row — RFDS `Select` (Figma 855:101250). Unlike the square
 * `GenderCard`, the selected state keeps a 1pt border and adds a check on the
 * trailing edge instead of thickening the outline.
 */
export const OptionRow = ({ title, description, selected, onPress, size = 'sm' }: OptionRowProps) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={onPress}
            style={styles.row(selected, size)}
        >
            <View style={styles.labels}>
                <AppText variant="bodyLargeBold">{title}</AppText>
                {description ? (
                    <AppText variant="bodySmallReg" style={styles.description}>
                        {description}
                    </AppText>
                ) : null}
            </View>

            {selected ? <CheckIcon width={24} height={24} color={theme.colors.semantic.positive} /> : null}
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    row: (selected: boolean, size: OptionRowSize) => ({
        width: '100%',
        minHeight: SIZES[size].minHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        padding: SIZES[size].padding,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.background.screen,
        borderWidth: 1,
        borderColor: selected ? theme.colors.forms.positiveBorder : theme.colors.forms.lightBorder,
    }),
    labels: {
        flex: 1,
    },
    description: {
        color: theme.colors.semantic.darkGrey,
    },
}));
