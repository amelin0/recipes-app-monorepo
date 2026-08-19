import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import ArrowRightIcon from '../../../../assets/icons/arrow-right.svg';

export interface ProfileRowProps {
    /** 20px icon node. */
    icon: React.ReactNode;
    label: string;
    /** Second line under the label, e.g. the subscription end date (804:24004). */
    subtitle?: string;
    onPress: () => void;
    /** Renders the label in Semantic/negative (danger zone). @default false */
    destructive?: boolean;
    /** Hides the trailing chevron (danger zone rows). @default true */
    showArrow?: boolean;
    /** Optional node between the label and the chevron (e.g. the plan tag). */
    trailing?: React.ReactNode;
    /** What `trailing` says — the row is one a11y element, so its text needs folding in. */
    trailingLabel?: string;
}

/** Settings row — grey pill with icon, label, optional tag and chevron. */
export const ProfileRow = ({
    icon,
    label,
    subtitle,
    onPress,
    destructive = false,
    showArrow = true,
    trailing,
    trailingLabel,
}: ProfileRowProps) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={[label, trailingLabel, subtitle].filter(Boolean).join(', ')}
            onPress={onPress}
            style={({ pressed }) => styles.row(pressed)}
        >
            <View style={styles.icon}>{icon}</View>
            <View style={styles.labels}>
                <AppText variant="bodySmallBold" style={styles.label(destructive)}>
                    {label}
                </AppText>
                {subtitle ? (
                    <AppText variant="bodySmallReg" style={styles.subtitle}>
                        {subtitle}
                    </AppText>
                ) : null}
            </View>
            {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
            {showArrow ? <ArrowRightIcon width={16} height={16} color={theme.colors.elements.primary} /> : null}
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    row: (pressed: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        minHeight: 52,
        paddingHorizontal: theme.spacing[3],
        borderRadius: theme.radius.lg,
        backgroundColor: pressed ? theme.colors.active.tertiary : theme.colors.semantic.lightGrey,
        width: '100%',
    }),
    icon: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    labels: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    label: (destructive: boolean) => ({
        color: destructive ? theme.colors.semantic.negative : theme.colors.elements.primary,
    }),
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
    // Tag and friends default to `alignSelf: 'flex-start'`, which would pin
    // them to the top of the row; the wrapper turns that into a no-op.
    trailing: {
        justifyContent: 'center',
    },
}));
