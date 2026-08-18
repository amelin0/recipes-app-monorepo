import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppInput, AppScreen, AppText, LabeledDivider, PasswordInput } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AppleIcon from '../../../../assets/icons/auth/apple.svg';
import GoogleIcon from '../../../../assets/icons/auth/google.svg';

import { useSignUpScreen } from './useSignUpScreen';

export const SignUpScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const { theme } = useUnistyles();
    const {
        email,
        setEmail,
        password,
        setPassword,
        handleSignUp,
        handleTermsOfService,
        handlePrivacyPolicy,
        handleSignIn,
        handleAppleSignUp,
        handleGoogleSignUp,
    } = useSignUpScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <AppText variant="titleMedium">{t('auth:sign-up.title')}</AppText>

                <View style={styles.form}>
                    <AppInput
                        placeholder={t('auth:sign-up.email-placeholder')}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                    <PasswordInput
                        placeholder={t('auth:sign-up.password-placeholder')}
                        value={password}
                        onChangeText={setPassword}
                        autoComplete="new-password"
                    />

                    <AppButton
                        label={t('auth:sign-up.submit')}
                        onPress={handleSignUp}
                        fullWidth
                        style={styles.submit}
                    />

                    <LabeledDivider label={t('auth:sign-up.or')} />

                    <View style={styles.social}>
                        <AppButton
                            variant="secondary"
                            label={t('auth:sign-up.sign-up-apple')}
                            onPress={handleAppleSignUp}
                            leftSlot={<AppleIcon width={24} height={24} color={theme.colors.elements.primary} />}
                            fullWidth
                        />
                        <AppButton
                            variant="secondary"
                            label={t('auth:sign-up.sign-up-google')}
                            onPress={handleGoogleSignUp}
                            leftSlot={<GoogleIcon width={24} height={24} />}
                            fullWidth
                        />
                    </View>
                </View>

                <AppText variant="bodyMediumReg" color="tertiary" style={styles.terms}>
                    {t('auth:sign-up.terms-prefix')}
                    <AppText
                        variant="bodyMediumReg"
                        color="tertiary"
                        style={styles.termsLink}
                        accessibilityRole="link"
                        onPress={handleTermsOfService}
                    >
                        {t('auth:sign-up.terms-service')}
                    </AppText>
                    {t('auth:sign-up.terms-and')}
                    <AppText
                        variant="bodyMediumReg"
                        color="tertiary"
                        style={styles.termsLink}
                        accessibilityRole="link"
                        onPress={handlePrivacyPolicy}
                    >
                        {t('auth:sign-up.terms-privacy')}
                    </AppText>
                    {t('auth:sign-up.terms-suffix')}
                </AppText>
            </View>

            <View style={styles.footer}>
                <AppText variant="bodyMediumReg" color="tertiary">
                    {t('auth:sign-up.have-account')}
                </AppText>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={handleSignIn}>
                    <AppText variant="bodyMediumBold">{t('auth:sign-up.sign-in-link')}</AppText>
                </Pressable>
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        gap: theme.spacing[6],
    },
    // Unlike sign-in, the divider and the social buttons live inside the form
    // column here — the design spaces them 16 apart, not 24 (Figma 66:2575).
    form: {
        gap: theme.spacing[4],
    },
    submit: {
        minHeight: 56,
    },
    social: {
        gap: theme.spacing[3],
    },
    terms: {
        textAlign: 'center',
    },
    termsLink: {
        textDecorationLine: 'underline',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[10],
    },
}));
