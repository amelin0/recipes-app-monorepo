import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppScreen, AppText, PageDots, SegmentedControl } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { ChartLegend, MetricActions, MetricBarChart, MetricCard, MetricLineChart, MetricStats } from '../components';

import { useProgressOverviewScreen } from './useProgressOverviewScreen';

/** Every tracked metric of the profile, one card each (670:26709). */
export const ProgressOverviewScreen = () => {
    const { t } = useAppTranslation(['progress']);
    const { theme } = useUnistyles();
    const {
        weight,
        calories,
        water,
        steps,
        waist,
        height,
        nutrientTab,
        setNutrientTab,
        format,
        handleMetricPress,
        handleEditGoal,
        handleReminders,
        handleAdd,
    } = useProgressOverviewScreen();

    const editGoal = { key: 'edit-goal', label: t('progress:actions.edit-goal'), onPress: handleEditGoal };

    return (
        <AppScreen>
            <View style={styles.header}>
                <AppText variant="titleMedium" accessibilityRole="header">
                    {t('progress:title')}
                </AppText>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <MetricCard
                    title={t('progress:weight.title')}
                    subtitle={t('progress:weight.subtitle')}
                    onPress={handleMetricPress}
                >
                    <MetricStats
                        stats={[
                            {
                                key: 'start',
                                value: t('progress:weight.kg', { value: weight.startKg.toFixed(1) }),
                                label: t('progress:labels.start'),
                                color: theme.colors.semantic.orange,
                            },
                            {
                                key: 'current',
                                value: t('progress:weight.kg', { value: weight.currentKg.toFixed(1) }),
                                label: t('progress:labels.current-f'),
                            },
                            {
                                key: 'goal',
                                value: t('progress:weight.kg', { value: weight.goalKg.toFixed(1) }),
                                label: t('progress:labels.goal'),
                                color: theme.colors.semantic.ocean,
                            },
                        ]}
                    />
                    <MetricLineChart points={weight.points} axis={weight.axis} />
                    <MetricActions
                        actions={[
                            editGoal,
                            { key: 'reminders', label: t('progress:actions.reminders'), onPress: handleReminders },
                        ]}
                        onAdd={handleAdd}
                        addLabel={t('progress:weight.add-a11y')}
                    />
                </MetricCard>

                <MetricCard
                    title={t('progress:nutrients.title')}
                    subtitle={t('progress:nutrients.subtitle')}
                    onPress={handleMetricPress}
                >
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
                    <MetricStats
                        stats={[
                            {
                                key: 'average',
                                value: t('progress:nutrients.kcal', { value: format(calories.averagePerDay) }),
                                label: t('progress:labels.daily-average'),
                                color: theme.colors.semantic.orange,
                            },
                            {
                                key: 'goal',
                                value: t('progress:nutrients.kcal', { value: format(calories.goalPerDay) }),
                                label: t('progress:labels.daily-goal'),
                                color: theme.colors.semantic.ocean,
                            },
                        ]}
                    />
                    <MetricBarChart groups={calories.groups} axis={calories.axis} max={calories.max} />
                    <PageDots count={2} activeIndex={1} size="lg" />
                    <ChartLegend
                        items={[
                            {
                                key: 'planned',
                                label: t('progress:legend.planned'),
                                color: theme.colors.semantic.ocean,
                            },
                            { key: 'eaten', label: t('progress:legend.eaten'), color: theme.colors.branding.accent },
                            { key: 'under', label: t('progress:legend.under'), color: theme.colors.semantic.orange },
                            { key: 'over', label: t('progress:legend.over'), color: theme.colors.semantic.negative },
                        ]}
                    />
                    <MetricActions actions={[editGoal]} />
                </MetricCard>

                <MetricCard
                    title={t('progress:water.title')}
                    subtitle={t('progress:water.subtitle', { value: format(water.goalMl) })}
                    onPress={handleMetricPress}
                >
                    <MetricStats
                        stats={[
                            {
                                key: 'average',
                                value: t('progress:water.ml', { value: format(water.averageMl) }),
                                label: t('progress:labels.daily-average'),
                                color: theme.colors.semantic.orange,
                            },
                            {
                                key: 'goal',
                                value: t('progress:water.ml', { value: format(water.goalMl) }),
                                label: t('progress:labels.daily-goal'),
                                color: theme.colors.semantic.ocean,
                            },
                        ]}
                    />
                    <MetricBarChart groups={water.groups} axis={water.axis} max={water.max} />
                    <PageDots count={2} activeIndex={1} size="lg" />
                    <MetricActions actions={[editGoal]} />
                </MetricCard>

                <MetricCard
                    title={t('progress:steps.title')}
                    subtitle={t('progress:steps.subtitle')}
                    onPress={handleMetricPress}
                >
                    <MetricStats
                        stats={[
                            {
                                key: 'average',
                                value: t('progress:steps.count', { value: format(steps.averagePerDay) }),
                                label: t('progress:labels.daily-average'),
                                color: theme.colors.semantic.orange,
                            },
                            {
                                key: 'goal',
                                value: t('progress:steps.count', { value: format(steps.goalPerDay) }),
                                label: t('progress:labels.daily-goal'),
                                color: theme.colors.semantic.ocean,
                            },
                        ]}
                    />
                    <MetricBarChart groups={steps.groups} axis={steps.axis} max={steps.max} />
                    <PageDots count={2} activeIndex={1} size="lg" />
                    <MetricActions actions={[editGoal]} onAdd={handleAdd} addLabel={t('progress:steps.add-a11y')} />
                </MetricCard>

                <MetricCard
                    title={t('progress:waist.title')}
                    subtitle={t('progress:waist.subtitle')}
                    onPress={handleMetricPress}
                >
                    <MetricStats
                        stats={[
                            {
                                key: 'start',
                                value: t('progress:waist.cm', { value: waist.startCm }),
                                label: t('progress:labels.start'),
                                color: theme.colors.semantic.orange,
                            },
                            {
                                key: 'current',
                                value: t('progress:waist.cm', { value: waist.currentCm }),
                                label: t('progress:labels.current-f'),
                            },
                        ]}
                    />
                    <MetricLineChart points={waist.points} axis={waist.axis} />
                    <MetricActions
                        outlined
                        actions={[{ key: 'add-waist', label: t('progress:waist.add'), onPress: handleAdd }]}
                    />
                </MetricCard>

                <MetricCard
                    title={t('progress:height.title')}
                    subtitle={t('progress:height.subtitle')}
                    onPress={handleMetricPress}
                >
                    <MetricStats
                        stats={[
                            {
                                key: 'start',
                                value: t('progress:height.cm', { value: height.startCm }),
                                label: t('progress:labels.start'),
                                color: theme.colors.semantic.orange,
                            },
                            {
                                key: 'current',
                                value: t('progress:height.cm', { value: height.currentCm }),
                                label: t('progress:labels.current-m'),
                            },
                        ]}
                    />
                    <MetricLineChart points={height.points} axis={height.axis} />
                    <MetricActions
                        outlined
                        actions={[{ key: 'add-height', label: t('progress:height.add'), onPress: handleAdd }]}
                    />
                </MetricCard>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    header: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[5],
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: 120,
        gap: theme.spacing[4],
    },
}));
