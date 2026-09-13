import { useCallback } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatFullDate } from '@/shared/helpers';
import { useStore } from '@/state';
import { useGetPlans, useGetSubscription } from '@/state/domains/subscription';
import { useGetProfile } from '@/state/domains/user';

export const useSubscriptionSuccessScreen = () => {
    const { data: profile } = useGetProfile();
    const setupName = useStore(state => state.profileSetup.name);
    const { code } = useLocalSearchParams<{
        /** Referral code the purchase was made with, when there was one. */
        code?: string;
    }>();

    /**
     * The receipt reads the subscription the server just created, rather than
     * deriving dates from «now»: a trial, a referral month and a plain
     * purchase all end on different days, and only the server knows which.
     */
    const { data, isLoading, isError, refetch } = useGetSubscription();
    const subscription = data?.subscription ?? null;

    // Перелік переваг і невідкинута ціна живуть у пейволі, а не в самій
    // підписці — читаємо той самий довідник, що й екран вибору плану.
    const { data: paywall } = useGetPlans();
    const plan = paywall?.plans.find(item => item.id === subscription?.planId) ?? null;

    const handleDone = useCallback(() => {
        router.replace('/(app)/(tabs)/home');
    }, []);

    return {
        name: profile?.name ?? setupName,
        subscription,
        isLoading,
        isError,
        handleRetry: refetch,
        referralCode: subscription?.referralCode ?? code ?? null,
        /** Nothing was charged — a referral month or a trial. */
        isFree: (subscription?.pricePaidCents ?? 0) === 0,
        startDate: subscription ? formatFullDate(new Date(subscription.startedAt)) : '',
        endDate: subscription ? formatFullDate(new Date(subscription.expiresAt)) : '',
        remainingDays: subscription?.daysRemaining ?? 0,
        planName: subscription?.planName ?? '',
        isYearly: subscription?.period === 'year',
        pricePaidCents: subscription?.pricePaidCents ?? 0,
        currency: subscription?.currency ?? 'USD',
        /** Struck through only when something was actually taken off. */
        fullPriceCents: subscription?.fullPriceCents ?? plan?.fullPriceCents ?? null,
        features: paywall?.features ?? [],
        handleDone,
    };
};
