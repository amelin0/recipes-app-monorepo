import React from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import AddIcon from '../../../../../assets/icons/add.svg';
import MinusIcon from '../../../../../assets/icons/minus.svg';
import { AppText } from '../texts';

export interface ValueStepperProps {
    /** Value as it reads, unit included («2п», «78,2 кг»). */
    value: string;
    /** Makes the value typable; the numeric keyboard opens on focus. */
    onChangeValue?: (value: string) => void;
    canDecrease?: boolean;
    onDecrease: () => void;
    onIncrease: () => void;
    decreaseLabel: string;
    increaseLabel: string;
}

const BUTTON = 44;

/**
 * Round-ended stepper with the value in the middle — the portion picker
 * (811:58849) and every «add a reading» sheet (673:41671).
 */
export const ValueStepper = ({
    value,
    onChangeValue,
    canDecrease = true,
    onDecrease,
    onIncrease,
    decreaseLabel,
    increaseLabel,
}: ValueStepperProps) => {
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

            {onChangeValue ? (
                <TextInput
                    value={value}
                    onChangeText={onChangeValue}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    style={styles.input}
                />
            ) : (
                <AppText variant="titleLarge">{value}</AppText>
            )}

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
    input: {
        flex: 1,
        minWidth: 0,
        ...theme.typography.titleLarge,
        color: theme.colors.elements.primary,
        textAlign: 'center',
        // The field carries no chrome of its own — the stepper is the control.
        padding: 0,
    },
    plus: {
        width: BUTTON,
        height: BUTTON,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.positive,
    },
}));
