import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface SectionHeaderProps {
    /** Section title — RFDS `Header` size=large (body/large-bold). */
    title: string;
    /** Optional supporting line under the title (body/small-reg, dark grey). */
    subtitle?: string;
    /** Extra styles merged onto the wrapper. */
    style?: StyleProp<ViewStyle>;
}

/** In-content section header (16px SemiBold + optional 12px subtitle). */
export const SectionHeader = ({ title, subtitle, style }: SectionHeaderProps) => {
    return (
        <View style={[styles.root, style]}>
            <AppText variant="bodyLargeBold" accessibilityRole="header">
                {title}
            </AppText>
            {subtitle ? (
                <AppText variant="bodySmallReg" style={styles.subtitle}>
                    {subtitle}
                </AppText>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
    },
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
}));
