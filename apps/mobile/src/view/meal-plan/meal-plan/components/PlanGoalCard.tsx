import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { formatThousands } from '@/shared/helpers';
import { AppCard, AppText, MacroBadge, macroPalette, type MacroKey } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import type { PlanDay, PlanMetric, PlanMetricTone, PlanTip } from '../../meal-plan.constants';

export interface PlanGoalCardProps {
    day: PlanDay;
    onChangeGoal: () => void;
}

const MACRO_KEYS: { key: MacroKey; metric: 'protein' | 'fats' | 'carbs' }[] = [
    { key: 'protein', metric: 'protein' },
    { key: 'fats', metric: 'fats' },
    { key: 'carbs', metric: 'carbs' },
];

/** «Заплановано на день» — metric boxes with 3pt bars and the advisory (961:59214). */
export const PlanGoalCard = ({ day, onChangeGoal }: PlanGoalCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['meal-plan', 'tracking']);
    const palette = macroPalette(theme.colors);

    const toneColor = (tone: PlanMetricTone) =>
        tone === 'negative'
            ? theme.colors.semantic.negative
            : tone === 'positive'
              ? theme.colors.semantic.positive
              : tone === 'progress'
                ? theme.colors.semantic.orange
                : theme.colors.elements.primary;

    const valueColor = (metricValue: PlanMetric) =>
        metricValue.valueTone ? toneColor(metricValue.valueTone) : theme.colors.elements.primary;

    const renderBar = (metricValue: PlanMetric) => {
        const ratio = metricValue.target > 0 ? Math.min(metricValue.current / metricValue.target, 1) : 0;
        return (
            <View style={styles.track}>
                {metricValue.tone !== 'neutral' ? (
                    <View
                        style={[
                            styles.fill,
                            { width: `${ratio * 100}%`, backgroundColor: toneColor(metricValue.tone) },
                        ]}
                    />
                ) : null}
            </View>
        );
    };

    return (
        <AppCard>
            <View style={styles.header}>
                <AppText variant="bodyLargeBold">{t('meal-plan:screen.planned-for-day')}</AppText>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={onChangeGoal}>
                    <AppText variant="bodySmallReg" style={styles.changeGoal}>
                        {t('meal-plan:screen.change-goal')}
                    </AppText>
                </Pressable>
            </View>

            <View style={styles.metrics}>
                <View style={[styles.metricBox, styles.kcalBox]}>
                    <View style={styles.kcalChip}>
                        <AppText variant="bodySmallReg">{t('meal-plan:screen.kcal-chip')}</AppText>
                    </View>
                    <AppText variant="bodySmallReg" style={{ color: valueColor(day.kcal) }}>
                        {t('meal-plan:screen.goal-value', {
                            current: formatThousands(day.kcal.current),
                            target: formatThousands(day.kcal.target),
                        })}
                    </AppText>
                    {renderBar(day.kcal)}
                </View>

                {MACRO_KEYS.map(({ key, metric }) => (
                    <View key={key} style={styles.metricBox}>
                        <MacroBadge
                            letter={t(`tracking:home.macros.${key}`)}
                            color={palette[key].color}
                            backgroundColor={palette[key].backgroundColor}
                        />
                        <AppText
                            variant="bodySmallReg"
                            numberOfLines={1}
                            style={{ color: toneColor(day[metric].tone) }}
                        >
                            {t('meal-plan:screen.goal-value-grams', {
                                current: day[metric].current,
                                target: day[metric].target,
                            })}
                        </AppText>
                        {renderBar(day[metric])}
                    </View>
                ))}
            </View>

            {day.tip !== 'none' ? <PlanTipCard tip={day.tip} /> : null}
        </AppCard>
    );
};

/** The advisory under the metrics — red warning or green tip (435:14137, 435:14322). */
const PlanTipCard = ({ tip }: { tip: Exclude<PlanTip, 'none'> }) => {
    const { t } = useAppTranslation(['meal-plan']);
    const warning = tip !== 'near';

    return (
        <View style={styles.tip(warning)}>
            <AppText variant="bodySmallReg">
                <AppText variant="bodySmallBold" style={styles.tipLabel(warning)}>
                    {t(warning ? 'meal-plan:tips.attention-label' : 'meal-plan:tips.tip-label')}
                </AppText>{' '}
                {t(`meal-plan:tips.${tip}`)}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    changeGoal: {
        color: theme.colors.branding.accent,
    },
    metrics: {
        flexDirection: 'row',
        gap: theme.spacing[1],
        width: '100%',
    },
    metricBox: {
        flex: 1,
        gap: theme.spacing[1],
        padding: theme.spacing[2],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    // 107pt vs three 64pt boxes in the design row (961:59959).
    kcalBox: {
        flexGrow: 107 / 64,
    },
    kcalChip: {
        alignSelf: 'flex-start',
        height: 20,
        paddingHorizontal: theme.spacing[1],
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
    },
    track: {
        width: '100%',
        height: 3,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
        overflow: 'hidden',
    },
    fill: {
        height: 3,
        borderRadius: theme.radius.full,
    },
    tip: (warning: boolean) => ({
        width: '100%',
        paddingHorizontal: theme.spacing[2] + 1,
        paddingVertical: theme.spacing[3] + 1,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: warning ? theme.colors.semantic.negative : theme.colors.branding.accent,
        backgroundColor: warning ? theme.colors.semantic.lightNegative : theme.colors.branding.accentSubtle,
    }),
    tipLabel: (warning: boolean) => ({
        color: warning ? theme.colors.semantic.negative : theme.colors.branding.accent,
    }),
}));
