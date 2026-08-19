import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppScreen, AppText } from '@/shared/ui/components';
import { formatThousands } from '@/shared/helpers';

import AddIcon from '../../../../assets/icons/add.svg';
import InfoCircleIcon from '../../../../assets/icons/info-circle.svg';
import MinusIcon from '../../../../assets/icons/minus.svg';

import { SetupFooter } from './SetupFooter';
import { SetupHeader } from './SetupHeader';
import { SetupProgress } from './SetupProgress';

export interface SetupTargetStepProps {
    step: number;
    title: string;
    subtitle: string;
    /** «Рекомендовано під ваші параметри». */
    recommendationLabel: string;
    /** Formatted recommendation, e.g. «2,000 ккал». */
    recommendationValue: string;
    /** Colour of the recommendation figure — green for calories, blue for water. */
    recommendationColor: string;
    value: number;
    /** Short unit under the figure: ккал / мл / кр. */
    unit: string;
    /** Dial border; also drives the state the screen is in. */
    dialColor: string;
    /** 12%-alpha ring around the dial (shadow/positive and friends). */
    ringColor: string;
    onDecrement: () => void;
    onIncrement: () => void;
    decrementLabel: string;
    incrementLabel: string;
    /** Shown under the dial when the value drifts too far from the recommendation. */
    warning?: string;
    onNext: () => void;
}

/**
 * Shared shell for the three goal steps — RFDS 864:120050 (calories, with its
 * low/high states), 864:120506 (water) and 864:120748 (steps). Identical apart
 * from copy, unit and the colour the dial takes.
 */
export const SetupTargetStep = ({
    step,
    title,
    subtitle,
    recommendationLabel,
    recommendationValue,
    recommendationColor,
    value,
    unit,
    dialColor,
    ringColor,
    onDecrement,
    onIncrement,
    decrementLabel,
    incrementLabel,
    warning,
    onNext,
}: SetupTargetStepProps) => {
    const { theme } = useUnistyles();

    return (
        <AppScreen>
            <SetupProgress step={step} />

            <View style={styles.content}>
                <SetupHeader title={title} subtitle={subtitle} />

                <View style={styles.recommendation}>
                    <AppText variant="bodySmallReg">{recommendationLabel}</AppText>
                    <AppText variant="titleSmall" style={{ color: recommendationColor }}>
                        {recommendationValue}
                    </AppText>
                </View>

                <View style={styles.dialRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={decrementLabel}
                        onPress={onDecrement}
                        style={styles.sideButton}
                    >
                        <MinusIcon width={24} height={24} color={theme.colors.elements.primary} />
                    </Pressable>

                    <View style={styles.dial(dialColor)}>
                        {/* Absolute so the halo bleeds outside without widening
                            the row — in the design it is a shadow, not a box. */}
                        <View style={styles.ring(ringColor)} pointerEvents="none" />
                        <AppText variant="titleLarge">{formatThousands(value)}</AppText>
                        <AppText variant="bodyLargeReg" style={styles.unit}>
                            {unit}
                        </AppText>
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={incrementLabel}
                        onPress={onIncrement}
                        style={styles.sideButton}
                    >
                        <AddIcon width={24} height={24} color={theme.colors.elements.primary} />
                    </Pressable>
                </View>

                {warning ? (
                    <View style={styles.warning} accessibilityRole="alert">
                        <InfoCircleIcon width={20} height={20} color={theme.colors.elements.primary} />
                        <AppText variant="bodySmallReg" style={styles.warningText}>
                            {warning}
                        </AppText>
                    </View>
                ) : null}
            </View>

            <SetupFooter canProceed onNext={onNext} />
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        paddingTop: 72,
        gap: theme.spacing[6],
    },
    recommendation: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    dialRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[6],
    },
    sideButton: {
        minWidth: 52,
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    // The design draws the halo as an 8pt spread shadow — which RN has no
    // equivalent for — so it is a concentric circle sitting behind the dial and
    // outside the layout flow.
    ring: (color: string) => ({
        position: 'absolute',
        top: -12,
        left: -12,
        width: 168,
        height: 168,
        borderRadius: theme.radius.full,
        backgroundColor: color,
        zIndex: -1,
    }),
    dial: (color: string) => ({
        width: 152,
        height: 152,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        borderRadius: theme.radius.full,
        borderWidth: 4,
        borderColor: color,
        backgroundColor: theme.colors.semantic.white,
    }),
    unit: {
        color: theme.colors.semantic.darkGrey,
    },
    warning: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        padding: 13,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.semantic.orange,
        backgroundColor: theme.colors.semantic.lightOrange,
    },
    warningText: {
        flex: 1,
    },
}));
