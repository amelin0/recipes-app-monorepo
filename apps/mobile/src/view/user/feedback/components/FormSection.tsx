import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppCard, AppText } from '@/shared/ui/components';

export interface FormSectionProps {
    /** Step number in the dark badge. */
    step: number;
    title: string;
    /** Renders as a red asterisk after the title. */
    required?: boolean;
    /** Grey note after the title, e.g. «необов'язково · до 3 фото». */
    note?: string;
    children: React.ReactNode;
}

/** One numbered block of the feedback form (804:25466…804:25499). */
export const FormSection = ({ step, title, required = false, note, children }: FormSectionProps) => (
    <AppCard style={styles.card}>
        <View style={styles.header}>
            <View style={styles.badge}>
                <AppText variant="bodySmallBold" style={styles.step}>
                    {String(step)}
                </AppText>
            </View>
            <AppText variant="bodyMediumBold">
                {title}
                {required ? <AppText style={styles.required}>{'*'}</AppText> : null}
            </AppText>
            {note ? (
                <AppText variant="bodySmallReg" style={styles.note}>
                    {note}
                </AppText>
            ) : null}
        </View>

        {children}
    </AppCard>
);

const styles = StyleSheet.create(theme => ({
    card: {
        alignItems: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    badge: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.branding.primary,
    },
    step: {
        color: theme.colors.semantic.white,
    },
    required: {
        color: theme.colors.semantic.negative,
    },
    note: {
        flexShrink: 1,
        color: theme.colors.semantic.darkGrey,
    },
}));
