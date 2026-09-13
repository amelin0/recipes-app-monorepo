import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import type { Plan } from '@/data';
import { formatThousands } from '@/shared/helpers';
import { useActionLock } from '@/shared/hooks';
import { ToastService } from '@/shared/services';
import { apiErrorStatus } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetNutritionGoal } from '@/state/domains/nutrition';
import { useGetProfile } from '@/state/domains/user';
import {
    useDescribeReferralCode,
    useDismissPaywall,
    useGetPlans,
    useRedeemReferralCode,
} from '@/state/domains/subscription';

import { PLAN_ID_BY_PERIOD, type SubscriptionPlanId } from '../subscription.constants';

export const usePaywallScreen = () => {
    const { t } = useAppTranslation(['subscription', 'common']);
    // Імʼя й ціль беремо з сервера, а не з локальних відповідей анкети: на
    // іншому пристрої зріз порожній, і шапка писала б «0 ккал/день».
    const { data: profile } = useGetProfile();
    const { data: goal } = useGetNutritionGoal();
    const setupName = useStore(state => state.profileSetup.name);

    const { data, isLoading, isError, refetch } = useGetPlans();
    const describeCode = useDescribeReferralCode();
    const redeemCode = useRedeemReferralCode();
    const dismissPaywall = useDismissPaywall();

    const plans = useMemo(() => data?.plans ?? [], [data]);
    const planOf = useCallback(
        (id: SubscriptionPlanId) => plans.find(plan => PLAN_ID_BY_PERIOD[plan.period] === id),
        [plans],
    );

    /** The API says which row opens selected; `year` is the fallback shape. */
    const defaultPlanId: SubscriptionPlanId =
        PLAN_ID_BY_PERIOD[plans.find(plan => plan.isDefault)?.period ?? 'year'] ?? 'year';

    const [pickedPlanId, setPickedPlanId] = useState<SubscriptionPlanId | null>(null);
    const selectedPlanId = pickedPlanId ?? defaultPlanId;

    const [trialEnabled, setTrialEnabled] = useState(false);
    const [isCodeFieldOpen, setCodeFieldOpen] = useState(false);
    const [codeDraft, setCodeDraft] = useState('');
    const [appliedCode, setAppliedCode] = useState<string | null>(null);
    const [freeMonths, setFreeMonths] = useState(0);

    const selectedPlan: Plan | undefined = planOf(selectedPlanId);

    /** A referral that covers the whole first period leaves nothing to charge. */
    const isFree = freeMonths > 0 && (selectedPlan?.period === 'month' || freeMonths >= 12);

    const selectPlan = useCallback((id: SubscriptionPlanId) => {
        setPickedPlanId(id);
        // The trial is advertised as «з річним планом», so it cannot ride
        // along on a monthly subscription.
        if (id !== 'year') setTrialEnabled(false);
    }, []);

    const toggleTrial = useCallback((value: boolean) => {
        setTrialEnabled(value);
        if (value) setPickedPlanId('year');
    }, []);

    const openCodeField = useCallback(() => setCodeFieldOpen(true), []);

    /**
     * The code is checked before it is spent — the server decides what it
     * grants and whether it is still redeemable, and the paywall only mirrors
     * the answer.
     */
    const applyCode = useCallback(() => {
        const code = codeDraft.trim().toUpperCase();
        if (!code || describeCode.isPending) return;

        describeCode.mutate(code, {
            onSuccess: offer => {
                setAppliedCode(offer.code);
                setFreeMonths(offer.freeMonths);
                setCodeFieldOpen(false);
                setCodeDraft('');
                // The grant lands on a specific plan (FR-009) — move the
                // selection there rather than price the wrong row at zero.
                setPickedPlanId(PLAN_ID_BY_PERIOD[offer.planSlug === 'annual' ? 'year' : 'month'] ?? 'month');
                setTrialEnabled(false);
            },
            onError: error => {
                ToastService.error(
                    apiErrorStatus(error) === 404
                        ? t('subscription:paywall.referral.unknown')
                        : t('common:states.error'),
                );
            },
        });
    }, [codeDraft, describeCode, t]);

    const removeCode = useCallback(() => {
        setAppliedCode(null);
        setFreeMonths(0);
        setPickedPlanId(null);
    }, []);

    const handleSkip = useCallback(() => {
        // Пейвол більше не має відкриватись сам — це стан на сервері, і без
        // цього виклику він показувався б на кожному старті.
        dismissPaywall.mutate();
        router.replace('/(app)/(tabs)/home');
    }, [dismissPaywall]);

    const lock = useActionLock();

    const handleSubscribe = useCallback(() => {
        if (!lock.acquire()) return;

        // Реферальний місяць не платить ніхто, тож підписку можна оформити тут
        // і зараз. Платний план вимагає квитанції магазину, а IAP-модуля в
        // застосунку ще немає (handoff §4.8).
        if (appliedCode && isFree) {
            redeemCode.mutate(
                { code: appliedCode },
                {
                    onSuccess: () =>
                        router.replace({
                            pathname: '/(app)/subscription-success',
                            params: { code: appliedCode },
                        }),
                    onError: () => {
                        ToastService.error(t('common:states.error'));
                        lock.release();
                    },
                },
            );
            return;
        }

        // Платний план поки лише повідомляє — кнопку треба відпустити.
        lock.release();
        ToastService.info(t('subscription:paywall.store-pending'));
    }, [appliedCode, isFree, lock, redeemCode, t]);

    return {
        isLoading,
        isError,
        handleRetry: refetch,
        name: profile?.name ?? setupName,
        targetWeight: profile?.targetWeightKg ? Math.round(profile.targetWeightKg) : null,
        calories: formatThousands(goal?.dailyCalories ?? 0),
        plans,
        features: data?.features ?? [],
        yearPlan: planOf('year'),
        monthPlan: planOf('month'),
        selectedPlanId,
        selectedPlan,
        isFree,
        trialEnabled,
        appliedCode,
        isCodeFieldOpen,
        codeDraft,
        setCodeDraft,
        isApplyingCode: describeCode.isPending,
        isSubscribing: redeemCode.isPending || lock.isBusy(),
        selectPlan,
        toggleTrial,
        openCodeField,
        applyCode,
        removeCode,
        handleSkip,
        handleSubscribe,
    };
};
