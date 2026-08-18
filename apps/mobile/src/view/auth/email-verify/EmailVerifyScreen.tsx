import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, AppText, CircleBackButton, OtpInput, ScreenHeader } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useEmailVerifyScreen } from './useEmailVerifyScreen';

export const EmailVerifyScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const { maskedEmail, code, setCode, handleComplete, resendSeconds, canResend, handleResend } =
        useEmailVerifyScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <CircleBackButton />

                <ScreenHeader
                    title={t('auth:email-verify.title')}
                    subtitle={t('auth:email-verify.subtitle', { email: maskedEmail })}
                />

                <OtpInput value={code} onChangeText={setCode} onComplete={handleComplete} autoFocus />

                <View style={styles.resendRow}>
                    <AppText variant="bodyMediumReg">{t('auth:email-verify.resend-question')}</AppText>
                    {canResend ? (
                        <Pressable accessibilityRole="button" hitSlop={8} onPress={handleResend}>
                            <AppText variant="bodyMediumBold">{t('auth:email-verify.resend')}</AppText>
                        </Pressable>
                    ) : (
                        <AppText variant="bodyMediumReg" style={styles.resendDisabled}>
                            {t('auth:email-verify.resend-timer', { seconds: resendSeconds })}
                        </AppText>
                    )}
                </View>
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        gap: theme.spacing[6],
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    resendDisabled: {
        color: theme.colors.semantic.darkGrey,
    },
}));
