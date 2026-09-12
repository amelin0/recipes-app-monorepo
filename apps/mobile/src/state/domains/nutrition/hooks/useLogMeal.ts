import { useMutation } from '@tanstack/react-query';

import { NutritionApi, type LogMealPayload } from '@/data';
import { queryClient, nutritionKeys } from '@/shared/services';

interface LogMealVariables extends LogMealPayload {
    /** The day the meal counts towards, device-local `YYYY-MM-DD`. */
    date: string;
}

/**
 * Records a meal. This is also what marks a planned dish as eaten — the mark
 * and the calorie ring read the same log, so there is no second endpoint and
 * no way for the two to disagree.
 */
export const useLogMeal = () =>
    useMutation({
        mutationFn: ({ date, ...payload }: LogMealVariables) => NutritionApi.logMeal(date, payload),
        onSuccess: (_entry, variables) => {
            queryClient.invalidateQueries({ queryKey: nutritionKeys.day(variables.date) });
        },
    });

/** Un-marks a dish, or removes a meal logged by mistake. */
export const useDeleteMeal = () =>
    useMutation({
        mutationFn: ({ date, id }: { date: string; id: string }) => NutritionApi.deleteMeal(date, id),
        onSuccess: (_void, variables) => {
            queryClient.invalidateQueries({ queryKey: nutritionKeys.day(variables.date) });
        },
    });
