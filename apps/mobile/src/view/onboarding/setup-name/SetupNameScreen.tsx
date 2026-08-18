import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useKeyboardVisible } from '@/shared/hooks';
import { AppButton, AppInput, AppScreen, AppText, CircleBackButton, ProgressBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SETUP_STEPS } from '../onboarding.constants';

import { useSetupNameScreen } from './useSetupNameScreen';

/**
 * Step 1 of the profile-setup questionnaire — RF-mobile-app 66:2333 (idle) and
 * 852:96676 (typing). With the keyboard up the footer collapses from
 * "back + Далі" to a single full-width "Продовжити" sitting above the keys.
 */
export const SetupNameScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { theme } = useUnistyles();
    const isKeyboardVisible = useKeyboardVisible();
    const { name, setName, canProceed, handleNext, step } = useSetupNameScreen();

    return (
        <AppScreen>
            <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                    <ProgressBar
                        progress={step / SETUP_STEPS}
                        height={6}
                        color={theme.colors.branding.accent}
                        trackColor={theme.colors.semantic.lightGrey}
                    />
                </View>
            </View>

            <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <AppText variant="titleMedium" accessibilityRole="header" style={styles.centered}>
                            {t('onboarding:setup.name.title')}
                        </AppText>
                        <AppText variant="bodyMediumReg" style={[styles.centered, styles.muted]}>
                            {t('onboarding:setup.name.subtitle')}
                        </AppText>
                    </View>

                    <AppInput
                        placeholder={t('onboarding:setup.name.placeholder')}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoComplete="given-name"
                        autoCorrect={false}
                        returnKeyType="done"
                    />
                </View>

                {isKeyboardVisible ? (
                    <View style={styles.footerTyping}>
                        <AppButton
                            label={t('onboarding:setup.actions.continue')}
                            onPress={handleNext}
                            disabled={!canProceed}
                            fullWidth
                        />
                    </View>
                ) : (
                    <View style={styles.footer}>
                        <CircleBackButton size="md" />
                        <AppButton
                            label={t('onboarding:setup.actions.next')}
                            onPress={handleNext}
                            disabled={!canProceed}
                            style={styles.nextButton}
                        />
                    </View>
                )}
            </KeyboardAvoidingView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    fill: {
        flex: 1,
    },
    progressRow: {
        paddingHorizontal: theme.spacing[4],
        // 12 to clear the safe area + the block's own 12 of vertical padding.
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[3],
    },
    // Design insets the track by 100 on each side of the content column.
    progressTrack: {
        paddingHorizontal: 100,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        // Puts the header on the frame's y=164 once the progress row above is
        // accounted for.
        paddingTop: 72,
        gap: theme.spacing[6],
    },
    header: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
    // With the keyboard up the CTA goes full width, 16 above the keys.
    footerTyping: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
    nextButton: {
        width: 200,
    },
}));
