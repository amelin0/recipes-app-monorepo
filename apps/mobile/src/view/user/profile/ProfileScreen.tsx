import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppScreen, AppText, Avatar, CircleBackButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import DocumentTextIcon from '../../../../assets/icons/document-text.svg';
import LanguageSquareIcon from '../../../../assets/icons/language-square.svg';
import LockCircleIcon from '../../../../assets/icons/lock-circle.svg';
import LogoutIcon from '../../../../assets/icons/logout.svg';
import MessageQuestionIcon from '../../../../assets/icons/message-question.svg';
import ScaleIcon from '../../../../assets/icons/scale.svg';
import StarIcon from '../../../../assets/icons/star.svg';
import TrashIcon from '../../../../assets/icons/trash.svg';
import UserOctagonIcon from '../../../../assets/icons/user-octagon.svg';
import { ProfileRow } from '../components';

import { useProfileScreen } from './useProfileScreen';

export const ProfileScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['profile']);
    const {
        name,
        initials,
        versionLabel,
        handleEdit,
        handleSubscription,
        handleRateUs,
        handleLanguage,
        handleUnits,
        handleFaq,
        handlePrivacy,
        handleTerms,
        handleDeleteAccount,
        handleLogout,
    } = useProfileScreen();

    const primary = theme.colors.elements.primary;
    const negative = theme.colors.semantic.negative;

    return (
        <AppScreen>
            <View style={styles.headerBar}>
                <CircleBackButton />
                <AppText variant="bodyLargeBold" style={styles.headerTitle}>
                    {t('profile:title')}
                </AppText>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.userBlock}>
                    <Avatar
                        label={initials}
                        size={64}
                        labelVariant="titleSmall"
                        accessibilityLabel={t('profile:avatar-a11y')}
                    />
                    <AppText variant="titleSmall">{name}</AppText>
                    <Pressable accessibilityRole="button" hitSlop={8} onPress={handleEdit}>
                        <AppText variant="bodySmallReg" style={styles.editLink}>
                            {t('profile:edit')}
                        </AppText>
                    </Pressable>
                </View>

                <View style={styles.sectionCard}>
                    <AppText variant="bodyMediumBold">{t('profile:account.title')}</AppText>
                    <View style={styles.rows}>
                        <ProfileRow
                            icon={<UserOctagonIcon width={20} height={20} color={primary} />}
                            label={t('profile:account.subscription')}
                            trailing={
                                <View style={styles.premiumTag}>
                                    <AppText variant="bodySmallBold">{t('profile:account.premium-tag')}</AppText>
                                </View>
                            }
                            onPress={handleSubscription}
                        />
                        <ProfileRow
                            icon={<StarIcon width={20} height={20} color={primary} />}
                            label={t('profile:account.rate-us')}
                            onPress={handleRateUs}
                        />
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <AppText variant="bodyMediumBold">{t('profile:settings.title')}</AppText>
                    <View style={styles.rows}>
                        <ProfileRow
                            icon={<LanguageSquareIcon width={20} height={20} color={primary} />}
                            label={t('profile:settings.language')}
                            onPress={handleLanguage}
                        />
                        <ProfileRow
                            icon={<ScaleIcon width={20} height={20} color={primary} />}
                            label={t('profile:settings.units')}
                            onPress={handleUnits}
                        />
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <AppText variant="bodyMediumBold">{t('profile:support.title')}</AppText>
                    <View style={styles.rows}>
                        <ProfileRow
                            icon={<MessageQuestionIcon width={20} height={20} color={primary} />}
                            label={t('profile:support.faq')}
                            onPress={handleFaq}
                        />
                        <ProfileRow
                            icon={<LockCircleIcon width={20} height={20} color={primary} />}
                            label={t('profile:support.privacy')}
                            onPress={handlePrivacy}
                        />
                        <ProfileRow
                            icon={<DocumentTextIcon width={20} height={20} color={primary} />}
                            label={t('profile:support.terms')}
                            onPress={handleTerms}
                        />
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <AppText variant="bodyMediumBold">{t('profile:danger.title')}</AppText>
                    <View style={styles.rows}>
                        <ProfileRow
                            icon={<TrashIcon width={20} height={20} color={negative} />}
                            label={t('profile:danger.delete-account')}
                            destructive
                            showArrow={false}
                            onPress={handleDeleteAccount}
                        />
                        <ProfileRow
                            icon={<LogoutIcon width={20} height={20} color={negative} />}
                            label={t('profile:danger.logout')}
                            destructive
                            showArrow={false}
                            onPress={handleLogout}
                        />
                    </View>
                </View>

                <AppText variant="bodySmallReg" style={styles.version}>
                    {versionLabel}
                </AppText>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 44,
    },
    scroll: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
    userBlock: {
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    editLink: {
        color: theme.colors.branding.accent,
    },
    sectionCard: {
        gap: theme.spacing[4],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        width: '100%',
        ...theme.shadow.block,
    },
    rows: {
        gap: theme.spacing[2],
        width: '100%',
    },
    premiumTag: {
        paddingHorizontal: theme.spacing[2],
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.branding.accent,
    },
    version: {
        textAlign: 'center',
    },
}));
