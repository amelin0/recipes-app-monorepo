import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, NutritionSummaryRow, ProgressBar, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotLogged from '../../../../assets/images/brand/mascot-logged.svg';

import { useMealLoggedScreen } from './useMealLoggedScreen';

const MASCOT_SIZE = 200;

/** Receipt for a meal that was just logged (811:55238). */
export const MealLoggedScreen = () => {
    const { t } = useAppTranslation(['tracking']);
    const { theme } = useUnistyles();
    const { dish, remainingCalories, goalCalories, goalProgress, handleDone } = useMealLoggedScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <MascotLogged width={MASCOT_SIZE} height={MASCOT_SIZE} />

                <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                    {t('tracking:logged.title')}
                </AppText>

                <View style={styles.card}>
                    <View style={styles.header}>
                        <AppText variant="titleMedium" style={styles.centered}>
                            {dish.title}
                        </AppText>
                        <AppText variant="bodyMediumReg" style={[styles.centered, styles.muted]}>
                            {dish.cuisine}
                        </AppText>
                    </View>

                    <NutritionSummaryRow equalWidths calories={dish.calories} macros={dish.macros} />

                    <AppText variant="bodyMediumReg">{t('tracking:logged.weight', { value: dish.grams })}</AppText>

                    <View style={styles.goalBox}>
                        <AppText variant="bodyLargeBold" style={styles.centered}>
                            {t('tracking:logged.goal-title')}
                        </AppText>

                        <View style={styles.goalProgress}>
                            <View style={styles.goalRow}>
                                <AppText variant="bodySmallReg" style={styles.muted}>
                                    {t('tracking:logged.remaining', { value: remainingCalories })}
                                </AppText>
                                <AppText variant="bodyMediumBold" style={styles.goalValue}>
                                    {t('tracking:logged.goal', { value: goalCalories })}
                                </AppText>
                            </View>
                            <ProgressBar progress={goalProgress} color={theme.colors.semantic.ocean} />
                        </View>
                    </View>
                </View>
            </View>

            <ScreenActions style={styles.actions}>
                <AppButton fullWidth label={t('tracking:logged.done')} onPress={handleDone} />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    card: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[4],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    header: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    goalBox: {
        width: '100%',
        gap: theme.spacing[4],
        padding: theme.spacing[2],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    goalProgress: {
        width: '100%',
        gap: theme.spacing[1],
    },
    goalRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    goalValue: {
        color: theme.colors.semantic.ocean,
    },
    actions: {
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
}));
