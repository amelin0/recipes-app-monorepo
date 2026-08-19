import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppScreen, AppText, CircleBackButton, SegmentedControl } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../assets/icons/add.svg';
import FireIcon from '../../../../assets/icons/fire.svg';
import ScaleIcon from '../../../../assets/icons/scale.svg';
import StepsIcon from '../../../../assets/icons/steps.svg';
import WaterDropIcon from '../../../../assets/icons/water-drop.svg';
import {
    ChartLegend,
    MetricActions,
    MetricBarChart,
    MetricHeadline,
    MetricLineChart,
    MetricRecordRow,
    MetricStatBoxes,
} from '../components';

import { useMetricDetailScreen } from './useMetricDetailScreen';

/** The macros card is titled «КБЖВ», so its key does not follow the metric. */
const TITLE_KEY = {
    weight: 'progress:weight.title',
    calories: 'progress:nutrients.title',
    water: 'progress:water.title',
    steps: 'progress:steps.title',
} as const;

/** One tracked metric in full (673:31511, 673:32949, 673:51349, 673:38831). */
export const MetricDetailScreen = () => {
    const { t } = useAppTranslation(['progress']);
    const { theme } = useUnistyles();
    const {
        metric,
        weight,
        calories,
        water,
        steps,
        chart,
        nutrientTab,
        setNutrientTab,
        format,
        handleAdd,
        handleEditGoal,
        handleReminders,
    } = useMetricDetailScreen();

    const isWeight = metric === 'weight';
    const editGoal = { key: 'edit-goal', label: t('progress:actions.edit-goal'), onPress: handleEditGoal };
    const reminders = { key: 'reminders', label: t('progress:actions.reminders'), onPress: handleReminders };

    const icon = {
        weight: <ScaleIcon width={16} height={16} color={theme.colors.semantic.ocean} />,
        calories: <FireIcon width={16} height={16} color={theme.colors.semantic.orange} />,
        water: <WaterDropIcon width={16} height={16} color={theme.colors.semantic.ocean} />,
        steps: <StepsIcon width={16} height={16} color={theme.colors.semantic.ocean} />,
    }[metric];

    const iconBackground = metric === 'calories' ? theme.colors.semantic.lightOrange : theme.colors.semantic.lightOcean;

    const headline = {
        weight: {
            current: {
                label: t('progress:labels.current-f'),
                value: weight.currentKg.toFixed(1),
                unit: t('progress:units.kg'),
                note: t('progress:detail.to-goal', { value: (weight.goalKg - weight.currentKg).toFixed(1) }),
                noteColor: theme.colors.semantic.positive,
            },
            goal: {
                label: t('progress:labels.goal'),
                value: String(weight.goalKg),
                unit: t('progress:units.kg'),
                valueColor: theme.colors.semantic.ocean,
            },
        },
        calories: {
            current: {
                label: t('progress:labels.today'),
                value: format(calories.todayKcal),
                unit: t('progress:units.kcal'),
                note: t('progress:detail.to-goal-plain', {
                    value: format(calories.goalKcal - calories.todayKcal),
                }),
                noteColor: theme.colors.semantic.positive,
            },
            goal: {
                label: t('progress:labels.goal'),
                value: format(calories.goalKcal),
                unit: t('progress:units.kcal'),
                valueColor: theme.colors.semantic.ocean,
            },
        },
        water: {
            current: {
                label: t('progress:labels.today'),
                value: format(water.todayMl),
                unit: t('progress:units.ml'),
            },
            goal: {
                label: t('progress:labels.goal'),
                value: format(water.goalMl),
                unit: t('progress:units.ml-per-day'),
                valueColor: theme.colors.semantic.ocean,
            },
        },
        steps: {
            current: {
                label: t('progress:labels.today'),
                value: format(steps.todaySteps),
                unit: t('progress:units.steps'),
            },
            goal: {
                label: t('progress:labels.goal'),
                value: format(steps.goalSteps),
                unit: t('progress:units.steps-per-day'),
                valueColor: theme.colors.semantic.ocean,
            },
        },
    }[metric];

    const statRows = {
        weight: [
            [
                {
                    key: 'min',
                    label: t('progress:labels.min'),
                    value: String(weight.minKg),
                    unit: t('progress:units.kg'),
                },
                {
                    key: 'avg',
                    label: t('progress:labels.average-f'),
                    value: weight.averageKg.toFixed(1),
                    unit: t('progress:units.kg'),
                },
                {
                    key: 'max',
                    label: t('progress:labels.max'),
                    value: weight.maxKg.toFixed(1),
                    unit: t('progress:units.kg'),
                },
            ],
        ],
        calories: [
            [
                {
                    key: 'min-norm',
                    label: t('progress:detail.min-norm'),
                    value: `<${format(calories.minNormKcal)}`,
                    unit: t('progress:units.kcal-per-day'),
                },
                {
                    key: 'max-norm',
                    label: t('progress:detail.max-norm'),
                    value: `>${format(calories.maxNormKcal)}`,
                    unit: t('progress:units.kcal-per-day'),
                },
            ],
            [
                {
                    key: 'under',
                    label: t('progress:legend.under'),
                    value: String(calories.daysUnder),
                    unit: t('progress:detail.of-days', { value: calories.daysTotal }),
                },
                {
                    key: 'within',
                    label: t('progress:detail.within-norm'),
                    value: String(calories.daysWithin),
                    unit: t('progress:detail.of-days', { value: calories.daysTotal }),
                },
                {
                    key: 'outside',
                    label: t('progress:detail.outside-norm'),
                    value: String(calories.daysOver),
                    unit: t('progress:detail.of-days', { value: calories.daysTotal }),
                },
            ],
        ],
        water: [
            [
                {
                    key: 'min',
                    label: t('progress:labels.min'),
                    value: format(water.minMl),
                    unit: t('progress:units.ml-per-day'),
                },
                {
                    key: 'avg',
                    label: t('progress:labels.average-n'),
                    value: format(water.averageMl),
                    unit: t('progress:units.ml-per-day'),
                },
                {
                    key: 'max',
                    label: t('progress:labels.max'),
                    value: format(water.maxMl),
                    unit: t('progress:units.ml-per-day'),
                },
            ],
        ],
        steps: [
            [
                {
                    key: 'min',
                    label: t('progress:labels.min'),
                    value: format(steps.minSteps),
                    unit: t('progress:units.steps-per-day'),
                },
                {
                    key: 'avg',
                    label: t('progress:labels.average-f'),
                    value: format(steps.averageSteps),
                    unit: t('progress:units.steps-per-day'),
                },
                {
                    key: 'max',
                    label: t('progress:labels.max'),
                    value: format(steps.maxSteps),
                    unit: t('progress:units.steps-per-day'),
                },
            ],
        ],
    }[metric];

    const goalValue = { weight: 0, calories: calories.goalKcal, water: water.goalMl, steps: steps.goalSteps }[metric];
    const unit = {
        weight: t('progress:units.kg'),
        calories: t('progress:units.kcal'),
        water: t('progress:units.ml'),
        steps: t('progress:units.steps'),
    }[metric];
    const records = { weight: weight.records, calories: calories.records, water: water.records, steps: steps.records }[
        metric
    ];

    return (
        <AppScreen>
            <View style={styles.topBar}>
                <CircleBackButton />
                <AppText variant="bodyLargeBold" accessibilityRole="header" style={styles.topTitle}>
                    {t(TITLE_KEY[metric])}
                </AppText>
                {isWeight || metric === 'steps' ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('progress:detail.add-a11y')}
                        onPress={handleAdd}
                        style={styles.addButton}
                    >
                        <AddIcon width={20} height={20} color={theme.colors.elements.primary} />
                    </Pressable>
                ) : (
                    // Keeps the title centred where the design has no add button.
                    <View style={styles.addSpacer} />
                )}
            </View>

            {metric === 'calories' ? (
                <View style={styles.tabs}>
                    <SegmentedControl
                        items={[
                            { key: 'calories', label: t('progress:nutrients.tabs.calories') },
                            { key: 'protein', label: t('progress:nutrients.tabs.protein') },
                            { key: 'fats', label: t('progress:nutrients.tabs.fats') },
                            { key: 'carbs', label: t('progress:nutrients.tabs.carbs') },
                        ]}
                        activeKey={nutrientTab}
                        onChange={setNutrientTab}
                    />
                </View>
            ) : null}

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <MetricHeadline current={headline.current} goal={headline.goal} />

                <MetricActions actions={isWeight || metric === 'steps' ? [editGoal, reminders] : [editGoal]} />

                <MetricStatBoxes rows={statRows} />

                <View style={styles.card}>
                    <AppText variant="bodyLargeBold" style={styles.cardTitle}>
                        {isWeight ? t('progress:detail.dynamics') : t('progress:detail.dynamics-days', { value: 28 })}
                    </AppText>

                    {isWeight ? (
                        <MetricLineChart points={weight.points} axis={weight.axis} />
                    ) : (
                        <>
                            <MetricBarChart groups={chart.groups} axis={chart.axis} max={chart.max} />
                            <ChartLegend
                                items={
                                    metric === 'calories'
                                        ? [
                                              {
                                                  key: 'planned',
                                                  label: t('progress:legend.planned'),
                                                  color: theme.colors.semantic.ocean,
                                              },
                                              {
                                                  key: 'eaten',
                                                  label: t('progress:legend.eaten'),
                                                  color: theme.colors.branding.accent,
                                              },
                                              {
                                                  key: 'under',
                                                  label: t('progress:legend.under'),
                                                  color: theme.colors.semantic.orange,
                                              },
                                              {
                                                  key: 'over',
                                                  label: t('progress:legend.over'),
                                                  color: theme.colors.semantic.negative,
                                              },
                                          ]
                                        : [
                                              {
                                                  key: 'done',
                                                  label: t(
                                                      metric === 'steps'
                                                          ? 'progress:legend.done'
                                                          : 'progress:legend.eaten',
                                                  ),
                                                  color: theme.colors.branding.accent,
                                              },
                                              {
                                                  key: 'under',
                                                  label: t('progress:legend.under'),
                                                  color: theme.colors.semantic.orange,
                                              },
                                          ]
                                }
                            />
                        </>
                    )}
                </View>

                <View style={styles.card}>
                    <AppText variant="bodyLargeBold" style={styles.cardTitle}>
                        {t('progress:detail.records')}
                    </AppText>

                    <View style={styles.list}>
                        {records.map((record, index) => (
                            <MetricRecordRow
                                key={record.id}
                                icon={icon}
                                iconBackground={iconBackground}
                                title={
                                    isWeight
                                        ? t('progress:detail.reading', {
                                              value: record.value.toFixed(1),
                                              unit,
                                          })
                                        : record.title
                                }
                                subtitle={isWeight ? record.title : undefined}
                                value={
                                    isWeight
                                        ? // The first ever reading has nothing to compare against, and
                                          // the design leaves its right side empty (673:32938).
                                          record.delta === undefined
                                            ? ''
                                            : t('progress:detail.delta', {
                                                  value: record.delta > 0 ? `+${record.delta}` : record.delta,
                                                  unit,
                                              })
                                        : t('progress:detail.of-goal', {
                                              value: format(record.value),
                                              goal: format(goalValue),
                                              unit,
                                          })
                                }
                                valueColor={
                                    isWeight
                                        ? (record.delta ?? 0) > 0
                                            ? theme.colors.semantic.positive
                                            : (record.delta ?? 0) < 0
                                              ? theme.colors.semantic.negative
                                              : theme.colors.semantic.darkGrey
                                        : record.value >= goalValue
                                          ? theme.colors.branding.accent
                                          : theme.colors.semantic.orange
                                }
                                progress={isWeight ? undefined : goalValue > 0 ? record.value / goalValue : 0}
                                progressColor={
                                    record.value >= goalValue
                                        ? theme.colors.branding.accent
                                        : theme.colors.semantic.orange
                                }
                                divided={index < records.length - 1}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    topBar: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
    },
    topTitle: {
        flex: 1,
        textAlign: 'center',
    },
    addButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    addSpacer: {
        width: 44,
        height: 44,
    },
    tabs: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[2],
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: 120,
        gap: theme.spacing[4],
    },
    card: {
        width: '100%',
        gap: theme.spacing[4],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    cardTitle: {
        width: '100%',
    },
    list: {
        width: '100%',
    },
}));
