import { useMutation, useQuery } from '@tanstack/react-query';

import { NutritionApi, type NutritionGoal, type PatchGoalPayload, type UpsertGoalPayload } from '@/data';
import { queryClient, nutritionKeys } from '@/shared/services';
import { useStore } from '@/state';

/** `null` until the questionnaire has been completed. */
export const useGetNutritionGoal = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: nutritionKeys.goal(),
        queryFn: () => NutritionApi.getGoal(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
};

const seedGoal = (goal: NutritionGoal) => {
    queryClient.setQueryData(nutritionKeys.goal(), goal);
    // Кожен день несе власну копію цілі, тож зміна норми робить застарілим
    // будь-який уже прочитаний день.
    queryClient.invalidateQueries({ queryKey: [nutritionKeys.day('')[0]] });
};

/** The whole goal at once — the goal screen saves as a unit. */
export const useUpsertNutritionGoal = () =>
    useMutation({
        mutationFn: (payload: UpsertGoalPayload) => NutritionApi.upsertGoal(payload),
        onSuccess: seedGoal,
    });

/**
 * One line of the goal. The progress cards each edit their own number, and
 * sending the whole goal to move one would overwrite the other five with
 * whatever that screen last read.
 */
export const usePatchNutritionGoal = () =>
    useMutation({
        mutationFn: (payload: PatchGoalPayload) => NutritionApi.patchGoal(payload),
        onSuccess: seedGoal,
    });
