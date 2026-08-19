import React from 'react';
import { View } from 'react-native';

import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

/** The illustration is drawn on a fixed 343×280 box (Figma 864:111896). */
const BOX_WIDTH = 343;
const BOX_HEIGHT = 280;

/** Outer ring: 180pt, 13.5pt stroke, 270° of it filled (864:111899). */
const OUTER = { size: 180, stroke: 13.5, sweep: 0.75 };
/** Inner ring: 140pt, 10.5pt stroke, 180° filled (864:111901). */
const INNER = { size: 140, stroke: 10.5, sweep: 0.5 };

const CHIPS = [
    { key: 'fat', emoji: '🥑', left: 18, top: 20 },
    { key: 'protein', emoji: '🍗', left: 228, top: 60 },
    { key: 'carbs', emoji: '🍚', left: 24, top: 180 },
] as const;

interface RingProps {
    size: number;
    stroke: number;
    sweep: number;
    color: string;
    trackColor: string;
}

const Ring = ({ size, stroke, sweep, color, trackColor }: RingProps) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <Svg width={size} height={size} style={styles.ring(size)}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${circumference * sweep} ${circumference}`}
                // Dashes start at 3 o'clock; the design starts both arcs at 12.
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </Svg>
    );
};

/**
 * Calorie ring with the macro chips floating around it — the illustration on
 * the «Слідкуйте за КБЖВ» step. Built rather than exported: Figma's PNG export
 * drops the emoji, and the numbers stay localizable this way.
 */
export const MacroGaugeGraphic = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { theme } = useUnistyles();

    return (
        <View style={styles.box}>
            <View style={styles.gauge}>
                <Ring {...OUTER} color={theme.colors.branding.accent} trackColor={theme.colors.semantic.lightGrey} />
                <Ring {...INNER} color={theme.colors.semantic.ocean} trackColor={theme.colors.semantic.lightGrey} />

                <View style={styles.center}>
                    <AppText variant="titleLarge">{t('onboarding:setup.benefit.macros.calories')}</AppText>
                    <AppText variant="overline" style={styles.centerLabel}>
                        {t('onboarding:setup.benefit.macros.calories-label')}
                    </AppText>
                </View>
            </View>

            {CHIPS.map(chip => (
                <View key={chip.key} style={styles.chip(chip.left, chip.top)}>
                    <AppText style={styles.emoji}>{chip.emoji}</AppText>
                    <AppText variant="bodySmallBold">{t(`onboarding:setup.benefit.macros.chips.${chip.key}`)}</AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    box: {
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
    },
    gauge: {
        position: 'absolute',
        left: 68,
        top: 30,
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: (size: number) => ({
        position: 'absolute',
        width: size,
        height: size,
    }),
    center: {
        alignItems: 'center',
        gap: 2,
    },
    centerLabel: {
        color: theme.colors.semantic.darkGrey,
    },
    chip: (left: number, top: number) => ({
        position: 'absolute',
        left,
        top,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: theme.spacing[2],
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    }),
    emoji: {
        fontSize: 14,
        lineHeight: 18,
    },
}));
