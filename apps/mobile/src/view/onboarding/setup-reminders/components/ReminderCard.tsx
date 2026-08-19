import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppSwitch, AppText, WheelPicker, type WheelPickerColumn } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import ArrowDownIcon from '../../../../../assets/icons/arrow-down.svg';
import ArrowUpIcon from '../../../../../assets/icons/arrow-up.svg';

export interface ReminderCardProps {
    title: string;
    /** Optional second line, e.g. when the next weigh-in falls. */
    caption?: string;
    enabled: boolean;
    onToggle: (value: boolean) => void;
    /** Formatted time, or a cadence like «Кожні 2 тижні». */
    value: string;
    /** Omit for reminders whose schedule is not a clock time. */
    onToggleExpanded?: () => void;
    expanded?: boolean;
    timeColumns?: WheelPickerColumn[];
}

/** One reminder in the list — RFDS 882:141279. */
export const ReminderCard = ({
    title,
    caption,
    enabled,
    onToggle,
    value,
    onToggleExpanded,
    expanded = false,
    timeColumns,
}: ReminderCardProps) => {
    const { t } = useAppTranslation(['onboarding']);
    const { theme } = useUnistyles();

    const Chevron = expanded ? ArrowUpIcon : ArrowDownIcon;

    return (
        <View style={styles.card}>
            <View style={styles.head}>
                <View style={styles.labels}>
                    <AppText variant="bodyLargeBold">{title}</AppText>
                    {caption ? (
                        <AppText variant="bodySmallReg" style={styles.caption}>
                            {caption}
                        </AppText>
                    ) : null}
                </View>
                <AppSwitch value={enabled} onValueChange={onToggle} accessibilityLabel={title} tone="positive" />
            </View>

            <View style={styles.divider} />

            <Pressable
                accessibilityRole={onToggleExpanded ? 'button' : 'text'}
                accessibilityState={{ expanded }}
                disabled={!onToggleExpanded}
                onPress={onToggleExpanded}
                style={styles.timeRow}
            >
                <AppText variant="bodyMediumBold" style={styles.timeLabel}>
                    {t('onboarding:setup.reminders.time')}
                </AppText>
                <View style={styles.timeValue}>
                    <AppText variant="bodyMediumReg">{value}</AppText>
                    {onToggleExpanded ? <Chevron width={16} height={16} color={theme.colors.elements.primary} /> : null}
                </View>
            </Pressable>

            {expanded && timeColumns ? (
                <WheelPicker columns={timeColumns} separator=":" plain fadeColor={theme.colors.semantic.lightGrey} />
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        width: '100%',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[5],
        paddingVertical: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    labels: {
        flex: 1,
        gap: theme.spacing[1],
    },
    caption: {
        color: theme.colors.semantic.darkGrey,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: theme.colors.forms.lightBorder,
    },
    timeRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    timeLabel: {
        flex: 1,
    },
    timeValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
}));
