import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppCard, AppScreen, AppText, ScreenActions, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import TrashIcon from '../../../../assets/icons/trash.svg';

import { DangerBadge } from './components';
import { useAccountDeleteScreen } from './useAccountDeleteScreen';

const CONSEQUENCES = ['trackers', 'profile', 'subscription', 'referral'] as const;

/** First step of deleting the account — what it costs (804:24924). */
export const AccountDeleteScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['profile']);
    const { handleContinue, handleCancel } = useAccountDeleteScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:delete-flow.title')} />

            <View style={styles.content}>
                <DangerBadge>
                    <TrashIcon width={32} height={32} color={theme.colors.semantic.white} />
                </DangerBadge>

                <AppText variant="titleSmall" accessibilityRole="header" style={styles.centered}>
                    {t('profile:delete-flow.warning-title')}
                </AppText>

                <AppCard style={styles.card}>
                    <AppText variant="bodySmallReg" style={[styles.centered, styles.muted]}>
                        {t('profile:delete-flow.consequences-intro')}
                    </AppText>
                    {CONSEQUENCES.map(item => (
                        <View key={item} style={styles.bulletRow}>
                            <View style={styles.bullet} />
                            <AppText variant="bodySmallReg" style={styles.bulletText}>
                                {t(`profile:delete-flow.consequences.${item}`)}
                            </AppText>
                        </View>
                    ))}
                </AppCard>
            </View>

            <ScreenActions>
                <AppButton
                    variant="destructive"
                    label={t('profile:delete-flow.continue')}
                    onPress={handleContinue}
                    fullWidth
                />
                <AppButton
                    variant="secondary"
                    label={t('profile:delete-flow.cancel')}
                    onPress={handleCancel}
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
        paddingTop: theme.spacing[3],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    card: {
        alignItems: 'flex-start',
        gap: theme.spacing[4],
    },
    bulletRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    bullet: {
        width: 8,
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.negative,
    },
    bulletText: {
        flex: 1,
        minWidth: 0,
    },
}));
