import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotRelax from '../../../../assets/images/brand/mascot-relax.svg';
import { FeatureList, SubscriptionSummaryCard } from '../components';
import { SUBSCRIPTION_FEATURES } from '../subscription.constants';
import { formatPrice } from '../subscription.helpers';

import { useSubscriptionSuccessScreen } from './useSubscriptionSuccessScreen';

const MASCOT_SIZE = 200;

/** Receipt for the subscription that was just activated (911:52560 / 911:52513 / 964:60760). */
export const SubscriptionSuccessScreen = () => {
    const { t } = useAppTranslation(['subscription']);
    const { name, plan, referralCode, isFree, startDate, endDate, remainingDays, handleDone } =
        useSubscriptionSuccessScreen();

    const periodKey = plan.id === 'year' ? 'subscription:period.year' : 'subscription:period.month';
    const price = isFree ? t('subscription:plans.free') : t(periodKey, { price: formatPrice(plan.price) });
    // The undiscounted figure only means something when something was taken off:
    // the yearly plan's list price, or the month a referral code covers.
    const undiscounted = plan.listPrice ?? (isFree ? plan.price : null);

    return (
        <AppScreen>
            <ScrollView style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <MascotRelax width={MASCOT_SIZE} height={MASCOT_SIZE} />
                    <View style={styles.header}>
                        <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                            {t('subscription:success.title', { name })}
                        </AppText>
                        <AppText variant="bodyLargeReg" style={[styles.centered, styles.muted]}>
                            {t('subscription:success.subtitle')}
                        </AppText>
                    </View>
                </View>

                <SubscriptionSummaryCard
                    label={t('subscription:success.plan-label')}
                    planName={t(`subscription:plans.${plan.id}`)}
                    price={price}
                    tag={referralCode ? t('subscription:success.referral-tag') : undefined}
                    fullPrice={
                        undiscounted
                            ? {
                                  label: t('subscription:success.full-price'),
                                  value: t(periodKey, { price: formatPrice(undiscounted) }),
                              }
                            : undefined
                    }
                    startLabel={t('subscription:success.starts')}
                    startValue={startDate}
                    endLabel={t('subscription:success.ends')}
                    endValue={endDate}
                    remainingLabel={t('subscription:success.remaining')}
                    remainingValue={t('subscription:success.remaining-days', { count: remainingDays })}
                    remainingProgress={1}
                />

                <View style={styles.unlockedCard}>
                    <AppText variant="bodyMediumBold" style={styles.cardTitle}>
                        {t('subscription:success.unlocked')}
                    </AppText>
                    <FeatureList
                        gap={12}
                        items={SUBSCRIPTION_FEATURES.map(feature => t(`subscription:features.${feature}`))}
                    />
                </View>
            </ScrollView>

            <ScreenActions style={styles.actions}>
                <AppButton fullWidth label={t('subscription:success.done')} onPress={handleDone} />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    fill: {
        flex: 1,
    },
    content: {
        alignItems: 'center',
        gap: theme.spacing[6],
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
    },
    hero: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[3],
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
    cardTitle: {
        width: '100%',
    },
    unlockedCard: {
        width: '100%',
        gap: theme.spacing[3],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    actions: {
        // The design pads this bar 12 above the button, not the 16 the shared
        // action bar uses everywhere else (911:52515).
        paddingTop: theme.spacing[3],
    },
}));
