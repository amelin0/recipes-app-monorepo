import { useCallback, useMemo } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatFullDate } from '@/shared/helpers';
import { useStore } from '@/state';

import {
    REFERRAL_FREE_MONTHS,
    SUBSCRIPTION_PLANS,
    TRIAL_DAYS,
    type SubscriptionPlanId,
} from '../subscription.constants';
import { addMonths, chargedNow, daysBetween } from '../subscription.helpers';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const useSubscriptionSuccessScreen = () => {
    const profile = useStore(state => state.profileSetup);
    const {
        plan: planParam,
        code,
        trial,
    } = useLocalSearchParams<{
        plan?: SubscriptionPlanId;
        /** Referral code the purchase was made with, when there was one. */
        code?: string;
        /** '1' while the yearly trial was toggled on. */
        trial?: string;
    }>();

    const plan = useMemo(
        () => SUBSCRIPTION_PLANS.find(item => item.id === planParam) ?? SUBSCRIPTION_PLANS[0]!,
        [planParam],
    );

    // TODO: the dates belong to the receipt — read them from the subscription
    // the API returns instead of deriving them from "now".
    const { start, end } = useMemo(() => {
        const startedAt = new Date();
        const paidUntil = addMonths(startedAt, plan.months);
        if (trial === '1') paidUntil.setTime(paidUntil.getTime() + TRIAL_DAYS * MS_PER_DAY);
        return { start: startedAt, end: paidUntil };
    }, [plan.months, trial]);

    const referralFreeMonths = code ? REFERRAL_FREE_MONTHS : 0;
    const isFree = chargedNow(plan, referralFreeMonths) === 0;

    const handleDone = useCallback(() => {
        router.replace('/(app)/(tabs)/home');
    }, []);

    return {
        name: profile.name,
        plan,
        referralCode: code ?? null,
        isFree,
        startDate: formatFullDate(start),
        endDate: formatFullDate(end),
        remainingDays: daysBetween(start, end),
        handleDone,
    };
};
