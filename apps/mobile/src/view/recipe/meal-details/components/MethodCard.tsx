import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import type { MealStep } from '../../recipe.constants';

export interface MethodCardProps {
    /** Ingredient names shown as chips above the steps. */
    ingredients: string[];
    /** Cook time, already formatted («15 хв»). */
    time: string;
    steps: MealStep[];
}

/**
 * The whole cooking method in one card (984:57608): what the dish needs, how
 * long it takes, then every step in order.
 */
export const MethodCard = ({ ingredients, time, steps }: MethodCardProps) => {
    const { t } = useAppTranslation(['recipes']);

    return (
        <View style={styles.card}>
            <View style={styles.block}>
                <AppText variant="bodyMediumReg" style={styles.label}>
                    {t('recipes:details.needed-ingredients')}
                </AppText>
                <View style={styles.tags}>
                    {ingredients.map(name => (
                        <Tag key={name} label={name} />
                    ))}
                </View>
            </View>

            <View style={styles.block}>
                <AppText variant="bodyMediumReg" style={styles.label}>
                    {t('recipes:details.cook-time')}
                </AppText>
                <Tag label={time} tone="negative" />
            </View>

            {steps.map((step, index) => (
                <View key={step.id} style={styles.step}>
                    <AppText variant="bodyLargeBold" style={styles.stepTitle}>
                        {t('recipes:details.step-title', { index: index + 1, title: step.title })}
                    </AppText>
                    <AppText variant="bodySmallReg" style={styles.stepBody}>
                        {step.description}
                    </AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[4],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    block: {
        width: '100%',
        gap: theme.spacing[2],
    },
    label: {
        color: theme.colors.semantic.darkGrey,
    },
    tags: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    step: {
        width: '100%',
        justifyContent: 'center',
    },
    stepTitle: {
        width: '100%',
    },
    stepBody: {
        width: '100%',
        color: theme.colors.semantic.darkGrey,
    },
}));
