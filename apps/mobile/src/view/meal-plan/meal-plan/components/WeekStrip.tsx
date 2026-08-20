import React from 'react';
import { Pressable, ScrollView } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import type { PlanDay, PlanDayStatus } from '../../meal-plan.constants';

export interface WeekStripProps {
    days: PlanDay[];
    selectedKey: string;
    onSelect: (key: string) => void;
}

/** Week day rail — dark selected tile, status-tinted rest (961:59192). */
export const WeekStrip = ({ days, selectedKey, onSelect }: WeekStripProps) => {
    const { t } = useAppTranslation(['meal-plan']);

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.viewport}
            contentContainerStyle={styles.rail}
        >
            {days.map(day => {
                const selected = day.key === selectedKey;
                return (
                    <Pressable
                        key={day.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={t('meal-plan:screen.day-a11y', { weekday: day.weekday, date: day.date })}
                        onPress={() => onSelect(day.key)}
                        style={styles.tile(selected, day.status)}
                    >
                        <AppText variant="bodySmallReg" style={styles.weekday(selected)}>
                            {day.weekday}
                        </AppText>
                        <AppText variant="titleSmall" style={styles.date(selected)}>
                            {day.date}
                        </AppText>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create(theme => ({
    // The rail bleeds under the screen edges (961:59192) — undo the scroll
    // content's 16pt inset and carry it on the rail's own content instead.
    viewport: {
        marginHorizontal: -theme.spacing[4],
    },
    rail: {
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
    },
    tile: (selected: boolean, status: PlanDayStatus) => ({
        width: 52,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        borderRadius: theme.radius.lg,
        backgroundColor: selected
            ? theme.colors.branding.primary
            : status === 'ok'
              ? theme.colors.semantic.lightPositive
              : status === 'over'
                ? theme.colors.semantic.lightNegative
                : theme.colors.semantic.lightGrey,
    }),
    weekday: (selected: boolean) => ({
        color: selected ? theme.colors.elements.white : theme.colors.semantic.darkGrey,
    }),
    date: (selected: boolean) => ({
        color: selected ? theme.colors.elements.white : theme.colors.elements.primary,
    }),
}));
