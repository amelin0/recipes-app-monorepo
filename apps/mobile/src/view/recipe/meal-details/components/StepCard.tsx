import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { TimeTag } from '../../components';
import type { MealStep } from '../../recipe.constants';

export interface StepCardProps {
    step: MealStep;
    width: number;
}

/** Cooking-method carousel card: step title, description, ingredient tags, time. */
export const StepCard = ({ step, width }: StepCardProps) => {
    const { t } = useAppTranslation(['recipes']);

    return (
        <View style={[styles.card, { width }]}>
            <AppText variant="bodyLargeBold">{step.title}</AppText>
            <AppText variant="bodyMediumReg" color="secondary">
                {step.description}
            </AppText>

            <View style={styles.block}>
                <AppText variant="bodySmallReg" color="tertiary">
                    {t('recipes:details.needed-ingredients')}
                </AppText>
                <View style={styles.tags}>
                    {step.ingredients.map(name => (
                        <View key={name} style={styles.tag}>
                            <AppText variant="bodySmallReg">{name}</AppText>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.block}>
                <AppText variant="bodySmallReg" color="tertiary">
                    {t('recipes:details.cook-time')}
                </AppText>
                <TimeTag label={t('recipes:list.minutes', { count: step.minutes })} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        gap: theme.spacing[2],
        padding: theme.spacing[4],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    block: {
        gap: theme.spacing[1],
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[1],
    },
    tag: {
        paddingHorizontal: theme.spacing[2],
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.white,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
    },
}));
