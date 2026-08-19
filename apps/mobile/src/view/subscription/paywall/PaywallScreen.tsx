import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppInput, AppScreen, AppSwitch, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotChef from '../../../../assets/images/brand/mascot-chef.svg';
import { FeatureList, PlanOption, ReferralBanner, SocialProof } from '../components';
import { STORE_RATING, SUBSCRIPTION_FEATURES, TRIAL_DAYS } from '../subscription.constants';
import { formatPrice } from '../subscription.helpers';

import { usePaywallScreen } from './usePaywallScreen';

const BRAND_ICON_SIZE = 64;

/** Subscription pitch shown once the questionnaire is done (911:52758). */
export const PaywallScreen = () => {
    const { t } = useAppTranslation(['subscription']);
    const {
        name,
        targetWeight,
        calories,
        plans,
        selectedPlanId,
        selectedPlan,
        isFree,
        trialEnabled,
        appliedCode,
        isCodeFieldOpen,
        codeDraft,
        setCodeDraft,
        selectPlan,
        toggleTrial,
        openCodeField,
        applyCode,
        removeCode,
        handleSkip,
        handleSubscribe,
    } = usePaywallScreen();

    const tone = appliedCode ? 'orange' : 'positive';
    const [yearPlan, monthPlan] = plans;

    return (
        <AppScreen>
            <View style={styles.topBar}>
                <View style={styles.brand}>
                    <MascotChef width={BRAND_ICON_SIZE} height={BRAND_ICON_SIZE} />
                    <AppText variant="brandWordmark">{t('subscription:brand')}</AppText>
                </View>
                <AppButton
                    variant="secondary"
                    size="md"
                    label={t('subscription:paywall.skip')}
                    onPress={handleSkip}
                    // AppButton pins itself to the cross-start unless it is
                    // full-width; the bar centers it (911:52853).
                    style={styles.skip}
                />
            </View>

            <ScrollView style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <AppText variant="titleMedium" accessibilityRole="header" style={styles.centered}>
                        {t('subscription:paywall.title', { name })}
                    </AppText>
                    <AppText variant="bodyLargeReg" style={[styles.centered, styles.muted]}>
                        {t('subscription:paywall.subtitle', { weight: targetWeight, calories })}
                    </AppText>
                </View>

                <View style={styles.includedCard}>
                    <AppText variant="bodyLargeBold" style={styles.cardTitle}>
                        {t('subscription:paywall.included.title')}
                    </AppText>

                    <FeatureList items={SUBSCRIPTION_FEATURES.map(feature => t(`subscription:features.${feature}`))} />

                    <SocialProof
                        rating={STORE_RATING}
                        users={t('subscription:paywall.social.users')}
                        quote={t('subscription:paywall.social.quote')}
                        author={t('subscription:paywall.social.author')}
                    />
                </View>

                <View style={styles.plansCard}>
                    <AppText variant="bodyLargeBold" style={styles.cardTitle}>
                        {t('subscription:paywall.plans-title')}
                    </AppText>

                    <View style={styles.plans}>
                        <PlanOption
                            title={t('subscription:plans.year')}
                            listPrice={yearPlan?.listPrice ? formatPrice(yearPlan.listPrice) : undefined}
                            price={yearPlan ? formatPrice(yearPlan.price) : undefined}
                            period={t('subscription:paywall.per-year-suffix')}
                            trailing={t('subscription:period.month-short', {
                                price: formatPrice(yearPlan?.monthlyPrice ?? 0),
                            })}
                            selected={selectedPlanId === 'year'}
                            tone={tone}
                            onPress={() => selectPlan('year')}
                        />

                        <PlanOption
                            title={t('subscription:plans.month')}
                            caption={t('subscription:paywall.no-trial')}
                            trailing={
                                appliedCode
                                    ? t('subscription:plans.free')
                                    : t('subscription:period.month-short', {
                                          price: formatPrice(monthPlan?.monthlyPrice ?? 0),
                                      })
                            }
                            selected={selectedPlanId === 'month'}
                            tone={tone}
                            onPress={() => selectPlan('month')}
                        />

                        {yearPlan?.savingPercent ? (
                            <View style={styles.savingBadge}>
                                <AppText variant="bodySmallBold" style={styles.savingLabel}>
                                    {t('subscription:paywall.saving', { percent: yearPlan.savingPercent })}
                                </AppText>
                            </View>
                        ) : null}
                    </View>

                    {appliedCode ? (
                        <ReferralBanner
                            title={t('subscription:paywall.referral.applied-title', { code: appliedCode })}
                            description={t('subscription:paywall.referral.applied-subtitle')}
                            removeLabel={t('subscription:paywall.referral.remove')}
                            onRemove={removeCode}
                        />
                    ) : (
                        <>
                            <View style={styles.trialRow}>
                                <AppSwitch
                                    value={trialEnabled}
                                    onValueChange={toggleTrial}
                                    tone="positive"
                                    accessibilityLabel={t('subscription:paywall.trial', { days: TRIAL_DAYS })}
                                />
                                <AppText style={styles.trialLabel}>
                                    {t('subscription:paywall.trial', { days: TRIAL_DAYS })}
                                </AppText>
                            </View>

                            {isCodeFieldOpen ? (
                                <AppInput
                                    value={codeDraft}
                                    onChangeText={setCodeDraft}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    placeholder={t('subscription:paywall.referral.placeholder')}
                                    onSubmitEditing={applyCode}
                                    returnKeyType="done"
                                    rightSlot={
                                        <Pressable accessibilityRole="button" hitSlop={8} onPress={applyCode}>
                                            <AppText variant="bodyMediumBold" style={styles.accent}>
                                                {t('subscription:paywall.referral.apply')}
                                            </AppText>
                                        </Pressable>
                                    }
                                />
                            ) : (
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={openCodeField}
                                    style={styles.referralPrompt}
                                >
                                    <AppText variant="titleSmall">🎟️</AppText>
                                    <AppText variant="bodyMediumBold" style={styles.accent}>
                                        {t('subscription:paywall.referral.prompt')}
                                    </AppText>
                                </Pressable>
                            )}
                        </>
                    )}

                    <View style={styles.cta}>
                        <AppButton
                            fullWidth
                            label={t(isFree ? 'subscription:paywall.cta-free' : 'subscription:paywall.cta')}
                            onPress={handleSubscribe}
                        />
                        <AppText variant="bodySmallReg" style={[styles.centered, styles.muted]}>
                            {isFree
                                ? t('subscription:paywall.disclaimer-free')
                                : trialEnabled
                                  ? t('subscription:paywall.disclaimer-trial', {
                                        days: TRIAL_DAYS,
                                        price: formatPrice(selectedPlan.price),
                                    })
                                  : t('subscription:paywall.disclaimer', {
                                        price: formatPrice(selectedPlan.price),
                                    })}
                        </AppText>
                    </View>
                </View>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    fill: {
        flex: 1,
    },
    topBar: {
        height: 72,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skip: {
        alignSelf: 'center',
    },
    content: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
        paddingBottom: theme.spacing[10],
    },
    header: {
        width: '100%',
        gap: theme.spacing[3],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    accent: {
        color: theme.colors.branding.accent,
    },
    cardTitle: {
        width: '100%',
    },
    includedCard: {
        width: '100%',
        gap: theme.spacing[3],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        overflow: 'hidden',
        ...theme.shadow.block,
    },
    plansCard: {
        width: '100%',
        gap: theme.spacing[6],
        // Figma centers this card's 1px stroke on the 343 box (its export keeps
        // padding at 16, unlike the inside-stroked pill which reports 17), so
        // the content box stays 311 wide. RN draws borders inside the box, so
        // the padding absorbs the stroke — at 16 the trial line loses the 2px
        // it needs and wraps.
        padding: theme.spacing[4] - 1,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.forms.softOrangeBorder,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    plans: {
        width: '100%',
        gap: theme.spacing[4],
    },
    savingBadge: {
        position: 'absolute',
        top: -10,
        right: 44,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[1],
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.positive,
    },
    savingLabel: {
        color: theme.colors.semantic.white,
    },
    trialRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    trialLabel: {
        flex: 1,
    },
    referralPrompt: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
    },
    cta: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[3],
    },
}));
