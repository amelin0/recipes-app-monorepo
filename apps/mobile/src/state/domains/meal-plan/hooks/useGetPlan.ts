import { useQuery } from '@tanstack/react-query';

import { MealPlanApi } from '@/data';
import { mealPlanKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * The plan for a closed range of days, inclusive. Empty days come back too,
 * so the caller never has to invent a blank one for a date the API skipped.
 */
export const useGetPlan = (from: string, to: string) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: mealPlanKeys.plan(from, to),
        queryFn: () => MealPlanApi.getPlan(from, to),
        enabled: isAuthenticated && Boolean(from) && Boolean(to),
        staleTime: 30_000,
    });
};
