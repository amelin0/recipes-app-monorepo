import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppCard, AppScreen, AppText, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CopyIcon from '../../../../assets/icons/copy.svg';
import ExportIcon from '../../../../assets/icons/export.svg';

import { ReferralStatBox } from './components';
import { useReferralScreen } from './useReferralScreen';

const HOW_IT_WORKS = ['send', 'install', 'reward'] as const;

/** Invite a friend, both get a free month (804:24649). */
export const ReferralScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['profile']);
    const { code, joined, earned, handleCopy, handleShare } = useReferralScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:referral-screen.title')} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <AppCard style={styles.card}>
                    <View style={styles.pitch}>
                        <AppText variant="bodyLargeBold" style={styles.centered}>
                            {t('profile:referral-screen.pitch-title')}
                        </AppText>
                        <AppText variant="bodySmallReg" style={[styles.centered, styles.muted]}>
                            {t('profile:referral-screen.pitch-description')}
                        </AppText>
                    </View>

                    <View style={styles.stats}>
                        <ReferralStatBox
                            label={t('profile:referral-screen.joined-label')}
                            value={String(joined)}
                            caption={t('profile:referral-screen.joined-caption', { count: joined })}
                        />
                        <ReferralStatBox
                            label={t('profile:referral-screen.earned-label')}
                            value={String(earned)}
                            caption={t('profile:referral-screen.earned-caption', { count: earned })}
                        />
                    </View>
                </AppCard>

                <AppCard style={styles.card}>
                    <AppText variant="bodyMediumBold" style={styles.left}>
                        {t('profile:referral-screen.code-title')}
                    </AppText>
                    <View style={styles.codeBox}>
                        <AppText variant="titleMedium" style={styles.centered}>
                            {code}
                        </AppText>
                    </View>
                    <View style={styles.codeActions}>
                        <AppButton
                            variant="secondary"
                            size="md"
                            label={t('profile:referral-screen.copy')}
                            onPress={handleCopy}
                            leftSlot={<CopyIcon width={20} height={20} color={theme.colors.elements.primary} />}
                            style={styles.codeAction}
                        />
                        <AppButton
                            size="md"
                            label={t('profile:referral-screen.share')}
                            onPress={handleShare}
                            leftSlot={<ExportIcon width={20} height={20} color={theme.colors.semantic.white} />}
                            style={styles.codeAction}
                        />
                    </View>
                </AppCard>

                <AppCard style={styles.card}>
                    <AppText variant="bodyMediumBold" style={styles.left}>
                        {t('profile:referral-screen.how-title')}
                    </AppText>
                    {HOW_IT_WORKS.map((step, index) => (
                        <View key={step} style={styles.stepRow}>
                            <View style={styles.stepBadge}>
                                <AppText variant="bodySmallBold" style={styles.stepNumber}>
                                    {String(index + 1)}
                                </AppText>
                            </View>
                            <AppText variant="bodySmallReg" style={styles.stepText}>
                                {t(`profile:referral-screen.how.${step}`)}
                            </AppText>
                        </View>
                    ))}
                </AppCard>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        gap: theme.spacing[6],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
        paddingBottom: theme.spacing[10],
    },
    card: {
        alignItems: 'flex-start',
        gap: theme.spacing[4],
    },
    pitch: {
        width: '100%',
        alignItems: 'center',
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    left: {
        width: '100%',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    stats: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: theme.spacing[2],
    },
    codeBox: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[3],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    codeActions: {
        width: '100%',
        flexDirection: 'row',
        gap: theme.spacing[2],
    },
    // `fullWidth` stretches on the cross axis; inside a row each takes half.
    codeAction: {
        flex: 1,
    },
    stepRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    stepBadge: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.branding.accent,
    },
    stepNumber: {
        color: theme.colors.semantic.white,
    },
    stepText: {
        flex: 1,
        minWidth: 0,
    },
}));
