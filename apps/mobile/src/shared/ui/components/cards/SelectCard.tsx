import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface SelectCardProps {
    /** Emoji rendered on top. */
    emoji: string;
    title: string;
    subtitle?: string;
    selected: boolean;
    onPress: () => void;
}

/** Selectable option card — RFDS `Select` (emoji + title + subtitle, accent border when active). */
export const SelectCard = ({ emoji, title, subtitle, selected, onPress }: SelectCardProps) => {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={onPress}
            style={styles.card(selected)}
        >
            <AppText style={styles.emoji}>{emoji}</AppText>
            <View style={styles.labels}>
                <AppText variant="bodyMediumBold" style={styles.centered}>
                    {title}
                </AppText>
                {subtitle ? (
                    <AppText variant="bodySmallReg" style={[styles.centered, styles.subtitle]}>
                        {subtitle}
                    </AppText>
                ) : null}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    card: (selected: boolean) => ({
        flex: 1,
        minHeight: 80,
        minWidth: 56,
        // Figma centres the card stroke, RN lays it outside the padding box, so
        // the padding gives back what the border takes (12 - borderWidth).
        padding: theme.spacing[3] - (selected ? 2 : 1),
        gap: theme.spacing[2],
        alignItems: 'center',
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.background.screen,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.branding.accent : theme.colors.forms.lightBorder,
    }),
    emoji: {
        fontSize: 20,
        lineHeight: 28,
    },
    labels: {
        width: '100%',
    },
    centered: {
        textAlign: 'center',
        width: '100%',
    },
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
}));
