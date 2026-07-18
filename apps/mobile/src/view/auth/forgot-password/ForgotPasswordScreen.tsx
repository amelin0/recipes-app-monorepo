import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppInput, AppScreen, CircleBackButton, ScreenHeader } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useForgotPasswordScreen } from './useForgotPasswordScreen';

export const ForgotPasswordScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const { email, setEmail, handleSubmit } = useForgotPasswordScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <CircleBackButton />

                <ScreenHeader title={t('auth:forgot-password.title')} subtitle={t('auth:forgot-password.subtitle')} />

                <View style={styles.form}>
                    <AppInput
                        placeholder={t('auth:forgot-password.email-placeholder')}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                    <AppButton
                        label={t('auth:forgot-password.submit')}
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
