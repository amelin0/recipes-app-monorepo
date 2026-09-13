import { useMutation } from '@tanstack/react-query';

import { NutritionApi } from '@/data';
import { queryClient, nutritionKeys } from '@/shared/services';

/**
 * Adds water. Not optimistic: the day's total is what the ring draws, and
 * guessing it here would put a number on screen the server may round
 * differently.
 */
export const useLogWater = () =>
    useMutation({
        mutationFn: ({ date, amountMl }: { date: string; amountMl: number }) =>
            NutritionApi.logWater(date, { amountMl }),
        onSuccess: (_void, variables) =>
            // Повертаємо проміс інвалідації навмисно: доки день не перечитано,
            // мутація лишається `isPending`, а кнопка — зайнятою. Інакше між
            // відповіддю сервера й свіжими даними є вікно, у якому рядок ще
            // виглядає невідміченим і його можна натиснути вдруге.
            queryClient.invalidateQueries({ queryKey: nutritionKeys.day(variables.date) }),
    });
