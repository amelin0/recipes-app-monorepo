import { useMutation, useQuery } from '@tanstack/react-query';

import { UserApi, type CompleteOnboardingPayload, type OnboardingState, type SaveOnboardingPayload } from '@/data';
import { queryClient, userKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * Questionnaire answers as the server holds them.
 *
 * The local slice stays the source the screens render from — wheels and
 * choices have to respond without a round trip — and this is what a fresh
 * install resumes from.
 */
export const useGetOnboarding = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: userKeys.onboarding(),
        queryFn: () => UserApi.getOnboarding(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
};

/**
 * One answer per call, as the questionnaire moves.
 *
 * Deliberately fire-and-forget at the call sites: the answer is already in
 * the local slice, so a failed write costs the resume point, not the answer.
 * Blocking «Далі» on the network would make a fourteen-step form feel like
 * fourteen loading screens.
 */
export const useSaveOnboarding = () =>
    useMutation({
        mutationFn: (payload: SaveOnboardingPayload) => UserApi.saveOnboarding(payload),
        onSuccess: (state: OnboardingState) => {
            queryClient.setQueryData(userKeys.onboarding(), state);
            // Норми рахуються з відповідей — нова відповідь робить попередню
            // рекомендацію застарілою.
            queryClient.invalidateQueries({ queryKey: userKeys.recommendations() });
        },
    });

/**
 * The computed daily norms. `null` until the questionnaire holds enough
 * answers to compute them, which is why the goal screens must cope with the
 * recommendation being absent rather than assume a number.
 */
export const useGetRecommendations = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: userKeys.recommendations(),
        queryFn: () => UserApi.getRecommendations(),
        enabled: isAuthenticated,
    });
};

/**
 * Closes the questionnaire and writes the daily goal. 400
 * `user.onboarding-incomplete` when an answer is still missing — which the
 * client should never provoke, since the steps are ordered.
 */
export const useCompleteOnboarding = () =>
    useMutation({
        mutationFn: (payload: CompleteOnboardingPayload) => UserApi.completeOnboarding(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.onboarding() });
            queryClient.invalidateQueries({ queryKey: userKeys.profile() });
        },
    });
