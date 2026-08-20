import React from 'react';
import { Pressable } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface PlanActionButtonProps {
    icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
    label: string;
    disabled?: boolean;
    onPress: () => void;
}

/** Grey pill action under the plan — basket / copy (961:59378). */
export const PlanActionButton = ({ icon: Icon, label, disabled = false, onPress }: PlanActionButtonProps) => {
    const { theme } = useUnistyles();
    const color = disabled ? theme.colors.semantic.disabled : theme.colors.elements.primary;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={styles.button}
        >
            <Icon width={20} height={20} color={color} />
            <AppText variant="bodyMediumBold" style={{ color }}>
                {label}
            </AppText>
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
        width: '100%',
        height: 44,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
}));
