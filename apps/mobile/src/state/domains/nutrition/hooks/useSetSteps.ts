import { useMutation } from '@tanstack/react-query';

import { NutritionApi } from '@/data';
import { queryClient, nutritionKeys } from '@/shared/services';

/** A running total, not an increment — a second report replaces the first. */
export const useSetSteps = () =>
    useMutation({
        mutationFn: ({ date, steps }: { date: string; steps: number }) => NutritionApi.setSteps(date, { steps }),
        onSuccess: (_void, variables) => {
            queryClient.invalidateQueries({ queryKey: nutritionKeys.day(variables.date) });
        },
    });
