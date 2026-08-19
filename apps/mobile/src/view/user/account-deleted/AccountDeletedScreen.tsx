import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotCrying from '../../../../assets/images/brand/mascot-crying.svg';

import { useAccountDeletedScreen } from './useAccountDeletedScreen';

const MASCOT_SIZE = 200;

/** Receipt for a deletion request — the account is not gone yet (804:25013). */
export const AccountDeletedScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { handleRestore, handleLogout } = useAccountDeletedScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <MascotCrying width={MASCOT_SIZE} height={MASCOT_SIZE} />

                <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                    {t('profile:account-deleted.title')}
                </AppText>
                <AppText variant="bodySmallReg" style={[styles.centered, styles.muted]}>
                    {t('profile:account-deleted.description')}
                </AppText>
            </View>

            <ScreenActions>
                <AppButton label={t('profile:account-deleted.restore')} onPress={handleRestore} fullWidth />
                <AppButton
                    variant="secondary"
                    label={t('profile:account-deleted.logout')}
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
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        // 804:25017 sits 152 from the frame top — 90 below the 62pt status bar —
        // and carries its own 12 of padding.
        paddingTop: 90 + theme.spacing[3],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
