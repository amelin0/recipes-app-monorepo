import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, CircleIconButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../../assets/icons/add.svg';
import MinusIcon from '../../../../../assets/icons/minus.svg';

export interface CalorieStepperProps {
    calories: number;
    onDecrease: () => void;
    onIncrease: () => void;
}

/** ± stepper with the glowing calorie circle (Figma `cal`, node 435:12703). */
export const CalorieStepper = ({ calories, onDecrease, onIncrease }: CalorieStepperProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);

    return (
        <View style={styles.row}>
            <CircleIconButton
                size={52}
                accessibilityLabel={t('tracking:goal-setup.decrease-a11y')}
                onPress={onDecrease}
            >
                <MinusIcon width={24} height={24} color={theme.colors.elements.primary} />
            </CircleIconButton>

            <View style={styles.glow}>
                <View style={styles.circle}>
                    <AppText variant="titleLarge">{calories.toLocaleString('en-US')}</AppText>
                    <AppText variant="bodyLargeReg">{t('tracking:goal-setup.kcal')}</AppText>
                </View>
            </View>

            <CircleIconButton
                size={52}
                accessibilityLabel={t('tracking:goal-setup.increase-a11y')}
                onPress={onIncrease}
            >
                <AddIcon width={24} height={24} color={theme.colors.elements.primary} />
            </CircleIconButton>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[6],
        width: '100%',
    },
    // Figma shadow/positive is a 8px spread ring — RN has no spread, so the
    // ring is a padded wrapper with the translucent fill.
    glow: {
        padding: theme.spacing[2],
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0, 171, 60, 0.12)',
    },
    circle: {
        width: 152,
        height: 152,
        gap: theme.spacing[1],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        borderWidth: 4,
        borderColor: theme.colors.semantic.positive,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
}));
