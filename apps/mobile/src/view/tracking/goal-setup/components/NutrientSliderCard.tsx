import React, { useCallback, useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppCard, AppText, Slider } from '@/shared/ui/components';

export interface NutrientSliderCardProps {
    emoji: string;
    title: string;
    value: number;
    min: number;
    max: number;
    /** Slider fill color. */
    color: string;
    /** Unit suffix (г / мл). */
    unit: string;
    /** Snap step. @default 1 */
    step?: number;
    onChange: (value: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Nutrient row card: emoji + title + editable number + track slider (Figma 435:12707+). */
export const NutrientSliderCard = ({
    emoji,
    title,
    value,
    min,
    max,
    color,
    unit,
    step = 1,
    onChange,
}: NutrientSliderCardProps) => {
    const [draft, setDraft] = useState(String(value));
    const [isFocused, setIsFocused] = useState(false);

    // Keep the input in sync with slider-driven changes while not editing.
    useEffect(() => {
        if (!isFocused) setDraft(String(value));
    }, [value, isFocused]);

    const commitDraft = useCallback(() => {
        setIsFocused(false);
        const parsed = Number.parseInt(draft, 10);
        if (Number.isFinite(parsed)) {
            onChange(clamp(parsed, min, max));
        } else {
            setDraft(String(value));
        }
    }, [draft, min, max, onChange, value]);

    return (
        <AppCard style={styles.card}>
            <View style={styles.header}>
                <AppText style={styles.emoji}>{emoji}</AppText>
                <AppText variant="bodyLargeBold" style={styles.title}>
                    {title}
                </AppText>
                <View style={styles.inputRow}>
                    <TextInput
                        value={draft}
                        onChangeText={text => setDraft(text.replace(/\D/g, ''))}
                        onFocus={() => setIsFocused(true)}
                        onBlur={commitDraft}
                        keyboardType="number-pad"
                        maxLength={5}
                        accessibilityLabel={title}
                        style={styles.input(isFocused)}
                    />
                    <AppText variant="bodyMediumReg" style={styles.unit}>
                        {unit}
                    </AppText>
                </View>
            </View>

            <Slider
                value={value}
                min={min}
                max={max}
                step={step}
                color={color}
                onChange={onChange}
                accessibilityLabel={title}
            />

            <View style={styles.range}>
                <AppText variant="bodySmallReg" style={styles.rangeLabel}>
                    {min}
                </AppText>
                <AppText variant="bodySmallReg" style={styles.rangeLabel}>
                    {max}
                </AppText>
            </View>
        </AppCard>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        alignItems: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        width: '100%',
    },
    emoji: {
        fontSize: 20,
        lineHeight: 28,
    },
    title: {
        flex: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    input: (focused: boolean) => ({
        ...theme.typography.bodyLargeBold,
        width: 64,
        height: 25,
        padding: 0,
        textAlign: 'right',
        color: theme.colors.elements.primary,
        borderBottomWidth: 1,
        borderBottomColor: focused ? theme.colors.branding.accent : theme.colors.active.tertiary,
    }),
    unit: {
        color: theme.colors.semantic.darkGrey,
    },
    range: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    rangeLabel: {
        color: theme.colors.semantic.darkGrey,
    },
}));
