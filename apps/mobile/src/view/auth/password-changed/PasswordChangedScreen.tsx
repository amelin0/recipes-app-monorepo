import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CheckIcon from '../../../../assets/icons/check.svg';

import { usePasswordChangedScreen } from './usePasswordChangedScreen';

export const PasswordChangedScreen = () => {
    const { t } = useAppTranslation(['auth']);
    const { theme } = useUnistyles();
    const { handleSignIn } = usePasswordChangedScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <View style={styles.badgeOuter}>
                    <View style={styles.badgeInner}>
                        <CheckIcon width={32} height={32} color={theme.colors.semantic.white} />
                    </View>
                </View>

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
        paddingHorizontal: theme.spacing[4],
        // Figma 686:26295 pins the block 208 from the frame top, i.e. 160 below
        // the status bar — it is deliberately above the optical centre.
        paddingTop: 160,
        gap: theme.spacing[3],
    },
    badgeOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.semantic.lightPositive,
    },
    badgeInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.semantic.positive,
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
