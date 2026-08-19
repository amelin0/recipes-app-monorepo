import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import InfoCircleIcon from '../../../../assets/icons/info-circle.svg';
import MascotHeight from '../../../../assets/images/brand/mascot-height.svg';
import MascotSteps from '../../../../assets/images/brand/mascot-steps.svg';
import MascotWaist from '../../../../assets/images/brand/mascot-waist.svg';
import MascotWater from '../../../../assets/images/brand/mascot-water.svg';
import MascotWeight from '../../../../assets/images/brand/mascot-weight.svg';

import { useMetricUpdatedScreen } from './useMetricUpdatedScreen';

const MASCOT_SIZE = 200;

/**
 * A goal reads as a rate — «5,000 кроків/день» — where a reading is just the
 * amount (673:51308 vs 673:43309).
 */
const UNIT_KEY = {
    reading: {
        weight: 'progress:units.kg',
        waist: 'progress:units.cm',
        height: 'progress:units.cm',
        steps: 'progress:units.steps',
        water: 'progress:units.ml',
    },
    goal: {
        weight: 'progress:units.kg',
        waist: 'progress:units.cm',
        height: 'progress:units.cm',
        steps: 'progress:units.steps-per-day',
        water: 'progress:units.ml-per-day',
    },
} as const;

/** Receipt for a reading just logged (673:43135, 673:43255, 673:43309). */
export const MetricUpdatedScreen = () => {
    const { t } = useAppTranslation(['progress']);
    const { theme } = useUnistyles();
    const { metric, isGoal, value, date, recommendedGoal, showsWaistNote, handleDone, handleConfirmGoal } =
        useMetricUpdatedScreen();

    const Mascot = {
        weight: MascotWeight,
        waist: MascotWaist,
        height: MascotHeight,
        steps: MascotSteps,
        water: MascotWater,
    }[metric];
    const unit = t(UNIT_KEY[isGoal ? 'goal' : 'reading'][metric]);
    // Only a new weight reading opens the calorie-goal question (673:43135).
    const offersGoalChange = !isGoal && metric === 'weight';

    return (
        <AppScreen>
            {/* The design lays this out on an 812pt frame; on a short device the
                mascot plus both cards overflow, so the middle scrolls. */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Mascot width={MASCOT_SIZE} height={MASCOT_SIZE} />

                <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                    {t(`progress:${isGoal ? 'goal-updated' : 'updated'}.${metric}.title`)}
                </AppText>

                <View style={styles.card}>
                    {isGoal ? (
                        <AppText variant="bodyLargeBold" style={styles.centered}>
                            {t('progress:goal-updated.label')}
                        </AppText>
                    ) : offersGoalChange ? (
                        <AppText variant="bodyLargeBold" style={styles.centered}>
                            {t('progress:updated.weight.praise')}
                        </AppText>
                    ) : null}

                    <View style={styles.reading}>
                        <AppText variant="titleMedium" style={[styles.centered, styles.accent]}>
                            {value} {unit}
                        </AppText>
                        <AppText variant="bodyMediumReg" style={[styles.centered, styles.muted]}>
                            {date}
                        </AppText>
                    </View>

                    {showsWaistNote ? (
                        <View style={styles.note}>
                            <InfoCircleIcon width={20} height={20} color={theme.colors.semantic.positive} />
                            <AppText variant="bodySmallReg" style={styles.noteText}>
                                {t('progress:updated.waist.note')}
                            </AppText>
                        </View>
                    ) : null}
                </View>

                {offersGoalChange ? (
                    <View style={styles.card}>
                        <AppText variant="bodySmallReg" style={styles.centered}>
                            {t('progress:updated.weight.goal-hint')}
                        </AppText>
                        <AppText variant="titleLarge" style={styles.centered}>
                            {t('progress:nutrients.kcal', { value: recommendedGoal })}
                        </AppText>
                    </View>
                ) : null}
            </ScrollView>

            <ScreenActions style={styles.actions}>
                {offersGoalChange ? (
                    <>
                        <AppButton fullWidth label={t('progress:updated.weight.confirm')} onPress={handleConfirmGoal} />
                        <AppButton
                            fullWidth
                            variant="secondary"
                            label={t('progress:updated.weight.skip')}
                            onPress={handleDone}
                        />
                    </>
                ) : (
                    <AppButton fullWidth label={t('progress:updated.done')} onPress={handleDone} />
                )}
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flexGrow: 1,
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
    accent: {
        color: theme.colors.semantic.positive,
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
    reading: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    note: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.semantic.positive,
        backgroundColor: theme.colors.semantic.lightPositive,
    },
    noteText: {
        flex: 1,
        minWidth: 0,
    },
    actions: {
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
}));
