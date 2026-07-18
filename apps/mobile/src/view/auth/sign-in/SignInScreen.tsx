import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppInput, AppScreen, AppText, LabeledDivider, PasswordInput } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AppleIcon from '../../../../assets/icons/auth/apple.svg';
import GoogleIcon from '../../../../assets/icons/auth/google.svg';

import { useSignInScreen } from './useSignInScreen';

export const SignInScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const {
        email,
        setEmail,
        password,
        setPassword,
        handleSignIn,
        handleForgotPassword,
        handleSignUp,
        handleAppleSignIn,
        handleGoogleSignIn,
    } = useSignInScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <AppText variant="titleMedium">{t('auth:sign-in.title')}</AppText>

                <View style={styles.form}>
                    <AppInput
                        placeholder={t('auth:sign-in.email-placeholder')}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                    <PasswordInput
                        placeholder={t('auth:sign-in.password-placeholder')}
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Pressable accessibilityRole="button" hitSlop={8} onPress={handleForgotPassword}>
                        <AppText variant="bodyMediumBold">{t('auth:sign-in.forgot-password')}</AppText>
                    </Pressable>

                    <AppButton
                        label={t('auth:sign-in.submit')}
                        onPress={handleSignIn}
                        fullWidth
                        style={styles.submit}
                    />
                </View>

                <LabeledDivider label={t('auth:sign-in.or')} />

                <View style={styles.social}>
                    <AppButton
                        variant="secondary"
                        label={t('auth:sign-in.continue-apple')}
                        onPress={handleAppleSignIn}
                        leftSlot={<AppleIcon width={24} height={24} color={styles.socialIcon.color} />}
                        fullWidth
                    />
                    <AppButton
                        variant="secondary"
                        label={t('auth:sign-in.continue-google')}
                        onPress={handleGoogleSignIn}
                        leftSlot={<GoogleIcon width={24} height={24} />}
                        fullWidth
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <AppText variant="bodyMediumReg" color="tertiary">
                    {t('auth:sign-in.no-account')}
                </AppText>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={handleSignUp}>
                    <AppText variant="bodyMediumBold">{t('auth:sign-in.sign-up-link')}</AppText>
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
    form: {
        gap: theme.spacing[4],
    },
    submit: {
        minHeight: 56,
    },
    social: {
        gap: theme.spacing[3],
    },
    socialIcon: {
        color: theme.colors.elements.primary,
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
