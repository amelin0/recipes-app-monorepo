import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, CircleIconButton, ScreenActions, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MessageQuestionIcon from '../../../../assets/icons/message-question.svg';
import MascotWarning from '../../../../assets/images/brand/mascot-warning.svg';

import { useAccountRestoreFailedScreen } from './useAccountRestoreFailedScreen';

const MASCOT_SIZE = 200;

/** Restoring the account did not go through (804:25402). */
export const AccountRestoreFailedScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['profile']);
    const { handleRetry, handleSupport, handleLogout } = useAccountRestoreFailedScreen();

    return (
        <AppScreen>
            <TopBar
                title={t('profile:account-recovery.title')}
                trailing={
                    <CircleIconButton
                        tone="glass"
                        accessibilityLabel={t('profile:account-restore-failed.support-a11y')}
                        onPress={handleSupport}
                    >
                        <MessageQuestionIcon width={20} height={20} color={theme.colors.elements.primary} />
                    </CircleIconButton>
                }
            />

            <View style={styles.content}>
                <MascotWarning width={MASCOT_SIZE} height={MASCOT_SIZE} />

                <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                    {t('profile:account-restore-failed.title')}
                </AppText>
                <AppText variant="bodySmallReg" style={[styles.centered, styles.muted]}>
                    {t('profile:account-restore-failed.description')}
                </AppText>
            </View>

            <ScreenActions>
                <AppButton label={t('profile:account-restore-failed.retry')} onPress={handleRetry} fullWidth />
                <AppButton
                    variant="secondary"
                    label={t('profile:account-restore-failed.logout')}
                    onPress={handleLogout}
                    fullWidth
                />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        gap: theme.spacing[6],
        paddingHorizontal: theme.spacing[4],
        // 804:25403 sits 152 from the frame top — 90 below the 62pt status bar,
        // i.e. 38 under the nav row — plus its own 12 of padding.
        paddingTop: 38 + theme.spacing[3],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
