import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import ArrowRightIcon from '../../../../../assets/icons/arrow-right.svg';

export interface GoalParam {
    key: string;
    label: string;
    value: string;
    onPress: () => void;
}

export interface GoalParamsSectionProps {
    /** Weight and height share a row; activity takes its own (811:53468). */
    pair: [GoalParam, GoalParam];
    full: GoalParam;
}

const ParamBox = ({ param }: { param: GoalParam }) => {
    const { theme } = useUnistyles();

    return (
        <Pressable accessibilityRole="button" onPress={param.onPress} style={styles.box}>
            <View style={styles.labels}>
                <AppText variant="bodySmallReg" style={styles.label}>
                    {param.label}
                </AppText>
                <AppText variant="bodyLargeBold">{param.value}</AppText>
            </View>
            <ArrowRightIcon width={16} height={16} color={theme.colors.elements.primary} />
        </Pressable>
    );
};

/** The profile numbers the calorie goal is calculated from (811:53465). */
export const GoalParamsSection = ({ pair, full }: GoalParamsSectionProps) => (
    <View style={styles.root}>
        <View style={styles.row}>
            {pair.map(param => (
                <View key={param.key} style={styles.half}>
                    <ParamBox param={param} />
                </View>
            ))}
        </View>
        <ParamBox param={full} />
    </View>
);

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
        gap: theme.spacing[2],
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[2],
    },
    half: {
        flex: 1,
        minWidth: 0,
    },
    box: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing[2],
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    labels: {
        flexShrink: 1,
        gap: theme.spacing[1],
    },
    label: {
        color: theme.colors.semantic.darkGrey,
    },
}));
