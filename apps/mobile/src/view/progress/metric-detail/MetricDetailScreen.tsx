import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppScreen, AppText, CircleBackButton, SegmentedControl } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../assets/icons/add.svg';
import FireIcon from '../../../../assets/icons/fire.svg';
import HeightIcon from '../../../../assets/icons/height-measure.svg';
import RulerIcon from '../../../../assets/icons/ruler.svg';
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
    waist: 'progress:waist.title',
    height: 'progress:height.title',
} as const;

/** One tracked metric in full (673:31511, 673:32949, 673:51349, 673:38831, 673:39829, 673:40857). */
export const MetricDetailScreen = () => {
    const { t } = useAppTranslation(['progress']);
    const { theme } = useUnistyles();
    const {
        metric,
        isReading,
        canAdd,
        chartTitle,
        headline,
        headlineDirection,
        statRows,
        linePoints,
        lineAxis,
        bars,
        records,
        goalValue,
        unit,
        nutrientTab,
        setNutrientTab,
        format,
        handleAdd,
        handleEditGoal,
        handleReminders,
    } = useMetricDetailScreen();

    const icon = {
        weight: <ScaleIcon width={16} height={16} color={theme.colors.semantic.ocean} />,
        calories: <FireIcon width={16} height={16} color={theme.colors.semantic.orange} />,
        water: <WaterDropIcon width={16} height={16} color={theme.colors.semantic.ocean} />,
        steps: <StepsIcon width={16} height={16} color={theme.colors.semantic.ocean} />,
        waist: <RulerIcon width={16} height={16} color={theme.colors.semantic.ocean} />,
        height: <HeightIcon width={16} height={16} color={theme.colors.semantic.ocean} />,
    }[metric];

    const iconBackground = metric === 'calories' ? theme.colors.semantic.lightOrange : theme.colors.semantic.lightOcean;

    // Waist and height have no goal to edit and no reminders in the design.
    const actions =
        metric === 'waist' || metric === 'height'
            ? []
            : metric === 'weight' || metric === 'steps'
              ? [
                    { key: 'edit-goal', label: t('progress:actions.edit-goal'), onPress: handleEditGoal },
                    { key: 'reminders', label: t('progress:actions.reminders'), onPress: handleReminders },
                ]
              : [{ key: 'edit-goal', label: t('progress:actions.edit-goal'), onPress: handleEditGoal }];

    const legend =
        metric === 'calories'
            ? [
                  { key: 'planned', label: t('progress:legend.planned'), color: theme.colors.semantic.ocean },
                  { key: 'eaten', label: t('progress:legend.eaten'), color: theme.colors.branding.accent },
                  { key: 'under', label: t('progress:legend.under'), color: theme.colors.semantic.orange },
                  { key: 'over', label: t('progress:legend.over'), color: theme.colors.semantic.negative },
              ]
            : metric === 'waist'
              ? [
                    { key: 'within', label: t('progress:detail.within-norm'), color: theme.colors.semantic.positive },
                    { key: 'over', label: t('progress:legend.over'), color: theme.colors.semantic.negative },
                ]
              : [
                    {
                        key: 'done',
                        label: t(metric === 'steps' ? 'progress:legend.done' : 'progress:legend.eaten'),
                        color: theme.colors.branding.accent,
                    },
                    { key: 'under', label: t('progress:legend.under'), color: theme.colors.semantic.orange },
                ];

    return (
        <AppScreen>
            <View style={styles.topBar}>
                <CircleBackButton />
                <AppText variant="bodyLargeBold" accessibilityRole="header" style={styles.topTitle}>
                    {t(TITLE_KEY[metric])}
                </AppText>
                {canAdd ? (
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
                <MetricHeadline cards={headline} direction={headlineDirection} />

                {actions.length > 0 ? <MetricActions actions={actions} /> : null}

                {statRows.length > 0 ? <MetricStatBoxes rows={statRows} /> : null}

                <View style={styles.card}>
                    <AppText variant="bodyLargeBold" style={styles.cardTitle}>
                        {chartTitle}
                    </AppText>

                    {isReading ? (
                        <>
                            <MetricLineChart points={linePoints} axis={lineAxis} />
                            {metric === 'waist' ? <ChartLegend items={legend} /> : null}
                        </>
                    ) : (
                        <>
                            <MetricBarChart groups={bars.groups} axis={bars.axis} max={bars.max} />
                            <ChartLegend items={legend} />
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
                                    isReading
                                        ? t('progress:detail.reading', { value: record.value.toFixed(1), unit })
                                        : record.title
                                }
                                subtitle={isReading ? record.title : undefined}
                                value={
                                    isReading
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
                                    isReading
                                        ? (record.delta ?? 0) > 0
                                            ? theme.colors.semantic.positive
                                            : (record.delta ?? 0) < 0
                                              ? theme.colors.semantic.negative
                                              : theme.colors.semantic.darkGrey
                                        : record.value >= goalValue
                                          ? theme.colors.branding.accent
                                          : theme.colors.semantic.orange
                                }
                                progress={isReading ? undefined : goalValue > 0 ? record.value / goalValue : 0}
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
