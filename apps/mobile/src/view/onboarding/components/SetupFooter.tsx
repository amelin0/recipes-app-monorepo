import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, CircleBackButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface SetupFooterProps {
    /** Enables the CTA. */
    canProceed: boolean;
    onNext: () => void;
    /** Hidden on steps that must not be reversed. @default true */
    showBack?: boolean;
    /** Stretches the CTA and drops the back button. */
    fullWidth?: boolean;
    /** Sits 16 above the keyboard instead of 40 above the home indicator. */
    aboveKeyboard?: boolean;
}

/**
 * Questionnaire footer — RFDS 66:2340 (two buttons) and 852:96934 (stretched).
 *
 * The CTA label follows the layout: «Далі» next to the back button,
 * «Продовжити» when it takes the full width. That matches 66:2333, 852:96676,
 * 852:96816, 855:101238, 855:101071, 855:109474, 864:111841 and 864:114915;
 * only the gender step (855:98346) is drawn with «Продовжити» in the two-button
 * layout, which reads as a slip in the design rather than a rule.
 */
export const SetupFooter = ({
    canProceed,
    onNext,
    showBack = true,
    fullWidth = false,
    aboveKeyboard = false,
}: SetupFooterProps) => {
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

    if (fullWidth) return <View style={styles.stretched(aboveKeyboard)}>{cta}</View>;

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
    stretched: (aboveKeyboard: boolean) => ({
        paddingHorizontal: theme.spacing[4],
        paddingBottom: aboveKeyboard ? theme.spacing[4] : theme.spacing[10],
    }),
    cta: {
        width: 200,
    },
}));
