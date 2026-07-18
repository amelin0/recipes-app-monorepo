import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, CircleBackButton, PasswordInput, ScreenHeader } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useSetNewPasswordScreen } from './useSetNewPasswordScreen';

export const SetNewPasswordScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const { password, setPassword, confirmPassword, setConfirmPassword, handleSubmit } = useSetNewPasswordScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <CircleBackButton />

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
                    <AppButton
                        label={t('auth:set-new-password.submit')}
                        onPress={handleSubmit}
                        fullWidth
                        style={styles.submit}
                    />
                </View>
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
}));
