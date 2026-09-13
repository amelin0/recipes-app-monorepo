import { HttpService } from '@/shared/services';

import type { AddPlanItemPayload, CopyPlanDayPayload, PlanDay, PlanItem } from './meal-plan.types';

const ENDPOINTS = {
    plan: '/meal-plan',
    day: (date: string) => `/meal-plan/days/${date}`,
    items: (date: string) => `/meal-plan/days/${date}/items`,
    item: (date: string, itemId: string) => `/meal-plan/days/${date}/items/${itemId}`,
    copy: (date: string) => `/meal-plan/days/${date}/copy`,
} as const;

export const MealPlanApi = {
    /** A closed range of days, inclusive. Every day in it comes back, empty ones included. */
    getPlan: (from: string, to: string) => HttpService.get<PlanDay[]>(ENDPOINTS.plan, { params: { from, to } }),

    addItem: (date: string, payload: AddPlanItemPayload) => HttpService.post<PlanItem>(ENDPOINTS.items(date), payload),

    removeItem: (date: string, itemId: string) => HttpService.delete<void>(ENDPOINTS.item(date, itemId)),

    /** Empties the day. */
    clearDay: (date: string) => HttpService.delete<void>(ENDPOINTS.day(date)),

    /** Copies this day's dishes onto the given days. */
    copyDay: (date: string, payload: CopyPlanDayPayload) => HttpService.post<void>(ENDPOINTS.copy(date), payload),
};
