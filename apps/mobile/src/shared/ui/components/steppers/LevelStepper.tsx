import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import AddIcon from '../../../../../assets/icons/add.svg';
import MinusIcon from '../../../../../assets/icons/minus.svg';
import { AppText } from '../texts';

export interface LevelStepperProps {
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    decrementLabel: string;
    incrementLabel: string;
}

/**
 * Pill stepper for the activity level — RFDS 984:58070. Each side button turns
 * grey once it would run past the range, which is the state the design shows at
 * value 0.
 */
export const LevelStepper = ({ value, min, max, onChange, decrementLabel, incrementLabel }: LevelStepperProps) => {
    const { theme } = useUnistyles();

    const canDecrement = value > min;
    const canIncrement = value < max;

    return (
        <View style={styles.container}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={decrementLabel}
                accessibilityState={{ disabled: !canDecrement }}
                disabled={!canDecrement}
                onPress={() => onChange(value - 1)}
                style={styles.button(canDecrement)}
            >
                <MinusIcon
                    width={32}
                    height={32}
                    color={canDecrement ? theme.colors.semantic.white : theme.colors.active.tertiary}
                />
            </Pressable>

            <View style={styles.value}>
                <AppText variant="titleLarge">{String(value)}</AppText>
            </View>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel={incrementLabel}
                accessibilityState={{ disabled: !canIncrement }}
                disabled={!canIncrement}
                onPress={() => onChange(value + 1)}
                style={styles.button(canIncrement)}
            >
                <AddIcon
                    width={32}
                    height={32}
                    color={canIncrement ? theme.colors.semantic.white : theme.colors.active.tertiary}
                />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    container: {
        width: '100%',
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 9,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
    },
    button: (enabled: boolean) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: enabled ? theme.colors.semantic.positive : theme.colors.semantic.lightGrey,
    }),
    value: {
        width: 164,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[2],
    },
}));
