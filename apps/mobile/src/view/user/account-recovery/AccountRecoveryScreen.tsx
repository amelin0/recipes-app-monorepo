import React from 'react';
import { ScrollView } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotCrying from '../../../../assets/images/brand/mascot-crying.svg';

import { RecoveryTimerCard } from './components';
import { useAccountRecoveryScreen } from './useAccountRecoveryScreen';

const MASCOT_SIZE = 200;

/** Shown while a deletion request is still reversible (804:25371). */
export const AccountRecoveryScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { countdown, handleRestore, handleLogout } = useAccountRecoveryScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:account-recovery.title')} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <MascotCrying width={MASCOT_SIZE} height={MASCOT_SIZE} />

                <AppText variant="titleLarge" accessibilityRole="header" style={styles.headline}>
                    {t('profile:account-recovery.headline')}
                </AppText>

                <RecoveryTimerCard caption={t('profile:account-recovery.caption')} countdown={countdown} />

                <AppText variant="bodySmallReg" style={[styles.headline, styles.muted]}>
                    {t('profile:account-recovery.description')}
                </AppText>
            </ScrollView>

            <ScreenActions>
                <AppButton label={t('profile:account-recovery.restore')} onPress={handleRestore} fullWidth />
                <AppButton
                    variant="secondary"
                    label={t('profile:account-recovery.logout')}
                    onPress={handleLogout}
                    fullWidth
                />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        // The design lays out on 812; on a 667pt screen the block scrolls.
        flexGrow: 1,
        alignItems: 'center',
        gap: theme.spacing[6],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
    },
    headline: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
