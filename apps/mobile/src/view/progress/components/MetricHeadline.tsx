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
    /**
     * One card per value. Metrics with a goal show two side by side
     * (673:32324); waist stacks its reading over a recommendation and height
     * has only the reading (1024:31123, 686:14432).
     */
    cards: MetricHeadlineValue[];
    /**
     * Two values that compare (reading vs goal) sit side by side; two that read
     * as separate statements stack (waist's reading over its recommendation).
     * @default 'row'
     */
    direction?: 'row' | 'column';
}

/** The big value card(s) at the top of a metric's screen. */
export const MetricHeadline = ({ cards, direction = 'row' }: MetricHeadlineProps) => (
    <View style={styles.row(direction === 'row' && cards.length > 1)}>
        {cards.map(item => (
            <View key={item.label} style={styles.card}>
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
    // Two values sit side by side; a stack of them runs down the screen.
    row: (side: boolean) => ({
        width: '100%',
        flexDirection: side ? 'row' : 'column',
        alignItems: side ? 'flex-start' : 'stretch',
        gap: theme.spacing[2],
    }),
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
