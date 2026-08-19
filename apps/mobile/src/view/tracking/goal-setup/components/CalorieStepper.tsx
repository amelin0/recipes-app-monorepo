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

const RING = 152;
/** RFDS shadow/positive: a 0-blur drop shadow with an 8px spread. */
const HALO = 8;

/** ± around the calorie ring (811:53497). */
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

            <View style={styles.ringWrapper}>
                {/* RN has no shadow spread, so the halo is a concentric view. */}
                <View style={styles.halo} />
                <View style={styles.ring}>
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
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[6],
    },
    ringWrapper: {
        width: RING,
        height: RING,
    },
    halo: {
        position: 'absolute',
        top: -HALO,
        left: -HALO,
        right: -HALO,
        bottom: -HALO,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.positiveRing,
        zIndex: -1,
    },
    ring: {
        width: RING,
        height: RING,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        borderRadius: theme.radius.full,
        borderWidth: 4,
        borderColor: theme.colors.semantic.positive,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
}));
