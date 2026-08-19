import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import AddIcon from '../../../../../assets/icons/add.svg';
import MinusIcon from '../../../../../assets/icons/minus.svg';

export interface PortionStepperProps {
    /** Portion count, already formatted («2п»). */
    value: string;
    canDecrease: boolean;
    onDecrease: () => void;
    onIncrease: () => void;
    decreaseLabel: string;
    increaseLabel: string;
}

/** How many portions the dish was cooked in (811:58849). */
export const PortionStepper = ({
    value,
    canDecrease,
    onDecrease,
    onIncrease,
    decreaseLabel,
    increaseLabel,
}: PortionStepperProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.row}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={decreaseLabel}
                accessibilityState={{ disabled: !canDecrease }}
                disabled={!canDecrease}
                onPress={onDecrease}
                style={styles.minus(canDecrease)}
            >
                <MinusIcon width={32} height={32} color={theme.colors.semantic.darkGrey} />
            </Pressable>

            <AppText variant="titleLarge">{value}</AppText>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel={increaseLabel}
                onPress={onIncrease}
                style={styles.plus}
            >
                <AddIcon width={32} height={32} color={theme.colors.semantic.white} />
            </Pressable>
        </View>
    );
};

const BUTTON = 44;

const styles = StyleSheet.create(theme => ({
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing[2],
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
    },
    minus: (enabled: boolean) => ({
        width: BUTTON,
        height: BUTTON,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
        opacity: enabled ? 1 : 0.5,
    }),
    plus: {
        width: BUTTON,
        height: BUTTON,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.positive,
    },
}));
