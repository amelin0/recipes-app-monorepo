import type { PlanDay as ApiPlanDay, PlanTotals } from '@/data';
import { fromIsoDay } from '@/shared/helpers';
import {
    PLAN_MEAL_KEYS,
    type PlanDay,
    type PlanDayStatus,
    type PlanMeal,
    type PlanMealKey,
    type PlanMetric,
    type PlanMetricTone,
    type PlanTip,
} from '@/state/domains/meal-plan';

/** Nothing in the payload says what a dish looks like, so one tile per slot. */
export const SLOT_EMOJI: Record<PlanMealKey, string> = {
    breakfast: '🥞',
    lunch: '🥗',
    dinner: '🍲',
    snack: '🍎',
};

/**
 * How close to the target a plan may sit and still read as «on target».
 *
 * The server already decides the day's own verdict; this only colours the
 * four metric bars inside the card, which it says nothing about.
 */
const NEAR_TARGET = 0.9;

const toneFor = (current: number, target: number): PlanMetricTone => {
    if (target <= 0) return 'neutral';
    const ratio = current / target;
    if (ratio > 1) return 'negative';
    if (ratio >= NEAR_TARGET) return 'positive';
    return 'progress';
};

const metric = (current: number, target: number): PlanMetric => {
    const tone = toneFor(current, target);
    return {
        current: Math.round(current),
        target: Math.round(target),
        tone,
        // Текст фарбуємо лише в попереджувальних станах — у дизайні решта
        // значень темні (961:59214).
        valueTone: tone === 'negative' ? 'negative' : undefined,
    };
};

const EMPTY_TOTALS: PlanTotals = { calories: 0, proteinG: 0, fatsG: 0, carbsG: 0 };

/**
 * The day tile's colour, from the server's own verdict.
 *
 * «Недобір» is orange at the owner's request; the design paints it green,
 * which cannot distinguish «трохи не добрав» from «все гаразд» — see
 * `handoff/mobile-ui-review.md` §2.2.
 */
const statusFor = (day: ApiPlanDay): PlanDayStatus => {
    if (day.outcome === null) return 'empty';
    if (day.outcome === 'over') return 'over';
    if (day.outcome === 'under') return 'under';
    return 'ok';
};

const tipFor = (day: ApiPlanDay): PlanTip => {
    if (day.outcome === 'over') return 'over';
    if (day.outcome === 'under') return 'low';
    if (day.outcome === 'on-target') return 'near';
    return 'none';
};

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('uk-UA', { weekday: 'short' });

/** Maps one API day onto the shape the plan screen's components render. */
export const toPlanDay = (day: ApiPlanDay, slotTimes: Record<PlanMealKey, string | undefined>): PlanDay => {
    const at = fromIsoDay(day.date);
    const goal = day.goal ?? EMPTY_TOTALS;

    const meals: PlanMeal[] = PLAN_MEAL_KEYS.map(slot => ({
        key: slot,
        time: slotTimes[slot],
        dishes: (day.slots.find(entry => entry.slot === slot)?.items ?? []).map(item => ({
            // The plan item, not the recipe — a delete targets this.
            id: item.id,
            emoji: SLOT_EMOJI[slot],
            photoUrl: item.recipe.photoUrl,
            name: item.recipe.title,
            calories: Math.round(item.recipe.perServing.calories),
            macros: [
                { key: 'protein' as const, value: Math.round(item.recipe.perServing.proteinG) },
                { key: 'fats' as const, value: Math.round(item.recipe.perServing.fatsG) },
                { key: 'carbs' as const, value: Math.round(item.recipe.perServing.carbsG) },
            ],
        })),
    }));

    return {
        key: day.date,
        // ICU gives «пн» with a trailing dot in some locales — the tile shows
        // two letters, upper-case, as the design does.
        weekday: WEEKDAY_FORMAT.format(at).replace('.', '').toUpperCase(),
        date: String(at.getDate()),
        status: statusFor(day),
        kcal: metric(day.planned.calories, goal.calories),
        protein: metric(day.planned.proteinG, goal.proteinG),
        fats: metric(day.planned.fatsG, goal.fatsG),
        carbs: metric(day.planned.carbsG, goal.carbsG),
        tip: tipFor(day),
        meals,
    };
};
