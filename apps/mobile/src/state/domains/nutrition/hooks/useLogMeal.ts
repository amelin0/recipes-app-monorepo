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
        onSuccess: (_entry, variables) =>
            // Повертаємо проміс інвалідації навмисно: доки день не перечитано,
            // мутація лишається `isPending`, а кнопка — зайнятою. Інакше між
            // відповіддю сервера й свіжими даними є вікно, у якому рядок ще
            // виглядає невідміченим і його можна натиснути вдруге.
            queryClient.invalidateQueries({ queryKey: nutritionKeys.day(variables.date) }),
    });

/** Un-marks a dish, or removes a meal logged by mistake. */
export const useDeleteMeal = () =>
    useMutation({
        mutationFn: ({ date, id }: { date: string; id: string }) => NutritionApi.deleteMeal(date, id),
        onSuccess: (_void, variables) => queryClient.invalidateQueries({ queryKey: nutritionKeys.day(variables.date) }),
    });
