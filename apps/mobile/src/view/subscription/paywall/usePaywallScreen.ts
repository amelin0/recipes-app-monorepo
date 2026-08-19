import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { formatThousands } from '@/shared/helpers';
import { useStore } from '@/state';

import {
    DEFAULT_PLAN_ID,
    REFERRAL_FREE_MONTHS,
    SUBSCRIPTION_PLANS,
    type SubscriptionPlanId,
} from '../subscription.constants';
import { chargedNow } from '../subscription.helpers';

export const usePaywallScreen = () => {
    const profile = useStore(state => state.profileSetup);

    const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>(DEFAULT_PLAN_ID);
    const [trialEnabled, setTrialEnabled] = useState(false);
    const [isCodeFieldOpen, setCodeFieldOpen] = useState(false);
    const [codeDraft, setCodeDraft] = useState('');
    const [appliedCode, setAppliedCode] = useState<string | null>(null);

    const selectedPlan = useMemo(
        () => SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlanId) ?? SUBSCRIPTION_PLANS[0]!,
        [selectedPlanId],
    );

    const referralFreeMonths = appliedCode ? REFERRAL_FREE_MONTHS : 0;
    const isFree = chargedNow(selectedPlan, referralFreeMonths) === 0;

    const selectPlan = useCallback((id: SubscriptionPlanId) => {
        setSelectedPlanId(id);
        // The trial is advertised as «з річним планом», so it cannot ride along
        // on a monthly subscription.
        if (id !== 'year') setTrialEnabled(false);
    }, []);

    const toggleTrial = useCallback((value: boolean) => {
        setTrialEnabled(value);
        if (value) setSelectedPlanId('year');
    }, []);

    const openCodeField = useCallback(() => setCodeFieldOpen(true), []);

    // TODO: validate the code against the API — it decides what the code grants
    // and whether it is still redeemable.
    const applyCode = useCallback(() => {
        const code = codeDraft.trim().toUpperCase();
        if (!code) return;

        setAppliedCode(code);
        setCodeFieldOpen(false);
        setCodeDraft('');
        // A referral covers the first month, so it only pays off on the monthly
        // plan — the design moves the selection there (911:53570).
        setSelectedPlanId('month');
        setTrialEnabled(false);
    }, [codeDraft]);

    const removeCode = useCallback(() => {
        setAppliedCode(null);
        setSelectedPlanId(DEFAULT_PLAN_ID);
    }, []);

    const handleSkip = useCallback(() => {
        router.replace('/(app)/(tabs)/home');
    }, []);

    // TODO: run the store purchase first; the success screen is only reached
    // once the receipt is confirmed.
    const handleSubscribe = useCallback(() => {
        router.replace({
            pathname: '/(app)/subscription-success',
            params: {
                plan: selectedPlanId,
                ...(appliedCode ? { code: appliedCode } : {}),
                ...(trialEnabled ? { trial: '1' } : {}),
            },
        });
    }, [appliedCode, selectedPlanId, trialEnabled]);

    return {
        name: profile.name,
        targetWeight: profile.targetWeightKg ? Math.round(profile.targetWeightKg) : null,
        calories: formatThousands(profile.calorieGoal ?? 0),
        plans: SUBSCRIPTION_PLANS,
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
    };
};
