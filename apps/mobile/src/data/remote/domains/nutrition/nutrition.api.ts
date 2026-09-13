import { HttpService } from '@/shared/services';

import type {
    DailySlice,
    LogMealPayload,
    LogWaterPayload,
    MealLogEntry,
    NutritionGoal,
    PatchGoalPayload,
    SetStepsPayload,
    UpsertGoalPayload,
} from './nutrition.types';

const ENDPOINTS = {
    goal: '/nutrition/goal',
    day: (date: string) => `/nutrition/days/${date}`,
    meals: (date: string) => `/nutrition/days/${date}/meals`,
    meal: (date: string, id: string) => `/nutrition/days/${date}/meals/${id}`,
    water: (date: string) => `/nutrition/days/${date}/water`,
    waterEntry: (date: string, id: string) => `/nutrition/days/${date}/water/${id}`,
    steps: (date: string) => `/nutrition/days/${date}/steps`,
} as const;

export const NutritionApi = {
    /** `null` until the questionnaire has been completed. */
    getGoal: () => HttpService.get<NutritionGoal | null>(ENDPOINTS.goal),

    /** The whole goal at once — the screen saves as a unit. */
    upsertGoal: (payload: UpsertGoalPayload) => HttpService.put<NutritionGoal>(ENDPOINTS.goal, payload),

    /** One target, from the card that owns it. */
    patchGoal: (payload: PatchGoalPayload) => HttpService.patch<NutritionGoal>(ENDPOINTS.goal, payload),

    /** The whole tracking screen in one payload. `date` is `YYYY-MM-DD`, device-local. */
    getDay: (date: string) => HttpService.get<DailySlice>(ENDPOINTS.day(date)),

    logMeal: (date: string, payload: LogMealPayload) => HttpService.post<MealLogEntry>(ENDPOINTS.meals(date), payload),

    /** Also what un-marks a planned dish as eaten. */
    deleteMeal: (date: string, id: string) => HttpService.delete<void>(ENDPOINTS.meal(date, id)),

    logWater: (date: string, payload: LogWaterPayload) => HttpService.post<void>(ENDPOINTS.water(date), payload),

    /**
     * Undo one glass. The day payload reports only `consumed.waterMl` and no
     * entry ids, so nothing on the screen can name the id to pass here
     * (`handoff/mobile-ui-review.md` §4.4).
     */
    deleteWater: (date: string, id: string) => HttpService.delete<void>(ENDPOINTS.waterEntry(date, id)),

    setSteps: (date: string, payload: SetStepsPayload) => HttpService.put<void>(ENDPOINTS.steps(date), payload),
};
