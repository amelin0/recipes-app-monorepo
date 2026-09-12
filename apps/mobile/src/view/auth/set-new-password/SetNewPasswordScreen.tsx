import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { useKeyboardVisible } from '@/shared/hooks';
import { AppButton, AppScreen, PasswordInput, ScreenActions, ScreenHeader, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useSetNewPasswordScreen } from './useSetNewPasswordScreen';

export const SetNewPasswordScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const isKeyboardVisible = useKeyboardVisible();
    const { password, setPassword, confirmPassword, setConfirmPassword, handleSubmit } = useSetNewPasswordScreen();

    return (
        <AppScreen>
            <TopBar title={t('auth:set-new-password.nav-title')} />

            <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.content}>
                    <ScreenHeader title={t('auth:set-new-password.title')} />

                    <View style={styles.form}>
                        <PasswordInput
                            placeholder={t('auth:set-new-password.new-password-placeholder')}
                            value={password}
                            onChangeText={setPassword}
                            autoComplete="new-password"
                        />
                        <PasswordInput
                            placeholder={t('auth:set-new-password.confirm-password-placeholder')}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            autoComplete="new-password"
                        />
                    </View>
                </View>

                <ScreenActions style={isKeyboardVisible ? styles.actionsAboveKeyboard : undefined}>
                    <AppButton label={t('auth:set-new-password.submit')} onPress={handleSubmit} fullWidth />
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
    form: {
        gap: theme.spacing[4],
    },
    // With the keyboard up the bar sits right above it — 16/52/16 instead of
    // 16/52/40, i.e. 84 tall instead of 108 (804:24973, 804:24993).
    actionsAboveKeyboard: {
        paddingBottom: theme.spacing[4],
    },
}));
