import { useQuery } from '@tanstack/react-query';

import { NutritionApi } from '@/data';
import { nutritionKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * One day of tracking: goal, what was consumed, the meals behind it, steps.
 *
 * `date` is the device's own calendar day, not UTC — a meal eaten at 01:00
 * belongs to the night before for the person eating it, and only the device
 * knows which day that was.
 */
export const useGetDay = (date: string) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: nutritionKeys.day(date),
        queryFn: () => NutritionApi.getDay(date),
        enabled: isAuthenticated && Boolean(date),
        // Короткий, але не нульовий: екран часто перемальовується при поверненні
        // з шитів, і кожне таке повернення не має коштувати запиту.
        staleTime: 30_000,
    });
};
