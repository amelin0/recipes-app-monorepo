import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText, ProgressBar } from '@/shared/ui/components';

export interface MacroTileProps {
    /** Single-letter macro label (Б / Ж / В). */
    letter: string;
    letterColor: string;
    letterBg: string;
    current: number;
    target: number;
    /** Unit suffix rendered small (г). */
    unit: string;
    /** Progress fill color (status: on-track / behind / over). */
    barColor: string;
}

export const MacroTile = ({ letter, letterColor, letterBg, current, target, unit, barColor }: MacroTileProps) => {
    const progress = target > 0 ? current / target : 0;

    return (
        <View style={styles.tile}>
            <View style={styles.info}>
                <View style={[styles.badge, { backgroundColor: letterBg }]}>
                    <AppText variant="bodySmallReg" style={{ color: letterColor }}>
                        {letter}
                    </AppText>
                </View>
                <AppText variant="bodySmallReg">
                    {current}/{target}
                    <AppText style={styles.unit}>{unit}</AppText>
                </AppText>
            </View>
            <ProgressBar progress={progress} color={barColor} height={3} />
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    tile: {
        flex: 1,
        padding: theme.spacing[2],
        gap: theme.spacing[1],
        borderRadius: 14,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    info: {
        gap: theme.spacing[1],
        width: '100%',
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unit: {
        fontSize: 9,
        lineHeight: 12,
    },
}));
