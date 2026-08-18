import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, CircleBackButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface SetupFooterProps {
    /** Enables the CTA — also picks its label (see below). */
    canProceed: boolean;
    onNext: () => void;
    /** Hidden on the steps that must not be reversed. @default true */
    showBack?: boolean;
    /**
     * Stretches the CTA and drops the back button — the layout the design uses
     * while the keyboard is up (852:96676).
     */
    fullWidth?: boolean;
}

/**
 * Questionnaire footer — RFDS 66:2340.
 *
 * The CTA label follows the layout: «Далі» next to the back button, «Продовжити»
 * when it takes the full width. That matches 66:2333, 852:96676, 852:96816,
 * 855:101238, 855:101071 and 855:109474; only the gender step (855:98346) is
 * drawn with «Продовжити» in the two-button layout, which reads as a slip in the
 * design rather than a rule.
 */
export const SetupFooter = ({ canProceed, onNext, showBack = true, fullWidth = false }: SetupFooterProps) => {
    const { t } = useAppTranslation(['onboarding']);

    const cta = (
        <AppButton
            label={t(fullWidth ? 'onboarding:setup.actions.continue' : 'onboarding:setup.actions.next')}
            onPress={onNext}
            disabled={!canProceed}
            fullWidth={fullWidth}
            style={fullWidth ? undefined : styles.cta}
        />
    );

    if (fullWidth) return <View style={styles.typing}>{cta}</View>;

    return (
        <View style={styles.root}>
            {showBack ? <CircleBackButton size="md" /> : null}
            {cta}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
    // With the keyboard up the CTA goes full width, 16 above the keys.
    typing: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
    cta: {
        width: 200,
    },
}));
