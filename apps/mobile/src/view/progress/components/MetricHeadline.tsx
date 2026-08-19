import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface MetricHeadlineValue {
    label: string;
    /** Formatted number without its unit («76.1»). */
    value: string;
    unit: string;
    /** Tints the big number — the goal card uses Semantic/ocean. */
    valueColor?: string;
    /** Extra note beside the unit («+3.9 до цілі»). */
    note?: string;
    noteColor?: string;
}

export interface MetricHeadlineProps {
    current: MetricHeadlineValue;
    goal: MetricHeadlineValue;
}

/** The two big cards at the top of a metric's screen (673:32324). */
export const MetricHeadline = ({ current, goal }: MetricHeadlineProps) => (
    <View style={styles.row}>
        {[current, goal].map((item, index) => (
            <View key={index === 0 ? 'current' : 'goal'} style={styles.card}>
                <AppText variant="bodySmallReg" style={styles.centered}>
                    {item.label}
                </AppText>
                <AppText
                    variant="displayMedium"
                    style={[styles.value, item.valueColor ? { color: item.valueColor } : null]}
                >
                    {item.value}
                </AppText>
                <View style={styles.footnote}>
                    <AppText variant="bodySmallReg" style={styles.muted}>
                        {item.unit}
                    </AppText>
                    {item.note ? (
                        <AppText variant="bodySmallReg" style={item.noteColor ? { color: item.noteColor } : undefined}>
                            {item.note}
                        </AppText>
                    ) : null}
                </View>
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
    card: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        gap: theme.spacing[1],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    centered: {
        textAlign: 'center',
    },
    value: {
        // display/medium is 32/1.4 — the only place the app uses it.
        textAlign: 'center',
    },
    footnote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
