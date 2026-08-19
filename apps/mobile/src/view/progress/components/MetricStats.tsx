import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface MetricStat {
    key: string;
    /** Formatted number with its unit («64.0 кг»). */
    value: string;
    label: string;
    /** Tints the value; the neutral one keeps Elements/primary. */
    color?: string;
}

export interface MetricStatsProps {
    stats: MetricStat[];
}

/** Start / current / goal chips under a metric's title (670:26718). */
export const MetricStats = ({ stats }: MetricStatsProps) => (
    <View style={styles.row}>
        {stats.map(stat => (
            <View key={stat.key} style={styles.chip}>
                <AppText variant="bodyMediumBold" style={[styles.centered, stat.color ? { color: stat.color } : null]}>
                    {stat.value}
                </AppText>
                <AppText variant="bodySmallReg" style={[styles.centered, styles.label]}>
                    {stat.label}
                </AppText>
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create(theme => ({
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[2],
    },
    chip: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        padding: theme.spacing[2],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    centered: {
        textAlign: 'center',
    },
    label: {
        color: theme.colors.semantic.darkGrey,
    },
}));
