import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { useKeyboardVisible } from '@/shared/hooks';
import { AppButton, AppInput, AppScreen, ScreenActions, ScreenHeader, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useForgotPasswordScreen } from './useForgotPasswordScreen';

export const ForgotPasswordScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const isKeyboardVisible = useKeyboardVisible();
    const { email, setEmail, handleSubmit } = useForgotPasswordScreen();

    return (
        <AppScreen>
            <TopBar title={t('auth:forgot-password.nav-title')} />

            <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.content}>
                    <ScreenHeader
                        title={t('auth:forgot-password.title')}
                        subtitle={t('auth:forgot-password.subtitle')}
                    />

                    <AppInput
                        placeholder={t('auth:forgot-password.email-placeholder')}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                </View>

                <ScreenActions style={isKeyboardVisible ? styles.actionsAboveKeyboard : undefined}>
                    <AppButton label={t('auth:forgot-password.submit')} onPress={handleSubmit} fullWidth />
                </ScreenActions>
            </KeyboardAvoidingView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    fill: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        gap: theme.spacing[6],
    },
    // With the keyboard up the bar sits right above it — 16/52/16 instead of
    // 16/52/40, i.e. 84 tall instead of 108 (804:24973, 804:24993).
    actionsAboveKeyboard: {
        paddingBottom: theme.spacing[4],
    },
}));
