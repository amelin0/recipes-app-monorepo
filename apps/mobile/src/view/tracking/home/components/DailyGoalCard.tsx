import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppCard, AppText, type MacroKey } from '@/shared/ui/components';
import { GaugeChart } from '@/shared/ui/widgets';
import { useAppTranslation } from '@/shared/utils/translations';

import ArrowRightIcon from '../../../../../assets/icons/arrow-right.svg';

import { MacroTile } from './MacroTile';

export interface MacroData {
    key: MacroKey;
    current: number;
    target: number;
}

export interface DailyGoalCardProps {
    caloriesCurrent: number;
    caloriesTarget: number;
    macros: MacroData[];
    onPress: () => void;
}

const formatNumber = (value: number) => value.toLocaleString('en-US');

/** RFDS `chart speed` box — see GaugeChart's `frame` (435:5999). */
const GAUGE_FRAME = { width: 224, height: 188, offsetTop: 17, contentOffsetY: -5 };

export const DailyGoalCard = ({ caloriesCurrent, caloriesTarget, macros, onPress }: DailyGoalCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);

    return (
        <AppCard>
            <Pressable accessibilityRole="button" onPress={onPress} style={styles.header}>
                <AppText variant="bodyLargeBold" style={styles.headerTitle}>
                    {t('tracking:home.daily-goal')}
                </AppText>
                <ArrowRightIcon width={16} height={16} color={theme.colors.elements.primary} />
            </Pressable>

            <GaugeChart progress={caloriesTarget > 0 ? caloriesCurrent / caloriesTarget : 0} frame={GAUGE_FRAME}>
                <AppText variant="titleLarge">{formatNumber(caloriesCurrent)}</AppText>
                <AppText variant="bodySmallReg" style={styles.gaugeSubtitle}>
                    {t('tracking:home.of-kcal', { value: formatNumber(caloriesTarget) })}
                </AppText>
            </GaugeChart>

            <View style={styles.macros}>
                {macros.map(macro => (
                    <MacroTile key={macro.key} macroKey={macro.key} current={macro.current} target={macro.target} />
                ))}
            </View>
        </AppCard>
    );
};

const styles = StyleSheet.create(theme => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerTitle: {
        flex: 1,
    },
    gaugeSubtitle: {
        color: theme.colors.active.secondary,
    },
    macros: {
        flexDirection: 'row',
        gap: theme.spacing[1],
        width: '100%',
    },
}));
