import React from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../../assets/icons/add.svg';
import MinusIcon from '../../../../../assets/icons/minus.svg';

export interface AmountStepperProps {
    /** Editable numeric text, e.g. "50" or "1,5". */
    valueText: string;
    onChangeValueText: (text: string) => void;
    /** Unit suffix rendered after the value, e.g. «г». */
    suffix: string;
    onDecrease: () => void;
    onIncrease: () => void;
}

/** Amount picker: − / editable value with unit / + (Figma 476:19411). */
export const AmountStepper = ({ valueText, onChangeValueText, suffix, onDecrease, onIncrease }: AmountStepperProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['shopping']);

    return (
        <View style={styles.container}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('shopping:amount.decrease-a11y')}
                hitSlop={8}
                onPress={onDecrease}
                style={({ pressed }) => styles.stepButton(pressed, false)}
            >
                <MinusIcon width={32} height={32} color={theme.colors.elements.primary} />
            </Pressable>
            <View style={styles.valueBox}>
                <TextInput
                    value={valueText}
                    onChangeText={onChangeValueText}
                    keyboardType="decimal-pad"
                    accessibilityLabel={t('shopping:amount.value-a11y')}
                    style={styles.valueInput}
                    maxLength={6}
                />
                <AppText variant="titleLarge">{` ${suffix}`}</AppText>
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('shopping:amount.increase-a11y')}
                hitSlop={8}
                onPress={onIncrease}
                style={({ pressed }) => styles.stepButton(pressed, true)}
            >
                <AddIcon width={32} height={32} color={theme.colors.semantic.white} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        minHeight: 64,
        padding: theme.spacing[2],
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
        alignSelf: 'center',
    },
    stepButton: (pressed: boolean, positive: boolean) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: positive
            ? pressed
                ? theme.colors.active.positive
                : theme.colors.semantic.positive
            : pressed
              ? theme.colors.active.tertiary
              : theme.colors.semantic.lightGrey,
    }),
    valueBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 164,
        paddingHorizontal: theme.spacing[2],
    },
    valueInput: {
        ...theme.typography.titleLarge,
        color: theme.colors.elements.primary,
        textAlign: 'center',
        padding: 0,
        // Порожній інпут не має колапсувати в нульову ширину.
        minWidth: 60,
    },
}));
