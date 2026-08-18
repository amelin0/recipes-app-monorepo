import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface GenderCardProps {
    label: string;
    icon: React.ComponentType<{ width: number; height: number; color: string }>;
    selected: boolean;
    onPress: () => void;
}

/**
 * Option card for the gender step — RFDS `Select` (Figma 855:98358). Differs
 * from the shared `SelectCard`: a 32px icon instead of an emoji, a 100px
 * square box and a positive (not accent) selected border.
 */
export const GenderCard = ({ label, icon: Icon, selected, onPress }: GenderCardProps) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={onPress}
            style={styles.card(selected)}
        >
            <Icon
                width={32}
                height={32}
                color={selected ? theme.colors.semantic.positive : theme.colors.semantic.darkGrey}
            />
            <View style={styles.labelBox}>
                <AppText variant="bodyLargeBold" style={styles.label}>
                    {label}
                </AppText>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    card: (selected: boolean) => ({
        flex: 1,
        minHeight: 100,
        minWidth: 100,
        padding: theme.spacing[3],
        gap: theme.spacing[2],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.background.screen,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.forms.positiveBorder : theme.colors.forms.lightBorder,
    }),
    labelBox: {
        width: '100%',
    },
    label: {
        width: '100%',
        textAlign: 'center',
    },
}));
