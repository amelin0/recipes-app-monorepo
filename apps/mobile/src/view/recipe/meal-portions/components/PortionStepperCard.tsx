import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../../assets/icons/add.svg';
import MinusIcon from '../../../../../assets/icons/minus.svg';

export interface PortionStepperCardProps {
    title: string;
    portions: number;
    grams: number;
    onDecrease: () => void;
    onIncrease: () => void;
    /** Optional row under the stepper (e.g. КБЖВ values for «Моя порція»). */
    children?: React.ReactNode;
}

/** Grey portion card: label + weight, − / «2,5 п» / + stepper, optional macros. */
export const PortionStepperCard = ({
    title,
    portions,
    grams,
    onDecrease,
    onIncrease,
    children,
}: PortionStepperCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <AppText variant="bodyLargeBold">{title}</AppText>
                <AppText variant="bodyLargeBold">{t('recipes:portions.grams-value', { value: grams })}</AppText>
            </View>

            <View style={styles.stepperRow}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('recipes:portions.decrease-a11y')}
                    hitSlop={8}
                    onPress={onDecrease}
                    style={({ pressed }) => styles.stepButton(pressed, false)}
                >
                    <MinusIcon width={24} height={24} color={theme.colors.elements.primary} />
                </Pressable>
                <AppText variant="titleSmall">
                    {t('recipes:portions.portion-value', { value: portions.toLocaleString('uk-UA') })}
                </AppText>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('recipes:portions.increase-a11y')}
                    hitSlop={8}
                    onPress={onIncrease}
                    style={({ pressed }) => styles.stepButton(pressed, true)}
                >
                    <AddIcon width={24} height={24} color={theme.colors.elements.primary} />
                </Pressable>
            </View>

            {children}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        gap: theme.spacing[3],
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
        width: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepButton: (pressed: boolean, accent: boolean) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: accent
            ? pressed
                ? theme.colors.active.primary
                : theme.colors.branding.accent
            : pressed
              ? theme.colors.active.tertiary
              : theme.colors.semantic.white,
    }),
}));
