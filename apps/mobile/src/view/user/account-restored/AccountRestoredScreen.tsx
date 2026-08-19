import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotRestored from '../../../../assets/images/brand/mascot-restored.svg';

import { useAccountRestoredScreen } from './useAccountRestoredScreen';

const MASCOT_SIZE = 200;

/** The deletion request was cancelled in time (804:25392). */
export const AccountRestoredScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { handleContinue } = useAccountRestoredScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <MascotRestored width={MASCOT_SIZE} height={MASCOT_SIZE} />

                <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                    {t('profile:account-restored.title')}
                </AppText>
                <AppText variant="bodySmallReg" style={[styles.centered, styles.muted]}>
                    {t('profile:account-restored.description')}
                </AppText>
            </View>

            <ScreenActions>
                <AppButton label={t('profile:account-restored.continue')} onPress={handleContinue} fullWidth />
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
        // 804:25395 sits 152 from the frame top — 90 below the 62pt status bar —
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
