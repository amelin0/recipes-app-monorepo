import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import ArrowRightIcon from '../../../../assets/icons/arrow-right.svg';

export interface ProfileRowProps {
    /** 20px icon node. */
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    /** Renders the label in Semantic/negative (danger zone). @default false */
    destructive?: boolean;
    /** Hides the trailing chevron (danger zone rows). @default true */
    showArrow?: boolean;
    /** Optional node between the label and the chevron (e.g. Premium tag). */
    trailing?: React.ReactNode;
}

/** Settings row — grey pill with icon, label, optional tag and chevron. */
export const ProfileRow = ({
    icon,
    label,
    onPress,
    destructive = false,
    showArrow = true,
    trailing,
}: ProfileRowProps) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={({ pressed }) => styles.row(pressed)}
        >
            <View style={styles.icon}>{icon}</View>
            <AppText variant="bodySmallBold" style={styles.label(destructive)}>
                {label}
            </AppText>
            {trailing}
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
    label: (destructive: boolean) => ({
        flex: 1,
        color: destructive ? theme.colors.semantic.negative : theme.colors.elements.primary,
    }),
}));
