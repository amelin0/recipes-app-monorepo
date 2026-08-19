import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, ProgressBar } from '@/shared/ui/components';

export interface MetricRecordRowProps {
    /** 16px glyph shown in the tinted box. */
    icon: React.ReactNode;
    /** Tint behind the icon. */
    iconBackground: string;
    /** Headline of the row — the reading, or the day it belongs to. */
    title: string;
    /** Supporting line under the title; the goal variant has none. */
    subtitle?: string;
    /** Right-hand value: a delta («+4.4 кг») or a progress readout. */
    value: string;
    valueColor?: string;
    /** Renders a progress bar under the row, 0..1. */
    progress?: number;
    progressColor?: string;
    /** Hairline under the row; the last one goes without. @default true */
    divided?: boolean;
}

/**
 * One line of the «Записи» list. Weight logs a reading and its delta
 * (673:32911); the daily metrics log a day against its goal (673:51460).
 */
export const MetricRecordRow = ({
    icon,
    iconBackground,
    title,
    subtitle,
    value,
    valueColor,
    progress,
    progressColor,
    divided = true,
}: MetricRecordRowProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.row(divided)}>
            <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>{icon}</View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <View style={styles.titleBlock}>
                        <AppText variant={subtitle ? 'bodyLargeBold' : 'bodyMediumBold'}>{title}</AppText>
                        {subtitle ? (
                            <AppText variant="bodySmallReg" style={styles.muted}>
                                {subtitle}
                            </AppText>
                        ) : null}
                    </View>
                    <AppText variant="bodySmallBold" style={valueColor ? { color: valueColor } : styles.muted}>
                        {value}
                    </AppText>
                </View>

                {progress === undefined ? null : (
                    <ProgressBar
                        progress={progress}
                        height={4}
                        color={progressColor ?? theme.colors.semantic.positive}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: (divided: boolean) => ({
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingVertical: theme.spacing[3],
        borderBottomWidth: divided ? 1 : 0,
        borderBottomColor: theme.colors.semantic.lightGrey,
    }),
    iconBox: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.md,
    },
    content: {
        flex: 1,
        minWidth: 0,
        gap: theme.spacing[1],
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing[2],
    },
    titleBlock: {
        flex: 1,
        minWidth: 0,
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
