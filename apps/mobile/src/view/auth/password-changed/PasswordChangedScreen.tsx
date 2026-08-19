import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotMeditate from '../../../../assets/images/brand/mascot-meditate.svg';

import { usePasswordChangedScreen } from './usePasswordChangedScreen';

const MASCOT_SIZE = 200;

/** Closing step of the password reset (804:24915). */
export const PasswordChangedScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const { handleSignIn } = usePasswordChangedScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <MascotMeditate width={MASCOT_SIZE} height={MASCOT_SIZE} />

                <View style={styles.header}>
                    <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                        {t('auth:password-changed.title')}
                    </AppText>
                    <AppText variant="bodyLargeReg" style={[styles.centered, styles.subtitle]}>
                        {t('auth:password-changed.subtitle')}
                    </AppText>
                </View>
            </View>

            <ScreenActions>
                <AppButton label={t('auth:password-changed.submit')} onPress={handleSignIn} fullWidth />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        // 804:24918 sits 152 from the frame top — 90 below the 62pt status bar —
        // and carries its own 12 of padding.
        paddingTop: 90 + theme.spacing[3],
    },
    header: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    centered: {
        textAlign: 'center',
        width: '100%',
    },
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
}));
