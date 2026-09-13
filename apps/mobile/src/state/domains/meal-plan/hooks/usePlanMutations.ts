import { useMutation } from '@tanstack/react-query';

import { MealPlanApi, type AddPlanItemPayload } from '@/data';
import { queryClient, Queries } from '@/shared/services';

/**
 * Any plan write invalidates every plan range, not one key: the same day
 * appears in the home screen's single-day read and the plan tab's fortnight,
 * and leaving one of them stale would show the dish on one screen only.
 *
 * The shopping list goes with it — it is summed from the plan on every read,
 * so a new dish changes what it contains.
 */
const invalidatePlan = () => {
    queryClient.invalidateQueries({ queryKey: [Queries.MealPlan] });
    queryClient.invalidateQueries({ queryKey: [Queries.ShoppingList] });
    queryClient.invalidateQueries({ queryKey: [Queries.NutritionDay] });
};

export const useAddPlanItem = () =>
    useMutation({
        mutationFn: ({ date, ...payload }: AddPlanItemPayload & { date: string }) => MealPlanApi.addItem(date, payload),
        onSuccess: invalidatePlan,
    });

export const useRemovePlanItem = () =>
    useMutation({
        mutationFn: ({ date, itemId }: { date: string; itemId: string }) => MealPlanApi.removeItem(date, itemId),
        onSuccess: invalidatePlan,
    });

export const useClearPlanDay = () =>
    useMutation({
        mutationFn: (date: string) => MealPlanApi.clearDay(date),
        onSuccess: invalidatePlan,
    });

export const useCopyPlanDay = () =>
    useMutation({
        mutationFn: ({ date, targetDates }: { date: string; targetDates: string[] }) =>
            MealPlanApi.copyDay(date, { targetDates }),
        onSuccess: invalidatePlan,
    });
