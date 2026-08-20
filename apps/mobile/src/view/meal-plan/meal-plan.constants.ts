import type { MealDish } from '@/shared/ui/widgets';

/** Colors a goal metric by how the day's plan relates to the target. */
export type PlanMetricTone = 'neutral' | 'progress' | 'positive' | 'negative';

export interface PlanMetric {
    current: number;
    target: number;
    /** Colors the 3pt progress bar. */
    tone: PlanMetricTone;
    /** Colors the value text — the design darkens it outside warning states. */
    valueTone?: PlanMetricTone;
}

/** Which advisory the goal card shows under the metrics (435:13917/14102/14287). */
export type PlanTip = 'low' | 'over' | 'near' | 'none';

export type PlanMealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlanMeal {
    key: PlanMealKey;
    /** Planned time, absent for «Перекус» (961:59371). */
    time?: string;
    dishes: MealDish[];
}

/** Colors the day tile in the week strip (961:59184). */
export type PlanDayStatus = 'ok' | 'over' | 'empty';

export interface PlanDay {
    key: string;
    /** «ПН» */
    weekday: string;
    /** «18» */
    date: string;
    status: PlanDayStatus;
    kcal: PlanMetric;
    protein: PlanMetric;
    fats: PlanMetric;
    carbs: PlanMetric;
    tip: PlanTip;
    meals: PlanMeal[];
}

const MEAL_TIMES: Record<PlanMealKey, string | undefined> = {
    breakfast: '11:00',
    lunch: '14:00',
    dinner: '19:00',
    snack: undefined,
};

const DISH_PANCAKES: MealDish = {
    id: 'pancakes',
    emoji: '🥞',
    name: 'Панкейки',
    calories: 320,
    macros: [
        { key: 'protein', value: 150 },
        { key: 'fats', value: 120 },
        { key: 'carbs', value: 23 },
    ],
};

const DISH_GREEK_SALAD: MealDish = {
    id: 'greek-salad',
    emoji: '🥗',
    name: 'Грецький салат',
    calories: 350,
    macros: [
        { key: 'protein', value: 150 },
        { key: 'fats', value: 0 },
        { key: 'carbs', value: 30 },
    ],
};

const DISH_SALMON: MealDish = {
    id: 'salmon',
    emoji: '🐟',
    name: 'Смажений лосось',
    calories: 389,
    macros: [
        { key: 'protein', value: 150 },
        { key: 'fats', value: 120 },
        { key: 'carbs', value: 30 },
    ],
};

const emptyMeals = (): PlanMeal[] =>
    (['breakfast', 'lunch', 'dinner', 'snack'] as const).map(key => ({ key, time: MEAL_TIMES[key], dishes: [] }));

const filledMeals = (): PlanMeal[] => [
    { key: 'breakfast', time: MEAL_TIMES.breakfast, dishes: [{ ...DISH_PANCAKES }] },
    { key: 'lunch', time: MEAL_TIMES.lunch, dishes: [{ ...DISH_GREEK_SALAD }, { ...DISH_SALMON }] },
    {
        key: 'dinner',
        time: MEAL_TIMES.dinner,
        dishes: [
            { ...DISH_GREEK_SALAD, id: 'greek-salad-2' },
            { ...DISH_SALMON, id: 'salmon-2' },
        ],
    },
    { key: 'snack', dishes: [] },
];

const metric = (current: number, target: number, tone: PlanMetricTone, valueTone?: PlanMetricTone): PlanMetric => ({
    current,
    target,
    tone,
    valueTone,
});

/**
 * A mock week of plans — day statuses and metric tones are precomputed the way
 * the system will send them; the coloring thresholds stay with the backend.
 */
// TODO: replace with GET /meal-plan?week= once the API ships.
export const MOCK_PLAN_WEEK: PlanDay[] = [
    {
        key: 'mon',
        weekday: 'ПН',
        date: '18',
        status: 'ok',
        kcal: metric(1400, 1800, 'progress'),
        protein: metric(96, 100, 'positive'),
        fats: metric(96, 100, 'positive'),
        carbs: metric(96, 100, 'positive'),
        tip: 'none',
        meals: filledMeals(),
    },
    {
        key: 'tue',
        weekday: 'ВТ',
        date: '19',
        status: 'ok',
        kcal: metric(1750, 1800, 'positive'),
        protein: metric(96, 100, 'positive'),
        fats: metric(96, 100, 'positive'),
        carbs: metric(96, 100, 'positive'),
        tip: 'near',
        meals: filledMeals(),
    },
    {
        key: 'wed',
        weekday: 'СР',
        date: '20',
        status: 'empty',
        kcal: metric(0, 1800, 'neutral'),
        protein: metric(0, 100, 'neutral'),
        fats: metric(0, 100, 'neutral'),
        carbs: metric(0, 100, 'neutral'),
        tip: 'none',
        meals: emptyMeals(),
    },
    {
        key: 'thu',
        weekday: 'ЧТ',
        date: '21',
        status: 'ok',
        kcal: metric(1100, 1800, 'progress'),
        protein: metric(34, 100, 'progress', 'progress'),
        fats: metric(34, 100, 'progress', 'progress'),
        carbs: metric(110, 100, 'negative', 'negative'),
        tip: 'low',
        meals: filledMeals(),
    },
    {
        key: 'fri',
        weekday: 'ПТ',
        date: '22',
        status: 'over',
        kcal: metric(2100, 1800, 'negative', 'negative'),
        protein: metric(34, 100, 'progress', 'progress'),
        fats: metric(34, 100, 'progress', 'progress'),
        carbs: metric(110, 100, 'negative', 'negative'),
        tip: 'over',
        meals: filledMeals(),
    },
    {
        key: 'sat',
        weekday: 'СБ',
        date: '23',
        status: 'empty',
        kcal: metric(0, 1800, 'neutral'),
        protein: metric(0, 100, 'neutral'),
        fats: metric(0, 100, 'neutral'),
        carbs: metric(0, 100, 'neutral'),
        tip: 'none',
        meals: emptyMeals(),
    },
    {
        key: 'sun',
        weekday: 'НД',
        date: '24',
        status: 'empty',
        kcal: metric(0, 1800, 'neutral'),
        protein: metric(0, 100, 'neutral'),
        fats: metric(0, 100, 'neutral'),
        carbs: metric(0, 100, 'neutral'),
        tip: 'none',
        meals: emptyMeals(),
    },
];

/** «18 - 24 Травня» in the header subtitle (961:59383). */
export const MOCK_PLAN_WEEK_RANGE = '18 - 24 Травня';

export interface CopyPlanDay {
    key: string;
    /** «Вівторок» */
    name: string;
    /** «19 Травня» */
    date: string;
}

/** Days the plan can be copied to, split by week tab (435:14472, 435:14675). */
// TODO: replace with the plan-copy targets from GET /meal-plan?week= once the API ships.
export const MOCK_COPY_THIS_WEEK: CopyPlanDay[] = [
    { key: 'tue', name: 'Вівторок', date: '19 Травня' },
    { key: 'wed', name: 'Середа', date: '20 Травня' },
    { key: 'thu', name: 'Четвер', date: '21 Травня' },
    { key: 'fri', name: 'П’ятниця', date: '22 Травня' },
    { key: 'sat', name: 'Субота', date: '23 Травня' },
    { key: 'sun', name: 'Неділя', date: '24 Травня' },
];

export const MOCK_COPY_NEXT_WEEK: CopyPlanDay[] = [
    { key: 'next-mon', name: 'Понеділок', date: '25 Травня' },
    { key: 'next-tue', name: 'Вівторок', date: '26 Травня' },
    { key: 'next-wed', name: 'Середа', date: '27 Травня' },
    { key: 'next-thu', name: 'Четвер', date: '28 Травня' },
    { key: 'next-fri', name: 'П’ятниця', date: '29 Травня' },
    { key: 'next-sat', name: 'Субота', date: '30 Травня' },
    { key: 'next-sun', name: 'Неділя', date: '31 Травня' },
];
