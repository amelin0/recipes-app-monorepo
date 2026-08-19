import React from 'react';
import { Image, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useSetupNotificationsScreen } from './useSetupNotificationsScreen';

/** Asks for notification permission before the system prompt (882:141160). */
export const SetupNotificationsScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { handleSkip, handleAllow } = useSetupNotificationsScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <Image
                    source={require('../../../../assets/images/onboarding/notifications.png')}
                    style={styles.illustration}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                />

                <View style={styles.header}>
                    <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                        {t('onboarding:setup.notifications.title')}
                    </AppText>
                    <AppText variant="bodyLargeReg" style={[styles.centered, styles.muted]}>
                        {t('onboarding:setup.notifications.subtitle')}
                    </AppText>
                </View>
            </View>

            <View style={styles.footer}>
                <AppButton variant="liquid" label={t('onboarding:setup.notifications.skip')} onPress={handleSkip} />
                <AppButton
                    label={t('onboarding:setup.notifications.allow')}
                    onPress={handleAllow}
                    style={styles.allow}
                />
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[4],
        // Design hangs the block 64 under the frame's own 62 offset.
        paddingTop: theme.spacing[16],
        paddingBottom: theme.spacing[6],
        gap: theme.spacing[10],
    },
    illustration: {
        width: 333,
        height: 203,
    },
    header: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
    allow: {
        width: 200,
    },
}));
