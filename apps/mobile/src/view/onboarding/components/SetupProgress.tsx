import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ProgressBar } from '@/shared/ui/components';

import { SETUP_STEPS } from '../onboarding.constants';

export interface SetupProgressProps {
    /** 1-based index of the current question. */
    step: number;
}

/** Questionnaire progress row — RFDS `progress` (Figma 66:2335). */
export const SetupProgress = ({ step }: SetupProgressProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.row}>
            <View style={styles.track}>
                <ProgressBar
                    progress={step / SETUP_STEPS}
                    height={6}
                    color={theme.colors.branding.accent}
                    trackColor={theme.colors.semantic.lightGrey}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        paddingHorizontal: theme.spacing[4],
        // 12 to clear the safe area + the block's own 12 of vertical padding.
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[3],
    },
    // Design insets the track by 100 on each side of the content column.
    track: {
        paddingHorizontal: 100,
    },
}));
